
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RecentVisits } from "./RecentVisits";
import { PatientInfoCard } from "./patient-overview/PatientInfoCard";
import { PatientDetailsForm } from "./patient-overview/PatientDetailsForm";
import { EditActions } from "./patient-overview/EditActions";
import type { Patient } from "@/types/patient";
import { ensurePatient } from "@/types/patient";

interface PatientOverviewProps {
  patient: Patient;
  editedPatient: Patient;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  setEditedPatient: (patient: Patient) => void;
  onUpdate?: (patient: Patient) => void;
  setIsScheduling: (value: boolean) => void;
  patientHistory: any[];
}

export function PatientOverview({
  patient,
  editedPatient,
  isEditing,
  setIsEditing,
  setEditedPatient,
  onUpdate,
  setIsScheduling,
  patientHistory
}: PatientOverviewProps) {
  const { toast } = useToast();

  const handleSaveChanges = () => {
    // Ensure patient has name getter
    const typedEditedPatient = ensurePatient(editedPatient);
    
    if (!typedEditedPatient.firstName || !typedEditedPatient.jmbg) {
      toast({
        title: "Greška",
        description: "Ime i JMBG su obavezna polja.",
        variant: "destructive",
      });
      return;
    }
    
    if (onUpdate) {
      onUpdate(typedEditedPatient);
    }
    
    toast({
      title: "Uspješno",
      description: "Podaci o pacijentu su uspješno ažurirani.",
    });
    
    setIsEditing(false);
    
    console.log('Evidencija: Podaci o pacijentu su ažurirani', {
      patientId: patient.id,
      updatedBy: 'Trenutni korisnik',
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4">
        <div className="flex justify-between items-center mb-4">
          <PatientInfoCard
            patient={patient}
            editedPatient={editedPatient}
            isEditing={isEditing}
            setEditedPatient={setEditedPatient}
          />
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-1" /> Uredi podatke
            </Button>
          )}
        </div>
        
        <PatientDetailsForm
          patient={patient}
          editedPatient={editedPatient}
          isEditing={isEditing}
          setEditedPatient={setEditedPatient}
        />
      </div>

      <RecentVisits 
        patientHistory={patientHistory} 
        setIsScheduling={setIsScheduling} 
        patient={patient}  
      />

      <EditActions
        isEditing={isEditing}
        onSave={handleSaveChanges}
        onCancel={() => setIsEditing(false)}
      />
    </div>
  );
}
