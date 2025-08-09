import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import PatientsList from "@/components/patients/PatientsList";
import PatientCard from "@/components/patients/PatientCard";
import PatientForm from "@/components/patients/PatientForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { Patient, AuditLog } from "@/types/patient";
import { ensurePatient } from "@/types/patient";
import dataStorageService from "@/services/DataStorageService";

export default function Patients() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  
  // Load patients on initial render
  useEffect(() => {
    loadPatients();
  }, []);
  
  const loadPatients = async () => {
    try {
      const loadedPatients = await dataStorageService.getPatients();
      // Ensure all patients have the name getter
      const patientsWithName = loadedPatients.map(patient => ensurePatient(patient));
      setPatients(patientsWithName);
      console.log("[Patients] Loaded patients:", patientsWithName);
    } catch (error) {
      console.error("[Patients] Error loading patients:", error);
      toast({
        title: "Greška",
        description: "Dogodila se greška pri učitavanju pacijenata.",
        variant: "destructive"
      });
    }
  };

  // Function to log patient activities
  const logPatientActivity = async (patientId: number, action: 'create' | 'update' | 'view', details: string) => {
    if (!user) return;
    
    try {
      const userName = `${user.firstName} ${user.lastName}`;
      
      const newLog: AuditLog = {
        id: Date.now(),
        action: action,
        entityType: 'patient',
        entityId: patientId,
        performedBy: userName,
        performedAt: new Date().toISOString(),
        details: details
      };
      
      // Get existing logs or initialize empty array
      const existingLogs = localStorage.getItem('auditLogs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      
      // Add new log
      logs.push(newLog);
      
      // Save updated logs
      localStorage.setItem('auditLogs', JSON.stringify(logs));
      
      console.log(`[Patients] Activity logged: ${action} on patient ${patientId} by ${userName}`);
      
      // In a real implementation, you would also save this to your file system
      // await dataStorageService.saveAuditLog(newLog);
    } catch (error) {
      console.error("[Patients] Error logging activity:", error);
    }
  };
  
  const handleUpdatePatient = async (updatedPatient: Patient) => {
    try {
      // Ensure patient has name getter
      const typedPatient = ensurePatient(updatedPatient);
      const success = await dataStorageService.savePatient(typedPatient);
      
      if (success) {
        // Log this update activity with more details about what changed
        await logPatientActivity(
          typedPatient.id, 
          'update', 
          `Ažurirane informacije o pacijentu ${typedPatient.name} (${typedPatient.jmbg})`
        );
        
        // Refresh patients list
        await loadPatients();
        setSelectedPatient(typedPatient);
        
        toast({
          title: "Uspješno",
          description: "Informacije o pacijentu su uspješno ažurirane.",
        });
        
        console.log('[Patients] Patient updated:', {
          patientId: typedPatient.id,
          updatedBy: user ? `${user.firstName} ${user.lastName}` : 'Nepoznati korisnik', 
          timestamp: new Date().toISOString(),
        });
      } else {
        throw new Error("Nije moguće ažurirati pacijenta");
      }
    } catch (error) {
      console.error("[Patients] Error updating patient:", error);
      toast({
        title: "Greška",
        description: "Dogodila se greška pri ažuriranju pacijenta.",
        variant: "destructive"
      });
    }
  };
  
  const handleAddPatient = async (newPatient: Patient) => {
    try {
      // Ensure patient has name getter
      const typedPatient = ensurePatient(newPatient);
      const success = await dataStorageService.savePatient(typedPatient);
      
      if (success) {
        // Log this create activity with more detailed information
        await logPatientActivity(
          typedPatient.id, 
          'create', 
          `Kreiran novi pacijent ${typedPatient.name}, JMBG: ${typedPatient.jmbg}, Datum rođenja: ${typedPatient.dob}`
        );
        
        // Refresh patients list
        await loadPatients();
        setIsCreating(false);
        
        toast({
          title: "Uspješno",
          description: `Pacijent ${typedPatient.name} je uspješno dodan.`,
        });
        
        console.log('[Patients] Patient added:', {
          patientId: typedPatient.id,
          name: typedPatient.name,
          createdBy: user ? `${user.firstName} ${user.lastName}` : 'Nepoznati korisnik',
          timestamp: new Date().toISOString(),
        });
      } else {
        throw new Error("Nije moguće dodati pacijenta");
      }
    } catch (error) {
      console.error("[Patients] Error adding patient:", error);
      toast({
        title: "Greška",
        description: "Dogodila se greška pri dodavanju pacijenta.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="flex h-full flex-col">
      <Header title="Pacijenti" />
      <div className="page-container">
        {selectedPatient ? (
          <PatientCard 
            patient={selectedPatient}
            onClose={() => setSelectedPatient(null)}
            onUpdate={handleUpdatePatient}
          />
        ) : isCreating ? (
          <div>
            <Button variant="outline" onClick={() => setIsCreating(false)} className="mb-4">
              Nazad na listu
            </Button>
            <PatientForm onSubmit={handleAddPatient} onCancel={() => setIsCreating(false)} />
          </div>
        ) : (
          <div>
            <Button onClick={() => setIsCreating(true)} className="mb-4">
              Dodaj pacijenta
            </Button>
            <PatientsList patients={patients} onSelectPatient={setSelectedPatient} />
          </div>
        )}
      </div>
    </div>
  );
}
