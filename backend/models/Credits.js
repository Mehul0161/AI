const mongoose = require('mongoose');

const creditTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['daily', 'purchase', 'usage'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

const Credits = mongoose.model('Credits', creditTransactionSchema);

module.exports = Credits; 