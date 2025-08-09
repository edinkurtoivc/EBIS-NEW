
import { useState, useEffect } from "react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import DoctorExaminationDetails from "./DoctorExaminationDetails";
import { User } from "@/types/user";
import { Appointment } from "@/types/medical-report";

interface DoctorStats {
  id: string;
  name: string;
  completedAppointments: number;
  examinationTypes: Record<string, number>;
}

export default function DoctorsStatistics() {
  const [timeFilter, setTimeFilter] = useState<"7" | "30" | "90">("30");
  const [doctorStats, setDoctorStats] = useState<DoctorStats[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [chartConfig] = useState({
    completedAppointments: { color: "#10b981" },
  });
  
  // Load mock data from localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        // Load users
        const usersData = localStorage.getItem("users");
        const users = usersData ? JSON.parse(usersData) : [];
        const doctors = users.filter((user: User) => user.role === "doctor");
        
        // Load appointments
        const appointmentsData = localStorage.getItem("appointments");
        const appointments = appointmentsData ? JSON.parse(appointmentsData) : [];
        
        // Calculate the date threshold based on the time filter
        const now = new Date();
        const threshold = new Date();
        threshold.setDate(now.getDate() - parseInt(timeFilter));
        
        // Process data
        const stats = doctors.map((doctor: User) => {
          // Filter appointments for this doctor that are completed and within the time range
          const doctorAppointments = appointments.filter((appt: Appointment) => {
            const appointmentDate = new Date(appt.date);
            return (
              appt.doctorId === doctor.id && 
              appt.status === "completed" &&
              appointmentDate >= threshold
            );
          });
          
          // Count examination types
          const examinationTypes: Record<string, number> = {};
          doctorAppointments.forEach((appt: Appointment) => {
            if (appt.examinationType) {
              if (examinationTypes[appt.examinationType]) {
                examinationTypes[appt.examinationType]++;
              } else {
                examinationTypes[appt.examinationType] = 1;
              }
            }
          });
          
          return {
            id: doctor.id,
            name: `${doctor.firstName} ${doctor.lastName}`,
            completedAppointments: doctorAppointments.length,
            examinationTypes
          };
        });
        
        // Sort by completed appointments (descending)
        stats.sort((a: DoctorStats, b: DoctorStats) => 
          b.completedAppointments - a.completedAppointments
        );
        
        setDoctorStats(stats);
      } catch (error) {
        console.error("Error loading doctor statistics:", error);
      }
    };
    
    loadData();
    
    // Add event listener for storage changes to refresh data
    window.addEventListener("storage", loadData);
    return () => {
      window.removeEventListener("storage", loadData);
    };
  }, [timeFilter]);
  
  const chartData = doctorStats.map(doctor => ({
    name: doctor.name,
    completedAppointments: doctor.completedAppointments
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Statistika doktora</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Period:</span>
          <Select
            value={timeFilter}
            onValueChange={(value) => setTimeFilter(value as "7" | "30" | "90")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Izaberi period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Posljednjih 7 dana</SelectItem>
              <SelectItem value="30">Posljednjih 30 dana</SelectItem>
              <SelectItem value="90">Posljednjih 90 dana</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Broj završenih pregleda po doktorima</h3>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ime doktora</TableHead>
                  <TableHead className="text-right">Broj završenih pregleda</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctorStats.map((doctor) => (
                  <TableRow 
                    key={doctor.id} 
                    className={`${selectedDoctor === doctor.id ? 'bg-muted' : ''} cursor-pointer`}
                    onClick={() => setSelectedDoctor(
                      selectedDoctor === doctor.id ? null : doctor.id
                    )}
                  >
                    <TableCell>{doctor.name}</TableCell>
                    <TableCell className="text-right font-medium">{doctor.completedAppointments}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Broj završenih pregleda - grafički prikaz</h3>
          <div className="h-[300px]">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 40, bottom: 10 }}
                >
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tickLine={false}
                    axisLine={false}
                    width={120}
                    style={{
                      fontSize: '0.8rem',
                    }}
                  />
                  <Tooltip
                    content={
                      <ChartTooltipContent />
                    }
                  />
                  <Bar 
                    dataKey="completedAppointments" 
                    fill="var(--color-completedAppointments, #10b981)" 
                    name="Broj završenih pregleda"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </Card>
      </div>
      
      {selectedDoctor && (
        <DoctorExaminationDetails 
          doctor={doctorStats.find(d => d.id === selectedDoctor)!}
          onClose={() => setSelectedDoctor(null)}
        />
      )}
    </div>
  );
}
