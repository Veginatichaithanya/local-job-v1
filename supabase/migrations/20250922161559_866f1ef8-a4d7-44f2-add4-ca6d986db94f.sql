-- Create admin policies to view user authentication data
-- WARNING: This allows admins to see sensitive user information

-- First, let's add RLS policies for admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add a view that combines profile data with basic auth info
-- Note: This doesn't expose actual passwords as they are hashed by Supabase
CREATE OR REPLACE VIEW public.admin_user_details AS
SELECT 
  p.id,
  p.user_id,
  p.email,
  p.first_name,
  p.last_name,
  p.phone,
  p.location,
  p.skills,
  p.company_name,
  p.role,
  p.created_at,
  p.updated_at,
  au.email_confirmed_at,
  au.last_sign_in_at,
  au.created_at as auth_created_at
FROM public.profiles p
LEFT JOIN auth.users au ON p.user_id = au.id;

-- Create RLS policy for the view
ALTER VIEW public.admin_user_details SET (security_invoker = on);

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;