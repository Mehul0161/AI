// responseFilter.js

function parseProjectFiles(response) {
  // Split the response into lines
  const lines = response.split("\n");
  const files = [];
  let currentFile = null;
  let currentContent = [];
  let inCodeBlock = false;

  for (const line of lines) {
    // Check for code block markers
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // Check for file path markers
    if (line.startsWith("File: ") || line.startsWith("Path: ")) {
      // If we have a previous file, save it
      if (currentFile) {
        files.push({
          ...currentFile,
          content: currentContent.join("\n").trim(),
        });
        currentContent = [];
      }

      // Start new file - clean the path by removing backticks and extra spaces
      const path = line.replace(/^(File: |Path: )/, "")
                      .replace(/`/g, '')  // Remove backticks
                      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                      .trim();
      currentFile = {
        path: path,
        content: "",
      };
    } else if (currentFile) {
      // Add content to current file, but skip empty lines at the start/end
      if (currentContent.length === 0 && !line.trim()) {
        continue;
      }
      currentContent.push(line);
    }
  }

  // Add the last file if exists
  if (currentFile) {
    files.push({
      ...currentFile,
      content: currentContent.join("\n").trim(),
    });
  }

  // Clean up file paths and content
  return files.map(file => ({
    ...file,
    path: file.path.replace(/`/g, '').trim(),
    content: file.content.replace(/^```.*\n?/, '').replace(/\n?```$/, '').trim()
  }));
}

function filterAIResponse(data, technology) {
  // Validate response structure
  if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
    throw new Error('Invalid response structure from AI service');
  }

  if (!data.candidates[0].content || !data.candidates[0].content.parts || !Array.isArray(data.candidates[0].content.parts) || data.candidates[0].content.parts.length === 0) {
    throw new Error('Invalid response content structure from AI service');
  }

  const aiResponse = data.candidates[0].content.parts[0].text;

  if (!aiResponse || typeof aiResponse !== 'string') {
    throw new Error('Invalid response text from AI service');
  }

  console.log(`${technology} code generated`);
  const files = parseProjectFiles(aiResponse);

  // Validate parsed files
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('No valid files were parsed from the AI response');
  }

  return files;
}

module.exports = { filterAIResponse, parseProjectFiles }; 