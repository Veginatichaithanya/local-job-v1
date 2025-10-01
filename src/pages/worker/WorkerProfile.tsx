import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { MapPin, Phone, Mail, User, Briefcase, Plus, X, Upload, Camera, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LocationPicker } from "@/components/maps/LocationPicker";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

const WORKER_CATEGORIES = [
  { value: 'general_laborer', label: 'General Laborer' },
  { value: 'construction_worker', label: 'Construction Worker' },
  { value: 'mechanic', label: 'Mechanic' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'painter', label: 'Painter' },
  { value: 'watchman', label: 'Watchman/Security' },
  { value: 'cleaner', label: 'Cleaner/Housekeeper' },
  { value: 'gardener', label: 'Gardener' },
  { value: 'driver', label: 'Driver' },
  { value: 'welder', label: 'Welder' },
  { value: 'mason', label: 'Mason' },
  { value: 'helper', label: 'Helper/Assistant' },
];

const WorkerProfile = () => {
  const { profile, updateProfile, user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
    skills: profile?.skills || [],
    pincode: profile?.pincode || '',
    latitude: profile?.latitude || null,
    longitude: profile?.longitude || null,
    profile_photo_url: profile?.profile_photo_url || '',
    experience_level: profile?.experience_level || '',
    worker_category: profile?.worker_category || '',
  });

  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        location: profile.location || '',
        skills: profile.skills || [],
        pincode: profile.pincode || '',
        latitude: profile.latitude || null,
        longitude: profile.longitude || null,
        profile_photo_url: profile.profile_photo_url || '',
        experience_level: profile.experience_level || '',
        worker_category: profile.worker_category || '',
      });
      setProfileCompletion(profile.profile_completion_percentage || 0);
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    
    // Validate file size (50MB = 52428800 bytes)
    if (file.size > 52428800) {
      toast({
        title: "File too large",
        description: "Please upload a photo smaller than 50MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('workerphotos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('workerphotos')
        .getPublicUrl(fileName);

      setFormData({ ...formData, profile_photo_url: publicUrl });
      
      toast({
        title: "Success",
        description: "Photo uploaded successfully!",
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleLocationSelect = (locationData: any) => {
    setFormData({
      ...formData,
      pincode: locationData.pincode,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      location: locationData.address,
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    const { error } = await updateProfile(formData);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      setIsEditing(false);
    }
    
    setIsLoading(false);
  };

  const handleCancel = () => {
    setFormData({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone: profile?.phone || '',
      location: profile?.location || '',
      skills: profile?.skills || [],
      pincode: profile?.pincode || '',
      latitude: profile?.latitude || null,
      longitude: profile?.longitude || null,
      profile_photo_url: profile?.profile_photo_url || '',
      experience_level: profile?.experience_level || '',
      worker_category: profile?.worker_category || '',
    });
    setIsEditing(false);
  };

  const canAccessJobs = profileCompletion >= 75;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information and job preferences
          </p>
        </div>
        
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <User className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Profile Completion Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Completion</CardTitle>
          <CardDescription>
            Complete at least 75% of your profile to access job listings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{profileCompletion}% Complete</span>
              <Badge variant={canAccessJobs ? "default" : "secondary"}>
                {canAccessJobs ? "Jobs Unlocked" : "Complete Profile"}
              </Badge>
            </div>
            <Progress value={profileCompletion} />
          </div>
          
          {!canAccessJobs && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Complete your profile photo, location, skills, experience, and worker category to unlock job access.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Profile Photo */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>
            Upload a clear photo of yourself (Max 50MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="relative">
              {formData.profile_photo_url ? (
                <img
                  src={formData.profile_photo_url}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-border"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-border">
                  <Camera className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {isEditing && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Upload Photo'}
                  </div>
                </Label>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or WEBP (Max 50MB)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Basic details about yourself
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              {isEditing ? (
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  placeholder="Enter your first name"
                />
              ) : (
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{profile?.first_name || 'Not provided'}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              {isEditing ? (
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  placeholder="Enter your last name"
                />
              ) : (
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{profile?.last_name || 'Not provided'}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{profile?.email}</span>
              <Badge variant="secondary" className="ml-auto">Verified</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            {isEditing ? (
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number"
              />
            ) : (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{profile?.phone || 'Not provided'}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location Details</Label>
            {isEditing ? (
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="City, State (auto-filled from map)"
                disabled
              />
            ) : (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{profile?.location || 'Not provided'}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Location Picker */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Set Your Location</CardTitle>
            <CardDescription>
              Enter your pincode or click on the map to set your location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LocationPicker
              onLocationSelect={handleLocationSelect}
              initialPincode={formData.pincode}
              initialLat={formData.latitude || undefined}
              initialLng={formData.longitude || undefined}
            />
          </CardContent>
        </Card>
      )}

      {/* Worker Category & Experience */}
      <Card>
        <CardHeader>
          <CardTitle>Work Details</CardTitle>
          <CardDescription>
            Select your worker category and experience level
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="worker_category">Worker Category</Label>
            {isEditing ? (
              <Select
                value={formData.worker_category}
                onValueChange={(value) => handleInputChange('worker_category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your primary work category" />
                </SelectTrigger>
                <SelectContent>
                  {WORKER_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>
                  {WORKER_CATEGORIES.find(c => c.value === profile?.worker_category)?.label || 'Not selected'}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience_level">Experience Level</Label>
            {isEditing ? (
              <Select
                value={formData.experience_level}
                onValueChange={(value) => handleInputChange('experience_level', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry Level (0-1 years)</SelectItem>
                  <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                  <SelectItem value="experienced">Experienced (3-5 years)</SelectItem>
                  <SelectItem value="expert">Expert (5+ years)</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>
                  {formData.experience_level === 'entry' && 'Entry Level (0-1 years)'}
                  {formData.experience_level === 'intermediate' && 'Intermediate (1-3 years)'}
                  {formData.experience_level === 'experienced' && 'Experienced (3-5 years)'}
                  {formData.experience_level === 'expert' && 'Expert (5+ years)'}
                  {!formData.experience_level && 'Not provided'}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skills Section */}
      <Card>
        <CardHeader>
          <CardTitle>Skills & Expertise</CardTitle>
          <CardDescription>
            Add skills that employers can search for
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing && (
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill (e.g., Customer Service, Cleaning, etc.)"
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
              />
              <Button onClick={addSkill} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {formData.skills.length > 0 ? (
              formData.skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {skill}
                  {isEditing && (
                    <button
                      onClick={() => removeSkill(skill)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">
                No skills added yet. Click "Edit Profile" to add your skills.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>
            Manage your account preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Account Type</h4>
              <p className="text-sm text-muted-foreground">Worker Account</p>
            </div>
            <Badge variant="default">Active</Badge>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Member Since</h4>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkerProfile;