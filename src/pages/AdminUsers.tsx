"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/AuthGuard"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { supabase } from "@/integrations/supabase/client"
import { Users, UserPlus, Trash2, Edit, Search, GraduationCap, School, Shield } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { AdminUsersShimmer } from "@/components/AdminUsersShimmer"

interface User {
  id: string
  email: string
  full_name: string
  role: "admin" | "teacher" | "student"
  semester?: number
  created_at: string
  updated_at: string
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [isUpdatingUser, setIsUpdatingUser] = useState(false)
  const [newUser, setNewUser] = useState({
    email: "",
    full_name: "",
    role: "student" as "admin" | "teacher" | "student",
    semester: 1,
    password: "",
  })

  const [currentStep, setCurrentStep] = useState(1)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    console.log('Fetching users...')
    try {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error('Error in fetchUsers:', error)
        throw error
      }

      console.log('Users fetched successfully:', data?.length || 0, 'users found')

      // Type cast the data properly
      const typedUsers: User[] = (data || []).map((profile) => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role as "admin" | "teacher" | "student",
        semester: profile.semester || undefined,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      }))

      setUsers(typedUsers)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    console.log('Starting user creation process...', { newUser })
    if (isCreatingUser) {
      console.log('User creation already in progress, skipping...')
      return
    }

    setIsCreatingUser(true)

    try {
      // Get the current user session to restore it later
      console.log('Getting current session...')
      const { data: currentSession } = await supabase.auth.getSession()
      console.log('Current session retrieved:', currentSession ? 'Session exists' : 'No session')

      // Create user in auth with admin privileges
      console.log('Attempting to create user with admin privileges...')
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true,
        user_metadata: {
          full_name: newUser.full_name,
          role: newUser.role,
        },
      })

      if (authError) {
        console.log('Admin create user failed, falling back to regular signup:', authError)
        // If admin.createUser is not available, try regular signup with immediate signout
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: newUser.email,
          password: newUser.password,
          options: {
            data: {
              full_name: newUser.full_name,
              role: newUser.role,
            },
          },
        })

        if (signUpError) {
          console.error('Signup error:', signUpError)
          throw signUpError
        }

        console.log('Regular signup successful, signing out new user...')
        // Immediately sign out the new user to prevent session hijacking
        await supabase.auth.signOut()

        // Restore the admin session
        if (currentSession?.session) {
          console.log('Restoring admin session...')
          await supabase.auth.setSession(currentSession.session)
        }

        // Update profile with additional data
        if (signUpData.user) {
          console.log('Updating user profile...', { userId: signUpData.user.id })
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              role: newUser.role,
              semester: newUser.role === "student" ? newUser.semester : null
            })
            .eq("id", signUpData.user.id)

          if (updateError) {
            console.error("Error updating profile:", updateError)
          }
        }
      } else {
        console.log('Admin create user successful, updating profile...')
        // If admin.createUser worked, update the profile
        if (authData.user && newUser.role === "student") {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ semester: newUser.semester })
            .eq("id", authData.user.id)

          if (updateError) {
            console.error("Error updating profile:", updateError)
          }
        }
      }

      console.log('User creation completed successfully')
      toast({
        title: "Success",
        description: "User created successfully",
      })

      resetForm()
      fetchUsers()
    } catch (error) {
      console.error("Error creating user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user",
        variant: "destructive",
      })
    } finally {
      setIsCreatingUser(false)
    }
  }

  const handleEditUser = async (user: User) => {
    console.log('Starting user edit process...', { user })

    if (isUpdatingUser) {
      console.log('User update already in progress, skipping...')
      return
    }

    setIsUpdatingUser(true)

    try {
      // Validate semester for students
      if (user.role === "student" && (!user.semester || user.semester < 1 || user.semester > 8)) {
        console.warn('Invalid semester value:', user.semester)
        toast({
          title: "Error",
          description: "Please select a valid semester (1-8) for students",
          variant: "destructive",
        })
        return
      }

      // Prepare update data
      const updateData = {
        full_name: user.full_name,
        role: user.role,
        semester: user.role === "student" ? user.semester : null,
        updated_at: new Date().toISOString(),
      }

      console.log('Updating user profile...', {
        userId: user.id,
        updates: updateData
      })

      // Update user profile with explicit data
      const { data: updatedData, error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id)
        .select()

      if (error) {
        console.error('Error updating user profile:', error)
        throw error
      }

      console.log('User profile updated successfully:', updatedData)

      // Verify the update by fetching the specific user
      const { data: verifyData, error: verifyError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (verifyError) {
        console.error('Error verifying update:', verifyError)
      } else {
        console.log('Verification data:', verifyData)
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      })

      setEditingUser(null)
      // Refresh the user list to get the latest data
      await fetchUsers()
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingUser(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    console.log('Starting user deletion process...', { userId })

    // Show confirmation dialog
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user? This action cannot be undone and will also delete all related data (assignments, submissions, etc.)."
    )

    if (!confirmDelete) {
      console.log('User deletion cancelled by user')
      return
    }

    try {
      // First, try to delete related data
      console.log('Deleting user submissions...')
      const { error: submissionsError } = await supabase
        .from("submissions")
        .delete()
        .eq("student_id", userId)

      if (submissionsError) {
        console.error("Error deleting submissions:", submissionsError)
      } else {
        console.log('Submissions deleted successfully')
      }

      console.log('Deleting user assignments...')
      const { error: assignmentsError } = await supabase
        .from("assignments")
        .delete()
        .eq("teacher_id", userId)

      if (assignmentsError) {
        console.error("Error deleting assignments:", assignmentsError)
      } else {
        console.log('Assignments deleted successfully')
      }

      console.log('Deleting user profile...')
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId)

      if (profileError) {
        console.error('Error deleting user profile:', profileError)
        throw profileError
      }

      console.log('User and related data deleted successfully')
      toast({
        title: "Success",
        description: "User and related data deleted successfully",
      })

      fetchUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === "all" || user.role === filterRole
    return matchesSearch && matchesRole
  })

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-gradient-to-r from-red-500 to-pink-500 text-white border-0"
      case "teacher":
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0"
      case "student":
        return "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0"
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0"
    }
  }

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  const resetForm = () => {
    setIsAddDialogOpen(false)
    setCurrentStep(1)
    setNewUser({
      email: "",
      full_name: "",
      role: "student",
      semester: 1,
      password: "",
    })
  }

  if (loading) {
    return (
      <AuthGuard allowedRoles={["admin"]}>
        <ModernDashboardLayout>
          <AdminUsersShimmer />
        </ModernDashboardLayout>
      </AuthGuard>
    )
  }


  return (
    <AuthGuard allowedRoles={["admin"]}>
      <ModernDashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <div className="space-y-8 p-8">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                    User Management
                  </h1>
                </div>
                <p className="text-lg text-gray-600">Manage system users and their roles</p>
              </div>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-lg px-6 py-3 h-auto">
                    <UserPlus className="h-5 w-5 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Add New User
                    </DialogTitle>
                    <div className="flex items-center justify-center mt-4">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${currentStep >= 1
                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                            : "bg-gray-200 text-gray-500"
                            }`}
                        >
                          1
                        </div>
                        <div
                          className={`w-12 h-1 rounded-full transition-all duration-300 ${currentStep >= 2 ? "bg-gradient-to-r from-blue-500 to-purple-500" : "bg-gray-200"
                            }`}
                        ></div>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${currentStep >= 2
                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                            : "bg-gray-200 text-gray-500"
                            }`}
                        >
                          2
                        </div>
                      </div>
                    </div>
                  </DialogHeader>

                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
                        <p className="text-sm text-gray-600">Enter the user's basic details</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                            Email Address
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            placeholder="user@example.com"
                            className="border-gray-200 focus:border-blue-400 focus:ring-blue-400 h-12"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                            Password
                          </Label>
                          <Input
                            id="password"
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            placeholder="Enter secure password"
                            className="border-gray-200 focus:border-blue-400 focus:ring-blue-400 h-12"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">
                            Full Name
                          </Label>
                          <Input
                            id="full_name"
                            value={newUser.full_name}
                            onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                            placeholder="Enter full name"
                            className="border-gray-200 focus:border-blue-400 focus:ring-blue-400 h-12"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={() => setCurrentStep(2)}
                          disabled={!newUser.email || !newUser.password || !newUser.full_name}
                          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0 px-8 py-3 h-auto"
                        >
                          Next Step
                        </Button>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-800">Role & Permissions</h3>
                        <p className="text-sm text-gray-600">Select the user's role and permissions</p>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-sm font-medium text-gray-700">Select Role</Label>

                        <div className="space-y-3">
                          {/* Student Role */}
                          <div
                            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${newUser.role === "student"
                              ? "border-green-400 bg-gradient-to-r from-green-50 to-emerald-50"
                              : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50"
                              }`}
                            onClick={() => setNewUser({ ...newUser, role: "student" })}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${newUser.role === "student" ? "border-green-500 bg-green-500" : "border-gray-300"
                                  }`}
                              >
                                {newUser.role === "student" && <div className="w-2 h-2 bg-white rounded-full"></div>}
                              </div>
                              <div className="flex items-center space-x-2">
                                <GraduationCap className="w-5 h-5 text-green-600" />
                                <div>
                                  <div className="font-medium text-gray-900">Student</div>
                                  <div className="text-sm text-gray-600">Access to assignments and submissions</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Teacher Role */}
                          <div
                            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${newUser.role === "teacher"
                              ? "border-blue-400 bg-gradient-to-r from-blue-50 to-cyan-50"
                              : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                              }`}
                            onClick={() => setNewUser({ ...newUser, role: "teacher" })}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${newUser.role === "teacher" ? "border-blue-500 bg-blue-500" : "border-gray-300"
                                  }`}
                              >
                                {newUser.role === "teacher" && <div className="w-2 h-2 bg-white rounded-full"></div>}
                              </div>
                              <div className="flex items-center space-x-2">
                                <School className="w-5 h-5 text-blue-600" />
                                <div>
                                  <div className="font-medium text-gray-900">Teacher</div>
                                  <div className="text-sm text-gray-600">Create and manage assignments</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Admin Role */}
                          <div
                            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${newUser.role === "admin"
                              ? "border-red-400 bg-gradient-to-r from-red-50 to-pink-50"
                              : "border-gray-200 bg-white hover:border-red-300 hover:bg-red-50/50"
                              }`}
                            onClick={() => setNewUser({ ...newUser, role: "admin" })}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${newUser.role === "admin" ? "border-red-500 bg-red-500" : "border-gray-300"
                                  }`}
                              >
                                {newUser.role === "admin" && <div className="w-2 h-2 bg-white rounded-full"></div>}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Shield className="w-5 h-5 text-red-600" />
                                <div>
                                  <div className="font-medium text-gray-900">Administrator</div>
                                  <div className="text-sm text-gray-600">Full system access and management</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Semester Selection for Students */}
                        {newUser.role === "student" && (
                          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                            <Label className="text-sm font-medium text-gray-700 mb-3 block">Select Semester</Label>
                            <div className="grid grid-cols-4 gap-2">
                              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                <div
                                  key={sem}
                                  className={`p-3 text-center rounded-lg border-2 cursor-pointer transition-all duration-300 ${newUser.semester === sem
                                    ? "border-green-500 bg-green-500 text-white"
                                    : "border-green-200 bg-white text-gray-700 hover:border-green-400 hover:bg-green-100"
                                    }`}
                                  onClick={() => setNewUser({ ...newUser, semester: sem })}
                                >
                                  <div className="text-sm font-medium">{sem}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentStep(1)}
                          className="px-6 py-3 h-auto border-gray-300 hover:bg-gray-50"
                          disabled={isCreatingUser}
                        >
                          Back
                        </Button>
                        <Button
                          onClick={handleAddUser}
                          disabled={isCreatingUser}
                          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0 px-8 py-3 h-auto"
                        >
                          {isCreatingUser ? "Creating..." : "Create User"}
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 to-gray-600/10"></div>
                <CardHeader className="relative pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-gray-900">{users.length}</div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-600/10"></div>
                <CardHeader className="relative pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                      <GraduationCap className="h-4 w-4 text-white" />
                    </div>
                    Students
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-gray-900">
                    {users.filter((u) => u.role === "student").length}
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-600/10"></div>
                <CardHeader className="relative pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                      <School className="h-4 w-4 text-white" />
                    </div>
                    Teachers
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-gray-900">
                    {users.filter((u) => u.role === "teacher").length}
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-pink-600/10"></div>
                <CardHeader className="relative pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    Admins
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-gray-900">
                    {users.filter((u) => u.role === "admin").length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border-0 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Users</h2>

                {/* Filters */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-12 border-gray-200 focus:border-blue-400 focus:ring-blue-400 bg-white/80 backdrop-blur-sm"
                      />
                    </div>
                  </div>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-48 h-12 border-gray-200 focus:border-blue-400 focus:ring-blue-400 bg-white/80 backdrop-blur-sm">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="student">Students</SelectItem>
                      <SelectItem value="teacher">Teachers</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-6">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-gray-50 to-blue-50 hover:from-gray-50 hover:to-blue-50 border-0">
                        <TableHead className="font-semibold text-gray-700 py-4">Name</TableHead>
                        <TableHead className="font-semibold text-gray-700 py-4">Email</TableHead>
                        <TableHead className="font-semibold text-gray-700 py-4">Role</TableHead>
                        <TableHead className="font-semibold text-gray-700 py-4">Semester</TableHead>
                        <TableHead className="font-semibold text-gray-700 py-4">Created</TableHead>
                        <TableHead className="font-semibold text-gray-700 py-4">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-blue-50/50 transition-colors duration-200 border-0">
                          <TableCell className="font-medium text-gray-900 py-4">
                            {editingUser?.id === user.id ? (
                              <Input
                                value={editingUser.full_name}
                                onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                                className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                              />
                            ) : (
                              user.full_name
                            )}
                          </TableCell>
                          <TableCell className="text-gray-600 py-4">{user.email}</TableCell>
                          <TableCell className="py-4">
                            {editingUser?.id === user.id ? (
                              <Select
                                value={editingUser.role}
                                onValueChange={(value: "admin" | "teacher" | "student") =>
                                  setEditingUser({ ...editingUser, role: value })
                                }
                              >
                                <SelectTrigger className="w-32 border-gray-200 focus:border-blue-400 focus:ring-blue-400">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="student">Student</SelectItem>
                                  <SelectItem value="teacher">Teacher</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge className={getRoleBadgeColor(user.role)}>
                                {capitalizeFirstLetter(user.role)}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-600 py-4">
                            {editingUser?.id === user.id && editingUser.role === "student" ? (
                              <div className="flex items-center gap-2">
                                <Select
                                  value={editingUser.semester?.toString() || "1"}
                                  onValueChange={(value) =>
                                    setEditingUser({ ...editingUser, semester: Number.parseInt(value) })
                                  }
                                >
                                  <SelectTrigger className="w-32 border-gray-200 focus:border-blue-400 focus:ring-blue-400">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                      <SelectItem key={sem} value={sem.toString()}>
                                        Semester {sem}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {editingUser.semester ? `Semester ${editingUser.semester}` : "Select Semester"}
                                </Badge>
                              </div>
                            ) : user.semester ? (
                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                                Semester {user.semester}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">
                                N/A
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-600 py-4">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex gap-2">
                              {editingUser?.id === user.id ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditUser(editingUser)}
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 hover:from-green-600 hover:to-emerald-600"
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingUser(null)}
                                    className="hover:bg-gray-50 border-gray-200"
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingUser(user)}
                                    className="hover:bg-blue-50 border-blue-200"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 border-0"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  )
}

export default AdminUsers