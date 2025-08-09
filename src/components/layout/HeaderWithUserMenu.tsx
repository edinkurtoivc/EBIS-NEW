
import { useAuth } from "@/contexts/AuthContext";
import UserMenu from "@/components/layout/UserMenu";

type HeaderWithUserMenuProps = {
  title: string;
};

export function HeaderWithUserMenu({ title }: HeaderWithUserMenuProps) {
  const { user } = useAuth();
  
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b">
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/44afc1d2-0672-4a2d-acdd-3d4de4007dbb.png" 
          alt="EIBS Logo" 
          className="h-16 w-16 hidden md:block" 
        />
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
      {user && (
        <div className="flex items-center">
          <UserMenu />
        </div>
      )}
    </div>
  );
}

export default HeaderWithUserMenu;
