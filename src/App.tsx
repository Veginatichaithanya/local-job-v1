import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import RoleSelection from "./pages/RoleSelection";
import NotFound from "./pages/NotFound";
import WorkerLayout from "./layouts/WorkerLayout";
import WorkerDashboard from "./pages/worker/WorkerDashboard";
import WorkerProfile from "./pages/worker/WorkerProfile";
import AvailableJobs from "./pages/worker/AvailableJobs";
import AppliedJobs from "./pages/worker/AppliedJobs";
import JobHistory from "./pages/worker/JobHistory";
import Notifications from "./pages/worker/Notifications";
import JobProviderLayout from "./layouts/JobProviderLayout";
import JobProviderDashboard from "./pages/job-provider/JobProviderDashboard";
import JobProviderProfile from "./pages/job-provider/JobProviderProfile";
import PostJob from "./pages/job-provider/PostJob";
import MyJobs from "./pages/job-provider/MyJobs";
import Applicants from "./pages/job-provider/Applicants";
import JobProviderHistory from "./pages/job-provider/JobHistory";
import JobProviderNotifications from "./pages/job-provider/Notifications";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import VerifyProviders from "./pages/admin/VerifyProviders";
import ManageWorkers from "./pages/admin/ManageWorkers";
import ManageProviders from "./pages/admin/ManageProviders";

const queryClient = new QueryClient();

const App = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    // Simulate initial app load
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isInitialLoading) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login/worker" element={<Auth />} />
            <Route path="/login/job-provider" element={<Auth />} />
            <Route path="/role-selection" element={<RoleSelection />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/*" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="verify-providers" element={<VerifyProviders />} />
              <Route path="manage-workers" element={<ManageWorkers />} />
              <Route path="manage-providers" element={<ManageProviders />} />
            </Route>
            
            {/* Worker Dashboard Routes */}
            <Route path="/worker" element={<WorkerLayout />}>
              <Route path="dashboard" element={<WorkerDashboard />} />
              <Route path="profile" element={<WorkerProfile />} />
              <Route path="jobs" element={<AvailableJobs />} />
              <Route path="applied" element={<AppliedJobs />} />
              <Route path="history" element={<JobHistory />} />
              <Route path="notifications" element={<Notifications />} />
              <Route index element={<WorkerDashboard />} />
            </Route>

            {/* Job Provider Dashboard Routes */}
            <Route path="/job-provider" element={<JobProviderLayout />}>
              <Route path="dashboard" element={<JobProviderDashboard />} />
              <Route path="profile" element={<JobProviderProfile />} />
              <Route path="post-job" element={<PostJob />} />
              <Route path="jobs" element={<MyJobs />} />
              <Route path="applicants" element={<Applicants />} />
              <Route path="history" element={<JobProviderHistory />} />
              <Route path="notifications" element={<JobProviderNotifications />} />
              <Route index element={<JobProviderDashboard />} />
            </Route>
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
