const processMessage = (message, user) => {
    if (!message) return "I didn't catch that. Could you say it again?";
    const msg = message.toLowerCase();
    let response = "";

    // Greetings
    if (msg.match(/\b(hi|hello|hey|greetings)\b/)) {
        if (user) {
            return `Hello ${user.firstName}! How can I help you with your food donation today?`;
        }
        return "Hello! Welcome to FoodShare. How can I help you today?";
    }

    // Donation related
    if (msg.includes("donate") || msg.includes("donation") || msg.includes("give food")) {
        if (user) {
            if (user.role === 'donor') {
                return "That's great! You can start a new donation by clicking the 'Donate Food' button in your dashboard or typing 'new donation'.";
            } else if (user.role === 'agent') {
                return "As an agent, you can view pending collections in your dashboard.";
            } else {
                return "Please login as a donor to donate food.";
            }
        }
        return "To donate food, you'll need to sign up as a Donor first. Would you like me to guide you to the signup page?";
    }

    // How it works
    if (msg.includes("how") && (msg.includes("work") || msg.includes("process"))) {
        return "It's simple! \n1. Donors post leftover food details. \n2. We verify and accept the request. \n3. An agent picks up the food and distributes it to the needy.";
    }

    // Signup/Login
    if (msg.includes("sign up") || msg.includes("register") || msg.includes("create account")) {
        return "You can sign up by clicking the 'Sign Up' button in the top right corner. We have roles for Donors and Agents.";
    }

    if (msg.includes("login") || msg.includes("sign in")) {
        return "Already have an account? Click 'Login' in the top right corner to access your dashboard.";
    }

    // Contact
    if (msg.includes("contact") || msg.includes("support") || msg.includes("help")) {
        return "You can reach our support team via the 'Contact Us' page, or email us at support@foodshare.com.";
    }

    // Default
    return "I'm not sure I understand. You can ask me about donating food, how the system works, or how to sign up.";
};

module.exports = { processMessage };
