-- TRINETRA Seed Data (All marked with DEMO tags)
-- Note: Demo users must be created via the Supabase Dashboard (Auth > Users) or Signup first.
-- Demo emails:
--   1. Hiker: hiker.demo@trinetra.safety
--   2. Admin: admin.demo@trinetra.safety
-- Once created, run this seed script to populate demo profiles, contacts, sessions, and incidents.
-- If the demo users are not yet present in auth.users, this script skips silently without error.

do $$
declare
  v_hiker_id uuid;
  v_admin_id uuid;
  v_session_id uuid := 'c0000000-0000-0000-0000-000000000001';
  v_incident_id uuid := 'd0000000-0000-0000-0000-000000000001';
  v_contact_id uuid := 'b0000000-0000-0000-0000-000000000001';
begin
  -- 1. Look up existing demo users from auth.users by email
  if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
    select id into v_hiker_id from auth.users where email = 'hiker.demo@trinetra.safety' limit 1;
    select id into v_admin_id from auth.users where email = 'admin.demo@trinetra.safety' limit 1;
  end if;

  -- 2. If neither demo user exists yet, skip silently
  if v_hiker_id is null and v_admin_id is null then
    raise notice 'TRINETRA seed: Demo users not found in auth.users. Skipping seed. Create demo users via Supabase Auth first.';
    return;
  end if;

  -- 3. Set up admin profile if admin user exists
  if v_admin_id is not null then
    insert into public.profiles (id, full_name, email, phone, role)
    values (v_admin_id, 'Dr. Priya Desai (Demo Admin)', 'admin.demo@trinetra.safety', '+919876543211', 'admin')
    on conflict (id) do update set
      role = 'admin',
      full_name = 'Dr. Priya Desai (Demo Admin)';
  end if;

  -- 4. Set up hiker profile and demo incident data if hiker user exists
  if v_hiker_id is not null then
    insert into public.profiles (id, full_name, email, phone, role)
    values (v_hiker_id, 'Arjun Sharma (Demo Hiker)', 'hiker.demo@trinetra.safety', '+919876543210', 'user')
    on conflict (id) do update set
      full_name = 'Arjun Sharma (Demo Hiker)';

    -- Emergency Contact
    insert into public.emergency_contacts (id, user_id, contact_name, phone_number, relationship, priority)
    values (v_contact_id, v_hiker_id, 'Vikram Sharma (Brother)', '+919876543219', 'Sibling', 1)
    on conflict (id) do nothing;

    -- Hiking Session
    insert into public.hiking_sessions (id, user_id, start_time, status, start_location)
    values (v_session_id, v_hiker_id, now() - interval '2 hours', 'emergency_active', '{"trail": "Rohtang Pass Ridge", "altitude_m": 3978}'::jsonb)
    on conflict (id) do nothing;

    -- Incident (Tagged is_demo = true)
    insert into public.incidents (id, user_id, session_id, incident_type, latitude, longitude, priority, status, detection_source, is_demo, created_at)
    values (v_incident_id, v_hiker_id, v_session_id, 'fall_detected', 32.3716, 77.2466, 'critical', 'assistance_requested', 'accelerometer', true, now() - interval '15 minutes')
    on conflict (id) do nothing;

    -- Triage Assessment
    insert into public.triage_assessments (id, incident_id, consciousness_status, breathing_difficulty, bleeding_status, injury_location, mobility_status, pain_level, assessment_summary)
    values ('e0000000-0000-0000-0000-000000000001', v_incident_id, 'Conscious, dazed', true, 'Minor abrasions on right arm', 'Right leg and ankle', 'Immobilized', 8, 'DEMO: Hiker experienced sudden vertical deceleration followed by 45s inactivity. Reported severe right ankle pain and labored breathing.')
    on conflict (id) do nothing;

    -- Vital Reading (Labelled Non-Diagnostic)
    insert into public.vital_readings (id, incident_id, heart_rate_estimate, signal_quality, measurement_duration, recorded_at)
    values ('f0000000-0000-0000-0000-000000000001', v_incident_id, 114.0, 0.88, 30.0, now() - interval '12 minutes')
    on conflict (id) do nothing;

    -- Agent Tasks (Tagged is_demo = true)
    insert into public.agent_tasks (id, incident_id, agent_name, task_type, status, input_data, output_data, is_demo)
    values 
      ('a1000000-0000-0000-0000-000000000001', v_incident_id, 'location_intelligence', 'hospital_lookup', 'completed', '{"latitude": 32.3716, "longitude": 77.2466}'::jsonb, '{"nearest_hospital": "Manali Civil Hospital", "distance_km": 14.2, "eta_minutes": 38}'::jsonb, true),
      ('a1000000-0000-0000-0000-000000000002', v_incident_id, 'medical_intelligence', 'triage_analysis', 'completed', '{"pain_level": 8, "breathing_difficulty": true}'::jsonb, '{"escalation": "CRITICAL", "warning": "High risk of fracture and acute hypoxia at altitude."}'::jsonb, true)
    on conflict (id) do nothing;

    -- Notification (Tagged is_demo = true)
    insert into public.notifications (id, incident_id, contact_id, channel, recipient, provider_reference, status, is_demo)
    values ('b1000000-0000-0000-0000-000000000001', v_incident_id, v_contact_id, 'sms', '+919876543219', 'DEMO-TWILIO-MSG-001', 'sent', true)
    on conflict (id) do nothing;
  end if;
end $$;
