-- Create publishing_job_executions table for execution history
CREATE TABLE IF NOT EXISTS public.publishing_job_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.publishing_jobs(id) ON DELETE CASCADE,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL, -- 'success', 'failed', 'partial'
  pages_published INTEGER NOT NULL DEFAULT 0,
  pages_attempted INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  published_page_ids UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.publishing_job_executions ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Allow admin to view execution history"
  ON public.publishing_job_executions
  FOR SELECT
  USING (true);

CREATE POLICY "Allow admin to insert execution history"
  ON public.publishing_job_executions
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for efficient querying
CREATE INDEX idx_job_executions_job_id ON public.publishing_job_executions(job_id);
CREATE INDEX idx_job_executions_executed_at ON public.publishing_job_executions(executed_at DESC);
CREATE INDEX idx_job_executions_status ON public.publishing_job_executions(status);