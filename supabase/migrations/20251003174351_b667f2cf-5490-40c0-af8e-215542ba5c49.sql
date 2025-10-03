
-- 修复image_url字段中的JSON格式数据
-- 从JSON对象中提取imageUrl字段的值

UPDATE coloring_pages
SET image_url = (image_url::jsonb->>'imageUrl')::text
WHERE image_url::text LIKE '{%"imageUrl"%'
  AND image_url::text NOT LIKE 'http%';

-- 添加注释说明此次修复
COMMENT ON COLUMN coloring_pages.image_url IS 'Stores the direct URL to the coloring page image (fixed from JSON format on 2025-10-03)';
