-- TRINETRA Database Initial Schema
-- PRD Section 10 Specification

-- Enable pgcrypto for UUID generation if needed
create extension if not exists "pgcrypto";

-- Custom Types & Enums
create type public.user_role as enum ('user', 'admin', 'first_responder');
create type public.hiking_session_status as enum ('active', 'paused', 'completed', 'emergency_active');
create type public.incident_status as enum ('detected', 'awaiting_confirmation', 'emergency_initiated', 'assistance_requested', 'acknowledged', 'resolved', 'cancelled');
create type public.incident_priority as enum ('low', 'medium', 'high', 'critical');
create type public.incident_type as enum ('manual_sos', 'fall_detected', 'audio_distress', 'inactivity', 'health_anomaly', 'other');
create type public.detection_source as enum ('manual', 'accelerometer', 'audio_yamnet', 'vital_monitor', 'system');
create type public.notification_channel as enum ('sms', 'voice');
create type public.notification_status as enum ('pending', 'processing', 'sent', 'delivered', 'failed', 'retry_scheduled');
create type public.agent_task_status as enum ('pending', 'processing', 'completed', 'failed');
create type public.agent_name as enum ('location_intelligence', 'medical_intelligence', 'route_intelligence', 'emergency_coordination', 'communication');

-- 1. Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Emergency Contacts
create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  contact_name text not null,
  phone_number text not null,
  relationship text not null,
  priority integer not null default 1,
  created_at timestamptz not null default now()
);

-- 3. Hiking Sessions
create table if not exists public.hiking_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  start_time timestamptz not null default now(),
  end_time timestamptz,
  start_location jsonb,
  end_location jsonb,
  status public.hiking_session_status not null default 'active',
  created_at timestamptz not null default now()
);

-- 4. Incidents (with client-generated UUID support for idempotent offline sync)
create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid references public.hiking_sessions(id) on delete set null,
  incident_type public.incident_type not null default 'manual_sos',
  latitude double precision,
  longitude double precision,
  last_known_location_at timestamptz,
  priority public.incident_priority not null default 'high',
  status public.incident_status not null default 'detected',
  detection_source public.detection_source not null default 'manual',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  synced_at timestamptz default now()
);

-- 5. Triage Assessments
create table if not exists public.triage_assessments (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  consciousness_status text not null,
  breathing_difficulty boolean not null default false,
  bleeding_status text not null,
  injury_location text not null,
  mobility_status text not null,
  pain_level integer not null default 0 check (pain_level between 0 and 10),
  assessment_summary text not null,
  created_at timestamptz not null default now()
);

-- 6. Vital Readings (Labelled Non-Diagnostic)
create table if not exists public.vital_readings (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  heart_rate_estimate double precision not null,
  signal_quality double precision not null default 1.0,
  measurement_duration double precision not null default 30.0,
  recorded_at timestamptz not null default now()
);

-- 7. Agent Tasks
create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  agent_name public.agent_name not null,
  task_type text not null,
  status public.agent_task_status not null default 'pending',
  input_data jsonb,
  output_data jsonb,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- 8. Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  contact_id uuid references public.emergency_contacts(id) on delete set null,
  channel public.notification_channel not null,
  recipient text not null,
  provider_reference text,
  status public.notification_status not null default 'pending',
  error_message text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. Location History
create table if not exists public.location_history (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.hiking_sessions(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  accuracy double precision,
  recorded_at timestamptz not null default now()
);

-- Indexes for efficient queries
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_emergency_contacts_user on public.emergency_contacts(user_id);
create index if not exists idx_hiking_sessions_user on public.hiking_sessions(user_id);
create index if not exists idx_incidents_user on public.incidents(user_id);
create index if not exists idx_incidents_status on public.incidents(status);
create index if not exists idx_incidents_created_at on public.incidents(created_at desc);
create index if not exists idx_triage_incident on public.triage_assessments(incident_id);
create index if not exists idx_vitals_incident on public.vital_readings(incident_id);
create index if not exists idx_agent_tasks_incident on public.agent_tasks(incident_id);
create index if not exists idx_notifications_incident on public.notifications(incident_id);
create index if not exists idx_location_history_session on public.location_history(session_id);

-- Helper function: is current user admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Trigger: Automatically create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.email, ''),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'user'::public.user_role),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable Row Level Security (RLS) on ALL tables
alter table public.profiles enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.hiking_sessions enable row level security;
alter table public.incidents enable row level security;
alter table public.triage_assessments enable row level security;
alter table public.vital_readings enable row level security;
alter table public.agent_tasks enable row level security;
alter table public.notifications enable row level security;
alter table public.location_history enable row level security;

-- Helper function: get user role securely
create or replace function public.get_user_role(p_user_id uuid)
returns public.user_role as $$
  select role from public.profiles where id = p_user_id;
$$ language sql security definer stable;

-- Trigger to prevent normal users from modifying their own or other users' roles
create or replace function public.prevent_role_modification()
returns trigger as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Unauthorized: Only administrators can modify user roles';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_prevent_role_modification on public.profiles;
create trigger trg_prevent_role_modification
  before update on public.profiles
  for each row execute procedure public.prevent_role_modification();

-- RLS Policies: Profiles
create policy "Users can view their own profile or admin can view all"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users can update their own profile without changing role"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (
    public.is_admin() 
    or (auth.uid() = id and role = public.get_user_role(auth.uid()))
  );

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id or public.is_admin());

-- RLS Policies: Emergency Contacts
create policy "Users manage own emergency contacts"
  on public.emergency_contacts for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- RLS Policies: Hiking Sessions
create policy "Users manage own hiking sessions"
  on public.hiking_sessions for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- RLS Policies: Incidents
create policy "Users view own incidents or admin views all"
  on public.incidents for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Users create own incidents or admin creates"
  on public.incidents for insert
  with check (auth.uid() = user_id or public.is_admin());

create policy "Users update own incidents or admin updates all"
  on public.incidents for update
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- RLS Policies: Triage Assessments
create policy "Access triage through incident ownership or admin"
  on public.triage_assessments for all
  using (
    exists (
      select 1 from public.incidents i
      where i.id = incident_id and (i.user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.incidents i
      where i.id = incident_id and (i.user_id = auth.uid() or public.is_admin())
    )
  );

-- RLS Policies: Vital Readings
create policy "Access vitals through incident ownership or admin"
  on public.vital_readings for all
  using (
    exists (
      select 1 from public.incidents i
      where i.id = incident_id and (i.user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.incidents i
      where i.id = incident_id and (i.user_id = auth.uid() or public.is_admin())
    )
  );

-- RLS Policies: Agent Tasks
create policy "Access agent tasks through incident ownership or admin"
  on public.agent_tasks for all
  using (
    exists (
      select 1 from public.incidents i
      where i.id = incident_id and (i.user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.incidents i
      where i.id = incident_id and (i.user_id = auth.uid() or public.is_admin())
    )
  );

-- RLS Policies: Notifications
create policy "Access notifications through incident ownership or admin"
  on public.notifications for all
  using (
    exists (
      select 1 from public.incidents i
      where i.id = incident_id and (i.user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.incidents i
      where i.id = incident_id and (i.user_id = auth.uid() or public.is_admin())
    )
  );

-- RLS Policies: Location History
create policy "Access location history through session ownership or admin"
  on public.location_history for all
  using (
    exists (
      select 1 from public.hiking_sessions s
      where s.id = session_id and (s.user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.hiking_sessions s
      where s.id = session_id and (s.user_id = auth.uid() or public.is_admin())
    )
  );
