
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import type { Appointment } from "@/types/medical-report";
import { format } from "date-fns";

export default function Dashboard() {
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const loadTodayAppointments = () => {
      const savedAppointments = localStorage.getItem('appointments');
      if (savedAppointments) {
        try {
          const allAppointments: Appointment[] = JSON.parse(savedAppointments);
          const today = format(new Date(), 'yyyy-MM-dd');
          
          const todaysAppointments = allAppointments.filter(
            appointment => appointment.date === today && appointment.status === 'scheduled'
          );
          
          console.log("[Dashboard] Today's appointments:", todaysAppointments);
          setTodayAppointments(todaysAppointments);
        } catch (error) {
          console.error("[Dashboard] Error loading appointments:", error);
          setTodayAppointments([]);
        }
      }
    };

    loadTodayAppointments();
  }, []);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-medium">Današnji pregledi</h3>
        
        <div className="overflow-hidden rounded-md border">
          <table className="min-w-full divide-y">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Pacijent</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Vrijeme</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tip pregleda</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Doktor</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              {todayAppointments.length > 0 ? (
                todayAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-4 py-3 text-sm">{appointment.patientName}</td>
                    <td className="px-4 py-3 text-sm">{appointment.time}</td>
                    <td className="px-4 py-3 text-sm">{appointment.examinationType}</td>
                    <td className="px-4 py-3 text-sm">{appointment.doctorName}</td>
                    <td className="px-4 py-3 text-right text-sm">
                      <button className="text-clinic-600 hover:text-clinic-800">
                        Pregled
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nema zakazanih pregleda za danas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
