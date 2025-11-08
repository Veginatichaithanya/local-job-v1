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
import { MapPin, Phone, Mail, User, Briefcase, Plus, X, Upload, Camera, AlertCircle, Trash2, FileText, Loader2, Sparkles, Eye, CheckCircle2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { LocationPicker } from "@/components/maps/LocationPicker";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ParsedDataPreview } from "@/components/worker/ParsedDataPreview";
import { detectWorkerCategory } from "@/utils/workerCategoryDetection";
import { LoadingScreen } from "@/components/LoadingScreen";

export const WORKER_CATEGORIES = [
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
  const [previousWorks, setPreviousWorks] = useState<any[]>([]);
  const [isAddingWork, setIsAddingWork] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [parsedDataPreview, setParsedDataPreview] = useState<any>(null);
  const [showParsedDataPreview, setShowParsedDataPreview] = useState(false);
  const [previousFormData, setPreviousFormData] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
    alternate_phone: profile?.alternate_phone || '',
    location: profile?.location || '',
    skills: profile?.skills || [],
    pincode: profile?.pincode || '',
    latitude: profile?.latitude || null,
    longitude: profile?.longitude || null,
    profile_photo_url: profile?.profile_photo_url || '',
    experience_level: profile?.experience_level || '',
    worker_category: profile?.worker_category || '',
    resume_url: profile?.resume_url || '',
  });

  const [newWork, setNewWork] = useState({
    company_name: '',
    job_title: '',
    description: '',
    duration: '',
    location: '',
  });

  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        alternate_phone: profile.alternate_phone || '',
        location: profile.location || '',
        skills: profile.skills || [],
        pincode: profile.pincode || '',
        latitude: profile.latitude || null,
        longitude: profile.longitude || null,
        profile_photo_url: profile.profile_photo_url || '',
        experience_level: profile.experience_level || '',
        worker_category: profile.worker_category || '',
        resume_url: profile.resume_url || '',
      });
      setProfileCompletion(profile.profile_completion_percentage || 0);
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      fetchPreviousWorks();
    }
  }, [user]);

  const fetchPreviousWorks = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('worker_previous_works' as any)
      .select('*')
      .eq('worker_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching previous works:', error);
    } else {
      setPreviousWorks(data || []);
    }
  };

  const fetchProfileCompletion = async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase.rpc('calculate_profile_completion', {
      profile_id: profile.id
    });

    if (!error && data !== null) {
      setProfileCompletion(data);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (field: 'phone' | 'alternate_phone', value: string) => {
    // Only allow digits and limit to 10
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, [field]: cleaned }));
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
    // Validate phone numbers
    if (formData.phone && formData.phone.length !== 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Phone number must be exactly 10 digits",
        variant: "destructive",
      });
      return;
    }

    if (formData.alternate_phone && formData.alternate_phone.length !== 10) {
      toast({
        title: "Invalid Alternate Phone Number",
        description: "Alternate phone number must be exactly 10 digits",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Show loading for minimum time
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 2000));
    
    const updatePromise = updateProfile(formData);
    
    await Promise.all([minLoadingTime, updatePromise]);
    
    const { error } = await updatePromise;
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } else {
      await fetchProfileCompletion();
      toast({
        title: "Success",
        description: `Profile updated successfully! Completion: ${profileCompletion}%`,
      });
      setIsEditing(false);
    }
    
    setIsLoading(false);
  };

  const addPreviousWork = async () => {
    if (!user || !newWork.company_name || !newWork.job_title) {
      toast({
        title: "Missing Information",
        description: "Please fill in company name and job title",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('worker_previous_works' as any)
      .insert([{ ...newWork, worker_id: user.id }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add previous work",
        variant: "destructive",
      });
    } else {
      await fetchPreviousWorks();
      await fetchProfileCompletion();
      setNewWork({ company_name: '', job_title: '', description: '', duration: '', location: '' });
      setIsAddingWork(false);
      toast({
        title: "Success",
        description: `Previous work added! Profile completion: ${profileCompletion}%`,
      });
    }
  };

  const deletePreviousWork = async (workId: string) => {
    const { error } = await supabase
      .from('worker_previous_works' as any)
      .delete()
      .eq('id', workId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete previous work",
        variant: "destructive",
      });
    } else {
      await fetchPreviousWorks();
      await fetchProfileCompletion();
      toast({
        title: "Success",
        description: "Previous work deleted",
      });
    }
  };

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a resume smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, DOC, or DOCX file",
          variant: "destructive",
        });
        return;
      }
      
      setResumeFile(file);
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile || !user) return;
    
    setIsParsingResume(true);
    setParsedDataPreview(null);
    
    try {
      // 1. Upload to storage
      const fileExt = resumeFile.name.split('.').pop();
      const fileName = `${user.id}/resume_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, resumeFile, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // 2. Create signed URL (valid for 1 hour)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('resumes')
        .createSignedUrl(fileName, 3600);
      
      if (signedUrlError) throw signedUrlError;
      
      // 3. Call parse-resume edge function with signed URL
      const { data: parsedData, error: parseError } = await supabase.functions.invoke('parse-resume', {
        body: { resumeUrl: signedUrlData.signedUrl }
      });
      
      if (parseError) throw parseError;
      
      // Check for errors in response
      if (parsedData.error) {
        throw new Error(parsedData.error + (parsedData.suggestion ? '\n\n' + parsedData.suggestion : ''));
      }
      
      console.log('Resume parsed successfully:', parsedData);
      
      // Store current form data as backup
      setPreviousFormData({ ...formData });
      
      // Store parsed data and show preview
      setParsedDataPreview({ ...parsedData, resumeFileName: fileName });
      setShowParsedDataPreview(true);
      
    } catch (error: any) {
      console.error('Error uploading/parsing resume:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to parse resume. Please try again.",
        variant: "destructive",
      });
      setResumeFile(null);
    } finally {
      setIsParsingResume(false);
    }
  };

  const handleApplyParsedData = async (editedData: any) => {
    if (!user || !profile) return;

    try {
      // Detect worker category from parsed data
      const detectedCategory = detectWorkerCategory(editedData);
      
      // Merge parsed data with existing form data
      const uniqueSkills = [...new Set([...formData.skills, ...(editedData.skills || [])])];
      
      const updatedFormData = {
        ...formData,
        first_name: editedData.personal_info?.first_name || formData.first_name,
        last_name: editedData.personal_info?.last_name || formData.last_name,
        phone: editedData.personal_info?.phone || formData.phone,
        skills: uniqueSkills,
        location: editedData.location?.address || formData.location,
        pincode: editedData.location?.pincode || formData.pincode,
        resume_url: editedData.resumeFileName,
        worker_category: detectedCategory || formData.worker_category
      };

      setFormData(updatedFormData);

      // Save all personal information and location to database
      const { error: profileError } = await updateProfile({
        first_name: updatedFormData.first_name,
        last_name: updatedFormData.last_name,
        phone: updatedFormData.phone,
        skills: updatedFormData.skills,
        location: updatedFormData.location,
        pincode: updatedFormData.pincode,
        worker_category: updatedFormData.worker_category,
        resume_url: editedData.resumeFileName,
      });

      if (profileError) {
        throw new Error('Failed to update profile');
      }

      // Add previous works if any
      if (editedData.previous_works && editedData.previous_works.length > 0) {
        for (const work of editedData.previous_works) {
          await supabase.from('worker_previous_works').insert({
            worker_id: user.id,
            company_name: work.company_name,
            job_title: work.job_title,
            duration: work.duration || '',
            description: work.description || '',
            location: work.location || '',
          });
        }
        await fetchPreviousWorks();
      }
      
      setShowParsedDataPreview(false);
      setParsedDataPreview(null);
      
      let message = 'Resume data applied to profile!';
      if (detectedCategory) {
        const categoryLabel = WORKER_CATEGORIES.find(c => c.value === detectedCategory)?.label;
        message += ` Auto-detected category: ${categoryLabel}`;
      }
      
      toast({
        title: "Success! 🎉",
        description: message
      });
      
      if (editedData.warnings && editedData.warnings.length > 0) {
        setTimeout(() => {
          toast({
            title: "Review Needed",
            description: "Some data may need manual review. Please check all fields.",
            variant: "default"
          });
        }, 1000);
      }
      
      // Recalculate profile completion
      await fetchProfileCompletion();
      
    } catch (error: any) {
      console.error('Error applying parsed data:', error);
      toast({
        title: "Error",
        description: "Failed to apply parsed data",
        variant: "destructive"
      });
    }
  };

  const handleCancelParsedData = () => {
    setShowParsedDataPreview(false);
    setParsedDataPreview(null);
    setResumeFile(null);
    
    // Optionally restore previous form data
    if (previousFormData) {
      setFormData(previousFormData);
      setPreviousFormData(null);
    }
  };

  const handleDeleteResume = async () => {
    if (!user || !formData.resume_url) return;
    
    try {
      // Extract file path from URL
      const urlParts = formData.resume_url.split('/resumes/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('resumes').remove([filePath]);
      }
      
      await updateProfile({ resume_url: null, resume_uploaded_at: null });
      setFormData(prev => ({ ...prev, resume_url: '' }));
      
      toast({
        title: "Success",
        description: "Resume deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting resume:", error);
      toast({
        title: "Error",
        description: "Failed to delete resume",
        variant: "destructive",
      });
    }
  };

  const openResume = async () => {
    try {
      if (!formData.resume_url) throw new Error('Missing URL');
      const parts = formData.resume_url.split('/resumes/');
      if (parts.length < 2) throw new Error('Invalid resume URL');
      const filePath = parts[1].split('?')[0];
      const { data, error } = await supabase.storage.from('resumes').createSignedUrl(filePath, 300);
      if (error || !data?.signedUrl) throw error || new Error('Could not create signed URL');
      window.open(data.signedUrl, '_blank');
    } catch (e) {
      console.error('Open resume error:', e);
      toast({
        title: 'Unable to open resume',
        description: 'Please try re-uploading your resume.',
        variant: 'destructive',
      });
    }
  };
  const handleCancel = () => {
    setFormData({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone: profile?.phone || '',
      alternate_phone: profile?.alternate_phone || '',
      location: profile?.location || '',
      skills: profile?.skills || [],
      pincode: profile?.pincode || '',
      latitude: profile?.latitude || null,
      longitude: profile?.longitude || null,
      profile_photo_url: profile?.profile_photo_url || '',
      experience_level: profile?.experience_level || '',
      worker_category: profile?.worker_category || '',
      resume_url: profile?.resume_url || '',
    });
    setIsEditing(false);
    setResumeFile(null);
  };

  const canAccessJobs = profileCompletion >= 75;

  if (isLoading) {
    return <LoadingScreen fullScreen={false} />;
  }

  return (
    <>
      {showParsedDataPreview && parsedDataPreview && (
        <ParsedDataPreview
          parsedData={parsedDataPreview}
          onApply={handleApplyParsedData}
          onCancel={handleCancelParsedData}
        />
      )}
      
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

      {/* Resume Upload - Modern UI */}
      <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Resume Upload (AI-Powered)
          </CardTitle>
          <CardDescription>
            Upload your resume and AI will automatically extract your information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isParsingResume && (
            <Alert className="border-primary/50 bg-primary/5">
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
              <AlertTitle>AI is analyzing your resume...</AlertTitle>
              <AlertDescription>
                This usually takes 5-10 seconds. We're extracting your skills, experience, and contact information.
              </AlertDescription>
            </Alert>
          )}

          {parsedDataPreview && (
            <Alert className="border-green-500/50 bg-green-500/5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle>Resume Parsed Successfully! 🎉</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>We've extracted the following information:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {parsedDataPreview.personal_info?.first_name && (
                    <li>Name: {parsedDataPreview.personal_info.first_name} {parsedDataPreview.personal_info.last_name}</li>
                  )}
                  {parsedDataPreview.personal_info?.phone && (
                    <li>Phone: {parsedDataPreview.personal_info.phone}</li>
                  )}
                  <li>Skills: {parsedDataPreview.skills?.length || 0} skills added</li>
                  <li>Experience: {parsedDataPreview.previous_works?.length || 0} positions added</li>
                  {parsedDataPreview.location?.address && <li>Location: {parsedDataPreview.location.address}</li>}
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Review the information below and make any necessary corrections.
                </p>
              </AlertDescription>
            </Alert>
          )}
          
          {!formData.resume_url ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary/80 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-primary" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">PDF, DOC, DOCX (MAX. 5MB)</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeFileChange}
                    disabled={isParsingResume || !isEditing}
                  />
                </label>
              </div>
              
              {resumeFile && (
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{resumeFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleResumeUpload}
                    disabled={isParsingResume}
                    className="ml-4"
                  >
                    {isParsingResume ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Parse Resume
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Resume Uploaded</p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.resume_uploaded_at && new Date(profile.resume_uploaded_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={openResume}>
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
                {isEditing && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => {
                      setFormData(prev => ({ ...prev, resume_url: '' }));
                      setResumeFile(null);
                    }}>
                      <Upload className="w-4 h-4 mr-2" />
                      Replace
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDeleteResume}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Photo - Modern UI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Profile Photo
          </CardTitle>
          <CardDescription>
            Upload a professional photo to help employers recognize you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-primary/20">
                <AvatarImage src={formData.profile_photo_url || ''} />
                <AvatarFallback className="text-2xl bg-primary/10">
                  {formData.first_name?.[0]}{formData.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <label className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Profile Photo</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Upload a professional photo (JPG, PNG, Max 2MB)
              </p>
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </div>
              )}
              {!isEditing && !formData.profile_photo_url && (
                <p className="text-sm text-muted-foreground">
                  No photo uploaded. Click "Edit Profile" to add one.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isEditing && (
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      )}

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              {isEditing ? (
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/50 text-sm">
                    🇮🇳 +91
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange('phone', e.target.value)}
                    placeholder="10-digit number"
                    maxLength={10}
                    pattern="[0-9]{10}"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>🇮🇳 +91 {profile?.phone || 'Not provided'}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Enter 10-digit Indian mobile number</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alternate_phone">Alternate Phone Number</Label>
              {isEditing ? (
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/50 text-sm">
                    🇮🇳 +91
                  </div>
                  <Input
                    id="alternate_phone"
                    type="tel"
                    value={formData.alternate_phone}
                    onChange={(e) => handlePhoneChange('alternate_phone', e.target.value)}
                    placeholder="10-digit number"
                    maxLength={10}
                    pattern="[0-9]{10}"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{profile?.alternate_phone ? `🇮🇳 +91 ${profile.alternate_phone}` : 'Not provided'}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Optional backup contact number</p>
            </div>
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

      {/* Previous Work Experience */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Previous Work Experience</CardTitle>
              <CardDescription>
                Add your previous work history to increase profile completion (+15%)
              </CardDescription>
            </div>
            {!isAddingWork && (
              <Button onClick={() => setIsAddingWork(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Work
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAddingWork && (
            <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={newWork.company_name}
                    onChange={(e) => setNewWork({ ...newWork, company_name: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title *</Label>
                  <Input
                    id="job_title"
                    value={newWork.job_title}
                    onChange={(e) => setNewWork({ ...newWork, job_title: e.target.value })}
                    placeholder="Enter job title"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={newWork.duration}
                    onChange={(e) => setNewWork({ ...newWork, duration: e.target.value })}
                    placeholder="e.g., 2 years, 6 months"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work_location">Location</Label>
                  <Input
                    id="work_location"
                    value={newWork.location}
                    onChange={(e) => setNewWork({ ...newWork, location: e.target.value })}
                    placeholder="Enter work location"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  value={newWork.description}
                  onChange={(e) => setNewWork({ ...newWork, description: e.target.value })}
                  placeholder="Describe your responsibilities and achievements"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={addPreviousWork}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Work
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsAddingWork(false);
                  setNewWork({ company_name: '', job_title: '', description: '', duration: '', location: '' });
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {previousWorks.length > 0 ? (
            <div className="space-y-3">
              {previousWorks.map((work) => (
                <div key={work.id} className="p-4 border rounded-lg space-y-2 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{work.job_title}</h4>
                      <p className="text-sm text-muted-foreground">{work.company_name}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePreviousWork(work.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {(work.duration || work.location) && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {work.duration && <span>📅 {work.duration}</span>}
                      {work.location && <span>📍 {work.location}</span>}
                    </div>
                  )}
                  {work.description && (
                    <p className="text-sm mt-2">{work.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No previous work experience added yet.</p>
              <p className="text-xs">Add your work history to boost your profile completion!</p>
            </div>
          )}
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
    </>
  );
};

export default WorkerProfile;