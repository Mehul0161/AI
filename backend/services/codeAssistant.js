const { geminiAI } = require('./ai/gemini');
const { claudeAI } = require('./ai/claude');
const { openaiAI } = require('./ai/openai');

const CODE_ASSISTANT_SYSTEM_PROMPT = `You are an expert code assistant helping users improve their generated code. Focus on providing specific, actionable feedback that helps users enhance, refactor, debug, or optimize their code. 

When responding:
- Be concise and direct
- Provide specific line numbers or code sections when referring to issues
- When suggesting changes, clearly indicate which part of the code you're changing
- Format changes as code blocks with file paths and line numbers like this:
  File: path/to/file.js
  Lines: 10-15
  \`\`\`javascript
  // new code here
  \`\`\`
- If suggesting a complete file replacement, include all necessary imports and exports
- If suggesting partial changes, only include the changed section
- Focus on best practices, performance improvements, and code quality
- Explain your reasoning briefly when suggesting changes
- Consider cross-file dependencies and implications

Areas to focus on:
- Code organization and structure
- Performance optimizations
- Bug fixes and edge cases
- Modern syntax and patterns
- Accessibility improvements
- Responsive design considerations
- Code readability and maintenance`;

function getAIProvider(model) {
  if (model.includes('gemini')) return geminiAI;
  if (model.includes('claude')) return claudeAI;
  if (model.includes('gpt') || model.includes('openai') || model.includes('chatgpt')) return openaiAI;
  return geminiAI; // Default to Gemini
}

async function processCodeAssistantRequest({ message, files, model, history = [] }) {
  // Select the appropriate AI provider based on the model
  const aiProvider = getAIProvider(model);
  
  // Format the files for the context
  const fileContext = files.map(file => 
    `File: ${file.path}\n\`\`\`${file.language || ''}\n${file.content}\n\`\`\``
  ).join('\n\n');
  
  // Compose the final prompt
  const finalPrompt = `${CODE_ASSISTANT_SYSTEM_PROMPT}\n\nHere are the files from the project:\n\n${fileContext}\n\nUser request: ${message}`;
  
  console.log('Sending request to AI with prompt:', finalPrompt);
  
  // Call the AI with the prepared prompt
  const response = await aiProvider({ 
    prompt: finalPrompt, 
    messages: history,
    model 
  });
  
  console.log('Received AI response:', response);
  
  // Parse the response
  let aiReply = '';
  try {
    const data = typeof response === 'string' ? JSON.parse(response) : response;
    
    // Handle different response formats based on the provider
    if (model.includes('gemini')) {
      aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (model.includes('claude')) {
      if (Array.isArray(data.content) && data.content[0]?.text) {
        aiReply = data.content.map(c => c.text).join('\n');
      } else {
        aiReply = data.content?.text || '';
      }
    } else if (model.includes('gpt') || model.includes('openai') || model.includes('chatgpt')) {
      if (Array.isArray(data.output) && Array.isArray(data.output[0]?.content) && data.output[0].content[0]?.text) {
        aiReply = data.output.map(o => o.content.map(c => c.text).join('\n')).join('\n');
      } else {
        aiReply = data.choices?.[0]?.message?.content || '';
      }
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e);
    throw new Error('Failed to parse AI response: ' + e.message);
  }
  
  if (!aiReply) throw new Error('No response received from AI');
  
  console.log('Parsed AI reply:', aiReply);
  
  // Check if the reply contains code changes
  const codeChanges = extractCodeChanges(aiReply);
  console.log('Extracted code changes:', codeChanges);
  
  if (codeChanges.length > 0) {
    // Add a message about the changes
    aiReply += '\n\nI have suggested changes to the following files:\n' +
      codeChanges.map(change => `- ${change.filePath} (${change.lineRange || 'complete file'})`).join('\n') +
      '\n\nThese changes will be automatically applied.';
  }
  
  return aiReply.trim();
}

// Helper function to extract code changes from AI response
function extractCodeChanges(reply) {
  console.log('Extracting code changes from reply:', reply);
  const changes = [];
  // Look for code blocks with file paths and optional line numbers
  const fileRegex = /File: (.*?)(?:\nLines: (\d+-\d+))?\n```(?:[a-zA-Z0-9]*)\n([\s\S]*?)```/g;
  let match;
  while ((match = fileRegex.exec(reply)) !== null) {
    console.log('Found code change match:', match);
    changes.push({
      filePath: match[1].trim(),
      lineRange: match[2] ? match[2].trim() : null,
      newContent: match[3].trim()
    });
  }
  console.log('Extracted changes:', changes);
  return changes;
}

module.exports = { processCodeAssistantRequest }; 