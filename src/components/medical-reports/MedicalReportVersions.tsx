
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, FileText, Printer } from "lucide-react";
import { format } from "date-fns";
import type { MedicalReport, MedicalReportVersion } from "@/types/medical-report";

interface MedicalReportVersionsProps {
  report: MedicalReport;
  versions: MedicalReportVersion[];
  onClose: () => void;
  onPrint: (version: MedicalReportVersion) => void;
  onEdit: (version: MedicalReportVersion) => void;
}

export default function MedicalReportVersions({ 
  report, 
  versions, 
  onClose, 
  onPrint, 
  onEdit 
}: MedicalReportVersionsProps) {
  const [selectedVersion, setSelectedVersion] = useState<MedicalReportVersion>(versions[0]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd.MM.yyyy HH:mm");
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Report Versions</h2>
        <Button variant="outline" onClick={onClose}>Back</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-md p-4 md:col-span-1">
          <h3 className="font-medium mb-3">Version History</h3>
          <div className="space-y-2">
            {versions.map((version, index) => (
              <div 
                key={version.id}
                className={`p-3 rounded-md cursor-pointer flex items-center ${
                  selectedVersion.id === version.id 
                  ? 'bg-clinic-100 border border-clinic-200' 
                  : 'hover:bg-muted/50 border'
                }`}
                onClick={() => setSelectedVersion(version)}
              >
                <div className="mr-3 rounded-full bg-clinic-50 p-2 text-clinic-700">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Version {versions.length - index}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(version.createdAt)}
                  </p>
                  <p className="text-xs">By {version.createdBy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="border rounded-md p-4 md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-medium">Version {versions.findIndex(v => v.id === selectedVersion.id) + 1}</h3>
              <p className="text-sm text-muted-foreground">
                Created on {formatDate(selectedVersion.createdAt)} by {selectedVersion.createdBy}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onPrint(selectedVersion)}
              >
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEdit(selectedVersion)}
              >
                Edit
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="report">
            <TabsList className="mb-4">
              <TabsTrigger value="report">Report</TabsTrigger>
              <TabsTrigger value="therapy">Therapy</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="report" className="p-4 border rounded-md min-h-[200px] whitespace-pre-wrap">
              {selectedVersion.report}
            </TabsContent>
            
            <TabsContent value="therapy" className="p-4 border rounded-md min-h-[200px] whitespace-pre-wrap">
              {selectedVersion.therapy}
            </TabsContent>
            
            <TabsContent value="notes" className="p-4 border rounded-md min-h-[200px] whitespace-pre-wrap">
              {selectedVersion.notes || "No notes provided for this version."}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
