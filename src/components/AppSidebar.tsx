"use client"

import { Link, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import {
  BookOpen,
  MessageSquare,
  Brain,
  FileText,
  Users,
  Settings,
  BarChart3,
  Shield,
  LogOut,
  ChevronRight,
  Clapperboard,
  Lightbulb,
  GraduationCap,
  Home,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function AppSidebar() {
  const { profile, signOut } = useAuth()
  console.log(profile)
  const location = useLocation()

  const getMenuItems = () => {
    if (!profile) return []

    const baseItems = [
      {
        name: "Dashboard",
        href: `/${profile.role}/dashboard`,
        icon: Home,
        description: "View your personalized dashboard",
      },
    ]

    switch (profile.role) {
      case "admin":
        return [
          ...baseItems,
          {
            name: "User Management",
            href: "/admin/users",
            icon: Users,
            description: "Manage system users",
          },
          {
            name: "System Stats",
            href: "/admin/stats",
            icon: BarChart3,
            description: "View platform analytics",
          },
          {
            name: "Role Management",
            href: "/admin/roles",
            icon: Shield,
            description: "Manage user roles and permissions",
          },
          {
            name: "Settings",
            href: "/admin/settings",
            icon: Settings,
            description: "Configure system settings",
          },
        ]
      case "teacher":
        return [
          ...baseItems,
          {
            name: "Assignments",
            href: "/teacher/assignments",
            icon: BookOpen,
            description: "Create and manage assignments",
          },
          {
            name: "Submissions",
            href: "/teacher/submissions",
            icon: FileText,
            description: "Review student submissions",
          },
          {
            name: "Students",
            href: "/teacher/students",
            icon: GraduationCap,
            description: "Manage your students",
          },
        ]
      case "student":
        return [
          ...baseItems,
          {
            name: "AI Mentor",
            href: "/ai-mentor",
            icon: MessageSquare,
            description: "Chat with your AI mentor",
          },
          {
            name: "Quiz Tool",
            href: "/quiz",
            icon: Brain,
            description: "Test your knowledge",
          },
          {
            name: "Script Analyzer",
            href: "/script-analyzer",
            icon: FileText,
            description: "Get feedback on your scripts",
          },
        ]
      default:
        return baseItems
    }
  }

  const menuItems = getMenuItems()
  
  const getInitials = () => {
    if (!profile?.full_name) return "SP"
    
    const names = profile.full_name.trim().split(" ")
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase()
    } else {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase()
    }
  }

  const initials = getInitials()

  const getRoleColor = () => {
    switch (profile?.role) {
      case "admin":
        return "from-pink-500 to-rose-500"
      case "teacher":
        return "from-blue-500 to-indigo-500"
      case "student":
        return "from-purple-500 to-indigo-500"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  const getRoleBadgeText = () => {
    switch (profile?.role) {
      case "admin":
        return "Administrator"
      case "teacher":
        return "Faculty"
      case "student":
        return "Student"
      default:
        return profile?.role || "User"
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-64 shadow-sm">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center">
          <img
              src="/logo.png"
              alt="Screen Pilot AI Mentorship Interface"
              className="h-12 w-16"
            />
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Screen Pilot</h3>
            <div className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${getRoleColor()} animate-pulse shadow-sm`}></div>
              <p className="text-xs font-medium text-gray-500">{getRoleBadgeText()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {/* Avatar with only initials - no image */}
          <Avatar className="h-10 w-10 border border-gray-200">
            <AvatarFallback className={`bg-gradient-to-br ${getRoleColor()} text-white font-semibold text-sm`}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{profile?.full_name}</p>
            <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3">
        <div className="mb-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 mb-2">Navigation</p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <TooltipProvider key={item.name} delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg group transition-colors",
                          isActive
                            ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700"
                            : "text-gray-700 hover:bg-gray-50",
                        )}
                      >
                        <div
                          className={cn(
                            "p-1.5 rounded-md transition-colors",
                            isActive
                              ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm"
                              : "bg-gray-100 text-gray-500 group-hover:bg-gray-200",
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-sm">{item.name}</span>
                        {isActive && <ChevronRight className="h-4 w-4 ml-auto text-indigo-500" />}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-gray-900 text-white text-xs">
                      {item.description}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </nav>
        </div>

        {/* Role-specific section */}
        <div className="mt-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 mb-2">Resources</p>
          <div className="px-3 py-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg mx-1">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-medium text-gray-800">Quick Tips</p>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              {profile?.role === "student"
                ? "Use AI Mentor for personalized feedback on your scripts."
                : profile?.role === "teacher"
                  ? "Create interactive assignments to boost student engagement."
                  : "Monitor system usage in the analytics dashboard."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-white hover:bg-gray-50 border-gray-200 text-xs"
              asChild
            >
              <Link to="/help">View Help Center</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          onClick={() => signOut?.()}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}