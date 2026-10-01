import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({limit:"1mb"}));
app.use(express.static(__dirname));

app.post("/api/chat", async (req,res)=>{
  try{
    const {avatar="Alex", kind="friendly character", history=[], message} = req.body || {};
    if(!message) return res.status(400).send("message missing");

    const safeHistory = Array.isArray(history) ? history.slice(-16) : [];
    const instructions = `You are ${avatar}, a ${kind}, in the SpeakUp English-learning app.
Have a friendly, age-appropriate conversation with a teenage English learner.
Speak mostly simple natural English suitable for roughly 8th grade.
Keep replies short, usually 1-3 sentences, and ask a natural follow-up question.
Do not turn every reply into a grammar lesson. If the learner makes an important English mistake, gently model the correct phrase in your response.
Stay in character as the selected avatar, but do not pretend to be a real person.`;

    const response = await client.responses.create({
      model: "gpt-5.6-luna",
      instructions,
      input: [...safeHistory, {role:"user", content:message}]
    });
    const text = response.output_text || "Sorry, I didn't understand that.";

    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "coral",
      input: text,
      response_format: "mp3"
    });
    const buffer = Buffer.from(await speech.arrayBuffer());
    res.json({text, audio:buffer.toString("base64")});
  }catch(err){
    console.error(err);
    res.status(500).send("AI request failed");
  }
});

const port=process.env.PORT || 3000;
app.listen(port,()=>console.log(`SpeakUp server running on port ${port}`));
