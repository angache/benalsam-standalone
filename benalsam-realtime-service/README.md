# Benalsam Realtime Service

## Overview
Event-based queue system with Firebase Realtime Database integration for Benalsam platform.

## Features
- Real-time event processing
- Firebase Realtime Database integration
- Event-based queue system (replacing polling)
- Health monitoring
- Structured logging

## Installation
```bash
npm install
```

## Configuration

### 1. Environment Variables
Copy `env.example` to `.env` and configure:
```bash
cp env.example .env
```

### 2. Firebase Service Account
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Rename it to `serviceAccountKey.json`
5. Place it in the root directory of the service

**Important:** The service account file is already in `.gitignore` for security.

### 3. Firebase Secret (Edge Function Authentication)
Generate a secure random token for Edge Function authentication:
```bash
# Generate secure token
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add the generated token to your `.env` file:
```bash
FIREBASE_SECRET=d73a1ab1f2f8dd10efaca107899a2ec4ca06afcdc2ded4d7c4623fe206333a13
```

### 4. Firebase Database Rules
The service includes Firebase Realtime Database rules for security:

```bash
# Deploy rules to Firebase
firebase deploy --only database

# Or manually copy rules from database.rules.json to Firebase Console
```

**Rules Features:**
- ✅ Service Account authentication (Google JWT)
- ✅ Issuer validation (securetoken.google.com)
- ✅ Job validation (ID, type, status, timestamp)
- ✅ UUID validation for listing IDs
- ✅ Whitelist approach for job types and statuses

## Development
```bash
npm run dev
```

## Testing
```bash
npm test
```

## API Endpoints
See `API_ENDPOINTS.md` for detailed documentation

## Architecture
- **Event-driven**: Real-time event processing
- **Firebase Integration**: Realtime Database for event streaming
- **Queue System**: Event-based job processing
- **Microservice**: Independent service architecture
