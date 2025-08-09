import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import AppointmentsList from "@/components/appointments/AppointmentsList";
import AppointmentForm from "@/components/appointments/AppointmentForm";
import type { Appointment } from "@/types/medical-report";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import dataStorageService from "@/services/DataStorageService";

export default function Appointments() {
  const [isCreating, setIsCreating] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
  // Učitaj termine pri inicijalnom renderiranju
  useEffect(() => {
    loadAppointments();
  }, []);
  
  const loadAppointments = async () => {
    try {
      const loadedAppointments = await dataStorageService.getAppointments();
      setAppointments(loadedAppointments);
      console.log("[Appointments] Loaded appointments:", loadedAppointments);
    } catch (error) {
      console.error("[Appointments] Error loading appointments:", error);
      toast({
        title: "Greška",
        description: "Dogodila se greška pri učitavanju termina.",
        variant: "destructive"
      });
    }
  };

  const handleSaveAppointment = async (appointment: Appointment) => {
    try {
      // Ensure appointment has status field set
      if (!appointment.status) {
        appointment.status = 'scheduled';
      }
      
      // Add scheduledAt timestamp if not present
      if (!appointment.scheduledAt) {
        appointment.scheduledAt = new Date().toISOString();
      }
      
      const success = await dataStorageService.addAppointment(appointment);
      
      if (success) {
        // Refresh appointments list
        await loadAppointments();
        
        toast({
          title: "Termin spremljen",
          description: "Termin je uspješno spremljen"
        });
        
        console.log("[Appointments] Saved new appointment:", appointment);
        setIsCreating(false); // Close the form after successful save
      } else {
        throw new Error("Nije moguće spremiti termin");
      }
    } catch (error) {
      console.error("[Appointments] Error saving appointment:", error);
      toast({
        title: "Greška",
        description: "Dogodila se greška pri spremanju termina.",
        variant: "destructive"
      });
    }
  };
  
  const filteredAppointments = appointments.filter(appointment => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      appointment.patientName.toLowerCase().includes(searchLower) ||
      appointment.doctorName.toLowerCase().includes(searchLower) ||
      appointment.date.includes(searchTerm) ||
      appointment.examinationType.toLowerCase().includes(searchLower) ||
      appointment.status.toLowerCase().includes(searchLower)
    );
  });
  
  return (
    <div className="flex h-full flex-col">
      <Header title="Termini" />
      <div className="page-container">
        {isCreating ? (
          <AppointmentForm 
            onCancel={() => setIsCreating(false)}
            onSave={handleSaveAppointment}
          />
        ) : (
          <div className="mb-4">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-medium">Lista termina</h3>
              <Button onClick={() => setIsCreating(true)}>Zakaži</Button>
            </div>

            <div className="relative flex-grow max-w-sm mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pretraži termine..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <AppointmentsList 
              initialAppointments={filteredAppointments} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
