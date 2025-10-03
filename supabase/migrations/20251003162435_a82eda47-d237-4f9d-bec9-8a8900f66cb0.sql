-- Update all level 1 categories to have "all" as their parent
UPDATE categories
SET parent_id = (SELECT id FROM categories WHERE slug = 'all' AND level = 0 LIMIT 1)
WHERE level = 1 AND parent_id IS NULL;