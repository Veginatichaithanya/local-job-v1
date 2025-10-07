import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  History,
  MapPin,
  IndianRupee,
  Calendar,
  Building2,
  TrendingUp,
  Briefcase
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompletedJob {
  id: string;
  job_id: string;
  applied_at: string;
  job: {
    id: string;
    title: string;
    description: string;
    location: string;
    wage: number;
    job_date: string;
    job_time: string;
    pincode: string;
    status: string;
  };
}

const JobHistory = () => {
  const { user } = useAuth();
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    if (!user) return;
    
    fetchCompletedJobs();

    // Real-time subscription
    const channel = supabase
      .channel('job-history-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_applications',
          filter: `worker_id=eq.${user.id}`,
        },
        () => {
          fetchCompletedJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchCompletedJobs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          id,
          job_id,
          applied_at,
          job:jobs (
            id,
            title,
            description,
            location,
            wage,
            job_date,
            job_time,
            pincode,
            status
          )
        `)
        .eq('worker_id', user.id)
        .eq('status', 'accepted')
        .order('applied_at', { ascending: false });

      if (error) throw error;

      // Filter for jobs that are completed (job status is 'completed')
      const completedJobsData = (data as CompletedJob[]).filter(
        (app) => app.job.status === 'completed'
      );
      
      setCompletedJobs(completedJobsData);

      // Calculate stats
      const totalEarnings = completedJobsData.reduce((sum, job) => sum + Number(job.job.wage), 0);
      setStats({
        totalJobs: completedJobsData.length,
        totalEarnings,
      });
    } catch (error) {
      console.error('Error fetching job history:', error);
      toast.error('Failed to load job history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Job History</h1>
        <p className="text-muted-foreground">
          View your completed jobs and earnings
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Completed Jobs</CardDescription>
            <CardTitle className="text-4xl flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-primary" />
              {stats.totalJobs}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Earnings</CardDescription>
            <CardTitle className="text-4xl flex items-center gap-2">
              <IndianRupee className="h-8 w-8 text-green-600" />
              {stats.totalEarnings.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average Per Job</CardDescription>
            <CardTitle className="text-4xl flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              {stats.totalJobs > 0 ? (stats.totalEarnings / stats.totalJobs).toFixed(0) : 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {completedJobs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No completed jobs yet</h3>
            <p className="text-muted-foreground mb-4">
              Complete jobs to build your work history and track your earnings.
            </p>
            <Button asChild>
              <a href="/worker/jobs">Browse Available Jobs</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {completedJobs.map((jobApp) => (
            <Card key={jobApp.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg sm:text-xl">{jobApp.job.title}</CardTitle>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Building2 className="h-4 w-4" />
                      <span>{jobApp.job.location}</span>
                    </div>
                  </div>
                  
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    ✔️ Completed
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <CardDescription className="text-base">
                  {jobApp.job.description}
                </CardDescription>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{jobApp.job.pincode}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-600">₹{jobApp.job.wage}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(jobApp.job.job_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Job Time</p>
                      <p className="text-sm">{jobApp.job.job_time || 'Not specified'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-muted-foreground">Earned</p>
                      <p className="text-lg font-bold text-green-600">₹{jobApp.job.wage}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobHistory;