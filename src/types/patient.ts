
export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dob: string;
  jmbg: string;
  phone: string;
  address?: string;
  email?: string;
  gender?: 'M' | 'F';
  // Add a name getter for backwards compatibility with existing code
  get name(): string;
}

export interface PatientHistory {
  id: number;
  patientId: number;
  date: string;
  type: string;
  doctor: string;
  reportId?: string;
}

export interface ReportVersion {
  id: string;
  reportId: string;
  content: string;
  therapy: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
  status: 'draft' | 'final';
}

export interface AuditLog {
  id: number;
  action: 'create' | 'update' | 'view' | 'verify' | 'edit';
  entityType: 'patient' | 'report' | 'appointment';
  entityId: string | number;
  performedBy: string;
  performedAt: string;
  details: string;
  reason?: string;  // Reason for editing reports
  reportId?: string; // For report-related activities
  appointmentId?: string; // For appointment-related activities
}

export interface MedicalReportFile {
  id: string;
  patientId: string;
  date: string;
  report: string;
  therapy: string;
  appointmentType: string;
  doctor: string;
  verified: boolean;
  notes?: string;
}

// Create a PatientImpl class implementing the Patient interface
// This adds the name getter for backward compatibility
export class PatientImpl implements Patient {
  id: number;
  firstName: string;
  lastName: string;
  dob: string;
  jmbg: string;
  phone: string;
  address?: string;
  email?: string;
  gender?: 'M' | 'F';

  constructor(data: Omit<Patient, 'name'>) {
    this.id = data.id;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.dob = data.dob;
    this.jmbg = data.jmbg;
    this.phone = data.phone;
    this.address = data.address;
    this.email = data.email;
    this.gender = data.gender;
  }

  get name(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

// Helper function to ensure patient objects have the name getter
export function ensurePatient(patientData: any): Patient {
  if (patientData && !('name' in patientData) && patientData.firstName && patientData.lastName) {
    return new PatientImpl(patientData);
  }
  return patientData;
}
