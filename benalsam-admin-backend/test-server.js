const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Admin Backend API is running',
    timestamp: new Date().toISOString(),
    environment: 'development',
    version: 'v1'
  });
});

// Mock listings endpoint
app.get('/api/v1/listings', (req, res) => {
  const mockListings = [
    {
      id: '1',
      title: 'iPhone 14 Pro Max - Mükemmel Durumda',
      description: '6 ay önce alınmış, kutulu iPhone 14 Pro Max.',
      price: 45000,
      category: 'Elektronik',
      status: 'PENDING',
      views: 0,
      favorites: 0,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      userId: 'user1',
      images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'],
      location: {
        city: 'İstanbul',
        district: 'Kadıköy',
        neighborhood: 'Fenerbahçe'
      }
    },
    {
      id: '2',
      title: 'MacBook Air M2 - 2023 Model',
      description: 'Apple MacBook Air M2 çip, 8GB RAM, 256GB SSD.',
      price: 35000,
      category: 'Elektronik',
      status: 'ACTIVE',
      views: 45,
      favorites: 12,
      createdAt: '2024-01-14T15:20:00Z',
      updatedAt: '2024-01-14T15:20:00Z',
      userId: 'user2',
      images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'],
      location: {
        city: 'İstanbul',
        district: 'Beşiktaş',
        neighborhood: 'Levent'
      }
    }
  ];

  res.json({
    success: true,
    data: mockListings,
    pagination: {
      page: 1,
      limit: 10,
      total: mockListings.length,
      totalPages: 1
    }
  });
});

// Mock analytics endpoint
app.get('/api/v1/analytics', (req, res) => {
  res.json({
    success: true,
    data: {
      totalListings: 1250,
      pendingApprovals: 45,
      activeListings: 980,
      monthlyRevenue: 15000,
      userGrowth: 12.5,
      topCategories: [
        { name: 'Elektronik', count: 450 },
        { name: 'Giyim', count: 320 },
        { name: 'Ev & Yaşam', count: 280 }
      ]
    }
  });
});

// Mock auth endpoint
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@benalsam.com' && password === 'admin123') {
    res.json({
      success: true,
      data: {
        admin: {
          id: 'admin_1',
          email: 'admin@benalsam.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'SUPER_ADMIN'
        },
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token'
      },
      message: 'Login successful'
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test Admin Backend API server running on port ${PORT}`);
  console.log(`📊 Environment: development`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API version: v1`);
  console.log(`🔐 Test login: POST http://localhost:${PORT}/api/v1/auth/login`);
  console.log(`   Email: admin@benalsam.com`);
  console.log(`   Password: admin123`);
}); 