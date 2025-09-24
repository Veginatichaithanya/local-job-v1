-- Remove the problematic admin policy that causes infinite recursion
-- Since this is a worker/job provider app, admin access is not needed for profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;