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

## Security & Hardening Matrix

| Security Domain | Resource / Scope | Policy / Auth Status | Cross-User Exposure Risk | Verification Audit |
| :--- | :--- | :--- | :--- | :--- |
| **Row Level Security** | `public.profiles` | ENABLED (`auth.uid() = id or is_admin()`) | None (Quarantined to owner or admin) | PASS |
| **Row Level Security** | `public.emergency_contacts` | ENABLED (`auth.uid() = user_id or is_admin()`) | None (Quarantined to owner or admin) | PASS |
| **Row Level Security** | `public.hiking_sessions` | ENABLED (`auth.uid() = user_id or is_admin()`) | None (Quarantined to owner or admin) | PASS |
| **Row Level Security** | `public.incidents` | ENABLED (`auth.uid() = user_id or is_admin()`) | None (Quarantined to owner or admin) | PASS |
| **Row Level Security** | `public.triage_assessments` | ENABLED (Join via incident owner or admin) | None (Owner/admin join query) | PASS |
| **Row Level Security** | `public.vital_readings` | ENABLED (Join via incident owner or admin) | None (Owner/admin join query) | PASS |
| **Row Level Security** | `public.agent_tasks` | ENABLED (Join via incident owner or admin) | None (Owner/admin join query) | PASS |
| **Row Level Security** | `public.notifications` | ENABLED (Join via incident owner or admin) | None (Owner/admin join query) | PASS |
| **Row Level Security** | `public.location_history` | ENABLED (Join via session owner or admin) | None (Owner/admin join query) | PASS |
| **Secrets Grep in `apps/`** | `apps/web`, `apps/mobile` | No hardcoded tokens in bundle (Twilio, ElevenLabs, Agentverse, service_role) | Zero secrets exposed to client | PASS |
| **Edge Function Auth** | `process-incident` | Gateway JWT verified + caller `user_id` or `service_role` check | 403 on mismatch | PASS |
| **Edge Function Auth** | `send-notification` | Gateway JWT verified + caller authorized | 403 on mismatch | PASS |
| **Edge Function Auth** | `run-agent-task` | Gateway JWT verified + caller ownership verification | 403 on mismatch | PASS |
| **Edge Function Auth** | `retry-notifications` | Gateway JWT verified + strictly restricted to `service_role` | 403 on user caller | PASS |
| **Edge Function Auth** | `twilio-webhook` | Signature checked: HMAC `X-Twilio-Signature` vs `TWILIO_WEBHOOK_URL` secret | 403 on forged signature | PASS |

---

## Interactive Demo Mode & Scenario Walkthrough

TRINETRA includes an offline-first **Demo Mode** on both Mobile and Web that allows evaluators to simulate the complete emergency response lifecycle locally without any external carrier or database dependencies.

### Running Headless Smoke Tests
Verify all 4 scripted scenarios headlessly with a single command:
```powershell
pnpm smoke
```

### Mobile App Walkthrough
1. **Enable Demo Mode:** Navigate to `Settings` (⚙️) -> Toggle **Interactive Demo Mode** to ON.
   - The persistent amber banner `[DEMO] TRINETRA SAFETY · OFFLINE DEMO MODE` appears across all screens.
   - All mutations created during this mode carry `is_demo = true`. Real SMS and voice calls are blocked.
2. **Access Scenarios:** Tap **Scenarios** in the bottom tab bar (or tap `🧪 Scripted Demo Scenarios` on the Home screen).
3. **Run Scenario 1 (Hiking Fall Detection):**
   - Tap **Scenario 1**.
   - Watch the narration trace kinematic accelerometer free-fall & impact triggers.
   - The 30s countdown vibration engages.
   - Tap **Next Step** to confirm SOS -> Creates incident `#inc-fall...` with `detection_source = 'fall'` in local SQLite.
   - Complete voice triage with consciousness, breathing, and pain rating.
4. **Run Scenario 2 (Critical Emergency):**
   - Companion reports `consciousness_status = 'unconscious'`.
   - Rule engine triggers immediate priority escalation to **CRITICAL**.
   - Optical PPG pulse reading is recorded (44 BPM bradycardia estimate marked `[DEMO]`).
5. **Run Scenario 3 (Remote Trail Without Internet):**
   - Toggles simulated network disconnection (real device WiFi/cellular is untouched).
   - SOS and triage are written directly to SQLite without throwing errors.
   - UI reflects `Pending Sync: 1`.
   - Reconnecting automatically triggers `syncNow()` and transitions mutation status to synced.
6. **Run Scenario 4 (Rescue Coordination):**
   - Locks GPS coordinates (Solang Valley, HP).
   - Geospatial facility finder locates Civil Hospital Manali (12.4 km away).
   - Generates multi-agent medical triage summaries and evacuation route.
   - Demo Guard intercepts outbound alerts: statuses logged as `[SIMULATED]`.
