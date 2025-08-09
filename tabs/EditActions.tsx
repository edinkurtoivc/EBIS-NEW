
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditActionsProps {
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function EditActions({ isEditing, onSave, onCancel }: EditActionsProps) {
  if (!isEditing) return null;

  return (
    <div className="flex justify-end space-x-2">
      <Button variant="outline" size="sm" onClick={onCancel}>
        <X className="h-4 w-4 mr-1" /> Odustani
      </Button>
      <Button size="sm" onClick={onSave}>
        <Save className="h-4 w-4 mr-1" /> Spremi promjene
      </Button>
    </div>
  );
}
