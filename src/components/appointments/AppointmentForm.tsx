import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Search, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Patient } from "@/types/patient";
import { ensurePatient } from "@/types/patient";
import type { Appointment } from "@/types/medical-report";
import type { User } from "@/types/user";
import dataStorageService from "@/services/DataStorageService";

interface AppointmentFormProps {
  onCancel: () => void;
  preselectedPatient?: Patient;
  onSave?: (appointment: Appointment) => void;
}

export default function AppointmentForm({ onCancel, preselectedPatient, onSave }: AppointmentFormProps) {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(preselectedPatient || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPatientsDropdown, setShowPatientsDropdown] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedAppointmentType, setSelectedAppointmentType] = useState<string>("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [appointmentTypes, setAppointmentTypes] = useState<any[]>([]);

  // Fetch patients from DataStorageService
  useEffect(() => {
    const loadPatients = async () => {
      setIsLoadingPatients(true);
      try {
        const loadedPatients = await dataStorageService.getPatients();
        // Ensure all patients have the name getter
        const patientsWithName = loadedPatients.map(patient => ensurePatient(patient));
        setPatients(patientsWithName);
        console.log("[AppointmentForm] Loaded patients:", patientsWithName);
      } catch (error) {
        console.error("[AppointmentForm] Error loading patients:", error);
        toast({
          title: "Greška",
          description: "Dogodila se greška pri učitavanju pacijenata.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingPatients(false);
      }
    };

    loadPatients();
  }, [toast]);

  // Fetch doctors from DataStorageService
  useEffect(() => {
    const loadDoctors = async () => {
      setIsLoadingDoctors(true);
      try {
        const allUsers = await dataStorageService.getUsers();
        const activeDoctors = allUsers.filter(user => user.role === 'doctor' && user.active);
        setDoctors(activeDoctors);
        console.log("[AppointmentForm] Loaded doctors:", activeDoctors.length);
      } catch (error) {
        console.error("[AppointmentForm] Error loading doctors:", error);
        toast({
          title: "Greška",
          description: "Dogodila se greška pri učitavanju doktora.",
          variant: "destructive"
        });
        // Fallback to default doctors if error
        setDoctors(getDefaultDoctors());
      } finally {
        setIsLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, [toast]);
  
  // Load examination types from the settings
  useEffect(() => {
    try {
      const savedTypes = localStorage.getItem('examination-types');
      if (savedTypes) {
        const parsedTypes = JSON.parse(savedTypes);
        if (Array.isArray(parsedTypes) && parsedTypes.length > 0) {
          console.log("[AppointmentForm] Loaded examination types from settings:", parsedTypes);
          setAppointmentTypes(parsedTypes);
          return;
        }
      }

      // Fallback to default types if no saved types found
      setAppointmentTypes([
        { id: 1, name: "Opći pregled", duration: "30 min", price: "50 KM" },
        { id: 2, name: "Kardiološki pregled", duration: "45 min", price: "80 KM" },
        { id: 3, name: "Dermatološki pregled", duration: "30 min", price: "60 KM" },
        { id: 4, name: "Neurološki pregled", duration: "60 min", price: "100 KM" },
        { id: 5, name: "Laboratorijski nalaz", duration: "20 min", price: "30 KM" },
      ]);
    } catch (error) {
      console.error("[AppointmentForm] Error loading examination types:", error);
      // Set default types on error
      setAppointmentTypes([
        { id: 1, name: "Opći pregled", duration: "30 min", price: "50 KM" },
        { id: 2, name: "Kardiološki pregled", duration: "45 min", price: "80 KM" },
        { id: 3, name: "Dermatološki pregled", duration: "30 min", price: "60 KM" },
        { id: 4, name: "Neurološki pregled", duration: "60 min", price: "100 KM" },
      ]);
    }
  }, []);
  
  const getDefaultDoctors = (): User[] => {
    return [
      { 
        id: "1", 
        email: "dr.smith@klinika.com", 
        firstName: "Adnan", 
        lastName: "Hadžić",
        role: "doctor",
        specialization: "Kardiologija",
        password: "doctor123", 
        active: true 
      },
      { 
        id: "2", 
        email: "dr.jones@klinika.com", 
        firstName: "Petar", 
        lastName: "Petrović",
        role: "doctor",
        specialization: "Neurologija",
        password: "doctor123",
        active: true 
      },
    ];
  };
  
  const filteredPatients = patients.filter(patient => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const patientWithName = ensurePatient(patient);
    return (
      patientWithName.name.toLowerCase().includes(searchLower) ||
      (patient.jmbg && patient.jmbg.includes(searchTerm)) ||
      (patient.dob && patient.dob.includes(searchTerm))
    );
  });

  const handleSelectPatient = (patient: Patient) => {
    // Ensure patient has name getter before setting
    setSelectedPatient(ensurePatient(patient));
    setShowPatientsDropdown(false);
    setSearchTerm("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient || !date || !selectedTime || !selectedDoctorId || !selectedAppointmentType) {
      toast({
        title: "Greška pri validaciji",
        description: "Molimo popunite sva obavezna polja",
        variant: "destructive"
      });
      return;
    }
    
    const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
    const appointmentType = appointmentTypes.find(t => t.id.toString() === selectedAppointmentType)?.name;
    
    if (!selectedPatient || !selectedDoctor || !appointmentType) {
      toast({
        title: "Greška",
        description: "Nepravilni podaci u formi",
        variant: "destructive"
      });
      return;
    }
    
    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      patientId: selectedPatient.id.toString(),
      patientName: selectedPatient.name,
      doctorId: selectedDoctorId,
      doctorName: `${selectedDoctor.firstName} ${selectedDoctor.lastName}`,
      date: format(date!, "yyyy-MM-dd"),
      time: selectedTime,
      examinationType: appointmentType,
      status: 'scheduled',
      scheduledAt: new Date().toISOString(), // Add timestamp when appointment was scheduled
    };
    
    console.log("[AppointmentForm] Creating new appointment:", newAppointment);
    
    if (onSave) {
      onSave(newAppointment);
    } else {
      try {
        const savedAppointments = localStorage.getItem('appointments') || '[]';
        const appointments = JSON.parse(savedAppointments);
        appointments.push(newAppointment);
        localStorage.setItem('appointments', JSON.stringify(appointments));
        
        toast({
          title: "Termin zakazan",
          description: `Termin uspješno zakazan za ${format(date!, "dd.MM.yyyy.")} u ${selectedTime}`,
        });
        
        console.log("[AppointmentForm] Saved appointment directly to localStorage");
        onCancel();
      } catch (error) {
        console.error("[AppointmentForm] Error saving appointment:", error);
        toast({
          title: "Greška",
          description: "Dogodila se greška pri spremanju termina",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-clinic-800">
          {preselectedPatient 
            ? `Zakaži novi termin za ${ensurePatient(preselectedPatient).name}`
            : "Zakaži novi termin"}
        </CardTitle>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient">Pacijent</Label>
            <div className="relative">
              <div className="w-full relative">
                <Input 
                  placeholder={selectedPatient ? selectedPatient.name : "Odaberite pacijenta"}
                  className="w-full border rounded-md p-4"
                  onClick={() => setShowPatientsDropdown(!showPatientsDropdown)}
                  readOnly
                  disabled={!!preselectedPatient}
                />
                {!preselectedPatient && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                )}
              </div>
              
              {showPatientsDropdown && !preselectedPatient && (
                <div className="absolute z-10 w-full bg-white border rounded-md mt-1 shadow-md">
                  <div className="relative m-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Pronađite pacijenta..." 
                      className="pl-8 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {isLoadingPatients ? (
                    <div className="p-4 text-center text-muted-foreground">Učitavanje pacijenata...</div>
                  ) : filteredPatients.length > 0 ? (
                    <div className="max-h-[300px] overflow-y-auto">
                      {filteredPatients.map(patient => {
                        const patientWithName = ensurePatient(patient);
                        return (
                          <div 
                            key={patient.id} 
                            className="p-2 hover:bg-gray-100 cursor-pointer flex flex-col"
                            onClick={() => handleSelectPatient(patient)}
                          >
                            <span className="font-medium">{patientWithName.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {patient.jmbg ? `JMBG: ${patient.jmbg} · ` : ''}
                              {patient.dob ? `Rođen: ${patient.dob}` : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      {searchTerm ? "Nema pronađenih pacijenata." : "Nema pacijenata u bazi."}
                    </div>
                  )}
                  
                  <a 
                    href="/patients"
                    className="p-2 hover:bg-gray-100 cursor-pointer flex border-t text-emerald-600"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = '/patients';
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    <span>Dodaj novog pacijenta</span>
                  </a>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="doctor">Doktor</Label>
            <Select onValueChange={setSelectedDoctorId}>
              <SelectTrigger id="doctor">
                <SelectValue placeholder={isLoadingDoctors ? "Učitavanje doktora..." : "Odaberi doktora"} />
              </SelectTrigger>
              <SelectContent>
                {isLoadingDoctors ? (
                  <SelectItem value="loading" disabled>Učitavanje doktora...</SelectItem>
                ) : doctors.length > 0 ? (
                  doctors.filter(d => d.role === 'doctor' && d.active).map(doctor => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.firstName} {doctor.lastName} - {doctor.specialization || 'Opća praksa'}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-doctors" disabled>Nema dostupnih doktora</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Vrsta pregleda</Label>
            <Select onValueChange={setSelectedAppointmentType}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Odaberi vrstu pregleda" />
              </SelectTrigger>
              <SelectContent>
                {appointmentTypes.map(type => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name} - {type.duration} ({type.price})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Datum</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd.MM.yyyy.") : <span>Odaberi datum</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time">Vrijeme</Label>
            <Select onValueChange={setSelectedTime}>
              <SelectTrigger id="time">
                <SelectValue placeholder="Odaberi vrijeme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="09:00">09:00</SelectItem>
                <SelectItem value="09:30">09:30</SelectItem>
                <SelectItem value="10:00">10:00</SelectItem>
                <SelectItem value="10:30">10:30</SelectItem>
                <SelectItem value="11:00">11:00</SelectItem>
                <SelectItem value="11:30">11:30</SelectItem>
                <SelectItem value="12:00">12:00</SelectItem>
                <SelectItem value="12:30">12:30</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Odustani
          </Button>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
            Zakaži termin
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
