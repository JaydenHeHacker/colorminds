-- 将扩展从 public schema 移动到 extensions schema
DROP EXTENSION IF EXISTS pg_cron CASCADE;
DROP EXTENSION IF EXISTS pg_net CASCADE;

-- 创建 extensions schema（如果不存在）
CREATE SCHEMA IF NOT EXISTS extensions;

-- 在 extensions schema 中安装扩展
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 重新创建定时任务（使用正确的语法）
SELECT cron.schedule(
  'auto-publish-scheduled-content',
  '* * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://gggmfhgavzworznuagzv.supabase.co/functions/v1/auto-publish-scheduled',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnZ21maGdhdnp3b3J6bnVhZ3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTM5NDgsImV4cCI6MjA3NDk4OTk0OH0.-RE-UNmGNNNKBOMiTNQjtrOuHk2CmMP97EeGcnBM6pU"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);