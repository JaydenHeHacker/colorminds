-- ============================================
-- 完整类目扩展 SQL 脚本
-- Complete Category Expansion SQL Scripts
-- 基于CSV分析 10120822 真实数据
-- ============================================
--
-- 使用说明:
-- 1. 按照COMPLETE_CATEGORY_EXPANSION.md中的时间表执行
-- 2. 每批执行前确保已准备8-10个着色页内容
-- 3. 执行后验证类目创建成功
-- 4. 更新sitemap并提交Google Search Console
--
-- ============================================


-- ============================================
-- 第二批类目 (执行日期: 2025-10-19)
-- 数据来源: CSV分析 Golden Score 40-68
-- 预计月搜索量: +134,610
-- ============================================

-- Stitch (Lilo & Stitch角色) - Characters分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Stitch', 
    'stitch', 
    (SELECT id FROM categories WHERE slug = 'characters' LIMIT 1), 
    3, 
    'all/characters/stitch', 
    'Adorable Stitch coloring pages featuring everyone''s favorite blue alien from Lilo & Stitch',
    502
  );

-- Letter (字母学习) - All分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Letter', 
    'letter', 
    '024e78f3-bfc1-4d89-8685-bd02aedb1f04', 
    2, 
    'all/letter', 
    'Educational letter coloring pages with alphabet learning activities and fun designs',
    418
  );

-- Puppy (小狗) - Animals分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Puppy', 
    'puppy', 
    'e0a4e139-2a31-49ef-bc4d-d202db95cf1a', 
    3, 
    'all/animals/puppy', 
    'Cute puppy coloring pages with adorable baby dogs, playful puppies, and furry friends',
    212
  );

-- Disney Princess (迪士尼公主) - Characters分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Disney Princess', 
    'disney-princess', 
    (SELECT id FROM categories WHERE slug = 'characters' LIMIT 1), 
    3, 
    'all/characters/disney-princess', 
    'Magical Disney Princess coloring pages with Belle, Jasmine, Tiana, Rapunzel, and more',
    503
  );

-- Turtle (乌龟/海龟) - Sea Animals分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Turtle', 
    'turtle', 
    (SELECT id FROM categories WHERE slug = 'sea-animals' LIMIT 1), 
    3, 
    'all/animals/sea-animals/turtle', 
    'Peaceful turtle coloring pages with sea turtles, tortoises, and ocean adventures',
    705
  );

-- Shark (鲨鱼) - Sea Animals分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Shark', 
    'shark', 
    (SELECT id FROM categories WHERE slug = 'sea-animals' LIMIT 1), 
    3, 
    'all/animals/sea-animals/shark', 
    'Thrilling shark coloring pages with great whites, hammerheads, and ocean predators',
    706
  );


-- ============================================
-- 第三批类目 (执行日期: 2025-10-26)
-- 数据来源: CSV分析 Golden Score 30-39
-- 预计月搜索量: +114,380
-- ============================================

-- Animal (通用动物) - All分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Animal', 
    'animal', 
    '024e78f3-bfc1-4d89-8685-bd02aedb1f04', 
    2, 
    'all/animal', 
    'Wide variety of animal coloring pages featuring cute and wild creatures from around the world',
    419
  );

-- Coloring Book (涂色书系列) - All分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Coloring Book', 
    'coloring-book', 
    '024e78f3-bfc1-4d89-8685-bd02aedb1f04', 
    2, 
    'all/coloring-book', 
    'Coloring book style pages with intricate designs perfect for creating your own art collection',
    420
  );

-- Bible (圣经主题) - All分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Bible', 
    'bible', 
    '024e78f3-bfc1-4d89-8685-bd02aedb1f04', 
    2, 
    'all/bible', 
    'Inspirational Bible coloring pages with religious scenes, scripture verses, and faith-based designs',
    421
  );

-- Car (汽车) - All分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Car', 
    'car', 
    '024e78f3-bfc1-4d89-8685-bd02aedb1f04', 
    2, 
    'all/car', 
    'Cool car coloring pages featuring race cars, sports cars, classic automobiles, and dream vehicles',
    422
  );


-- ============================================
-- 第四批类目 (执行日期: 2025-11-02)
-- 数据来源: CSV分析 Golden Score 25-29
-- 预计月搜索量: +75,590
-- ============================================

-- Kitten (小猫) - Animals分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Kitten', 
    'kitten', 
    'e0a4e139-2a31-49ef-bc4d-d202db95cf1a', 
    3, 
    'all/animals/kitten', 
    'Adorable kitten coloring pages with cute baby cats, playful kittens, and fluffy felines',
    213
  );

