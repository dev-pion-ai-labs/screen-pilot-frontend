
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
    if (loading) return; // Don't do anything while loading
    
    console.log('AuthGuard state:', { user: !!user, profile, loading, requireAuth, location: location.pathname });

    if (requireAuth && !user) {
      // User needs to be authenticated but isn't
      if (location.pathname !== '/login' && location.pathname !== '/signup') {
        navigate('/login', { state: { from: location }, replace: true });
      }
      return;
    }

    if (!requireAuth && user && profile) {
      // User is authenticated but on a public page (login/signup)
      if (location.pathname === '/login' || location.pathname === '/signup') {
        const dashboardPath = `/${profile.role}/dashboard`;
        navigate(dashboardPath, { replace: true });
      }
      return;
    }

    if (user && profile && allowedRoles && !allowedRoles.includes(profile.role)) {
      // User doesn't have the required role
      navigate('/unauthorized', { replace: true });
      return;
    }
  }, [user, profile, loading, navigate, location, allowedRoles, requireAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // For public pages (login/signup), show content if user is not authenticated
  if (!requireAuth) {
    if (user && profile) {
      // Will redirect in useEffect
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }
    return <>{children}</>;
  }

  // For protected pages, only show if user is authenticated
  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
};
