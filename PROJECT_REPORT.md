# DealForge - Comprehensive Codebase Report

## 1. Project Overview
**DealForge** is a "Meeting Intelligence SaaS", originally designed as a Zoom Marketplace App. Its primary goal is to turn B2B sales meetings into actionable leads, follow-ups, and closed deals automatically.
It operates via two main surfaces:
1.  **In-Meeting Panel (Zoom App):** An iframe embedded in Zoom providing live transcription, live AI suggestions, and quick notes. It is entirely stateless.
2.  **Web Dashboard:** A standalone React single-page application (SPA) where users manage leads, pipelines, analytics, AI summaries, and email outreach. Data storage (IndexedDB) and processing are heavily focused here for privacy.

The architecture emphasizes a **privacy-first approach**, especially concerning AI models (Bring Your Own Key - BYOK) and data storage. Sensitive data (transcripts, leads, emails) is stored locally in the user's browser using IndexedDB. The backend serves mainly as a stateless relay, with a temporary 24-hour buffer for real-time Zoom events if the dashboard is offline.

---

## 2. Tech Stack

### Frontend (Client Workspace)
*   **Core:** React 19.2.7, React Router DOM 7.18.1
*   **Build Tool:** Vite 8.1.1
*   **State Management:** Zustand (for global state like Auth and UI settings)
*   **Local Database:** Dexie.js (wrapper for IndexedDB)
*   **Styling:** Vanilla CSS with custom CSS variables for a "Glassmorphism" / Dark Mode theme.
*   **Icons & Charts:** Lucide-React, Recharts
*   **External Integrations:** Firebase (Auth), Zoom Apps SDK, Socket.io-client (for live updates).

### Backend (Server Workspace)
*   **Core:** Node.js, Express 5.2.1
*   **Real-time Communication:** Socket.io
*   **Security & Middleware:** Helmet, Cors, Express-rate-limit, Compression
*   **Integrations:**
    *   Firebase Admin SDK (for token verification)
    *   Stripe (for subscription billing)
    *   Resend SDK (for email delivery)
    *   OpenAI & Anthropic SDKs (for AI processing, using user-provided keys)

### Infrastructure & Monorepo Setup
*   **Package Manager:** NPM Workspaces (`client` and `server` sub-directories).
*   **Development:** Concurrently to run both dev servers.
*   **Deployment config:** Dockerfile (backend), Docker Compose (local infra), Railway config (`railway.json`).

---

## 3. Architecture & Data Flow

### The "Two-Browser Problem" & Stateless Backend
The most critical architectural decision is handling the isolation between Zoom's embedded browser (the panel) and the user's main browser (the dashboard).
*   **Zoom Panel:** Streams live audio/transcription data via WebSockets to the Backend.
*   **Backend:** Acts as a relay. It pushes data to the Web Dashboard if connected. If not, it buffers data in-memory (24h TTL) using `buffer-service.js`. It does *not* persist meeting transcripts, AI analyses, or leads to a cloud database.
*   **Web Dashboard:** Pulls buffered data or receives live WebSocket data and stores it persistently in the browser's IndexedDB via Dexie.

### Bring Your Own Key (BYOK)
API keys for OpenAI and Anthropic are encrypted client-side using AES-256-GCM (PBKDF2 derivation) in the browser before being stored in `localStorage` (`crypto/key-vault.js`). They are sent to the backend only per-request over HTTPS and are never stored on the backend.

### Tracking Inbox
Email open/click tracking operates on a "pull" model to maintain the stateless backend. Tracking pixels hit the server, which temporarily stores the event metadata. The dashboard polls/pulls these events and stores them locally.

---

## 4. Frontend Structure (`client/src`)

### Routing & Layouts
*   `App.jsx`: Sets up React Router.
*   `DashboardLayout.jsx`: Wraps the main SPA (Sidebar + Header).
*   `ZoomPanelLayout.jsx`: Wraps the Zoom in-meeting views.
*   `ProtectedRoute.jsx`: Ensures Firebase authentication is valid.

### Pages & Features
**Web Dashboard (`pages/dashboard`)**
*   `DashboardPage.jsx`: Overview charts (Recharts) for meeting trends, pipeline value, and stat cards.
*   `MeetingsPage.jsx` & `MeetingDetailPage.jsx`: View past meetings, full transcripts, and trigger AI analysis (summaries/action items).
*   `LeadsPage.jsx`: Grid view of leads with AI-generated scores and stage tags.
*   `PipelinePage.jsx`: A drag-and-drop Kanban board for deal management across stages (Lead Identified, Qualified, Proposal, Negotiation, Closed Won/Lost).
*   `EmailPage.jsx`: Compose AI-drafted emails (using Resend), manage campaigns, and track statuses (Draft, Scheduled, Sent).
*   `AnalyticsPage.jsx`: Deep dive into conversion rates, funnel metrics, and email performance.
*   `SettingsPage.jsx`: Manage BYOK API keys (encryption/decryption logic) and UI preferences.
*   `BillingPage.jsx`: Stripe integration for Starter, Pro, and Enterprise tiers.

