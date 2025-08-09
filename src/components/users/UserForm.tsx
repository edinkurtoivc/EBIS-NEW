
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { User } from "@/types/user";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { userFormSchema, type UserFormData } from "@/schemas/userForm";
import { UserFormFields } from "./UserFormFields";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  defaultValues?: Partial<User>;
  mode: 'create' | 'edit';
}

export default function UserForm({ 
  open, 
  onOpenChange, 
  onSubmit, 
  defaultValues,
  mode 
}: UserFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: defaultValues?.email || "",
      firstName: defaultValues?.firstName || "",
      lastName: defaultValues?.lastName || "",
      role: (defaultValues?.role as 'admin' | 'doctor' | 'nurse') || "doctor",
      specialization: defaultValues?.specialization || "",
      phone: defaultValues?.phone || "",
      roleId: defaultValues?.roleId,
    },
  });

  // Reset form when default values change
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        email: defaultValues.email || "",
        firstName: defaultValues.firstName || "",
        lastName: defaultValues.lastName || "",
        role: (defaultValues.role as 'admin' | 'doctor' | 'nurse') || "doctor",
        specialization: defaultValues.specialization || "",
        phone: defaultValues.phone || "",
        roleId: defaultValues?.roleId,
      });
    }
  }, [defaultValues, form]);

  const handleSubmit = async (data: UserFormData) => {
    try {
      setIsLoading(true);
      await onSubmit(data);
      onOpenChange(false);
      form.reset();
      toast({
        title: `Korisnik ${mode === 'create' ? 'kreiran' : 'ažuriran'} uspješno`,
        description: `${data.firstName} ${data.lastName} je ${mode === 'create' ? 'dodan u' : 'ažuriran u'} sistem.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Nešto je pošlo po zlu. Molimo pokušajte ponovo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Dodaj novog korisnika' : 'Uredi korisnika'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Dodajte novog korisnika u sistem. Dobit će email za postavljanje lozinke.'
              : 'Ažurirajte informacije i uloge korisnika.'
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <ScrollArea className="h-[60vh] pr-4">
              <div className="pb-4">
                <UserFormFields form={form} />
              </div>
            </ScrollArea>
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={isLoading}>
                {mode === 'create' ? 'Kreiraj korisnika' : 'Ažuriraj korisnika'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
