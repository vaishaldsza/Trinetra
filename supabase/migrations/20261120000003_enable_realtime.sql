-- TRINETRA Migration: Enable Realtime for incidents, notifications, and agent_tasks
-- Guarded so it does not fail if any table is already a member of supabase_realtime

DO $$
BEGIN
  -- 1. Ensure supabase_realtime publication exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- 2. Add public.incidents if not already in publication
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'incidents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
  END IF;

  -- 3. Add public.notifications if not already in publication
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  -- 4. Add public.agent_tasks if not already in publication
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'agent_tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_tasks;
  END IF;
END $$;

-- Enable REPLICA IDENTITY FULL for real-time update and delete payload diffs
ALTER TABLE public.incidents REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.agent_tasks REPLICA IDENTITY FULL;
