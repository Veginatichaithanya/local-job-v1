import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, DollarSign, User } from "lucide-react";

interface CompletedJob {
  id: string;
  title: string;
  description: string;
  location: string;
  wage: number;
  job_date: string;
  created_at: string;
  selected_worker: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export default function JobHistory() {
  const { user } = useAuth();
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCompletedJobs();
    }
  }, [user]);

  const fetchCompletedJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          selected_worker:profiles!jobs_selected_worker_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq("job_provider_id", user?.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCompletedJobs(data || []);
    } catch (error) {
      console.error("Error fetching completed jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Job History</h1>

      {completedJobs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No completed jobs yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {completedJobs.map((job) => (
            <Card key={job.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{job.title}</CardTitle>
                  <Badge className="bg-gray-100 text-gray-800">
                    Completed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">{job.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{job.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">${job.wage}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(job.job_date).toLocaleDateString()}
                      </span>
                    </div>
                    {job.selected_worker && (
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {job.selected_worker.first_name} {job.selected_worker.last_name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Posted on {new Date(job.created_at).toLocaleDateString()}
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