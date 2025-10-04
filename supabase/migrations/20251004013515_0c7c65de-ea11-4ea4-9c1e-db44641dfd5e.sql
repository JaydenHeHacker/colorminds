-- 补充缺失的SEO关键类目
-- 1. 创建Ages父类目（年龄段）
INSERT INTO categories (name, slug, path, level, parent_id, description, icon, order_position)
SELECT 
  'Ages',
  'ages',
  'all/ages',
  2,
  id,
  'Browse free printable coloring pages by age group. Find perfect coloring activities for toddlers, preschoolers, kids, and teens.',
  '👶',
  15
FROM categories WHERE slug = 'all';

-- 2. 创建Difficulty父类目（难度）
INSERT INTO categories (name, slug, path, level, parent_id, description, icon, order_position)
SELECT 
  'Difficulty',
  'difficulty',
  'all/difficulty',
  2,
  id,
  'Choose coloring pages by difficulty level. From simple designs for beginners to intricate patterns for experienced colorists.',
  '⭐',
  16
FROM categories WHERE slug = 'all';

-- 3. 添加Ages子类目
-- Toddlers (2-3 years)
INSERT INTO categories (name, slug, path, level, parent_id, description, icon, order_position)
SELECT 
  'Toddlers (Ages 2-3)',
  'toddlers',
  'ages/toddlers',
  2,
  id,
  'Extra simple coloring pages perfect for toddlers ages 2-3. Large shapes, thick lines, and easy designs to develop fine motor skills.',
  '👶',
  1
FROM categories WHERE slug = 'ages';

-- Preschool (3-5 years)
INSERT INTO categories (name, slug, path, level, parent_id, description, icon, order_position)
SELECT 
  'Preschool (Ages 3-5)',
  'preschool',
  'ages/preschool',
  2,
  id,
  'Fun coloring pages designed for preschoolers ages 3-5. Simple shapes and familiar objects to encourage creativity and learning.',
  '🎨',
  2
FROM categories WHERE slug = 'ages';

-- Elementary (6-10 years)
INSERT INTO categories (name, slug, path, level, parent_id, description, icon, order_position)
SELECT 
  'Elementary (Ages 6-10)',
  'elementary',
  'ages/elementary',
  2,
  id,
  'Engaging coloring pages for elementary school children ages 6-10. More detailed designs to challenge growing artistic skills.',
  '✏️',
  3
FROM categories WHERE slug = 'ages';

-- Teens (11-17 years)
INSERT INTO categories (name, slug, path, level, parent_id, description, icon, order_position)
SELECT 
  'Teens (Ages 11-17)',
  'teens',
  'ages/teens',
  2,
  id,
  'Cool and trendy coloring pages for teens ages 11-17. Intricate designs, patterns, and themes that appeal to young adults.',
  '🎧',
  4
FROM categories WHERE slug = 'ages';

-- 4. 更新Easy类目，移到Difficulty下
UPDATE categories 
SET 
  parent_id = (SELECT id FROM categories WHERE slug = 'difficulty'),
  path = 'difficulty/easy',
  description = 'Easy coloring pages perfect for beginners and young children. Simple shapes and designs with minimal details.',
  order_position = 1
WHERE slug = 'easy';

-- 5. 添加Medium和Hard难度类目
-- Medium difficulty
INSERT INTO categories (name, slug, path, level, parent_id, description, icon, order_position)
SELECT 
  'Medium',
  'medium',
  'difficulty/medium',
  2,
  id,
  'Medium difficulty coloring pages with moderate detail. Perfect for kids ages 7-10 and casual adult colorists.',
  '🟡',
  2
FROM categories WHERE slug = 'difficulty';

-- Hard difficulty
INSERT INTO categories (name, slug, path, level, parent_id, description, icon, order_position)
SELECT 
  'Hard',
  'hard',
  'difficulty/hard',
  2,
  id,
  'Challenging coloring pages with intricate details and complex patterns. Ideal for experienced colorists, teens, and adults.',
  '🔴',
  3
FROM categories WHERE slug = 'difficulty';

-- 6. 补充热门角色（基于搜索量数据）
-- Barbie
INSERT INTO categories (name, slug, path, level, parent_id, description, icon, order_position)
SELECT 
  'Barbie',
  'barbie',
  'characters/barbie',
  2,
  id,
  'Free printable Barbie coloring pages. Dress up Barbie in beautiful outfits and accessories. Perfect for fashion-loving kids!',
  '👗',
  20
FROM categories WHERE slug = 'characters';

-- Frozen/Elsa
INSERT INTO categories (name, slug, path, level, parent_id, description, icon, order_position)
SELECT 
  'Frozen',
  'frozen',
  'characters/frozen',
  2,
  id,
  'Free printable Frozen coloring pages featuring Elsa, Anna, Olaf and more. Let it go with magical Disney Frozen designs!',
  '❄️',
  21
FROM categories WHERE slug = 'characters';

-- Paw Patrol
INSERT INTO categories (name, slug, path, level, parent_id, description, icon, order_position)
SELECT 
  'Paw Patrol',
  'paw-patrol',
  'characters/paw-patrol',
  2,
  id,
  'Free printable Paw Patrol coloring pages with Chase, Marshall, Skye and the whole rescue team. No job is too big, no pup is too small!',
  '🐕',
  22
FROM categories WHERE slug = 'characters';

-- Spongebob
INSERT INTO categories (name, slug, path, level, parent_id, description, icon, order_position)
SELECT 
  'SpongeBob',
  'spongebob',
  'characters/spongebob',
  2,
  id,
  'Free printable SpongeBob SquarePants coloring pages. Color SpongeBob, Patrick, Squidward and friends from Bikini Bottom!',
  '🧽',
  23
FROM categories WHERE slug = 'characters';