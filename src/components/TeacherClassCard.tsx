"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
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

interface TeacherClassCardProps {
  classItem: Class;
  onClick: (classItem: Class) => void;
}

export const TeacherClassCard = ({
  classItem,
  onClick,
}: TeacherClassCardProps) => {
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
            <span>{classItem.students.length} Students Enrolled</span>
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
