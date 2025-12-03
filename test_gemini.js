const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const modelsToTry = [
        "gemini-1.5-flash",
        "gemini-pro",
        "gemini-1.0-pro",
        "gemini-1.5-pro-latest"
    ];

    for (const modelName of modelsToTry) {
        console.log(`\n--- Testing ${modelName} ---`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            console.log(`✅ SUCCESS with ${modelName}`);
            console.log("Response:", result.response.text());
            return; // Stop after first success
        } catch (error) {
            console.error(`❌ FAILED ${modelName}:`, error.message);
        }
    }
}

listModels();
