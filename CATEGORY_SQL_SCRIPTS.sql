-- ============================================
-- 类目补充 SQL 脚本
-- Category Expansion SQL Scripts
-- ============================================
-- 
-- 使用说明:
-- 1. 按照CATEGORY_EXPANSION_PLAN.md中的日期顺序执行
-- 2. 每批执行前确保已准备好对应的内容
-- 3. 执行后验证类目是否正确创建
-- 4. 更新sitemap并提交到Google Search Console
--
-- ============================================

-- ============================================
-- 第二批类目 (执行日期: 2025-10-19)
-- 主题: 热门动物 + 交通工具 + 角色
-- 月搜索量: +126,800
-- ============================================

-- Animals 分类下的动物
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Tiger', 
    'tiger', 
    'e0a4e139-2a31-49ef-bc4d-d202db95cf1a', 
    3, 
    'all/animals/tiger', 
    'Fierce tiger coloring pages with jungle cats, stripes, and wild adventure scenes',
    203
  ),
  (
    'Monkey', 
    'monkey', 
    'e0a4e139-2a31-49ef-bc4d-d202db95cf1a', 
    3, 
    'all/animals/monkey', 
    'Playful monkey coloring pages featuring jungle adventures and cute baby monkeys',
    204
  ),
  (
    'Bear', 
    'bear', 
    'e0a4e139-2a31-49ef-bc4d-d202db95cf1a', 
    3, 
    'all/animals/bear', 
    'Adorable bear coloring pages with teddy bears, polar bears, and forest scenes',
    205
  );

-- All 分类下的交通工具
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Car', 
    'car', 
    '024e78f3-bfc1-4d89-8685-bd02aedb1f04', 
    2, 
    'all/car', 
    'Exciting car coloring pages with race cars, sports cars, and cool automobiles',
    403
  ),
  (
    'Airplane', 
    'airplane', 
    '024e78f3-bfc1-4d89-8685-bd02aedb1f04', 
    2, 
    'all/airplane', 
    'Amazing airplane coloring pages featuring jets, planes, and flying adventures',
    404
  ),
  (
    'Train', 
    'train', 
    '024e78f3-bfc1-4d89-8685-bd02aedb1f04', 
    2, 
    'all/train', 
    'Fun train coloring pages with steam engines, locomotives, and railway scenes',
    405
  );

-- Characters 分类下的角色
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Robot', 
    'robot', 
    (SELECT id FROM categories WHERE slug = 'characters' LIMIT 1), 
    3, 
    'all/characters/robot', 
    'Cool robot coloring pages with futuristic machines and mechanical friends',
    500
  ),
  (
    'Superhero', 
    'superhero', 
    (SELECT id FROM categories WHERE slug = 'characters' LIMIT 1), 
    3, 
    'all/characters/superhero', 
    'Action-packed superhero coloring pages with heroes, powers, and adventures',
    501
  );


-- ============================================
-- 第三批类目 (执行日期: 2025-10-26)
-- 主题: 自然元素 + 食物
-- 月搜索量: +97,400
-- ============================================

-- Nature 分类下的自然元素
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Sun', 
    'sun', 
    '15b89cbf-2f46-4cff-8395-85dcf6c49d78', 
    3, 
    'all/nature/sun', 
    'Bright sun coloring pages with sunshine, happy suns, and summer scenes',
    301
  ),
  (
    'Moon', 
    'moon', 
    '15b89cbf-2f46-4cff-8395-85dcf6c49d78', 
    3, 
    'all/nature/moon', 
    'Magical moon coloring pages with crescent moons, stars, and night sky scenes',
    302
  ),
  (
    'Star', 
    'star', 
    '15b89cbf-2f46-4cff-8395-85dcf6c49d78', 
    3, 
    'all/nature/star', 
    'Sparkling star coloring pages featuring shooting stars, constellations, and night magic',
    303
  ),
  (
    'Cloud', 
    'cloud', 
    '15b89cbf-2f46-4cff-8395-85dcf6c49d78', 
    3, 
    'all/nature/cloud', 
    'Fluffy cloud coloring pages with sky scenes, weather, and dreamy landscapes',
    304
  );

