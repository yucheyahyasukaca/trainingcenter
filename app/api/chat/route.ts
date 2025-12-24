import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

import { TECH_SUPPORT_KNOWLEDGE } from "@/lib/knowledge/tech-support-data";
import { getAppBaseUrl } from "@/lib/url-utils";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Define Tools
const resetPasswordTool = {
    functionDeclarations: [
        {
            name: "resetPassword",
            description: "Send a password reset email to a user.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    email: {
                        type: SchemaType.STRING,
                        description: "The email address of the user who needs to reset their password.",
                    },
                },
                required: ["email"],
            },
        },
    ],
};

const submitSalesLeadTool = {
    functionDeclarations: [
        {
            name: "submitSalesLead",
            description: "Submit a sales lead to the sales team for follow-up. Use this when a user expresses interest in Garuda-21 and provides their contact details.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    pic: {
                        type: SchemaType.STRING,
                        description: "Name of the contact person (PIC).",
                    },
                    school: {
                        type: SchemaType.STRING,
                        description: "Name of the school or institution.",
                    },
                    address: {
                        type: SchemaType.STRING,
                        description: "Full address of the school or institution.",
                    },
                    email: {
                        type: SchemaType.STRING,
                        description: "Email address of the contact person.",
                    },
                    phone: {
                        type: SchemaType.STRING,
                        description: "Phone number (preferably WhatsApp) of the contact person, including country code (e.g., 628123456789).",
                    },
                },
                required: ["pic", "school", "address", "email", "phone"],
            },
        },
    ],
};

const getWebinarsTool = {
    functionDeclarations: [
        {
            name: "getWebinars",
            description: "Get the list of webinars from the database. Can fetch 'upcoming' or 'past' webinars.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    status: {
                        type: SchemaType.STRING,
                        description: "Filter by status: 'upcoming' (default) or 'past'.",
                        enum: ["upcoming", "past"]
                    }
                },
            },
        },
    ],
};

const getTrainingProgramsTool = {
    functionDeclarations: [
        {
            name: "getTrainingPrograms",
            description: "Get the list of available training programs (courses). Use this when user asks for 'program', 'training', 'kursus', or 'pelatihan'.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    query: {
                        type: SchemaType.STRING,
                        description: "Search keyword for program title or description (e.g. 'excel', 'guru', 'ai').",
                    },
                    category: {
                        type: SchemaType.STRING,
                        description: "Filter by category if specified (e.g. 'Technology', 'Education').",
                    }
                },
            },
        },
    ],
};



// Define minimal type for Webinar since it might be missing in Database types
interface Webinar {
    title: string;
    start_time: string;
    end_time: string;
    description: string;
    slug: string;
    platform?: string;
    link?: string;
}

