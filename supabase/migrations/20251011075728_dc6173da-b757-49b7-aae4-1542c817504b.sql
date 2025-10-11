-- 为 credit_transactions 表添加管理员插入策略
CREATE POLICY "Admins can insert credit transactions for any user"
ON credit_transactions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));