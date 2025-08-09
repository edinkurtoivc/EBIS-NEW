
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import ClinicInfo from "@/components/settings/ClinicInfo";
import ExaminationTypes from "@/components/settings/ExaminationTypes";
import UsersManagement from "@/components/users/UsersManagement";
import DataFolderSelect from "@/components/settings/DataFolderSelect";
import BackupRestore from "@/components/settings/BackupRestore";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import UserRoles from "@/components/settings/UserRoles";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, AlertCircle, HardDrive } from "lucide-react";
import dataStorageService from "@/services/DataStorageService";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Settings() {
  const [dataFolderStatus, setDataFolderStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  const basePath = dataStorageService.basePath;
  const isElectron = typeof window !== 'undefined' && window.electron?.isElectron;
  
  useEffect(() => {
    checkDataFolder();
  }, []);
  
  const checkDataFolder = async () => {
    try {
      if (!basePath || !isElectron) {
        setDataFolderStatus('error');
        return;
      }
      
      const initialized = await dataStorageService.initialize();
      setDataFolderStatus(initialized ? 'ready' : 'error');
    } catch (error) {
      console.error("[Settings] Error checking data folder:", error);
      setDataFolderStatus('error');
    }
  };
  
  return (
    <div className="flex h-full flex-col">
      <Header title="Postavke" />
      <div className="page-container">
        {/* Display data storage section prominently at the top */}
        <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-center mb-4">
            <HardDrive className="h-6 w-6 mr-3 text-blue-600" />
            <h2 className="text-2xl font-semibold">Lokalno spremanje podataka</h2>
          </div>
          
          <p className="mb-4 text-muted-foreground">
            Odaberite gdje će se svi vaši podaci spremati na vašem računaru. Aplikacija automatski organizuje podatke po folderima.
          </p>
          
          {isElectron && (
            <div className="mb-6">
              {dataFolderStatus === 'ready' && basePath && (
                <Alert variant="default" className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertTitle>Lokacija podataka je aktivna</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Svi podaci se pohranjuju u: {basePath}
                  </AlertDescription>
                </Alert>
              )}
              
              {(dataFolderStatus === 'error' || !basePath) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Lokacija podataka nije definirana</AlertTitle>
                  <AlertDescription>
                    Molimo odaberite folder za pohranu podataka u sekciji "Lokacija podataka" ispod.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          <DataFolderSelect />
        </Card>
        
        <Tabs defaultValue="general" className="mb-6">
          <TabsList>
            <TabsTrigger value="general">Opće postavke</TabsTrigger>
            <TabsTrigger value="users">Korisnici i dozvole</TabsTrigger>
            <TabsTrigger value="data">Podaci i backup</TabsTrigger>
            <TabsTrigger value="appearance">Izgled</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ClinicInfo />
              <ExaminationTypes />
            </div>
          </TabsContent>
          
          <TabsContent value="users" className="mt-6">
            <div className="grid grid-cols-1 gap-6">
              <UserRoles />
              <UsersManagement />
            </div>
          </TabsContent>
          
          <TabsContent value="data" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BackupRestore />
            </div>
          </TabsContent>
          
          <TabsContent value="appearance" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AppearanceSettings />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
