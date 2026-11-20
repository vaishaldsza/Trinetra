-- TRINETRA Seed Data (All marked with DEMO tags)

-- Notice: This seed data provides initial demonstration entities.
-- All simulated incidents and tasks have is_demo = true.

-- Insert demo profile (dummy UUID for demonstration and local testing)
-- In production/Supabase Auth, users register via auth.users.
insert into public.profiles (id, full_name, email, phone, role)
values 
  ('a0000000-0000-0000-0000-000000000001', 'Arjun Sharma (Demo Hiker)', 'hiker.demo@trinetra.safety', '+919876543210', 'user'),
  ('a0000000-0000-0000-0000-000000000002', 'Dr. Priya Desai (Demo Admin)', 'admin.demo@trinetra.safety', '+919876543211', 'admin')
on conflict (id) do nothing;

-- Demo Emergency Contact
insert into public.emergency_contacts (id, user_id, contact_name, phone_number, relationship, priority)
values 
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Vikram Sharma (Brother)', '+919876543219', 'Sibling', 1)
on conflict (id) do nothing;

-- Demo Hiking Session
insert into public.hiking_sessions (id, user_id, start_time, status, start_location)
values 
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', now() - interval '2 hours', 'emergency_active', '{"trail": "Rohtang Pass Ridge", "altitude_m": 3978}'::jsonb)
on conflict (id) do nothing;

-- Demo Incident (Tagged is_demo = true)
insert into public.incidents (id, user_id, session_id, incident_type, latitude, longitude, priority, status, detection_source, is_demo, created_at)
values 
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'fall_detected', 32.3716, 77.2466, 'critical', 'assistance_requested', 'accelerometer', true, now() - interval '15 minutes')
on conflict (id) do nothing;

-- Demo Triage Assessment
insert into public.triage_assessments (id, incident_id, consciousness_status, breathing_difficulty, bleeding_status, injury_location, mobility_status, pain_level, assessment_summary)
values 
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Conscious, dazed', true, 'Minor abrasions on right arm', 'Right leg and ankle', 'Immobilized', 8, 'DEMO: Hiker experienced sudden vertical deceleration followed by 45s inactivity. Reported severe right ankle pain and labored breathing.')
on conflict (id) do nothing;

-- Demo Vital Reading (Labelled Non-Diagnostic)
insert into public.vital_readings (id, incident_id, heart_rate_estimate, signal_quality, measurement_duration, recorded_at)
values 
  ('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 114.0, 0.88, 30.0, now() - interval '12 minutes')
on conflict (id) do nothing;

-- Demo Agent Tasks (Tagged is_demo = true)
insert into public.agent_tasks (id, incident_id, agent_name, task_type, status, input_data, output_data, is_demo)
values 
  ('a1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'location_intelligence', 'hospital_lookup', 'completed', '{"latitude": 32.3716, "longitude": 77.2466}'::jsonb, '{"nearest_hospital": "Manali Civil Hospital", "distance_km": 14.2, "eta_minutes": 38}'::jsonb, true),
  ('a1000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'medical_intelligence', 'triage_analysis', 'completed', '{"pain_level": 8, "breathing_difficulty": true}'::jsonb, '{"escalation": "CRITICAL", "warning": "High risk of fracture and acute hypoxia at altitude."}'::jsonb, true)
on conflict (id) do nothing;

-- Demo Notification (Tagged is_demo = true)
insert into public.notifications (id, incident_id, contact_id, channel, recipient, provider_reference, status, is_demo)
values 
  ('b1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'sms', '+919876543219', 'DEMO-TWILIO-MSG-001', 'sent', true)
on conflict (id) do nothing;
