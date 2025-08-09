
import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { UserFormData } from "@/schemas/userForm";
import { useState, useEffect } from "react";
import { type Role } from "@/types/user";

interface UserFormFieldsProps {
  form: UseFormReturn<UserFormData>;
}

export function UserFormFields({ form }: UserFormFieldsProps) {
  const [roles, setRoles] = useState<Role[]>([]);

  // Load roles on component mount
  useEffect(() => {
    // Default roles if none are available
    const defaultRoles: Role[] = [
      { id: 1, name: "Administrator", description: "Potpuni pristup", permissions: "all" },
      { id: 2, name: "Doktor", description: "Pregledi i nalazi", permissions: "patients,reports" },
      { id: 3, name: "Medicinska sestra", description: "Rezervacije termina", permissions: "patients,appointments" },
      { id: 4, name: "Tehničar", description: "Osnovna podrška", permissions: "view_only" }
    ];

    // Attempt to load roles from storage
    const loadRoles = () => {
      try {
        const rolesData = localStorage.getItem('roles');
        if (rolesData) {
          setRoles(JSON.parse(rolesData));
        } else {
          // Use default roles if none found
          setRoles(defaultRoles);
          localStorage.setItem('roles', JSON.stringify(defaultRoles));
        }
      } catch (error) {
        console.error("Failed to load roles:", error);
        setRoles(defaultRoles);
      }
    };

    loadRoles();
  }, []);

  // Update roleId when role changes
  useEffect(() => {
    const currentRole = form.getValues('role');
    if (currentRole && roles.length > 0) {
      const matchingRole = roles.find(r => 
        r.name.toLowerCase() === currentRole.toLowerCase()
      );
      
      if (matchingRole) {
        form.setValue('roleId', matchingRole.id);
      }
    }
  }, [roles, form]);

  return (
    <>
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input placeholder="korisnik@primjer.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Šifra</FormLabel>
            <FormControl>
              <Input type="password" placeholder="Minimalno 6 karaktera" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="firstName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ime</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="lastName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Prezime</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="role"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Uloga</FormLabel>
            <Select 
              onValueChange={(value) => {
                field.onChange(value);
                // Update roleId based on selected role
                const selectedRole = roles.find(r => r.name.toLowerCase() === value.toLowerCase());
                if (selectedRole) {
                  form.setValue('roleId', selectedRole.id);
                }
              }} 
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Odaberite ulogu" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="doctor">Doktor</SelectItem>
                <SelectItem value="nurse">Medicinski tehničar</SelectItem>
                <SelectItem value="technician">Tehničar</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="roleId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Detaljna uloga</FormLabel>
            <Select
              onValueChange={(value) => field.onChange(Number(value))}
              value={field.value?.toString() || ""}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Odaberite definisanu ulogu" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.name} - {role.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription className="text-xs">
              Odaberite detaljniju ulogu koja definira specifične dozvole korisnika
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="specialization"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Specijalizacija</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Broj telefona</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
