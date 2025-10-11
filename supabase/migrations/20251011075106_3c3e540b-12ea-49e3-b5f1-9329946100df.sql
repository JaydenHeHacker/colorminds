-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Users can update own credits" ON user_credits;
DROP POLICY IF EXISTS "Admins can update any user credits" ON user_credits;
DROP POLICY IF EXISTS "Users can view own credits" ON user_credits;
DROP POLICY IF EXISTS "System can insert credits" ON user_credits;

-- 用户可以查看自己的积分
CREATE POLICY "Users can view own credits"
ON user_credits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 管理员可以查看所有用户的积分
CREATE POLICY "Admins can view all credits"
ON user_credits
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 管理员可以更新任何用户的积分
CREATE POLICY "Admins can update any user credits"
ON user_credits
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 系统可以插入积分记录（用户自己）
CREATE POLICY "System can insert credits"
ON user_credits
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);