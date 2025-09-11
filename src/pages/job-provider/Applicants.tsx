import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, User, Calendar, MessageSquare } from "lucide-react";

interface Applicant {
  id: string;
  status: string;
  message: string;
  applied_at: string;
  worker: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    skills: string[];
    location: string;
  };
}

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  wage: number;
  job_date: string;
}

export default function Applicants() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);

  const jobId = searchParams.get("job");

  useEffect(() => {
    if (user && jobId) {
      fetchJobAndApplicants();
    }
  }, [user, jobId]);

  const fetchJobAndApplicants = async () => {
    try {
      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .eq("job_provider_id", user?.id)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      // Fetch applicants
      const { data: applicantsData, error: applicantsError } = await supabase
        .from("job_applications")
        .select(`
          *,
          worker:profiles!job_applications_worker_id_fkey (
            first_name,
            last_name,
            email,
            phone,
            skills,
            location
          )
        `)
        .eq("job_id", jobId)
        .order("applied_at", { ascending: false });

      if (applicantsError) throw applicantsError;

      setApplicants(applicantsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch applicants. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: "accepted" | "rejected") => {
    try {
      const { error } = await supabase
        .from("job_applications")
        .update({ 
          status, 
          processed_at: new Date().toISOString() 
        })
        .eq("id", applicationId);

      if (error) throw error;

      // If accepting, also update the job to mark the selected worker
      if (status === "accepted") {
        const acceptedApplicant = applicants.find(app => app.id === applicationId);
        if (acceptedApplicant) {
          await supabase
            .from("jobs")
            .update({ 
              status: "assigned",
              selected_worker_id: acceptedApplicant.worker.email // Using email as identifier
            })
            .eq("id", jobId);
        }
      }

      setApplicants(applicants.map(applicant => 
        applicant.id === applicationId 
          ? { ...applicant, status }
          : applicant
      ));

      toast({
        title: `Application ${status}`,
        description: `The application has been ${status} successfully.`,
      });
    } catch (error) {
      console.error("Error updating application:", error);
      toast({
        title: "Error",
        description: "Failed to update application status.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Job not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Applicants</h1>
        <p className="text-muted-foreground">for {job.title}</p>
      </div>

      {/* Job Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </CardContent>
      </Card>

      {/* Applicants List */}
      {applicants.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No applications received yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {applicants.map((applicant) => (
            <Card key={applicant.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {applicant.worker.first_name} {applicant.worker.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {applicant.worker.email}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(applicant.status)}>
                    {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Worker Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Phone:</span> {applicant.worker.phone || "Not provided"}
                    </div>
                    <div>
                      <span className="font-medium">Location:</span> {applicant.worker.location || "Not provided"}
                    </div>
                  </div>

                  {/* Skills */}
                  {applicant.worker.skills && applicant.worker.skills.length > 0 && (
                    <div>
                      <span className="font-medium text-sm">Skills:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {applicant.worker.skills.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Application Message */}
                  {applicant.message && (
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Application Message:</p>
                          <p className="text-sm text-muted-foreground">{applicant.message}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Application Date */}
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Applied on {new Date(applicant.applied_at).toLocaleDateString()}</span>
                  </div>

                  {/* Action Buttons */}
                  {applicant.status === "pending" && (
                    <div className="flex space-x-2 pt-4">
                      <Button
                        size="sm"
                        onClick={() => updateApplicationStatus(applicant.id, "accepted")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateApplicationStatus(applicant.id, "rejected")}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}