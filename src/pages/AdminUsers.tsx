"use client"

import { useState, useEffect, useRef } from "react"
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
import { Users, UserPlus, Trash2, Edit, Search, GraduationCap, School, Shield, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { AdminUsersShimmer } from "@/components/AdminUsersShimmer"
import { PROGRAM_OPTIONS, type Program } from "@/data/syllabus"

interface User {
  id: string
  email: string
  full_name: string
  role: "admin" | "teacher" | "student"
  semester?: number
  program?: Program
  created_at: string
  updated_at: string
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [isUpdatingUser, setIsUpdatingUser] = useState(false)
  const [newUser, setNewUser] = useState({
    email: "",
    full_name: "",
    role: "student" as "admin" | "teacher" | "student",
    semester: 1,
    program: "BA" as Program,
    password: "",
  })

  const searchRef = useRef<HTMLInputElement | null>(null)
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
        program: (profile.program as Program | null) || undefined,
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
    if (isCreatingUser) return
    setIsCreatingUser(true)

    try {
      const {
        data: { session },
        error
      } = await supabase.auth.getSession()

      if (error || !session) throw new Error("Not authenticated")

      const accessToken = session.access_token

      const response = await fetch(
        "https://vnyoexxeqdjpzekjteft.supabase.co/functions/v1/create-user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            email: newUser.email,
            password: newUser.password,
            full_name: newUser.full_name,
            role: newUser.role,
            semester: newUser.semester,
            program: newUser.role === "admin" ? null : newUser.program
          })
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create user")
      }

      // Backfill program directly on the profile in case the create-user
      // edge function does not yet forward this field. Safe no-op once the
      // function is updated to pass `program` through.
      if (newUser.role !== "admin") {
        const { error: programError } = await supabase
          .from("profiles")
          .update({ program: newUser.program })
          .eq("email", newUser.email)
        if (programError) {
          console.warn("Failed to set program on new profile:", programError)
        }
      }

      toast({
        title: "Success",
        description: "User created successfully"
      })

      resetForm()
      fetchUsers()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive"
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

      // Validate program for non-admin roles
      if (user.role !== "admin" && user.program && !["BA", "MA"].includes(user.program)) {
        toast({
          title: "Error",
          description: "Program must be BA or MA",
          variant: "destructive",
        })
        return
      }

      // Prepare update data
      const updateData = {
        full_name: user.full_name,
        role: user.role,
        semester: user.role === "student" ? user.semester : null,
        program: user.role === "admin" ? null : (user.program ?? "BA"),
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
    try {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { userId },
      });

      if (error) {
        const remoteMessage =
          (data as { error?: string } | null)?.error ?? error.message;
        throw new Error(remoteMessage || "Failed to delete user");
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      fetchUsers();
    } catch (err: any) {
      console.error("Error deleting user:", err);
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };





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
      program: "BA",
      password: "",
    })
    setSearchTerm("")
    if (searchRef.current) {
      searchRef.current.value = ""
    }
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

              <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                setIsAddDialogOpen(open)
                if (!open) {
                  setSearchTerm("")
                  if (searchRef.current) {
                    searchRef.current.value = "" // ✅ clear autofill
                  }
                }
              }}>

                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-base md:text-lg px-5 md:px-6 py-2.5 md:py-3 h-auto">
                    <UserPlus className="h-5 w-5 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>

                <DialogContent className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl w-[92vw] sm:w-[480px] md:max-w-md rounded-2xl px-4 py-6 md:px-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center">
                      Add New User
                    </DialogTitle>

                    {/* Step Progress Indicator */}
                    <div className="flex justify-center mt-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${currentStep >= 1 ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"}`}>
                          1
                        </div>
                        <div className={`h-1 w-10 rounded-full ${currentStep >= 2 ? "bg-blue-600" : "bg-gray-300"}`} />
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${currentStep >= 2 ? "bg-purple-600 text-white" : "bg-gray-300 text-gray-600"}`}>
                          2
                        </div>
                      </div>
                    </div>
                  </DialogHeader>

                  {/* Step 1: Basic Info */}
                  {currentStep === 1 && (
                    <div className="space-y-6 mt-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
                        <p className="text-sm text-gray-600">Enter the user's basic details</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            placeholder="user@example.com"
                            autoComplete="off"
                            className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-400"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            placeholder="Enter secure password"
                            autoComplete="off"
                            className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-400"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">Full Name</Label>
                          <Input
                            id="full_name"
                            value={newUser.full_name}
                            onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                            placeholder="Enter full name"
                            className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-400"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={() => setCurrentStep(2)}
                          disabled={!newUser.email || !newUser.password || !newUser.full_name}
                          className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0"
                        >
                          Next Step
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Role and Permissions */}
                  {currentStep === 2 && (
                    <div className="space-y-6 mt-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-800">Role & Permissions</h3>
                        <p className="text-sm text-gray-600">Select the user's role and semester (if applicable)</p>
                      </div>

                      {/* Role Cards */}
                      <div className="grid sm:grid-cols-3 gap-4">
                        {[
                          { role: "student", icon: <GraduationCap className="w-5 h-5 text-green-600" />, label: "Student" },
                          { role: "teacher", icon: <School className="w-5 h-5 text-blue-600" />, label: "Teacher" },
                          { role: "admin", icon: <Shield className="w-5 h-5 text-red-600" />, label: "Admin" }
                        ].map(({ role, icon, label }) => (
                          <div
                            key={role}
                            onClick={() => setNewUser({ ...newUser, role: role as "admin" | "teacher" | "student" })}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 ${newUser.role === role
                              ? role === "student"
                                ? "border-green-400 bg-gradient-to-r from-green-50 to-emerald-50"
                                : role === "teacher"
                                  ? "border-blue-400 bg-gradient-to-r from-blue-50 to-cyan-50"
                                  : "border-red-400 bg-gradient-to-r from-red-50 to-pink-50"
                              : "border-gray-200 bg-white hover:shadow-md"
                              }`}
                          >
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center justify-center w-5 h-5 rounded-full border-2">
                                {icon}
                              </div>
                              <div className="text-sm font-medium text-gray-700">{label}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Semester Selector */}
                      {newUser.role === "student" && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">Select Semester</Label>
                          <div className="grid grid-cols-4 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                              <button
                                key={sem}
                                type="button"
                                className={`p-2 text-sm rounded-lg border-2 font-medium ${newUser.semester === sem
                                  ? "border-green-500 bg-green-500 text-white"
                                  : "border-green-200 bg-white hover:border-green-400 hover:bg-green-100"
                                  }`}
                                onClick={() => setNewUser({ ...newUser, semester: sem })}
                              >
                                {sem}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Program Selector — applies to students and teachers */}
                      {newUser.role !== "admin" && (
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">Select Program</Label>
                          <div className={`grid gap-2 ${PROGRAM_OPTIONS.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                            {PROGRAM_OPTIONS.map((prog) => (
                              <button
                                key={prog}
                                type="button"
                                className={`p-2 text-sm rounded-lg border-2 font-medium ${newUser.program === prog
                                  ? "border-indigo-500 bg-indigo-500 text-white"
                                  : "border-indigo-200 bg-white hover:border-indigo-400 hover:bg-indigo-100"
                                  }`}
                                onClick={() => setNewUser({ ...newUser, program: prog })}
                              >
                                {prog}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer Buttons */}
                      <div className="flex flex-col-reverse md:flex-row justify-between gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentStep(1)}
                          className="px-6 py-3 border-gray-300 hover:bg-gray-100"
                          disabled={isCreatingUser}
                        >
                          Back
                        </Button>
                        <Button
                          onClick={handleAddUser}
                          disabled={isCreatingUser}
                          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0"
                        >
                          {isCreatingUser ? "Creating..." : "Create User"}
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>


              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="bg-white/95 backdrop-blur-sm border-0 shadow-xl max-w-sm text-center">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-red-600">Confirm Deletion</DialogTitle>
                  </DialogHeader>
                  <p className="text-gray-700 mb-6">
                    Are you sure you want to delete <span className="font-semibold">{users.find(u => u.id === deletingUserId)?.email || 'this user'}</span>?
                  </p>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsDeleteDialogOpen(false)}
                      className="hover:bg-gray-100 border-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={isDeleting}
                      onClick={async () => {
                        if (deletingUserId) {
                          setIsDeleting(true) // start loading
                          await handleDeleteUser(deletingUserId)
                          setIsDeleting(false) // end loading
                          setIsDeleteDialogOpen(false)
                          setDeletingUserId(null)
                        }
                      }}
                      className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 border-0 text-white"
                    >
                      {isDeleting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="animate-spin h-4 w-4" />
                          Deleting...
                        </span>
                      ) : "Yes, Delete"}

                    </Button>
                  </div>
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
                        ref={searchRef}
                        id="user-search-box"
                        name="user_search_custom"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoComplete="off"
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
                        <TableHead className="font-semibold text-gray-700 py-4">Program</TableHead>
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
                            {editingUser?.id === user.id && editingUser.role !== "admin" ? (
                              <Select
                                value={editingUser.program ?? "BA"}
                                onValueChange={(value: Program) =>
                                  setEditingUser({ ...editingUser, program: value })
                                }
                              >
                                <SelectTrigger className="w-24 border-gray-200 focus:border-blue-400 focus:ring-blue-400">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {PROGRAM_OPTIONS.map((prog) => (
                                    <SelectItem key={prog} value={prog}>
                                      {prog}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : user.program ? (
                              <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
                                {user.program}
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
                                    onClick={() => {
                                      setDeletingUserId(user.id)
                                      setIsDeleteDialogOpen(true)
                                    }}
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