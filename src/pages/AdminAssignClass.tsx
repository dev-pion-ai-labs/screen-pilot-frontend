"use client";

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { AdminClassHeader } from "@/components/AdminClassHeader";
import { AdminClassTable } from "@/components/AdminClassTable";
import { AdminClassDialog } from "@/components/AdminClassDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Teacher {
  id: string;
  full_name: string;
  email: string;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
  semester?: number;
}

interface Class {
  id: string;
  name: string;
  semester: number;
  teachers: Teacher[];
  students: Student[];
  createdAt: string;
}

const AdminAssignClass = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  // Modal states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form states
  const [newClassName, setNewClassName] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedTeachers, setSelectedTeachers] = useState<Teacher[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);

  useEffect(() => {
    fetchTeachers();
    fetchStudents();
  }, []);

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "teacher")
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Error fetching teachers:", error);
        toast({
          title: "Error",
          description: "Failed to load teachers",
          variant: "destructive",
        });
        return;
      }

      const teachersData: Teacher[] = (data || []).map((profile) => ({
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
      }));

      setTeachers(teachersData);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast({
        title: "Error",
        description: "Failed to load teachers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "student")
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Error fetching students:", error);
        toast({
          title: "Error",
          description: "Failed to load students",
          variant: "destructive",
        });
        return;
      }

      const studentsData: Student[] = (data || []).map((profile) => ({
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        semester: profile.semester || undefined,
      }));

      setStudents(studentsData);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    }
  };

  const handleAddClass = () => {
    if (!newClassName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a class name",
        variant: "destructive",
      });
      return;
    }

    if (selectedTeachers.length !== 1) {
      toast({
        title: "Error",
        description: "Please select exactly one teacher",
        variant: "destructive",
      });
      return;
    }

    if (selectedStudents.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student",
        variant: "destructive",
      });
      return;
    }

    const newClass: Class = {
      id: Date.now().toString(),
      name: newClassName,
      semester: selectedSemester,
      teachers: selectedTeachers,
      students: selectedStudents,
      createdAt: new Date().toISOString(),
    };

    setClasses([...classes, newClass]);

    resetForm();
    setIsAddDialogOpen(false);

    toast({
      title: "Success",
      description: "Class created successfully",
    });
  };

  const handleEditClass = () => {
    if (!editingClass || !newClassName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a class name",
        variant: "destructive",
      });
      return;
    }

    const updatedClass: Class = {
      ...editingClass,
      name: newClassName,
      semester: selectedSemester,
      teachers: selectedTeachers,
      students: selectedStudents,
    };

    setClasses(
      classes.map((c) => (c.id === editingClass.id ? updatedClass : c))
    );

    resetForm();
    setEditingClass(null);
    setIsEditDialogOpen(false);

    toast({
      title: "Success",
      description: "Class updated successfully",
    });
  };

  const resetForm = () => {
    setNewClassName("");
    setSelectedSemester(1);
    setSelectedTeachers([]);
    setSelectedStudents([]);
  };

  const openEditDialog = (classItem: Class) => {
    setEditingClass(classItem);
    setNewClassName(classItem.name);
    setSelectedSemester(classItem.semester);
    setSelectedTeachers(classItem.teachers);
    setSelectedStudents(classItem.students);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClass = (classId: string) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      setClasses(classes.filter((c) => c.id !== classId));
      toast({
        title: "Success",
        description: "Class deleted successfully",
      });
    }
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={["admin"]}>
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
    <AuthGuard allowedRoles={["admin"]}>
      <ModernDashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <div className="space-y-8 p-8">
            <AdminClassHeader />

            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 px-8 py-4 text-lg font-semibold rounded-2xl"
              >
                <Plus className="w-6 h-6 mr-3" />
                Create New Class
              </Button>
            </div>

            <AdminClassDialog
              isOpen={isAddDialogOpen}
              onClose={() => setIsAddDialogOpen(false)}
              onSubmit={handleAddClass}
              mode="add"
              className={newClassName}
              setClassName={setNewClassName}
              selectedSemester={selectedSemester}
              setSelectedSemester={setSelectedSemester}
              selectedTeachers={selectedTeachers}
              setSelectedTeachers={setSelectedTeachers}
              selectedStudents={selectedStudents}
              setSelectedStudents={setSelectedStudents}
              teachers={teachers}
              students={students}
              onResetForm={resetForm}
            />

            <AdminClassTable
              classes={classes}
              onEditClass={openEditDialog}
              onDeleteClass={handleDeleteClass}
            />

            <AdminClassDialog
              isOpen={isEditDialogOpen}
              onClose={() => setIsEditDialogOpen(false)}
              onSubmit={handleEditClass}
              mode="edit"
              className={newClassName}
              setClassName={setNewClassName}
              selectedSemester={selectedSemester}
              setSelectedSemester={setSelectedSemester}
              selectedTeachers={selectedTeachers}
              setSelectedTeachers={setSelectedTeachers}
              selectedStudents={selectedStudents}
              setSelectedStudents={setSelectedStudents}
              teachers={teachers}
              students={students}
              onResetForm={resetForm}
            />
          </div>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  );
};

export default AdminAssignClass;