
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";
import Sidebar from "@/components/layout/Sidebar";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Patients from "./pages/Patients";
import Appointments from "./pages/Appointments";
import MedicalReports from "./pages/MedicalReports";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Statistics from "./pages/Statistics";
import NotFound from "./pages/NotFound";
import AuditLogViewer from "./components/settings/AuditLogViewer";
import { UserRole } from "./types/user";

const queryClient = new QueryClient();

// Protected Route component with role-based access
const ProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode;
  allowedRoles?: UserRole | UserRole[];
}) => {
  const { hasPermission, isAuthenticated, isLoadingAuth, bypassAuth } = useAuth();
  
  // Show loading state while checking authentication
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // If not authenticated and not bypassing auth, redirect to login
  if (!isAuthenticated && !bypassAuth) {
    return <Navigate to="/login" replace />;
  }
  
  // Check permissions if roles are specified
  if (allowedRoles && !hasPermission(allowedRoles)) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-auto">
        {children}
      </main>
    </div>
  );
};

// Routes that use AuthContext
const AppRoutes = () => {
  const { isAuthenticated, bypassAuth } = useAuth();

  // Redirect from login to home only if authenticated and not on login page
  if (isAuthenticated && window.location.pathname === "/login") {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/patients" element={
        <ProtectedRoute allowedRoles={["admin", "doctor", "nurse"]}>
          <Patients />
        </ProtectedRoute>
      } />
      <Route path="/appointments" element={
        <ProtectedRoute allowedRoles={["admin", "doctor", "nurse"]}>
          <Appointments />
        </ProtectedRoute>
      } />
      <Route path="/medical-reports" element={
        <ProtectedRoute allowedRoles={["admin", "doctor"]}>
          <MedicalReports />
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute allowedRoles="admin">
          <Users />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute allowedRoles="admin">
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/statistics" element={
        <ProtectedRoute allowedRoles={["admin", "doctor"]}>
          <Statistics />
        </ProtectedRoute>
      } />
      <Route path="/audit-logs" element={
        <ProtectedRoute allowedRoles="admin">
          <AuditLogViewer />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// Main App component with correct provider nesting order
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <AuthProvider>
            <AppRoutes />
            <Toaster />
            <Sonner />
          </AuthProvider>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
