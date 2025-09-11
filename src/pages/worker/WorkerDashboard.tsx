import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  Clock, 
  CheckCircle, 
  DollarSign,
  IndianRupee,
  MapPin,
  Star,
  TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";

const WorkerDashboard = () => {
  const { profile } = useAuth();

  // Data would be fetched from your API based on the authenticated user
  const stats = {
    totalApplied: 0,
    inProgress: 0,
    completed: 0,
    earnings: 0
  };

  // Recent activity would be fetched from your API
  const recentJobs = [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'applied':
        return <Badge variant="secondary">🟠 Applied</Badge>;
      case 'in_progress':
        return <Badge variant="default">⏳ In Progress</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">✅ Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">
          Welcome back, {profile?.first_name}!
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Here's your job activity overview
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Applied</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplied}</div>
            <p className="text-xs text-muted-foreground">
              Start applying to jobs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              No active jobs yet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Complete jobs to build history
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.earnings}</div>
            <p className="text-xs text-muted-foreground">
              Start applying to earn money
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to help you manage your job search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Button asChild className="w-full sm:w-auto">
              <Link to="/worker/jobs">
                <Briefcase className="mr-2 h-4 w-4" />
                Browse Jobs
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link to="/worker/profile">
                <Star className="mr-2 h-4 w-4" />
                Update Profile
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link to="/worker/applied">
                <TrendingUp className="mr-2 h-4 w-4" />
                Check Applications
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {recentJobs.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent Job Activity</CardTitle>
            <CardDescription>
              Your latest job applications and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div key={job.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
                  <div className="space-y-1">
                    <h4 className="font-medium">{job.title}</h4>
                    <p className="text-sm text-muted-foreground">{job.company}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <IndianRupee className="h-3 w-3" />
                        {job.wage}
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right space-y-2">
                    {getStatusBadge(job.status)}
                    <p className="text-xs text-muted-foreground">
                      {job.status === 'completed' ? `Completed: ${job.completedDate}` : `Applied: ${job.appliedDate}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <Button variant="outline" asChild>
                <Link to="/worker/applied">View All Applications</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Ready to find your next job opportunity?
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No applications yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by browsing available jobs in your area and applying to ones that match your skills.
            </p>
            <Button asChild>
              <Link to="/worker/jobs">Browse Available Jobs</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkerDashboard;