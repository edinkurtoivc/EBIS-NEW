
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { User } from "@/types/user";
import { Appointment } from "@/types/medical-report";

// Define the available time periods for comparison
const TIME_PERIODS = [
  { value: "7", label: "Posljednjih 7 dana" },
  { value: "30", label: "Posljednjih 30 dana" },
  { value: "90", label: "Posljednjih 90 dana" }
];

// Array of colors for different doctor lines
const LINE_COLORS = [
  "#10b981", // green
  "#6366f1", // indigo
  "#f43f5e", // rose
  "#8b5cf6", // violet
  "#0ea5e9", // sky
  "#f97316", // orange
  "#fbbf24", // amber
  "#84cc16"  // lime
];

export default function DoctorPerformanceComparison() {
  const [timeFilter, setTimeFilter] = useState<"7" | "30" | "90">("30");
  const [chartData, setChartData] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [chartConfig] = useState({
    performance: { color: "#10b981" },
  });

  // Load data from localStorage
  useEffect(() => {
    try {
      // Load users (doctors)
      const usersData = localStorage.getItem("users");
      if (usersData) {
        const users = JSON.parse(usersData);
        const doctorsList = users.filter((user: User) => user.role === "doctor");
        setDoctors(doctorsList);
      }

      // Load appointments
      const appointmentsData = localStorage.getItem("appointments");
      if (appointmentsData) {
        const appointments = JSON.parse(appointmentsData);
        processAppointmentsData(appointments);
      }
    } catch (error) {
      console.error("Error loading doctor performance data:", error);
    }
  }, [timeFilter]);

  // Process appointment data to create time-series data
  const processAppointmentsData = (appointments: Appointment[]) => {
    // Calculate the date threshold based on the time filter
    const now = new Date();
    const threshold = new Date();
    threshold.setDate(now.getDate() - parseInt(timeFilter));
    
    // Create an array to hold dates within our range
    const dates: Date[] = [];
    for (let d = new Date(threshold); d <= now; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    
    // Create the data structure for our chart
    const timeSeriesData = dates.map(date => {
      const formattedDate = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
      
      // Start with an entry for the date
      const entry: Record<string, any> = {
        date: formattedDate
      };
      
      // For each doctor, count completed appointments on this date
      doctors.forEach(doctor => {
        const doctorKey = `dr${doctor.id}`;
        const doctorName = `${doctor.firstName} ${doctor.lastName}`;
        
        // Count completed appointments for this doctor on this date
        const count = appointments.filter((appt: Appointment) => {
          const appointmentDate = new Date(appt.date);
          return (
            appt.doctorId === doctor.id &&
            appt.status === "completed" &&
            appointmentDate.getDate() === date.getDate() &&
            appointmentDate.getMonth() === date.getMonth() &&
            appointmentDate.getFullYear() === date.getFullYear()
          );
        }).length;
        
        entry[doctorKey] = count;
        entry[`${doctorKey}Name`] = doctorName;
      });
      
      return entry;
    });
    
    setChartData(timeSeriesData);
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Usporedba performansi doktora tijekom vremena</h3>
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
              {TIME_PERIODS.map(period => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="h-[400px]">
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
            >
              <XAxis 
                dataKey="date" 
                height={60}
                tick={{ dy: 10 }}
              />
              <YAxis 
                allowDecimals={false}
                label={{ 
                  value: "Broj završenih pregleda", 
                  angle: -90, 
                  position: "insideLeft",
                  style: { textAnchor: 'middle' }
                }}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend verticalAlign="top" height={36} />
              
              {doctors.map((doctor, index) => (
                <Line
                  key={doctor.id}
                  type="monotone"
                  dataKey={`dr${doctor.id}`}
                  stroke={LINE_COLORS[index % LINE_COLORS.length]}
                  name={`${doctor.firstName} ${doctor.lastName}`}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
      
      <div className="mt-4 text-center text-sm text-muted-foreground">
        Graf prikazuje broj završenih pregleda po doktoru za svaki dan u odabranom periodu
      </div>
    </Card>
  );
}
