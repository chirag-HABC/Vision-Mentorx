const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  // Fake AI response (replace with OpenAI later)
  const reply = "That's a good answer. Tell me more.";

  res.json({ reply });
});

app.listen(5000, () => console.log("Server running on port 5000"));