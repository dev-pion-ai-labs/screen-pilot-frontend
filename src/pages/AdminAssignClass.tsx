"use client";

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  School,
  Search,
  UserPlus,
  GraduationCap,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  // Form states
  const [newClassName, setNewClassName] = useState("");
  const [selectedTeachers, setSelectedTeachers] = useState<Teacher[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [tempSelectedTeachers, setTempSelectedTeachers] = useState<string[]>(
    []
  );
  const [tempSelectedStudents, setTempSelectedStudents] = useState<string[]>(
    []
  );

  // Search and filter states
  const [teacherSearch, setTeacherSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");

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

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.full_name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      teacher.email.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.email.toLowerCase().includes(studentSearch.toLowerCase());

    const matchesSemester =
      selectedSemester === "all" ||
      student.semester?.toString() === selectedSemester;

    return matchesSearch && matchesSemester;
  });

  const handleAddClass = () => {
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

    const newClass: Class = {
      id: Date.now().toString(),
      name: newClassName,
      teachers: selectedTeachers,
      students: selectedStudents,
      createdAt: new Date().toISOString(),
    };

    setClasses([...classes, newClass]);

    // Complete reset of all states
    resetForm();
    setIsAddDialogOpen(false);
    setIsTeacherModalOpen(false);
    setIsStudentModalOpen(false);

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
      teachers: selectedTeachers,
      students: selectedStudents,
    };

    setClasses(
      classes.map((c) => (c.id === editingClass.id ? updatedClass : c))
    );

    // Complete reset of all states
    resetForm();
    setEditingClass(null);
    setIsEditDialogOpen(false);
    setIsTeacherModalOpen(false);
    setIsStudentModalOpen(false);

    toast({
      title: "Success",
      description: "Class updated successfully",
    });
  };

  const resetForm = () => {
    setNewClassName("");
    setSelectedTeachers([]);
    setSelectedStudents([]);
    setTempSelectedTeachers([]);
    setTempSelectedStudents([]);
    setTeacherSearch("");
    setStudentSearch("");
    setSelectedSemester("all");
  };

  const openEditDialog = (classItem: Class) => {
    setEditingClass(classItem);
    setNewClassName(classItem.name);
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

  const handleTeacherSelection = () => {
    const selected = teachers.filter((t) =>
      tempSelectedTeachers.includes(t.id)
    );
    setSelectedTeachers(selected);
    setIsTeacherModalOpen(false);
    setTempSelectedTeachers([]);
    setTeacherSearch("");
  };

  const handleStudentSelection = () => {
    const selected = students.filter((s) =>
      tempSelectedStudents.includes(s.id)
    );
    setSelectedStudents(selected);
    setIsStudentModalOpen(false);
    setTempSelectedStudents([]);
    setStudentSearch("");
    setSelectedSemester("all");
  };

  const openTeacherModal = () => {
    setTempSelectedTeachers(selectedTeachers.map((t) => t.id));
    setIsTeacherModalOpen(true);
  };

  const openStudentModal = () => {
    setTempSelectedStudents(selectedStudents.map((s) => s.id));
    setIsStudentModalOpen(true);
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
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl mb-6 shadow-2xl">
                <School className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
                Class Management
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Create and manage classes by assigning teachers and students
                with our intuitive interface
              </p>
            </div>

            {/* Add Class Button */}
            <div className="flex justify-center">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 px-8 py-4 text-lg font-semibold rounded-2xl"
                  >
                    <Plus className="w-6 h-6 mr-3" />
                    Create New Class
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl border-0 shadow-2xl">
                  <DialogHeader className="pb-6 border-b border-gray-100">
                    <DialogTitle className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                        <Plus className="w-5 h-5 text-white" />
                      </div>
                      Create New Class
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-8 pt-6">
                    {/* Class Name */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="className"
                        className="text-lg font-semibold text-gray-700"
                      >
                        Class Name
                      </Label>
                      <Input
                        id="className"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        placeholder="Enter class name (e.g., Computer Science 101)"
                        className="h-14 text-lg rounded-xl border-2 border-gray-200 focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    {/* Select Teachers */}
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold text-gray-700">
                        Teachers
                      </Label>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={openTeacherModal}
                          className="flex-1 h-14 text-lg rounded-xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200"
                        >
                          <UserPlus className="w-5 h-5 mr-3" />
                          Select Teachers
                        </Button>
                        {selectedTeachers.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSelectedTeachers([])}
                            className="h-14 px-6 text-lg rounded-xl border-2 border-red-300 hover:border-red-500 hover:bg-red-50 text-red-600 hover:text-red-700 transition-all duration-200"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>

                      {/* Selected Teachers */}
                      {selectedTeachers.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-gray-600">
                            Selected Teachers:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedTeachers.map((teacher) => (
                              <Badge
                                key={teacher.id}
                                className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 px-4 py-2 text-sm font-medium rounded-full"
                              >
                                {teacher.full_name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Select Students */}
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold text-gray-700">
                        Students
                      </Label>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={openStudentModal}
                          className="flex-1 h-14 text-lg rounded-xl border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200"
                        >
                          <GraduationCap className="w-5 h-5 mr-3" />
                          Select Students
                        </Button>
                        {selectedStudents.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSelectedStudents([])}
                            className="h-14 px-6 text-lg rounded-xl border-2 border-red-300 hover:border-red-500 hover:bg-red-50 text-red-600 hover:text-red-700 transition-all duration-200"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>

                      {/* Selected Students */}
                      {selectedStudents.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-gray-600">
                            Selected Students:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedStudents.map((student) => (
                              <Badge
                                key={student.id}
                                className="bg-purple-100 text-purple-800 hover:bg-purple-200 px-4 py-2 text-sm font-medium rounded-full"
                              >
                                {student.full_name} (Sem {student.semester})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAddDialogOpen(false);
                          resetForm();
                        }}
                        className="px-8 py-3 text-lg rounded-xl"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddClass}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8 py-3 text-lg rounded-xl"
                      >
                        Create Class
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Teacher Selection Modal */}
            <Dialog open={isTeacherModalOpen} onOpenChange={() => {}}>
              <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl border-0 shadow-2xl" hideCloseButton>
                <DialogHeader className="pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <UserPlus className="w-3 h-3 text-white" />
                      </div>
                      Select Teachers
                    </DialogTitle>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleTeacherSelection}
                        className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 px-4 py-2 text-sm rounded-lg"
                      >
                        Select Teachers ({tempSelectedTeachers.length})
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsTeacherModalOpen(false);
                          setTempSelectedTeachers([]);
                          setTeacherSearch("");
                        }}
                        className="px-4 py-2 text-sm rounded-lg"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search teachers by name or email..."
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      className="pl-10 h-10 text-sm rounded-lg border-2 border-gray-200 focus:border-indigo-500"
                    />
                  </div>

                  {/* Teachers List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {filteredTeachers.map((teacher) => (
                      <div
                        key={teacher.id}
                        className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 transition-all duration-200"
                      >
                        <Checkbox
                          id={teacher.id}
                          checked={tempSelectedTeachers.includes(teacher.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setTempSelectedTeachers([
                                ...tempSelectedTeachers,
                                teacher.id,
                              ]);
                            } else {
                              setTempSelectedTeachers(
                                tempSelectedTeachers.filter(
                                  (id) => id !== teacher.id
                                )
                              );
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {teacher.full_name}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {teacher.email}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Student Selection Modal */}
            <Dialog open={isStudentModalOpen} onOpenChange={() => {}}>
              <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl border-0 shadow-2xl" hideCloseButton>
                <DialogHeader className="pb-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <GraduationCap className="w-3 h-3 text-white" />
                      </div>
                      Select Students
                    </DialogTitle>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleStudentSelection}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-4 py-2 text-sm rounded-lg"
                      >
                        Select Students ({tempSelectedStudents.length})
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsStudentModalOpen(false);
                          setTempSelectedStudents([]);
                          setStudentSearch("");
                          setSelectedSemester("all");
                        }}
                        className="px-4 py-2 text-sm rounded-lg"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                  {/* Search and Semester Filter */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search students..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="pl-10 h-10 text-sm rounded-lg border-2 border-gray-200 focus:border-purple-500"
                      />
                    </div>
                    <Select
                      value={selectedSemester}
                      onValueChange={setSelectedSemester}
                    >
                      <SelectTrigger className="h-10 text-sm rounded-lg border-2 border-gray-200 focus:border-purple-500">
                        <SelectValue placeholder="Select Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Semesters</SelectItem>
                        <SelectItem value="1">Semester 1</SelectItem>
                        <SelectItem value="2">Semester 2</SelectItem>
                        <SelectItem value="3">Semester 3</SelectItem>
                        <SelectItem value="4">Semester 4</SelectItem>
                        <SelectItem value="5">Semester 5</SelectItem>
                        <SelectItem value="6">Semester 6</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Students List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-purple-200 hover:bg-purple-50 transition-all duration-200"
                      >
                        <Checkbox
                          id={student.id}
                          checked={tempSelectedStudents.includes(student.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setTempSelectedStudents([
                                ...tempSelectedStudents,
                                student.id,
                              ]);
                            } else {
                              setTempSelectedStudents(
                                tempSelectedStudents.filter(
                                  (id) => id !== student.id
                                )
                              );
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {student.full_name}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {student.email}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-medium">
                              Sem {student.semester || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Classes Table */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
                <CardTitle className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <School className="w-8 h-8 text-indigo-600" />
                  Existing Classes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-50 hover:to-gray-100 border-0">
                        <TableHead className="font-bold text-gray-700 text-lg py-6 px-8">
                          Class Name
                        </TableHead>
                        <TableHead className="font-bold text-gray-700 text-lg py-6 px-8">
                          Teachers
                        </TableHead>
                        <TableHead className="font-bold text-gray-700 text-lg py-6 px-8">
                          Students
                        </TableHead>
                        <TableHead className="font-bold text-gray-700 text-lg py-6 px-8">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classes.map((classItem, index) => (
                        <TableRow
                          key={classItem.id}
                          className={`hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 border-0 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                          }`}
                        >
                          <TableCell className="font-semibold text-gray-900 text-lg py-6 px-8">
                            {classItem.name}
                          </TableCell>
                          <TableCell className="py-6 px-8">
                            <div className="flex flex-wrap gap-2">
                              {classItem.teachers.map((teacher) => (
                                <Badge
                                  key={teacher.id}
                                  className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 px-3 py-1 text-sm font-medium rounded-full"
                                >
                                  {teacher.full_name}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="py-6 px-8">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-2 rounded-full">
                                <Users className="w-4 h-4" />
                                <span className="font-semibold">
                                  {classItem.students.length}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-6 px-8">
                            <div className="flex gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(classItem)}
                                className="hover:bg-indigo-50 border-indigo-200 text-indigo-700 rounded-xl px-4 py-2"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteClass(classItem.id)}
                                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 border-0 rounded-xl px-4 py-2"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Edit Dialog - Similar structure to Add Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl border-0 shadow-2xl">
                <DialogHeader className="pb-6 border-b border-gray-100">
                  <DialogTitle className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                      <Edit className="w-5 h-5 text-white" />
                    </div>
                    Edit Class
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-8 pt-6">
                  {/* Class Name */}
                  <div className="space-y-3">
                    <Label
                      htmlFor="editClassName"
                      className="text-lg font-semibold text-gray-700"
                    >
                      Class Name
                    </Label>
                    <Input
                      id="editClassName"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="Enter class name"
                      className="h-14 text-lg rounded-xl border-2 border-gray-200 focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  {/* Select Teachers */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold text-gray-700">
                      Teachers
                    </Label>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={openTeacherModal}
                        className="flex-1 h-14 text-lg rounded-xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200"
                      >
                        <UserPlus className="w-5 h-5 mr-3" />
                        Select Teachers
                      </Button>
                      {selectedTeachers.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSelectedTeachers([])}
                          className="h-14 px-6 text-lg rounded-xl border-2 border-red-300 hover:border-red-500 hover:bg-red-50 text-red-600 hover:text-red-700 transition-all duration-200"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>

                    {/* Selected Teachers */}
                    {selectedTeachers.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-600">
                          Selected Teachers:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedTeachers.map((teacher) => (
                            <Badge
                              key={teacher.id}
                              className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 px-4 py-2 text-sm font-medium rounded-full"
                            >
                              {teacher.full_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Select Students */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold text-gray-700">
                      Students
                    </Label>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={openStudentModal}
                        className="flex-1 h-14 text-lg rounded-xl border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200"
                      >
                        <GraduationCap className="w-5 h-5 mr-3" />
                        Select Students
                      </Button>
                      {selectedStudents.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSelectedStudents([])}
                          className="h-14 px-6 text-lg rounded-xl border-2 border-red-300 hover:border-red-500 hover:bg-red-50 text-red-600 hover:text-red-700 transition-all duration-200"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>

                    {/* Selected Students */}
                    {selectedStudents.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-600">
                          Selected Students:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedStudents.map((student) => (
                            <Badge
                              key={student.id}
                              className="bg-purple-100 text-purple-800 hover:bg-purple-200 px-4 py-2 text-sm font-medium rounded-full"
                            >
                              {student.full_name} (Sem {student.semester})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditDialogOpen(false);
                        resetForm();
                        setEditingClass(null);
                      }}
                      className="px-8 py-3 text-lg rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleEditClass}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8 py-3 text-lg rounded-xl"
                    >
                      Update Class
                    </Button>
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

export default AdminAssignClass;
