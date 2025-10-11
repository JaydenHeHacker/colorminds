-- 为 credit_transactions 表添加 balance_after 和 description 字段（如果不存在）
DO $$ 
BEGIN
    -- 添加 balance_after 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'credit_transactions' 
        AND column_name = 'balance_after'
    ) THEN
        ALTER TABLE public.credit_transactions 
        ADD COLUMN balance_after INTEGER;
    END IF;

    -- 添加 description 字段
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'credit_transactions' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE public.credit_transactions 
        ADD COLUMN description TEXT;
    END IF;
END $$;