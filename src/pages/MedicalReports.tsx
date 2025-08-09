import { useState, useEffect, useRef } from "react";
import Header from "@/components/layout/Header";
import MedicalReportPreview from "@/components/medical-reports/MedicalReportPreview";
import MedicalReportForm from "@/components/medical-reports/MedicalReportForm";
import ReportVerification from "@/components/medical-reports/ReportVerification";
import PatientSelection from "@/components/medical-reports/PatientSelection";
import ExaminationTypeSelect from "@/components/medical-reports/ExaminationTypeSelect";
import ReportEditor from "@/components/medical-reports/ReportEditor";
import { useSaveData } from "@/hooks/useSaveData";
import { saveMedicalReport } from "@/utils/fileSystemUtils";
import { isAbsolutePath, normalizePath, createReportData, generateReportCode } from "@/utils/reportUtils";
import type { MedicalReport, ExaminationType } from "@/types/medical-report";
import type { Patient } from "@/types/patient";
import { ensurePatient } from "@/types/patient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/AuthContext";

// Mock data for examination types - would come from settings in a real app
const mockExaminationTypes: ExaminationType[] = [
  { id: 1, name: "Internistički pregled", duration: "30", price: "50" },
  { id: 2, name: "Kardiološki pregled", duration: "40", price: "80" },
  { id: 3, name: "Laboratorijski nalaz", duration: "20", price: "30" },
  { id: 4, name: "Oftalmološki pregled", duration: "25", price: "45" },
  { id: 5, name: "Pedijatrijski pregled", duration: "30", price: "40" },
];

// Mock current user/doctor
const currentDoctor = {
  id: "1",
  name: "Dr. Marko Marković",
  specialization: "Kardiolog"
};

