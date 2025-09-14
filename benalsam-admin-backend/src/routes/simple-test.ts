import express, { IRouter } from 'express';

const router: IRouter = express.Router();

// Simple test endpoint
router.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.end('# HELP test_metric A test metric\n# TYPE test_metric counter\ntest_metric 1\n');
});

export default router;
