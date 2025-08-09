
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

export default function UserProfile() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [stampFile, setStampFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [stampPreview, setStampPreview] = useState<string | null>(null);
  
  // Mock user data
  const [userData, setUserData] = useState({
    firstName: "John",
    lastName: "Smith",
    email: "dr.smith@clinic.com",
    phone: "+123456789",
    birthDate: "1980-05-15",
    specialization: "Cardiology",
    hasSignature: false,
    hasStamp: false,
  });

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSignatureFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setStampFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setStampPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // In a real app, this would update the user profile in the database
    setUserData({
      ...userData,
      hasSignature: !!signaturePreview,
      hasStamp: !!stampPreview,
    });
    setIsEditing(false);
    
    toast({
      title: "Profil ažuriran",
      description: "Vaš profil je uspješno ažuriran",
    });
  };

  const handleChangePassword = () => {
    toast({
      title: "Email poslan",
      description: "Email za promjenu šifre je poslan na vašu email adresu",
    });
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Vaš profil</h2>
          <p className="text-muted-foreground">
            Uredite vaše osobne informacije i potpis
          </p>
        </div>
        <Button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
        >
          {isEditing ? "Sačuvaj promjene" : "Uredi profil"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <Label className="font-medium mb-2 block">Ime</Label>
          <Input 
            value={userData.firstName}
            onChange={e => setUserData({...userData, firstName: e.target.value})}
            readOnly={!isEditing}
            className={!isEditing ? "bg-muted" : ""}
          />
        </div>
        
        <div>
          <Label className="font-medium mb-2 block">Prezime</Label>
          <Input 
            value={userData.lastName}
            onChange={e => setUserData({...userData, lastName: e.target.value})}
            readOnly={!isEditing}
            className={!isEditing ? "bg-muted" : ""}
          />
        </div>
        
        <div>
          <Label className="font-medium mb-2 block">Email</Label>
          <Input 
            value={userData.email}
            onChange={e => setUserData({...userData, email: e.target.value})}
            readOnly={!isEditing}
            className={!isEditing ? "bg-muted" : ""}
            type="email"
          />
        </div>
        
        <div>
          <Label className="font-medium mb-2 block">Telefon</Label>
          <Input 
            value={userData.phone}
            onChange={e => setUserData({...userData, phone: e.target.value})}
            readOnly={!isEditing}
            className={!isEditing ? "bg-muted" : ""}
          />
        </div>
        
        <div>
          <Label className="font-medium mb-2 block">Datum rođenja</Label>
          <Input 
            value={userData.birthDate}
            onChange={e => setUserData({...userData, birthDate: e.target.value})}
            readOnly={!isEditing}
            className={!isEditing ? "bg-muted" : ""}
            type="date"
          />
        </div>
        
        <div>
          <Label className="font-medium mb-2 block">Specijalizacija</Label>
          <Input 
            value={userData.specialization}
            onChange={e => setUserData({...userData, specialization: e.target.value})}
            readOnly={!isEditing}
            className={!isEditing ? "bg-muted" : ""}
          />
        </div>
      </div>

      <Separator className="my-6" />
      
      <h3 className="text-lg font-semibold mb-4">Šifra</h3>
      <div className="flex items-center mb-6">
        <p className="text-muted-foreground flex-1">
          Promjena šifre zahtjeva potvrdu putem email-a
        </p>
        <Button variant="outline" onClick={handleChangePassword}>
          Promijeni šifru
        </Button>
      </div>

      <Separator className="my-6" />
      
      <h3 className="text-lg font-semibold mb-4">Potpis i pečat</h3>
      <p className="text-muted-foreground mb-4">
        Vaš potpis i pečat će se automatski dodati na nalaz kada ga kreirate
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label className="font-medium mb-2 block">Potpis</Label>
          {isEditing ? (
            <Input 
              type="file" 
              accept="image/*"
              onChange={handleSignatureChange}
            />
          ) : (
            userData.hasSignature || signaturePreview ? (
              <div className="border rounded-md p-4 flex items-center justify-center h-24">
                {signaturePreview && (
                  <img 
                    src={signaturePreview} 
                    alt="Potpis" 
                    className="max-h-full"
                  />
                )}
                {!signaturePreview && userData.hasSignature && (
                  <div className="text-center border-b border-black w-32 pb-1">
                    <p className="text-xs text-muted-foreground mt-1">
                      {userData.firstName} {userData.lastName}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Niste dodali potpis</p>
            )
          )}
        </div>
        
        <div>
          <Label className="font-medium mb-2 block">Pečat</Label>
          {isEditing ? (
            <Input 
              type="file" 
              accept="image/*"
              onChange={handleStampChange}
            />
          ) : (
            userData.hasStamp || stampPreview ? (
              <div className="border rounded-md p-4 flex items-center justify-center h-24">
                {stampPreview && (
                  <img 
                    src={stampPreview} 
                    alt="Pečat" 
                    className="max-h-full"
                  />
                )}
                {!stampPreview && userData.hasStamp && (
                  <div className="border-2 border-dashed border-gray-300 rounded-full w-20 h-20 flex items-center justify-center text-gray-400">
                    Pečat
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Niste dodali pečat</p>
            )
          )}
        </div>
      </div>
      
      {isEditing && (
        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Odustani
          </Button>
          <Button onClick={handleSave}>
            Sačuvaj promjene
          </Button>
        </div>
      )}
    </Card>
  );
}
