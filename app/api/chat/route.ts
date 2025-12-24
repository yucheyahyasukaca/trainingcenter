import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Define Tools
const resetPasswordTool = {
    functionDeclarations: [
        {
            name: "resetPassword",
            description: "Send a password reset email to a user.",
            parameters: {
                type: "OBJECT",
                properties: {
                    email: {
                        type: "STRING",
                        description: "The email address of the user who needs to reset their password.",
                    },
                },
                required: ["email"],
            },
        },
    ],
};

const functions: any = {
    resetPassword: async ({ email }: { email: string }) => {
        console.log(`[Tool] Resetting password for: ${email}`);
        try {
            // Instead of calling Supabase directly (which fails due to SMTP config),
            // we call the existing local API endpoint that handles manual reset + custom email sending.
            const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add a secret header or rely on the internal nature if strictly server-side, 
                    // but here we are calling a public endpoint from server-side.
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("[Tool Error] API:", data);
                return { success: false, error: data.error || "Failed to reset password via API" };
            }

            return { success: true, message: data.message || `Password reset email sent to ${email}` };

        } catch (e: any) {
            console.error("[Tool Error] Exception:", e);
            return { success: false, error: e.message || "Internal server error" };
        }
    },
};

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();

        // Log the API key status (first 4 chars only for security)
        const key = process.env.GEMINI_API_KEY;
        console.log("Chat API Request received.");
        if (!key) {
            console.error("GEMINI_API_KEY is missing in environment variables.");
            return NextResponse.json(
                { error: "API Key not configured. Please add GEMINI_API_KEY to .env.local" },
                { status: 500 }
            );
        }

        // Load Knowledge Base
        const knowledgePath = path.join(process.cwd(), "lib", "knowledge", "tech-support.md");
        let knowledgeBase = "";
        try {
            knowledgeBase = fs.readFileSync(knowledgePath, "utf8");
        } catch (error) {
            console.error("Error reading knowledge base:", error);
            knowledgeBase = "Knowledge base not found.";
        }

        // Construct Prompt
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            tools: [resetPasswordTool],
        });

        const systemInstruction = `
      Anda adalah "Garuda AI Assistant", asisten dukungan teknis untuk platform Garuda Academy.
      
      Tugas Utama Anda:
      1. Menjawab pertanyaan pengguna berdasarkan "Knowledge Base" di bawah.
      2. Membantu reset password pengguna jika diminta (menggunakan tool).
      
      Knowledge Base:
      ---
      ${knowledgeBase}
      ---
      
      Aturan Penting:
      - JANGAN PERNAH bilang Anda "hanya bisa mereset password". Anda punya pengetahuan luas tentang platform dari Knowledge Base di atas.
      - Jika pengguna bertanya tentang "Poin", "Referral", "Hadiah", atau "Perjalanan Hebat", WAJIB gunakan informasi dari bagian "Perjalanan HEBAT" di Knowledge Base.
      - Jika jawaban ada di Knowledge Base, sampaikan dengan bahasa Anda sendiri yang ramah.
      - Jika jawaban TIDAK ada, baru sarankan hubungi support.
      
      Contoh:
      - User: "Poin saya kok 0?" -> Jawab: Jelaskan aturan Trainer di Perjalanan Hebat.
      - User: "Reset password dong" -> Action: Tanya email, lalu panggil tool resetPassword.
    `;

        // Construct Chat History for Gemini
        const validHistory = history.filter((msg: any, index: number) => {
            // Skip the first message if it is from 'model' (the greeting)
            if (index === 0 && msg.role === 'model') return false;
            return true;
        });

        const chat = model.startChat({
            history: validHistory.map((msg: any) => ({
                role: msg.role === "user" ? "user" : "model",
                parts: [{ text: msg.content }],
            })),
            generationConfig: {
                maxOutputTokens: 500,
            },
            systemInstruction: {
                parts: [{ text: systemInstruction }],
                role: "model"
            }
        });

        console.log("Sending message to Gemini...");
        // Prepend system instruction to the first message effectively if history is empty
        // OR use systemInstruction property if supported by the model/SDK (Attempting property above)
        // But as fallback, we also inject it into the prompt if history is empty.

        let finalMessage = message;
        if (validHistory.length === 0) {
            // Force context in first message to be safe
            finalMessage = `${systemInstruction}\n\nUser Question: ${message}`;
        }

        const result = await chat.sendMessage(finalMessage);
        const response = result.response;

        // Check for function calls
        const candidates = response.candidates;
        if (candidates && candidates[0].content.parts.length > 0) {
            const firstPart = candidates[0].content.parts[0];

            // Handle Function Call
            if (firstPart.functionCall) {
                const functionCall = firstPart.functionCall;
                const functionName = functionCall.name;
                const functionArgs = functionCall.args;

                console.log(`[Gemini] Triggered Function Call: ${functionName}`, functionArgs);

                if (functions[functionName]) {
                    const functionResponse = await functions[functionName](functionArgs);
                    console.log(`[Gemini] Function Execution Result:`, functionResponse);

                    // Send result back to model to generate text response
                    const result2 = await chat.sendMessage([{
                        functionResponse: {
                            name: functionName,
                            response: {
                                content: functionResponse
                            }
                        }
                    }]);

                    return NextResponse.json({ reply: result2.response.text() });
                }
            }
        }

        const text = response.text();
        console.log("Received response from Gemini.");

        return NextResponse.json({ reply: text });
    } catch (error: any) {
        console.error("Detailed Error in chat API:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process request" },
            { status: 500 }
        );
    }
}
