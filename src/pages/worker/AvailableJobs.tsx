import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, IndianRupee, Clock, Search, Filter, Briefcase, Building2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { JobsMap } from "@/components/maps/JobsMap";
import { LoadingScreen } from "@/components/LoadingScreen";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  wage: number;
  job_date: string;
  job_time: string;
  required_skills: string[];
  latitude: number;
  longitude: number;
  pincode: string;
  distance?: number;
}

const AvailableJobs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("distance");
  const [filterByDistance, setFilterByDistance] = useState("all");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, [profile]);

  const fetchJobs = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      // Check if worker has enough profile completion
      if ((profile.profile_completion_percentage || 0) < 75) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from('jobs')
        .select('*')
        .eq('status', 'posted')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Calculate distance for each job if worker has location
      if (profile.latitude && profile.longitude && data) {
        const jobsWithDistance = data.map((job: any) => {
          if (job.latitude && job.longitude) {
            const distance = calculateDistance(
              profile.latitude!,
              profile.longitude!,
              job.latitude,
              job.longitude
            );
            return { ...job, distance };
          }
          return { ...job, distance: undefined };
        });
        setJobs(jobsWithDistance);
      } else {
        setJobs(data || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load jobs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getSkillMatch = (jobSkills: string[] | null, workerSkills: string[] | null): string[] => {
    if (!jobSkills || !workerSkills) return [];
    
    return jobSkills.filter(jobSkill =>
      workerSkills.some(workerSkill => 
        workerSkill.toLowerCase() === jobSkill.toLowerCase()
      )
    );
  };

  const filteredJobs = jobs
    .filter(job =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.required_skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(job => {
      if (filterByDistance === "all") return true;
      if (filterByDistance === "nearby" && job.distance) return job.distance <= 3;
      if (filterByDistance === "close" && job.distance) return job.distance <= 5;
      if (filterByDistance === "nearby" || filterByDistance === "close") return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "distance" && a.distance && b.distance) return a.distance - b.distance;
      if (sortBy === "wage") return b.wage - a.wage;
      if (sortBy === "posted") return new Date(b.job_date).getTime() - new Date(a.job_date).getTime();
      return 0;
    });

  const handleApply = async (jobId: string) => {
    if (!profile) return;

    setIsApplying(true);
    try {
      // Show loading for minimum time
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 2000));
      
      const applyPromise = (async () => {
        // Check if already applied
        const { data: existingApplication } = await supabase
          .from('job_applications')
          .select('id')
          .eq('job_id', jobId)
          .eq('worker_id', profile.user_id)
          .maybeSingle();

        if (existingApplication) {
          throw new Error("ALREADY_APPLIED");
        }

        const { error } = await supabase
          .from('job_applications')
          .insert({
            job_id: jobId,
            worker_id: profile.user_id,
            status: 'pending',
          });

        if (error) throw error;
      })();

      await Promise.all([minLoadingTime, applyPromise]);

      toast({
        title: "Application Submitted",
        description: "Your application has been sent to the employer.",
      });

      // Optionally navigate to applied jobs
      navigate('/worker/applied-jobs');
    } catch (error: any) {
      if (error.message === "ALREADY_APPLIED") {
        toast({
          title: "Already Applied",
          description: "You have already applied to this job.",
          variant: "destructive",
        });
        return;
      }
      console.error('Error applying to job:', error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const profileCompletion = profile?.profile_completion_percentage || 0;
  const canAccessJobs = profileCompletion >= 75;

  if (!canAccessJobs) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Available Jobs</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Complete your profile to access job listings
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to complete at least 75% of your profile to access job listings.
            Current completion: {profileCompletion}%
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Complete Your Profile</h3>
            <p className="text-muted-foreground mb-4">
              Add your photo, location, skills, experience, and worker category to unlock job access.
            </p>
            <Button onClick={() => navigate('/worker/profile')}>
              Go to Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || isApplying) {
    return <LoadingScreen fullScreen={false} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Available Jobs</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Browse and apply to jobs near you
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowMap(!showMap)}
        >
          {showMap ? 'Show List' : 'Show Map'}
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs, companies, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={filterByDistance} onValueChange={setFilterByDistance}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Distance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  <SelectItem value="nearby">Within 3 km</SelectItem>
                  <SelectItem value="close">Within 5 km</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">Distance</SelectItem>
                  <SelectItem value="wage">Wage</SelectItem>
                  <SelectItem value="posted">Recently Posted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{filteredJobs.length} jobs found</span>
            {searchTerm && (
              <>
                <span>•</span>
                <span>Searching for "{searchTerm}"</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map View */}
      {showMap && (
        <JobsMap 
          jobs={filteredJobs} 
          center={profile?.latitude && profile?.longitude ? [profile.latitude, profile.longitude] : undefined}
          onJobClick={handleApply}
        />
      )}

      {/* Empty State or Job Listings */}
      {!showMap && (
        <>
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No jobs available yet</h3>
                <p className="text-muted-foreground">
                  Job listings will appear here based on your location and preferences. Check back later for new opportunities.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-lg sm:text-xl">{job.title}</CardTitle>
                        <div className="text-muted-foreground text-sm">
                          {job.location}
                        </div>
                      </div>
                      
                      <Button onClick={() => handleApply(job.id)} className="w-full sm:w-auto">
                        <Briefcase className="mr-2 h-4 w-4" />
                        Apply Now
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <CardDescription className="text-base">
                      {job.description}
                    </CardDescription>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {job.location}
                          {job.distance !== undefined && ` • ${job.distance.toFixed(1)} km away`}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">₹{job.wage}/day</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(job.job_date).toLocaleDateString()}</span>
                        {job.job_time && <span> • {job.job_time}</span>}
                      </div>
                    </div>

                    {profile?.skills && job.required_skills && job.required_skills.length > 0 && (() => {
                      const matchedSkills = getSkillMatch(job.required_skills, profile.skills);
                      const matchPercentage = Math.round((matchedSkills.length / job.required_skills.length) * 100);
                      return matchedSkills.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <Badge variant={matchPercentage >= 50 ? "default" : "secondary"} className="text-xs">
                            ✓ {matchedSkills.length}/{job.required_skills.length} skills match ({matchPercentage}%)
                          </Badge>
                        </div>
                      ) : null;
                    })()}

                    {job.required_skills && job.required_skills.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium mb-2">Required Skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {job.required_skills.map((skill, index) => {
                              const isMatched = profile?.skills?.some(
                                workerSkill => workerSkill.toLowerCase() === skill.toLowerCase()
                              );
                              return (
                                <Badge 
                                  key={index} 
                                  variant={isMatched ? "default" : "secondary"}
                                  className={isMatched ? "bg-primary text-primary-foreground" : "text-xs"}
                                >
                                  {isMatched && "✓ "}
                                  {skill}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredJobs.length === 0 && jobs.length > 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No jobs match your filters</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or filters to find more opportunities.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default AvailableJobs;