
import { FileText, Eye, Edit, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { MedicalReport, MedicalReportFile } from "@/types/medical-report";
import { getPatientReports } from "@/utils/fileSystemUtils";

interface MedicalReportsProps {
  patient: { id: number };
}

export function MedicalReports({ patient }: MedicalReportsProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [fileSystemReports, setFileSystemReports] = useState<MedicalReportFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true);
      try {
        // Get stored reports from localStorage
        const savedReports = localStorage.getItem('medicalReports');
        if (savedReports) {
          const allReports: MedicalReport[] = JSON.parse(savedReports);
          // Filter reports to only show those for the current patient
          const patientReports = allReports.filter(report => 
            report.patientId === patient.id.toString()
          );
          setReports(patientReports);
        }
        
        // Get reports from file system if Electron is available
        if (window.electron?.isElectron) {
          const basePath = localStorage.getItem("dataFolderPath");
          if (basePath) {
            const fsReports = await getPatientReports(basePath, patient.id.toString());
            setFileSystemReports(fsReports);
            console.log("Loaded reports from filesystem:", fsReports);
          }
        }
      } catch (error) {
        console.error("[MedicalReports] Error loading reports:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (patient?.id) {
      loadReports();
    }
  }, [patient?.id]);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('bs-BA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Combine file system reports with localStorage reports
  const allReports = [
    ...fileSystemReports.map(report => ({
      id: report.id,
      appointmentType: report.appointmentType,
      doctor: report.doctor,
      date: report.date,
      verified: report.verified
    })),
    ...reports.map(report => ({
      id: report.id,
      appointmentType: report.appointmentType || "Medicinski nalaz",
      doctor: report.doctorInfo?.fullName || "Doktor",
      date: report.date,
      verified: report.verificationStatus === 'verified'
    }))
  ];

  const displayReports = allReports.filter(report => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (report.appointmentType.toLowerCase().includes(searchLower) || 
      report.doctor.toLowerCase().includes(searchLower) ||
      formatDate(report.date).includes(searchTerm))
    );
  });

  // Sort by date descending (newest first)
  displayReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleView = (reportId: string) => {
    navigate(`/medical-reports?reportId=${reportId}&mode=view`);
  };

  const handleEdit = (reportId: string) => {
    navigate(`/medical-reports?reportId=${reportId}&mode=edit`);
  };

  const handlePrint = (reportId: string) => {
    navigate(`/medical-reports?reportId=${reportId}&mode=print`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-medium">Medicinski nalazi</h3>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => navigate('/medical-reports')}
        >
          Novi nalaz
        </Button>
      </div>

      <div className="relative flex-grow max-w-sm mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pretraži nalaze..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>
      
      {isLoading ? (
        <div className="text-center p-4">
          <p className="text-muted-foreground">Učitavanje nalaza...</p>
        </div>
      ) : displayReports.length > 0 ? (
        <div className="space-y-3">
          {displayReports.map((report) => (
            <div key={report.id} className="rounded-md border p-4 hover:bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="mr-3 rounded-full bg-clinic-50 p-2 text-clinic-700">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{report.appointmentType}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(report.date)} · {report.doctor}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleView(report.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" /> Pregledaj
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(report.id)}
                  >
                    <Edit className="h-4 w-4 mr-1" /> Uredi
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handlePrint(report.id)}
                  >
                    <Printer className="h-4 w-4 mr-1" /> Printaj
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-6 border rounded-md">
          <p className="text-muted-foreground">
            {searchTerm ? "Nema pronađenih nalaza." : "Nema medicinskih nalaza za ovog pacijenta."}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => navigate('/medical-reports')}
          >
            Kreiraj novi nalaz
          </Button>
        </div>
      )}
    </div>
  );
}
