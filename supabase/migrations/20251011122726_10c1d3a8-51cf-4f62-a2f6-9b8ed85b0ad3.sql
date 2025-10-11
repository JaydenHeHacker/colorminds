-- 临时回滚操作：将错误发布的页面改回草稿状态
UPDATE coloring_pages 
SET 
  status = 'draft',
  published_at = NULL 
WHERE status = 'published' 
  AND published_at >= '2025-10-11 12:23:00'::timestamptz
  AND published_at < '2025-10-11 12:25:00'::timestamptz;