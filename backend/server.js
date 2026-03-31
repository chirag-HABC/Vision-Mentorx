const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Simple conversation database
const conversationResponses = {
  greeting: ["Hello! Great to meet you too!", "Hi there! How can I help you today?", "Hey! Excited to chat with you!"],
  question: [
    "That's a great question! Let me think about that...",
    "Interesting! Here's what I know about that...",
    "That's something I can definitely help with!",
  ],
  appreciation: [
    "Thank you! I'm here to help anytime.",
    "You're welcome! Happy to assist.",
    "My pleasure! Anything else you'd like to know?",
  ],
  unclear: [
    "I'm not quite sure what you mean. Could you rephrase that?",
    "Could you tell me a bit more about that?",
    "I want to make sure I understand. Can you explain that differently?",
  ],
};

// Generate contextual responses
function generateResponse(userMessage) {
  const msg = userMessage.toLowerCase().trim();

  // Greeting detection
  if (/^(hello|hi|hey|greetings|good morning|good afternoon|good evening)/.test(msg)) {
    return conversationResponses.greeting[Math.floor(Math.random() * conversationResponses.greeting.length)];
  }

  // Question detection (contains question mark or question words)
  if (/\?|what|how|why|when|where|who|which/.test(msg)) {
    // Smart responses based on keywords
    if (/how are you|how do you feel/.test(msg)) {
      return "I'm doing great, thank you for asking! I'm here and ready to have a meaningful conversation with you.";
    }
    if (/what is your name|who are you/.test(msg)) {
      return "I'm your AI Mentor Robot! My purpose is to help you learn, answer your questions, and have intelligent conversations. What would you like to know?";
    }
    if (/where|location|place/.test(msg)) {
      return "I exist in the digital realm! I'm here to interact with you through this interface. Is there something specific I can help you with?";
    }
    if (/why|reason|because/.test(msg)) {
      return "That's a thoughtful question. The reason is that understanding the 'why' behind things helps us learn better and make smarter decisions.";
    }
    if (/time|date/.test(msg)) {
      const now = new Date();
      return `Right now it's ${now.toLocaleTimeString()}. Is there something time-sensitive you'd like to discuss?`;
    }
    
    // Generic question response
    return conversationResponses.question[Math.floor(Math.random() * conversationResponses.question.length)];
  }

  // Thanks/appreciation detection
  if (/thank|thanks|appreciate|grateful/.test(msg)) {
    return conversationResponses.appreciation[Math.floor(Math.random() * conversationResponses.appreciation.length)];
  }

  // Affirmation detection
  if (/yes|yeah|agreed|correct|right|absolutely|exactly/.test(msg)) {
    return "Great! I'm glad we're on the same page. What would you like to explore next?";
  }

  // Negation detection
  if (/no|nope|disagree|wrong|incorrect|false/.test(msg)) {
    return "I see. Let's look at this from a different angle. What's your perspective on this?";
  }

  // Learning intent
  if (/learn|teach|education|school|study|understand|explain/.test(msg)) {
    return "Excellent! I love helping people learn. Would you like me to explain a specific topic, or shall we explore something together?";
  }

  // Compliment
  if (/good|great|awesome|amazing|excellent|smart|nice|cool/.test(msg)) {
    return "Thank you! I appreciate that. Let's keep the momentum going and explore more interesting topics!";
  }

  // Default response - encourage more conversation
  return `That's interesting! Tell me more about that. What specifically would you like to discuss or learn?`;
}

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    
    if (!userMessage || userMessage.trim() === "") {
      return res.json({ reply: "I didn't catch that. Could you say something?" });
    }

    const reply = generateResponse(userMessage);
    
    console.log(`📨 User: ${userMessage}`);
    console.log(`🤖 Bot: ${reply}`);

    res.json({ reply });
  } catch (error) {
    console.error("Error:", error);
    res.json({ reply: "Oops! Something went wrong. Please try again." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 AI Mentor Bot Server running on http://localhost:${PORT}`);
});