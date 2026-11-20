-- TRINETRA Seed Data (All marked with DEMO tags)
-- Safe Seed: Creates demo auth users if auth schema exists, or conditionally populates demo records.

do $$
begin
  -- 1. Attempt to insert demo users in auth.users if auth.users table is present
  if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
    insert into auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    values 
      (
        'a0000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'hiker.demo@trinetra.safety',
        crypt('DemoSafety123!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Arjun Sharma (Demo Hiker)","role":"user"}',
        now(),
        now()
      ),
      (
        'a0000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'admin.demo@trinetra.safety',
        crypt('DemoSafety123!', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Dr. Priya Desai (Demo Admin)","role":"admin"}',
        now(),
        now()
      )
    on conflict (id) do nothing;
  end if;

  -- 2. Insert Profiles only if matching auth user exists
  insert into public.profiles (id, full_name, email, phone, role)
  select 
    u.id,
    coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
    coalesce(u.email, ''),
    '+919876543210',
    case when u.id = 'a0000000-0000-0000-0000-000000000002' then 'admin'::public.user_role else 'user'::public.user_role end
  from auth.users u
  where u.id in ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002')
  on conflict (id) do update set
    role = excluded.role;

  -- 3. Insert Demo Emergency Contact if profile exists
  if exists (select 1 from public.profiles where id = 'a0000000-0000-0000-0000-000000000001') then
    insert into public.emergency_contacts (id, user_id, contact_name, phone_number, relationship, priority)
    values 
      ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Vikram Sharma (Brother)', '+919876543219', 'Sibling', 1)
    on conflict (id) do nothing;

    -- 4. Demo Hiking Session
    insert into public.hiking_sessions (id, user_id, start_time, status, start_location)
    values 
      ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', now() - interval '2 hours', 'emergency_active', '{"trail": "Rohtang Pass Ridge", "altitude_m": 3978}'::jsonb)
    on conflict (id) do nothing;

    -- 5. Demo Incident (Tagged is_demo = true)
    insert into public.incidents (id, user_id, session_id, incident_type, latitude, longitude, priority, status, detection_source, is_demo, created_at)
    values 
      ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'fall_detected', 32.3716, 77.2466, 'critical', 'assistance_requested', 'accelerometer', true, now() - interval '15 minutes')
    on conflict (id) do nothing;

    -- 6. Demo Triage Assessment
    insert into public.triage_assessments (id, incident_id, consciousness_status, breathing_difficulty, bleeding_status, injury_location, mobility_status, pain_level, assessment_summary)
    values 
      ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Conscious, dazed', true, 'Minor abrasions on right arm', 'Right leg and ankle', 'Immobilized', 8, 'DEMO: Hiker experienced sudden vertical deceleration followed by 45s inactivity. Reported severe right ankle pain and labored breathing.')
    on conflict (id) do nothing;

    -- 7. Demo Vital Reading (Labelled Non-Diagnostic)
    insert into public.vital_readings (id, incident_id, heart_rate_estimate, signal_quality, measurement_duration, recorded_at)
    values 
      ('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 114.0, 0.88, 30.0, now() - interval '12 minutes')
    on conflict (id) do nothing;

    -- 8. Demo Agent Tasks (Tagged is_demo = true)
    insert into public.agent_tasks (id, incident_id, agent_name, task_type, status, input_data, output_data, is_demo)
    values 
      ('a1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'location_intelligence', 'hospital_lookup', 'completed', '{"latitude": 32.3716, "longitude": 77.2466}'::jsonb, '{"nearest_hospital": "Manali Civil Hospital", "distance_km": 14.2, "eta_minutes": 38}'::jsonb, true),
      ('a1000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'medical_intelligence', 'triage_analysis', 'completed', '{"pain_level": 8, "breathing_difficulty": true}'::jsonb, '{"escalation": "CRITICAL", "warning": "High risk of fracture and acute hypoxia at altitude."}'::jsonb, true)
    on conflict (id) do nothing;

    -- 9. Demo Notification (Tagged is_demo = true)
    insert into public.notifications (id, incident_id, contact_id, channel, recipient, provider_reference, status, is_demo)
    values 
      ('b1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'sms', '+919876543219', 'DEMO-TWILIO-MSG-001', 'sent', true)
    on conflict (id) do nothing;
  end if;
end $$;
