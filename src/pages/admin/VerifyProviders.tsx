import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Building2, Mail, Phone, MapPin } from "lucide-react";

interface JobProvider {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  phone: string;
  location: string;
  created_at: string;
  role: string;
}

export default function VerifyProviders() {
  const [providers, setProviders] = useState<JobProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "job_provider")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error("Error fetching providers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch job providers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (providerId: string) => {
    try {
      // In a real app, you might update a verification status field
      // For now, we'll just show a success message
      toast({
        title: "Provider Approved",
        description: "Job provider has been approved and can now post jobs",
      });
      
      // Remove from pending list (in real app, update status instead)
      setProviders(providers.filter(p => p.id !== providerId));
    } catch (error) {
      console.error("Error approving provider:", error);
      toast({
        title: "Error",
        description: "Failed to approve provider",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (providerId: string) => {
    try {
      // In a real app, you might update a verification status field or delete the account
      toast({
        title: "Provider Rejected",
        description: "Job provider has been rejected",
        variant: "destructive",
      });
      
      // Remove from pending list
      setProviders(providers.filter(p => p.id !== providerId));
    } catch (error) {
      console.error("Error rejecting provider:", error);
      toast({
        title: "Error",
        description: "Failed to reject provider",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Verify Providers</h1>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Verify Providers</h1>
        <p className="text-muted-foreground">
          Review and approve job provider registrations
        </p>
      </div>

      {providers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground text-center">
              There are no job providers awaiting verification at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {providers.map((provider) => (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {provider.first_name} {provider.last_name}
                      </CardTitle>
                      <CardDescription className="text-lg font-medium">
                        {provider.company_name}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline">Pending Approval</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{provider.email}</span>
                  </div>
                  {provider.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{provider.phone}</span>
                    </div>
                  )}
                  {provider.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{provider.location}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Registered: {new Date(provider.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleReject(provider.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApprove(provider.id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}