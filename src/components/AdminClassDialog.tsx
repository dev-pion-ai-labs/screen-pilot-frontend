import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  UserPlus,
  GraduationCap,
  Search,
} from "lucide-react";

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


interface AdminClassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  mode: "add" | "edit";
  className: string;
  setClassName: (name: string) => void;
  selectedSemester: number;
  setSelectedSemester: (semester: number) => void;
  selectedTeachers: Teacher[];
  setSelectedTeachers: (teachers: Teacher[]) => void;
  selectedStudents: Student[];
  setSelectedStudents: (students: Student[]) => void;
  teachers: Teacher[];
  students: Student[];
  onResetForm: () => void;
}

interface TeacherSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: Teacher[];
  selectedTeachers: string[];
  onSelectionChange: (teacherIds: string[]) => void;
  onConfirm: () => void;
}

interface StudentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  selectedStudents: string[];
  onSelectionChange: (studentIds: string[]) => void;
  onConfirm: () => void;
}

export const TeacherSelectionModal = ({
  isOpen,
  onClose,
  teachers,
  selectedTeachers,
  onSelectionChange,
  onConfirm,
}: TeacherSelectionModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectionChange = (teacherId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedTeachers, teacherId]);
    } else {
      onSelectionChange(selectedTeachers.filter((id) => id !== teacherId));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
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
                variant="outline"
                onClick={() => {
                  const allTeacherIds = filteredTeachers.map(t => t.id);
                  const allSelected = allTeacherIds.every(id => selectedTeachers.includes(id));
                  if (allSelected) {
                    onSelectionChange([]);
                  } else {
                    onSelectionChange(allTeacherIds);
                  }
                }}
                className="px-4 py-2 text-sm rounded-lg"
              >
                {filteredTeachers.length > 0 && filteredTeachers.every(t => selectedTeachers.includes(t.id)) ? "Deselect All" : "Select All"}
              </Button>
              <Button
                onClick={onConfirm}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 px-4 py-2 text-sm rounded-lg"
              >
                Select Teachers ({selectedTeachers.length})
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  setSearchTerm("");
                }}
                className="px-4 py-2 text-sm rounded-lg"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search teachers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 text-sm rounded-lg border-2 border-gray-200 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {filteredTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 transition-all duration-200"
              >
                <Checkbox
                  id={teacher.id}
                  checked={selectedTeachers.includes(teacher.id)}
                  onCheckedChange={(checked) =>
                    handleSelectionChange(teacher.id, checked as boolean)
                  }
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
  );
};

export const StudentSelectionModal = ({
  isOpen,
  onClose,
  students,
  selectedStudents,
  onSelectionChange,
  onConfirm,
}: StudentSelectionModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSemester =
      selectedSemester === "all" ||
      student.semester?.toString() === selectedSemester;

    return matchesSearch && matchesSemester;
  });

  const handleSelectionChange = (studentId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedStudents, studentId]);
    } else {
      onSelectionChange(selectedStudents.filter((id) => id !== studentId));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
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
                variant="outline"
                onClick={() => {
                  const allStudentIds = filteredStudents.map(s => s.id);
                  const allSelected = allStudentIds.every(id => selectedStudents.includes(id));
                  if (allSelected) {
                    onSelectionChange([]);
                  } else {
                    onSelectionChange(allStudentIds);
                  }
                }}
                className="px-4 py-2 text-sm rounded-lg"
              >
                {filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.includes(s.id)) ? "Deselect All" : "Select All"}
              </Button>
              <Button
                onClick={onConfirm}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-4 py-2 text-sm rounded-lg"
              >
                Select Students ({selectedStudents.length})
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  setSearchTerm("");
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-purple-200 hover:bg-purple-50 transition-all duration-200"
              >
                <Checkbox
                  id={student.id}
                  checked={selectedStudents.includes(student.id)}
                  onCheckedChange={(checked) =>
                    handleSelectionChange(student.id, checked as boolean)
                  }
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
  );
};

