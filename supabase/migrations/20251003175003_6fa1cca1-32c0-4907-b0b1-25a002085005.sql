
-- 为所有系列补充 series_total 字段
WITH series_counts AS (
  SELECT 
    series_id,
    COUNT(*) as total_pages
  FROM coloring_pages
  WHERE series_id IS NOT NULL
  GROUP BY series_id
)
UPDATE coloring_pages
SET series_total = series_counts.total_pages
FROM series_counts
WHERE coloring_pages.series_id = series_counts.series_id
  AND (coloring_pages.series_total IS NULL OR coloring_pages.series_total = 0);

-- 验证结果
SELECT DISTINCT series_title, series_total, COUNT(*) as actual_count
FROM coloring_pages
WHERE series_id IS NOT NULL
GROUP BY series_title, series_total
ORDER BY series_title;
