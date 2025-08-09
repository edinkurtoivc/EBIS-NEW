import { FileText, Eye, Edit, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { MedicalReport, MedicalReportFile } from "@/types/medical-report";
import { getPatientReports } from "@/utils/fileSystemUtils";
import { Spinner } from "@/components/ui/spinner";
import MedicalReportForm from "@/components/medical-reports/MedicalReportForm";
import MedicalReportPreview from "@/components/medical-reports/MedicalReportPreview";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import type { AuditLog } from "@/types/patient";

interface MedicalReportsProps {
  patient: { id: number };
}

// Create a unified type for reports that can come from different sources
type UnifiedMedicalReport = MedicalReport | {
  id: string;
  appointmentType: string;
  doctor: string;
  date: string;
  verificationStatus: 'verified' | 'unverified';
  report: string;
  therapy: string;
  notes: string;
  patientId: string;
  doctorInfo: {
    fullName: string;
  };
};

export function MedicalReports({ patient }: MedicalReportsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [fileSystemReports, setFileSystemReports] = useState<MedicalReportFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<UnifiedMedicalReport | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [editReasonDialogOpen, setEditReasonDialogOpen] = useState(false);
  const [editReason, setEditReason] = useState("");
  const [reportToEdit, setReportToEdit] = useState<UnifiedMedicalReport | null>(null);
  
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
          const basePath = localStorage.getItem('dataFolderPath');
          if (basePath) {
            console.log("[MedicalReports] Loading reports from filesystem for patient:", patient.id);
            const fsReports = await getPatientReports(basePath, patient.id.toString());
            console.log("[MedicalReports] Loaded reports from filesystem:", fsReports);
            setFileSystemReports(fsReports);
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
  const allReports: UnifiedMedicalReport[] = [
    ...fileSystemReports.map(report => ({
      id: report.id,
      appointmentType: report.appointmentType || "Medicinski nalaz",
      doctor: report.doctor,
      date: report.date,
      verificationStatus: report.verified ? 'verified' as const : 'unverified' as const,
      report: report.report,
      therapy: report.therapy,
      notes: report.notes || "",
      patientId: report.patientId,
      doctorInfo: {
        fullName: report.doctor
      }
    })),
    ...reports
  ];

  // Remove duplicates (prioritize filesystem reports)
  const uniqueReports = Array.from(
    new Map(allReports.map(report => [report.id, report])).values()
  );
  
  const displayReports = uniqueReports.filter(report => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (report.appointmentType?.toLowerCase().includes(searchLower) || 
      (('doctor' in report) ? report.doctor.toLowerCase().includes(searchLower) : 
      (report.doctorInfo?.fullName?.toLowerCase().includes(searchLower) || false)) ||
      formatDate(report.date).includes(searchTerm))
    );
  });

  // Sort by date descending (newest first)
  displayReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleView = (report: UnifiedMedicalReport) => {
    setSelectedReport(report);
    setViewDialogOpen(true);
  };

  const handleEdit = (report: UnifiedMedicalReport) => {
    setReportToEdit(report);
    setEditReason("");
    setEditReasonDialogOpen(true);
  };

  const handleEditConfirm = () => {
    if (!editReason.trim()) {
      toast({
        title: "Greška",
        description: "Morate unijeti razlog promjene",
        variant: "destructive"
      });
      return;
    }

    // Log the edit reason
    console.log(`[MedicalReports] Edit reason for report ${reportToEdit.id}: ${editReason}`);
    
    // Store edit reason in localStorage for audit
    try {
      // Create new audit log for the edit action
      const newLog: AuditLog = {
        id: Date.now(),
        action: 'edit',
        entityType: 'report',
        entityId: reportToEdit.id,
        performedBy: user ? `${user.firstName} ${user.lastName}` : "Nepoznati korisnik",
        performedAt: new Date().toISOString(),
        details: `Uređivanje medicinskog nalaza: ${reportToEdit.appointmentType}`,
        reason: editReason,
        reportId: reportToEdit.id
      };
      
      // Get existing logs or initialize empty array
      const existingLogs = localStorage.getItem('auditLogs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      
      // Add new log
      logs.push(newLog);
      
      // Save updated logs
      localStorage.setItem('auditLogs', JSON.stringify(logs));
    } catch (error) {
      console.error("[MedicalReports] Error saving audit log:", error);
    }
    
    // Close the reason dialog and open the edit form
    setEditReasonDialogOpen(false);
    setSelectedReport(reportToEdit);
    setEditFormOpen(true);
    
    toast({
      title: "Pristup odobren",
      description: "Razlog je zabilježen i možete pristupiti uređivanju nalaza",
    });
  };

  const handlePrint = (reportId: string) => {
    // Make sure to pass the patient ID when navigating to print a report
    navigate(`/medical-reports?reportId=${reportId}&mode=print&patientId=${patient.id}`);
  };

  const handleSaveReport = (updatedReport: Partial<MedicalReport>) => {
    if (!selectedReport || !updatedReport) return;
    
    try {
      // Get existing reports
      const savedReports = localStorage.getItem('medicalReports');
      if (savedReports) {
        const allReports: MedicalReport[] = JSON.parse(savedReports);
        
        // Find and update the report
        const reportIndex = allReports.findIndex(r => r.id === selectedReport.id);
        
        if (reportIndex >= 0) {
          // Update existing report
          allReports[reportIndex] = {
            ...allReports[reportIndex],
            ...updatedReport,
            updatedAt: new Date().toISOString()
          };
        }
        
        // Save back to localStorage
        localStorage.setItem('medicalReports', JSON.stringify(allReports));
        
        // Update state
        setReports(prevReports => {
          const updated = [...prevReports];
          const index = updated.findIndex(r => r.id === selectedReport.id);
          if (index >= 0) {
            updated[index] = { ...updated[index], ...updatedReport };
          }
          return updated;
        });
        
        toast({
          title: "Uspješno",
          description: "Nalaz je uspješno ažuriran",
        });
        
        // Close the form
        setEditFormOpen(false);
      }
    } catch (error) {
      console.error("[MedicalReports] Error saving report:", error);
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom ažuriranja nalaza",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-medium">Medicinski nalazi</h3>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => navigate(`/medical-reports?patientId=${patient.id}`)}
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
          <Spinner className="mx-auto" />
          <p className="text-muted-foreground mt-2">Učitavanje nalaza...</p>
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
                      {formatDate(report.date)} · {
                        'doctor' in report ? report.doctor : report.doctorInfo?.fullName || "Doktor"
                      }
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleView(report)}
                  >
                    <Eye className="h-4 w-4 mr-1" /> Pregledaj
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(report)}
                  >
                    <Edit className="h-4 w-4 mr-1" /> Uredi
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handlePrint(report.id)}
                    disabled={report.verificationStatus !== 'verified'}
                    title={report.verificationStatus !== 'verified' ? "Samo verifikovani nalazi se mogu printati" : ""}
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
            onClick={() => navigate(`/medical-reports?patientId=${patient.id}`)}
          >
            Kreiraj novi nalaz
          </Button>
        </div>
      )}

      {/* Dialog for viewing reports */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Pregled nalaza</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="overflow-auto h-full py-4">
              <MedicalReportPreview
                patient={{ name: `Pacijent ${patient.id}` }}
                reportText={selectedReport.report}
                therapyText={selectedReport.therapy}
                showSignature={true}
                showStamp={selectedReport.verificationStatus === 'verified'}
                appointmentType={selectedReport.appointmentType}
                doctorName={'doctor' in selectedReport ? 
                  selectedReport.doctor : 
                  selectedReport.doctorInfo?.fullName || "Doktor"}
                onPrint={() => handlePrint(selectedReport.id)}
                onSave={() => {}}
                isSaved={true}
                verificationStatus={selectedReport.verificationStatus}
              />
              <div className="flex justify-end space-x-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setViewDialogOpen(false)}
                >
                  Zatvori
                </Button>
                <Button 
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleEdit(selectedReport);
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Uredi nalaz
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog for entering edit reason */}
      <Dialog open={editReasonDialogOpen} onOpenChange={setEditReasonDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Unesite razlog promjene</DialogTitle>
            <DialogDescription>
              Molimo unesite zašto želite urediti ovaj medicinski nalaz. Ova informacija će biti zabilježena radi sigurnosti.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              placeholder="Razlog promjene nalaza..."
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              className="min-h-[100px]"
              autoFocus
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditReasonDialogOpen(false)}
            >
              Odustani
            </Button>
            <Button 
              onClick={handleEditConfirm}
              disabled={!editReason.trim()}
            >
              Potvrdi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Form */}
      {selectedReport && (
        <MedicalReportForm
          open={editFormOpen}
          onOpenChange={setEditFormOpen}
          onSubmit={handleSaveReport}
          defaultValues={{
            id: selectedReport.id,
            patientId: selectedReport.patientId,
            report: selectedReport.report,
            therapy: selectedReport.therapy,
            notes: selectedReport.notes,
            appointmentType: selectedReport.appointmentType,
            status: 'final',
            visitType: 'followup',
          }}
          examinationTypes={[
            { id: 1, name: selectedReport.appointmentType, duration: "30min", price: "100" }
          ]}
        />
      )}
    </div>
  );
}
