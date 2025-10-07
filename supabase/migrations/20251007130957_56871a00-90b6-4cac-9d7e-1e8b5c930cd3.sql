-- 删除旧的 posts_per_day 检查约束
ALTER TABLE reddit_auto_config 
DROP CONSTRAINT IF EXISTS reddit_auto_config_posts_per_day_check;

-- 添加新的检查约束，允许更大的值用于测试
ALTER TABLE reddit_auto_config 
ADD CONSTRAINT reddit_auto_config_posts_per_day_check 
CHECK (posts_per_day >= 1 AND posts_per_day <= 100);