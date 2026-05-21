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
import {
  type Program,
  type Specialization,
  SPECIALIZATION_MIN_SEMESTER,
} from "@/data/syllabus";

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  semester?: number | null;
  program?: Program | null;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
  semester?: number;
  program?: Program | null;
}

interface Class {
  id: string;
  name: string;
  semester: number;
  program: Program | null;
  specialization: Specialization | null;
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
  const [selectedProgram, setSelectedProgram] = useState<Program>("BA");
  const [selectedSpecialization, setSelectedSpecialization] =
    useState<Specialization | null>(null);
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
      .select("id, full_name, email, semester, program")
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

    setTeachers((data || []) as Teacher[]);
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, semester, program")
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

    setStudents((data || []) as Student[]);
  };

  const fetchClasses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("classes")
      .select(`
        id,
        name,
        semester,
        program,
        specialization,
        created_at,
        class_teachers (
          teacher_id,
          profiles (id, full_name, email, program)
        ),
        class_students (
          student_id,
          profiles (id, full_name, email, semester, program)
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

    const formatted: Class[] = (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      semester: c.semester,
      program: c.program ?? null,
      specialization: c.specialization ?? null,
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

    if (selectedTeachers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one teacher",
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

    if (
      selectedSemester >= SPECIALIZATION_MIN_SEMESTER &&
      !selectedSpecialization
    ) {
      toast({
        title: "Error",
        description: "Please pick a specialisation for Sem 3+ classes",
        variant: "destructive",
      });
      return;
    }

    // For Sem 1-2 we always store null, even if a stale value lingers in state.
    const specializationToSave =
      selectedSemester >= SPECIALIZATION_MIN_SEMESTER
        ? selectedSpecialization
        : null;

    try {
      // 1. Create class in DB
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .insert([
          {
            name: newClassName,
            semester: selectedSemester,
            program: selectedProgram,
            specialization: specializationToSave,
          },
        ])
        .select()
        .single();

      if (classError) throw classError;

      const classId = classData.id;

      // 2. Insert class teachers
      for (const teacher of selectedTeachers) {
        const { error: teacherError } = await supabase
          .from("class_teachers")
          .insert({
            class_id: classId,
            teacher_id: teacher.id,
          });
        
        if (teacherError) throw teacherError;
      }

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
        program: selectedProgram,
        specialization: specializationToSave,
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

    if (selectedTeachers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one teacher",
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

    if (
      selectedSemester >= SPECIALIZATION_MIN_SEMESTER &&
      !selectedSpecialization
    ) {
      toast({
        title: "Error",
        description: "Please pick a specialisation for Sem 3+ classes",
        variant: "destructive",
      });
      return;
    }

    const specializationToSave =
      selectedSemester >= SPECIALIZATION_MIN_SEMESTER
        ? selectedSpecialization
        : null;

    try {
      // 1. Update class details
      const { error: classError } = await supabase
        .from("classes")
        .update({
          name: newClassName,
          semester: selectedSemester,
          program: selectedProgram,
          specialization: specializationToSave,
        })
        .eq("id", editingClass.id);

      if (classError) throw classError;

      // 2. Diff teacher membership and only touch the rows that changed.
      //    This preserves any FK references that point at class_teachers
      //    rows (e.g. notes, quizzes scoped per teacher_in_class).
      const existingTeacherIds = new Set(editingClass.teachers.map((t) => t.id));
      const selectedTeacherIds = new Set(selectedTeachers.map((t) => t.id));
      const teachersToAdd = selectedTeachers.filter((t) => !existingTeacherIds.has(t.id));
      const teachersToRemove = editingClass.teachers.filter((t) => !selectedTeacherIds.has(t.id));

      if (teachersToRemove.length > 0) {
        const { error: removeTeacherError } = await supabase
          .from("class_teachers")
          .delete()
          .eq("class_id", editingClass.id)
          .in("teacher_id", teachersToRemove.map((t) => t.id));
        if (removeTeacherError) throw removeTeacherError;
      }

      if (teachersToAdd.length > 0) {
        const { error: addTeacherError } = await supabase
          .from("class_teachers")
          .insert(
            teachersToAdd.map((teacher) => ({
              class_id: editingClass.id,
              teacher_id: teacher.id,
            }))
          );
        if (addTeacherError) throw addTeacherError;
      }

      // 3. Diff student membership the same way so we don't drop any rows
      //    that downstream tables (submissions, quiz_submissions, etc.)
      //    reference by class_students.id.
      const existingStudentIds = new Set(editingClass.students.map((s) => s.id));
      const selectedStudentIds = new Set(selectedStudents.map((s) => s.id));
      const studentsToAdd = selectedStudents.filter((s) => !existingStudentIds.has(s.id));
      const studentsToRemove = editingClass.students.filter((s) => !selectedStudentIds.has(s.id));

      if (studentsToRemove.length > 0) {
        const { error: removeStudentError } = await supabase
          .from("class_students")
          .delete()
          .eq("class_id", editingClass.id)
          .in("student_id", studentsToRemove.map((s) => s.id));
        if (removeStudentError) throw removeStudentError;
      }

      if (studentsToAdd.length > 0) {
        const { error: addStudentError } = await supabase
          .from("class_students")
          .insert(
            studentsToAdd.map((student) => ({
              class_id: editingClass.id,
              student_id: student.id,
            }))
          );
        if (addStudentError) throw addStudentError;
      }

      // 4. Refresh from DB so local state matches what the server holds
      //    (avoids the "looks updated but isn't" pitfall after a partial
      //    failure on retry).
      await fetchClasses();

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
    setSelectedProgram("BA");
    setSelectedSpecialization(null);
    setSelectedTeachers([]);
    setSelectedStudents([]);
  };

  const openEditDialog = (classItem: Class) => {
    setEditingClass(classItem);
    setNewClassName(classItem.name);
    setSelectedSemester(classItem.semester);
    setSelectedProgram(classItem.program ?? "BA");
    setSelectedSpecialization(classItem.specialization);
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
        <div className="min-h-screen p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <AdminClassHeader />
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md rounded-xl shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
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
            selectedProgram={selectedProgram}
            setSelectedProgram={setSelectedProgram}
            selectedSpecialization={selectedSpecialization}
            setSelectedSpecialization={setSelectedSpecialization}
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
            selectedProgram={selectedProgram}
            setSelectedProgram={setSelectedProgram}
            selectedSpecialization={selectedSpecialization}
            setSelectedSpecialization={setSelectedSpecialization}
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