export const AdminClassDialog = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  className,
  setClassName,
  selectedSemester,
  setSelectedSemester,
  selectedTeachers,
  setSelectedTeachers,
  selectedStudents,
  setSelectedStudents,
  teachers,
  students,
  onResetForm,
}: AdminClassDialogProps) => {
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [tempSelectedTeachers, setTempSelectedTeachers] = useState<string[]>([]);
  const [tempSelectedStudents, setTempSelectedStudents] = useState<string[]>([]);

  const openTeacherModal = () => {
    setTempSelectedTeachers(selectedTeachers.map((t) => t.id));
    setIsTeacherModalOpen(true);
  };

  const openStudentModal = () => {
    setTempSelectedStudents(selectedStudents.map((s) => s.id));
    setIsStudentModalOpen(true);
  };

  const handleTeacherSelection = () => {
    const selected = teachers.filter((t) =>
      tempSelectedTeachers.includes(t.id)
    );
    setSelectedTeachers(selected);
    setIsTeacherModalOpen(false);
    setTempSelectedTeachers([]);
  };

  const handleStudentSelection = () => {
    const selected = students.filter((s) =>
      tempSelectedStudents.includes(s.id)
    );
    setSelectedStudents(selected);
    setIsStudentModalOpen(false);
    setTempSelectedStudents([]);
  };

  const handleClose = () => {
    onClose();
    onResetForm();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl border-0 shadow-2xl">
          <DialogHeader className="pb-6 border-b border-gray-100">
            <DialogTitle className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                {mode === "add" ? (
                  <Plus className="w-5 h-5 text-white" />
                ) : (
                  <Edit className="w-5 h-5 text-white" />
                )}
              </div>
              {mode === "add" ? "Create New Class" : "Edit Class"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-8 pt-6">
            <div className="space-y-3">
              <Label
                htmlFor="className"
                className="text-lg font-semibold text-gray-700"
              >
                Class Name
              </Label>
              <Input
                id="className"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Enter class name.."
                className="h-14 text-lg rounded-xl border-2 border-gray-200 focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label className="text-lg font-semibold text-gray-700">
                  Teacher
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
                      Clear
                    </Button>
                  )}
                </div>

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

              <div className="space-y-4">
                <Label className="text-lg font-semibold text-gray-700">
                  Semester
                </Label>
                <Select
                  value={selectedSemester.toString()}
                  onValueChange={(value) => setSelectedSemester(parseInt(value))}
                >
                  <SelectTrigger className="h-14 text-lg rounded-xl border-2 border-gray-200 focus:border-purple-500">
                    <SelectValue placeholder="Select Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Semester 1</SelectItem>
                    <SelectItem value="2">Semester 2</SelectItem>
                    <SelectItem value="3">Semester 3</SelectItem>
                    <SelectItem value="4">Semester 4</SelectItem>
                    <SelectItem value="5">Semester 5</SelectItem>
                    <SelectItem value="6">Semester 6</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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
                    Clear
                  </Button>
                )}
              </div>

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

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={handleClose}
                className="px-8 py-3 text-lg rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={onSubmit}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8 py-3 text-lg rounded-xl"
              >
                {mode === "add" ? "Create Class" : "Update Class"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TeacherSelectionModal
        isOpen={isTeacherModalOpen}
        onClose={() => {
          setIsTeacherModalOpen(false);
          setTempSelectedTeachers([]);
        }}
        teachers={teachers}
        selectedTeachers={tempSelectedTeachers}
        onSelectionChange={setTempSelectedTeachers}
        onConfirm={handleTeacherSelection}
      />

      <StudentSelectionModal
        isOpen={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setTempSelectedStudents([]);
        }}
        students={students}
        selectedStudents={tempSelectedStudents}
        onSelectionChange={setTempSelectedStudents}
        onConfirm={handleStudentSelection}
      />
    </>
  );
};