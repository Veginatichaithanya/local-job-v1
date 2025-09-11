-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('worker', 'job_provider', 'admin')),
  phone TEXT,
  location TEXT,
  skills TEXT[],
  company_name TEXT,
  business_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create jobs table for job postings
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_provider_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  wage DECIMAL(10, 2) NOT NULL,
  job_date DATE NOT NULL,
  job_time TIME,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'completed', 'cancelled')),
  selected_worker_id UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job applications table
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(job_id, worker_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('application', 'job_completion', 'job_accepted', 'job_rejected')),
  read BOOLEAN NOT NULL DEFAULT false,
  related_job_id UUID REFERENCES public.jobs(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Jobs policies
CREATE POLICY "Everyone can view active jobs" ON public.jobs FOR SELECT USING (status = 'active' OR job_provider_id = auth.uid() OR selected_worker_id = auth.uid());
CREATE POLICY "Job providers can create jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = job_provider_id);
CREATE POLICY "Job providers can update their jobs" ON public.jobs FOR UPDATE USING (auth.uid() = job_provider_id);
CREATE POLICY "Job providers can delete their jobs" ON public.jobs FOR DELETE USING (auth.uid() = job_provider_id);

-- Job applications policies
CREATE POLICY "Workers can view their applications" ON public.job_applications FOR SELECT USING (auth.uid() = worker_id OR auth.uid() IN (SELECT job_provider_id FROM public.jobs WHERE id = job_id));
CREATE POLICY "Workers can create applications" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = worker_id);
CREATE POLICY "Job providers can update applications for their jobs" ON public.job_applications FOR UPDATE USING (auth.uid() IN (SELECT job_provider_id FROM public.jobs WHERE id = job_id));

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, role, company_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'role',
    new.raw_user_meta_data ->> 'company_name'
  );
  RETURN new;
END;
$$;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to create notifications for new applications
CREATE OR REPLACE FUNCTION public.notify_job_provider_on_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  job_title TEXT;
  worker_name TEXT;
  provider_id UUID;
BEGIN
  -- Get job details
  SELECT title, job_provider_id INTO job_title, provider_id
  FROM public.jobs WHERE id = NEW.job_id;
  
  -- Get worker name
  SELECT first_name || ' ' || last_name INTO worker_name
  FROM public.profiles WHERE user_id = NEW.worker_id;
  
  -- Create notification for job provider
  INSERT INTO public.notifications (user_id, title, message, type, related_job_id)
  VALUES (
    provider_id,
    'New Job Application',
    worker_name || ' applied for your job: ' || job_title,
    'application',
    NEW.job_id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for application notifications
CREATE TRIGGER on_job_application_created
  AFTER INSERT ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_job_provider_on_application();