
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { Role } from "@/types/user";

// Define available permissions
const availablePermissions = [
  {
    id: "view_patients",
    label: "Pregled pacijenata",
    description: "Može pregledati kartone pacijenata"
  },
  {
    id: "edit_patients",
    label: "Uređivanje pacijenata",
    description: "Može uređivati podatke o pacijentima"
  },
  {
    id: "view_reports",
    label: "Pregled nalaza",
    description: "Može pregledati medicinske nalaze"
  },
  {
    id: "create_reports",
    label: "Kreiranje nalaza",
    description: "Može kreirati nove medicinske nalaze"
  },
  {
    id: "edit_reports",
    label: "Uređivanje nalaza", 
    description: "Može uređivati postojeće nalaze"
  },
  {
    id: "view_appointments",
    label: "Pregled termina",
    description: "Može pregledati zakazane termine"
  },
  {
    id: "manage_appointments",
    label: "Upravljanje terminima",
    description: "Može kreirati i uređivati termine"
  },
  {
    id: "create_users",
    label: "Kreiranje korisnika",
    description: "Može kreirati nove korisnike sistema"
  },
  {
    id: "edit_users",
    label: "Uređivanje korisnika",
    description: "Može uređivati postojeće korisnike"
  },
  {
    id: "delete_users",
    label: "Brisanje korisnika",
    description: "Može brisati korisnike sistema"
  },
  {
    id: "manage_settings",
    label: "Upravljanje postavkama",
    description: "Može mijenjati postavke sistema"
  }
];

// Define the permissions schema
const permissionsSchema = z.record(z.boolean()).refine((data) => {
  // Ensure at least one permission is selected
  return Object.values(data).some(val => val === true);
}, {
  message: "Mora biti odabrana najmanje jedna dozvola"
});

// Define the role schema
const roleSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Naziv role je obavezan"),
  description: z.string().min(1, "Opis role je obavezan"),
  permissions: permissionsSchema
});

type RoleFormData = z.infer<typeof roleSchema>;

export default function UserRoles() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([
    { 
      id: 1, 
      name: "Administrator", 
      description: "Potpuni pristup", 
      permissions: "view_patients,edit_patients,view_reports,create_reports,edit_reports,view_appointments,manage_appointments,create_users,edit_users,delete_users,manage_settings"
    },
    { 
      id: 2, 
      name: "Doktor", 
      description: "Pregledi i nalazi", 
      permissions: "view_patients,edit_patients,view_reports,create_reports,edit_reports,view_appointments"
    },
    { 
      id: 3, 
      name: "Medicinska sestra", 
      description: "Rezervacije termina", 
      permissions: "view_patients,view_appointments,manage_appointments"
    },
    { 
      id: 4, 
      name: "Tehničar", 
      description: "Osnovna podrška", 
      permissions: "view_patients,view_reports,view_appointments"
    }
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: availablePermissions.reduce((acc, perm) => {
        acc[perm.id] = false;
        return acc;
      }, {} as Record<string, boolean>)
    },
  });

  const openAddDialog = () => {
    form.reset({
      name: "",
      description: "",
      permissions: availablePermissions.reduce((acc, perm) => {
        acc[perm.id] = false;
        return acc;
      }, {} as Record<string, boolean>)
    });
    setFormMode('create');
    setIsDialogOpen(true);
  };

  const openEditDialog = (role: Role) => {
    setCurrentRole(role);
    
    // Convert string permissions to checkbox state
    const permissionArray = role.permissions.split(',');
    const permissionsState = availablePermissions.reduce((acc, perm) => {
      acc[perm.id] = permissionArray.includes(perm.id);
      return acc;
    }, {} as Record<string, boolean>);
    
    form.reset({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: permissionsState
    });
    
    setFormMode('edit');
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: RoleFormData) => {
    // Convert permissions object to comma-separated string
    const permissionsString = Object.entries(data.permissions)
      .filter(([_, value]) => value)
      .map(([key, _]) => key)
      .join(',');
    
    if (formMode === 'create') {
      const newRole: Role = {
        id: Math.max(0, ...roles.map(r => r.id)) + 1,
        name: data.name,
        description: data.description,
        permissions: permissionsString,
      };
      setRoles([...roles, newRole]);
      toast({
        title: "Rola kreirana",
        description: "Nova rola je uspješno dodana",
      });
    } else {
      setRoles(roles.map(r => (r.id === data.id ? {
        id: r.id,
        name: data.name,
        description: data.description,
        permissions: permissionsString,
      } : r)));
      toast({
        title: "Rola ažurirana",
        description: "Rola je uspješno ažurirana",
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    setRoles(roles.filter(r => r.id !== id));
    toast({
      title: "Rola obrisana",
      description: "Rola je uspješno obrisana",
    });
  };

  // Function to display permissions in a readable format
  const formatPermissions = (permissionsStr: string) => {
    const permArray = permissionsStr.split(',');
    if (permArray.length <= 3) {
      return permArray.map(p => {
        const found = availablePermissions.find(ap => ap.id === p);
        return found ? found.label : p;
      }).join(', ');
    } else {
      return `${permArray.length} dozvola`;
    }
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Role i permisije</h2>
            <p className="text-muted-foreground">
              Upravljajte rolama i permisijama za korisnike sistema
            </p>
          </div>
          <Button onClick={openAddDialog}>Dodaj rolu</Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naziv role</TableHead>
              <TableHead>Opis</TableHead>
              <TableHead>Permisije</TableHead>
              <TableHead className="text-right">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell>{formatPermissions(role.permissions)}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(role)}>Uredi</Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-500"
                    onClick={() => handleDelete(role.id)}
                  >
                    Obriši
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'create' ? 'Dodaj novu rolu' : 'Uredi rolu'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Naziv role</FormLabel>
                    <FormControl>
                      <Input placeholder="npr. Administrator" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opis</FormLabel>
                    <FormControl>
                      <Input placeholder="npr. Potpuni pristup" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-4">Dozvole</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availablePermissions.map((permission) => (
                    <FormField
                      key={permission.id}
                      control={form.control}
                      name={`permissions.${permission.id}`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>{permission.label}</FormLabel>
                            <FormDescription className="text-xs">
                              {permission.description}
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Odustani
                </Button>
                <Button type="submit">
                  {formMode === 'create' ? 'Dodaj' : 'Sačuvaj'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
