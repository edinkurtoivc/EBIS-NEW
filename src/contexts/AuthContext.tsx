import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import * as bcrypt from 'bcryptjs';
import type { User, UserRole } from "@/types/user";
import dataStorageService from "@/services/DataStorageService";

// Define the auth context type
type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
  hasSpecificPermission: (permission: string) => boolean;
  isLoadingAuth: boolean;
  bypassAuth: boolean;
  toggleBypassAuth: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default test users with hashed passwords
const defaultUsers: User[] = [
  {
    id: "USR001",
    email: "dr.smith@klinika.com",
    firstName: "Adnan",
    lastName: "Hadžić",
    role: "doctor",
    specialization: "Kardiologija",
    phone: "+38761123456",
    password: "$2a$10$KvwR4nMOa6BIgFmIVneeguBYRNNFYxRh9kKqZN1Hl2wYRJJfXVA5q", // doctor123
    active: true,
  },
  {
    id: "USR002",
    email: "admin@klinika.com",
    firstName: "Amina",
    lastName: "Selimović",
    role: "admin",
    phone: "+38761654321",
    password: "$2a$10$BBJUo6ZUYlz3jm7xQgDD5.FR/GRPXFDJibF1.6P5r/OJlO76Durha", // admin123
    active: true,
  },
  {
    id: "USR003",
    email: "superadmin@klinika.com",
    firstName: "Super",
    lastName: "Admin",
    role: "admin",
    phone: "+38761111111",
    password: "$2a$10$T3ZGu7WGcEtNYm8F2ZsCoe2P5zLuQzUXvyEFsHwHOCRA8UwJl/YZC", // superadmin123
    active: true,
  },
  {
    id: "USR004",
    email: "dr.kovac@klinika.com",
    firstName: "Emina",
    lastName: "Kovač",
    role: "doctor",
    specialization: "Neurologija",
    phone: "+38761222222",
    password: "$2a$10$KvwR4nMOa6BIgFmIVneeguBYRNNFYxRh9kKqZN1Hl2wYRJJfXVA5q", // doctor123
    active: true,
  },
  {
    id: "USR005",
    email: "dr.begic@klinika.com",
    firstName: "Amir",
    lastName: "Begić",
    role: "doctor",
    specialization: "Ortopedija",
    phone: "+38761333333",
    password: "$2a$10$KvwR4nMOa6BIgFmIVneeguBYRNNFYxRh9kKqZN1Hl2wYRJJfXVA5q", // doctor123
    active: true,
  },
  {
    id: "USR006",
    email: "tehnicar@klinika.com",
    firstName: "Haris",
    lastName: "Mujić",
    role: "nurse",
    phone: "+38761444444",
    password: "$2a$10$YpM2Jf2TXt/9C6gkRJXfOOEq0Evs4xnbzFK1OmYc/2PLm4qXxdTLu", // nurse123
    active: true,
  },
  {
    id: "USR007", 
    email: "glavniadmin@klinika.com",
    firstName: "Glavni",
    lastName: "Administrator",
    role: "admin",
    phone: "+38761777777",
    password: "$2a$10$BBJUo6ZUYlz3jm7xQgDD5.FR/GRPXFDJibF1.6P5r/OJlO76Durha", // admin123
    active: true,
  }
];

