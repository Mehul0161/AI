const { techPrompts } = require('./techPrompt');
const { geminiAI } = require('./ai/gemini');
const { openaiAI } = require('./ai/openai');
const { claudeAI } = require('./ai/claude');

async function modelSwitch({ prompt, technology, model }) {
  const techPrompt = techPrompts[technology?.toLowerCase()] || '';
  const messages = [{ role: 'user', content: prompt }];

  if (model.includes('gemini')) {
    return await geminiAI({ prompt: techPrompt, messages, model });
  } else if (model.includes('claude')) {
    return await claudeAI({ prompt: techPrompt, messages, model });
  } else if (model.includes('gpt') || model.includes('openai')) {
    return await openaiAI({ prompt: techPrompt, messages, model });
  } else {
    // Default to OpenAI
    return await openaiAI({ prompt: techPrompt, messages, model });
  }
}

module.exports = { modelSwitch }; 