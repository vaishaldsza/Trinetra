# TRINETRA (Intelligent Outdoor Safety & Emergency Response System)

> **"See the Danger. Sense the Risk. Save a Life."**

TRINETRA is an AI-powered, offline-first outdoor safety and emergency response platform designed to protect hikers, trekkers, and mountaineers.

---

## Monorepo Architecture

- `apps/web`: Next.js (App Router, TypeScript, Tailwind CSS) operations command center, interactive rescue map, incident inspector, agent telemetry, and communications log.
- `apps/mobile`: React Native (Expo SDK 52, Expo Router, Zustand, Expo SQLite) offline-first mobile companion providing movement sensing, fall detection, offline voice triage, and camera PPG vitals estimation.
- `packages/shared`: Shared TypeScript types, Zod validation schemas, enums, constants, and idempotent UUID contracts.
- `supabase/`: PostgreSQL schema migrations with Row Level Security (RLS), custom enum types, automated auth profile triggers, and seed data.

---

## Setup & Run Instructions

### 1. Prerequisites
- Node.js (>= 20.x, tested on v26)
- pnpm (>= 9.x / 12.x)
- Supabase CLI or hosted Supabase project

### 2. Install Dependencies
```powershell
pnpm install
```

### 3. Build Shared Library
```powershell
pnpm run build:shared
```

### 4. Supabase Setup & Migrations
To apply the database migrations to your Supabase project:
```powershell
# Using Supabase CLI locally:
supabase db reset
# Or directly run the migration in your Supabase SQL editor:
# supabase/migrations/20261120000000_initial_schema.sql
```

#### Demo User Configuration
1. In your Supabase Dashboard, navigate to **Authentication -> Users** and create two demo accounts:
   - **Demo Hiker:** `hiker.demo@trinetra.safety` (set password, e.g. `DemoSafety123!`)
   - **Demo Admin:** `admin.demo@trinetra.safety` (set password, e.g. `DemoSafety123!`)
2. In the Supabase **SQL Editor**, promote the admin user to the `'admin'` role:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'admin.demo@trinetra.safety';
   ```
3. Run [supabase/seed.sql](file:///d:/Trinetra/supabase/seed.sql) to populate initial demo contacts, sessions, incidents, triage reports, and agent tasks for the demo accounts.

### 5. Running the Web Platform
```powershell
# In a new terminal:
pnpm run dev:web
# Web dashboard opens at http://localhost:3000
```

### 6. Running the Mobile App
```powershell
# In a new terminal:
pnpm run dev:mobile
# Expo CLI launches Metro bundler. Press 'w' for web preview, 'a' for Android, or 'i' for iOS simulator.
```

### 7. Supabase Edge Functions Deployment

#### Before deploying: install Deno and run deno check on every function entry point
To ensure zero runtime import errors or syntax discrepancies before deploying Edge Functions:
1. Install Deno (e.g. `winget install DenoLand.Deno` or `irm https://deno.land/install.ps1 | iex` on Windows).
2. Run `deno check` on every function entry point:
```powershell
deno check supabase/functions/process-incident/index.ts
deno check supabase/functions/send-notification/index.ts
deno check supabase/functions/run-agent-task/index.ts
deno check supabase/functions/twilio-webhook/index.ts
deno check supabase/functions/retry-notifications/index.ts
```

#### Production Deployment Commands
```powershell
# 1. Set environment secrets in production
supabase secrets set `
  TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" `
  TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" `
  TWILIO_PHONE_NUMBER="+1xxxxxxxxxx" `
  TWILIO_WEBHOOK_URL="https://your-project.supabase.co/functions/v1/twilio-webhook" `
  ELEVENLABS_API_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" `
  AGENTVERSE_API_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 2. Deploy Twilio Webhook WITHOUT gateway JWT (Twilio signs callbacks via HMAC X-Twilio-Signature)
supabase functions deploy twilio-webhook --no-verify-jwt

# 3. Deploy all internal services WITH gateway JWT verification
supabase functions deploy send-notification
supabase functions deploy process-incident
supabase functions deploy run-agent-task
supabase functions deploy retry-notifications
```

---

## Security & Route Protection
- **Authoritative Enforcement via PostgreSQL Row Level Security (RLS):** While the web dashboard applies client route guards for navigation flow and filters views so that non-admins see only their own incidents, PostgreSQL Row Level Security (RLS) policies on Supabase are the real, authoritative source of data protection and security enforcement. Unauthenticated or non-admin API requests cannot read or modify unauthorized database rows regardless of client-side state.
- **Mock Admin Mode:** When Supabase environment variables are omitted, the web dashboard runs locally in Mock Admin Mode, populated with seeded demonstration incidents and telemetry streams without requiring live cloud credentials.

---

## Safety & Non-Diagnostic Notice
- **Non-Diagnostic:** Health estimates (PPG camera pulse readings) are experimental estimates and must not be used as clinical diagnostic devices.
- **Immediate Escalation:** Critical emergency workflows never wait on cloud connectivity, external LLMs, or agent execution.
- **Demo Mode Guard:** All demonstration incidents, simulated outputs, and test communications are tagged `[DEMO]`. Real outbound SMS/phone calls are disabled by default in Demo Mode.
