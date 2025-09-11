import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { MapPin, IndianRupee, Clock, Calendar, MessageCircle, Eye, Building2, Briefcase } from "lucide-react";

const AppliedJobs = () => {
  // Applied jobs would be fetched from your API
  const appliedJobs = [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'applied':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">🟠 Applied</Badge>;
      case 'accepted':
        return <Badge variant="default" className="bg-green-100 text-green-700">✅ Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">❌ Rejected</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">✔️ Completed</Badge>;
      case 'in_progress':
        return <Badge variant="default">⏳ In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getJobsByStatus = (status: string) => {
    return appliedJobs.filter(job => job.status === status);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    ));
  };

  const JobCard = ({ job }: { job: typeof appliedJobs[0] }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg sm:text-xl">{job.title}</CardTitle>
              {job.urgent && (
                <Badge variant="destructive" className="text-xs">Urgent</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{job.company}</span>
            </div>
          </div>
          
          <div className="text-left sm:text-right space-y-2">
            {getStatusBadge(job.status)}
          </div>
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

        {/* Status-specific information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Applied on {new Date(job.appliedDate).toLocaleDateString()}</span>
          </div>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium text-muted-foreground mb-1">Status Update:</p>
            <p className="text-sm">{job.statusMessage}</p>
            
            {/* Additional status-specific details */}
            {job.status === 'applied' && job.estimatedResponse && (
              <p className="text-xs text-muted-foreground mt-2">
                Expected response: {job.estimatedResponse}
              </p>
            )}
            
            {job.status === 'accepted' && (
              <div className="mt-2 space-y-1">
                {job.startDate && (
                  <p className="text-xs text-muted-foreground">
                    Start date: {new Date(job.startDate).toLocaleDateString()}
                  </p>
                )}
                {job.contactInfo && (
                  <p className="text-xs text-muted-foreground">{job.contactInfo}</p>
                )}
              </div>
            )}
            
            {job.status === 'completed' && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Your rating:</span>
                  <div className="flex">{renderStars(job.rating || 0)}</div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Completed: {job.completedDate && new Date(job.completedDate).toLocaleDateString()}
                  </span>
                  <span className="font-medium text-green-600">
                    Earned: {job.earnedAmount}
                  </span>
                </div>
              </div>
            )}
            
            {job.status === 'in_progress' && job.startDate && (
              <p className="text-xs text-muted-foreground mt-2">
                Started: {new Date(job.startDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          {job.status === 'accepted' && (
            <Button size="sm" variant="default" className="w-full sm:w-auto">
              <MessageCircle className="mr-2 h-4 w-4" />
              Contact Employer
            </Button>
          )}
          
          <Button size="sm" variant="outline" className="w-full sm:w-auto">
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

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
              <TabsTrigger value="applied" className="whitespace-nowrap px-3 py-2 text-xs">Applied ({getJobsByStatus('applied').length})</TabsTrigger>
              <TabsTrigger value="accepted" className="whitespace-nowrap px-3 py-2 text-xs">Accepted ({getJobsByStatus('accepted').length})</TabsTrigger>
              <TabsTrigger value="in_progress" className="whitespace-nowrap px-3 py-2 text-xs">In Progress ({getJobsByStatus('in_progress').length})</TabsTrigger>
              <TabsTrigger value="completed" className="whitespace-nowrap px-3 py-2 text-xs">Completed ({getJobsByStatus('completed').length})</TabsTrigger>
              <TabsTrigger value="rejected" className="whitespace-nowrap px-3 py-2 text-xs">Rejected ({getJobsByStatus('rejected').length})</TabsTrigger>
            </div>
          </TabsList>
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden md:block">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All ({appliedJobs.length})</TabsTrigger>
            <TabsTrigger value="applied">Applied ({getJobsByStatus('applied').length})</TabsTrigger>
            <TabsTrigger value="accepted">Accepted ({getJobsByStatus('accepted').length})</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress ({getJobsByStatus('in_progress').length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({getJobsByStatus('completed').length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({getJobsByStatus('rejected').length})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-4">
          {appliedJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </TabsContent>

        <TabsContent value="applied" className="space-y-4">
          {getJobsByStatus('applied').map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4">
          {getJobsByStatus('accepted').map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          {getJobsByStatus('in_progress').map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {getJobsByStatus('completed').map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {getJobsByStatus('rejected').map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
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