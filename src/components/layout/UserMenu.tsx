
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon, Settings, FileText, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function UserMenu() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'doctor': return 'Doktor';
      case 'nurse': return 'Tehničar';
      case 'technician': return 'Tehničar';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive' as const;
      case 'doctor': return 'default' as const;
      case 'nurse': return 'secondary' as const;
      case 'technician': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-12 w-12 rounded-full p-0">
          <Avatar className="h-11 w-11 border-2 border-clinic-500 hover:border-clinic-600 transition-all cursor-pointer">
            <AvatarFallback className="bg-clinic-100 text-clinic-700 font-medium text-lg">
              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <Badge variant={getRoleBadgeVariant(user.role)} className="mt-2 w-fit">
              {getRoleLabel(user.role)}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {hasPermission('admin') && (
          <>
            <DropdownMenuItem onClick={() => navigate("/users")}>
              <ClipboardList className="mr-2 h-5 w-5" />
              <span>Korisnici</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/audit-logs")}>
              <FileText className="mr-2 h-5 w-5" />
              <span>Evidencija aktivnosti</span>
            </DropdownMenuItem>
          </>
        )}

        {hasPermission('admin') && (
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <Settings className="mr-2 h-5 w-5" />
            <span>Podešavanja</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive hover:text-destructive">
          <LogOut className="mr-2 h-5 w-5" />
          <span>Odjava</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
