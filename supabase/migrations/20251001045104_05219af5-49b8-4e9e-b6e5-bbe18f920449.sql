-- Create worker categories enum
CREATE TYPE worker_category AS ENUM (
  'general_laborer',
  'construction_worker',
  'mechanic',
  'plumber',
  'electrician',
  'carpenter',
  'painter',
  'watchman',
  'cleaner',
  'gardener',
  'driver',
  'welder',
  'mason',
  'helper'
);

-- Add new columns to profiles table for location and profile completion
ALTER TABLE public.profiles
ADD COLUMN pincode text,
ADD COLUMN latitude double precision,
ADD COLUMN longitude double precision,
ADD COLUMN profile_photo_url text,
ADD COLUMN experience_level text,
ADD COLUMN worker_category worker_category,
ADD COLUMN notification_preferences jsonb DEFAULT '{"job_alerts": true, "location_radius_km": 10}'::jsonb,
ADD COLUMN profile_completion_percentage integer DEFAULT 0;

-- Add new columns to jobs table for location
ALTER TABLE public.jobs
ADD COLUMN required_skills text[],
ADD COLUMN job_time text,
ADD COLUMN latitude double precision,
ADD COLUMN longitude double precision,
ADD COLUMN pincode text;

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  is_read boolean DEFAULT false,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for geospatial queries
CREATE INDEX idx_profiles_location ON public.profiles(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_jobs_location ON public.jobs(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(profile_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  completion_score integer := 0;
  profile_record profiles%ROWTYPE;
BEGIN
  SELECT * INTO profile_record FROM profiles WHERE id = profile_id;
  
  -- Personal info (25%)
  IF profile_record.first_name IS NOT NULL AND profile_record.last_name IS NOT NULL 
     AND profile_record.phone IS NOT NULL THEN
    completion_score := completion_score + 25;
  END IF;
  
  -- Location (20%)
  IF profile_record.pincode IS NOT NULL AND profile_record.latitude IS NOT NULL 
     AND profile_record.longitude IS NOT NULL THEN
    completion_score := completion_score + 20;
  END IF;
  
  -- Skills (20%)
  IF profile_record.skills IS NOT NULL AND array_length(profile_record.skills, 1) > 0 THEN
    completion_score := completion_score + 20;
  END IF;
  
  -- Photo (20%)
  IF profile_record.profile_photo_url IS NOT NULL THEN
    completion_score := completion_score + 20;
  END IF;
  
  -- Experience & Category (15%)
  IF profile_record.experience_level IS NOT NULL AND profile_record.worker_category IS NOT NULL THEN
    completion_score := completion_score + 15;
  END IF;
  
  RETURN completion_score;
END;
$$;

-- Trigger to auto-update profile completion percentage
CREATE OR REPLACE FUNCTION public.update_profile_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.profile_completion_percentage := calculate_profile_completion(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profile_completion_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_profile_completion();

-- Function to find nearby jobs for a worker
CREATE OR REPLACE FUNCTION public.find_nearby_jobs(
  worker_lat double precision,
  worker_lng double precision,
  radius_km integer DEFAULT 10
)
RETURNS TABLE(
  job_id uuid,
  title text,
  distance_km double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id,
    j.title,
    (6371 * acos(
      cos(radians(worker_lat)) * cos(radians(j.latitude)) *
      cos(radians(j.longitude) - radians(worker_lng)) +
      sin(radians(worker_lat)) * sin(radians(j.latitude))
    )) as distance
  FROM jobs j
  WHERE 
    j.latitude IS NOT NULL 
    AND j.longitude IS NOT NULL
    AND j.status = 'posted'
    AND (6371 * acos(
      cos(radians(worker_lat)) * cos(radians(j.latitude)) *
      cos(radians(j.longitude) - radians(worker_lng)) +
      sin(radians(worker_lat)) * sin(radians(j.latitude))
    )) <= radius_km
  ORDER BY distance;
END;
$$;

-- Storage policies for worker photos
CREATE POLICY "Users can upload their own photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'workerphotos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'workerphotos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'workerphotos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'workerphotos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Job providers can view worker photos when they have applications
CREATE POLICY "Job providers can view applicant photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'workerphotos' 
  AND EXISTS (
    SELECT 1 FROM job_applications ja
    JOIN jobs j ON j.id = ja.job_id
    WHERE j.job_provider_id = auth.uid()
    AND (storage.foldername(name))[1] = ja.worker_id::text
  )
);