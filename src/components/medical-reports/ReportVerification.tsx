
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { CheckCircle, ShieldCheck } from "lucide-react";
import type { MedicalReport } from "@/types/medical-report";
import { useAuth } from "@/contexts/AuthContext";
import type { AuditLog } from "@/types/patient";

interface ReportVerificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: Partial<MedicalReport>;
  onVerify: (reportId: string, doctorName: string) => void;
  currentDoctor: {
    id: string;
    name: string;
    specialization?: string;
  };
}

export default function ReportVerification({
  open,
  onOpenChange,
  report,
  onVerify,
  currentDoctor
}: ReportVerificationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const { user } = useAuth();

  // Get the verified by name from authenticated user if available
  const verifiedByName = user ? `${user.firstName} ${user.lastName}` : currentDoctor.name;

  const handleVerify = () => {
    setIsVerifying(true);
    if (report.id) {
      onVerify(report.id, verifiedByName);
      
      // Log this verification action
      logVerificationActivity(report.id, verifiedByName, report.patientInfo?.fullName || "");
      
      setTimeout(() => {
        setIsVerifying(false);
        onOpenChange(false);
      }, 1000);
    }
  };

  // Function to log verification activity
  const logVerificationActivity = (reportId: string, verifierName: string, patientName: string) => {
    try {
      const newLog: AuditLog = {
        id: Date.now(),
        action: 'verify',
        entityType: 'report',
        entityId: reportId,
        performedBy: verifierName,
        performedAt: new Date().toISOString(),
        details: `Verifikacija nalaza za pacijenta ${patientName}`,
        reportId: reportId
      };
      
      // Get existing logs or initialize empty array
      const existingLogs = localStorage.getItem('auditLogs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      
      // Add new log
      logs.push(newLog);
      
      // Save updated logs
      localStorage.setItem('auditLogs', JSON.stringify(logs));
      
      console.log(`[ReportVerification] Activity logged: verification of report ${reportId} by ${verifierName}`);
    } catch (error) {
      console.error("[ReportVerification] Error logging activity:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ShieldCheck className="h-5 w-5 mr-2 text-green-600" />
            Verifikacija nalaza
          </DialogTitle>
          <DialogDescription>
            Pregled i potvrda finalnog nalaza prije nego što postane dostupan za printanje.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="border-l-4 border-green-500 pl-3">
            <p className="text-sm font-medium mb-1">Vrsta pregleda</p>
            <p className="text-sm">{report.appointmentType || "Nije navedeno"}</p>
          </div>
          
          <div className="border-l-4 border-blue-500 pl-3">
            <p className="text-sm font-medium mb-1">Nalaz</p>
            <p className="text-sm whitespace-pre-wrap">{report.report}</p>
          </div>
          
          <div className="border-l-4 border-purple-500 pl-3">
            <p className="text-sm font-medium mb-1">Terapija</p>
            <p className="text-sm whitespace-pre-wrap">{report.therapy}</p>
          </div>
          
          {report.notes && (
            <div className="border-l-4 border-gray-400 pl-3">
              <p className="text-sm font-medium mb-1">Napomene</p>
              <p className="text-sm whitespace-pre-wrap">{report.notes}</p>
            </div>
          )}
          
          <div className="bg-green-50 p-3 rounded-md">
            <p className="text-sm">
              Verifikacijom potvrđujete da je nalaz kompletan i ispravan.
              Nalaz će biti označen kao verifikovan od strane <strong>{verifiedByName}</strong>.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Odustani
          </Button>
          <Button onClick={handleVerify} disabled={isVerifying} className="bg-green-600 hover:bg-green-700">
            {isVerifying ? (
              <span className="flex items-center">Verifikacija u toku...</span>
            ) : (
              <span className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" /> Verifikuj nalaz
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
