import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useSaveData } from "@/hooks/useSaveData";
import { AutoSaveIndicator } from "@/components/ui/auto-save-indicator";
import { Spinner } from "@/components/ui/spinner";
import type { MedicalReport, ExaminationType } from "@/types/medical-report";
import { createReportData } from "@/utils/reportUtils";

// Define form schema with validation rules
const formSchema = z.object({
  report: z.string().min(1, "Nalaz je obavezan"),
  therapy: z.string().min(1, "Terapija je obavezna"),
  notes: z.string().optional(),
  status: z.enum(["draft", "final"]),
  appointmentType: z.string().min(1, "Vrsta pregleda je obavezna"),
  visitType: z.enum(["first", "followup"], {
    required_error: "Molimo odaberite vrstu posjete",
  }),
});

// Define a type for form data based on schema
export type MedicalReportFormData = z.infer<typeof formSchema>;

interface MedicalReportFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<MedicalReport>) => void;
  defaultValues?: Partial<MedicalReport>;
  examinationTypes: ExaminationType[];
}

export default function MedicalReportForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  examinationTypes,
}: MedicalReportFormProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<"draft" | "final">("draft");
  const [formKey, setFormKey] = useState(`report-form-${Date.now()}`);
  const [loadedExamTypes, setLoadedExamTypes] = useState<ExaminationType[]>(examinationTypes || []);
  const [formData, setFormData] = useState<MedicalReportFormData>({
    report: defaultValues?.report || "",
    therapy: defaultValues?.therapy || "",
    notes: defaultValues?.notes || "",
    status: defaultValues?.status || "draft",
    appointmentType: defaultValues?.appointmentType || "",
    visitType: defaultValues?.visitType || "first",
  });

  const form = useForm<MedicalReportFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: formData,
    mode: "onChange", // Enable validation as user types
  });

  // Load examination types from localStorage if not provided
  useEffect(() => {
    if (!examinationTypes || examinationTypes.length === 0) {
      try {
        const savedTypes = localStorage.getItem('examination-types');
        if (savedTypes) {
          const parsedTypes = JSON.parse(savedTypes);
          if (Array.isArray(parsedTypes) && parsedTypes.length > 0) {
            console.log("[MedicalReportForm] Loaded examination types from localStorage:", parsedTypes);
            setLoadedExamTypes(parsedTypes);
          }
        }
      } catch (error) {
        console.error("[MedicalReportForm] Error loading examination types:", error);
      }
    }
  }, [examinationTypes]);

  useEffect(() => {
    if (defaultValues) {
      console.log("[MedicalReportForm] Default values updated:", defaultValues);
      const updatedFormData = {
        report: defaultValues.report || "",
        therapy: defaultValues.therapy || "",
        notes: defaultValues.notes || "",
        status: defaultValues.status || "draft",
        appointmentType: defaultValues.appointmentType || "",
        visitType: defaultValues.visitType || "first",
      };
      setFormData(updatedFormData);
      form.reset(updatedFormData);
      setFormKey(`report-form-${Date.now()}`); // Force re-render of the form
    }
  }, [defaultValues, form]);

  const { saveStatus, lastSaved } = useSaveData({
    data: { ...formData, defaultValues },
    key: `medical-report-draft-${defaultValues?.id || "new"}`,
    saveDelay: 2000,
    condition: open,
    onSave: async (data) => {
      console.log("[MedicalReportForm] Auto-saving draft:", data);
    },
    onDataLoaded: (loadedData) => {
      if ((!defaultValues || loadedData.defaultValues?.id === defaultValues?.id) && loadedData.report) {
        console.log("[MedicalReportForm] Loading saved draft:", loadedData);
        setFormData(loadedData);
        form.reset(loadedData);
      }
    }
  });

  useEffect(() => {
    const subscription = form.watch((formValues) => {
      setFormData(formValues as MedicalReportFormData);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = (values: MedicalReportFormData) => {
    console.log("[MedicalReportForm] Submitting form:", values);
    
    // Create report data object using helper function
    const reportData = createReportData(values, defaultValues, status);
    console.log("[MedicalReportForm] Created report data:", reportData); // Debug log
    
    const patientHistoryEntry = {
      id: Date.now(),
      patientId: defaultValues?.patientId || 0,
      date: new Date().toISOString(),
      type: values.appointmentType,
      doctor: defaultValues?.doctorInfo?.fullName || "",
      reportId: defaultValues?.id,
    };

    try {
      const existingHistory = localStorage.getItem('patientHistory') || '[]';
      const historyArray = JSON.parse(existingHistory);
      historyArray.push(patientHistoryEntry);
      localStorage.setItem('patientHistory', JSON.stringify(historyArray));
      console.log("[MedicalReportForm] Patient history updated:", patientHistoryEntry);
    } catch (error) {
      console.error("[MedicalReportForm] Error saving patient history:", error);
    }

    toast({
      title: "Nalaz spremljen",
      description: status === "final" ? "Nalaz je finaliziran i spremen za verifikaciju" : "Nalaz je sačuvan kao nacrt",
    });

    onSubmit(reportData);
    onOpenChange(false);
    form.reset();
    
    localStorage.removeItem(`autosave_medical-report-draft-${defaultValues?.id || "new"}`);
  };

  const isSubmitting = form.formState.isSubmitting;
  
  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      if (!isSubmitting) {
        onOpenChange(isOpen);
      }
    }}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="flex items-center justify-between">
          <SheetTitle>Medicinski nalaz</SheetTitle>
          <AutoSaveIndicator 
            status={saveStatus} 
            lastSaved={lastSaved} 
            showText={true} 
            className="text-xs" 
          />
        </SheetHeader>
        
        <div className="mt-6 pr-4">
          <Form {...form} key={formKey}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="visitType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tip posjete</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-row space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="first" id="first" />
                          <label htmlFor="first" className="text-sm font-normal">
                            Prvi pregled
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="followup" id="followup" />
                          <label htmlFor="followup" className="text-sm font-normal">
                            Kontrolni pregled
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="appointmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vrsta pregleda</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Izaberite vrstu pregleda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadedExamTypes.map(type => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="report"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nalaz</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Unesite nalaz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="therapy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terapija</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Unesite terapiju" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dodatne napomene</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Unesite dodatne napomene (opcionalno)" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStatus("draft");
                    form.handleSubmit(handleSubmit)();
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting && status === "draft" ? (
                    <Spinner size="sm" className="mr-2 text-emerald-600" />
                  ) : null}
                  Sačuvaj kao nacrt
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setStatus("final");
                    form.handleSubmit(handleSubmit)();
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting && status === "final" ? (
                    <Spinner size="sm" className="mr-2" />
                  ) : null}
                  Finaliziraj nalaz
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
