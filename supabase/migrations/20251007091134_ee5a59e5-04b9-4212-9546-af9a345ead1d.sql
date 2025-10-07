-- Add business_type column to profiles table for job providers
ALTER TABLE profiles 
ADD COLUMN business_type text;

-- Add comment for documentation
COMMENT ON COLUMN profiles.business_type IS 'Type of business for job provider profiles (e.g., Restaurant, Construction, Retail, etc.)';