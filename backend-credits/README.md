# Credits Management Service

This service handles user credits for the project generation system. It manages both daily free credits and purchased credits.

## Features

- Daily free credits (5 per day)
- Purchased credits system
- Credit usage tracking
- Credit history
- Automatic daily credit reset

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following variables:
```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/your_database_name
JWT_SECRET=your_jwt_secret_key_here
```

3. Start the server:
```bash
npm run dev
```

## API Endpoints

### Get Credit Status
- GET `/api/credits/status`
- Returns current daily and purchased credits

### Get Credit History
- GET `/api/credits/history`
- Returns credit transaction history

### Purchase Credits
- POST `/api/credits/purchase`
- Body: `{ "amount": number }`
- Adds purchased credits to user's account

### Use Credits
- POST `/api/credits/use`
- Body: `{ "amount": number }`
- Deducts credits from user's account (uses daily credits first, then purchased credits)

## Authentication

All endpoints require authentication using JWT token in the `x-auth-token` header. 