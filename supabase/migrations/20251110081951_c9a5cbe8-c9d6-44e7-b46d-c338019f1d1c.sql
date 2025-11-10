-- Fix profile completion trigger to fire BEFORE UPDATE
DROP TRIGGER IF EXISTS update_profile_completion_trigger ON profiles;

CREATE TRIGGER update_profile_completion_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_completion();

-- Enable realtime for notifications table
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;