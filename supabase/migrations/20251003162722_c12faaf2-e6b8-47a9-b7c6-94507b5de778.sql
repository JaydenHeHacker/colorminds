-- Step 1: Update the existing "All" category to be level 0 (root)
UPDATE categories
SET level = 0, parent_id = NULL
WHERE slug = 'all';

-- Step 2: Update all other level 1 categories to have "all" as their parent
UPDATE categories
SET parent_id = (SELECT id FROM categories WHERE slug = 'all' LIMIT 1)
WHERE level = 1 AND slug != 'all' AND parent_id IS NULL;