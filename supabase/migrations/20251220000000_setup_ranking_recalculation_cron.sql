
-- Setup Cron Job for Daily Ranking Recalculation
-- 
-- This migration sets up a daily cron job to recalculate season rankings.
-- The job runs at 00:00 UTC every day.
--
-- Prerequisites:
-- - pg_cron extension must be enabled
-- - Edge function 'recalculate-season-rankings' must be deployed

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create cron job for daily ranking recalculation
-- Runs at 00:00 UTC every day
SELECT cron.schedule(
  'recalculate-season-rankings-daily',
  '0 0 * * *', -- Every day at midnight UTC
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/recalculate-season-rankings',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Create a function to manually trigger ranking recalculation
-- This can be called by admins if needed
CREATE OR REPLACE FUNCTION trigger_ranking_recalculation()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('HEAD_ADMIN', 'ADMIN')
  ) THEN
    RAISE EXCEPTION 'Only admins can trigger ranking recalculation';
  END IF;

  -- Call the edge function
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/recalculate-season-rankings',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
      ),
      body := '{}'::jsonb
    ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users (will be checked in function)
GRANT EXECUTE ON FUNCTION trigger_ranking_recalculation() TO authenticated;

-- Create a view for cron job status
CREATE OR REPLACE VIEW cron_job_status AS
SELECT
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
WHERE jobname = 'recalculate-season-rankings-daily';

-- Grant select on view to authenticated users
GRANT SELECT ON cron_job_status TO authenticated;

-- Add comment
COMMENT ON VIEW cron_job_status IS 'View to check the status of the ranking recalculation cron job';

-- Create a function to check if rankings need recalculation
CREATE OR REPLACE FUNCTION check_rankings_freshness()
RETURNS TABLE (
  season_id uuid,
  season_number integer,
  last_recalculated timestamptz,
  hours_since_recalculation numeric,
  needs_recalculation boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id AS season_id,
    s.season_number,
    MAX(r.last_recalculated_at) AS last_recalculated,
    EXTRACT(EPOCH FROM (NOW() - MAX(r.last_recalculated_at))) / 3600 AS hours_since_recalculation,
    (EXTRACT(EPOCH FROM (NOW() - MAX(r.last_recalculated_at))) / 3600) > 24 AS needs_recalculation
  FROM roast_ranking_seasons s
  LEFT JOIN roast_ranking_entries r ON r.season_id = s.id
  WHERE s.status = 'active'
  GROUP BY s.id, s.season_number;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_rankings_freshness() TO authenticated;

-- Add comment
COMMENT ON FUNCTION check_rankings_freshness() IS 'Check if rankings need recalculation (older than 24 hours)';

-- Create notification for successful recalculation
CREATE OR REPLACE FUNCTION notify_ranking_recalculation_complete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only notify if last_recalculated_at was updated
  IF NEW.last_recalculated_at IS DISTINCT FROM OLD.last_recalculated_at THEN
    PERFORM pg_notify(
      'ranking_recalculated',
      json_build_object(
        'season_id', NEW.season_id,
        'creator_id', NEW.creator_id,
        'rank', NEW.rank,
        'tier', NEW.current_tier,
        'recalculated_at', NEW.last_recalculated_at
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for ranking recalculation notifications
DROP TRIGGER IF EXISTS on_ranking_recalculated ON roast_ranking_entries;
CREATE TRIGGER on_ranking_recalculated
  AFTER UPDATE ON roast_ranking_entries
  FOR EACH ROW
  WHEN (NEW.last_recalculated_at IS DISTINCT FROM OLD.last_recalculated_at)
  EXECUTE FUNCTION notify_ranking_recalculation_complete();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_roast_ranking_entries_last_recalculated 
  ON roast_ranking_entries(last_recalculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_roast_ranking_entries_season_score 
  ON roast_ranking_entries(season_id, composite_score DESC);

-- Add comment
COMMENT ON FUNCTION notify_ranking_recalculation_complete() IS 'Notify when rankings are recalculated';
COMMENT ON TRIGGER on_ranking_recalculated ON roast_ranking_entries IS 'Trigger notification when rankings are recalculated';
