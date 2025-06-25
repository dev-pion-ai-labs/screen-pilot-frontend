"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  GraduationCap,
  Users,
  School,
  BookOpen,
  UserPlus,
  UserMinus,
  Search,
  Calendar,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  Hash,
  Plus,
  Trash2,
} from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  semester?: number;
  created_at: string;
  updated_at: string;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
  semester?: number;
}

interface Teacher {
  id: string;
  full_name: string;
  email: string;
}

interface Class {
  id: string;
  name: string;
  semester: number;
  teachers: Teacher[];
  students: Student[];
  createdAt: string;
}

const TeacherClasses = () => {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchTeacherClasses();
    fetchAllStudents();
  }, [profile]);

  const fetchTeacherClasses = async () => {
    try {
      const mockClasses: Class[] = [
        {
          id: "1",
          name: "Film and Society",
          semester: 1,
          teachers: [{ id: (profile as Profile)?.id || "1", full_name: (profile as Profile)?.full_name || "Teacher", email: (profile as Profile)?.email || "teacher@example.com" }],
          students: [
            { id: "s1", full_name: "John Doe", email: "john@example.com", semester: 1 },
            { id: "s2", full_name: "Jane Smith", email: "jane@example.com", semester: 1 },
            { id: "s3", full_name: "Mike Johnson", email: "mike@example.com", semester: 1 },
          ],
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Introduction to Direction & Screenwriting",
          semester: 2,
          teachers: [{ id: (profile as Profile)?.id || "1", full_name: (profile as Profile)?.full_name || "Teacher", email: (profile as Profile)?.email || "teacher@example.com" }],
          students: [
            { id: "s4", full_name: "Sarah Wilson", email: "sarah@example.com", semester: 2 },
            { id: "s5", full_name: "Tom Brown", email: "tom@example.com", semester: 2 },
          ],
          createdAt: new Date().toISOString(),
        },
      ];
      
      setClasses(mockClasses);
    } catch (error) {
      console.error("Error fetching teacher classes:", error);
      toast({
        title: "Error",
        description: "Failed to load your classes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "student")
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Error fetching students:", error);
        return;
      }

      const studentsData: Student[] = (data || []).map((profile) => ({
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        semester: profile.semester || undefined,
      }));

      setAllStudents(studentsData);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleAddStudent = (student: Student) => {
    if (!selectedClass) return;

    const isAlreadyInClass = selectedClass.students.some(s => s.id === student.id);
    if (isAlreadyInClass) {
      toast({
        title: "Student Already in Class",
        description: `${student.full_name} is already enrolled in this class.`,
        variant: "destructive",
      });
      return;
    }

    const updatedClass = {
      ...selectedClass,
      students: [...selectedClass.students, student],
    };

    setSelectedClass(updatedClass);
    setClasses(classes.map(c => c.id === selectedClass.id ? updatedClass : c));

    toast({
      title: "Student Added",
      description: `${student.full_name} has been added to ${selectedClass.name}.`,
    });
  };

  const handleRemoveStudent = (studentId: string) => {
    if (!selectedClass) return;

    const student = selectedClass.students.find(s => s.id === studentId);
    if (!student) return;

    const updatedClass = {
      ...selectedClass,
      students: selectedClass.students.filter(s => s.id !== studentId),
    };

    setSelectedClass(updatedClass);
    setClasses(classes.map(c => c.id === selectedClass.id ? updatedClass : c));

    toast({
      title: "Student Removed",
      description: `${student.full_name} has been removed from ${selectedClass.name}.`,
    });
  };

  const openClassDialog = (classItem: Class) => {
    setSelectedClass(classItem);
    setIsDialogOpen(true);
    setSearchTerm("");
  };

  const filteredStudents = allStudents.filter(student => 
    (student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     student.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
    !selectedClass?.students.some(s => s.id === student.id)
  );

  if (loading) {
    return (
      <AuthGuard allowedRoles={["teacher"]}>
        <ModernDashboardLayout>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-purple-400 rounded-full animate-spin animation-delay-150"></div>
            </div>
          </div>
        </ModernDashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["teacher"]}>
      <ModernDashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <div className="space-y-8 p-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 via-blue-500 to-indigo-600 p-8 text-white">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                    <School className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">My Classes</h1>
                    <p className="text-white/90 text-lg">Manage your assigned classes and students</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    {classes.length} Active Classes
                  </div>
                </div>
              </div>
            </div>

            {/* Classes Grid */}
            {classes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="p-6 bg-white/50 backdrop-blur-sm rounded-full mb-6">
                  <School className="h-16 w-16 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-700 mb-2">No Classes Assigned</h2>
                <p className="text-gray-600 text-center max-w-md">
                  You haven't been assigned to any classes yet. Please contact your administrator to get assigned to classes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((classItem) => (
                  <Card 
                    key={classItem.id} 
                    className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-blue-50"
                    onClick={() => openClassDialog(classItem)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold text-blue-900">
                              {classItem.name}
                            </CardTitle>
                            <Badge variant="secondary" className="mt-1">
                              Semester {classItem.semester}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>{classItem.students.length} Students Enrolled</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>Created {new Date(classItem.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Quick Actions</span>
                            <div className="flex gap-1">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <AlertCircle className="h-4 w-4 text-orange-500" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Class Detail Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl">
                        {selectedClass?.name}
                      </DialogTitle>
                      <p className="text-sm text-gray-600">
                        Semester {selectedClass?.semester} • {selectedClass?.students.length} Students
                      </p>
                    </div>
                  </div>
                </DialogHeader>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Enrolled Students */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Enrolled Students ({selectedClass?.students.length || 0})
                      </h3>
                    </div>
                    
                    <ScrollArea className="h-[300px] border rounded-lg p-4">
                      {selectedClass?.students.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No students enrolled yet</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedClass?.students.map((student) => (
                            <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{student.full_name}</p>
                                  <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {student.email}
                                  </p>
                                  {student.semester && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                      <Hash className="h-3 w-3" />
                                      Semester {student.semester}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveStudent(student.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>

                  {/* Add Students */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Add Students
                      </h3>
                    </div>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search students by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <ScrollArea className="h-[300px] border rounded-lg p-4">
                      {filteredStudents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No students found</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filteredStudents.map((student) => (
                            <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{student.full_name}</p>
                                  <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {student.email}
                                  </p>
                                  {student.semester && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                      <Hash className="h-3 w-3" />
                                      Semester {student.semester}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAddStudent(student)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  );
};

export default TeacherClasses;