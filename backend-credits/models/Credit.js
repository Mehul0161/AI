const mongoose = require('mongoose');

const creditSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  dailyCredits: {
    type: Number,
    default: 5,
    min: 0
  },
  purchasedCredits: {
    type: Number,
    default: 0,
    min: 0
  },
  lastDailyReset: {
    type: Date,
    default: Date.now
  },
  creditHistory: [{
    type: {
      type: String,
      enum: ['purchase', 'usage', 'daily_reset'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    description: String
  }]
}, {
  timestamps: true
});

// Method to check and reset daily credits
creditSchema.methods.checkAndResetDailyCredits = function() {
  const now = new Date();
  const lastReset = new Date(this.lastDailyReset);
  
  // Check if it's a new day
  if (now.getDate() !== lastReset.getDate() || 
      now.getMonth() !== lastReset.getMonth() || 
      now.getFullYear() !== lastReset.getFullYear()) {
    
    this.creditHistory.push({
      type: 'daily_reset',
      amount: 5,
      description: 'Daily credits reset'
    });
    
    this.dailyCredits = 5;
    this.lastDailyReset = now;
    return true;
  }
  return false;
};

// Method to use credits
creditSchema.methods.useCredits = async function(amount) {
  // First check and reset daily credits if needed
  this.checkAndResetDailyCredits();
  
  // Try to use daily credits first
  if (this.dailyCredits >= amount) {
    this.dailyCredits -= amount;
    this.creditHistory.push({
      type: 'usage',
      amount: -amount,
      description: 'Used daily credits'
    });
    return true;
  }
  
  // If not enough daily credits, use purchased credits
  const remainingAmount = amount - this.dailyCredits;
  if (this.purchasedCredits >= remainingAmount) {
    this.purchasedCredits -= remainingAmount;
    this.dailyCredits = 0;
    this.creditHistory.push({
      type: 'usage',
      amount: -amount,
      description: 'Used daily and purchased credits'
    });
    return true;
  }
  
  return false; // Not enough credits
};

// Method to add purchased credits
creditSchema.methods.addPurchasedCredits = function(amount) {
  this.purchasedCredits += amount;
  this.creditHistory.push({
    type: 'purchase',
    amount: amount,
    description: 'Purchased credits'
  });
};

const Credit = mongoose.model('Credit', creditSchema);

module.exports = Credit; 