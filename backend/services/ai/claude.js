const Anthropic = require('@anthropic-ai/sdk');
const dotenv = require('dotenv');
dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function claudeAI({ prompt, messages, model }) {
  const conversationHistory = [];
  const finalOutput = [];
  let stopReason = "";
  let count = 0;
  let currentFile = null;
  let currentContent = [];

  try {
    while (stopReason !== "stop" && stopReason !== "end_turn") {
      // Prepare messages for this iteration
      const currentMessages = conversationHistory.length > 0 
        ? conversationHistory 
        : Array.isArray(messages) 
          ? messages 
          : [{ role: 'user', content: messages }];

      // If this is a continuation, add a continue prompt
      if (conversationHistory.length > 0) {
        currentMessages.push({
          role: 'user',
          content: 'Continue the previous response from where you left off. Do not repeat anything. Only output the next part.'
        });
      }

      // Make API call
      const response = await anthropic.messages.create({
        model,
        max_tokens: 8192,
        system: prompt,
        messages: currentMessages,
      });

      // Extract response content
      const content = response.content[0].text.trim();
      const role = response.role || 'assistant';

      // Process the content to handle split files
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if this is a new file declaration
        if (line.startsWith('File: ')) {
          // If we were processing a file, save it
          if (currentFile) {
            finalOutput.push(`File: ${currentFile}\n${currentContent.join('\n')}`);
          }
          // Start new file
          currentFile = line.replace('File: ', '').trim();
          currentContent = [];
        } else {
          // Add content to current file
          currentContent.push(line);
        }
      }

      // Update conversation history
      conversationHistory.push({ role, content });

      // Update stop reason and counter
      stopReason = response.stop_reason || 'stop';
      count++;

      console.log(`Generation turn ${count}:`, {
        contentLength: content.length,
        stopReason,
        totalOutputLength: finalOutput.join('\n').length
      });

      // Safety check to prevent infinite loops
      if (count > 10) {
        console.warn('Maximum generation turns reached');
        break;
      }
    }

    // Add the last file if exists
    if (currentFile) {
      finalOutput.push(`File: ${currentFile}\n${currentContent.join('\n')}`);
    }

    // Format the response to match what responseFilter.js expects
    const completeResponse = {
      content: [{
        text: finalOutput.join('\n\n')
      }],
      role: 'assistant',
      stop_reason: stopReason
    };

    return JSON.stringify(completeResponse);

  } catch (error) {
    console.error('Claude generation error:', error);
    throw error;
  }
}

module.exports = { claudeAI };




