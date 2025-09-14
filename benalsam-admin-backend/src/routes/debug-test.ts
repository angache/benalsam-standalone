import express from 'express';

const router = express.Router();

// Debug test endpoint
router.get('/debug', (req, res) => {
  res.json({ message: 'Debug endpoint works!', timestamp: new Date().toISOString() });
});

export default router;
