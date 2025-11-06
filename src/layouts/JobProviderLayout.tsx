import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { JobProviderSidebar } from "@/components/job-provider/JobProviderSidebar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function JobProviderLayout() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login/job-provider");
      } else if (profile?.role !== "job_provider") {
        navigate("/role-selection");
      }
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user || profile?.role !== "job_provider") {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <JobProviderSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-end border-b bg-background px-6 sticky top-0 z-10">
            <NotificationBell />
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}