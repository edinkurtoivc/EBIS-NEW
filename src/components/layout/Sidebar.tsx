
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BarChart, Calendar, File, FileText, Settings, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/user";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, hasPermission } = useAuth();

  // Define navigation items with role-based access
  const navigationItems = [
    {
      name: "Početna",
      href: "/",
      icon: <File className="h-5 w-5" />,
      roles: ["admin", "doctor", "nurse", "technician"] as UserRole[] // Cast as UserRole[]
    },
    {
      name: "Pacijenti",
      href: "/patients",
      icon: <Users className="h-5 w-5" />,
      roles: ["admin", "doctor", "nurse"] as UserRole[] // Cast as UserRole[]
    },
    {
      name: "Termini",
      href: "/appointments",
      icon: <Calendar className="h-5 w-5" />,
      roles: ["admin", "doctor", "nurse", "technician"] as UserRole[] // Cast as UserRole[]
    },
    {
      name: "Nalazi",
      href: "/medical-reports",
      icon: <FileText className="h-5 w-5" />,
      roles: ["admin", "doctor"] as UserRole[] // Cast as UserRole[]
    },
    {
      name: "Statistika",
      href: "/statistics", 
      icon: <BarChart className="h-5 w-5" />,
      roles: ["admin", "doctor"] as UserRole[] // Cast as UserRole[]
    },
    {
      name: "Korisnici",
      href: "/users",
      icon: <Users className="h-5 w-5" />,
      roles: ["admin"] as UserRole[] // Cast as UserRole[]
    },
    {
      name: "Postavke",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
      roles: ["admin"] as UserRole[] // Cast as UserRole[]
    }
  ];

  // Filter navigation items based on user role
  const visibleNavigationItems = navigationItems.filter(item => {
    if (!user) return false;
    return hasPermission(item.roles);
  });
  
  return (
    <div className={cn("flex flex-col border-r bg-white transition-all duration-300", collapsed ? "w-16" : "w-64")}>
      <div className="flex h-16 items-center justify-center border-b px-4">
        {!collapsed ? (
          <img 
            src="/lovable-uploads/44afc1d2-0672-4a2d-acdd-3d4de4007dbb.png" 
            alt="EIBS Logo" 
            className="h-16 w-16" 
          />
        ) : (
          <img 
            src="/lovable-uploads/44afc1d2-0672-4a2d-acdd-3d4de4007dbb.png" 
            alt="EIBS Logo" 
            className="h-14 w-14" 
          />
        )}
      </div>
      
      <nav className="flex-1 space-y-1 px-2 py-4">
        {visibleNavigationItems.map(item => {
          const isActive = location.pathname === item.href;
          return (
            <Link 
              key={item.name} 
              to={item.href} 
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors", 
                isActive 
                  ? "bg-clinic-100 text-clinic-700" 
                  : "text-gray-700 hover:bg-clinic-50 hover:text-clinic-700"
              )}
            >
              <span className="mr-3">{item.icon}</span>
              {!collapsed && <span className="text-base text-slate-700 font-normal">{item.name}</span>}
            </Link>
          );
        })}
      </nav>
      
      <div className="border-t p-2">
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="w-full rounded-md p-2 text-sm text-gray-500 hover:bg-clinic-50 hover:text-clinic-700"
        >
          {collapsed ? ">>" : "<<"}
        </button>
      </div>
    </div>
  );
}
