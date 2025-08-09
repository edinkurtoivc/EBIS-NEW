
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { v4 as uuidv4 } from "uuid";
import { PatientImpl } from "@/types/patient";
import type { Patient } from "@/types/patient";

interface PatientFormProps {
  onSubmit: (patient: Patient) => void;
  onCancel: () => void;
}

export default function PatientForm({ onSubmit, onCancel }: PatientFormProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    jmbg: "",
    phone: "",
    address: "",
    email: "",
    gender: "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.firstName.trim()) {
      newErrors.firstName = "Ime je obavezno";
    }
    
    if (!form.lastName.trim()) {
      newErrors.lastName = "Prezime je obavezno";
    }
    
    if (!form.dob) {
      newErrors.dob = "Datum rođenja je obavezan";
    }
    
    if (!form.jmbg.trim()) {
      newErrors.jmbg = "JMBG je obavezan";
    } else if (!/^\d{13}$/.test(form.jmbg)) {
      newErrors.jmbg = "JMBG mora imati 13 brojeva";
    }
    
    if (!form.phone.trim()) {
      newErrors.phone = "Broj telefona je obavezan";
    }
    
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Email nije validan";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      // Create the patient object using PatientImpl which implements the name getter
      const patient = new PatientImpl({
        id: parseInt(uuidv4().replace(/-/g, '').substring(0, 8), 16),
        firstName: form.firstName,
        lastName: form.lastName,
        dob: form.dob,
        jmbg: form.jmbg,
        phone: form.phone,
        address: form.address || undefined,
        email: form.email || undefined,
        gender: form.gender ? (form.gender as "M" | "F") : undefined
      });
      
      onSubmit(patient);
    }
  };
  
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">Dodaj novog pacijenta</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ScrollArea className="h-[60vh] pr-4">
          <div className="pb-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Ime *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
              </div>
              
              <div>
                <Label htmlFor="lastName">Prezime *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dob">Datum rođenja *</Label>
                <Input
                  id="dob"
                  name="dob"
                  type="date"
                  value={form.dob}
                  onChange={handleChange}
                  className={errors.dob ? "border-red-500" : ""}
                />
                {errors.dob && <p className="text-sm text-red-500 mt-1">{errors.dob}</p>}
              </div>
              
              <div>
                <Label htmlFor="gender">Spol</Label>
                <select
                  id="gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-md border border-input"
                >
                  <option value="">Odaberite spol</option>
                  <option value="M">Muško</option>
                  <option value="F">Žensko</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jmbg">JMBG *</Label>
                <Input
                  id="jmbg"
                  name="jmbg"
                  value={form.jmbg}
                  onChange={handleChange}
                  className={errors.jmbg ? "border-red-500" : ""}
                  maxLength={13}
                />
                {errors.jmbg && <p className="text-sm text-red-500 mt-1">{errors.jmbg}</p>}
              </div>
              
              <div>
                <Label htmlFor="phone">Telefon *</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>
            
            <div>
              <Label htmlFor="address">Adresa</Label>
              <Input
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>
          </div>
        </ScrollArea>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Odustani
          </Button>
          <Button type="submit">
            Spremi pacijenta
          </Button>
        </div>
      </form>
    </Card>
  );
}
