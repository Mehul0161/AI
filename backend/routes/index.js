const express = require('express');
const router = express.Router();

// Sign In endpoint (dummy, no real auth)
router.post('/auth/signin', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  // Dummy: always succeed
  res.json({ success: true, message: 'Signed in successfully', user: { email } });
});

module.exports = router; 