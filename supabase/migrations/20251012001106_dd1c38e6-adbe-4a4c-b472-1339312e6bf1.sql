-- Create table for keyword analysis results
CREATE TABLE public.keyword_analysis_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_name TEXT NOT NULL,
  csv_filename TEXT NOT NULL,
  total_keywords INTEGER NOT NULL,
  total_volume BIGINT NOT NULL,
  avg_kd INTEGER NOT NULL,
  categories JSONB NOT NULL,
  opportunities JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.keyword_analysis_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all analysis results"
ON public.keyword_analysis_results
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create analysis"
ON public.keyword_analysis_results
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own analysis"
ON public.keyword_analysis_results
FOR DELETE
USING (auth.uid() = created_by);

-- Create index for faster queries
CREATE INDEX idx_keyword_analysis_created_at ON public.keyword_analysis_results(created_at DESC);