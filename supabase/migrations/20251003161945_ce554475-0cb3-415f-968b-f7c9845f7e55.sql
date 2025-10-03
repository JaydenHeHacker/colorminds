-- Create the root "All" category
INSERT INTO categories (
  name,
  slug,
  path,
  description,
  icon,
  parent_id,
  level,
  order_position
) VALUES (
  'All',
  'all',
  'all',
  'Browse all coloring pages from every category',
  '🎨',
  NULL,
  0,
  0
)
ON CONFLICT (slug) DO NOTHING;

-- Update existing level 1 categories to level 1 (they are children of "All")
-- This keeps the current structure but adds "All" as the root