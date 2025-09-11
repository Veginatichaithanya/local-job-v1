import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { WorkerSidebar } from "@/components/worker/WorkerSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

const WorkerLayout = () => {
  const { user, profile, loading } = useAuth();
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Redirect if not authenticated or not a worker
  if (!user || !profile || profile.role !== 'worker') {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full">
        <WorkerSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Global header with trigger */}
          <header className="h-14 md:h-12 flex items-center border-b bg-background px-4 sticky top-0 z-10">
            <SidebarTrigger className="md:hidden" />
            <h1 className="ml-4 font-semibold text-lg md:text-base truncate">Worker Portal</h1>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default WorkerLayout;