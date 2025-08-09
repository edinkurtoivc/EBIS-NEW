
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  email: z.string().email("Unesite ispravnu email adresu"),
  password: z.string().min(1, "Šifra je obavezna")
});

export default function Login() {
  const { login, isAuthenticated, isLoadingAuth, bypassAuth, toggleBypassAuth } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Superadmin credentials info box
  const [showCredentials, setShowCredentials] = useState(true);
  // Admin credentials info box
  const [showAdminCredentials, setShowAdminCredentials] = useState(true);

  // Check if already authenticated or bypass is enabled
  useEffect(() => {
    // Only navigate if authenticated (not just bypassed)
    if (isAuthenticated && !isLoadingAuth) {
      navigate('/');
    }
  }, [isAuthenticated, navigate, isLoadingAuth, bypassAuth]);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      setIsLoading(true);
      setLoginError(null);
      console.log("Login attempt with:", values.email);
      
      const success = await login(values.email, values.password);
      
      if (success) {
        navigate('/');
      } else {
        setLoginError("Prijava nije uspjela. Provjerite svoje podatke.");
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError("Došlo je do greške prilikom prijave. Pokušajte ponovo.");
      
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom prijave",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoadingAuth) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Učitavanje...</div>
      </div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <img src="/lovable-uploads/44afc1d2-0672-4a2d-acdd-3d4de4007dbb.png" alt="EIBS Logo" className="h-32 w-32" />
          </div>
          <CardTitle className="text-center text-2xl">Prijava u sistem</CardTitle>
          <CardDescription className="text-center">Unesite svoje podatke za pristup</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loginError && (
            <Alert className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-800">
                {loginError}
              </AlertDescription>
            </Alert>
          )}
        
          {showCredentials && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="space-y-2">
                <div className="font-medium">Superadmin kredencijali:</div>
                <div className="text-sm">
                  <div><strong>Email:</strong> superadmin@klinika.com</div>
                  <div><strong>Šifra:</strong> superadmin123</div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowCredentials(false)}
                  className="mt-2 text-xs"
                >
                  Sakrij
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {showAdminCredentials && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="space-y-2">
                <div className="font-medium">Admin kredencijali:</div>
                <div className="text-sm">
                  <div><strong>Email:</strong> glavniadmin@klinika.com</div>
                  <div><strong>Šifra:</strong> admin123</div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAdminCredentials(false)}
                  className="mt-2 text-xs"
                >
                  Sakrij
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {bypassAuth && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertDescription className="space-y-2">
                <div className="font-medium">Autentifikacija je isključena!</div>
                <p>Trenutno je aktiviran način rada bez prijave. Da biste koristili prijavu, morate isključiti ovu opciju ispod.</p>
                <Button 
                  variant="destructive" 
                  onClick={toggleBypassAuth}
                  className="mt-2 w-full"
                >
                  Isključi način rada bez prijave
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {!bypassAuth && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="vasa.email@adresa.com" 
                          autoComplete="username" 
                          {...field} 
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Šifra</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            autoComplete="current-password" 
                            {...field}
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Sakrij šifru" : "Prikaži šifru"}
                            disabled={isLoading}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Prijava u toku..." : "Prijavi se"}
                </Button>
              </form>
            </Form>
          )}
          
          {!bypassAuth && (
            <div className="flex justify-center mt-4 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={toggleBypassAuth}
                className="w-full"
                disabled={isLoading}
              >
                Uključi način rada bez prijave
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-muted-foreground w-full">
            Sistem kliničke evidencije | v1.0.0
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
