const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection with better error handling
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test', {
  // Removed deprecated options
})
.then(() => {
  console.log('Successfully connected to MongoDB.');
  console.log('Database:', mongoose.connection.name);
  console.log('Host:', mongoose.connection.host);
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit if cannot connect to database
});

// Add connection error handler
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

// Add disconnection handler
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Health check endpoint with DB status
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
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

// Code assistant endpoint
const codeAssistantRouter = require('./routes/codeAssistant');
app.use('/code-assistant', codeAssistantRouter);

// Auth and other root endpoints
const rootRouter = require('./routes/index');
app.use('/', rootRouter);

// Auth routes
app.use('/auth', authRoutes);

// Project routes
app.use('/projects', projectRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 