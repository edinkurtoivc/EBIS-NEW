
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Patient } from "@/types/patient";

interface PatientDetailsFormProps {
  patient: Patient;
  editedPatient: Patient;
  isEditing: boolean;
  setEditedPatient: (patient: Patient) => void;
}

export function PatientDetailsForm({
  patient,
  editedPatient,
  isEditing,
  setEditedPatient
}: PatientDetailsFormProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('bs-BA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <ScrollArea className="h-[50vh]">
      <div className="grid gap-4 md:grid-cols-2 pr-4 pb-2">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Ime</Label>
          {isEditing ? (
            <Input 
              value={editedPatient.firstName} 
              onChange={(e) => setEditedPatient({...editedPatient, firstName: e.target.value})}
            />
          ) : (
            <p>{patient.firstName}</p>
          )}
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Prezime</Label>
          {isEditing ? (
            <Input 
              value={editedPatient.lastName} 
              onChange={(e) => setEditedPatient({...editedPatient, lastName: e.target.value})}
            />
          ) : (
            <p>{patient.lastName}</p>
          )}
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Datum rođenja</Label>
          {isEditing ? (
            <Input 
              type="date" 
              value={editedPatient.dob} 
              onChange={(e) => setEditedPatient({...editedPatient, dob: e.target.value})}
            />
          ) : (
            <p>{formatDate(patient.dob)}</p>
          )}
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">JMBG</Label>
          {isEditing ? (
            <Input 
              value={editedPatient.jmbg} 
              onChange={(e) => setEditedPatient({...editedPatient, jmbg: e.target.value})}
            />
          ) : (
            <p>{patient.jmbg}</p>
          )}
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Telefon</Label>
          {isEditing ? (
            <Input 
              value={editedPatient.phone} 
              onChange={(e) => setEditedPatient({...editedPatient, phone: e.target.value})}
            />
          ) : (
            <p>{patient.phone}</p>
          )}
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Adresa</Label>
          {isEditing ? (
            <Input 
              value={editedPatient.address || ''} 
              onChange={(e) => setEditedPatient({...editedPatient, address: e.target.value})}
            />
          ) : (
            <p>{patient.address || 'Nije uneseno'}</p>
          )}
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Email</Label>
          {isEditing ? (
            <Input 
              type="email" 
              value={editedPatient.email || ''} 
              onChange={(e) => setEditedPatient({...editedPatient, email: e.target.value})}
            />
          ) : (
            <p>{patient.email || 'Nije uneseno'}</p>
          )}
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Spol</Label>
          {isEditing ? (
            <select 
              className="w-full h-10 px-3 rounded-md border border-input"
              value={editedPatient.gender || ''}
              onChange={(e) => setEditedPatient({...editedPatient, gender: e.target.value as 'M' | 'F'})}
            >
              <option value="">Odaberite spol</option>
              <option value="M">Muško</option>
              <option value="F">Žensko</option>
            </select>
          ) : (
            <p>{patient.gender === 'M' ? 'Muško' : patient.gender === 'F' ? 'Žensko' : 'Nije navedeno'}</p>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
