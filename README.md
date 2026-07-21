# DealForge

AI-powered Zoom App that turns every sales meeting into actionable leads, follow-ups, and closed deals.

## Tech Stack

- **Client:** React 19, Vite, Dexie.js, Zustand, Firebase Auth, Socket.IO, Recharts
- **Server:** Node.js, Express 5, Firebase Admin, OpenAI/Anthropic SDK, Resend, Socket.IO

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project (for Auth)
- ngrok (for Zoom App HTTPS tunnel)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   # Edit .env files with your credentials
   ```

3. Start development:
   ```bash
   npm run dev
   ```

This runs both client (port 5173) and server (port 3000) concurrently.

### Individual Commands

```bash
npm run dev:client    # Client only
npm run dev:server    # Server only
npm run build         # Build client for production
```

## Project Structure

```
dealforge/
├── client/              # React frontend
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── pages/       # Page components
│       ├── services/    # Business logic & data layer
│       ├── hooks/       # Custom React hooks
│       ├── store/       # Zustand state management
│       └── crypto/      # Client-side encryption
├── server/              # Node.js backend
│   └── src/
│       ├── routes/      # API routes
│       ├── services/    # Business logic
│       └── middleware/   # Auth, rate limiting
└── package.json         # Monorepo workspace root
```

## Architecture

- **Privacy-first:** Sensitive data (transcripts, leads, emails) stored locally in IndexedDB via Dexie.js
- **BYOK model:** Users provide their own API keys, encrypted client-side with AES-256-GCM
- **Stateless server:** No permanent data storage; temporary 24-hour buffer for offline meetings
- **Real-time:** Socket.IO for live transcription and suggestions in Zoom panel

## License

Private
