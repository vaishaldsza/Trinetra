-- TRINETRA Migration: Add retry_count to notifications and retry sweep function
-- Handles backoff retries for transient outbound notification failures

-- 1. Add retry_count column to notifications
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0;

-- 2. Add partial index for fast retry sweep queries
CREATE INDEX IF NOT EXISTS idx_notifications_retry_sweep
ON public.notifications (status, retry_count, updated_at)
WHERE status = 'retry_scheduled';

-- 3. Stored function for cron-based or manual retry sweeping
CREATE OR REPLACE FUNCTION public.retry_scheduled_notifications(max_attempts integer DEFAULT 3)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  retried_count integer := 0;
  notif RECORD;
BEGIN
  -- Select eligible notifications:
  -- 1. status = 'retry_scheduled'
  -- 2. is_demo = false (NEVER retry demo rows)
  -- 3. error_message IS DISTINCT FROM 'skipped: not configured' (NEVER retry skipped rows)
  -- 4. retry_count < max_attempts
  -- 5. exponential backoff based on retry_count:
  --    attempt 0: 30s
  --    attempt 1: 60s
  --    attempt 2: 120s
  FOR notif IN
    SELECT *
    FROM public.notifications
    WHERE status = 'retry_scheduled'
      AND is_demo = false
      AND (error_message IS NULL OR error_message != 'skipped: not configured')
      AND COALESCE(retry_count, 0) < max_attempts
      AND updated_at <= now() - (POWER(2, COALESCE(retry_count, 0)) * INTERVAL '30 seconds')
  LOOP
    -- Increment retry_count, transition back to 'pending'
    UPDATE public.notifications
    SET status = 'pending',
        retry_count = COALESCE(retry_count, 0) + 1,
        updated_at = now()
    WHERE id = notif.id;

    retried_count := retried_count + 1;
  END LOOP;

  -- Any retry_scheduled rows that have reached max_attempts transition to 'failed'
  UPDATE public.notifications
  SET status = 'failed',
      error_message = COALESCE(error_message, '') || ' (max retries exceeded)',
      updated_at = now()
  WHERE status = 'retry_scheduled'
    AND COALESCE(retry_count, 0) >= max_attempts;

  RETURN retried_count;
END;
$$;

-- 4. Optional pg_cron job (runs every minute if pg_cron is enabled)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'notification-retry-sweep',
      '* * * * *',
      'SELECT public.retry_scheduled_notifications(3);'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Silently continue if pg_cron is not configured in local environment
    NULL;
END $$;
