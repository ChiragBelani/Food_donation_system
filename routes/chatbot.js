const express = require("express");
const router = express.Router();
const { processMessage } = require("../utils/chatbotLogic");

router.post("/chatbot/message", async (req, res) => {
    try {
        const { message } = req.body;
        const user = req.user || null; // Get logged in user if available

        // Simulate a small delay for "thinking" effect (optional, but good for UX)
        // Note: Gemini API call takes time, so we might not need extra delay, but let's keep a small one or remove it.
        // Let's remove the artificial delay since API call is async enough.

        try {
            const reply = await processMessage(message, user);
            res.json({ success: true, reply });
        } catch (err) {
            console.error("Chatbot Logic Error:", err);
            res.json({ success: false, message: "I'm having a bit of trouble thinking right now." });
        }

    } catch (error) {
        console.error("Chatbot Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

module.exports = router;
