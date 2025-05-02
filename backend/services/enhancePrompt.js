const { geminiAI } = require('./ai/gemini');

const ENHANCEMENT_TEMPLATE = ({ prompt, technology, techContext }) => `You are an expert in project designing and frontend development using ${technology}. Your task is to enhance the following project prompt to make it highly detailed, visually rich, and structured in a way that results in a stunning, modern, and user-friendly interface.

Original prompt: ${prompt}

Additional context:
${techContext}

Enhance it by naturally incorporating the following:

- Clearly define the project scope with a strong focus on the user interface (UI) and user experience (UX)
- Describe the ideal layout, structure, and component organization inspired by modern and popular webpages related to "${prompt}"
- Incorporate modern design aesthetics: clean typography, whitespace, soft shadows, glassmorphism/neumorphism where applicable, rounded corners, and responsive layout
- Include smooth and elegant animations/transitions (e.g., hover effects, fade-ins, slide-ins, micro-interactions) to enhance interactivity and polish
- Recommend layout flow and content hierarchy for clarity and accessibility
- Follow general best practices, clean coding standards, and performance optimization (e.g., lazy loading, asset optimization, minimal DOM reflows)
- Do NOT include or mention any backend infrastructure
- Do NOT mention or list technologies, libraries, frameworks, or tools

Only output the enhanced and detailed version of the original prompt. Do not include titles, commentary, explanations and headings.
`;

async function enhancePrompt({ prompt, technology, techContext }) {
  const enhancementPrompt = ENHANCEMENT_TEMPLATE({ prompt, technology, techContext: techContext || '' });
  const model = 'gemini-2.0-flash';
  // Call Gemini with the enhancement prompt
  const response = await geminiAI({ prompt: enhancementPrompt, messages: [], model });
  // Parse the response for the enhanced prompt text
  let enhanced = '';
  try {
    const data = typeof response === 'string' ? JSON.parse(response) : response;
    enhanced = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (e) {
    throw new Error('Failed to parse enhanced prompt response');
  }
  if (!enhanced) throw new Error('No enhanced prompt returned by AI');
  return enhanced.trim();
}

module.exports = { enhancePrompt }; 