**Zoom Panel (`pages/zoom-panel`)**
*   `TranscriptionView.jsx`: Displays live scrolling transcript segments via WebSocket.
*   `SuggestionsView.jsx`: Displays real-time AI suggestions pushed from the server.
*   `NotesView.jsx`: Textarea to send quick notes to the backend buffer.

### Local Database Schema (`services/local-db`)
Implemented with Dexie.js (`db.js`):
*   `meetings`: Basic metadata (Zoom ID, start/end time, duration).
*   `transcripts`: Full text and segments linked to meetings.
*   `ai_analysis`: Summaries, action items, lead scores linked to meetings.
*   `leads`: Contacts generated from meetings.
*   `deals`: Pipeline items linked to leads.
*   `email_campaigns` & `email_tracking`: Outbound outreach data.

---

## 5. Backend Structure (`server/src`)

### Entry & Middleware
*   `index.js`: Sets up Express, Socket.io, Rate Limiting, Logging, and graceful shutdown.
*   `middleware/auth.js`: Verifies Firebase JWT tokens for protected routes.
*   `middleware/sanitize.js`: Basic input sanitization.

### Routes & Services
*   `zoom.js`: Handles Zoom OAuth callback, Webhook events (`meeting.started`, `meeting.ended`), and transcription/notes relay endpoints. It uses `buffer-service.js` heavily.
*   `ai.js`: Proxy for OpenAI/Anthropic. Validates the client-provided key and calls the `generateSummary`, `generateActionItems`, etc., functions in `ai-service.js`.
*   `email.js`: Handles sending emails via Resend and generating AI drafts.
*   `tracking.js`: Implements the temporary "Tracking Inbox" for email open (pixel) and click (redirect) events.
*   `billing.js`: Stripe integration for creating checkout/portal sessions and handling webhooks (`checkout.session.completed`).
*   `auth.js`: Health checks and dev-token bypass for local testing.

---

## 6. Current Implementation Status

Based on the `README.md` and codebase analysis, the project is largely complete concerning its MVP phase, but some Phase 2/3 features remain pending or need connection:

### Completed (Working robustly)
*   Monorepo scaffolding, styling, and basic layouts.
*   Firebase Auth integration.
*   Stateless Zoom panel UI and WebSocket relay hook.
*   Dexie.js IndexedDB schema and CRUD services.
*   BYOK client-side encryption logic.
*   AI Proxy endpoints (Summaries, Drafts, Sentiment).
*   Drag-and-drop Pipeline UI.
*   Basic Email composition and Resend integration.
*   Stripe billing integration.
*   Auto lead creation from meeting participants.
*   AI lead scoring integration.
*   Drip Campaigns functionality and management UI.
*   Data Durability Enhancements: `navigator.storage.persist()`, auto-backup scheduling to JSON, and manual export/import UIs are fully implemented.
*   Open/click tracking integration in dashboard (polling events from tracking inbox).
*   Zoom Marketplace Submission: Added compliance pages (Privacy Policy, Terms of Service, Support) and `/deauth` endpoint.

### Pending / Needs Implementation (as per README 'Known Issues')
*   **Drip Campaigns:** The email page supports basic sending, but multi-step automated sequences are not yet built.

---

## 7. Code Quality & Notes
*   **Testing:** Vitest is configured for both client and server. The server has extensive unit tests for middleware, services, and routes (46 tests passing). The client has basic API client tests.
*   **Security:** Strong emphasis on client-side security (AES-GCM for API keys). The server utilizes `helmet`, rate limiting, and request sanitization.
*   **Styling:** Clean implementation of custom CSS variables without relying on heavy frameworks like Tailwind, keeping the bundle size down and maintaining strict design control.
*   **State:** Excellent use of `Zustand` for lightweight global state (Auth) and React context/hooks for local state, avoiding Redux boilerplate.

## 8. Summary
DealForge is a well-structured, modern SaaS application showcasing a sophisticated approach to privacy-first data handling in a browser environment. The separation of the stateless relay backend and the heavy-lifting IndexedDB frontend is elegantly designed to bypass cross-browser storage limitations while maintaining strict security for BYOK configurations.