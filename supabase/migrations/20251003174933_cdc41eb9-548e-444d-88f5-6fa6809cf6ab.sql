
-- 为所有系列生成 series_slug
UPDATE coloring_pages
SET series_slug = lower(
  regexp_replace(
    regexp_replace(
      regexp_replace(series_title, '[^\w\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
)
WHERE series_id IS NOT NULL 
  AND series_title IS NOT NULL
  AND (series_slug IS NULL OR series_slug = '');

-- 验证结果
SELECT DISTINCT series_slug, series_title, COUNT(*) as page_count
FROM coloring_pages
WHERE series_id IS NOT NULL
GROUP BY series_slug, series_title
ORDER BY series_title;
