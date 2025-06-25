"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  BookOpen,
  Users,
  UserPlus,
  UserMinus,
  Search,
  User,
  Mail,
  Hash,
  Plus,
} from "lucide-react";

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

interface TeacherClassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: Class | null;
  allStudents: Student[];
  onAddStudent: (student: Student) => void;
  onRemoveStudent: (studentId: string) => void;
}

export const TeacherClassDialog = ({
  isOpen,
  onClose,
  selectedClass,
  allStudents,
  onAddStudent,
  onRemoveStudent,
}: TeacherClassDialogProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Reset search term when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

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

    onAddStudent(student);
    toast({
      title: "Student Added",
      description: `${student.full_name} has been added to ${selectedClass.name}.`,
    });
  };

  const handleRemoveStudent = (studentId: string) => {
    if (!selectedClass) return;

    const student = selectedClass.students.find(s => s.id === studentId);
    if (!student) return;

    onRemoveStudent(studentId);
    toast({
      title: "Student Removed",
      description: `${student.full_name} has been removed from ${selectedClass.name}.`,
    });
  };

  const filteredStudents = allStudents.filter(student => 
    (student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     student.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
    !selectedClass?.students.some(s => s.id === student.id)
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
              {filteredStudents.length === 0 ? (
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