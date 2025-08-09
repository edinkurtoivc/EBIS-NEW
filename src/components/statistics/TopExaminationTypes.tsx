
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Appointment } from "@/types/medical-report";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ExaminationTypeCount {
  name: string;
  value: number;
}

const COLORS = ['#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function TopExaminationTypes() {
  const [timeFilter, setTimeFilter] = useState<"7" | "30" | "90">("30");
  const [examinationTypeData, setExaminationTypeData] = useState<ExaminationTypeCount[]>([]);
  const [chartConfig] = useState({
    pie: { theme: { light: '#10b981', dark: '#10b981' } },
    bar: { theme: { light: '#10b981', dark: '#10b981' } }
  });
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  
  // Load and process data
  useEffect(() => {
    const loadData = () => {
      try {
        // Load appointments
        const appointmentsData = localStorage.getItem("appointments");
        const appointments = appointmentsData ? JSON.parse(appointmentsData) : [];
        
        // Calculate the date threshold based on the time filter
        const now = new Date();
        const threshold = new Date();
        threshold.setDate(now.getDate() - parseInt(timeFilter));
        
        // Filter completed appointments within the time range
        const completedAppointments = appointments.filter((appt: Appointment) => {
          const appointmentDate = new Date(appt.date);
          return (
            appt.status === "completed" &&
            appointmentDate >= threshold
          );
        });
        
        // Count examination types
        const typeCountMap: Record<string, number> = {};
        completedAppointments.forEach((appt: Appointment) => {
          if (appt.examinationType) {
            if (typeCountMap[appt.examinationType]) {
              typeCountMap[appt.examinationType]++;
            } else {
              typeCountMap[appt.examinationType] = 1;
            }
          }
        });
        
        // Convert to array and sort
        const sortedTypes = Object.entries(typeCountMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5); // Top 5 types
        
        setExaminationTypeData(sortedTypes);
      } catch (error) {
        console.error("Error loading examination type statistics:", error);
      }
    };
    
    loadData();
    
    // Add event listener for storage changes to refresh data
    window.addEventListener("storage", loadData);
    return () => {
      window.removeEventListener("storage", loadData);
    };
  }, [timeFilter]);

  const renderPieChart = () => (
    <div className="h-[350px]">
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={examinationTypeData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {examinationTypeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <ChartTooltip
              content={<ChartTooltipContent />}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );

  const renderBarChart = () => (
    <div className="h-[350px]">
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={examinationTypeData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              content={<ChartTooltipContent />}
            />
            <Bar 
              dataKey="value" 
              fill="var(--color-bar, #10b981)" 
              name="Broj pregleda"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Top vrste pregleda</h2>
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

      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">Top 5 najčešćih vrsta pregleda</h3>
          <Tabs value={chartType} onValueChange={(v) => setChartType(v as "pie" | "bar")}>
            <TabsList>
              <TabsTrigger value="pie">Pie Chart</TabsTrigger>
              <TabsTrigger value="bar">Bar Chart</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {examinationTypeData.length > 0 ? (
          chartType === "pie" ? renderPieChart() : renderBarChart()
        ) : (
          <div className="flex justify-center items-center h-[350px] text-muted-foreground">
            Nema dostupnih podataka za prikaz
          </div>
        )}
      </Card>
    </div>
  );
}
