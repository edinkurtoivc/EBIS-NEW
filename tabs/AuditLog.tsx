
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import type { AuditLog } from "@/types/patient";
import { useToast } from "@/hooks/use-toast";

interface AuditLogProps {
  auditLogs: AuditLog[];
}

export function AuditLogTab({ auditLogs }: AuditLogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
  // Filter logs based on search term
  const filteredLogs = auditLogs.filter(log => 
    log.action.includes(searchTerm.toLowerCase()) || 
    log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.performedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSearch = () => {
    if (filteredLogs.length === 0) {
      toast({
        title: "Nema rezultata",
        description: "Nije pronađena nijedna aktivnost s tim pojmom.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Evidencija aktivnosti</h3>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pretraži aktivnosti..." 
              className="w-64 pl-8" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button size="sm" variant="outline" onClick={handleSearch}>Filtriraj</Button>
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
                  <td className="px-4 py-2 capitalize">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      log.action === 'create' ? 'bg-green-100 text-green-800' : 
                      log.action === 'update' ? 'bg-blue-100 text-blue-800' : 
                      log.action === 'view' ? 'bg-gray-100 text-gray-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {log.action === 'create' ? 'kreiranje' : 
                       log.action === 'update' ? 'izmjena' : 
                       log.action === 'view' ? 'pregled' : log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2">{log.performedBy}</td>
                  <td className="px-4 py-2">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 border rounded-md bg-muted/10">
          <p className="text-muted-foreground">
            {searchTerm ? "Nema rezultata pretraživanja" : "Nema zapisa aktivnosti za ovog pacijenta"}
          </p>
        </div>
      )}
    </div>
  );
}
