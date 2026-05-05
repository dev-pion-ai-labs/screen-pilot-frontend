import { School } from "lucide-react";

interface AdminClassHeaderProps {
  title?: string;
  description?: string;
}

export const AdminClassHeader = ({ 
  title = "Class Management", 
  description = "Create and manage classes by assigning teachers and students with our intuitive interface" 
}: AdminClassHeaderProps) => {
  return (
    <div className="flex items-center gap-4">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-md shrink-0">
        <School className="w-6 h-6 text-white" />
      </div>
      <div className="flex items-baseline gap-3 min-w-0">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent shrink-0">
          {title}
        </h1>
        <p className="text-sm text-gray-600 truncate">
          {description}
        </p>
      </div>
    </div>
  );
};