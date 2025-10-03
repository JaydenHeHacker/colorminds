-- Add category_id to ai_generations table
ALTER TABLE ai_generations ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_generations_category_id ON ai_generations(category_id);

-- Update RLS policies for ai_generations
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own generations" ON ai_generations;
DROP POLICY IF EXISTS "Users can view public generations" ON ai_generations;
DROP POLICY IF EXISTS "Users can insert their own generations" ON ai_generations;
DROP POLICY IF EXISTS "Users can update their own generations" ON ai_generations;
DROP POLICY IF EXISTS "Users can delete their own generations" ON ai_generations;

-- Create new policies
-- View policy: users can see their own content + public content from others
CREATE POLICY "Users can view their own generations"
ON ai_generations FOR SELECT
USING (auth.uid() = user_id OR is_public = true);

-- Insert policy: users can create their own generations
CREATE POLICY "Users can insert their own generations"
ON ai_generations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update policy: users can update their own generations
CREATE POLICY "Users can update their own generations"
ON ai_generations FOR UPDATE
USING (auth.uid() = user_id);

-- Delete policy: only private content can be deleted, and only by premium users
CREATE POLICY "Premium users can delete their private generations"
ON ai_generations FOR DELETE
USING (
  auth.uid() = user_id 
  AND is_public = false
  AND EXISTS (
    SELECT 1 FROM user_subscriptions 
    WHERE user_id = auth.uid() 
    AND tier = 'premium'
  )
);