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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Home,
  User,
  Briefcase,
  CheckSquare,
  History,
  Bell,
  LogOut,
} from "lucide-react";

const workerMenuItems = [
  { title: "Dashboard", url: "/worker/dashboard", icon: Home },
  { title: "My Profile", url: "/worker/profile", icon: User },
  { title: "Available Jobs", url: "/worker/jobs", icon: Briefcase },
  { title: "Applied Jobs", url: "/worker/applied", icon: CheckSquare },
  { title: "Job History", url: "/worker/history", icon: History },
  { title: "Notifications", url: "/worker/notifications", icon: Bell },
];

export function WorkerSidebar() {
  const location = useLocation();
  const { signOut, profile } = useAuth();
  const isMobile = useIsMobile();
  const { state, setOpenMobile } = useSidebar();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const isExpanded = workerMenuItems.some((item) => isActive(item.url));

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
            <p className="text-xs text-sidebar-foreground/60 capitalize">
              {profile?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 py-4">
          <SidebarMenu className="space-y-1">
            {workerMenuItems.map((item) => (
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