
// import { useState, useEffect } from 'react';
// import { AuthGuard } from '@/components/AuthGuard';
// import { ModernDashboardLayout } from '@/components/ModernDashboardLayout';
// import { Button } from '@/components/ui/button';
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from '@/components/ui/dialog';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table';
// import { supabase } from '@/integrations/supabase/client';
// import { UserPlus, Search, Eye, Trash2 } from 'lucide-react';
// import { toast } from '@/hooks/use-toast';

// interface User {
//   id: string;
//   email: string;
//   full_name: string;
//   role: string;
//   created_at: string;
// }

// export default function AdminUsers() {
//   const [users, setUsers] = useState<User[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedRole, setSelectedRole] = useState<string>('all');
//   const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
//   const [newUser, setNewUser] = useState({
//     email: '',
//     full_name: '',
//     role: 'student',
//     password: ''
//   });

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   const fetchUsers = async () => {
//     try {
//       const { data, error } = await supabase
//         .from('profiles')
//         .select('*')
//         .order('created_at', { ascending: false });

//       if (error) throw error;
//       setUsers(data || []);
//     } catch (error) {
//       console.error('Error fetching users:', error);
//       toast({
//         title: "Error",
//         description: "Failed to fetch users",
//         variant: "destructive"
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const createUser = async () => {
//     if (!newUser.email || !newUser.password || !newUser.full_name) {
//       toast({
//         title: "Error",
//         description: "Please fill in all fields",
//         variant: "destructive"
//       });
//       return;
//     }

//     try {
//       // Get current session to save admin state
//       const { data: currentSession } = await supabase.auth.getSession();
      
//       // Create auth user
//       const { data: authData, error: authError } = await supabase.auth.admin.createUser({
//         email: newUser.email,
//         password: newUser.password,
//         user_metadata: {
//           full_name: newUser.full_name,
//           role: newUser.role
//         },
//         email_confirm: true
//       });

//       if (authError) {
//         console.error('Auth error:', authError);
//         throw authError;
//       }

//       // Create profile entry
//       if (authData.user) {
//         const { error: profileError } = await supabase
//           .from('profiles')
//           .insert({
//             id: authData.user.id,
//             email: newUser.email,
//             full_name: newUser.full_name,
//             role: newUser.role
//           });

//         if (profileError) {
//           console.error('Profile error:', profileError);
//           // If profile creation fails, clean up auth user
//           await supabase.auth.admin.deleteUser(authData.user.id);
//           throw profileError;
//         }
//       }

//       // Restore admin session if it was lost
//       if (currentSession?.session) {
//         await supabase.auth.setSession(currentSession.session);
//       }

//       // Refresh the users list
//       await fetchUsers();
      
//       setIsCreateDialogOpen(false);
      
//       // Show credentials to admin
//       const credentials = `Email: ${newUser.email}\nPassword: ${newUser.password}`;
      
//       setNewUser({ email: '', full_name: '', role: 'student', password: '' });
      
//       toast({
//         title: "User Created Successfully!",
//         description: `Share these credentials with the user:\n${credentials}`,
//       });

//       // Copy credentials to clipboard
//       navigator.clipboard.writeText(credentials).then(() => {
//         toast({
//           title: "Credentials Copied",
//           description: "User credentials have been copied to clipboard",
//         });
//       });

//     } catch (error: any) {
//       console.error('Error creating user:', error);
//       let errorMessage = "Failed to create user";
      
//       if (error.message?.includes('already registered')) {
//         errorMessage = "This email is already registered";
//       } else if (error.message?.includes('password')) {
//         errorMessage = "Password must be at least 6 characters";
//       } else if (error.message) {
//         errorMessage = error.message;
//       }
      
//       toast({
//         title: "Error",
//         description: errorMessage,
//         variant: "destructive"
//       });
//     }
//   };

//   const deleteUser = async (userId: string, userEmail: string) => {
//     if (!confirm(`Are you sure you want to delete user: ${userEmail}?`)) return;

//     try {
//       // Delete from auth using admin API
//       const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
//       if (authError) {
//         console.error('Auth deletion error:', authError);
//         // If auth deletion fails, still try to delete from profiles
//       }

//       // Delete from profiles table
//       const { error: profileError } = await supabase
//         .from('profiles')
//         .delete()
//         .eq('id', userId);

//       if (profileError) {
//         console.error('Profile deletion error:', profileError);
//       }

//       await fetchUsers();
//       toast({
//         title: "Success",
//         description: "User deleted successfully",
//       });
//     } catch (error: any) {
//       console.error('Error deleting user:', error);
//       toast({
//         title: "Error",
//         description: "Failed to delete user. You may need admin privileges.",
//         variant: "destructive"
//       });
//     }
//   };

//   const filteredUsers = users.filter(user => {
//     const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesRole = selectedRole === 'all' || user.role === selectedRole;
//     return matchesSearch && matchesRole;
//   });

//   const generatePassword = () => {
//     const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//     let password = '';
//     for (let i = 0; i < 8; i++) {
//       password += chars.charAt(Math.floor(Math.random() * chars.length));
//     }
//     setNewUser(prev => ({ ...prev, password }));
//   };

//   return (
//     <AuthGuard allowedRoles={['admin']}>
//       <ModernDashboardLayout>
//         <div className="space-y-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
//               <p className="text-muted-foreground">Create and manage user accounts</p>
//             </div>
            
//             <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
//               <DialogTrigger asChild>
//                 <Button>
//                   <UserPlus className="h-4 w-4 mr-2" />
//                   Create User
//                 </Button>
//               </DialogTrigger>
//               <DialogContent className="sm:max-w-[425px]">
//                 <DialogHeader>
//                   <DialogTitle>Create New User</DialogTitle>
//                 </DialogHeader>
//                 <div className="grid gap-4 py-4">
//                   <div className="grid gap-2">
//                     <Label htmlFor="full_name">Full Name</Label>
//                     <Input
//                       id="full_name"
//                       value={newUser.full_name}
//                       onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
//                       placeholder="Enter full name"
//                     />
//                   </div>
//                   <div className="grid gap-2">
//                     <Label htmlFor="email">Email</Label>
//                     <Input
//                       id="email"
//                       type="email"
//                       value={newUser.email}
//                       onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
//                       placeholder="Enter email address"
//                     />
//                   </div>
//                   <div className="grid gap-2">
//                     <Label htmlFor="role">Role</Label>
//                     <Select
//                       value={newUser.role}
//                       onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}
//                     >
//                       <SelectTrigger>
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="student">Student</SelectItem>
//                         <SelectItem value="teacher">Teacher</SelectItem>
//                         <SelectItem value="admin">Admin</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div className="grid gap-2">
//                     <Label htmlFor="password">Password</Label>
//                     <div className="flex gap-2">
//                       <Input
//                         id="password"
//                         type="text"
//                         value={newUser.password}
//                         onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
//                         placeholder="Enter password"
//                       />
//                       <Button type="button" variant="outline" onClick={generatePassword}>
//                         Generate
//                       </Button>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="flex justify-end gap-2">
//                   <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
//                     Cancel
//                   </Button>
//                   <Button onClick={createUser}>Create User</Button>
//                 </div>
//               </DialogContent>
//             </Dialog>
//           </div>

//           {/* Filters */}
//           <Card>
//             <CardContent className="p-4">
//               <div className="flex gap-4">
//                 <div className="flex-1 relative">
//                   <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
//                   <Input
//                     placeholder="Search users..."
//                     className="pl-10"
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                   />
//                 </div>
//                 <Select value={selectedRole} onValueChange={setSelectedRole}>
//                   <SelectTrigger className="w-[180px]">
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">All Roles</SelectItem>
//                     <SelectItem value="student">Students</SelectItem>
//                     <SelectItem value="teacher">Teachers</SelectItem>
//                     <SelectItem value="admin">Admins</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Users Table */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Users ({filteredUsers.length})</CardTitle>
//             </CardHeader>
//             <CardContent>
//               {loading ? (
//                 <div className="text-center py-8">
//                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
//                   <p className="mt-2 text-gray-600">Loading users...</p>
//                 </div>
//               ) : (
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Name</TableHead>
//                       <TableHead>Email</TableHead>
//                       <TableHead>Role</TableHead>
//                       <TableHead>Created</TableHead>
//                       <TableHead>Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {filteredUsers.map((user) => (
//                       <TableRow key={user.id}>
//                         <TableCell className="font-medium">{user.full_name}</TableCell>
//                         <TableCell>{user.email}</TableCell>
//                         <TableCell>
//                           <Badge 
//                             variant={user.role === 'admin' ? 'destructive' : user.role === 'teacher' ? 'default' : 'secondary'}
//                             className="capitalize"
//                           >
//                             {user.role}
//                           </Badge>
//                         </TableCell>
//                         <TableCell>
//                           {new Date(user.created_at).toLocaleDateString()}
//                         </TableCell>
//                         <TableCell>
//                           <div className="flex gap-2">
//                             <Button variant="outline" size="sm">
//                               <Eye className="h-4 w-4" />
//                             </Button>
//                             <Button 
//                               variant="outline" 
//                               size="sm"
//                               onClick={() => deleteUser(user.id, user.email)}
//                             >
//                               <Trash2 className="h-4 w-4" />
//                             </Button>
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                     {filteredUsers.length === 0 && !loading && (
//                       <TableRow>
//                         <TableCell colSpan={5} className="text-center py-8">
//                           <p className="text-gray-500">No users found</p>
//                         </TableCell>
//                       </TableRow>
//                     )}
//                   </TableBody>
//                 </Table>
//               )}
//             </CardContent>
//           </Card>
//         </div>
//       </ModernDashboardLayout>
//     </AuthGuard>
//   );
// }


"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { supabase } from "@/integrations/supabase/client"
import {
  UserPlus,
  Search,
  Eye,
  Trash2,
  Filter,
  Users,
  Shield,
  GraduationCap,
  BookOpen,
  Copy,
  RefreshCw,
  MoreHorizontal,
  Edit,
  Mail,
  Calendar,
  Activity,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface User {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
}

interface UserStats {
  total: number
  students: number
  teachers: number
  admins: number
  recentlyAdded: number
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [userStats, setUserStats] = useState<UserStats>({
    total: 0,
    students: 0,
    teachers: 0,
    admins: 0,
    recentlyAdded: 0,
  })
  const [newUser, setNewUser] = useState({
    email: "",
    full_name: "",
    role: "student",
    password: "",
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    calculateStats()
  }, [users])

  const calculateStats = () => {
    const total = users.length
    const students = users.filter((user) => user.role === "student").length
    const teachers = users.filter((user) => user.role === "teacher").length
    const admins = users.filter((user) => user.role === "admin").length

    // Calculate recently added (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentlyAdded = users.filter((user) => new Date(user.created_at) > sevenDaysAgo).length

    setUserStats({ total, students, teachers, admins, recentlyAdded })
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      const { data: currentSession } = await supabase.auth.getSession()

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        user_metadata: {
          full_name: newUser.full_name,
          role: newUser.role,
        },
        email_confirm: true,
      })

      if (authError) {
        console.error("Auth error:", authError)
        throw authError
      }


      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role,
        })

        if (profileError) {
          console.error("Profile error:", profileError)
          // If profile creation fails, clean up auth user
          await supabase.auth.admin.deleteUser(authData.user.id)
          throw profileError
        }
      }

      if (currentSession?.session) {
        await supabase.auth.setSession(currentSession.session)
      }

      await fetchUsers()

      setIsCreateDialogOpen(false)

      const credentials = `Email: ${newUser.email}\nPassword: ${newUser.password}`

      setNewUser({ email: "", full_name: "", role: "student", password: "" })

      toast({
        title: "User Created Successfully!",
        description: `Share these credentials with the user:\n${credentials}`,
      })

      navigator.clipboard.writeText(credentials).then(() => {
        toast({
          title: "Credentials Copied",
          description: "User credentials have been copied to clipboard",
        })
      })
    } catch (error: any) {
      console.error("Error creating user:", error)
      let errorMessage = "Failed to create user"

      if (error.message?.includes("already registered")) {
        errorMessage = "This email is already registered"
      } else if (error.message?.includes("password")) {
        errorMessage = "Password must be at least 6 characters"
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const deleteUser = async (userId: string, userEmail: string) => {
    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)

      if (authError) {
        console.error("Auth deletion error:", authError)
      }

      const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId)

      if (profileError) {
        console.error("Profile deletion error:", profileError)
      }

      await fetchUsers()
      toast({
        title: "Success",
        description: "User deleted successfully",
      })
    } catch (error: any) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user. You may need admin privileges.",
        variant: "destructive",
      })
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === "all" || user.role === selectedRole
    const matchesTab = activeTab === "all" || user.role === activeTab
    return matchesSearch && matchesRole && matchesTab
  })

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let password = ""
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewUser((prev) => ({ ...prev, password }))
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />
      case "teacher":
        return <GraduationCap className="h-4 w-4" />
      case "student":
        return <BookOpen className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "teacher":
        return "default"
      case "student":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <ModernDashboardLayout>
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    User Management
                  </h1>
                  <p className="text-muted-foreground text-lg">Create and manage user accounts across the platform</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={fetchUsers}
                className="group hover:scale-105 transition-all duration-200"
              >
                <RefreshCw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                Refresh
              </Button>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="group hover:scale-105 transition-all duration-200">
                    <UserPlus className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform duration-200" />
                    Create User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-primary" />
                      Create New User
                    </DialogTitle>
                    <DialogDescription>
                      Add a new user to the platform. Credentials will be generated and copied to your clipboard.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={newUser.full_name}
                        onChange={(e) => setNewUser((prev) => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Enter full name"
                        className="transition-all duration-200 focus:scale-[1.02]"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter email address"
                        className="transition-all duration-200 focus:scale-[1.02]"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(value) => setNewUser((prev) => ({ ...prev, role: value }))}
                      >
                        <SelectTrigger className="transition-all duration-200 focus:scale-[1.02]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              Student
                            </div>
                          </SelectItem>
                          <SelectItem value="teacher">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4" />
                              Teacher
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Admin
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="flex gap-2">
                        <Input
                          id="password"
                          type="text"
                          value={newUser.password}
                          onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                          placeholder="Enter password"
                          className="transition-all duration-200 focus:scale-[1.02]"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generatePassword}
                          className="hover:scale-105 transition-transform"
                        >
                          Generate
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createUser}>Create User</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <div className="p-2 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{userStats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">Across all roles</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Students</CardTitle>
                <div className="p-2 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                  <BookOpen className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{userStats.students}</div>
                <p className="text-xs text-muted-foreground mt-1">Active learners</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Teachers</CardTitle>
                <div className="p-2 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{userStats.teachers}</div>
                <p className="text-xs text-muted-foreground mt-1">Educators</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recently Added</CardTitle>
                <div className="p-2 bg-orange-100 rounded-full group-hover:bg-orange-200 transition-colors">
                  <Activity className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{userStats.recentlyAdded}</div>
                <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
              </CardContent>
            </Card>
          </div>


          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    className="pl-10 transition-all duration-200 focus:scale-[1.02]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-[180px] transition-all duration-200 focus:scale-[1.02]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue />
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
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Users ({filteredUsers.length})
                  </CardTitle>
                  <CardDescription>Manage all platform users and their roles</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    All ({users.length})
                  </TabsTrigger>
                  <TabsTrigger value="student" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Students ({userStats.students})
                  </TabsTrigger>
                  <TabsTrigger value="teacher" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Teachers ({userStats.teachers})
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admins ({userStats.admins})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-primary/40 rounded-full animate-spin animation-delay-150"></div>
                        </div>
                        <p className="text-muted-foreground">Loading users...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((user) => (
                            <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                      {user.full_name?.charAt(0).toUpperCase() || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{user.full_name}</p>
                          
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  {user.email}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={getRoleBadgeVariant(user.role)}
                                  className="flex items-center gap-1 w-fit"
                                >
                                  {getRoleIcon(user.role)}
                                  <span className="capitalize">{user.role}</span>
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  {new Date(user.created_at).toLocaleDateString()}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => navigator.clipboard.writeText(user.email)}
                                      className="cursor-pointer"
                                    >
                                      <Copy className="mr-2 h-4 w-4" />
                                      Copy email
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                          className="cursor-pointer text-destructive focus:text-destructive"
                                          onSelect={(e) => e.preventDefault()}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete user
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the user account
                                            for <strong>{user.email}</strong> and remove all associated data.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => deleteUser(user.id, user.email)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Delete User
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                          {filteredUsers.length === 0 && !loading && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-12">
                                <div className="flex flex-col items-center gap-4">
                                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                    <Users className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="text-lg font-medium">No users found</p>
                                    <p className="text-muted-foreground">
                                      {searchTerm || selectedRole !== "all"
                                        ? "Try adjusting your search or filters"
                                        : "Create your first user to get started"}
                                    </p>
                                  </div>
                                  {!searchTerm && selectedRole === "all" && (
                                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                                      <UserPlus className="mr-2 h-4 w-4" />
                                      Create First User
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  )
}
