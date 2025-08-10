import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: 'v1',
  });
});

// Test auth endpoint
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  // Mock login for testing
  if (email === 'admin@benalsam.com' && password === 'admin123456') {
    return res.status(200).json({
      success: true,
      data: {
        admin: {
          id: '1',
          email: 'admin@benalsam.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'SUPER_ADMIN',
          isActive: true,
        },
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
      },
      message: 'Login successful',
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid credentials',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Admin Backend API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API version: v1`);
});

export default app; 