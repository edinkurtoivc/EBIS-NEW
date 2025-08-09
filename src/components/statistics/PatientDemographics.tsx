
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip 
} from "recharts";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Patient } from "@/types/patient";

const GENDER_COLORS = ["#10b981", "#6366f1"];
const AGE_COLORS = ["#10b981", "#22c55e", "#34d399", "#6366f1", "#8b5cf6"];

export default function PatientDemographics() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [genderData, setGenderData] = useState<any[]>([]);
  const [ageData, setAgeData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<"all" | "year">("all");
  const [chartConfig] = useState({
    gender: { color: "#10b981" },
    age: { color: "#6366f1" },
  });

  // Load patient data from localStorage
  useEffect(() => {
    const loadPatients = () => {
      try {
        const patientsData = localStorage.getItem("patients");
        if (patientsData) {
          const data = JSON.parse(patientsData);
          
          // Filter patients based on timeRange if needed
          const filteredPatients = timeRange === "all" 
            ? data 
            : data.filter((patient: Patient) => {
                // Check if patient was created/modified within the last year
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                
                // Use registration date or fallback to current date
                return true; // For now, we don't have registration dates
              });
              
          setPatients(filteredPatients);
          processPatientData(filteredPatients);
        }
      } catch (error) {
        console.error("Error loading patient data:", error);
      }
    };
    
    loadPatients();
  }, [timeRange]);
  
  // Process patient data to generate statistics
  const processPatientData = (patientList: Patient[]) => {
    // Calculate gender distribution
    const genderCount: Record<string, number> = {
      "Muški": 0,
      "Ženski": 0
    };
    
    // Calculate age distribution
    const ageGroups: Record<string, number> = {
      "0-18": 0,
      "19-35": 0,
      "36-50": 0,
      "51-65": 0,
      "65+": 0
    };
    
    patientList.forEach(patient => {
      // Count gender
      if (patient.gender === "M") {
        genderCount["Muški"]++;
      } else {
        genderCount["Ženski"]++;
      }
      
      // Calculate age and add to appropriate group
      if (patient.dob) {
        const birthDate = new Date(patient.dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        if (age <= 18) {
          ageGroups["0-18"]++;
        } else if (age <= 35) {
          ageGroups["19-35"]++;
        } else if (age <= 50) {
          ageGroups["36-50"]++;
        } else if (age <= 65) {
          ageGroups["51-65"]++;
        } else {
          ageGroups["65+"]++;
        }
      }
    });
    
    // Format data for charts
    const genderChartData = Object.entries(genderCount).map(([name, value]) => ({
      name,
      value
    }));
    
    const ageChartData = Object.entries(ageGroups).map(([name, value]) => ({
      name,
      value
    }));
    
    setGenderData(genderChartData);
    setAgeData(ageChartData);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Demografija pacijenata</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Period:</span>
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as "all" | "year")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Izaberi period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Svi pacijenti</SelectItem>
              <SelectItem value="year">Zadnja godina</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Raspodjela po spolu</h3>
          <div className="h-[300px]">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Ukupno pacijenata: {patients.length}
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Raspodjela po starosnim grupama</h3>
          <div className="h-[300px]">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ageData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {ageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={AGE_COLORS[index % AGE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
