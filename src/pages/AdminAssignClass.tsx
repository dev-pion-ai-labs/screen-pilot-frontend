// Fixed AdminAssignClass.tsx

"use client";

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { AdminClassHeader } from "@/components/AdminClassHeader";
import { AdminClassTable } from "@/components/AdminClassTable";
import { AdminClassDialog } from "@/components/AdminClassDialog";
import { AdminAssignClassShimmer } from "@/components/AdminAssignClassShimmer";
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
  semester: number; // ✅ Added missing semester field
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

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [newClassName, setNewClassName] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedTeachers, setSelectedTeachers] = useState<Teacher[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);

  useEffect(() => {
    fetchTeachers();
    fetchStudents();
    fetchClasses();
  }, []);

  const fetchTeachers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "teacher")
      .order("full_name", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load teachers",
        variant: "destructive",
      });
      return;
    }

    setTeachers(data || []);
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, semester")
      .eq("role", "student")
      .order("full_name", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
      return;
    }

    setStudents(data || []);
  };

  const fetchClasses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("classes")
      .select(`
        id,
        name,
        semester,
        created_at,
        class_teachers (
          teacher_id,
          profiles (id, full_name, email)
        ),
        class_students (
          student_id,
          profiles (id, full_name, email, semester)
        )
      `);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch classes",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const formatted = (data || []).map((c) => ({
      id: c.id,
      name: c.name,
      semester: c.semester,
      createdAt: c.created_at,
      teachers: c.class_teachers.map((t: any) => t.profiles),
      students: c.class_students.map((s: any) => s.profiles),
    }));

    setClasses(formatted);
    setLoading(false);
  };

  const handleAddClass = async () => {
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

    // ✅ Fixed: Use selected students instead of auto-assigning all semester students
    if (selectedStudents.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student",
        variant: "destructive",
      });
      return;
    }

    try {
      // 1. Create class in DB
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .insert([
          {
            name: newClassName,
            semester: selectedSemester,
          },
        ])
        .select()
        .single();

      if (classError) throw classError;

      const classId = classData.id;

      // 2. Insert class teacher
      const { error: teacherError } = await supabase
        .from("class_teachers")
        .insert([
          {
            class_id: classId,
            teacher_id: selectedTeachers[0].id,
          },
        ]);

      if (teacherError) throw teacherError;

      // 3. Insert selected students (not all semester students)
      if (selectedStudents.length > 0) {
        const { error: studentInsertError } = await supabase
          .from("class_students")
          .insert(
            selectedStudents.map((student) => ({
              class_id: classId,
              student_id: student.id,
            }))
          );

        if (studentInsertError) throw studentInsertError;
      }

      // 4. Update local state
      const newClass: Class = {
        id: classId,
        name: newClassName,
        semester: selectedSemester,
        teachers: selectedTeachers,
        students: selectedStudents,
        createdAt: classData.created_at,
      };

      setClasses([...classes, newClass]);

      resetForm();
      setIsAddDialogOpen(false);

      toast({
        title: "Success",
        description: "Class created successfully",
      });
    } catch (error) {
      console.error("Error creating class:", error);
      toast({
        title: "Error",
        description: "Failed to create class",
        variant: "destructive",
      });
    }
  };

  // ✅ New: Separate edit handler
  const handleEditClass = async () => {
    if (!editingClass) return;

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

    try {
      // 1. Update class details
      const { error: classError } = await supabase
        .from("classes")
        .update({
          name: newClassName,
          semester: selectedSemester,
        })
        .eq("id", editingClass.id);

      if (classError) throw classError;

      // 2. Delete existing teacher assignments
      const { error: deleteTeacherError } = await supabase
        .from("class_teachers")
        .delete()
        .eq("class_id", editingClass.id);

      if (deleteTeacherError) throw deleteTeacherError;

      // 3. Insert new teacher assignment
      const { error: teacherError } = await supabase
        .from("class_teachers")
        .insert([
          {
            class_id: editingClass.id,
            teacher_id: selectedTeachers[0].id,
          },
        ]);

      if (teacherError) throw teacherError;

      // 4. Delete existing student assignments
      const { error: deleteStudentError } = await supabase
        .from("class_students")
        .delete()
        .eq("class_id", editingClass.id);

      if (deleteStudentError) throw deleteStudentError;

      // 5. Insert new student assignments
      if (selectedStudents.length > 0) {
        const { error: studentInsertError } = await supabase
          .from("class_students")
          .insert(
            selectedStudents.map((student) => ({
              class_id: editingClass.id,
              student_id: student.id,
            }))
          );

        if (studentInsertError) throw studentInsertError;
      }

      // 6. Update local state
      const updatedClass: Class = {
        ...editingClass,
        name: newClassName,
        semester: selectedSemester,
        teachers: selectedTeachers,
        students: selectedStudents,
      };

      setClasses(classes.map(c => c.id === editingClass.id ? updatedClass : c));

      resetForm();
      setIsEditDialogOpen(false);
      setEditingClass(null);

      toast({
        title: "Success",
        description: "Class updated successfully",
      });
    } catch (error) {
      console.error("Error updating class:", error);
      toast({
        title: "Error",
        description: "Failed to update class",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClass = async (classId: string) => {
    const { error } = await supabase
      .from("classes")
      .delete()
      .eq("id", classId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete class",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Class deleted successfully",
      });
      fetchClasses();
    }
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

  // ✅ Fixed: Close edit dialog properly
  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingClass(null);
    resetForm();
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={["admin"]}>
        <ModernDashboardLayout>
          <AdminAssignClassShimmer />
        </ModernDashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <ModernDashboardLayout>
        <div className="min-h-screen p-8">
          <AdminClassHeader />

          <div className="flex justify-center mb-2">
            <Button
              size="lg"
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg px-8 py-4 text-lg font-semibold rounded-2xl"
            >
              <Plus className="w-6 h-6 mr-3" />
              Create New Class
            </Button>
          </div>

          <AdminClassTable
            classes={classes}
            onEditClass={openEditDialog}
            onDeleteClass={handleDeleteClass}
          />

          <AdminClassDialog
            isOpen={isAddDialogOpen}
            onClose={() => setIsAddDialogOpen(false)}
            onSubmit={handleAddClass} // ✅ Add handler
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

          <AdminClassDialog
            isOpen={isEditDialogOpen}
            onClose={closeEditDialog} // ✅ Proper close handler
            onSubmit={handleEditClass} // ✅ Separate edit handler
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
      </ModernDashboardLayout>
    </AuthGuard>
  );
};

export default AdminAssignClass;