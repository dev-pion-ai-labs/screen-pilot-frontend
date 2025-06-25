"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { TeacherClassCard } from "@/components/TeacherClassCard";
import { TeacherClassDialog } from "@/components/TeacherClassDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  School,
  Calendar,
  Target,
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchTeacherClasses = useCallback(async () => {
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
  }, [profile]);

  const fetchAllStudents = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchTeacherClasses();
    fetchAllStudents();
  }, [fetchTeacherClasses, fetchAllStudents]);

  const handleAddStudent = (student: Student) => {
    if (!selectedClass) return;

    const updatedClass = {
      ...selectedClass,
      students: [...selectedClass.students, student],
    };

    setSelectedClass(updatedClass);
    setClasses(classes.map(c => c.id === selectedClass.id ? updatedClass : c));
  };

  const handleRemoveStudent = (studentId: string) => {
    if (!selectedClass) return;

    const updatedClass = {
      ...selectedClass,
      students: selectedClass.students.filter(s => s.id !== studentId),
    };

    setSelectedClass(updatedClass);
    setClasses(classes.map(c => c.id === selectedClass.id ? updatedClass : c));
  };

  const openClassDialog = (classItem: Class) => {
    setSelectedClass(classItem);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedClass(null);
  };

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
              allStudents={allStudents}
              onAddStudent={handleAddStudent}
              onRemoveStudent={handleRemoveStudent}
            />
          </div>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  );
};

export default TeacherClasses;