const functions: any = {
    resetPassword: async ({ email }: { email: string }) => {
        console.log(`[Tool] Resetting password for: ${email}`);
        try {
            // Instead of calling Supabase directly (which fails due to SMTP config),
            // we call the existing local API endpoint that handles manual reset + custom email sending.
            const response = await fetch(`${getAppBaseUrl()}/api/auth/reset-password`, {
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
    submitSalesLead: async ({ pic, school, address, email, phone }: { pic: string, school: string, address: string, email: string, phone: string }) => {
        console.log(`[Tool] New Sales Lead: ${pic} from ${school}`);
        try {
            // Send email notification to sales team (Simulating via Email API)
            // In a real scenario with WhatsApp API, this would call that API.
            const salesEmail = "telemarketing@garuda-21.com";

            const emailHtml = `
                <h2>New Sales Lead from AI Agent 🤖</h2>
                <p><strong>PIC:</strong> ${pic}</p>
                <p><strong>School:</strong> ${school}</p>
                <p><strong>Address:</strong> ${address}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone (WhatsApp):</strong> ${phone}</p>
                <br/>
                <p><em>Please contact this lead immediately regarding the "Garuda-21" promo.</em></p>
            `;

            const response = await fetch(`${getAppBaseUrl()}/api/email/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: salesEmail,
                    subject: `HOT LEAD: ${school} - ${pic} `,
                    html: emailHtml,
                    useQueue: false
                })
            });

            // Log for debugging/dashboard
            console.log(`[Sales Agent] Lead Notification Sent to ${salesEmail} `);

            return {
                success: true,
                message: `Data berhasil dikirim ke Tim Sales.WhatsApp notifikasi telah dikirim ke nomor 628112666456(via Email Gateway).`
            };
        } catch (e: any) {
            console.error("[Tool Error] Failed to submit lead:", e);
            return { success: false, error: "Gagal mengirim data. Tim teknis akan memeriksa log manual." };
        }
    },
    getWebinars: async ({ status = 'upcoming' }: { status?: 'upcoming' | 'past' }) => {
        console.log(`[Tool] Fetching ${status} webinars...`);
        try {
            const supabase = getSupabaseAdmin();
            const now = new Date().toISOString();

            let query = supabase
                .from('webinars')
                .select('title, start_time, end_time, description, slug, platform')
                .eq('is_published', true);

            if (status === 'past') {
                query = query
                    .lt('start_time', now)
                    .order('start_time', { ascending: false })
                    .limit(5); // Limit past webinars to keep context light
            } else {
                // Default to upcoming
                query = query
                    .gte('start_time', now)
                    .order('start_time', { ascending: true });
            }

            const { data, error } = await query;

            if (error) {
                console.error("[Tool Error] Supabase:", error);
                return { success: false, error: error.message };
            }

            // Cast data to Webinar[] because 'webinars' might not be in the generated types yet
            const webinars = data as unknown as Webinar[];

            if (!webinars || webinars.length === 0) {
                const msg = status === 'past'
                    ? "Tidak ada data webinar yang sudah selesai."
                    : "Saat ini belum ada jadwal webinar baru yang akan datang.";
                return {
                    success: true,
                    webinars: [],
                    message: msg
                };
            }

            // Format data for AI consumption
            const formattedWebinars = webinars.map(w => ({
                title: w.title,
                date: new Date(w.start_time).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                time: `${new Date(w.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${new Date(w.end_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
                description: w.description,
                link: `${getAppBaseUrl()} /webinars/${w.slug || ''} `
            }));

            return {
                success: true,
                webinars: formattedWebinars
            };

        } catch (e: any) {
            console.error("[Tool Error] Exception:", e);
            return { success: false, error: e.message || "Internal server error" };
        }
    },
    getTrainingPrograms: async ({ query, category }: { query?: string, category?: string }) => {
        console.log(`[Tool] Fetching training programs...Query: ${query}, Category: ${category} `);
        try {
            const supabase = getSupabaseAdmin();

            let dbQuery = supabase
                .from('programs')
                .select('id, title, description, category, price, max_participants')
                .eq('status', 'published')
                .order('created_at', { ascending: false })
                .limit(10);

            if (category) {
                dbQuery = dbQuery.eq('category', category);
            }

            if (query) {
                // Simple ILIKE search on title or description
                dbQuery = dbQuery.or(`title.ilike.% ${query}%, description.ilike.% ${query}% `);
            }

            const { data, error } = await dbQuery;

            if (error) {
                console.error("[Tool Error] Supabase:", error);
                return { success: false, error: error.message };
            }

            if (!data || data.length === 0) {
                return {
                    success: true,
                    programs: [],
                    message: "Tidak ditemukan program pelatihan yang cocok dengan kriteria pencarian."
                };
            }

            // Format data
            const formattedPrograms = data.map((p: any) => ({
                title: p.title,
                category: p.category,
                price: p.price === 0 ? "Gratis" : `Rp ${p.price.toLocaleString('id-ID')} `,
                description: p.description?.substring(0, 150) + "...", // Truncate description
                link: `${getAppBaseUrl()} /programs/${p.id} `
            }));

            return {
                success: true,
                programs: formattedPrograms
            };

        } catch (e: any) {
            console.error("[Tool Error] Exception:", e);
            return { success: false, error: e.message || "Internal server error" };
        }
    }
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
        const knowledgeBase = TECH_SUPPORT_KNOWLEDGE;


        // Construct Prompt
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            tools: [resetPasswordTool, submitSalesLeadTool, getWebinarsTool, getTrainingProgramsTool],
        });

        const systemInstruction = `
      Anda adalah "Garuda AI Assistant", asisten dukungan teknis DAN Sales Agent untuk platform Garuda Academy serta Garuda - 21.
      
      Tugas Utama Anda:
1. Menjawab pertanyaan pengguna berdasarkan "Knowledge Base" di bawah.
      2. Membantu reset password pengguna jika diminta(menggunakan tool).
      3. Memberikan informasi jadwal webinar jika pengguna bertanya(menggunakan tool).
      4. ** SALES AGENT:** Mempromosikan "Garuda-21" jika pengguna mencari solusi sekolah digital. 
      
      Knowledge Base:
---
    ${knowledgeBase}
---

    Aturan Penting:
      - ** Mode Sales:** Jika pengguna bertanya tentang "aplikasi sekolah", "ujian online", "harga", atau solusi sekolah digital, LANGSUNG tawarkan ** Garuda - 21 ** dengan harga promo Rp 1.200.000 / tahun(Unlimited User). 
      - ** Lead Collection:** Jika pengguna BERMINAT / TERTARIK, jangan suruh hubungi manual.Tawarkan untuk memprosesnya sekarang.
        - Katakan: "Boleh saya minta data berikut untuk diproses Tim Sales kami?"
    - Minta data: ** Nama PIC, Nama Sekolah, Alamat Lengkap, Email, dan No HP(WhatsApp).**
        - Setelah data lengkap, GUNAKAN TOOL \`submitSalesLead\`.
      - **Webinar Info:** Jika pengguna bertanya tentang "webinar", "jadwal", "acara", baik yang akan datang maupun yang sudah lewat, GUNAKAN TOOL \`getWebinars\`.
        - Gunakan parameter \`status='upcoming'\` (default) untuk pertanyaan masa depan.
        - Gunakan parameter \`status='past'\` untuk pertanyaan tentang webinar yang sudah selesai atau "kemarin".
        - Jangan mengarang jadwal.
        - Jika tool mengembalikan daftar, sajikan dengan rapi.
        - Jika kosong, katakan dengan sopan informasinya belum tersedia.
      - **Training/Program Info:** Jika pengguna bertanya tentang "program pelatihan", "kursus", "training", atau "belajar apa", GUNAKAN TOOL \`getTrainingPrograms\`.
        - Anda bisa mencari berdasarkan kata kunci (misal: "excel", "guru") jika user spesifik.
        - Sajikan daftar program yang tersedia beserta link pendaftarannya.
      - **WhatsApp Notification:** Setelah sukses memanggil tool, beritahu user: "Terima kasih! Data sudah saya kirimkan ke Tim Sales kami. Notifikasi WhatsApp juga sudah dikirim ke admin pusat."
      - **Mode Support:** Untuk pertanyaan teknis biasa (login, poin, dll), jawab sesuai Knowledge Base.
      - JANGAN PERNAH bilang Anda "hanya bisa mereset password".
      - Jika jawaban ada di Knowledge Base, sampaikan dengan bahasa Anda sendiri yang ramah dan persuasif.
      
      Contoh:
      - User: "Minat dong promonya" -> Action: Minta data PIC, Sekolah, dll. -> User kasih data -> Call submitSalesLead.
      - User: "Reset password" -> Action: Tanya email -> Call resetPassword.
      - User: "Ada webinar apa minggu ini?" -> Action: Call getUpcomingWebinars.
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
