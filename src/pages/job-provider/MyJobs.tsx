import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, Users, Eye } from "lucide-react";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  wage: number;
  job_date: string;
  status: string;
  created_at: string;
  applicant_count: number;
}

export default function MyJobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  const fetchJobs = async () => {
    try {
      const { data: jobsData, error } = await supabase
        .from("jobs")
        .select(`
          *,
          job_applications(count)
        `)
        .eq("job_provider_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedJobs = jobsData?.map(job => ({
        ...job,
        applicant_count: job.job_applications?.length || 0,
      })) || [];

      setJobs(formattedJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch jobs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("id", jobId);

      if (error) throw error;

      setJobs(jobs.filter(job => job.id !== jobId));
      toast({
        title: "Job deleted",
        description: "The job has been removed successfully.",
      });
    } catch (error) {
      console.error("Error deleting job:", error);
      toast({
        title: "Error",
        description: "Failed to delete job. Please try again.",
        variant: "destructive",
      });
    }
  };

  const markAsCompleted = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ status: "completed" })
        .eq("id", jobId);

      if (error) throw error;

      setJobs(jobs.map(job => 
        job.id === jobId ? { ...job, status: "completed" } : job
      ));

      toast({
        title: "Job marked as completed",
        description: "The job status has been updated.",
      });
    } catch (error) {
      console.error("Error updating job:", error);
      toast({
        title: "Error",
        description: "Failed to update job status.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "posted":
        return "bg-green-100 text-green-800";
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Jobs</h1>
        <Button onClick={() => navigate("/job-provider/post-job")}>
          Post New Job
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">You haven't posted any jobs yet.</p>
            <Button onClick={() => navigate("/job-provider/post-job")}>
              Post Your First Job
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <p className="text-muted-foreground mt-1">
                      Posted on {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(job.status)}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {job.applicant_count} applicant{job.applicant_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">{job.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Location:</span> {job.location}
                    </div>
                    <div>
                      <span className="font-medium">Wage:</span> ${job.wage}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {new Date(job.job_date).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-4">
                    {job.applicant_count > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/job-provider/applicants?job=${job.id}`)}
                      >
                        <Users className="w-4 h-4 mr-1" />
                        View Applicants ({job.applicant_count})
                      </Button>
                    )}
                    
                    {job.status === "posted" && (
                      <Button
                        size="sm"
                        onClick={() => markAsCompleted(job.id)}
                      >
                        Mark as Completed
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteJob(job.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
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