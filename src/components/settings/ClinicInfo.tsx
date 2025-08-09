
import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Check, RefreshCw } from "lucide-react";
import { useSaveData } from "@/hooks/useSaveData";

interface ClinicData {
  name: string;
  address: string;
  city: string;
  canton: string;
  phone: string;
  email: string;
  logo?: string;
}

export default function ClinicInfo() {
  const [isEditing, setIsEditing] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const [clinicData, setClinicData] = useState<ClinicData>({
    name: "Spark Studio",
    address: "Ozimice 1",
    city: "Bihać",
    canton: "Unsko-sanski kanton",
    phone: "387 61 123 456",
    email: "spark.studio.dev@gmail.com",
  });
  
  // Koristi useSaveData hook za automatsko spremanje
  const { forceSave, isSaving: autoSaving, saveStatus } = useSaveData({
    data: clinicData,
    key: "clinic-info",
    saveDelay: 1000,
    onSave: async (data) => {
      console.log("[ClinicInfo] Auto-saving clinic data:", data);
      localStorage.setItem('clinicInfo', JSON.stringify(data));
    },
    onDataLoaded: (loadedData) => {
      console.log("[ClinicInfo] Loaded clinic data from auto-save:", loadedData);
      setClinicData(loadedData);
      if (loadedData.logo) {
        setLogo(loadedData.logo);
      }
    }
  });

  // Učitaj podatke o klinici prilikom inicijalizacije
  useEffect(() => {
    const savedInfo = localStorage.getItem('clinicInfo');
    const savedLogo = localStorage.getItem('clinicLogo');
    
    if (savedInfo) {
      try {
        const parsedInfo = JSON.parse(savedInfo);
        setClinicData(parsedInfo);
        console.log("[ClinicInfo] Loaded clinic info from localStorage:", parsedInfo);
      } catch (error) {
        console.error("[ClinicInfo] Error parsing clinic info:", error);
      }
    }
    
    if (savedLogo) {
      setLogo(savedLogo);
    }
  }, []);
  
  const handleInputChange = (field: keyof ClinicData, value: string) => {
    setClinicData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    // Provjera da li je PNG
    if (!file.type.includes('png')) {
      toast({
        title: "Greška",
        description: "Dozvoljen je samo PNG format za logotip.",
        variant: "destructive"
      });
      return;
    }
    
    // Pretvaranje slike u base64 string
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setLogo(base64);
      
      // Spremanje u localStorage za perzistentnost
      localStorage.setItem('clinicLogo', base64);
      
      // Spremi logo u clinic data
      setClinicData(prev => ({
        ...prev,
        logo: base64
      }));
      
      toast({
        title: "Uspješno",
        description: "Logotip prakse je uspješno učitan.",
      });
    };
    
    reader.readAsDataURL(file);
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const handleSaveChanges = async () => {
    console.log("[ClinicInfo] Saving clinic info:", clinicData);
    try {
      // Spremi podatke o klinici
      localStorage.setItem('clinicInfo', JSON.stringify(clinicData));
      
      // Spremi logo ako postoji
      if (logo) {
        localStorage.setItem('clinicLogo', logo);
      }
      
      await forceSave();
      
      // Završi uređivanje
      setIsEditing(false);
      
      toast({
        title: "Uspješno spremljeno",
        description: "Podaci o klinici su uspješno ažurirani."
      });
      
    } catch (error) {
      console.error("[ClinicInfo] Error saving clinic data:", error);
      toast({
        title: "Greška",
        description: "Došlo je do greške pri spremanju podataka.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Informacije o privatnoj praksi</h2>
          <p className="text-muted-foreground">
            Ažurirajte podatke za vašu privatnu praksu
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => isEditing ? handleSaveChanges() : setIsEditing(true)}
        >
          {isEditing ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Sačuvaj
            </>
          ) : "Uredi"}
        </Button>
      </div>
      
      {/* Sekcija za logotip */}
      <div className="mb-6">
        <h3 className="font-medium mb-2">Logotip prakse</h3>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 border rounded-md flex items-center justify-center bg-gray-50">
            {logo ? (
              <img 
                src={logo} 
                alt="Logotip klinike" 
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <span className="text-muted-foreground text-sm text-center p-2">
                Nije učitan logotip
              </span>
            )}
          </div>
          <div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={triggerFileInput}
              className="mb-1"
            >
              <Upload className="h-4 w-4 mr-2" /> Učitaj logotip
            </Button>
            <p className="text-xs text-muted-foreground">Samo PNG format, maksimalno 2MB</p>
            
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden"
              accept="image/png"
              onChange={handleLogoUpload}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="font-medium mb-2 block">Naziv privatne prakse</label>
          <Input 
            value={clinicData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            readOnly={!isEditing}
            className={!isEditing ? "bg-muted" : ""}
          />
        </div>
        
        <div>
          <label className="font-medium mb-2 block">Adresa privatne prakse</label>
          <Input 
            value={clinicData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            readOnly={!isEditing}
            className={!isEditing ? "bg-muted" : ""}
          />
        </div>
        
        <div>
          <label className="font-medium mb-2 block">Grad</label>
          <Input 
            value={clinicData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            readOnly={!isEditing}
            className={!isEditing ? "bg-muted" : ""}
          />
        </div>
        
        <div>
          <label className="font-medium mb-2 block">Kanton</label>
          <Input 
            value={clinicData.canton}
            onChange={(e) => handleInputChange('canton', e.target.value)}
            readOnly={!isEditing}
            className={!isEditing ? "bg-muted" : ""}
          />
        </div>
        
        <div>
          <label className="font-medium mb-2 block">Telefonski broj</label>
          <Input 
            value={clinicData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            readOnly={!isEditing}
            className={!isEditing ? "bg-muted" : ""}
          />
        </div>
        
        <div>
          <label className="font-medium mb-2 block">Email</label>
          <Input 
            value={clinicData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            readOnly={!isEditing}
            className={!isEditing ? "bg-muted" : ""}
          />
        </div>
      </div>
      
      {/* Indicator za automatsko spremanje */}
      {autoSaving && isEditing && (
        <div className="mt-4 text-sm text-blue-500 flex items-center gap-2">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Spremanje promjena...
        </div>
      )}
    </Card>
  );
}
