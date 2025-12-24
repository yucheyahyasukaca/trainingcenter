import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();

        // Log the API key status (first 4 chars only for security)
        const key = process.env.GEMINI_API_KEY;
        console.log("Chat API Request received.");
        console.log("API Key configured:", !!key);
        if (key) console.log("API Key prefix:", key.substring(0, 4) + "...");

        if (!key) {
            console.error("GEMINI_API_KEY is missing in environment variables.");
            return NextResponse.json(
                { error: "API Key not configured. Please add GEMINI_API_KEY to .env.local" },
                { status: 500 }
            );
        }

        // Load Knowledge Base
        const knowledgePath = path.join(
            process.cwd(),
            "lib",
            "knowledge",
            "tech-support.md"
        );
        let knowledgeBase = "";
        try {
            knowledgeBase = fs.readFileSync(knowledgePath, "utf8");
            console.log("Knowledge base loaded, length:", knowledgeBase.length);
        } catch (error) {
            console.error("Error reading knowledge base:", error);
            knowledgeBase = "Knowledge base not found.";
        }

        // Construct Prompt
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const systemInstruction = `
      Anda adalah "Garuda AI Assistant", asisten dukungan teknis untuk platform Garuda Academy.
      Tugas Anda adalah membantu pengguna dengan masalah teknis dan pertanyaan seputar platform.
      
      Gunakan "Knowledge Base" berikut sebagai sumber utama informasi Anda:
      ---
      ${knowledgeBase}
      ---
      
      Panduan:
      1. Jawablah dengan ramah, profesional, dan ringkas.
      2. Gunakan Bahasa Indonesia yang baik dan benar.
      3. Jika jawaban ada di Knowledge Base, gunakan informasi tersebut.
      4. Jika jawaban TIDAK ada di Knowledge Base, katakan dengan sopan bahwa Anda tidak memiliki informasinya dan sarankan menghubungi support@garuda-21.com. JANGAN MENGARANG JAWABAN TEKNIS.
      5. Anda boleh menjawab sapaan umum (Halo, Selamat Pagi) dengan wajar.
      6. Format jawaban Anda bisa menggunakan Markdown (bold, list, dll) agar mudah dibaca.
    `;

        // Construct Chat History for Gemini
        // Validating history: Gemini requires the first message to be from 'user'.
        // Our frontend initializes with a 'model' greeting, so we must filter that out.
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
        });

        // Send message with system instruction context via a specific prompt structure or just relying on the preamble
        // Gemini-pro doesn't have a strict "system" role in the same way as GPT-4 in the API yet (it varies),
        // so standard practice is to include it in the first message or use the systemInstruction params if available in the SDK version.
        // The current SDK supports systemInstruction in model config, let's try to verify if we can pass it.
        // Since I can't easily verify SDK version features runtime, I will prepend the instruction to the last message transparently
        // OR just treat the first message as a setup if history is empty.

        // Better approach: wrap the user message with the system instruction if it's a fresh chat,
        // but since we are stateless, we have to rely on the history passed.
        // We will assume the `systemInstruction` is implicitly understood if we include it in the context of the prompt 
        // or we can use the `systemInstruction` property if the model is initialized with one (v1.2+ of SDK).

        // Let's try the safest "context injection" approach for now:
        // We'll create a transient model instance with the instruction if possible, or just prepend context.

        console.log("Sending message to Gemini...");
        const result = await chat.sendMessage(`${systemInstruction}\n\nUser Question: ${message}`);
        const response = result.response;
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
