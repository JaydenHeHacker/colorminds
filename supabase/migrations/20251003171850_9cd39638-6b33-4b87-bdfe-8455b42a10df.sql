-- 为新创建的表启用 RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_stats ENABLE ROW LEVEL SECURITY;

-- 只允许管理员访问系统设置
CREATE POLICY "Only admins can read system_settings"
ON system_settings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Only admins can update system_settings"
ON system_settings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- 只允许管理员查看生成统计
CREATE POLICY "Only admins can read generation_stats"
ON generation_stats FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- 允许 service_role 插入统计数据
CREATE POLICY "Service role can insert generation_stats"
ON generation_stats FOR INSERT
TO service_role
WITH CHECK (true);