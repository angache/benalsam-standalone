# 🏠 Benalsam Web - Next.js Application

Modern, full-featured marketplace web application built with Next.js 15, React 18, TypeScript, and Supabase.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [API Routes](#-api-routes)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)

## ✨ Features

### Core Features
- 🔐 **Authentication & Authorization** - Supabase Auth with 2FA support
- 📝 **Listing Management** - Create, edit, delete listings with rich media
- 🔍 **Advanced Search** - Elasticsearch-powered search with filters
- 💬 **Messaging System** - Real-time conversations between users
- ⭐ **Favorites & Reviews** - Save favorites and leave reviews
- 👤 **User Profiles** - Comprehensive user profiles with trust scores
- 📱 **Responsive Design** - Mobile-first, fully responsive UI

### Security Features
- ✅ **Input Validation** - Zod schema validation on all API routes
- 🛡️ **Rate Limiting** - Protection against abuse and brute force
- 🔒 **Authentication Checks** - Standardized auth verification
- 🚫 **Error Sanitization** - Generic error messages, detailed logs
- 📊 **Security Monitoring** - Comprehensive security dashboard

### Code Quality
- 📘 **TypeScript** - Full type safety with strict mode
- 🧪 **Testing** - Comprehensive test suite
- 📝 **Logging** - Production-safe logger utility
- 🎯 **Error Handling** - Standardized error responses
- 📚 **Documentation** - Well-documented codebase

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion

### Backend
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Search**: Elasticsearch (via Search Service)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage / Cloudinary

### Infrastructure
- **Hosting**: Vercel / VPS
- **Monitoring**: Prometheus + Grafana
- **Error Tracking**: Sentry (optional)
- **CI/CD**: GitHub Actions

## 🏗️ Architecture

### Microservices Integration
This Next.js app integrates with multiple microservices:

- **Admin Backend** (Port 3002) - Admin operations, JWT auth
- **Search Service** (Port 3016) - Elasticsearch search
- **Listing Service** (Port 3008) - Listing processing, AI suggestions
- **Upload Service** (Port 3007) - Image processing, Cloudinary
- **Categories Service** (Port 3015) - Dynamic categories
- **Cache Service** (Port 3014) - Redis caching

### API Architecture
- **RESTful API Routes** - `/api/*` endpoints
- **Server Components** - React Server Components for SEO
- **Client Components** - Interactive UI components
- **Middleware** - Route protection, rate limiting

## 🚀 Getting Started

### Prerequisites
- Node.js 20.19+ 
- npm or yarn
- Supabase account
- (Optional) Docker for local microservices

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd benalsam-standalone/benalsam-web-next
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
```
http://localhost:3000
```

## 🔐 Environment Variables

### Required Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin Backend
NEXT_PUBLIC_ADMIN_BACKEND_URL=http://localhost:3002/api/v1
ADMIN_BACKEND_JWT_SECRET=your-jwt-secret
```

### Optional Variables
```env
# Application
NEXT_PUBLIC_APP_ENV=development

# Search Service
NEXT_PUBLIC_SEARCH_SERVICE_URL=http://localhost:3016
NEXT_PUBLIC_ELASTICSEARCH_PUBLIC_URL=http://localhost:3016

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

See `.env.example` for complete list.

## 📁 Project Structure

```
benalsam-web-next/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── ayarlar/           # Settings pages
│   │   └── ...
│   ├── components/            # React components
│   │   ├── ui/                # Shadcn/ui components
│   │   └── ...
│   ├── contexts/              # React contexts
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities & configs
│   │   ├── api-errors.ts      # Error handling
│   │   ├── api-validation.ts  # Zod validation
│   │   ├── rate-limit.ts      # Rate limiting
│   │   └── ...
│   ├── services/              # API services
│   ├── stores/                # State stores
│   ├── types/                 # TypeScript types
│   └── utils/                 # Utility functions
├── public/                    # Static assets
├── scripts/                   # Build & utility scripts
├── .env.example              # Environment template
├── next.config.ts             # Next.js configuration
└── package.json              # Dependencies
```

## 🔌 API Routes

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Listings
- `GET /api/listings` - Get listings with filters
- `GET /api/listings/[listingId]` - Get listing details
- `POST /api/listings/create` - Create new listing
- `GET /api/listings/my-listings` - Get user's listings

### Messages
- `GET /api/messages` - Get user conversations
- `POST /api/messages` - Send message
- `GET /api/messages/unread-count` - Get unread count
- `POST /api/messages/mark-read` - Mark messages as read

### Favorites
- `POST /api/favorites` - Add favorite
- `DELETE /api/favorites` - Remove favorite
- `GET /api/favorites/list` - Get favorites
- `POST /api/favorites/check` - Check favorite status

### 2FA
- `POST /api/2fa/setup` - Setup 2FA
- `POST /api/2fa/verify` - Verify 2FA code
- `POST /api/2fa/enable` - Enable 2FA
- `POST /api/2fa/disable` - Disable 2FA

All API routes include:
- ✅ Zod validation
- ✅ Rate limiting
- ✅ Authentication checks
- ✅ Standardized error responses

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking
npm run test             # Run tests
npm run test:api         # Test API routes

# Utilities
npm run clean            # Clean build artifacts
```

### Code Quality Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with Next.js rules
- **Prettier**: Code formatting (if configured)
- **Validation**: Zod schemas for all inputs
- **Error Handling**: Standardized error responses
- **Logging**: Production-safe logger utility

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm run test

# Run API tests
npm run test:api

# Run with coverage
npm run test:coverage
```

### Test Structure
- Unit tests: `*.test.ts`
- API tests: `scripts/test-api-improvements.sh`
- Integration tests: `__tests__/`

## 🚢 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### VPS Deployment
1. Build the application:
```bash
npm run build
```

2. Start production server:
```bash
npm run start
```

3. Use PM2 for process management:
```bash
pm2 start npm --name "benalsam-web" -- start
```

### Environment Setup
- Set all required environment variables
- Configure Supabase connection
- Set up microservices (if needed)
- Configure monitoring (optional)

## 📚 Documentation

- [API Documentation](./docs/API_ENDPOINTS.md)
- [Project Summary](../PROJECT_SUMMARY.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Server Analysis](./NEXTJS_SERVER_ANALYSIS.md)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

[Your License Here]

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase for backend infrastructure
- Shadcn for UI components
- All contributors

---

**Built with ❤️ by the Benalsam Team**
