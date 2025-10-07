-- 启用 pg_cron 扩展（如果未启用）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 创建定时任务：每2小时检查一次是否需要自动发布
-- 使用 pg_cron 调度任务
SELECT cron.schedule(
  'reddit-auto-post-job',
  '0 */2 * * *',  -- 每2小时的整点运行
  $$
  SELECT
    net.http_post(
      url := 'https://gggmfhgavzworznuagzv.supabase.co/functions/v1/auto-post-reddit',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnZ21maGdhdnp3b3J6bnVhZ3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTM5NDgsImV4cCI6MjA3NDk4OTk0OH0.-RE-UNmGNNNKBOMiTNQjtrOuHk2CmMP97EeGcnBM6pU"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);