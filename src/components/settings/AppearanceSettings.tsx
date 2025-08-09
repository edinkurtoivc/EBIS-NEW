
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Sun, Moon } from "lucide-react";

export default function AppearanceSettings() {
  const { toast } = useToast();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
    toast({
      title: "Tema promijenjena",
      description: `Prebačeno na ${newTheme === 'light' ? 'svijetlu' : 'tamnu'} temu`,
    });
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Izgled aplikacije</h2>
        <p className="text-muted-foreground">
          Prilagodite izgled aplikacije prema vašim potrebama
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Tema</h3>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={toggleTheme}
          >
            {theme === 'light' ? (
              <>
                <Moon className="mr-2 h-4 w-4" />
                Prebaci na tamnu temu
              </>
            ) : (
              <>
                <Sun className="mr-2 h-4 w-4" />
                Prebaci na svijetlu temu
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
