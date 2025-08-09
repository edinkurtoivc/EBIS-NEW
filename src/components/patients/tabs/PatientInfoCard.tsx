
import { Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Patient } from "@/types/patient";

interface PatientInfoCardProps {
  patient: Patient;
  editedPatient: Patient;
  isEditing: boolean;
  setEditedPatient: (patient: Patient) => void;
}

export function PatientInfoCard({ 
  patient, 
  editedPatient, 
  isEditing, 
  setEditedPatient 
}: PatientInfoCardProps) {
  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center">
        <div className="mr-4 rounded-full bg-clinic-100 p-3 text-clinic-700">
          <Users className="h-6 w-6" />
        </div>
        <div>
          {isEditing ? (
            <div className="flex space-x-2">
              <Input 
                value={editedPatient.firstName} 
                onChange={(e) => setEditedPatient({...editedPatient, firstName: e.target.value})}
                className="font-semibold text-lg w-1/2"
                placeholder="Ime"
              />
              <Input 
                value={editedPatient.lastName} 
                onChange={(e) => setEditedPatient({...editedPatient, lastName: e.target.value})}
                className="font-semibold text-lg w-1/2"
                placeholder="Prezime"
              />
            </div>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-clinic-800">{patient.firstName} {patient.lastName}</h3>
              <p className="text-sm text-muted-foreground">
                {calculateAge(patient.dob)} godina · JMBG: {patient.jmbg}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
