
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Activity, FileText, Edit, User, History } from "lucide-react";
import type { AuditLog } from "@/types/patient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuditLogProps {
  auditLogs: AuditLog[];
}

export function AuditLogTab({ auditLogs }: AuditLogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const { toast } = useToast();
  
  // Filter logs based on search term and activity type
  const filteredLogs = auditLogs.filter(log => {
    // First, filter by search term
    const matchesSearch = 
      log.action.includes(searchTerm.toLowerCase()) || 
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Then, filter by activity type
    if (activityFilter === "all") {
      return matchesSearch;
    } else {
      return matchesSearch && log.action === activityFilter;
    }
  });
  
  const handleSearch = () => {
    if (filteredLogs.length === 0) {
      toast({
        title: "Nema rezultata",
        description: "Nije pronađena nijedna aktivnost s tim pojmom.",
      });
    }
  };

  // Get counts for activity types
  const getCounts = () => {
    const counts = {
      create: 0,
      update: 0,
      view: 0,
      verify: 0,
      edit: 0,
    };
    
    auditLogs.forEach(log => {
      if (counts[log.action as keyof typeof counts] !== undefined) {
        counts[log.action as keyof typeof counts]++;
      }
    });
    
    return counts;
  };
  
  const counts = getCounts();

  // Get the appropriate icon for an activity type
  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'update':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'view':
        return <Activity className="h-4 w-4 text-gray-500" />;
      case 'verify':
        return <User className="h-4 w-4 text-purple-500" />;
      case 'edit':
        return <Edit className="h-4 w-4 text-amber-500" />;
      default:
        return <History className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
        <h3 className="text-lg font-medium">Evidencija aktivnosti</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex space-x-2">
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter aktivnosti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sve aktivnosti ({auditLogs.length})</SelectItem>
                <SelectItem value="create">Kreiranje ({counts.create})</SelectItem>
                <SelectItem value="update">Izmjene ({counts.update})</SelectItem>
                <SelectItem value="view">Pregled ({counts.view})</SelectItem>
                <SelectItem value="verify">Verifikacija ({counts.verify})</SelectItem>
                <SelectItem value="edit">Uređivanje nalaza ({counts.edit})</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pretraži aktivnosti..." 
                className="w-full sm:w-64 pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button size="sm" variant="outline" onClick={handleSearch}>Filtriraj</Button>
          </div>
        </div>
      </div>
      
      {filteredLogs.length > 0 ? (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left">Datum i vrijeme</th>
                <th className="px-4 py-2 text-left">Aktivnost</th>
                <th className="px-4 py-2 text-left">Izvršio</th>
                <th className="px-4 py-2 text-left">Detalji</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-2">{new Date(log.performedAt).toLocaleString('bs-BA')}</td>
                  <td className="px-4 py-2">
                    <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                      log.action === 'create' ? 'bg-green-100 text-green-800' : 
                      log.action === 'update' ? 'bg-blue-100 text-blue-800' : 
                      log.action === 'view' ? 'bg-gray-100 text-gray-800' :
                      log.action === 'verify' ? 'bg-purple-100 text-purple-800' :
                      log.action === 'edit' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getActivityIcon(log.action)}
                      {log.action === 'create' ? 'kreiranje' : 
                       log.action === 'update' ? 'izmjena' : 
                       log.action === 'view' ? 'pregled' : 
                       log.action === 'verify' ? 'verifikacija' :
                       log.action === 'edit' ? 'uređivanje' : 
                       log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2">{log.performedBy}</td>
                  <td className="px-4 py-2 whitespace-pre-wrap">
                    {log.details}
                    {log.reason && (
                      <div className="mt-1 text-xs text-gray-500">
                        Razlog: {log.reason}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 border rounded-md bg-muted/10">
          <p className="text-muted-foreground">
            {searchTerm || activityFilter !== "all" ? "Nema rezultata pretraživanja" : "Nema zapisa aktivnosti za ovog pacijenta"}
          </p>
        </div>
      )}
    </div>
  );
}
