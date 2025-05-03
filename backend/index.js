const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Project code generation endpoint
const generateRouter = require('./routes/generate');
app.use('/generate', generateRouter);

// Prompt enhancement endpoint
const enhanceRouter = require('./routes/enhance');
app.use('/enhance', enhanceRouter);

// AI chat endpoint
const chatRouter = require('./routes/chat');
app.use('/chat', chatRouter);

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
}); 