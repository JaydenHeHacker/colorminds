-- 启用 pg_cron 扩展（如果还未启用）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 启用 pg_net 扩展用于 HTTP 请求
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 创建定时任务：每小时检查并发布到期的内容
SELECT cron.schedule(
  'auto-publish-scheduled-content',
  '0 * * * *', -- 每小时的第0分钟运行（例如：9:00, 10:00, 11:00）
  $$
  SELECT net.http_post(
    url:='https://gggmfhgavzworznuagzv.supabase.co/functions/v1/auto-publish-scheduled',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnZ21maGdhdnp3b3J6bnVhZ3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTM5NDgsImV4cCI6MjA3NDk4OTk0OH0.-RE-UNmGNNNKBOMiTNQjtrOuHk2CmMP97EeGcnBM6pU"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- 如果您想要更频繁的检查（每15分钟），可以使用：
-- SELECT cron.schedule(
--   'auto-publish-scheduled-content',
--   '*/15 * * * *', -- 每15分钟运行一次
--   $$ ... $$
-- );

-- 查看所有 cron 任务
-- SELECT * FROM cron.job;