-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 创建定时任务：每分钟检查并发布定时内容
SELECT cron.schedule(
  'auto-publish-scheduled-content',
  '* * * * *', -- 每分钟执行一次
  $$
  SELECT
    net.http_post(
        url:='https://gggmfhgavzworznuagzv.supabase.co/functions/v1/auto-publish-scheduled',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnZ21maGdhdnp3b3J6bnVhZ3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTM5NDgsImV4cCI6MjA3NDk4OTk0OH0.-RE-UNmGNNNKBOMiTNQjtrOuHk2CmMP97EeGcnBM6pU"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);