-- All 分类下的食物
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Apple', 
    'apple', 
    '024e78f3-bfc1-4d89-8685-bd02aedb1f04', 
    2, 
    'all/apple', 
    'Fresh apple coloring pages with fruit designs, orchard scenes, and healthy snacks',
    406
  ),
  (
    'Ice Cream', 
    'ice-cream', 
    '024e78f3-bfc1-4d89-8685-bd02aedb1f04', 
    2, 
    'all/ice-cream', 
    'Delicious ice cream coloring pages with cones, sundaes, and sweet frozen treats',
    407
  ),
  (
    'Cupcake', 
    'cupcake', 
    '024e78f3-bfc1-4d89-8685-bd02aedb1f04', 
    2, 
    'all/cupcake', 
    'Sweet cupcake coloring pages with frosting, sprinkles, and bakery designs',
    408
  ),
  (
    'Pizza', 
    'pizza', 
    '024e78f3-bfc1-4d89-8685-bd02aedb1f04', 
    2, 
    'all/pizza', 
    'Yummy pizza coloring pages with toppings, slices, and Italian food fun',
    409
  );


-- ============================================
-- 第四批类目 (执行日期: 2025-11-02)
-- 主题: 季节主题 + 海洋生物
-- 月搜索量: +95,400
-- ============================================

-- Seasons 分类下的季节元素
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Snowman', 
    'snowman', 
    (SELECT id FROM categories WHERE slug = 'winter' LIMIT 1), 
    3, 
    'all/seasons/winter/snowman', 
    'Jolly snowman coloring pages with winter scenes, snow activities, and frosty friends',
    600
  ),
  (
    'Pumpkin', 
    'pumpkin', 
    (SELECT id FROM categories WHERE slug = 'fall' LIMIT 1), 
    3, 
    'all/seasons/fall/pumpkin', 
    'Festive pumpkin coloring pages perfect for Halloween and autumn celebrations',
    601
  ),
  (
    'Beach', 
    'beach', 
    (SELECT id FROM categories WHERE slug = 'summer' LIMIT 1), 
    3, 
    'all/seasons/summer/beach', 
    'Fun beach coloring pages with sand, surf, and summer vacation scenes',
    602
  );

-- Sea Animals 分类下的海洋生物
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Turtle', 
    'turtle', 
    (SELECT id FROM categories WHERE slug = 'sea-animals' LIMIT 1), 
    3, 
    'all/animals/sea-animals/turtle', 
    'Cute turtle coloring pages with sea turtles, tortoises, and ocean adventures',
    700
  ),
  (
    'Dolphin', 
    'dolphin', 
    (SELECT id FROM categories WHERE slug = 'sea-animals' LIMIT 1), 
    3, 
    'all/animals/sea-animals/dolphin', 
    'Playful dolphin coloring pages featuring ocean friends and underwater fun',
    701
  ),
  (
    'Shark', 
    'shark', 
    (SELECT id FROM categories WHERE slug = 'sea-animals' LIMIT 1), 
    3, 
    'all/animals/sea-animals/shark', 
    'Exciting shark coloring pages with ocean predators and deep sea adventures',
    702
  ),
  (
    'Octopus', 
    'octopus', 
    (SELECT id FROM categories WHERE slug = 'sea-animals' LIMIT 1), 
    3, 
    'all/animals/sea-animals/octopus', 
    'Amazing octopus coloring pages with eight arms, underwater scenes, and sea life',
    703
  ),
  (
    'Whale', 
    'whale', 
    (SELECT id FROM categories WHERE slug = 'sea-animals' LIMIT 1), 
    3, 
    'all/animals/sea-animals/whale', 
    'Majestic whale coloring pages with ocean giants, blue whales, and marine mammals',
    704
  );


-- ============================================
-- 第五批类目 (执行日期: 2025-11-09)
-- 主题: 职业 + 运动
-- 月搜索量: +78,300
-- ============================================

-- All 分类下的职业
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Firefighter', 
    'firefighter', 
    '024e78f3-bfc1-4d89-8685-bd02aedb1f04', 
    2, 
    'all/firefighter', 
    'Heroic firefighter coloring pages with fire trucks, rescue scenes, and brave heroes',
    410
  ),
  (
    'Police', 
    'police', 
    '024e78f3-bfc1-4d89-8685-bd02aedb1f04', 
    2, 
    'all/police', 
    'Brave police officer coloring pages with patrol cars, badges, and community helpers',
    411
  ),
  (
    'Doctor', 
    'doctor', 
    '024e78f3-bfc1-4d89-8685-bd02aedb1f04', 
    2, 
    'all/doctor', 
    'Caring doctor coloring pages with medical tools, hospitals, and healthcare heroes',
    412
  ),
  (
    'Teacher', 
    'teacher', 
    '024e78f3-bfc1-4d89-8685-bd02aedb1f04', 
    2, 
    'all/teacher', 
    'Inspiring teacher coloring pages with classroom scenes, books, and education',
    413
  );

