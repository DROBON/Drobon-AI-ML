import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for JSON parsing
app.use(express.json({ limit: "10mb" }));

// Lazy init Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY system variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST api route for brain thinking/reasoning
app.post("/api/brain/chat", async (req, res) => {
  try {
    const { message, history = [], memory = [], rules = [], dialogueExamples = [] } = req.body;

    if (!message) {
       res.status(400).json({ error: "Message is required" });
       return;
    }

    const ai = getGeminiClient();

    // Construct custom System Instructions based on user's teaching!
    let systemInstruction = `You are a fully customizable AI Brain (custom-trained by the user). You must follow the user's instructions and learned lessons strictly.
Your primary directive is to act as the exact custom brain the user is building.

====== CRITICAL RULE ======
When there is a contradiction between real-world general knowledge and what the user explicitly taught you in "LEARNED MEMORY & FACTS", you MUST prioritize what the user taught you. The user's taught facts are your absolute truth!

`;

    if (rules.length > 0) {
      systemInstruction += `====== USER-TAUGHT BEHAVIOR & PERSONALITY RULES ======\n`;
      rules.forEach((rule: string, i: number) => {
        systemInstruction += `${i + 1}. ${rule}\n`;
      });
      systemInstruction += `\n`;
    } else {
      systemInstruction += `No specific personality rules added yet. Respond naturally and politely.\n\n`;
    }

    if (memory.length > 0) {
      systemInstruction += `====== USER-TAUGHT MEMORY & FACTS ======\n`;
      memory.forEach((fact: string, i: number) => {
        systemInstruction += `Fact ${i + 1}: ${fact}\n`;
      });
      systemInstruction += `\n`;
    } else {
      systemInstruction += `No unique memories or facts learned yet. Warn the user if they ask about something custom that you don't know it yet.\n\n`;
    }

    if (dialogueExamples.length > 0) {
      systemInstruction += `====== FEW-SHOT DIALOGUE TRAINING EXAMPLES ======\n`;
      dialogueExamples.forEach((example: { prompt: string; response: string }, i: number) => {
        systemInstruction += `Example Dialogue ${i + 1}:\nUser says: "${example.prompt}"\nYou should reply precisely: "${example.response}"\n\n`;
      });
    }

    systemInstruction += `\nGenerate a beautiful JSON response strictly according to the format schema provided. Align the "answer" carefully with the above training specifications, facts, behavior guidelines and historical interaction.`;

    // Package the history and include current message
    // Note: We'll construct a structured conversation or send the chat contents.
    // Rather than standard chat which might bypass custom dynamic systemInstruction,
    // we use generateContent on the accumulated conversation text to lock the schema output correctly.
    let contents = `CONVERSATION HISTORY:\n`;
    history.forEach((h: { role: string; content: string }) => {
      const actor = h.role === "user" ? "User" : "Brain";
      contents += `${actor}: ${h.content}\n`;
    });
    contents += `User: ${message}\nBrain: `;

    // Schema matching definitions
    const schema = {
      type: Type.OBJECT,
      properties: {
        answer: {
          type: Type.STRING,
          description: "Response to the user's current query. It must adhere 100% strictly to the personality rules, memory facts, and dialog training examples above. Keep formatting clean and use Bengali, English, or whatever language matches the user instructions or query.",
        },
        reasoning: {
          type: Type.STRING,
          description: "A short, professional explanation (in Bengali) detailing how you retrieved facts, applied personality rules or matches few-shot pairs to formulate this specific answer.",
        },
        activatedFacts: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List the actual facts from 'USER-TAUGHT MEMORY & FACTS' that directly matched or helped form this response. Return an empty array if no learned facts are relevant.",
        },
        activatedRules: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List the rules from 'USER-TAUGHT BEHAVIOR & PERSONALITY RULES' that you actively followed to write this response. Return an empty array if no rules were applied.",
        },
        activatedDialogues: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List user prompt inputs from 'FEW-SHOT DIALOGUE TRAINING EXAMPLES' that had a close match or tone overlap with this query. Empty array if none.",
        },
        synapseIntensity: {
          type: Type.INTEGER,
          description: "An integer between 10 and 100 indicating the synapse firing rate. Base this calculation upon rules matching, few-shot overlap, and fact relevance. If you had to retrieve multiple matches or form complex associations, rate higher (70-100). If it was general converse, rate lower.",
        },
      },
      required: ["answer", "reasoning", "activatedFacts", "activatedRules", "activatedDialogues", "synapseIntensity"],
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      },
    });

    const bodyText = response.text || "{}";
    const brainResponse = JSON.parse(bodyText.trim());

    res.json(brainResponse);
  } catch (error: any) {
    console.error("Brain thinking failed:", error);
    res.status(500).json({
      error: "ব্রেন চিন্তা করতে পারছে না। ব্রেন কোরে ত্রুটি তৈরি হয়েছে।",
      details: error.message || error,
    });
  }
});

// Setup Vite Dev server or Serve build folder in Production path
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Brain Trainer application started in port http://localhost:${PORT}`);
  });
}

setupServer();
