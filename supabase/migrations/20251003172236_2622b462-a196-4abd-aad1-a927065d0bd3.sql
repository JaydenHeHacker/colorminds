-- 删除旧的每分钟任务
SELECT cron.unschedule('auto-generate-drafts-job');

-- 创建新的每3分钟任务
SELECT cron.schedule(
  'auto-generate-drafts-job',
  '*/3 * * * *', -- 每3分钟执行一次
  $$
  SELECT
    net.http_post(
        url:='https://gggmfhgavzworznuagzv.supabase.co/functions/v1/auto-generate-drafts',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnZ21maGdhdnp3b3J6bnVhZ3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTM5NDgsImV4cCI6MjA3NDk4OTk0OH0.-RE-UNmGNNNKBOMiTNQjtrOuHk2CmMP97EeGcnBM6pU"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);