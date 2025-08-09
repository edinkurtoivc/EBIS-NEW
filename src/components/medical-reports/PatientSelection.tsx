
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, UserPlus } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import dataStorageService from "@/services/DataStorageService";
import type { Patient } from "@/types/patient";
import { ensurePatient } from "@/types/patient";

interface PatientSelectionProps {
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  onVisitTypeChange?: (visitType: string) => void;
}

export default function PatientSelection({ selectedPatient, onSelectPatient, onVisitTypeChange }: PatientSelectionProps) {
  const { toast } = useToast();
  const [showPatientsDropdown, setShowPatientsDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [visitType, setVisitType] = useState<string | undefined>();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load patients from DataStorageService
  useEffect(() => {
    const loadPatients = async () => {
      setIsLoading(true);
      try {
        const loadedPatients = await dataStorageService.getPatients();
        // Ensure all patients have the name getter
        const patientsWithName = loadedPatients.map(patient => ensurePatient(patient));
        setPatients(patientsWithName);
        console.log("[PatientSelection] Loaded patients:", patientsWithName);
      } catch (error) {
        console.error("[PatientSelection] Error loading patients:", error);
        toast({
          title: "Greška",
          description: "Dogodila se greška pri učitavanju pacijenata.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPatients();
  }, [toast]);

  const filteredPatients = patients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    // Ensure the patient has the name getter before accessing it
    const patientWithName = ensurePatient(patient);
    return (
      patientWithName.name.toLowerCase().includes(searchLower) ||
      (patient.jmbg && patient.jmbg.includes(searchTerm)) ||
      (patient.dob && patient.dob.includes(searchTerm))
    );
  });

  const handleSelectPatient = (patient: Patient) => {
    // Ensure patient has name getter before passing it up
    onSelectPatient(ensurePatient(patient));
    setShowPatientsDropdown(false);
    setSearchTerm("");
  };

  const handleVisitTypeChange = (value: string) => {
    setVisitType(value);
    onVisitTypeChange?.(value);
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="relative">
        <div className="w-full relative">
          <Input 
            placeholder={selectedPatient ? ensurePatient(selectedPatient).name : "Odaberite pacijenta"}
            className="w-full border rounded-md p-4"
            onClick={() => setShowPatientsDropdown(!showPatientsDropdown)}
            readOnly
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </div>
        
        {showPatientsDropdown && (
          <div className="absolute z-10 w-full bg-white border rounded-md mt-1 shadow-md">
            <div className="relative m-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Pronađite pacijenta..." 
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">Učitavanje pacijenata...</div>
            ) : filteredPatients.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto">
                {filteredPatients.map(patient => {
                  const patientWithName = ensurePatient(patient);
                  return (
                    <div 
                      key={patient.id} 
                      className="p-2 hover:bg-gray-100 cursor-pointer flex flex-col"
                      onClick={() => handleSelectPatient(patient)}
                    >
                      <span className="font-medium">{patientWithName.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {patient.jmbg ? `JMBG: ${patient.jmbg} · ` : ''}
                        {patient.dob ? `Rođen: ${patient.dob}` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                {searchTerm ? "Nema pronađenih pacijenata." : "Nema pacijenata u bazi."}
              </div>
            )}
            
            <a 
              href="/patients"
              className="p-2 hover:bg-gray-100 cursor-pointer flex border-t text-emerald-600"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/patients';
              }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              <span>Dodaj novog pacijenta</span>
            </a>
          </div>
        )}
      </div>

      {selectedPatient && (
        <div className="pt-2">
          <div className="text-sm font-medium mb-2 text-gray-600">Tip pregleda (opcionalno)</div>
          <RadioGroup
            value={visitType}
            onValueChange={handleVisitTypeChange}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="first" id="first-visit" />
              <label htmlFor="first-visit" className="text-sm">
                Prvi pregled
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="followup" id="followup-visit" />
              <label htmlFor="followup-visit" className="text-sm">
                Kontrolni pregled
              </label>
            </div>
          </RadioGroup>
        </div>
      )}
    </div>
  );
}
