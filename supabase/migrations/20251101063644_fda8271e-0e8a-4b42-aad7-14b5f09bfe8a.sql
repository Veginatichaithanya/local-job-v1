-- Add resume fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS resume_url text,
ADD COLUMN IF NOT EXISTS resume_uploaded_at timestamp with time zone;

-- Add resume requirement field to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS requires_resume boolean DEFAULT false;

-- Create resumes storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for resumes bucket
CREATE POLICY "Workers can upload their own resume"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Workers can view their own resume"
ON storage.objects
FOR SELECT
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Workers can update their own resume"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Workers can delete their own resume"
ON storage.objects
FOR DELETE
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Update profile completion calculation to include previous works
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(profile_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- Previous works (10%)
  IF EXISTS (
    SELECT 1 FROM worker_previous_works 
    WHERE worker_id = profile_id
    LIMIT 1
  ) THEN
    completion_score := completion_score + 10;
  END IF;
  
  -- Cap at 100%
  IF completion_score > 100 THEN
    completion_score := 100;
  END IF;
  
  RETURN completion_score;
END;
$function$;