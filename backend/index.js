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
app.use(cors({
  origin: ['http://localhost:3000', 'https://ai-codex-client.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// MongoDB Connection with better error handling
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI is not defined in environment variables');
      return;
    }
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Successfully connected to MongoDB.');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // Don't exit process in serverless environment
  }
};

// Connect to MongoDB
connectDB();

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

// Export the Express API
module.exports = app;

// Start server only if not in serverless environment
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} 