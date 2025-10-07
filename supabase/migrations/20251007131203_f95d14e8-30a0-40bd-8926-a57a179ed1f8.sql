-- 查询现有的 cron job 并删除
DO $$
DECLARE
  job_record RECORD;
BEGIN
  FOR job_record IN 
    SELECT jobid 
    FROM cron.job 
    WHERE command LIKE '%auto-post-reddit%'
  LOOP
    PERFORM cron.unschedule(job_record.jobid);
  END LOOP;
END $$;

-- 创建新的 cron job，每分钟运行一次
SELECT cron.schedule(
  'auto-post-reddit-every-minute',
  '* * * * *', -- 每分钟运行
  $$
  SELECT
    net.http_post(
      url := 'https://gggmfhgavzworznuagzv.supabase.co/functions/v1/auto-post-reddit',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnZ21maGdhdnp3b3J6bnVhZ3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTM5NDgsImV4cCI6MjA3NDk4OTk0OH0.-RE-UNmGNNNKBOMiTNQjtrOuHk2CmMP97EeGcnBM6pU"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);