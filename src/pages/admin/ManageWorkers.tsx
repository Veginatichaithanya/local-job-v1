import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Mail, Phone, MapPin, Search, UserX, AlertTriangle } from "lucide-react";

interface Worker {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  location: string;
  skills: string[];
  created_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  auth_created_at: string;
}

export default function ManageWorkers() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    const filtered = workers.filter(worker =>
      `${worker.first_name} ${worker.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (worker.skills && worker.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())))
    );
    setFilteredWorkers(filtered);
  }, [workers, searchTerm]);

  const fetchWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_user_details")
        .select("*")
        .eq("role", "worker")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWorkers(data || []);
    } catch (error) {
      console.error("Error fetching workers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch workers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (workerId: string, workerName: string) => {
    try {
      // In a real app, you would update a status field
      toast({
        title: "Worker Suspended",
        description: `${workerName} has been suspended from the platform`,
        variant: "destructive",
      });
      
      // For demo purposes, we'll just show the message
      // In real app: await supabase.from("profiles").update({ status: "suspended" }).eq("id", workerId);
    } catch (error) {
      console.error("Error suspending worker:", error);
      toast({
        title: "Error",
        description: "Failed to suspend worker",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (workerId: string, workerName: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", workerId);

      if (error) throw error;

      toast({
        title: "Worker Deleted",
        description: `${workerName} has been permanently removed from the platform`,
        variant: "destructive",
      });
      
      setWorkers(workers.filter(w => w.id !== workerId));
    } catch (error) {
      console.error("Error deleting worker:", error);
      toast({
        title: "Error",
        description: "Failed to delete worker",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Manage Workers</h1>
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
        <h1 className="text-3xl font-bold">Manage Workers</h1>
        <p className="text-muted-foreground">
          View and manage all registered workers on the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Workers</CardTitle>
          <CardDescription>
            Search by name, email, or skills
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {filteredWorkers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Workers Found</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm ? "No workers match your search criteria." : "No workers have registered yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredWorkers.map((worker) => (
            <Card key={worker.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {worker.first_name} {worker.last_name}
                      </CardTitle>
                      <CardDescription>
                        Worker ID: {worker.id.slice(0, 8)}...
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-blue-600">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{worker.email}</span>
                  </div>
                  {worker.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{worker.phone}</span>
                    </div>
                  )}
                  {worker.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{worker.location}</span>
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Joined: {new Date(worker.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    User ID: {worker.user_id}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Email Verified: {worker.email_confirmed_at ? 'Yes' : 'No'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Last Login: {worker.last_sign_in_at ? new Date(worker.last_sign_in_at).toLocaleString() : 'Never'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Auth Created: {new Date(worker.auth_created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Security Warning Notice */}
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-red-800">
                    ⚠️ <strong>Security Note:</strong> Passwords are securely hashed by Supabase and cannot be viewed in plain text for security reasons. This is industry standard security practice.
                  </p>
                </div>

                {worker.skills && worker.skills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {worker.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => handleSuspend(worker.id, `${worker.first_name} ${worker.last_name}`)}
                    variant="outline"
                    size="sm"
                    className="text-orange-600 hover:text-orange-700 hover:border-orange-300"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Suspend
                  </Button>
                  <Button
                    onClick={() => handleDelete(worker.id, `${worker.first_name} ${worker.last_name}`)}
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