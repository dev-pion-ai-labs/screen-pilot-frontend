
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { 
  BookOpen, 
  MessageSquare, 
  Brain, 
  FileText, 
  Users, 
  Settings,
  BarChart3,
  UserPlus,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const { profile } = useAuth();
  const location = useLocation();

  const getMenuItems = () => {
    if (!profile) return [];

    const baseItems = [
      { 
        name: 'Dashboard', 
        href: `/${profile.role}/dashboard`, 
        icon: BookOpen 
      }
    ];

    switch (profile.role) {
      case 'admin':
        return [
          ...baseItems,
          { name: 'User Management', href: '/admin/users', icon: Users },
          { name: 'System Stats', href: '/admin/stats', icon: BarChart3 },
          { name: 'Role Management', href: '/admin/roles', icon: Shield },
          { name: 'Settings', href: '/admin/settings', icon: Settings }
        ];
      case 'teacher':
        return [
          ...baseItems,
          { name: 'Assignments', href: '/teacher/assignments', icon: BookOpen },
          { name: 'Submissions', href: '/teacher/submissions', icon: FileText },
          { name: 'Students', href: '/teacher/students', icon: Users }
        ];
      case 'student':
        return [
          ...baseItems,
          { name: 'AI Mentor', href: '/ai-mentor', icon: MessageSquare },
          { name: 'Quiz Tool', href: '/quiz', icon: Brain },
          { name: 'Script Analyzer', href: '/script-analyzer', icon: FileText }
        ];
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Screen Pilot</h3>
            <p className="text-sm text-gray-500 capitalize">{profile?.role}</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location.pathname === item.href}
                  >
                    <Link to={item.href} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <div className="text-xs text-gray-500">
          Screen Pilot Learning Platform
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