-- All 分类下的运动
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Soccer', 
    'soccer', 
    '024e78f3-bfc1-4d89-8685-bd02aedb1f04', 
    2, 
    'all/soccer', 
    'Action-packed soccer coloring pages with players, balls, and exciting matches',
    414
  ),
  (
    'Basketball', 
    'basketball', 
    '024e78f3-bfc1-4d89-8685-bd02aedb1f04', 
    2, 
    'all/basketball', 
    'Dynamic basketball coloring pages with hoops, players, and court action',
    415
  ),
  (
    'Baseball', 
    'baseball', 
    '024e78f3-bfc1-4d89-8685-bd02aedb1f04', 
    2, 
    'all/baseball', 
    'Classic baseball coloring pages with bats, gloves, and America''s favorite pastime',
    416
  ),
  (
    'Ballerina', 
    'ballerina', 
    '024e78f3-bfc1-4d89-8685-bd02aedb1f04', 
    2, 
    'all/ballerina', 
    'Graceful ballerina coloring pages with dancers, tutus, and elegant performances',
    417
  );


-- ============================================
-- 第六批类目 (执行日期: 2025-11-16)
-- 主题: 补充动物 + 幻想元素
-- 月搜索量: +74,000
-- ============================================

-- Animals 分类下的补充动物
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Giraffe', 
    'giraffe', 
    'e0a4e139-2a31-49ef-bc4d-d202db95cf1a', 
    3, 
    'all/animals/giraffe', 
    'Tall giraffe coloring pages with long necks, spots, and African savanna scenes',
    206
  ),
  (
    'Zebra', 
    'zebra', 
    'e0a4e139-2a31-49ef-bc4d-d202db95cf1a', 
    3, 
    'all/animals/zebra', 
    'Striped zebra coloring pages with black and white patterns and wildlife scenes',
    207
  ),
  (
    'Penguin', 
    'penguin', 
    'e0a4e139-2a31-49ef-bc4d-d202db95cf1a', 
    3, 
    'all/animals/penguin', 
    'Adorable penguin coloring pages with Antarctic birds, ice, and winter fun',
    208
  ),
  (
    'Owl', 
    'owl', 
    'e0a4e139-2a31-49ef-bc4d-d202db95cf1a', 
    3, 
    'all/animals/owl', 
    'Wise owl coloring pages with night birds, forest scenes, and feathered friends',
    209
  ),
  (
    'Bee', 
    'bee', 
    'e0a4e139-2a31-49ef-bc4d-d202db95cf1a', 
    3, 
    'all/animals/bee', 
    'Busy bee coloring pages with honeybees, hives, and pollination adventures',
    210
  ),
  (
    'Ladybug', 
    'ladybug', 
    'e0a4e139-2a31-49ef-bc4d-d202db95cf1a', 
    3, 
    'all/animals/ladybug', 
    'Cute ladybug coloring pages with red beetles, spots, and garden insects',
    211
  );

-- Fantasy 分类下的幻想元素
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Castle', 
    'castle', 
    'af75fa73-0a2c-4020-8e3d-c81b8e704f16', 
    3, 
    'all/fantasy/castle', 
    'Magnificent castle coloring pages with royal fortresses, towers, and medieval scenes',
    103
  ),
  (
    'Crown', 
    'crown', 
    'af75fa73-0a2c-4020-8e3d-c81b8e704f16', 
    3, 
    'all/fantasy/crown', 
    'Royal crown coloring pages with jewels, tiaras, and regal accessories',
    104
  );


-- ============================================
-- 验证查询
-- Verification Queries
-- ============================================

-- 查看所有新增类目
-- SELECT name, slug, path, level, order_position 
-- FROM categories 
-- WHERE slug IN (
--   'tiger', 'monkey', 'bear', 'car', 'airplane', 'train', 'robot', 'superhero',
--   'sun', 'moon', 'star', 'cloud', 'apple', 'ice-cream', 'cupcake', 'pizza',
--   'snowman', 'pumpkin', 'beach', 'turtle', 'dolphin', 'shark', 'octopus', 'whale',
--   'firefighter', 'police', 'doctor', 'teacher', 'soccer', 'basketball', 'baseball', 'ballerina',
--   'giraffe', 'zebra', 'penguin', 'owl', 'bee', 'ladybug', 'castle', 'crown'
-- )
-- ORDER BY order_position;

-- 统计每个父类目下的子类目数量
-- SELECT 
--   p.name as parent_name,
--   p.slug as parent_slug,
--   COUNT(c.id) as child_count
-- FROM categories p
-- LEFT JOIN categories c ON c.parent_id = p.id
-- WHERE p.level <= 2
-- GROUP BY p.id, p.name, p.slug
-- ORDER BY child_count DESC;
