const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// Simple .env parser
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), ".env.local");
        if (!fs.existsSync(envPath)) return {};
        const envConfig = fs.readFileSync(envPath, "utf8");
        const env = {};
        envConfig.split("\n").forEach(line => {
            const [key, value] = line.split("=");
            if (key && value) env[key.trim()] = value.trim();
        });
        return env;
    } catch (e) {
        return {};
    }
}

async function listModels() {
    const env = loadEnv();
    const apiKey = env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("No API KEY found in .env.local");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Hack to access model listing if not exposed directly in SDK, 
    // but standard SDK usually doesn't have listModels directly on the main class in older versions.
    // However, recent versions do.
    // Use the generic request mechanism if needed, but let's try to assume newer SDK.
    // actually, typically it's not on the client but on a model manager or similar.
    // Let's try to use the response error from a bad model to list models if I can't list them.
    // OR just try a known working set.

    // Actually, let's just try to hit the API using fetch to list models.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        console.log("Fetching models...");
        // native fetch is available in node 18+
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name} (${m.displayName})`);
                }
            });
        } else {
            console.error("Failed to list models:", data);
        }
    } catch (error) {
        console.error("Error fetching models:", error);
    }
}

listModels();
