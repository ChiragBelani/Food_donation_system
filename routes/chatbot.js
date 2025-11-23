const express = require("express");
const router = express.Router();
const { processMessage } = require("../utils/chatbotLogic");

router.post("/chatbot/message", (req, res) => {
    try {
        const { message } = req.body;
        const user = req.user || null; // Get logged in user if available

        // Simulate a small delay for "thinking" effect
        setTimeout(() => {
            try {
                const reply = processMessage(message, user);
                res.json({ success: true, reply });
            } catch (err) {
                console.error("Chatbot Logic Error:", err);
                res.json({ success: false, message: "I'm having a bit of trouble thinking right now." });
            }
        }, 500);

    } catch (error) {
        console.error("Chatbot Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

module.exports = router;
