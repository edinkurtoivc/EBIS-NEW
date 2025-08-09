
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { PatientHistory } from "@/types/patient";

interface PatientHistoryProps {
  patientHistory: PatientHistory[];
}

export function PatientHistory({ patientHistory }: PatientHistoryProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('bs-BA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Historija posjeta</h3>
        <div className="flex space-x-2">
          <Input placeholder="Pretraži posjete..." className="w-48" />
          <Button size="sm" variant="outline">Filter</Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left">Datum</th>
              <th className="px-4 py-2 text-left">Vrsta</th>
              <th className="px-4 py-2 text-left">Doktor</th>
              <th className="px-4 py-2 text-right">Akcije</th>
            </tr>
          </thead>
          <tbody>
            {patientHistory.map((record) => (
              <tr key={record.id} className="border-b hover:bg-muted/50">
                <td className="px-4 py-2">{formatDate(record.date)}</td>
                <td className="px-4 py-2">{record.type}</td>
                <td className="px-4 py-2">{record.doctor}</td>
                <td className="px-4 py-2 text-right">
                  <Button variant="ghost" size="sm">Pregledaj detalje</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
