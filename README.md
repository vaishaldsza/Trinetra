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
# supabase/seed.sql
```

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

---

## Safety & Non-Diagnostic Notice
- **Non-Diagnostic:** Health estimates (PPG camera pulse readings) are experimental estimates and must not be used as clinical diagnostic devices.
- **Immediate Escalation:** Critical emergency workflows never wait on cloud connectivity, external LLMs, or agent execution.
- **Demo Mode Guard:** All demonstration incidents, simulated outputs, and test communications are tagged `[DEMO]`. Real outbound SMS/phone calls are disabled by default in Demo Mode.
