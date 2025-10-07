-- 修改 hours_between_posts 字段类型以支持小数
ALTER TABLE reddit_auto_config 
ALTER COLUMN hours_between_posts TYPE numeric(10, 3);