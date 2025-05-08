const mongoose = require('mongoose');
require('dotenv').config();

async function fixDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');

    // Get the users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Drop all indexes
    await usersCollection.dropIndexes();
    console.log('Dropped all indexes');

    // Create new index only on email
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    console.log('Created new email index');

    console.log('Database fixed successfully');
  } catch (error) {
    console.error('Error fixing database:', error);
  } finally {
    await mongoose.connection.close();
  }
}

fixDatabase(); 