-- Spider (蜘蛛) - Animals分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Spider', 
    'spider', 
    'e0a4e139-2a31-49ef-bc4d-d202db95cf1a', 
    3, 
    'all/animals/spider', 
    'Creepy spider coloring pages perfect for Halloween and insect enthusiasts',
    214
  );

-- Valentine (情人节) - Holidays分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Valentine', 
    'valentine', 
    (SELECT id FROM categories WHERE slug = 'holidays' LIMIT 1), 
    3, 
    'all/holidays/valentine', 
    'Romantic Valentine coloring pages with hearts, cupids, love messages, and sweet designs',
    800
  );

-- Fish (鱼) - Sea Animals分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Fish', 
    'fish', 
    (SELECT id FROM categories WHERE slug = 'sea-animals' LIMIT 1), 
    3, 
    'all/animals/sea-animals/fish', 
    'Colorful fish coloring pages with tropical fish, goldfish, and underwater scenes',
    707
  );


-- ============================================
-- 第五批类目 (执行日期: 2025-11-09)
-- 数据来源: CSV分析 Golden Score 22-24
-- 预计月搜索量: +75,850
-- ============================================

-- Train (火车) - All分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Train', 
    'train', 
    '024e78f3-bfc1-4d89-8685-bd02aedb1f04', 
    2, 
    'all/train', 
    'Exciting train coloring pages with steam engines, locomotives, passenger trains, and railway adventures',
    423
  );

-- Bunny (兔子) - Animals分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Bunny', 
    'bunny', 
    'e0a4e139-2a31-49ef-bc4d-d202db95cf1a', 
    3, 
    'all/animals/bunny', 
    'Cute bunny coloring pages with adorable rabbits, Easter bunnies, and fluffy cottontails',
    215
  );

-- Whale (鲸鱼) - Sea Animals分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Whale', 
    'whale', 
    (SELECT id FROM categories WHERE slug = 'sea-animals' LIMIT 1), 
    3, 
    'all/animals/sea-animals/whale', 
    'Majestic whale coloring pages featuring blue whales, humpbacks, and ocean giants',
    708
  );

-- Wolf (狼) - Animals分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Wolf', 
    'wolf', 
    'e0a4e139-2a31-49ef-bc4d-d202db95cf1a', 
    3, 
    'all/animals/wolf', 
    'Powerful wolf coloring pages with wild wolves, pack scenes, and forest adventures',
    216
  );

-- Ocean (海洋) - Nature分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Ocean', 
    'ocean', 
    '15b89cbf-2f46-4cff-8395-85dcf6c49d78', 
    3, 
    'all/nature/ocean', 
    'Beautiful ocean coloring pages with waves, beaches, marine life, and underwater scenes',
    305
  );


-- ============================================
-- 第六批类目 (执行日期: 2025-11-16)
-- 数据来源: CSV分析 Golden Score 20-21
-- 预计月搜索量: +130,160
-- ============================================

-- Monkey (猴子) - Animals分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Monkey', 
    'monkey', 
    'e0a4e139-2a31-49ef-bc4d-d202db95cf1a', 
    3, 
    'all/animals/monkey', 
    'Playful monkey coloring pages with jungle monkeys, chimps, and swinging adventures',
    217
  );

-- Fox (狐狸) - Animals分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Fox', 
    'fox', 
    'e0a4e139-2a31-49ef-bc4d-d202db95cf1a', 
    3, 
    'all/animals/fox', 
    'Clever fox coloring pages with red foxes, arctic foxes, and woodland scenes',
    218
  );

-- Dolphin (海豚) - Sea Animals分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Dolphin', 
    'dolphin', 
    (SELECT id FROM categories WHERE slug = 'sea-animals' LIMIT 1), 
    3, 
    'all/animals/sea-animals/dolphin', 
    'Friendly dolphin coloring pages with jumping dolphins, ocean friends, and marine playfulness',
    709
  );

-- Penguin (企鹅) - Animals分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Penguin', 
    'penguin', 
    'e0a4e139-2a31-49ef-bc4d-d202db95cf1a', 
    3, 
    'all/animals/penguin', 
    'Cute penguin coloring pages with Antarctic penguins, baby penguins, and icy adventures',
    219
  );

-- Bear (熊) - Animals分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Bear', 
    'bear', 
    'e0a4e139-2a31-49ef-bc4d-d202db95cf1a', 
    3, 
    'all/animals/bear', 
    'Adorable bear coloring pages with teddy bears, grizzlies, polar bears, and forest friends',
    220
  );

