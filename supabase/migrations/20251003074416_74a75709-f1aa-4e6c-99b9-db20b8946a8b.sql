-- 清空现有分类（保持表结构）
TRUNCATE TABLE public.categories CASCADE;

-- 插入基于SEMRush关键词分析的新分类结构

-- Level 1: 主分类（基于高搜索量关键词）
INSERT INTO public.categories (name, slug, icon, description, parent_id, path) VALUES
('Characters', 'characters', '🎭', 'Popular character coloring pages from movies, TV shows, and games', NULL, 'characters'),
('Animals', 'animals', '🐾', 'Animal coloring pages for all ages', NULL, 'animals'),
('Holidays', 'holidays', '🎉', 'Seasonal holiday and celebration coloring pages', NULL, 'holidays'),
('Seasons', 'seasons', '🍂', 'Seasonal themed coloring pages', NULL, 'seasons'),
('Fantasy', 'fantasy', '✨', 'Magical creatures and fantasy themed coloring pages', NULL, 'fantasy'),
('Kids', 'kids', '👶', 'Coloring pages specially designed for children', NULL, 'kids'),
('Adults', 'adults', '👥', 'Complex coloring pages for adults', NULL, 'adults'),
('Nature', 'nature', '🌸', 'Flowers, plants, and nature coloring pages', NULL, 'nature'),
('Vehicles', 'vehicles', '🚗', 'Cars, trucks, and transportation coloring pages', NULL, 'vehicles'),
('Easy', 'easy', '😊', 'Simple and easy coloring pages for beginners', NULL, 'easy');

-- Level 2: 角色子分类
WITH parent AS (SELECT id FROM public.categories WHERE slug = 'characters')
INSERT INTO public.categories (name, slug, icon, description, parent_id, path) VALUES
('Disney', 'disney', '🏰', 'Disney character coloring pages', (SELECT id FROM parent), 'characters/disney'),
('Pokemon', 'pokemon', '⚡', 'Pokemon coloring pages', (SELECT id FROM parent), 'characters/pokemon'),
('Sonic', 'sonic', '🦔', 'Sonic the Hedgehog coloring pages', (SELECT id FROM parent), 'characters/sonic'),
('Hello Kitty', 'hello-kitty', '🐱', 'Hello Kitty coloring pages', (SELECT id FROM parent), 'characters/hello-kitty'),
('Bluey', 'bluey', '🐶', 'Bluey coloring pages', (SELECT id FROM parent), 'characters/bluey'),
('Spiderman', 'spiderman', '🕷️', 'Spiderman coloring pages', (SELECT id FROM parent), 'characters/spiderman'),
('Minecraft', 'minecraft', '⛏️', 'Minecraft coloring pages', (SELECT id FROM parent), 'characters/minecraft'),
('Mario', 'mario', '🍄', 'Super Mario coloring pages', (SELECT id FROM parent), 'characters/mario');

-- Level 2: 动物子分类
WITH parent AS (SELECT id FROM public.categories WHERE slug = 'animals')
INSERT INTO public.categories (name, slug, icon, description, parent_id, path) VALUES
('Cats', 'cats', '🐱', 'Cat coloring pages', (SELECT id FROM parent), 'animals/cats'),
('Dogs', 'dogs', '🐕', 'Dog coloring pages', (SELECT id FROM parent), 'animals/dogs'),
('Dinosaurs', 'dinosaurs', '🦕', 'Dinosaur coloring pages', (SELECT id FROM parent), 'animals/dinosaurs'),
('Butterflies', 'butterflies', '🦋', 'Butterfly coloring pages', (SELECT id FROM parent), 'animals/butterflies'),
('Birds', 'birds', '🐦', 'Bird coloring pages', (SELECT id FROM parent), 'animals/birds'),
('Farm Animals', 'farm-animals', '🐄', 'Farm animal coloring pages', (SELECT id FROM parent), 'animals/farm-animals'),
('Sea Animals', 'sea-animals', '🐠', 'Ocean and sea creature coloring pages', (SELECT id FROM parent), 'animals/sea-animals');

-- Level 2: 节日子分类
WITH parent AS (SELECT id FROM public.categories WHERE slug = 'holidays')
INSERT INTO public.categories (name, slug, icon, description, parent_id, path) VALUES
('Christmas', 'christmas', '🎄', 'Christmas coloring pages', (SELECT id FROM parent), 'holidays/christmas'),
('Halloween', 'halloween', '🎃', 'Halloween coloring pages', (SELECT id FROM parent), 'holidays/halloween'),
('Easter', 'easter', '🐰', 'Easter coloring pages', (SELECT id FROM parent), 'holidays/easter'),
('Thanksgiving', 'thanksgiving', '🦃', 'Thanksgiving coloring pages', (SELECT id FROM parent), 'holidays/thanksgiving'),
('Valentines Day', 'valentines-day', '💝', 'Valentine''s Day coloring pages', (SELECT id FROM parent), 'holidays/valentines-day');

-- Level 2: 季节子分类
WITH parent AS (SELECT id FROM public.categories WHERE slug = 'seasons')
INSERT INTO public.categories (name, slug, icon, description, parent_id, path) VALUES
('Spring', 'spring', '🌷', 'Spring coloring pages', (SELECT id FROM parent), 'seasons/spring'),
('Summer', 'summer', '☀️', 'Summer coloring pages', (SELECT id FROM parent), 'seasons/summer'),
('Fall', 'fall', '🍁', 'Fall and autumn coloring pages', (SELECT id FROM parent), 'seasons/fall'),
('Winter', 'winter', '❄️', 'Winter coloring pages', (SELECT id FROM parent), 'seasons/winter');

-- Level 2: 幻想子分类
WITH parent AS (SELECT id FROM public.categories WHERE slug = 'fantasy')
INSERT INTO public.categories (name, slug, icon, description, parent_id, path) VALUES
('Unicorns', 'unicorns', '🦄', 'Unicorn coloring pages', (SELECT id FROM parent), 'fantasy/unicorns'),
('Dragons', 'dragons', '🐉', 'Dragon coloring pages', (SELECT id FROM parent), 'fantasy/dragons'),
('Mermaids', 'mermaids', '🧜', 'Mermaid coloring pages', (SELECT id FROM parent), 'fantasy/mermaids');

-- Level 2: 自然子分类
WITH parent AS (SELECT id FROM public.categories WHERE slug = 'nature')
INSERT INTO public.categories (name, slug, icon, description, parent_id, path) VALUES
('Flowers', 'flowers', '🌺', 'Flower coloring pages', (SELECT id FROM parent), 'nature/flowers'),
('Trees', 'trees', '🌳', 'Tree coloring pages', (SELECT id FROM parent), 'nature/trees');