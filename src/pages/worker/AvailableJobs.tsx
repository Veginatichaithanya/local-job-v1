import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MapPin, IndianRupee, Clock, Search, Filter, Briefcase, Building2 } from "lucide-react";

const AvailableJobs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("distance");
  const [filterByDistance, setFilterByDistance] = useState("all");

  // Jobs would be fetched from your API based on location and user preferences
  const jobs = [];

  const filteredJobs = jobs
    .filter(job => 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(job => {
      if (filterByDistance === "all") return true;
      if (filterByDistance === "nearby") return job.distance <= 3;
      if (filterByDistance === "close") return job.distance <= 5;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "distance") return a.distance - b.distance;
      if (sortBy === "wage") return parseFloat(b.wage.replace(/[^0-9.]/g, '')) - parseFloat(a.wage.replace(/[^0-9.]/g, ''));
      if (sortBy === "posted") return new Date(b.posted).getTime() - new Date(a.posted).getTime();
      return 0;
    });

  const handleApply = (jobId: number) => {
    // Handle job application - replace with actual API call
    console.log(`Applied to job ${jobId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Available Jobs</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Browse and apply to jobs near you
        </p>
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

      {/* Empty State or Job Listings */}
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
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg sm:text-xl">{job.title}</CardTitle>
                      {job.urgent && (
                        <Badge variant="destructive" className="text-xs">
                          Urgent
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{job.company}</span>
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
                    <span>{job.location} • {job.distance} km away</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{job.wage}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{job.type} • {job.duration}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  
                  <span className="text-xs text-muted-foreground">
                    Posted {job.posted}
                  </span>
                </div>
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
    </div>
  );
};

export default AvailableJobs;