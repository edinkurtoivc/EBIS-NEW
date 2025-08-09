
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface DoctorStatsProps {
  id: string;
  name: string;
  completedAppointments: number;
  examinationTypes: Record<string, number>;
}

interface DoctorExaminationDetailsProps {
  doctor: DoctorStatsProps;
  onClose: () => void;
}

export default function DoctorExaminationDetails({ doctor, onClose }: DoctorExaminationDetailsProps) {
  // Convert examination types object to array for sorting and display
  const examinationTypesList = Object.entries(doctor.examinationTypes)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
  
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Vrste pregleda: {doctor.name}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vrsta pregleda</TableHead>
              <TableHead className="text-right">Broj puta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {examinationTypesList.length > 0 ? (
              examinationTypesList.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.type}</TableCell>
                  <TableCell className="text-right font-medium">{item.count}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                  Nema podataka o pregledima za ovog doktora
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
