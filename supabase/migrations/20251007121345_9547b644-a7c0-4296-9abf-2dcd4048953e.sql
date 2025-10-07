-- 修复函数安全问题：设置 search_path
DROP FUNCTION IF EXISTS update_reddit_config_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_reddit_config_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 重新创建触发器
CREATE TRIGGER trigger_update_reddit_config_timestamp
  BEFORE UPDATE ON public.reddit_auto_config
  FOR EACH ROW
  EXECUTE FUNCTION update_reddit_config_updated_at();