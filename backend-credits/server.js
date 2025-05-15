const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const creditRoutes = require('./routes/credits');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'https://ai-codex-client.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-auth-token']
}));

app.use(express.json());

// MongoDB Connection with better error handling
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://mehul:mehul123@cluster0.mongodb.net/your_database_name?retryWrites=true&w=majority';
    if (!mongoUri) {
      console.error('MONGODB_URI is not defined in environment variables');
      return;
    }
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Credits service connected to MongoDB');
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

// Routes
app.use('/api/credits', creditRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Credits service error:', err);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = 5001; // Force port 5001 for credits service

// Start server with error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Credits service running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please make sure no other service is using port 5001.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
}); 