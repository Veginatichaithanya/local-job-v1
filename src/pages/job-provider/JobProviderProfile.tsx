import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { LocationPicker } from "@/components/maps/LocationPicker";
import { Progress } from "@/components/ui/progress";
import { Building2, MapPin, Phone, Mail } from "lucide-react";

export default function JobProviderProfile() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    company_name: profile?.company_name || "",
    business_type: profile?.business_type || "",
    location: profile?.location || "",
    pincode: profile?.pincode || "",
    latitude: profile?.latitude || null,
    longitude: profile?.longitude || null,
  });

  // Calculate profile completion percentage
  useEffect(() => {
    if (!profile) return;

    let score = 0;

    // Basic info (20% each for name and phone)
    if (profile.first_name && profile.last_name) score += 20;
    if (profile.phone) score += 15;

    // Company details (25%)
    if (profile.company_name) score += 15;
    if (profile.business_type) score += 10;

    // Location (30%)
    if (profile.pincode && profile.latitude && profile.longitude) score += 30;
    if (profile.location) score += 10;

    setCompletionPercentage(Math.min(score, 100));
  }, [profile]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await updateProfile(formData);
      if (error) throw error;

      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      company_name: profile?.company_name || "",
      business_type: profile?.business_type || "",
      location: profile?.location || "",
      pincode: profile?.pincode || "",
      latitude: profile?.latitude || null,
      longitude: profile?.longitude || null,
    });
    setIsEditing(false);
  };

  const handleLocationSelect = (locationData: {
    pincode: string;
    latitude: number;
    longitude: number;
    address?: string;
  }) => {
    setFormData({
      ...formData,
      pincode: locationData.pincode,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      location: locationData.address || formData.location,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your business profile and contact information
        </p>
      </div>

      {/* Profile Completion Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Completion</CardTitle>
          <CardDescription>
            Complete your profile to start posting jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Profile strength</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            {completionPercentage < 100 && (
              <p className="text-xs text-muted-foreground mt-2">
                {completionPercentage < 50
                  ? "Add more details to improve your profile visibility"
                  : "Almost there! Complete remaining fields to maximize your reach"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end items-center">
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        ) : (
          <div className="space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter last name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter phone number"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business_type">Business Type *</Label>
              <Input
                id="business_type"
                value={formData.business_type}
                onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                disabled={!isEditing}
                placeholder="e.g., Construction, Restaurant, Retail"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Business Location
          </CardTitle>
          <CardDescription>
            Set your business location to help workers find nearby jobs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">Business Address</Label>
            <Textarea
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              disabled={!isEditing}
              placeholder="Enter your complete business address"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Pincode and Map Location *</Label>
            {isEditing ? (
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                initialPincode={formData.pincode}
                initialLat={formData.latitude || undefined}
                initialLng={formData.longitude || undefined}
              />
            ) : (
              <div className="p-4 bg-muted rounded-lg">
                {formData.pincode ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Pincode: {formData.pincode}</p>
                    {formData.latitude && formData.longitude && (
                      <p className="text-xs text-muted-foreground">
                        Coordinates: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No location set</p>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Setting your location helps match you with nearby workers
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
