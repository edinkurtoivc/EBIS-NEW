
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, AlertTriangle } from "lucide-react";

export default function BackupRestore() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  
  // U stvarnosti, ovo bismo dohvatili iz lokalnog spremišta ili baze podataka
  useState(() => {
    const storedDate = localStorage.getItem('lastBackupDate');
    if (storedDate) {
      setLastBackupDate(storedDate);
    }
  });

  const handleCreateBackup = async () => {
    try {
      setIsExporting(true);
      
      // Simulacija stvaranja sigurnosne kopije
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const currentDate = new Date().toISOString();
      setLastBackupDate(currentDate);
      localStorage.setItem('lastBackupDate', currentDate);
      
      // U stvarnoj aplikaciji, ovo bi kreiralo sigurnosnu kopiju podataka
      toast({
        title: "Sigurnosna kopija kreirana",
        description: "Podaci su uspješno sačuvani na vaš računar.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Nije bilo moguće kreirati sigurnosnu kopiju.",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleRestoreBackup = async () => {
    try {
      setIsImporting(true);
      
      // Simulacija učitavanja sigurnosne kopije
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // U stvarnoj aplikaciji, ovo bi učitalo podatke iz sigurnosne kopije
      toast({
        title: "Podaci obnovljeni",
        description: "Sigurnosna kopija je uspješno učitana.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Nije bilo moguće učitati sigurnosnu kopiju.",
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('bs-BA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Sigurnosne kopije podataka</h2>
          <p className="text-muted-foreground">
            Kreirajte ili učitajte sigurnosne kopije vaših podataka
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium mb-4">Kreiranje sigurnosne kopije</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Kreirajte sigurnosnu kopiju svih podataka vaše prakse. Ovo će spremiti sve pacijente, 
            termine, nalaze i konfiguracije sistema.
          </p>
          
          {lastBackupDate && (
            <p className="text-sm mb-4">
              Posljednja sigurnosna kopija: <span className="font-medium">{formatDate(lastBackupDate)}</span>
            </p>
          )}
          
          <Button 
            onClick={handleCreateBackup} 
            disabled={isExporting}
            className="flex items-center"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Kreiranje kopije..." : "Kreiraj sigurnosnu kopiju"}
          </Button>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4">Učitavanje sigurnosne kopije</h3>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 mb-4">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Upozorenje</p>
                <p className="text-sm text-amber-700">
                  Učitavanje sigurnosne kopije će zamijeniti sve trenutne podatke. 
                  Ova akcija se ne može poništiti.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
            <Input 
              type="file" 
              accept=".backup" 
              disabled={isImporting}
              className="max-w-xs"
            />
            <Button 
              variant="outline" 
              onClick={handleRestoreBackup} 
              disabled={isImporting}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isImporting ? "Učitavanje..." : "Učitaj kopiju"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
