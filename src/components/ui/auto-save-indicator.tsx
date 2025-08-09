import { Save, RefreshCw, Check, WifiOff, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { SaveStatus } from "@/hooks/useSaveData";

interface AutoSaveIndicatorProps {
  status: "idle" | "saving" | "saved" | "error" | "offline" | "pending";
  lastSaved?: Date | null;
  className?: string;
  showText?: boolean;
  onRetry?: () => void;
}

export function AutoSaveIndicator({
  status,
  lastSaved,
  className,
  showText = false,
  onRetry
}: AutoSaveIndicatorProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "saving":
        return <RefreshCw className="h-3.5 w-3.5 animate-spin" />;
      case "saved":
        return <Check className="h-3.5 w-3.5" />;
      case "error":
        return <AlertCircle className="h-3.5 w-3.5" />;
      case "offline":
        return <WifiOff className="h-3.5 w-3.5" />;
      case "pending":
        return <Clock className="h-3.5 w-3.5" />;
      default:
        return <Save className="h-3.5 w-3.5" />;
    }
  };

  const getStatusText = () => {
    if (!showText) return null;

    switch (status) {
      case "saving":
        return "Spremanje...";
      case "saved":
        return lastSaved 
          ? `Spremljeno: ${lastSaved.toLocaleTimeString()}` 
          : "Spremljeno";
      case "error":
        return "Greška pri spremanju";
      case "offline":
        return "Lokalno spremljeno";
      case "pending":
        return "Čekanje na spremanje...";
      default:
        return "Nije spremljeno";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "saving":
        return "text-blue-500";
      case "saved":
        return "text-green-500";
      case "error":
        return "text-red-500";
      case "offline":
        return "text-amber-500";
      case "pending":
        return "text-amber-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium", 
        getStatusColor(),
        className
      )}
    >
      {getStatusIcon()}
      {showText && <span>{getStatusText()}</span>}
      {status === "error" && onRetry && (
        <button 
          onClick={onRetry}
          className="text-xs underline hover:text-red-600 ml-1"
        >
          Pokušaj ponovo
        </button>
      )}
    </div>
  );
}
