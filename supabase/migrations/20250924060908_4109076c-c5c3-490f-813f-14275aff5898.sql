-- Fix infinite recursion in profiles RLS policies
-- Drop the problematic policy that queries profiles table within profiles policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a new admin policy using the security definer function that doesn't cause recursion
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO public 
USING (public.is_admin());