// Function to log user activity
const logUserActivity = (user: User | null, action: string): void => {
  if (!user) return;
  
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const logEntry = `[${timestamp}] ${user.id} (${user.role}) ${action}`;
  
  console.log("[AuditLog]", logEntry);
  
  // In a real app, this would write to a file or database
  const existingLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
  existingLogs.push(logEntry);
  localStorage.setItem('auditLogs', JSON.stringify(existingLogs));
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [bypassAuth, setBypassAuth] = useState<boolean>(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize users and load current user from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoadingAuth(true);
      
      try {
        // Force disable bypass auth on initial load
        localStorage.setItem("bypassAuth", "false");
        setBypassAuth(false);
        
        // Check if users exist in dataStorageService or localStorage
        let users = await dataStorageService.getUsers();
        
        console.log("Users from dataStorage:", users ? users.length : 0);
        
        // If no users in dataStorage, check localStorage
        if (!users || users.length === 0) {
          const storedUsers = localStorage.getItem("users");
          users = storedUsers ? JSON.parse(storedUsers) : [];
          console.log("Users from localStorage:", users ? users.length : 0);
        }
        
        // If still no users, set default users
        if (!users || users.length === 0) {
          console.log("No users found, initializing default users");
          // Make sure passwords are properly hashed and not lost during serialization
          await dataStorageService.saveUsers(defaultUsers);
          localStorage.setItem("users", JSON.stringify(defaultUsers));
          console.log("[AuthContext] Initialized default users");
          users = defaultUsers;
        } else {
          // Verify that all users have passwords, if not, update them
          const usersNeedUpdate = users.some(user => !user.password);
          if (usersNeedUpdate) {
            console.log("Some users missing passwords, updating from defaults");
            // Update users that are missing passwords
            users = users.map(user => {
              const defaultUser = defaultUsers.find(du => du.email === user.email);
              if (defaultUser && !user.password) {
                return { ...user, password: defaultUser.password };
              }
              return user;
            });
            await dataStorageService.saveUsers(users);
            localStorage.setItem("users", JSON.stringify(users));
          }
        }
        
        // If bypassAuth is enabled, set default admin user
        if (bypassAuth) {
          const adminUser = {...defaultUsers[1]};  // Using admin user
          delete adminUser.password;
          setUser(adminUser);
          setIsAuthenticated(true);
          console.log("[AuthContext] Bypass authentication enabled. Using admin user:", adminUser.email);
        } else {
          // Load current user from localStorage if exists
          const currentUserData = localStorage.getItem("currentUser");
          if (currentUserData) {
            try {
              // Clear any existing user data to force login
              localStorage.removeItem("currentUser");
              setUser(null);
              setIsAuthenticated(false);
              console.log("[AuthContext] Cleared existing user session");
            } catch (error) {
              console.error("[AuthContext] Error parsing current user:", error);
            }
          }
        }
      } catch (error) {
        console.error("[AuthContext] Error initializing auth:", error);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    
    initializeAuth();
  }, [bypassAuth]);

  // Toggle bypass authentication
  const toggleBypassAuth = () => {
    const newBypassValue = !bypassAuth;
    setBypassAuth(newBypassValue);
    localStorage.setItem("bypassAuth", JSON.stringify(newBypassValue));
    
    // If disabling bypass, logout current user
    if (!newBypassValue) {
      logout();
    }
    
    toast({
      title: newBypassValue ? "Autentifikacija isključena" : "Autentifikacija uključena",
      description: newBypassValue ? "Možete koristiti aplikaciju bez prijave" : "Potrebno je prijaviti se za korištenje aplikacije",
    });
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    // If bypass is enabled, auto login as admin
    if (bypassAuth) {
      const adminUser = {...defaultUsers[1]}; 
      delete adminUser.password;
      setUser(adminUser);
      setIsAuthenticated(true);
      return true;
    }

    try {
      setIsLoadingAuth(true);
      console.log("Login attempt with credentials:", { email }); // Log attempt without password
      
      // Try to get users from dataStorage first
      let users = await dataStorageService.getUsers();
      console.log("Users from dataStorage:", users ? users.length : 0);
      
      // If no users in dataStorage, fall back to localStorage
      if (!users || users.length === 0) {
        const usersString = localStorage.getItem("users");
        if (!usersString) {
          console.log("No users found in localStorage");
          // Initialize with default users if none exist
          await dataStorageService.saveUsers(defaultUsers);
          localStorage.setItem("users", JSON.stringify(defaultUsers));
          users = defaultUsers;
        } else {
          users = JSON.parse(usersString);
        }
        console.log("Users from localStorage:", users.length);
      }

      console.log("Found users:", users.length);
      
      const user = users.find((u: User) => u.email === email);

      if (!user) {
        console.log("User not found:", email);
        toast({
          title: "Greška",
          description: "Pogrešan email ili šifra",
          variant: "destructive",
        });
        return false;
      }
      
      console.log("User found:", user.email, "Has password:", !!user.password);
      
      // If user is not active
      if (!user.active) {
        toast({
          title: "Pristup odbijen",
          description: "Vaš korisnički račun nije aktivan. Kontaktirajte administratora.",
          variant: "destructive",
        });
        return false;
      }

      // Ensure password exists before comparison
      if (!user.password) {
        console.error("User has no password defined");
        
        // Try to repair the user by getting password from default users
        const defaultUser = defaultUsers.find(du => du.email === user.email);
        if (defaultUser && defaultUser.password) {
          console.log("Repairing user with default password");
          user.password = defaultUser.password;
          
          // Save the updated user
          const updatedUsers = users.map(u => u.email === user.email ? user : u);
          await dataStorageService.saveUsers(updatedUsers);
          localStorage.setItem("users", JSON.stringify(updatedUsers));
          
          console.log("User repaired, password restored");
        } else {
          toast({
            title: "Greška",
            description: "Problem s korisničkim računom. Kontaktirajte administratora.",
            variant: "destructive",
          });
          return false;
        }
      }

      // Verify password with bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log("Password validation result:", isPasswordValid);
      
      if (isPasswordValid) {
        // Create a clean user object without the password
        const cleanUser = { ...user };
        delete cleanUser.password;
        
        setUser(cleanUser);
        setIsAuthenticated(true);
        localStorage.setItem("currentUser", JSON.stringify(cleanUser));
        
        logUserActivity(cleanUser, "se prijavio u aplikaciju");
        
        toast({
          title: "Uspješna prijava",
          description: `Dobrodošli, ${user.firstName}!`,
        });
        
        return true;
      } else {
        toast({
          title: "Greška",
          description: "Pogrešan email ili šifra",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("[AuthContext] Login error:", error);
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom prijave",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = () => {
    if (user && !bypassAuth) {
      logUserActivity(user, "se odjavio iz aplikacije");
    }
    
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("currentUser");
    
    // Always navigate to login when logging out
    toast({
      title: "Odjavili ste se",
      description: "Uspješno ste se odjavili iz sistema",
    });
    
    navigate("/login");
  };
  
  // Helper function to check if user has permission based on role
  const hasPermission = (requiredRole: UserRole | UserRole[]): boolean => {
    // If bypass is enabled, grant all permissions
    if (bypassAuth) return true;
    
    if (!user) return false;
    
    // Admin has access to everything
    if (user.role === 'admin') return true;
    
    // If requiredRole is an array, check if user's role is in the array
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }
    
    // Otherwise, check if user's role matches the required role
    return user.role === requiredRole;
  };

  // New function to check specific permissions
  const hasSpecificPermission = (permission: string): boolean => {
    // If bypass is enabled, grant all permissions
    if (bypassAuth) return true;
    
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    // Check if the user has the specific permission
    return user.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated, 
      hasPermission,
      hasSpecificPermission,
      isLoadingAuth,
      bypassAuth,
      toggleBypassAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
