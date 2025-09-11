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
  Star
} from "lucide-react";

const JobHistory = () => {
  const { profile } = useAuth();

  // This would be fetched from your API
  const jobHistory = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Job History</h1>
        <p className="text-muted-foreground">
          View your completed job applications and work history
        </p>
      </div>

      {jobHistory.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No job history yet</h3>
            <p className="text-muted-foreground mb-4">
              Start applying to jobs to build your work history.
            </p>
            <Button asChild>
              <a href="/worker/jobs">Browse Available Jobs</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Job history items would be mapped here */}
        </div>
      )}
    </div>
  );
};

export default JobHistory;