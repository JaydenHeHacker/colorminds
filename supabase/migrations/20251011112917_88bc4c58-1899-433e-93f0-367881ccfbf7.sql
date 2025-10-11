-- 添加 start_date 字段到 publishing_jobs 表
ALTER TABLE publishing_jobs 
ADD COLUMN start_date DATE;

-- 更新现有任务的 start_date
-- Christmas 任务立即开始
UPDATE publishing_jobs 
SET start_date = CURRENT_DATE 
WHERE name = 'Christmas 2025 - 节日内容发布';

-- Valentine 任务从 2025-11-01 开始
UPDATE publishing_jobs 
SET start_date = '2025-11-01' 
WHERE name LIKE 'Valentine%';

-- Easter 任务从 2025-12-01 开始
UPDATE publishing_jobs 
SET start_date = '2025-12-01' 
WHERE name LIKE 'Easter%';

-- Halloween 任务从 2026-07-01 开始
UPDATE publishing_jobs 
SET start_date = '2026-07-01' 
WHERE name LIKE 'Halloween%';

-- Thanksgiving 任务从 2026-08-01 开始
UPDATE publishing_jobs 
SET start_date = '2026-08-01' 
WHERE name LIKE 'Thanksgiving%';

-- 创建索引优化查询性能
CREATE INDEX idx_publishing_jobs_dates ON publishing_jobs(start_date, end_date) 
WHERE is_active = true;

-- 添加注释
COMMENT ON COLUMN publishing_jobs.start_date IS '任务开始执行日期，在此日期之前任务不会执行';