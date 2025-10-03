-- Force update the All category to level 0
UPDATE categories
SET level = 0
WHERE slug = 'all' AND level = 1;

-- Then update parent_id for other categories
UPDATE categories c
SET parent_id = all_cat.id
FROM (SELECT id FROM categories WHERE slug = 'all') as all_cat
WHERE c.level = 1 AND c.slug != 'all';