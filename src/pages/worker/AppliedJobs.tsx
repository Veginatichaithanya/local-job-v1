import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { MapPin, IndianRupee, Clock, Calendar, MessageCircle, Eye, Building2, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AppliedJob {
  id: string;
  job_id: string;
  status: string;
  applied_at: string;
  message: string | null;
  job: {
    id: string;
    title: string;
    description: string;
    location: string;
    wage: number;
    job_date: string;
    job_time: string;
    pincode: string;
    latitude: number;
    longitude: number;
  };
}

const AppliedJobs = () => {
  const { user, profile } = useAuth();
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    fetchAppliedJobs();

    // Real-time subscription for application updates
    const channel = supabase
      .channel('applied-jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_applications',
          filter: `worker_id=eq.${user.id}`,
        },
        () => {
          fetchAppliedJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchAppliedJobs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          id,
          job_id,
          status,
          applied_at,
          message,
          job:jobs (
            id,
            title,
            description,
            location,
            wage,
            job_date,
            job_time,
            pincode,
            latitude,
            longitude
          )
        `)
        .eq('worker_id', user.id)
        .order('applied_at', { ascending: false });

      if (error) throw error;

      setAppliedJobs(data as AppliedJob[]);
    } catch (error) {
      console.error('Error fetching applied jobs:', error);
      toast.error('Failed to load your applications');
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance if profile has location
  const calculateDistance = (jobLat: number, jobLng: number) => {
    if (!profile?.latitude || !profile?.longitude) return 'N/A';
    
    const R = 6371; // Earth's radius in km
    const dLat = (jobLat - profile.latitude) * Math.PI / 180;
    const dLon = (jobLng - profile.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(profile.latitude * Math.PI / 180) * Math.cos(jobLat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance.toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">🟠 Pending</Badge>;
      case 'accepted':
        return <Badge variant="default" className="bg-green-100 text-green-700">✅ Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">❌ Rejected</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">✔️ Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getJobsByStatus = (status: string) => {
    return appliedJobs.filter(job => job.status === status);
  };

  const getStatusMessage = (status: string, appliedDate: string) => {
    const daysAgo = Math.floor((Date.now() - new Date(appliedDate).getTime()) / (1000 * 60 * 60 * 24));
    
    switch (status) {
      case 'pending':
        return `Your application is under review. Applied ${daysAgo} days ago.`;
      case 'accepted':
        return 'Congratulations! Your application has been accepted.';
      case 'rejected':
        return 'Unfortunately, your application was not selected for this position.';
      case 'completed':
        return 'Job completed successfully!';
      default:
        return 'Application status unknown';
    }
  };

  const JobCard = ({ job }: { job: AppliedJob }) => {
    const distance = calculateDistance(job.job.latitude, job.job.longitude);
    const statusMessage = getStatusMessage(job.status, job.applied_at);

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg sm:text-xl">{job.job.title}</CardTitle>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin className="h-4 w-4" />
                <span>{job.job.location}</span>
              </div>
            </div>
            
            <div className="text-left sm:text-right space-y-2">
              {getStatusBadge(job.status)}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <CardDescription className="text-base">
            {job.job.description}
          </CardDescription>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{job.job.pincode} • {distance} km away</span>
            </div>
            
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">₹{job.job.wage}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{job.job.job_time || 'Not specified'}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Applied on {new Date(job.applied_at).toLocaleDateString()}</span>
            </div>
            
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground mb-1">Status Update:</p>
              <p className="text-sm">{statusMessage}</p>
              
              {job.status === 'accepted' && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Job date: {new Date(job.job.job_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {job.status === 'completed' && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">
                    Completed: {new Date(job.job.job_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {job.message && (
              <div className="p-3 bg-primary/5 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-1">Your message:</p>
                <p className="text-sm">{job.message}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Applied Jobs</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Track the status of your job applications
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        {/* Mobile: Horizontal scrollable tabs */}
        <div className="block md:hidden">
          <TabsList className="inline-flex h-auto p-1 bg-muted rounded-lg w-auto min-w-full overflow-x-auto">
            <div className="flex space-x-1 min-w-max px-1">
              <TabsTrigger value="all" className="whitespace-nowrap px-3 py-2 text-xs">All ({appliedJobs.length})</TabsTrigger>
              <TabsTrigger value="pending" className="whitespace-nowrap px-3 py-2 text-xs">Pending ({getJobsByStatus('pending').length})</TabsTrigger>
              <TabsTrigger value="accepted" className="whitespace-nowrap px-3 py-2 text-xs">Accepted ({getJobsByStatus('accepted').length})</TabsTrigger>
              <TabsTrigger value="completed" className="whitespace-nowrap px-3 py-2 text-xs">Completed ({getJobsByStatus('completed').length})</TabsTrigger>
              <TabsTrigger value="rejected" className="whitespace-nowrap px-3 py-2 text-xs">Rejected ({getJobsByStatus('rejected').length})</TabsTrigger>
            </div>
          </TabsList>
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden md:block">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({appliedJobs.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({getJobsByStatus('pending').length})</TabsTrigger>
            <TabsTrigger value="accepted">Accepted ({getJobsByStatus('accepted').length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({getJobsByStatus('completed').length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({getJobsByStatus('rejected').length})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-4">
          {appliedJobs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No applications yet</p>
          ) : (
            appliedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {getJobsByStatus('pending').length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending applications</p>
          ) : (
            getJobsByStatus('pending').map((job) => (
              <JobCard key={job.id} job={job} />
            ))
          )}
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4">
          {getJobsByStatus('accepted').length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No accepted applications</p>
          ) : (
            getJobsByStatus('accepted').map((job) => (
              <JobCard key={job.id} job={job} />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {getJobsByStatus('completed').length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No completed jobs</p>
          ) : (
            getJobsByStatus('completed').map((job) => (
              <JobCard key={job.id} job={job} />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {getJobsByStatus('rejected').length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No rejected applications</p>
          ) : (
            getJobsByStatus('rejected').map((job) => (
              <JobCard key={job.id} job={job} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {appliedJobs.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No applications yet</h3>
            <p className="text-muted-foreground mb-4">
              Start applying to jobs to track your applications here.
            </p>
            <Button asChild>
              <a href="/worker/jobs">Browse Available Jobs</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AppliedJobs;