-- 创建 Reddit 自动发布配置表
CREATE TABLE IF NOT EXISTS public.reddit_auto_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT false,
  posts_per_day INTEGER DEFAULT 2 CHECK (posts_per_day >= 1 AND posts_per_day <= 5),
  hours_between_posts INTEGER DEFAULT 6 CHECK (hours_between_posts >= 2),
  max_replies_per_post INTEGER DEFAULT 3 CHECK (max_replies_per_post >= 0 AND max_replies_per_post <= 10),
  minutes_between_replies INTEGER DEFAULT 30 CHECK (minutes_between_replies >= 10),
  allowed_subreddits TEXT[] DEFAULT ARRAY['test', 'coloring', 'ColoringPages', 'crafts'],
  last_post_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS 策略
ALTER TABLE public.reddit_auto_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own config"
  ON public.reddit_auto_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own config"
  ON public.reddit_auto_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own config"
  ON public.reddit_auto_config FOR UPDATE
  USING (auth.uid() = user_id);

-- 更新 social_posts 表，添加更多字段
ALTER TABLE public.social_posts 
ADD COLUMN IF NOT EXISTS subreddit TEXT,
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

-- 创建索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_social_posts_subreddit ON public.social_posts(subreddit);
CREATE INDEX IF NOT EXISTS idx_social_posts_posted_at ON public.social_posts(posted_at);
CREATE INDEX IF NOT EXISTS idx_reddit_config_user ON public.reddit_auto_config(user_id);

-- 更新时间戳触发器
CREATE OR REPLACE FUNCTION update_reddit_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reddit_config_timestamp
  BEFORE UPDATE ON public.reddit_auto_config
  FOR EACH ROW
  EXECUTE FUNCTION update_reddit_config_updated_at();