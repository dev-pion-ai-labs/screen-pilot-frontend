
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BookOpen, Users, MessageSquare, FileText } from 'lucide-react';

const Index = () => {
  const { user, profile } = useAuth();

  // Redirect authenticated users to their dashboard
  if (user && profile) {
    window.location.href = `/${profile.role}/dashboard`;
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <BookOpen className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-5xl font-bold text-gray-900">Screen Pilot</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A comprehensive educational platform for script analysis, AI-powered mentoring, 
            and collaborative learning between students and teachers.
          </p>
          <div className="mt-8 space-x-4">
            <Link to="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <CardTitle>Role-Based Access</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Tailored experiences for students, teachers, and administrators
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <CardTitle>Assignment Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create, submit, and grade assignments with ease
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <MessageSquare className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <CardTitle>AI Mentor</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get personalized feedback and guidance from AI
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BookOpen className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <CardTitle>Script Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload and analyze scripts with intelligent feedback
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Learning Experience?
          </h2>
          <p className="text-gray-600 mb-6">
            Join thousands of students and teachers already using Screen Pilot
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Create Your Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
