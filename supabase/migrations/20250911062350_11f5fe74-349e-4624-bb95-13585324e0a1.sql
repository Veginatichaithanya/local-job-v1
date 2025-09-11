-- Create job status enum
CREATE TYPE job_status AS ENUM ('posted', 'assigned', 'completed', 'cancelled');

-- Create application status enum  
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  wage DECIMAL(10,2) NOT NULL,
  job_date DATE NOT NULL,
  location TEXT,
  status job_status NOT NULL DEFAULT 'posted',
  selected_worker_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job_applications table
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'pending',
  message TEXT,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_id, worker_id)
);

-- Enable RLS on jobs table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Jobs policies
CREATE POLICY "Job providers can view their own jobs" 
ON public.jobs 
FOR SELECT 
USING (auth.uid() = job_provider_id);

CREATE POLICY "Job providers can create jobs" 
ON public.jobs 
FOR INSERT 
WITH CHECK (auth.uid() = job_provider_id);

CREATE POLICY "Job providers can update their own jobs" 
ON public.jobs 
FOR UPDATE 
USING (auth.uid() = job_provider_id);

CREATE POLICY "Workers can view posted jobs" 
ON public.jobs 
FOR SELECT 
USING (status = 'posted' OR selected_worker_id = auth.uid());

-- Enable RLS on job_applications table
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Job applications policies
CREATE POLICY "Workers can view their own applications" 
ON public.job_applications 
FOR SELECT 
USING (auth.uid() = worker_id);

CREATE POLICY "Job providers can view applications for their jobs" 
ON public.job_applications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = job_applications.job_id 
    AND jobs.job_provider_id = auth.uid()
  )
);

CREATE POLICY "Workers can create applications" 
ON public.job_applications 
FOR INSERT 
WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Job providers can update application status" 
ON public.job_applications 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = job_applications.job_id 
    AND jobs.job_provider_id = auth.uid()
  )
);

-- Create trigger for jobs updated_at
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_jobs_provider_id ON public.jobs(job_provider_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX idx_job_applications_worker_id ON public.job_applications(worker_id);