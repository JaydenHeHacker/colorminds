-- Fix remaining functions without search_path set

-- Fix check_and_unlock_achievements - keep original parameter name
CREATE OR REPLACE FUNCTION public.check_and_unlock_achievements(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Fix track_coloring_action
CREATE OR REPLACE FUNCTION public.track_coloring_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- 插入历史记录
  INSERT INTO public.coloring_history (user_id, coloring_page_id, action_type)
  VALUES (auth.uid(), NEW.coloring_page_id, 'download');
  
  -- 检查并解锁成就
  PERFORM public.check_and_unlock_achievements(auth.uid());
  
  RETURN NEW;
END;
$$;