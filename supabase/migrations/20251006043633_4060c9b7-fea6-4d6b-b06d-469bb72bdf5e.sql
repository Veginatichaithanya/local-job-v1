-- Add notification_scope column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN notification_scope text NOT NULL DEFAULT 'all' CHECK (notification_scope IN ('local', 'all'));