-- Airplane (飞机) - All分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Airplane', 
    'airplane', 
    '024e78f3-bfc1-4d89-8685-bd02aedb1f04', 
    2, 
    'all/airplane', 
    'Exciting airplane coloring pages with jets, planes, helicopters, and flying adventures',
    424
  );

-- Race Car (赛车) - All分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Race Car', 
    'race-car', 
    '024e78f3-bfc1-4d89-8685-bd02aedb1f04', 
    2, 
    'all/race-car', 
    'Fast race car coloring pages with Formula 1, NASCAR, and high-speed racing action',
    425
  );

-- Fire Truck (消防车) - Vehicles分类  
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Fire Truck', 
    'fire-truck', 
    (SELECT id FROM categories WHERE slug = 'vehicle' LIMIT 1), 
    2, 
    'all/vehicle/fire-truck', 
    'Heroic fire truck coloring pages with firetrucks, firefighters, and rescue vehicles',
    510
  );

-- Rocket (火箭) - All分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Rocket', 
    'rocket', 
    '024e78f3-bfc1-4d89-8685-bd02aedb1f04', 
    2, 
    'all/rocket', 
    'Futuristic rocket coloring pages with space rockets, astronauts, and galaxy adventures',
    426
  );

-- Snowman (雪人) - Winter分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Snowman', 
    'snowman', 
    (SELECT id FROM categories WHERE slug = 'winter' LIMIT 1), 
    3, 
    'all/seasons/winter/snowman', 
    'Jolly snowman coloring pages with winter fun, snow activities, and frosty friends',
    603
  );


-- ============================================
-- 第七批类目 (执行日期: 2025-11-23)
-- 数据来源: CSV分析 - 补充高价值类目
-- 预计月搜索量: +108,600
-- ============================================

-- Tiger (老虎) - Animals分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Tiger', 
    'tiger', 
    'e0a4e139-2a31-49ef-bc4d-d202db95cf1a', 
    3, 
    'all/animals/tiger', 
    'Fierce tiger coloring pages with striped tigers, jungle cats, and wildlife scenes',
    221
  );

-- Superhero (超级英雄) - Characters分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Superhero', 
    'superhero', 
    (SELECT id FROM categories WHERE slug = 'characters' LIMIT 1), 
    3, 
    'all/characters/superhero', 
    'Action-packed superhero coloring pages with heroes, powers, capes, and adventures',
    504
  );

-- Pumpkin (南瓜) - Fall分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Pumpkin', 
    'pumpkin', 
    (SELECT id FROM categories WHERE slug = 'fall' LIMIT 1), 
    3, 
    'all/seasons/fall/pumpkin', 
    'Festive pumpkin coloring pages perfect for Halloween, autumn harvest, and fall fun',
    604
  );

-- Robot (机器人) - Characters分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Robot', 
    'robot', 
    (SELECT id FROM categories WHERE slug = 'characters' LIMIT 1), 
    3, 
    'all/characters/robot', 
    'Cool robot coloring pages with futuristic robots, machines, and sci-fi adventures',
    505
  );

-- Frog (青蛙) - Animals分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Frog', 
    'frog', 
    'e0a4e139-2a31-49ef-bc4d-d202db95cf1a', 
    3, 
    'all/animals/frog', 
    'Cute frog coloring pages with pond frogs, tree frogs, and amphibian adventures',
    222
  );

-- Giraffe (长颈鹿) - Animals分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Giraffe', 
    'giraffe', 
    'e0a4e139-2a31-49ef-bc4d-d202db95cf1a', 
    3, 
    'all/animals/giraffe', 
    'Tall giraffe coloring pages with long necks, spots, and African savanna scenes',
    223
  );

-- Owl (猫头鹰) - Animals分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Owl', 
    'owl', 
    'e0a4e139-2a31-49ef-bc4d-d202db95cf1a', 
    3, 
    'all/animals/owl', 
    'Wise owl coloring pages with night owls, barn owls, and forest bird scenes',
    224
  );

-- T-Rex (霸王龙) - Dinosaurs分类 (作为Dinosaur的子类目)
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'T-Rex', 
    't-rex', 
    (SELECT id FROM categories WHERE slug = 'dinosaur' LIMIT 1), 
    4, 
    'all/animals/dinosaur/t-rex', 
    'Mighty T-Rex coloring pages with the king of dinosaurs and prehistoric adventures',
    900
  );

