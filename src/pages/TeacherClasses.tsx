"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { TeacherClassesShimmer } from "@/components/TeacherClassesShimmer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  School,
  Calendar,
  Target,
  BookOpen,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  UserMinus,
  Search,
  User,
  Mail,
  Hash,
  Plus,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

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
  student_count: number;
}

// TeacherClassCard Component
const TeacherClassCard = ({
  classItem,
  onClick,
}: {
  classItem: Class;
  onClick: (classItem: Class) => void;
}) => {
  return (
    <Card
      className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-blue-50"
      onClick={() => onClick(classItem)}
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
            <span>{classItem.student_count} Students Enrolled</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>
              Created {new Date(classItem.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Manage Class Students
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// TeacherClassDialog Component
const TeacherClassDialog = ({
  isOpen,
  onClose,
  selectedClass,
  onRefresh,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: Class | null;
  onRefresh: () => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Reset search term when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  // Fetch students data when dialog opens
  useEffect(() => {
    if (isOpen && selectedClass) {
      fetchStudentsData();
    }
  }, [isOpen, selectedClass]);

  const fetchStudentsData = async () => {
    if (!selectedClass) return;
    
    setLoading(true);
    try {
      // Fetch all students
      const { data: allStudentsData, error: allStudentsError } = await supabase
        .from("profiles")
        .select("id, full_name, email, semester")
        .eq("role", "student")
        .order("full_name", { ascending: true });

      if (allStudentsError) throw allStudentsError;

      // Fetch enrolled students for this class
      const { data: enrolledData, error: enrolledError } = await supabase
        .from("class_students")
        .select(`
          student_id,
          profiles:student_id (
            id,
            full_name,
            email,
            semester
          )
        `)
        .eq("class_id", selectedClass.id);

      if (enrolledError) throw enrolledError;

      const enrolledStudentsData = enrolledData.map(item => ({
        id: item.profiles.id,
        full_name: item.profiles.full_name,
        email: item.profiles.email,
        semester: item.profiles.semester
      }));

      setAllStudents(allStudentsData || []);
      setEnrolledStudents(enrolledStudentsData || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast({
        title: "Error",
        description: "Failed to load student data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (student: Student) => {
    if (!selectedClass) return;

    const isAlreadyInClass = enrolledStudents.some(s => s.id === student.id);
    if (isAlreadyInClass) {
      toast({
        title: "Student Already in Class",
        description: `${student.full_name} is already enrolled in this class.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("class_students")
        .insert([
          {
            class_id: selectedClass.id,
            student_id: student.id,
          }
        ]);

      if (error) throw error;

      // Update local state
      setEnrolledStudents(prev => [...prev, student]);
      
      toast({
        title: "Student Added",
        description: `${student.full_name} has been added to ${selectedClass.name}.`,
      });

      // Refresh the parent component
      onRefresh();
    } catch (error) {
      console.error("Error adding student:", error);
      toast({
        title: "Error",
        description: "Failed to add student to class",
        variant: "destructive",
      });
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedClass) return;

    const student = enrolledStudents.find(s => s.id === studentId);
    if (!student) return;

    try {
      const { error } = await supabase
        .from("class_students")
        .delete()
        .eq("class_id", selectedClass.id)
        .eq("student_id", studentId);

      if (error) throw error;

      // Update local state
      setEnrolledStudents(prev => prev.filter(s => s.id !== studentId));
      
      toast({
        title: "Student Removed",
        description: `${student.full_name} has been removed from ${selectedClass.name}.`,
      });

      // Refresh the parent component
      onRefresh();
    } catch (error) {
      console.error("Error removing student:", error);
      toast({
        title: "Error",
        description: "Failed to remove student from class",
        variant: "destructive",
      });
    }
  };

  const filteredStudents = allStudents.filter(student => 
    (student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     student.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
    !enrolledStudents.some(s => s.id === student.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
                Semester {selectedClass?.semester} • {enrolledStudents.length} Students
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
                Enrolled Students ({enrolledStudents.length})
              </h3>
            </div>
            
            <ScrollArea className="h-[300px] border rounded-lg p-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading students...</p>
                </div>
              ) : enrolledStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No students enrolled yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {enrolledStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
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
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading students...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No students found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
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
  );
};

// Main TeacherClasses Component
const TeacherClasses = () => {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchTeacherClasses = useCallback(async () => {
    if (!(profile as Profile)?.id) return;

    try {
      setLoading(true);
      
      // Fetch classes where the current teacher is assigned
      const { data: classTeachersData, error: classTeachersError } = await supabase
        .from('class_teachers')
        .select(`
          class_id,
          classes:class_id (
            id,
            name,
            semester,
            created_at,
            updated_at
          )
        `)
        .eq('teacher_id', (profile as Profile).id);

      if (classTeachersError) throw classTeachersError;

      // Get detailed class information with student counts
      const classesWithDetails = await Promise.all(
        classTeachersData.map(async (item) => {
          // Get student count for each class
          const { count: studentCount } = await supabase
            .from('class_students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', item.class_id);

          // Get teacher information
          const { data: teacherData } = await supabase
            .from('class_teachers')
            .select(`
              teacher_id,
              profiles:teacher_id (
                id,
                full_name,
                email
              )
            `)
            .eq('class_id', item.class_id);

          const teachers = teacherData?.map(t => ({
            id: t.profiles.id,
            full_name: t.profiles.full_name,
            email: t.profiles.email
          })) || [];

          return {
            id: item.classes.id,
            name: item.classes.name,
            semester: item.classes.semester,
            createdAt: item.classes.created_at,
            student_count: studentCount || 0,
            teachers,
            students: [] // We'll load this when needed in the dialog
          };
        })
      );

      setClasses(classesWithDetails);
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
  }, [profile, toast]);

  useEffect(() => {
    fetchTeacherClasses();
  }, [fetchTeacherClasses]);

  const openClassDialog = (classItem: Class) => {
    setSelectedClass(classItem);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedClass(null);
  };

  const handleRefresh = () => {
    fetchTeacherClasses();
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={["teacher"]}>
        <ModernDashboardLayout>
          <TeacherClassesShimmer />
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
                  <TeacherClassCard 
                    key={classItem.id}
                    classItem={classItem}
                    onClick={openClassDialog}
                  />
                ))}
              </div>
            )}

            {/* Class Detail Dialog */}
            <TeacherClassDialog
              isOpen={isDialogOpen}
              onClose={closeDialog}
              selectedClass={selectedClass}
              onRefresh={handleRefresh}
            />
          </div>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  );
};

export default TeacherClasses;