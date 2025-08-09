
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import type { Patient } from "@/types/patient";
import { ensurePatient } from "@/types/patient";

interface PatientsListProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
}

export default function PatientsList({ patients, onSelectPatient }: PatientsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    showInactive: false,
    sortBy: "name",
  });

  const filteredPatients = patients.filter(patient => {
    // Ensure patient has name getter
    const patientWithName = ensurePatient(patient);
    const searchLower = searchTerm.toLowerCase();
    return (
      patientWithName.name.toLowerCase().includes(searchLower) ||
      patient.jmbg.includes(searchLower) ||
      (patient.dob && patient.dob.includes(searchTerm))
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-grow max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pretražite po imenu ili JMBG..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="sm">Filter</Button>
        <Button variant="outline" size="sm">Sort</Button>
      </div>

      <div className="rounded-md border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ime</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Datum rođenja</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">JMBG</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Telefon</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Akcije</th>
            </tr>
          </thead>
          <tbody className="divide-y bg-white">
            {filteredPatients.map((patient) => {
              const patientWithName = ensurePatient(patient);
              return (
                <tr key={patient.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm font-medium">{patientWithName.name}</td>
                  <td className="px-4 py-3 text-sm">{patient.dob}</td>
                  <td className="px-4 py-3 text-sm">{patient.jmbg}</td>
                  <td className="px-4 py-3 text-sm">{patient.phone}</td>
                  <td className="px-4 py-3 text-right">
                    <Button 
                      onClick={() => onSelectPatient(patient)} 
                      variant="ghost"
                      size="sm"
                      className="text-clinic-600 hover:text-clinic-800 hover:bg-clinic-50"
                    >
                      Pregled
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredPatients.length === 0 && (
          <div className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground">Nije pronađen nijedan pacijent</p>
          </div>
        )}
      </div>
    </div>
  );
}
