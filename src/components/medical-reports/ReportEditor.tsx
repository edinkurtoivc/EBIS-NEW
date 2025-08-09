
import { Bold, Italic, Underline, Signature, Stamp, Save, ShieldCheck, RefreshCw, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AutoSaveIndicator } from "@/components/ui/auto-save-indicator";

interface ReportEditorProps {
  reportText: string;
  therapyText: string;
  onReportChange: (text: string) => void;
  onTherapyChange: (text: string) => void;
  hasSignature: boolean;
  hasStamp: boolean;
  onToggleSignature: () => void;
  onToggleStamp: () => void;
  isSaved: boolean;
  verificationStatus?: 'unverified' | 'pending' | 'verified';
  onResetReport: () => void;
  onOpenVerification: () => void;
  saveStatus?: "saving" | "saved" | "error" | "offline" | "idle" | "pending";
  lastSaved?: Date | null;
  isSubmitting?: boolean;
  onSave?: () => void;
  onPrint?: () => void;
}

export default function ReportEditor({
  reportText,
  therapyText,
  onReportChange,
  onTherapyChange,
  hasSignature,
  hasStamp,
  onToggleSignature,
  onToggleStamp,
  isSaved,
  verificationStatus,
  onResetReport,
  onOpenVerification,
  saveStatus,
  lastSaved,
  isSubmitting,
  onSave,
  onPrint
}: ReportEditorProps) {
  // Helper function to determine if we're in Electron
  const isElectronEnv = () => {
    return typeof window !== 'undefined' && 
           (window.electron?.isElectron === true || 
           (typeof navigator === 'object' && 
            typeof navigator.userAgent === 'string' && 
            navigator.userAgent.indexOf('Electron') >= 0));
  };

  // Determine if buttons should be visible
  const showSaveButton = !isSaved && onSave;
  const showPrintButton = !!onPrint;
  const canPrint = isSaved && verificationStatus === 'verified';
  
  return (
    <div className="w-full max-w-[560px]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-emerald-600">Editor za nalaz</h2>
        {saveStatus && (
          <AutoSaveIndicator status={saveStatus} lastSaved={lastSaved} />
        )}
      </div>
      
      <div className="border rounded-md p-2 mb-4">
        <div className="flex gap-2 mb-2">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={isSaved}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={isSaved}>
            <Italic className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={isSaved}>
            <Underline className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="border rounded-md p-4 h-[300px] mb-6">
        <textarea 
          className="w-full h-full outline-none resize-none" 
          placeholder="Unesite tekst nalaza..."
          value={reportText}
          onChange={(e) => onReportChange(e.target.value)}
          disabled={isSaved || isSubmitting}
        />
      </div>
      
      <h2 className="text-xl font-semibold mb-4 text-emerald-600">Terapija i preporuke</h2>
      <div className="border rounded-md p-4 h-[200px] mb-4">
        <textarea 
          className="w-full h-full outline-none resize-none" 
          placeholder="Unesite terapiju i preporuke..."
          value={therapyText}
          onChange={(e) => onTherapyChange(e.target.value)}
          disabled={isSaved || isSubmitting}
        />
      </div>
      
      <div className="flex items-center space-x-4 mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          className={`flex items-center gap-2 ${hasSignature ? 'bg-emerald-100' : ''}`}
          onClick={onToggleSignature}
          disabled={isSaved || isSubmitting}
        >
          <Signature className="h-4 w-4" /> {hasSignature ? 'Potpis dodan' : 'Dodaj potpis'}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className={`flex items-center gap-2 ${hasStamp ? 'bg-emerald-100' : ''}`}
          onClick={onToggleStamp}
          disabled={isSaved || isSubmitting}
        >
          <Stamp className="h-4 w-4" /> {hasStamp ? 'Pečat dodan' : 'Dodaj pečat'}
        </Button>
      </div>

      {/* Always display the buttons container */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Save Button - Explicitly show when it should be visible */}
        {showSaveButton && (
          <Button 
            onClick={onSave}
            disabled={isSubmitting}
            className="flex-1 min-w-[150px] bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            {isSubmitting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Spremi nalaz
          </Button>
        )}
        
        {/* Print button - Always show, but disable when appropriate */}
        {showPrintButton && (
          <Button 
            variant={canPrint ? "default" : "outline"}
            onClick={onPrint} 
            disabled={!canPrint}
            className={`whitespace-nowrap min-w-[120px] ${canPrint ? "bg-blue-600 hover:bg-blue-700" : ""}`}
            title={!isSaved ? "Nalaz mora biti sačuvan prije printanja" : 
                verificationStatus !== 'verified' ? "Nalaz mora biti verifikovan prije printanja" : ""}
          >
            <Printer className="h-4 w-4 mr-2" /> Print i PDF
          </Button>
        )}
      </div>
      
      {isSaved && (
        <div className="flex justify-between mt-4">
          <Button 
            variant="outline"
            onClick={onResetReport}
          >
            Novi nalaz
          </Button>
          
          <div className="flex space-x-2">
            {/* Only show verification button if status is pending */}
            {verificationStatus === 'pending' && (
              <Button 
                variant="outline"
                className="border-green-500 text-green-600"
                onClick={onOpenVerification}
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                Verifikuj nalaz
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Debug information - remove in production */}
      {isElectronEnv() && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-500 hidden">
          <p>Running in Electron: {isElectronEnv() ? 'Yes' : 'No'}</p>
          <p>Save button should show: {showSaveButton ? 'Yes' : 'No'}</p>
          <p>Print button should show: {showPrintButton ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
}
