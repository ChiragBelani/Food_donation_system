const OpenAI = require("openai");
require("dotenv").config();

// Initialize OpenAI (configured for Groq)
const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

const processMessage = async (message, user) => {
    if (!message) return "I didn't catch that. Could you say it again?";
    const msg = message.toLowerCase();

    // --- Helper for personalized greeting ---
    const getUserName = () => user ? user.firstName : "friend";
    const getUserRole = () => user ? user.role : "guest";

    // --- 1. Rule-Based Triggers (Fast & Specific) ---

    // Donation Specifics (Hardcoded for accuracy)
    if (msg.includes("donate") || msg.includes("give food")) {
        if (user) {
            if (user.role === 'donor') {
                return "Great! 🍲 Go to your **Dashboard** and click the **Donate Food** button to create a new request.";
            } else if (user.role === 'agent') {
                return "As an Agent, your role is to collect food. If you want to donate, you'll need to create a separate Donor account.";
            } else if (user.role === 'admin') {
                return "Admins manage the system. To donate, please use a Donor account.";
            }
        }
        return "To donate, you first need to **Sign Up** as a Donor. It only takes a minute! Click 'Sign Up' in the top right.";
    }

    // Agent Specifics
    if (msg.includes("agent") || msg.includes("volunteer")) {
        if (user && user.role === 'agent') {
            return "Thanks for being a hero! 🦸‍♂️ Check your **Dashboard** for 'Pending Collections' to see donations assigned to you.";
        }
        return "Agents are our superheroes! 🦸‍♀️ They pick up food from donors and distribute it to the needy. Want to join? Sign up and choose 'Agent' as your role.";
    }

    // --- 2. Groq AI Fallback (Intelligent & Context Aware) ---
    try {
        if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === "YOUR_API_KEY_HERE") {
            return "I'm currently undergoing maintenance (API Key missing). Please ask about 'donating' or 'agents' in the meantime!";
        }

        const systemContext = `
            You are FoodBot, the intelligent assistant for the "FoodShare" food donation platform.
            
            Your Persona: Friendly, helpful, empathetic, and professional. Use emojis occasionally.
            
            About FoodShare:
            - Mission: Zero Hunger, Zero Waste.
            - We connect Donors (who have leftover food) with Agents (volunteers who pick it up) to feed the needy.
            - We operate 24/7.
            
            User Context:
            - Name: ${getUserName()}
            - Role: ${getUserRole()} (guest, donor, agent, admin)
            
            Guidelines:
            - Keep answers concise (under 3 sentences if possible).
            - If asked about technical issues (password, bugs), direct them to support@foodshare.com.
            - If asked about "how to donate", explain: Sign Up -> Dashboard -> Donate Food.
            - If asked about "how to be an agent", explain: Sign Up -> Select Agent Role.
            - Do NOT make up facts. If unsure, say you don't know.
        `;

        const completion = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemContext },
                { role: "user", content: message }
            ],
        });

        return completion.choices[0].message.content;

    } catch (error) {
        console.error("OpenAI API Error:", error);
        return "I'm having trouble connecting to my brain right now. 🧠 Please try again later or ask simple questions about donating.";
    }
};

module.exports = { processMessage };
