-- Add end_date column to publishing_jobs table
ALTER TABLE public.publishing_jobs 
ADD COLUMN end_date DATE;