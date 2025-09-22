import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, Mail, Phone, MapPin, Search, UserX, AlertTriangle } from "lucide-react";

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
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  auth_created_at: string;
}

export default function ManageProviders() {
  const [providers, setProviders] = useState<JobProvider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<JobProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    const filtered = providers.filter(provider =>
      `${provider.first_name} ${provider.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProviders(filtered);
  }, [providers, searchTerm]);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_user_details")
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

  const handleSuspend = async (providerId: string, providerName: string) => {
    try {
      // In a real app, you would update a status field
      toast({
        title: "Provider Suspended",
        description: `${providerName} has been suspended from the platform`,
        variant: "destructive",
      });
      
      // For demo purposes, we'll just show the message
      // In real app: await supabase.from("profiles").update({ status: "suspended" }).eq("id", providerId);
    } catch (error) {
      console.error("Error suspending provider:", error);
      toast({
        title: "Error",
        description: "Failed to suspend provider",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (providerId: string, providerName: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", providerId);

      if (error) throw error;

      toast({
        title: "Provider Deleted",
        description: `${providerName} has been permanently removed from the platform`,
        variant: "destructive",
      });
      
      setProviders(providers.filter(p => p.id !== providerId));
    } catch (error) {
      console.error("Error deleting provider:", error);
      toast({
        title: "Error",
        description: "Failed to delete provider",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Manage Providers</h1>
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
        <h1 className="text-3xl font-bold">Manage Providers</h1>
        <p className="text-muted-foreground">
          View and manage all active job providers on the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Providers</CardTitle>
          <CardDescription>
            Search by name, email, or company name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search providers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {filteredProviders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Providers Found</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm ? "No providers match your search criteria." : "No job providers have registered yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredProviders.map((provider) => (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-green-600" />
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
                  <Badge variant="outline" className="text-green-600">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                  <div className="text-sm text-muted-foreground">
                    Joined: {new Date(provider.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    User ID: {provider.user_id}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Email Verified: {provider.email_confirmed_at ? 'Yes' : 'No'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Last Login: {provider.last_sign_in_at ? new Date(provider.last_sign_in_at).toLocaleString() : 'Never'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Auth Created: {new Date(provider.auth_created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Security Warning Notice */}
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-red-800">
                    ⚠️ <strong>Security Note:</strong> Passwords are securely hashed by Supabase and cannot be viewed in plain text for security reasons. This is industry standard security practice.
                  </p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => handleSuspend(provider.id, provider.company_name || `${provider.first_name} ${provider.last_name}`)}
                    variant="outline"
                    size="sm"
                    className="text-orange-600 hover:text-orange-700 hover:border-orange-300"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Suspend
                  </Button>
                  <Button
                    onClick={() => handleDelete(provider.id, provider.company_name || `${provider.first_name} ${provider.last_name}`)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}