-- 删除旧的检查约束
ALTER TABLE reddit_auto_config 
DROP CONSTRAINT IF EXISTS reddit_auto_config_hours_between_posts_check;

-- 添加新的检查约束，允许更小的值（大于0即可）
ALTER TABLE reddit_auto_config 
ADD CONSTRAINT reddit_auto_config_hours_between_posts_check 
CHECK (hours_between_posts > 0);