export default function MedicalReports() {
  const { toast } = useToast();
  const { user } = useAuth(); // Get the current authenticated user
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [reportText, setReportText] = useState("");
  const [therapyText, setTherapyText] = useState("");
  const [selectedExamType, setSelectedExamType] = useState<string>("");
  const [hasSignature, setHasSignature] = useState(false);
  const [hasStamp, setHasStamp] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedReport, setSavedReport] = useState<Partial<MedicalReport> | null>(null);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [isFinalizingReport, setIsFinalizingReport] = useState(false);
  const reportPreviewRef = useRef<HTMLDivElement>(null);
  const [examinationTypes] = useState<ExaminationType[]>(mockExaminationTypes);
  const [isSavingToFileSystem, setIsSavingToFileSystem] = useState(false);
  const [reportCode, setReportCode] = useState<string | undefined>(undefined);

  // Auto-save for the report editor
  const { saveStatus, lastSaved } = useSaveData({
    data: {
      reportText,
      therapyText,
      selectedExamType,
      hasSignature,
      hasStamp,
      patientId: selectedPatient?.id
    },
    key: `report-editor-draft`,
    saveDelay: 1500,
    condition: !isSaved && selectedPatient !== null,
    onSave: async (data) => {
      console.log("[MedicalReports] Auto-saving editor draft:", data);
    }
  });

  useEffect(() => {
    // Check for dataFolderPath in localStorage on component mount
    const basePath = localStorage.getItem('dataFolderPath');
    if (basePath) {
      console.log("[MedicalReports] Data folder path found:", basePath);
      // Validate the path
      if (!isAbsolutePath(basePath)) {
        console.warn("[MedicalReports] Data folder path is not absolute:", basePath);
        toast({
          title: "Upozorenje",
          description: "Putanja do foldera nije apsolutna. Izvještaji možda neće biti spremljeni.",
          variant: "destructive",
        });
      }
    } else {
      console.warn("[MedicalReports] No data folder path found in localStorage");
    }
  }, [toast]);

  const handleSelectPatient = (patient: any) => {
    // Ensure patient has the correct gender type and name getter
    const typedPatient = ensurePatient({
      ...patient,
      gender: patient.gender as 'M' | 'F'
    });
    
    setSelectedPatient(typedPatient);
    // When a new patient is selected, reset the report state
    if (isSaved) {
      resetReportState();
    }
  };

  const resetReportState = () => {
    setReportText("");
    setTherapyText("");
    setSelectedExamType("");
    setIsSaved(false);
    setSavedReport(null);
    setHasSignature(false);
    setHasStamp(false);
    setReportCode(undefined); // Reset report code when creating new report
  };

  const handleCreateReport = async (data: Partial<MedicalReport>) => {
    // Will implement with Supabase later
    console.log('[MedicalReports] Creating medical report:', data);
    
    // Generate a report code if not already set
    const reportCodeToUse = data.reportCode || generateReportCode();
    
    // For now, simulate saving with an ID
    const savedReportData: Partial<MedicalReport> = {
      ...data,
      id: `report-${Date.now()}`,
      patientId: selectedPatient!.id.toString(),
      doctorId: currentDoctor.id,
      date: new Date().toISOString(),
      verificationStatus: data.status === 'final' ? 'pending' as const : 'unverified' as const,
      doctorInfo: {
        fullName: currentDoctor.name,
        specialization: currentDoctor.specialization
      },
      reportCode: reportCodeToUse, // Include the report code
    };
    
    // Update state with the report code
    setReportCode(reportCodeToUse);
    
    // Try to save to file system if available
    const basePath = localStorage.getItem('dataFolderPath');
    if (basePath && window.electron?.isElectron) {
      setIsSavingToFileSystem(true);
      try {
        console.log("[MedicalReports] Saving report to filesystem:", savedReportData);
        const normalizedPath = normalizePath(basePath);
        console.log("[MedicalReports] Using normalized path:", normalizedPath);
        
        const saved = await saveMedicalReport(
          normalizedPath, 
          selectedPatient!.id.toString(), 
          savedReportData
        );
        
        if (saved) {
          toast({
            title: "Uspješno spremljeno",
            description: "Nalaz je uspješno spremljen u folder Nalazi",
          });
        } else {
          toast({
            title: "Greška",
            description: "Nije moguće spremiti nalaz na disk. Provjerite putanju foldera.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("[MedicalReports] Error saving to file system:", error);
        toast({
          title: "Greška",
          description: "Došlo je do greške prilikom spremanja nalaza na disk.",
          variant: "destructive",
        });
      } finally {
        setIsSavingToFileSystem(false);
      }
    }
    
    setSavedReport(savedReportData);
    
    toast({
      title: "Nalaz sačuvan",
      description: data.status === 'final' 
        ? "Finalni nalaz je spreman za verifikaciju." 
        : "Nalaz je sačuvan kao nacrt.",
    });
    
    // Save to localStorage as well for compatibility
    try {
      const existingReports = JSON.parse(localStorage.getItem('medicalReports') || '[]');
      existingReports.push(savedReportData);
      localStorage.setItem('medicalReports', JSON.stringify(existingReports));
    } catch (error) {
      console.error("[MedicalReports] Error saving to localStorage:", error);
    }
    
    // If it's a final report, show verification dialog
    if (data.status === 'final') {
      setTimeout(() => {
        setIsVerificationDialogOpen(true);
      }, 500);
    }
  };

  const handleSaveReport = () => {
    // Validation before saving
    if (!selectedPatient) {
      toast({
        title: "Greška",
        description: "Molimo odaberite pacijenta prije spremanja nalaza.",
        variant: "destructive",
      });
      return;
    }
    
    if (!reportText.trim()) {
      toast({
        title: "Greška",
        description: "Unesite tekst nalaza prije spremanja.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedExamType) {
      toast({
        title: "Greška",
        description: "Odaberite vrstu pregleda prije spremanja nalaza.",
        variant: "destructive",
      });
      return;
    }

    // Ask if they want to finalize
    setShowFinalizeConfirm(true);
  };
  
  const handleFinalizeReport = (isFinal: boolean) => {
    setShowFinalizeConfirm(false);
    setIsFinalizingReport(true);
    
    const typedPatient = ensurePatient(selectedPatient!);
    
    // Use the helper function to create report data
    const values = {
      report: reportText,
      therapy: therapyText,
      notes: "",
      status: isFinal ? "final" as const : "draft" as const,
      appointmentType: selectedExamType,
      visitType: "first" as const
    };
    
    const defaultValues = {
      patientId: typedPatient.id.toString(),
      doctorId: currentDoctor.id,
      patientInfo: {
        fullName: typedPatient.name,
        birthDate: typedPatient.dob,
        gender: typedPatient.gender,
        jmbg: typedPatient.jmbg
      }
    };
    
    const reportData = createReportData(values, defaultValues, isFinal ? "final" : "draft");
    
    // Debug log for testing
    console.log("[MedicalReports] Report data to be saved:", reportData);

    // Simulate a delay for saving
    setTimeout(() => {
      handleCreateReport(reportData);
      setIsFinalizingReport(false);
      setIsSaved(true);
    }, 1000);
  };
  
  const handleVerifyReport = (reportId: string, doctorName: string) => {
    // In a real app, this would call your backend API
    if (savedReport) {
      const verifiedReport = {
        ...savedReport,
        verificationStatus: 'verified' as const,
        verifiedBy: doctorName,
        verifiedAt: new Date().toISOString()
      };
      
      setSavedReport(verifiedReport);
      
      // Log this action
      console.log('[MedicalReports] Report verified:', {
        reportId,
        verifiedBy: doctorName,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Nalaz verifikovan",
        description: "Nalaz je uspješno verifikovan i spreman za printanje.",
      });
    }
  };

  const generatePDF = () => {
    if (!reportPreviewRef.current) {
      toast({
        title: "Greška",
        description: "Nije moguće generisati PDF u ovom trenutku.",
        variant: "destructive",
      });
      return;
    }

    // Don't allow printing unverified reports
    if (savedReport?.verificationStatus !== 'verified') {
      toast({
        title: "Upozorenje",
        description: "Samo verifikovani nalaz može biti printovan.",
        variant: "destructive",
      });
      return;
    }

    // Log audit information about printing
    console.log('[MedicalReports] Audit log: Report printed', {
      reportId: savedReport?.id,
      patientId: selectedPatient?.id,
      doctorId: user?.id || currentDoctor.id,
      timestamp: new Date().toISOString()
    });
    
    // Get the current user's name for the print
    const currentUserName = user ? `${user.firstName} ${user.lastName}` : currentDoctor.name;
    const verifierName = savedReport?.verifiedBy || currentUserName;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Greška",
        description: "Nije moguće otvoriti prozor za printanje. Provjerite postavke browsera.",
        variant: "destructive",
      });
      return;
    }
    
    // Write proper HTML with all necessary styles to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Nalaz - ${selectedPatient?.name || 'Pacijent'}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            @media print {
              @page {
                size: A4;
                margin: 15mm;
              }
            }
            
            body {
              font-family: 'Open Sans', sans-serif;
              color: #333;
              line-height: 1.6;
              margin: 0;
              padding: 0;
            }
            
            .print-container {
              max-width: 210mm;
              margin: 0 auto;
              padding: 20px;
              box-sizing: border-box;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 30px;
              padding-bottom: 10px;
            }
            
            .clinic-name {
              font-weight: bold;
              font-size: 20px;
              color: #059669;
            }
            
            .clinic-info {
              font-size: 12px;
              color: #666;
              text-align: right;
            }
            
            .patient-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            
            .separator {
              border-top: 1px solid #e5e7eb;
              margin: 20px 0;
            }
            
            .report-code {
              font-weight: bold;
              background: #f9fafb;
              padding: 8px 12px;
              border: 1px solid #e5e7eb;
              border-radius: 4px;
              color: #059669;
              display: inline-block;
            }
            
            .exam-type {
              font-weight: medium;
              color: #059669;
              margin-top: 8px;
              text-align: right;
            }
            
            .verified-badge {
              display: flex;
              align-items: center;
              color: #059669;
              font-size: 12px;
              justify-content: flex-end;
              margin-top: 4px;
            }
            
            .verified-dot {
              height: 8px;
              width: 8px;
              background-color: #059669;
              border-radius: 50%;
              margin-right: 4px;
            }
            
            .content-section {
              margin-bottom: 30px;
            }
            
            .section-title {
              font-weight: bold;
              margin-bottom: 10px;
              font-size: 16px;
            }
            
            .content-box {
              padding: 15px;
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              min-height: 100px;
              white-space: pre-wrap;
            }
            
            .signature-area {
              display: flex;
              justify-content: flex-end;
              align-items: flex-end;
              margin-top: 60px;
              gap: 20px;
            }
            
            .signature-line {
              border-bottom: 1px solid #000;
              width: 120px;
              display: inline-block;
              margin-bottom: 4px;
            }
            
            .signature-name {
              font-size: 12px;
              color: #666;
              text-align: center;
            }
            
            .stamp {
              border: 2px dashed #ccc;
              border-radius: 50%;
              width: 100px;
              height: 100px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #999;
            }
            
            .footer {
              margin-top: 60px;
              padding-top: 10px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            
            @media print {
              .content-box {
                background: transparent;
                border: none;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="header">
              <div>
                ${localStorage.getItem('clinicInfo') ? 
                  JSON.parse(localStorage.getItem('clinicInfo') || '{}').logo ? 
                  `<img src="${JSON.parse(localStorage.getItem('clinicInfo') || '{}').logo}" alt="Clinic Logo" style="height: 60px; margin-bottom: 10px;">` : 
                  `<div class="clinic-name">${JSON.parse(localStorage.getItem('clinicInfo') || '{}').name || 'Spark Studio'}</div>` :
                  '<div class="clinic-name">Spark Studio</div>'}
              </div>
              <div class="clinic-info">
                ${(() => {
                  try {
                    const info = JSON.parse(localStorage.getItem('clinicInfo') || '{}');
                    return `
                      <div class="clinic-name">${info.name || 'Spark Studio'}</div>
                      <p>
                        ${info.address || 'Ozimice 1'}, ${info.city || 'Bihać'}<br>
                        ${info.email || 'spark.studio.dev@gmail.com'}<br>
                        ${info.phone || '387 61 123 456'}
                      </p>
                    `;
                  } catch (e) {
                    return `
                      <div class="clinic-name">Spark Studio</div>
                      <p>Ozimice 1, Bihać<br>spark.studio.dev@gmail.com<br>387 61 123 456</p>
                    `;
                  }
                })()}
              </div>
            </div>
            
            <div class="patient-info">
              <div>
                <p><strong>Ime i Prezime:</strong> ${selectedPatient ? selectedPatient.name : ""}</p>
                <p><strong>Datum rođenja:</strong> ${selectedPatient ? (() => {
                  try {
                    return new Date(selectedPatient.dob).toLocaleDateString('bs-BA', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    });
                  } catch (e) {
                    return selectedPatient.dob || "";
                  }
                })() : ""}</p>
                <p><strong>Spol:</strong> ${selectedPatient ? (selectedPatient.gender === "M" ? "Muški" : "Ženski") : ""}</p>
                <p><strong>JMBG:</strong> ${selectedPatient ? selectedPatient.jmbg : ""}</p>
                <p style="margin-top: 10px; font-size: 12px; color: #666;">
                  Datum i vrijeme izdavanja: ${new Date().toLocaleDateString('bs-BA', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <p style="font-size: 12px; color: #666;">
                  Izdao: ${currentUserName}
                </p>
              </div>
              <div style="text-align: right;">
                ${savedReport?.reportCode ? `
                <div class="report-code">
                  Broj nalaza: ${savedReport.reportCode}
                </div>
                ` : ''}
                ${selectedExamType ? `
                <div class="exam-type">
                  Vrsta pregleda: ${selectedExamType}
                </div>
                ` : ''}
                ${savedReport?.verificationStatus === 'verified' ? `
                <div class="verified-badge">
                  <div class="verified-dot"></div>
                  <span>Verificirano</span>
                </div>
                <p style="font-size: 12px; color: #666; margin-top: 4px;">
                  Verificirao: ${verifierName}
                </p>
                ` : ''}
              </div>
            </div>
            
            <div class="separator"></div>
            
            <div class="content-section">
              <div class="section-title">Nalaz</div>
              <div class="content-box">
                ${reportText || "Ovdje će biti prikazan tekst nalaza koji korisnik unosi..."}
              </div>
            </div>
            
            <div class="content-section">
              <div class="section-title">Terapija i preporuke</div>
              <div class="content-box">
                ${therapyText || "Ovdje će biti prikazana terapija i preporuke..."}
              </div>
            </div>
            
            ${hasSignature || hasStamp ? `
            <div class="signature-area">
              ${hasSignature ? `
                <div>
                  <div class="signature-line"></div>
                  <p class="signature-name">${currentUserName}</p>
                </div>
              ` : ''}
              
              ${hasStamp ? `
                <div class="stamp">Pečat</div>
              ` : ''}
            </div>
            ` : ''}
            
            <div class="footer">
              ${(() => {
                try {
                  const info = JSON.parse(localStorage.getItem('clinicInfo') || '{}');
                  return `${info.name || 'Spark Studio'} - ${info.address || 'Ozimice 1'}, ${info.city || 'Bihać'}<br>${info.phone || '387 61 123 456'} | ${info.email || 'spark.studio.dev@gmail.com'}`;
                } catch (e) {
                  return 'Spark Studio - Ozimice 1, Bihać<br>387 61 123 456 | spark.studio.dev@gmail.com';
                }
              })()}
            </div>
          </div>
          <script>
            // Open print dialog after everything is loaded
            window.addEventListener('load', function() {
              // Add a slight delay to ensure all fonts and styles are loaded
              setTimeout(() => {
                window.print();
              }, 500);
            });
            
            // Close window after printing
            window.addEventListener('afterprint', function() {
              window.close();
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    
    toast({
      title: "Printanje",
      description: "Dijalog za printanje je otvoren.",
    });
  };

  return (
    <div className="flex h-full flex-col">
      <Header title="Nalaz i Mišljenje" />
      
      <div className="page-container p-4">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm mb-6">
          <span className="text-muted-foreground">Početna</span>
          <span className="mx-2">›</span>
          <span className="text-emerald-600">Nalaz i Mišljenje</span>
        </div>
        
        <PatientSelection 
          selectedPatient={selectedPatient}
          onSelectPatient={handleSelectPatient}
        />
        
        {selectedPatient && (
          <ExaminationTypeSelect
            selectedExamType={selectedExamType}
            onSelectExamType={setSelectedExamType}
            examinationTypes={examinationTypes}
            disabled={isSaved}
          />
        )}

        <div className="mx-auto max-w-[1120px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReportEditor 
              reportText={reportText}
              therapyText={therapyText}
              onReportChange={setReportText}
              onTherapyChange={setTherapyText}
              hasSignature={hasSignature}
              hasStamp={hasStamp}
              onToggleSignature={() => setHasSignature(!hasSignature)}
              onToggleStamp={() => setHasStamp(!hasStamp)}
              isSaved={isSaved}
              verificationStatus={savedReport?.verificationStatus}
              onResetReport={resetReportState}
              onOpenVerification={() => setIsVerificationDialogOpen(true)}
              saveStatus={saveStatus}
              lastSaved={lastSaved}
              isSubmitting={isFinalizingReport}
              onSave={handleSaveReport}
              onPrint={generatePDF}
            />
            
            <MedicalReportPreview 
              ref={reportPreviewRef}
              patient={selectedPatient}
              reportText={reportText}
              therapyText={therapyText}
              showSignature={hasSignature}
              showStamp={hasStamp}
              onPrint={generatePDF}
              onSave={handleSaveReport}
              isSaved={isSaved}
              verificationStatus={savedReport?.verificationStatus}
              verifiedBy={savedReport?.verifiedBy}
              appointmentType={selectedExamType}
              doctorName={currentDoctor.name}
              reportCode={savedReport?.reportCode || reportCode}
            />
          </div>
        </div>
      </div>

      <MedicalReportForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreateReport}
        examinationTypes={examinationTypes}
      />
      
      {savedReport && (
        <ReportVerification
          open={isVerificationDialogOpen}
          onOpenChange={setIsVerificationDialogOpen}
          report={savedReport}
          onVerify={handleVerifyReport}
          currentDoctor={currentDoctor}
        />
      )}
      
      <Dialog open={showFinalizeConfirm} onOpenChange={setShowFinalizeConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Potvrda spremanja nalaza</DialogTitle>
            <DialogDescription>
              Želite li finalizovati nalaz ili sačuvati kao nacrt?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
            <Button 
              variant="outline"
              onClick={() => handleFinalizeReport(false)}
              disabled={isFinalizingReport}
            >
              {isFinalizingReport ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : null}
              Sačuvaj kao nacrt
            </Button>
            <Button
              onClick={() => handleFinalizeReport(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={isFinalizingReport}
            >
              {isFinalizingReport ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : null}
              Finaliziraj nalaz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
