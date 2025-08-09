import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RecentVisits } from "./RecentVisits";
import { PatientInfoCard } from "./patient-overview/PatientInfoCard";
import { PatientDetailsForm } from "./PatientDetailsForm";
import { EditActions } from "./patient-overview/EditActions";
import type { Patient } from "@/types/patient";
import { ensurePatient } from "@/types/patient";
import dataStorageService from "@/services/DataStorageService"; // ⬅️ koristi novi servis

interface PatientOverviewProps {
  patient: Patient;
  editedPatient: Patient;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  setEditedPatient: (patient: Patient) => void;
  onUpdate?: (patient: Patient) => void;
  setIsScheduling: (value: boolean) => void;
  patientHistory?: any[];
}

export function PatientOverview({
  patient,
  editedPatient,
  isEditing,
  setIsEditing,
  setEditedPatient,
  onUpdate,
  setIsScheduling,
}: PatientOverviewProps) {
  const { toast } = useToast();
  const [patientHistory, setPatientHistory] = useState<any[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const reports = await dataStorageService.getPatientHistory(patient.id.toString());
        setPatientHistory(reports); // ⬅️ direktno koristi formatirane rezultate
      } catch (err) {
        console.error("[PatientOverview] Greška pri učitavanju historije pacijenta:", err);
      }
    };

    if (patient?.id) loadHistory();
  }, [patient?.id]);

  const handleSaveChanges = () => {
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
