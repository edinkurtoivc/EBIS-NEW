import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { PatientHistory } from "@/types/patient";
import { useNavigate } from "react-router-dom";

interface PatientHistoryProps {
  patientHistory: PatientHistory[];
}

export function PatientHistory({ patientHistory }: PatientHistoryProps) {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("bs-BA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleView = (reportId?: string) => {
    if (reportId) {
      navigate(`/medical-reports?reportId=${reportId}&mode=view`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Historija posjeta</h3>
        <div className="flex space-x-2">
          <Input placeholder="Pretraži posjete..." className="w-48" />
          <Button size="sm" variant="outline">
            Filter
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left">Datum</th>
              <th className="px-4 py-2 text-left">Vrsta</th>
              <th className="px-4 py-2 text-left">Doktor</th>
              <th className="px-4 py-2 text-right">Akcije</th>
            </tr>
          </thead>
          <tbody>
            {patientHistory.length > 0 ? (
              patientHistory.map((record) => (
                <tr key={record.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-2">{formatDate(record.date)}</td>
                  <td className="px-4 py-2">{record.type}</td>
                  <td className="px-4 py-2">{record.doctor}</td>
                  <td className="px-4 py-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(record.reportId)}
                    >
                      Pregledaj detalje
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="text-center text-muted-foreground py-4"
                >
                  Nema zapisa o posjetama za ovog pacijenta.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
