const express = require('express');
const router = express.Router();
const Credit = require('../models/Credit');
const { body, validationResult } = require('express-validator');

// Middleware to verify user authentication
const auth = require('../middleware/auth');

// Get user's credit status
router.get('/status', auth, async (req, res) => {
  try {
    console.log('User ID from token:', req.user.id); // Debug log
    
    let credit = await Credit.findOne({ userId: req.user.id });
    
    if (!credit) {
      console.log('Creating new credit record for user:', req.user.id); // Debug log
      credit = new Credit({
        userId: req.user.id,
        dailyCredits: 5,
        purchasedCredits: 0,
        lastDailyReset: new Date()
      });
      await credit.save();
    }
    
    // Check and reset daily credits if needed
    credit.checkAndResetDailyCredits();
    await credit.save();
    
    res.json({
      dailyCredits: credit.dailyCredits,
      purchasedCredits: credit.purchasedCredits,
      lastDailyReset: credit.lastDailyReset
    });
  } catch (err) {
    console.error('Error in /status:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get credit history
router.get('/history', auth, async (req, res) => {
  try {
    console.log('Fetching history for user:', req.user.id); // Debug log
    
    const credit = await Credit.findOne({ userId: req.user.id });
    if (!credit) {
      return res.json([]); // Return empty array if no credit record exists
    }
    
    res.json(credit.creditHistory || []);
  } catch (err) {
    console.error('Error in /history:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Purchase credits
router.post('/purchase', [
  auth,
  body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive integer')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    console.log('Processing purchase for user:', req.user.id); // Debug log
    
    let credit = await Credit.findOne({ userId: req.user.id });
    if (!credit) {
      credit = new Credit({
        userId: req.user.id,
        dailyCredits: 5,
        purchasedCredits: 0,
        lastDailyReset: new Date()
      });
    }
    
    credit.addPurchasedCredits(req.body.amount);
    await credit.save();
    
    res.json({
      message: 'Credits purchased successfully',
      newBalance: credit.purchasedCredits
    });
  } catch (err) {
    console.error('Error in /purchase:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Use credits
router.post('/use', [
  auth,
  body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive integer')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const credit = await Credit.findOne({ userId: req.user.id });
    if (!credit) {
      return res.status(404).json({ message: 'Credit record not found' });
    }
    
    const success = await credit.useCredits(req.body.amount);
    if (!success) {
      return res.status(400).json({ message: 'Insufficient credits' });
    }
    
    await credit.save();
    
    res.json({
      message: 'Credits used successfully',
      remainingDailyCredits: credit.dailyCredits,
      remainingPurchasedCredits: credit.purchasedCredits
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 