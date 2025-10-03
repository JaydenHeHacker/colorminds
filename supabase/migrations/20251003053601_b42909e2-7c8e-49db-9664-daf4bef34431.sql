-- Add difficulty field to coloring_pages table
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

ALTER TABLE public.coloring_pages 
ADD COLUMN difficulty difficulty_level DEFAULT 'medium';