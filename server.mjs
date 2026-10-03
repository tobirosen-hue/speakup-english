import express from "express";
import OpenAI from "openai";

const app = express();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());

// Erlaubt unserer GitHub-Pages-Website, den Server aufzurufen
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.get("/", (req, res) => {
  res.send("SpeakUp OpenAI Server is live! 🚀");
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "No message provided."
      });
    }

    const previousMessages = Array.isArray(history)
      ? history.slice(-10).map(item => ({
          role: item.role === "assistant" ? "assistant" : "user",
          content: String(item.content || "")
        }))
      : [];

    const response = await client.responses.create({
      model: "gpt-6-luna",
      instructions: `
You are the friendly English speaking partner in the SpeakUp learning app.

Speak simple, natural English suitable for a teenage English learner.
Keep your answers fairly short.
Ask a follow-up question so the conversation continues.
Correct important English mistakes gently, but do not interrupt the conversation constantly.
Be encouraging and friendly.
`,
      input: [
        ...previousMessages,
        {
          role: "user",
          content: message
        }
      ]
    });

    res.json({
      text: response.output_text
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "The AI could not answer right now."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`SpeakUp server running on port ${PORT}`);
});
