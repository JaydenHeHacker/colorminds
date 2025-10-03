
-- 为现有的系列图补充 series_id
-- 通过 series_title 分组，为每个系列生成唯一的 series_id

WITH series_groups AS (
  SELECT 
    series_title,
    gen_random_uuid() as new_series_id
  FROM coloring_pages
  WHERE series_title IS NOT NULL 
    AND series_id IS NULL
    AND series_order IS NOT NULL
  GROUP BY series_title
)
UPDATE coloring_pages
SET series_id = series_groups.new_series_id
FROM series_groups
WHERE coloring_pages.series_title = series_groups.series_title
  AND coloring_pages.series_id IS NULL
  AND coloring_pages.series_order IS NOT NULL;

-- 验证更新结果
SELECT 
  series_id,
  series_title,
  COUNT(*) as page_count
FROM coloring_pages
WHERE series_title IS NOT NULL
GROUP BY series_id, series_title
ORDER BY series_title;
