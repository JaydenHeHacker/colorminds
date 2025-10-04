-- 批量打印篮表（仅Premium用户可用）
CREATE TABLE IF NOT EXISTS public.print_basket (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coloring_page_id UUID NOT NULL REFERENCES public.coloring_pages(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, coloring_page_id)
);

-- 涂色历史追踪表
CREATE TABLE IF NOT EXISTS public.coloring_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coloring_page_id UUID NOT NULL REFERENCES public.coloring_pages(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('download', 'print', 'view')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 用户成就表
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB,
  UNIQUE(user_id, achievement_type, achievement_name)
);

-- 创建索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_print_basket_user ON public.print_basket(user_id);
CREATE INDEX IF NOT EXISTS idx_coloring_history_user_date ON public.coloring_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);

-- 启用RLS
ALTER TABLE public.print_basket ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coloring_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- 打印篮RLS策略（仅本人可见）
CREATE POLICY "Users can manage their own print basket"
ON public.print_basket
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 涂色历史RLS策略（仅本人可见）
CREATE POLICY "Users can view their own coloring history"
ON public.coloring_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coloring history"
ON public.coloring_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 成就RLS策略（仅本人可见）
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements"
ON public.user_achievements
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 自动记录下载历史的触发器函数
CREATE OR REPLACE FUNCTION public.track_coloring_action()
RETURNS TRIGGER AS $$
BEGIN
  -- 插入历史记录
  INSERT INTO public.coloring_history (user_id, coloring_page_id, action_type)
  VALUES (auth.uid(), NEW.coloring_page_id, 'download');
  
  -- 检查并解锁成就
  PERFORM public.check_and_unlock_achievements(auth.uid());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 成就解锁逻辑函数
CREATE OR REPLACE FUNCTION public.check_and_unlock_achievements(p_user_id UUID)
RETURNS void AS $$
DECLARE
  download_count INTEGER;
  streak_days INTEGER;
BEGIN
  -- 统计总下载数
  SELECT COUNT(*) INTO download_count
  FROM public.coloring_history
  WHERE user_id = p_user_id AND action_type = 'download';
  
  -- 解锁数量成就
  IF download_count >= 1 THEN
    INSERT INTO public.user_achievements (user_id, achievement_type, achievement_name, metadata)
    VALUES (p_user_id, 'milestone', 'first_download', jsonb_build_object('count', 1))
    ON CONFLICT (user_id, achievement_type, achievement_name) DO NOTHING;
  END IF;
  
  IF download_count >= 10 THEN
    INSERT INTO public.user_achievements (user_id, achievement_type, achievement_name, metadata)
    VALUES (p_user_id, 'milestone', 'ten_downloads', jsonb_build_object('count', 10))
    ON CONFLICT (user_id, achievement_type, achievement_name) DO NOTHING;
  END IF;
  
  IF download_count >= 50 THEN
    INSERT INTO public.user_achievements (user_id, achievement_type, achievement_name, metadata)
    VALUES (p_user_id, 'milestone', 'fifty_downloads', jsonb_build_object('count', 50))
    ON CONFLICT (user_id, achievement_type, achievement_name) DO NOTHING;
  END IF;
  
  IF download_count >= 100 THEN
    INSERT INTO public.user_achievements (user_id, achievement_type, achievement_name, metadata)
    VALUES (p_user_id, 'milestone', 'hundred_downloads', jsonb_build_object('count', 100))
    ON CONFLICT (user_id, achievement_type, achievement_name) DO NOTHING;
  END IF;
  
  -- 计算连续涂色天数
  WITH daily_activity AS (
    SELECT DISTINCT DATE(created_at) as activity_date
    FROM public.coloring_history
    WHERE user_id = p_user_id
    ORDER BY activity_date DESC
  ),
  streak_calc AS (
    SELECT 
      activity_date,
      activity_date - ROW_NUMBER() OVER (ORDER BY activity_date)::integer AS streak_group
    FROM daily_activity
  )
  SELECT COUNT(*) INTO streak_days
  FROM streak_calc
  WHERE streak_group = (SELECT streak_group FROM streak_calc ORDER BY activity_date DESC LIMIT 1);
  
  -- 解锁连续天数成就
  IF streak_days >= 3 THEN
    INSERT INTO public.user_achievements (user_id, achievement_type, achievement_name, metadata)
    VALUES (p_user_id, 'streak', 'three_day_streak', jsonb_build_object('days', 3))
    ON CONFLICT (user_id, achievement_type, achievement_name) DO NOTHING;
  END IF;
  
  IF streak_days >= 7 THEN
    INSERT INTO public.user_achievements (user_id, achievement_type, achievement_name, metadata)
    VALUES (p_user_id, 'streak', 'seven_day_streak', jsonb_build_object('days', 7))
    ON CONFLICT (user_id, achievement_type, achievement_name) DO NOTHING;
  END IF;
  
  IF streak_days >= 30 THEN
    INSERT INTO public.user_achievements (user_id, achievement_type, achievement_name, metadata)
    VALUES (p_user_id, 'streak', 'thirty_day_streak', jsonb_build_object('days', 30))
    ON CONFLICT (user_id, achievement_type, achievement_name) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;