-- Castle (城堡) - Fantasy分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Castle', 
    'castle', 
    'af75fa73-0a2c-4020-8e3d-c81b8e704f16', 
    3, 
    'all/fantasy/castle', 
    'Majestic castle coloring pages with medieval fortresses, towers, and royal kingdoms',
    105
  );

-- Crown (王冠) - Fantasy分类
INSERT INTO categories (name, slug, parent_id, level, path, description, order_position)
VALUES 
  (
    'Crown', 
    'crown', 
    'af75fa73-0a2c-4020-8e3d-c81b8e704f16', 
    3, 
    'all/fantasy/crown', 
    'Royal crown coloring pages with jewels, tiaras, and regal accessories',
    106
  );


-- ============================================
-- 验证查询 (Verification Queries)
-- ============================================

-- 查看所有新增类目 (按批次)
/*
-- 第二批 (2025-10-19)
SELECT name, slug, path, level 
FROM categories 
WHERE slug IN ('stitch', 'letter', 'puppy', 'disney-princess', 'turtle', 'shark')
ORDER BY slug;

-- 第三批 (2025-10-26)
SELECT name, slug, path, level 
FROM categories 
WHERE slug IN ('animal', 'coloring-book', 'bible', 'car')
ORDER BY slug;

-- 第四批 (2025-11-02)
SELECT name, slug, path, level 
FROM categories 
WHERE slug IN ('kitten', 'spider', 'valentine', 'fish')
ORDER BY slug;

-- 第五批 (2025-11-09)
SELECT name, slug, path, level 
FROM categories 
WHERE slug IN ('train', 'bunny', 'whale', 'wolf', 'ocean')
ORDER BY slug;

-- 第六批 (2025-11-16)
SELECT name, slug, path, level 
FROM categories 
WHERE slug IN ('monkey', 'fox', 'dolphin', 'penguin', 'bear', 'airplane', 'race-car', 'fire-truck', 'rocket', 'snowman')
ORDER BY slug;

-- 第七批 (2025-11-23)
SELECT name, slug, path, level 
FROM categories 
WHERE slug IN ('tiger', 'superhero', 'pumpkin', 'robot', 'frog', 'giraffe', 'owl', 't-rex', 'castle', 'crown')
ORDER BY slug;
*/

-- 统计新增类目总数
/*
SELECT COUNT(*) as new_categories_count
FROM categories 
WHERE created_at > '2025-10-12';
*/

-- 按父类目统计子类目数量
/*
SELECT 
  p.name as parent_name,
  p.slug as parent_slug,
  COUNT(c.id) as child_count
FROM categories p
LEFT JOIN categories c ON c.parent_id = p.id
GROUP BY p.id, p.name, p.slug
HAVING COUNT(c.id) > 0
ORDER BY child_count DESC;
*/

-- 查看各批次类目的搜索量分布（需要手动标记批次）
/*
SELECT 
  CASE 
    WHEN slug IN ('stitch', 'letter', 'puppy', 'disney-princess', 'turtle', 'shark') THEN 'Batch 2'
    WHEN slug IN ('animal', 'coloring-book', 'bible', 'car') THEN 'Batch 3'
    WHEN slug IN ('kitten', 'spider', 'valentine', 'fish') THEN 'Batch 4'
    WHEN slug IN ('train', 'bunny', 'whale', 'wolf', 'ocean') THEN 'Batch 5'
    WHEN slug IN ('monkey', 'fox', 'dolphin', 'penguin', 'bear', 'airplane', 'race-car', 'fire-truck', 'rocket', 'snowman') THEN 'Batch 6'
    WHEN slug IN ('tiger', 'superhero', 'pumpkin', 'robot', 'frog', 'giraffe', 'owl', 't-rex', 'castle', 'crown') THEN 'Batch 7'
  END as batch,
  name,
  slug
FROM categories
WHERE slug IN (
  'stitch', 'letter', 'puppy', 'disney-princess', 'turtle', 'shark',
  'animal', 'coloring-book', 'bible', 'car',
  'kitten', 'spider', 'valentine', 'fish',
  'train', 'bunny', 'whale', 'wolf', 'ocean',
  'monkey', 'fox', 'dolphin', 'penguin', 'bear', 'airplane', 'race-car', 'fire-truck', 'rocket', 'snowman',
  'tiger', 'superhero', 'pumpkin', 'robot', 'frog', 'giraffe', 'owl', 't-rex', 'castle', 'crown'
)
ORDER BY batch, slug;
*/
