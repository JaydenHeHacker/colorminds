-- Create publishing_jobs table
CREATE TABLE IF NOT EXISTS public.publishing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  publish_count INTEGER NOT NULL DEFAULT 1,
  schedule_time TIME NOT NULL,
  schedule_days INTEGER[] DEFAULT ARRAY[]::INTEGER[], -- 0=Sunday, 1=Monday, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.publishing_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Allow admin to view publishing jobs"
  ON public.publishing_jobs
  FOR SELECT
  USING (true);

CREATE POLICY "Allow admin to insert publishing jobs"
  ON public.publishing_jobs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow admin to update publishing jobs"
  ON public.publishing_jobs
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow admin to delete publishing jobs"
  ON public.publishing_jobs
  FOR DELETE
  USING (true);

-- Create index for efficient querying
CREATE INDEX idx_publishing_jobs_active ON public.publishing_jobs(is_active, next_run_at);
CREATE INDEX idx_publishing_jobs_category ON public.publishing_jobs(category_id);

-- Create trigger for updated_at
CREATE TRIGGER update_publishing_jobs_updated_at
  BEFORE UPDATE ON public.publishing_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();