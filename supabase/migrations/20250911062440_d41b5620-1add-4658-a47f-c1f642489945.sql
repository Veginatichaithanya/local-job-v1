-- Fix foreign key relationships for job_applications table
-- Drop the existing foreign keys to auth.users and recreate with proper references

ALTER TABLE public.job_applications 
DROP CONSTRAINT job_applications_job_id_fkey;

ALTER TABLE public.job_applications 
DROP CONSTRAINT job_applications_worker_id_fkey;

ALTER TABLE public.jobs 
DROP CONSTRAINT jobs_job_provider_id_fkey;

ALTER TABLE public.jobs 
DROP CONSTRAINT jobs_selected_worker_id_fkey;

-- Add proper foreign keys referencing user_id in profiles table
ALTER TABLE public.job_applications 
ADD CONSTRAINT job_applications_worker_id_fkey 
FOREIGN KEY (worker_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_job_provider_id_fkey 
FOREIGN KEY (job_provider_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_selected_worker_id_fkey 
FOREIGN KEY (selected_worker_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- Create proper foreign key for job_applications -> jobs
ALTER TABLE public.job_applications 
ADD CONSTRAINT job_applications_job_id_fkey 
FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;