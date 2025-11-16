import { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from '@/lib/auth';
import { useAuthUser } from '@/hooks/useAuthUser';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MeetingDetail from './pages/MeetingDetail';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthUser();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;
    authService
      .syncFromBackend()
      .catch(() => {
        /* handled by authService */
      })
      .finally(() => {
        if (isMounted) {
          setChecking(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-muted-foreground">Checking your session…</div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meeting/:id"
            element={
              <ProtectedRoute>
                <MeetingDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
