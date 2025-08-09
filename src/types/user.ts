
export type UserRole = 'admin' | 'doctor' | 'nurse' | 'technician';

export interface User {
  id: string;
  email: string;
  password: string; 
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions?: string[]; // Added permissions array
  specialization?: string;
  phone?: string;
  birthDate?: string;
  signatureImage?: string;
  stampImage?: string;
  active: boolean;
  roleId?: number; // Added roleId to link users to defined roles
}

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string;
}
