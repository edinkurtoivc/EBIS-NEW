
import * as z from "zod";

export const userFormSchema = z.object({
  email: z.string().email({
    message: "Unesite važeći email",
  }),
  password: z.string().min(6, {
    message: "Lozinka mora imati najmanje 6 karaktera",
  }).optional().or(z.literal('')),
  firstName: z.string().min(2, {
    message: "Ime mora imati najmanje 2 karaktera",
  }),
  lastName: z.string().min(2, {
    message: "Prezime mora imati najmanje 2 karaktera",
  }),
  role: z.enum(["admin", "doctor", "nurse", "technician"]),
  specialization: z.string().optional(),
  phone: z.string().optional(),
  roleId: z.number().optional(),
});

export type UserFormData = z.infer<typeof userFormSchema>;
