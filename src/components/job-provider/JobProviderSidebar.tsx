import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Home,
  User,
  Plus,
  Briefcase,
  Users,
  History,
  Bell,
  LogOut,
} from "lucide-react";

const jobProviderMenuItems = [
  { title: "Dashboard", url: "/job-provider/dashboard", icon: Home },
  { title: "My Profile", url: "/job-provider/profile", icon: User },
  { title: "Post a Job", url: "/job-provider/post-job", icon: Plus },
  { title: "My Jobs", url: "/job-provider/jobs", icon: Briefcase },
  { title: "Applicants", url: "/job-provider/applicants", icon: Users },
  { title: "Job History", url: "/job-provider/history", icon: History },
  { title: "Notifications", url: "/job-provider/notifications", icon: Bell },
];

export function JobProviderSidebar() {
  const location = useLocation();
  const { signOut, profile } = useAuth();
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-medium rounded-lg mx-2 shadow-sm" 
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground mx-2 rounded-lg";

  const handleLogout = () => {
    signOut();
  };

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar className="w-60 border-r border-sidebar-border bg-sidebar" collapsible="icon" variant={isMobile ? "floating" : "sidebar"}>
      <SidebarContent className="bg-sidebar">
        {/* User Info */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-sidebar-foreground">
              {profile?.first_name} {profile?.last_name}
            </h3>
            <p className="text-xs text-sidebar-foreground/60">
              {profile?.company_name || "Job Provider"}
            </p>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 py-4">
          <SidebarGroup>
            <SidebarGroupLabel>Job Provider</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {jobProviderMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-12">
                      <NavLink to={item.url} end className={getNavCls} onClick={handleNavClick}>
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
        
        {/* Bottom Actions */}
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => { handleLogout(); handleNavClick(); }} className="h-12 hover:bg-destructive/10 hover:text-destructive mx-2 rounded-lg">
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}