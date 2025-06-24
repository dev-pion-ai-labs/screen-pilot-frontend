import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, Users, School } from "lucide-react";

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

interface AdminClassTableProps {
  classes: Class[];
  onEditClass: (classItem: Class) => void;
  onDeleteClass: (classId: string) => void;
}

export const AdminClassTable = ({ 
  classes, 
  onEditClass, 
  onDeleteClass 
}: AdminClassTableProps) => {
  return (
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
                        onClick={() => onEditClass(classItem)}
                        className="hover:bg-indigo-50 border-indigo-200 text-indigo-700 rounded-xl px-4 py-2"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeleteClass(classItem.id)}
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
  );
};