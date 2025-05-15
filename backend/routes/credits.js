const express = require('express');
const router = express.Router();
const Credits = require('../models/Credits');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get user's credit history
router.get('/history', auth, async (req, res) => {
  try {
    const transactions = await Credits.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching credit history' });
  }
});

// Get user's current credit status
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check and reset daily credits if needed
    user.checkAndResetDailyCredits();
    await user.save();

    res.json({
      dailyCredits: user.credits.dailyCredits,
      purchasedCredits: user.credits.purchasedCredits,
      lastDailyReset: user.credits.lastDailyReset
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching credit status' });
  }
});

// Purchase credits
router.post('/purchase', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid credit amount' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user's purchased credits
    user.credits.purchasedCredits += amount;
    await user.save();

    // Create credit transaction record
    const transaction = new Credits({
      user: user._id,
      type: 'purchase',
      amount: amount,
      description: `Purchased ${amount} credits`,
      balance: user.credits.purchasedCredits
    });
    await transaction.save();

    res.json({
      success: true,
      credits: {
        dailyCredits: user.credits.dailyCredits,
        purchasedCredits: user.credits.purchasedCredits
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error purchasing credits' });
  }
});

module.exports = router; 