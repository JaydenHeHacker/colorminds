-- 添加 admin_adjustment 到 transaction_type 的允许值
-- 首先检查是否有 enum 类型或 check 约束
DO $$ 
BEGIN
    -- 如果是 enum 类型，添加新值
    IF EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'transaction_type'
    ) THEN
        -- 检查值是否已存在
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumtypid = 'transaction_type'::regtype 
            AND enumlabel = 'admin_adjustment'
        ) THEN
            ALTER TYPE transaction_type ADD VALUE 'admin_adjustment';
        END IF;
    ELSE
        -- 如果是 check 约束，需要删除旧约束并创建新约束
        ALTER TABLE credit_transactions 
        DROP CONSTRAINT IF EXISTS credit_transactions_transaction_type_check;
        
        ALTER TABLE credit_transactions 
        ADD CONSTRAINT credit_transactions_transaction_type_check 
        CHECK (transaction_type IN ('earned', 'spent', 'purchased', 'refunded', 'usage', 'admin_adjustment'));
    END IF;
END $$;