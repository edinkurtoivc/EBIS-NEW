
import type { MedicalReport } from "@/types/medical-report";
import { MedicalReportFormData } from "@/components/medical-reports/MedicalReportForm";

/**
 * Creates a medical report data object from form values and default values
 */
export function createReportData(
  values: MedicalReportFormData,
  defaultValues?: Partial<MedicalReport>,
  status: "draft" | "final" = "draft"
): Partial<MedicalReport> {
  // Generate a unique report code
  const reportCode = generateReportCode();
  
  return {
    ...values,
    date: new Date().toISOString(),
    status,
    verificationStatus: status === "final" ? "pending" as const : "unverified" as const,
    patientId: defaultValues?.patientId,
    doctorId: defaultValues?.doctorId,
    patientInfo: defaultValues?.patientInfo,
    doctorInfo: defaultValues?.doctorInfo,
    reportCode: reportCode,  // Add the generated report code
  };
}

/**
 * Generates a unique report code
 * Format: KL-YYMMDD-XXXX (where XXXX is a random alphanumeric string)
 */
export function generateReportCode(): string {
  // Get current date in YYMMDD format
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  // Generate a random alphanumeric string (4 characters)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Combine to create the report code
  return `KL-${year}${month}${day}-${randomPart}`;
}

/**
 * Validates if a file path is an absolute path
 */
export function isAbsolutePath(path: string): boolean {
  // Check if path starts with '/' on Unix or a drive letter followed by ':\' on Windows
  return /^(\/|[A-Za-z]:\\)/.test(path);
}

/**
 * Ensures a path has correct format for filesystem operations
 */
export function normalizePath(path: string): string {
  // Replace backslashes with forward slashes for consistency
  let normalized = path.replace(/\\/g, '/');
  
  // Remove trailing slash if present (except for root path)
  if (normalized !== '/' && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  
  return normalized;
}
