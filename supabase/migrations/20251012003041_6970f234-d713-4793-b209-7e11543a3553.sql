-- Update category slugs from plural to singular for SEO optimization
-- Based on keyword analysis showing higher search volume for singular forms

-- Phase 1: Critical Priority Categories (Golden Score 90-100)
UPDATE categories 
SET slug = 'adult' 
WHERE slug = 'adults';

UPDATE categories 
SET slug = 'unicorn' 
WHERE slug = 'unicorns';

UPDATE categories 
SET slug = 'flower' 
WHERE slug = 'flowers';

UPDATE categories 
SET slug = 'princess' 
WHERE slug = 'princesses';

-- Phase 2: High Priority Categories (Golden Score 60-89)
UPDATE categories 
SET slug = 'cat' 
WHERE slug = 'cats';

UPDATE categories 
SET slug = 'dinosaur' 
WHERE slug = 'dinosaurs';

UPDATE categories 
SET slug = 'dog' 
WHERE slug = 'dogs';

-- Phase 3: Medium Priority Categories (Golden Score 40-59)
UPDATE categories 
SET slug = 'butterfly' 
WHERE slug = 'butterflies';

UPDATE categories 
SET slug = 'mermaid' 
WHERE slug = 'mermaids';

UPDATE categories 
SET slug = 'dragon' 
WHERE slug = 'dragons';

-- Phase 4: Standard Priority Categories (Golden Score <40)
UPDATE categories 
SET slug = 'bird' 
WHERE slug = 'birds';

UPDATE categories 
SET slug = 'tree' 
WHERE slug = 'trees';

UPDATE categories 
SET slug = 'vehicle' 
WHERE slug = 'vehicles';

-- Update path fields if they exist and contain old slugs
-- This ensures hierarchical category paths remain consistent
UPDATE categories 
SET path = REPLACE(path, '/adults/', '/adult/')
WHERE path LIKE '%/adults/%';

UPDATE categories 
SET path = REPLACE(path, '/unicorns/', '/unicorn/')
WHERE path LIKE '%/unicorns/%';

UPDATE categories 
SET path = REPLACE(path, '/flowers/', '/flower/')
WHERE path LIKE '%/flowers/%';

UPDATE categories 
SET path = REPLACE(path, '/princesses/', '/princess/')
WHERE path LIKE '%/princesses/%';

UPDATE categories 
SET path = REPLACE(path, '/cats/', '/cat/')
WHERE path LIKE '%/cats/%';

UPDATE categories 
SET path = REPLACE(path, '/dinosaurs/', '/dinosaur/')
WHERE path LIKE '%/dinosaurs/%';

UPDATE categories 
SET path = REPLACE(path, '/dogs/', '/dog/')
WHERE path LIKE '%/dogs/%';

UPDATE categories 
SET path = REPLACE(path, '/butterflies/', '/butterfly/')
WHERE path LIKE '%/butterflies/%';

UPDATE categories 
SET path = REPLACE(path, '/mermaids/', '/mermaid/')
WHERE path LIKE '%/mermaids/%';

UPDATE categories 
SET path = REPLACE(path, '/dragons/', '/dragon/')
WHERE path LIKE '%/dragons/%';

UPDATE categories 
SET path = REPLACE(path, '/birds/', '/bird/')
WHERE path LIKE '%/birds/%';

UPDATE categories 
SET path = REPLACE(path, '/trees/', '/tree/')
WHERE path LIKE '%/trees/%';

UPDATE categories 
SET path = REPLACE(path, '/vehicles/', '/vehicle/')
WHERE path LIKE '%/vehicles/%';