export interface MedicalReport {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  report: string;
  therapy: string;
  notes?: string;
  status: 'draft' | 'final';
  appointmentId?: string;
  appointmentType?: string;
  visitType: 'first' | 'followup';
  patientInfo: {
    fullName: string;
    birthDate: string;
    gender: 'M' | 'F';
    jmbg: string;
  };
  doctorInfo?: {
    fullName: string;
    specialization?: string;
    signatureImage?: string;
    stampImage?: string;
  };
  signature?: boolean;
  stamp?: boolean;
  versions?: MedicalReportVersion[];
  updatedAt?: string;
  updatedBy?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  verificationStatus: 'unverified' | 'pending' | 'verified';
  reportCode?: string; // Added unique report code
}

export interface MedicalReportVersion {
  id: string;
  reportId: string;
  version: number;
  report: string;
  therapy: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
  status: 'draft' | 'final';
}

export interface MedicalReportAudit {
  id: string;
  reportId: string;
  action: 'created' | 'updated' | 'viewed' | 'printed' | 'verified';
  performedBy: string;
  performedAt: string;
  details?: string;
}

export interface ExaminationType {
  id: number;
  name: string;
  duration: string;
  price: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  examinationType: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  reportId?: string;
  cancellationReason?: string;
  scheduledAt?: string;   // When the appointment was created/scheduled
  completedAt?: string;   // When the appointment was marked as completed
  cancelledAt?: string;   // When the appointment was cancelled
  reportCompletedAt?: string; // When the medical report was finalized
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
