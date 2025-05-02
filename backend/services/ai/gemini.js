const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
dotenv.config();

const geminiModel = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  auth: {
    credentials: {
      client_email: process.env.GEMINI_CLIENT_EMAIL,
      private_key: process.env.GEMINI_PRIVATE_KEY
    }
  }
});

async function geminiAI({ prompt, messages, model }) {
  // Concatenate the tech prompt and user prompt as a single user message
  let userText = prompt;
  if (Array.isArray(messages)) {
    userText += '\n\n' + messages.map(msg => msg.content).join('\n');
  } else if (typeof messages === 'string') {
    userText += '\n\n' + messages;
  } else if (messages && messages.content) {
    userText += '\n\n' + messages.content;
  }

  const contents = [
    { role: 'user', parts: [{ text: userText }] }
  ];

  const result = await geminiModel.models.generateContent({
    model,
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    }
  });
  return JSON.stringify(result);
}

module.exports = { geminiAI }; 