const OpenAI = require('openai');
const dotenv = require('dotenv');
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function openaiAI({ prompt, messages, model }) {
  // Prepend the system prompt
  const inputMessages = [
    { role: 'system', content: prompt },
    ...(Array.isArray(messages) ? messages : [{ role: 'user', content: messages }])
  ];
  const response = await openai.responses.create({
    model,
    input: inputMessages
  });
  // Return the generated code (adapt as needed for OpenAI's response format)
  return JSON.stringify(response);
}

module.exports = { openaiAI }; 