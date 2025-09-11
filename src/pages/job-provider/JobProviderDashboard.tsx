import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, Users, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalApplicants: number;
}

interface RecentJob {
  id: string;
  title: string;
  status: string;
  created_at: string;
  applicant_count: number;
}

export default function JobProviderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalApplicants: 0,
  });
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch job statistics
      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .eq("job_provider_id", user?.id);

      if (jobsError) throw jobsError;

      // Fetch application count
      const { count: applicantCount, error: applicantError } = await supabase
        .from("job_applications")
        .select("*", { count: "exact", head: true })
        .in("job_id", jobs?.map(job => job.id) || []);

      if (applicantError) throw applicantError;

      // Calculate stats
      const totalJobs = jobs?.length || 0;
      const activeJobs = jobs?.filter(job => job.status === "posted").length || 0;
      const completedJobs = jobs?.filter(job => job.status === "completed").length || 0;

      setStats({
        totalJobs,
        activeJobs,
        completedJobs,
        totalApplicants: applicantCount || 0,
      });

      // Fetch recent jobs with applicant count
      const { data: recentJobsData, error: recentError } = await supabase
        .from("jobs")
        .select(`
          id,
          title,
          status,
          created_at,
          job_applications(count)
        `)
        .eq("job_provider_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      const formattedRecentJobs = recentJobsData?.map(job => ({
        id: job.id,
        title: job.title,
        status: job.status,
        created_at: job.created_at,
        applicant_count: job.job_applications?.length || 0,
      })) || [];

      setRecentJobs(formattedRecentJobs);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
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
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={() => navigate("/job-provider/post-job")}>
          <Plus className="w-4 h-4 mr-2" />
          Post New Job
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs Posted</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeJobs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedJobs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applicants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplicants}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No jobs posted yet.</p>
              <Button 
                className="mt-4" 
                onClick={() => navigate("/job-provider/post-job")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Post Your First Job
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate("/job-provider/jobs")}
                >
                  <div className="space-y-1">
                    <h3 className="font-medium">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}