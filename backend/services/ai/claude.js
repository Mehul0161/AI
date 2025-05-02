const Anthropic = require('@anthropic-ai/sdk');
const dotenv = require('dotenv');
dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function claudeAI({ prompt, messages, model }) {
  // Claude expects the system prompt as a top-level parameter, not as a message
  const userMessages = Array.isArray(messages) ? messages : [{ role: 'user', content: messages }];
  const msg = await anthropic.messages.create({
    model,
    max_tokens: 8192,
    system: prompt, // system prompt as top-level param
    messages: userMessages,
  });
  return JSON.stringify(msg);
}

module.exports = { claudeAI }; 