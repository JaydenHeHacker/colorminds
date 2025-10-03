-- 创建系统设置表
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 插入自动生成开关设置（默认关闭）
INSERT INTO system_settings (key, value, description)
VALUES ('auto_generate_enabled', 'false', 'Enable or disable automatic draft generation')
ON CONFLICT (key) DO NOTHING;

-- 创建生成统计表
CREATE TABLE IF NOT EXISTS generation_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_at TIMESTAMPTZ NOT NULL,
  category_id UUID REFERENCES categories(id),
  generation_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  pages_count INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 创建定时任务：每分钟自动生成草稿
SELECT cron.schedule(
  'auto-generate-drafts-job',
  '* * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://gggmfhgavzworznuagzv.supabase.co/functions/v1/auto-generate-drafts',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnZ21maGdhdnp3b3J6bnVhZ3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTM5NDgsImV4cCI6MjA3NDk4OTk0OH0.-RE-UNmGNNNKBOMiTNQjtrOuHk2CmMP97EeGcnBM6pU"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);