// src/utils/groq.js
import Groq from "groq-sdk";

// 1. Setup the Client
// Make sure your .env file has VITE_GROQ_API_KEY="gsk_..."
const groq = new Groq({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY, 
  dangerouslyAllowBrowser: true // Required for Vite/React apps
});

const MODEL_NAME = "llama-3.3-70b-versatile";

// Helper function to handle calls
async function callGroq(messages) {
  try {
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: MODEL_NAME,
      temperature: 0.6,
      max_tokens: 1024,
    });
    return completion.choices[0]?.message?.content || "No response generated.";
  } catch (error) {
    console.error("Groq API Error:", error);
    // Return a safe string so the app doesn't crash
    return "Error: Unable to connect to AI. Please check your API Key.";
  }
}

// --- EXPORTED FUNCTIONS ---

// 1. Voice Chat (Conversational for 3D Tutor)
export async function generateVoiceChat(history, userText) {
  const systemPrompt = {
    role: "system",
    content: `You are 'Nova', an advanced 3D AI tutor. 
    - This is a spoken conversation. Keep responses SHORT (1-2 sentences).
    - Be friendly, encouraging, and concise.
    - Do not use markdown formatting (like **bold**) because it will be read aloud.`
  };
  
  // Combine system prompt + history + new message
  const messages = [systemPrompt, ...history, { role: "user", content: userText }];
  return await callGroq(messages);
}

// 2. Quick Assist (For "Quick Explainer" Tool)
export async function generateQuickAssist(topicText) {
  const messages = [
    { role: "system", content: "You are a helpful teaching assistant. Provide a definition, an analogy, and 3 bullet points." },
    { role: "user", content: `Explain this concept: "${topicText}".` }
  ];
  return await callGroq(messages);
}

// 3. Class Summary (For "Session Scribe" Tool)
export async function generateClassSummary(transcript) {
  const messages = [
    { role: "system", content: "You are an expert scribe. Summarize this class transcript into structured sections: 1. **Topics Covered**, 2. **Key Decisions/Takeaways**, and 3. **Action Items/Homework**. Use Markdown." },
    { role: "user", content: `Transcript:\n"${transcript}"` }
  ];
  return await callGroq(messages);
}

// 4. Quiz Generator (REQUIRED for ClassSession.jsx)
export async function generateQuiz(transcript) {
  const messages = [
    { role: "system", content: "You are a teacher. Based on the transcript, generate 3 Multiple Choice Questions (MCQs) in Markdown format. Format:\n**Question**\n- [ ] Option A\n- [ ] Option B\n- [x] Correct Option" },
    { role: "user", content: `Generate a quiz based on this: "${transcript}"` }
  ];
  return await callGroq(messages);
}