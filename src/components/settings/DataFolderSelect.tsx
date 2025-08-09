
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  FolderOpen, 
  Check, 
  HardDrive, 
  RefreshCw,
  FolderSync,
  Info
} from "lucide-react";
import { initializeFileSystem, migrateData } from "@/utils/fileSystemUtils";
import dataStorageService from "@/services/DataStorageService";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isElectron as checkIsElectron } from "@/utils/isElectron";

export default function DataFolderSelect() {
  const { toast } = useToast();
  const [dataPath, setDataPath] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [folderSizeInfo, setFolderSizeInfo] = useState({
    usedSpace: "0 MB",
    totalSpace: "500 GB",
    percentage: 0,
  });
  const [isMigrating, setIsMigrating] = useState(false);
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [migrationNewPath, setMigrationNewPath] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Use the utility function to determine if Electron is available
  const isElectron = checkIsElectron();
  
  const loadInitialData = async () => {
    const savedPath = localStorage.getItem('dataFolderPath') || "";
    console.log("[DataFolderSelect] Initial data path from storage:", savedPath);
    
    if (savedPath) {
      setDataPath(savedPath);
      if (isElectron) {
        updateFolderInfo(savedPath);
      }
    }
  };
  
  useEffect(() => {
    loadInitialData();
  }, []);

  const updateFolderInfo = async (path: string) => {
    if (!isElectron || !path) return;
    
    try {
      console.log("[DataFolderSelect] Getting folder info for path:", path);
      const info = await window.electron.getFolderInfo(path);
      console.log("[DataFolderSelect] Folder info result:", info);
      setFolderSizeInfo(info);
    } catch (error) {
      console.error("Error getting folder info:", error);
    }
  };

  const handleSelectFolder = async () => {
    if (!isElectron) {
      toast({
        title: "Greška",
        description: "Ova funkcija je dostupna samo u desktop verziji aplikacije.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      console.log("[DataFolderSelect] Opening directory dialog...");
      const selectedPath = await window.electron.openDirectory();
      console.log("[DataFolderSelect] Selected path:", selectedPath);
      
      if (selectedPath) {
        // Check if we need to migrate data
        if (dataPath && dataPath !== selectedPath) {
          // Show migration dialog
          setMigrationNewPath(selectedPath);
          setShowMigrationDialog(true);
          return;
        }
        
        // Set the new path directly if no previous path
        await setFolderPath(selectedPath);
      }
    } catch (error) {
      console.error("[DataFolderSelect] Error selecting folder:", error);
      toast({
        title: "Greška",
        description: "Nije moguće odabrati folder.",
        variant: "destructive"
      });
    }
  };
  
  const setFolderPath = async (path: string) => {
    setDataPath(path);
    localStorage.setItem('dataFolderPath', path);
    
    setIsInitializing(true);
    // Initialize file structure
    try {
      const initialized = await initializeFileSystem(path);
      
      if (initialized) {
        dataStorageService.basePath = path;
        await dataStorageService.initialize(path);
        updateFolderInfo(path);
        
        toast({
          title: "Folder odabran",
          description: "Nova lokacija je postavljena za spremanje podataka."
        });
      } else {
        toast({
          title: "Greška",
          description: "Nije moguće inicijalizirati strukturu foldera.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error initializing folder structure:", error);
      toast({
        title: "Greška",
        description: "Nije moguće inicijalizirati strukturu foldera.",
        variant: "destructive"
      });
    } finally {
      setIsInitializing(false);
    }
  };
  
  const handleMigrateData = async () => {
    if (!dataPath || !migrationNewPath || dataPath === migrationNewPath) {
      setShowMigrationDialog(false);
      return;
    }
    
    setIsMigrating(true);
    
    try {
      const migrated = await migrateData(dataPath, migrationNewPath);
      
      if (migrated) {
        await setFolderPath(migrationNewPath);
        
        toast({
          title: "Uspješno",
          description: "Podaci su uspješno premješteni na novu lokaciju."
        });
      } else {
        toast({
          title: "Greška",
          description: "Nije moguće premjestiti podatke na novu lokaciju.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error migrating data:", error);
      toast({
        title: "Greška",
        description: "Došlo je do greške pri premještanju podataka.",
        variant: "destructive"
      });
    } finally {
      setIsMigrating(false);
      setShowMigrationDialog(false);
    }
  };
  
  const handleSaveLocation = async () => {
    if (!dataPath) {
      toast({
        title: "Greška",
        description: "Morate odabrati folder za spremanje podataka.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Initialize file structure if needed
      if (isElectron) {
        setIsInitializing(true);
        const initialized = await initializeFileSystem(dataPath);
        
        if (initialized) {
          dataStorageService.basePath = dataPath;
          await dataStorageService.initialize(dataPath);
        } else {
          throw new Error("Nije moguće inicijalizirati strukturu foldera.");
        }
        setIsInitializing(false);
      }
      
      // Save the path to localStorage
      localStorage.setItem('dataFolderPath', dataPath);
      
      toast({
        title: "Uspješno",
        description: "Lokacija za podatke je uspješno spremljena.",
      });
    } catch (error) {
      console.error("Greška pri spremanju lokacije:", error);
      toast({
        title: "Greška",
        description: "Dogodila se greška pri spremanju lokacije.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleForceReinitialization = async () => {
    if (!dataPath) {
      toast({
        title: "Greška",
        description: "Prvo odaberite folder za podatke.",
        variant: "destructive"
      });
      return;
    }
    
    setIsInitializing(true);
    
    try {
      const initialized = await initializeFileSystem(dataPath);
      
      if (initialized) {
        dataStorageService.basePath = dataPath;
        await dataStorageService.initialize(dataPath);
        updateFolderInfo(dataPath);
        
        toast({
          title: "Uspješno",
          description: "Struktura foldera je uspješno reinicijalizirana.",
        });
      } else {
        toast({
          title: "Greška",
          description: "Nije moguće reinicijalizirati strukturu foldera.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error reinitializing folder structure:", error);
      toast({
        title: "Greška",
        description: "Nije moguće reinicijalizirati strukturu foldera.",
        variant: "destructive"
      });
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <>
      <Card className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Lokacija podataka</h2>
              <p className="text-muted-foreground">
                Odaberite gdje želite da se vaši podaci spremaju lokalno
              </p>
            </div>
            {dataPath && dataStorageService.isInitialized && (
              <Alert variant="default" className="max-w-fit bg-green-50 text-green-800 border-green-200 p-2">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-xs">Lokalno spremanje aktivno</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-medium block">Struktura podataka</label>
            <div className="bg-muted p-3 rounded-md text-sm">
              <p className="mb-2">Vaši podaci će biti organizovani u sljedećoj strukturi:</p>
              <pre className="text-xs overflow-x-auto">
{`📂 [Lokacija]
├── 📂 Pacijenti/
├── 📂 Korisnici/
├── 📂 Termini/
├── 📂 Nalazi/
├── 📂 VrstePregleda/
├── 📂 Postavke/
├── 📂 SigurnosneKopije/
└── log.txt`}
              </pre>
            </div>
            
            <label className="text-sm font-medium block mt-4">Trenutna lokacija podataka</label>
            
            <div className="flex gap-3">
              <Input 
                value={dataPath} 
                onChange={(e) => setDataPath(e.target.value)}
                placeholder={isElectron ? "Odaberite folder klikom na gumb" : "/putanja/do/vašeg/foldera"}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                onClick={handleSelectFolder}
                disabled={isInitializing}
                data-testid="select-folder-button"
                type="button"
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Odaberi folder
              </Button>
            </div>
            
            <div className="flex justify-between">
              <Button 
                variant="outline"
                onClick={handleForceReinitialization} 
                disabled={isInitializing || !dataPath}
                type="button"
              >
                {isInitializing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Reinicijalizacija...
                  </>
                ) : (
                  <>
                    <FolderSync className="mr-2 h-4 w-4" />
                    Reinicijaliziraj strukturu
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleSaveLocation} 
                disabled={isSaving || !dataPath || isInitializing}
                type="button"
              >
                <Check className="mr-2 h-4 w-4" />
                {isSaving ? "Spremanje..." : "Spremi lokaciju"}
              </Button>
            </div>
            
            <div className="mt-2 flex items-center text-xs text-muted-foreground">
              <Info className="h-3 w-3 mr-1" />
              <span>Svi podaci će biti spremljeni lokalno u odabranom folderu</span>
            </div>
          </div>
          
          {dataPath && (
            <div className="border-t pt-6">
              <div className="flex items-center gap-3 mb-4">
                <HardDrive className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Informacije o prostoru</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Iskorišteno:</span>
                  <span className="font-medium">{folderSizeInfo.usedSpace}</span>
                </div>
                
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-clinic-600 rounded-full"
                    style={{ width: `${folderSizeInfo.percentage}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {folderSizeInfo.percentage.toFixed(2)}% iskorišteno
                  </span>
                  <span className="text-muted-foreground">
                    Ukupno: {folderSizeInfo.totalSpace}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
      
      <Dialog open={showMigrationDialog} onOpenChange={setShowMigrationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Premještanje podataka</DialogTitle>
            <DialogDescription>
              Želite li premjestiti postojeće podatke na novu lokaciju?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm mb-4">
              Trenutna lokacija: <span className="font-medium">{dataPath}</span>
            </p>
            <p className="text-sm mb-4">
              Nova lokacija: <span className="font-medium">{migrationNewPath}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Ova akcija će kopirati sve podatke sa trenutne lokacije na novu lokaciju.
            </p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMigrationDialog(false)}
              disabled={isMigrating}
              type="button"
            >
              Odustani
            </Button>
            <Button 
              onClick={handleMigrateData} 
              disabled={isMigrating}
              type="button"
            >
              {isMigrating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Premještanje...
                </>
              ) : (
                "Premjesti podatke"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
