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
    <div className="text-center space-y-4">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl mb-6 shadow-2xl">
        <School className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-6xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
        {title}
      </h1>
      <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
};