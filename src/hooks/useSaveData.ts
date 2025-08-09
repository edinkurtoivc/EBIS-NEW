
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";

interface UseSaveDataConfig<T> {
  data: T;
  key: string;
  onSave?: (data: T) => Promise<void>;
  saveDelay?: number;
  condition?: boolean;
  loadFromStorage?: boolean;
  onDataLoaded?: (data: T) => void;
}

export type SaveStatus = "saving" | "saved" | "error" | "offline" | "idle" | "pending";

export function useSaveData<T>({
  data,
  key,
  onSave,
  saveDelay = 2000,
  condition = true,
  loadFromStorage = true,
  onDataLoaded,
}: UseSaveDataConfig<T>) {
  const { toast } = useToast();
  const location = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [needsSave, setNeedsSave] = useState(false);
  const [saveAttempts, setSaveAttempts] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load data from storage on initial render
  useEffect(() => {
    if (loadFromStorage && !initialDataLoaded) {
      try {
        const savedData = localStorage.getItem(key);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log(`[AutoSave] Loaded data for key ${key}:`, parsedData);
          
          if (parsedData && onDataLoaded) {
            onDataLoaded(parsedData);
            setLastSaved(new Date());
            setInitialDataLoaded(true);
          }
        }
      } catch (error) {
        console.error(`[AutoSave] Error loading data for key ${key}:`, error);
      }
    }
  }, [key, loadFromStorage, initialDataLoaded, onDataLoaded]);

  // Save data implementation
  const saveData = async () => {
    if (isSaving || !condition) return;

    try {
      setIsSaving(true);
      console.log(`[AutoSave] Starting save for key ${key}`);
      
      // Save to localStorage
      localStorage.setItem(key, JSON.stringify(data));
      
      if (!isOffline && onSave) {
        await onSave(data);
      }
      
      setLastSaved(new Date());
      setNeedsSave(false);
      setSaveAttempts(0);
      
      console.log(`[AutoSave] Successfully saved data for key ${key}`);
      
    } catch (error) {
      console.error(`[AutoSave] Error saving data for key ${key}:`, error);
      const newAttempts = saveAttempts + 1;
      setSaveAttempts(newAttempts);
      
      if (newAttempts === 1 || newAttempts % 3 === 0) {
        toast({
          title: "Greška pri spremanju",
          description: "Nije moguće spremiti podatke. Pokušat ćemo ponovo automatski.",
          variant: "destructive",
        });
      }
      
      setTimeout(() => {
        setNeedsSave(true);
      }, Math.min(saveDelay * newAttempts, 30000));
    } finally {
      setIsSaving(false);
    }
  };

  // Save on data change after delay
  useEffect(() => {
    if (!condition) return;
    
    setNeedsSave(true);
    const timer = setTimeout(saveData, saveDelay);

    return () => clearTimeout(timer);
  }, [data, saveDelay]);

  // Manual save function
  const forceSave = async () => {
    console.log(`[AutoSave] Force saving data for key ${key}`);
    await saveData();
  };

  // Determine the current save status
  const getSaveStatus = (): "saving" | "saved" | "error" | "offline" | "idle" | "pending" => {
    if (isSaving) return "saving";
    if (isOffline) return "offline";
    if (saveAttempts > 0) return "error";
    if (needsSave) return "pending";
    if (lastSaved) return "saved";
    return "idle";
  };

  return {
    isSaving,
    lastSaved,
    isOffline,
    forceSave,
    saveStatus: getSaveStatus(),
    retry: forceSave,
    initialDataLoaded,
  };
}
