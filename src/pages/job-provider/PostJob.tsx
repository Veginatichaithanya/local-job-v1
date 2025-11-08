import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { X, FileText } from "lucide-react";
import { LocationPicker } from "@/components/maps/LocationPicker";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingScreen } from "@/components/LoadingScreen";

interface JobFormData {
  title: string;
  description: string;
  required_skills: string[];
  location: string;
  wage: string;
  job_date: string;
  job_time: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  notification_scope: "local" | "all";
  requires_resume: boolean;
}

export default function PostJob() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentSkill, setCurrentSkill] = useState("");
  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    description: "",
    required_skills: [],
    location: "",
    wage: "",
    job_date: "",
    job_time: "",
    pincode: "",
    latitude: null,
    longitude: null,
    notification_scope: "all",
    requires_resume: false,
  });

  const addSkill = () => {
    if (currentSkill.trim() && !formData.required_skills.includes(currentSkill.trim())) {
      setFormData({
        ...formData,
        required_skills: [...formData.required_skills, currentSkill.trim()],
      });
      setCurrentSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      required_skills: formData.required_skills.filter(skill => skill !== skillToRemove),
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { data: jobData, error } = await supabase.from("jobs").insert({
        job_provider_id: user.id,
        title: formData.title,
        description: formData.description,
        required_skills: formData.required_skills,
        location: formData.location,
        wage: parseFloat(formData.wage),
        job_date: formData.job_date,
        job_time: formData.job_time || null,
        pincode: formData.pincode,
        latitude: formData.latitude,
        longitude: formData.longitude,
        notification_scope: formData.notification_scope,
        requires_resume: formData.requires_resume,
      }).select().single();

      if (error) throw error;

      // Notify nearby workers
      if (jobData && formData.latitude && formData.longitude) {
        await supabase.functions.invoke('notify-nearby-workers', {
          body: { jobId: jobData.id }
        });
      }

      toast({
        title: "Job posted successfully",
        description: "Your job has been posted and nearby workers have been notified.",
      });

      navigate("/job-provider/jobs");
    } catch (error) {
      console.error("Error posting job:", error);
      toast({
        title: "Error",
        description: "Failed to post job. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen fullScreen={false} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Post a New Job</h1>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Construction Worker, Waiter, Delivery Driver"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the job responsibilities, requirements, and any important details..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Required Skills</Label>
              <div className="flex space-x-2">
                <Input
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  placeholder="Enter a skill and press Add"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                />
                <Button type="button" onClick={addSkill} variant="outline">
                  Add
                </Button>
              </div>
              {formData.required_skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.required_skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Job Location *</Label>
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                initialPincode={formData.pincode}
                initialLat={formData.latitude || undefined}
                initialLng={formData.longitude || undefined}
              />
            </div>

            <div className="space-y-2">
              <Label>Notification Scope *</Label>
              <RadioGroup
                value={formData.notification_scope}
                onValueChange={(value: "local" | "all") =>
                  setFormData({ ...formData, notification_scope: value })
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="local" id="local" />
                  <Label htmlFor="local" className="font-normal cursor-pointer">
                    Local (Same Pincode Only)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="font-normal cursor-pointer">
                    All (All Completed Profiles)
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-sm text-muted-foreground">
                {formData.notification_scope === "local"
                  ? "Only workers in your pincode area will be notified"
                  : "All workers with completed profiles will be notified"}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requires_resume"
                checked={formData.requires_resume}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, requires_resume: checked as boolean })
                }
              />
              <Label htmlFor="requires_resume" className="font-normal cursor-pointer flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Require resume for this job
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wage">Wage (per hour/day) *</Label>
                <Input
                  id="wage"
                  type="number"
                  step="0.01"
                  value={formData.wage}
                  onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_date">Job Date *</Label>
                <Input
                  id="job_date"
                  type="date"
                  value={formData.job_date}
                  onChange={(e) => setFormData({ ...formData, job_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_time">Job Time (optional)</Label>
                <Input
                  id="job_time"
                  type="time"
                  value={formData.job_time}
                  onChange={(e) => setFormData({ ...formData, job_time: e.target.value })}
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Posting..." : "Post Job"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/job-provider/dashboard")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}