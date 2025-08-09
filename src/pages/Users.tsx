
import Header from "@/components/layout/Header";
import UsersManagement from "@/components/users/UsersManagement";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function Users() {
  const { hasPermission } = useAuth();
  
  // Only admins can access this page
  if (!hasPermission('admin')) {
    return <Navigate to="/" />;
  }
  
  return (
    <div className="flex h-full flex-col">
      <Header title="Upravljanje korisnicima" />
      <div className="page-container">
        <UsersManagement />
      </div>
    </div>
  );
}
