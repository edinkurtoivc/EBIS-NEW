
import { useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface CancelAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  appointmentDate: string;
  patientName: string;
}

export default function CancelAppointmentDialog({
  isOpen,
  onClose,
  onConfirm,
  appointmentDate,
  patientName
}: CancelAppointmentDialogProps) {
  const [reason, setReason] = useState("");
  const { toast } = useToast();

  const handleConfirm = () => {
    if (!reason.trim()) {
      toast({
        title: "Greška",
        description: "Molimo unesite razlog otkazivanja",
        variant: "destructive"
      });
      return;
    }
    onConfirm(reason);
    setReason("");
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Otkaži termin</AlertDialogTitle>
          <AlertDialogDescription>
            Otkazujete termin za pacijenta {patientName} zakazan za {appointmentDate}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <Label htmlFor="reason" className="text-right">
            Razlog otkazivanja
          </Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Unesite razlog otkazivanja termina"
            className="mt-2"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Odustani</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Potvrdi
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