7. **Reset Demo Data:** Tap **Reset Demo Data (Deletes Demo Rows Only)** at the bottom of the Scenarios or Settings screen. Only simulated demo records are purged; real offline hiker profiles remain intact.

### Web Command Center Walkthrough
1. Open `http://localhost:3000/demo` (or click **Demo Scenarios** in the top navigation bar).
2. Select any of the 4 emergency scenarios using the top scenario selector tabs.
3. Click **Auto-Play Walkthrough** or advance manually through the step timeline.
4. Inspect real-time narration, sensor data badges (`ACCEL_TRIGGER: FREE_FALL + IMPACT`, `PRIORITY: CRITICAL`), and structured JSON payloads.
5. Click **Reset Demo Data** in the top right to purge demo incidents and restore the dashboard to an initial clean slate.

---

## End-of-Project Supabase Setup Checklist

When preparing to transition from local Mock Mode to a live Supabase production project, execute the following checklist in order:

- [ ] **1. Create Supabase Project:** Initialize a project in your region on [Supabase Dashboard](https://supabase.com).
- [ ] **2. Execute Migrations:**
  ```powershell
  supabase db push
  # Or run in SQL Editor:
  # 1. supabase/migrations/20261120000000_initial_schema.sql
  # 2. supabase/migrations/20261120000001_add_consent_to_emergency_contacts.sql
  # 3. supabase/migrations/20261120000002_add_retry_count_and_sweep.sql
  ```
- [ ] **3. Verify Row Level Security:** Confirm all 9 tables have RLS enabled and policies applied:
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
  ```
- [ ] **4. Create Authentication Accounts:**
  - Create standard user: `hiker.demo@trinetra.safety`
  - Create admin commander: `admin.demo@trinetra.safety`
- [ ] **5. Assign Admin Role:**
  ```sql
  UPDATE public.profiles SET role = 'admin' WHERE email = 'admin.demo@trinetra.safety';
  ```
- [ ] **6. Seed Initial Data (Optional for Demo):**
  - Execute `supabase/seed.sql` in SQL Editor.
- [ ] **7. Set Production Secrets:**
  ```powershell
  supabase secrets set `
    TWILIO_ACCOUNT_SID="AC..." `
    TWILIO_AUTH_TOKEN="..." `
    TWILIO_PHONE_NUMBER="+1..." `
    TWILIO_WEBHOOK_URL="https://<project-ref>.supabase.co/functions/v1/twilio-webhook" `
    ELEVENLABS_API_KEY="..." `
    AGENTVERSE_API_KEY="..."
  ```
- [ ] **8. Deploy Edge Functions:**
  ```powershell
  supabase functions deploy twilio-webhook --no-verify-jwt
  supabase functions deploy send-notification
  supabase functions deploy process-incident
  supabase functions deploy run-agent-task
  supabase functions deploy retry-notifications
  ```
- [ ] **9. Configure Client Environment:**
  - Create `.env.local` in `apps/web`:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
    NEXT_PUBLIC_DEMO_MODE=false
    ```
  - Create `.env` in `apps/mobile`:
    ```env
    EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
    EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
    EXPO_PUBLIC_DEMO_MODE=false
    ```

---

## Known Limitations

1. **Foreground-Only GPS Tracking:** On mobile devices, GPS telemetry is actively tracked during an active hiking session in the foreground (15-second intervals or 10-meter movement delta). Continuous high-frequency background GPS tracking is constrained by OS power-saving regimes unless native background location permissions and persistent foreground services are configured.
2. **iOS Background Execution Limits:** iOS limits background sensor polling and WebSocket keep-alives when an application is suspended. Emergency countdowns, sensor detection algorithms, and offline voice triage are optimized for active sessions.
3. **Non-Diagnostic Validation:** Health estimations (such as camera optical PPG heart rate readings) and kinematic fall detection algorithms are experimental computational estimates designed for wilderness situational awareness. They are **not clinically validated** medical devices and must not be used for diagnostic medical purposes.
4. **Satellite Communication Not Supported:** Direct satellite uplink (Iridium / Globalstar) is not supported in the MVP. Communications rely on cellular connectivity (2G/3G/4G/5G SMS & voice) and offline-first store-and-forward SQLite synchronization when returning to cellular range.
5. **Simulated Agent Swarm Output:** Autonomous Multi-Agent Swarm findings (Geospatial hospital discovery, triage assessment dossiers, evacuation corridors) run on realistic cached/deterministic heuristics unless an active `AGENTVERSE_API_KEY` and Overpass endpoint are connected in production secrets.

---

## Safety & Non-Diagnostic Notice
- **Non-Diagnostic:** Health estimates (PPG camera pulse readings) are experimental estimates and must not be used as clinical diagnostic devices.
- **Immediate Escalation:** Critical emergency workflows never wait on cloud connectivity, external LLMs, or agent execution.
- **Demo Mode Guard:** All demonstration incidents, simulated outputs, and test communications are tagged `[DEMO]`. Real outbound SMS/phone calls are disabled by default in Demo Mode.
