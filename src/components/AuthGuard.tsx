
import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
}

export const AuthGuard = ({ children, allowedRoles, requireAuth = true }: AuthGuardProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        navigate('/login', { state: { from: location } });
        return;
      }

      if (user && profile && allowedRoles && !allowedRoles.includes(profile.role)) {
        navigate('/unauthorized');
        return;
      }

      // Redirect authenticated users to their dashboard from login/signup pages
      if (user && profile && (location.pathname === '/login' || location.pathname === '/signup')) {
        const dashboardPath = `/${profile.role}/dashboard`;
        navigate(dashboardPath);
        return;
      }
    }
  }, [user, profile, loading, navigate, location, allowedRoles, requireAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return null;
  }

  return <>{children}</>;
};
