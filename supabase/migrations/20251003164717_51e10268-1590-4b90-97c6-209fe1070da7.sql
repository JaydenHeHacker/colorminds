-- 确保 coloring_pages 表有发布管理相关字段
DO $$ 
BEGIN
  -- 检查并添加 status 字段（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'coloring_pages' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.coloring_pages 
    ADD COLUMN status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published'));
  END IF;

  -- 检查并添加 scheduled_publish_at 字段（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'coloring_pages' 
    AND column_name = 'scheduled_publish_at'
  ) THEN
    ALTER TABLE public.coloring_pages 
    ADD COLUMN scheduled_publish_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- 检查并添加 published_at 字段（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'coloring_pages' 
    AND column_name = 'published_at'
  ) THEN
    ALTER TABLE public.coloring_pages 
    ADD COLUMN published_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_coloring_pages_status ON public.coloring_pages(status);
CREATE INDEX IF NOT EXISTS idx_coloring_pages_scheduled_publish_at ON public.coloring_pages(scheduled_publish_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_coloring_pages_published_at ON public.coloring_pages(published_at) WHERE status = 'published';

-- 更新现有记录的状态（如果需要）
UPDATE public.coloring_pages 
SET status = 'published', 
    published_at = COALESCE(published_at, created_at)
WHERE status IS NULL OR status = 'draft';