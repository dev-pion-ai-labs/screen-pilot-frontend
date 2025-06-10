"use client"

import { Link, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useState, useEffect } from "react"
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
  ChevronLeft,
  Menu,
  X,
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
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)


  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])


  useEffect(() => {
    setIsMobileOpen(false)
  }, [location.pathname])

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
          // {
          //   name: "System Stats",
          //   href: "/admin/stats",
          //   icon: BarChart3,
          //   description: "View platform analytics",
          // },
          // {
          //   name: "Role Management",
          //   href: "/admin/roles",
          //   icon: Shield,
          //   description: "Manage user roles and permissions",
          // },
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
          // {
          //   name: "Submissions",
          //   href: "/teacher/student-submission",
          //   icon: FileText,
          //   description: "Review student submissions",
          // },
          // {
          //   name: "Students",
          //   href: "/teacher/students",
          //   icon: GraduationCap,
          //   description: "Manage your students",
          // },
        ]
      case "student":
        return [
          ...baseItems,
          {
            name: "Assignments",
            href: "/student/assignments",
            icon: FileText,
            description: "View and submit your assignments",
          },
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


  const HamburgerButton = () => (
    <Button
      variant="ghost"
      size="sm"
      className="md:hidden fixed top-4 left-4 z-50 bg-white shadow-md hover:bg-gray-50"
      onClick={() => setIsMobileOpen(!isMobileOpen)}
    >
      {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  )


  const CollapseButton = () => (
    <Button
      variant="ghost"
      size="sm"
      className="hidden md:flex absolute -right-3 top-6 z-10 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm hover:bg-gray-50"
      onClick={() => setIsCollapsed(!isCollapsed)}
    >
      {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
    </Button>
  )

  const sidebarWidth = isCollapsed ? "w-16" : "w-64"
  const mobileClasses = isMobile 
    ? `fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }` 
    : `relative transition-all duration-300 ease-in-out ${sidebarWidth}`

  return (
    <>
      <HamburgerButton />
      

      {isMobile && isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div className={cn(
        "flex flex-col h-full bg-white border-r border-gray-200 shadow-sm relative",
        mobileClasses,
        isMobile ? "w-64" : sidebarWidth
      )}>
        <CollapseButton />
        

        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center">
            <img
              src="/logo.png"
              alt="Screen Pilot AI Mentorship Interface"
              className={cn(
                "transition-all duration-300",
                isCollapsed && !isMobile ? "h-8 w-8" : "h-12 w-16"
              )}
            />
            {(!isCollapsed || isMobile) && (
              <div className="ml-2">
                <h3 className="font-bold text-gray-900 text-lg">Screen Pilot</h3>
                <div className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${getRoleColor()} animate-pulse shadow-sm`}></div>
                  <p className="text-xs font-medium text-gray-500">{getRoleBadgeText()}</p>
                </div>
              </div>
            )}
          </div>
        </div>


        <div className="p-4 border-b border-gray-100">
          <div className={cn(
            "flex items-center transition-all duration-300",
            isCollapsed && !isMobile ? "justify-center" : "gap-3"
          )}>
            <Avatar className={cn(
              "border border-gray-200 transition-all duration-300",
              isCollapsed && !isMobile ? "h-8 w-8" : "h-10 w-10"
            )}>
              <AvatarFallback className={cn(
                `bg-gradient-to-br ${getRoleColor()} text-white font-semibold`,
                isCollapsed && !isMobile ? "text-xs" : "text-sm"
              )}>
                {initials}
              </AvatarFallback>
            </Avatar>
            {(!isCollapsed || isMobile) && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{profile?.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
              </div>
            )}
          </div>
        </div>


        <div className="flex-1 overflow-y-auto py-4 px-3">
          <div className="mb-2">
            {(!isCollapsed || isMobile) && (
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 mb-2">Navigation</p>
            )}
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
                            "flex items-center gap-3 rounded-lg group transition-all duration-200",
                            isCollapsed && !isMobile ? "px-2 py-2 justify-center" : "px-3 py-2",
                            isActive
                              ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700"
                              : "text-gray-700 hover:bg-gray-50",
                          )}
                        >
                          <div
                            className={cn(
                              "rounded-md transition-colors",
                              isCollapsed && !isMobile ? "p-2" : "p-1.5",
                              isActive
                                ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm"
                                : "bg-gray-100 text-gray-500 group-hover:bg-gray-200",
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                          </div>
                          {(!isCollapsed || isMobile) && (
                            <>
                              <span className="font-medium text-sm">{item.name}</span>
                              {isActive && <ChevronRight className="h-4 w-4 ml-auto text-indigo-500" />}
                            </>
                          )}
                        </Link>
                      </TooltipTrigger>
                      {isCollapsed && !isMobile && (
                        <TooltipContent side="right" className="bg-gray-900 text-white text-xs">
                          {item.name}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )
              })}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "transition-all duration-300 text-gray-600 hover:text-gray-900 hover:bg-gray-100",
              isCollapsed && !isMobile ? "w-auto px-2 justify-center" : "w-full justify-start"
            )}
            onClick={() => signOut?.()}
          >
            <LogOut className="h-4 w-4" />
            {(!isCollapsed || isMobile) && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </div>
    </>
  )
}