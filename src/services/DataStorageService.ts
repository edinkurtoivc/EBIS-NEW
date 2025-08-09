
import { isFileSystemAvailable, initializeFileSystem, readJsonData, writeJsonData, logAction, DATA_FILES, DEFAULT_DIRS, createPatientDirectory } from "@/utils/fileSystemUtils";
import { v4 as uuidv4 } from "uuid";
import type { Patient } from "@/types/patient";
import type { Appointment } from "@/types/medical-report";
import type { User } from "@/types/user";

class DataStorageService {
  private _basePath = '';
  private _isInitialized = false;
  private _fallbackToLocalStorage = true;

  constructor() {
    this.loadBasePath();
  }

  /**
   * Get base path for data storage
   */
  get basePath() {
    return this._basePath;
  }

  /**
   * Set base path for data storage
   */
  set basePath(path) {
    this._basePath = path;
    localStorage.setItem('dataFolderPath', path);
  }

  /**
   * Check if data storage is initialized
   */
  get isInitialized() {
    return this._isInitialized;
  }

  /**
   * Initialize data storage
   */
  async initialize(path?: string) {
    if (path) {
      this.basePath = path;
    }

    if (!this.basePath) {
      console.warn("[DataStorage] No base path set, using localStorage fallback");
      this._fallbackToLocalStorage = true;
      return false;
    }

    if (isFileSystemAvailable()) {
      try {
        const initialized = await initializeFileSystem(this.basePath);
        this._isInitialized = initialized;
        this._fallbackToLocalStorage = !initialized;
        
        if (initialized) {
          await logAction(this.basePath, "Data storage initialized");
        }
        
        return initialized;
      } catch (error) {
        console.error("[DataStorage] Error initializing data storage:", error);
        this._fallbackToLocalStorage = true;
        return false;
      }
    } else {
      console.warn("[DataStorage] File system not available, using localStorage fallback");
      this._fallbackToLocalStorage = true;
      return false;
    }
  }

  /**
   * Load base path from localStorage
   */
  loadBasePath() {
    const path = localStorage.getItem('dataFolderPath') || '';
    this._basePath = path;
    
    // If path exists, try to initialize
    if (path) {
      this.initialize();
    }
  }

  /**
   * Get patients data
   */
  async getPatients() {
    if (this._fallbackToLocalStorage || !this.basePath) {
      const localData = localStorage.getItem('patients');
      return localData ? JSON.parse(localData) : [];
    }
    
    try {
      const patientsPath = `${this.basePath}${DATA_FILES.PATIENTS_INDEX}`;
      const data = await readJsonData(patientsPath, { patients: [] });
      return data.patients || [];
    } catch (error) {
      console.error("[DataStorage] Error reading patients:", error);
      // Fallback to localStorage
      const localData = localStorage.getItem('patients');
      return localData ? JSON.parse(localData) : [];
    }
  }

  /**
   * Save patient data
   */
  async savePatient(patient: Patient) {
    try {
      // Ensure patient has an ID
      if (!patient.id) {
        // Generate a numeric ID from UUID
        patient.id = parseInt(uuidv4().replace(/-/g, '').substring(0, 8), 16);
      }
      
      // Always update localStorage for compatibility
      const existingPatients = await this.getPatients();
      const existingIndex = existingPatients.findIndex(p => p.id === patient.id);
      
      let updatedPatients;
      if (existingIndex >= 0) {
        updatedPatients = existingPatients.map(p => p.id === patient.id ? patient : p);
      } else {
        updatedPatients = [...existingPatients, patient];
      }
      
      localStorage.setItem('patients', JSON.stringify(updatedPatients));
      
      // If file system is not available, we're done
      if (this._fallbackToLocalStorage || !this.basePath) {
        return true;
      }
      
      // Save to file system - first update the index
      const patientsIndexPath = `${this.basePath}${DATA_FILES.PATIENTS_INDEX}`;
      await writeJsonData(patientsIndexPath, {
        patients: updatedPatients,
        lastUpdated: new Date().toISOString()
      });
      
      // Create or update patient directory
      const folderName = existingIndex >= 0 
        ? `${patient.firstName}_${patient.lastName}_${patient.jmbg}` 
        : await createPatientDirectory(this.basePath, patient);
      
      // If new patient was created, we're done as createPatientDirectory already writes the files
      if (existingIndex >= 0 && folderName) {
        const patientDir = `${this.basePath}${DEFAULT_DIRS.PATIENTS}/${folderName}`;
        await writeJsonData(`${patientDir}/karton.json`, patient);
      }
      
      // Log the action
      await logAction(this.basePath, `Updated patient: ${patient.firstName} ${patient.lastName} (ID: ${patient.id})`);
      
      return true;
    } catch (error) {
      console.error("[DataStorage] Error saving patient:", error);
      return false;
    }
  }

  /**
   * Get appointments data
   */
  async getAppointments() {
    if (this._fallbackToLocalStorage || !this.basePath) {
      const localData = localStorage.getItem('appointments');
      return localData ? JSON.parse(localData) : [];
    }
    
    try {
      const appointmentsPath = `${this.basePath}${DATA_FILES.APPOINTMENTS}`;
      const data = await readJsonData(appointmentsPath, { appointments: [] });
      return data.appointments || [];
    } catch (error) {
      console.error("[DataStorage] Error reading appointments:", error);
      // Fallback to localStorage
      const localData = localStorage.getItem('appointments');
      return localData ? JSON.parse(localData) : [];
    }
  }
  
  /**
   * Save appointments data
   */
  async saveAppointments(appointments: Appointment[]) {
    try {
      // Always update localStorage for compatibility
      localStorage.setItem('appointments', JSON.stringify(appointments));
      
      // If file system is not available, we're done
      if (this._fallbackToLocalStorage || !this.basePath) {
        return true;
      }
      
      // Save to file system
      const appointmentsPath = `${this.basePath}${DATA_FILES.APPOINTMENTS}`;
      await writeJsonData(appointmentsPath, {
        appointments,
        lastUpdated: new Date().toISOString()
      });
      
      // Log the action
      await logAction(this.basePath, `Updated appointments: ${appointments.length} appointments total`);
      
      return true;
    } catch (error) {
      console.error("[DataStorage] Error saving appointments:", error);
      return false;
    }
  }
  
  /**
   * Add a new appointment
   */
  async addAppointment(appointment: Appointment) {
    try {
      // Ensure appointment has an ID
      if (!appointment.id) {
        appointment.id = `apt-${Date.now()}`;
      }
      
      // Ensure scheduledAt is set
      if (!appointment.scheduledAt) {
        appointment.scheduledAt = new Date().toISOString();
      }
      
      const currentAppointments = await this.getAppointments();
      
      // Check if appointment with same ID already exists
      const existingIndex = currentAppointments.findIndex(a => a.id === appointment.id);
      let updatedAppointments;
      
      if (existingIndex >= 0) {
        // Update existing appointment
        updatedAppointments = currentAppointments.map(a => 
          a.id === appointment.id ? appointment : a
        );
        console.log("[DataStorage] Updated existing appointment:", appointment.id);
      } else {
        // Add new appointment
        updatedAppointments = [...currentAppointments, appointment];
        console.log("[DataStorage] Added new appointment:", appointment.id);
      }
      
      return await this.saveAppointments(updatedAppointments);
    } catch (error) {
      console.error("[DataStorage] Error adding appointment:", error);
      return false;
    }
  }

  /**
   * Update an appointment
   */
  async updateAppointment(updatedAppointment: Appointment) {
    try {
      const currentAppointments = await this.getAppointments();
      const appointmentExists = currentAppointments.some(a => a.id === updatedAppointment.id);
      
      if (!appointmentExists) {
        console.error("[DataStorage] Tried to update non-existing appointment:", updatedAppointment.id);
        return false;
      }
      
      // Find the appointment to update
      const updatedAppointments = currentAppointments.map(appointment => 
        appointment.id === updatedAppointment.id ? updatedAppointment : appointment
      );
      
      // Set timestamps if not already set
      if (updatedAppointment.status === 'completed' && !updatedAppointment.completedAt) {
        updatedAppointment.completedAt = new Date().toISOString();
      }
      
      if (updatedAppointment.status === 'cancelled' && !updatedAppointment.cancelledAt) {
        updatedAppointment.cancelledAt = new Date().toISOString();
      }
      
      console.log("[DataStorage] Updating appointment:", updatedAppointment.id, "Status:", updatedAppointment.status);
      
      const success = await this.saveAppointments(updatedAppointments);
      
      // Log the action
      if (success && this.basePath) {
        await logAction(this.basePath, `Updated appointment: ${updatedAppointment.patientName} (ID: ${updatedAppointment.id}), Status: ${updatedAppointment.status}`);
      }
      
      return success;
    } catch (error) {
      console.error("[DataStorage] Error updating appointment:", error);
      return false;
    }
  }

  /**
   * Complete an appointment and link it to a medical report
   */
  async completeAppointmentWithReport(appointmentId: string, reportId: string) {
    try {
      const currentAppointments = await this.getAppointments();
      const appointmentIndex = currentAppointments.findIndex(a => a.id === appointmentId);
      
      if (appointmentIndex !== -1) {
        const now = new Date().toISOString();
        currentAppointments[appointmentIndex] = {
          ...currentAppointments[appointmentIndex],
          status: 'completed',
          reportId: reportId,
          completedAt: now,
          reportCompletedAt: now
        };
        
        return await this.saveAppointments(currentAppointments);
      }
      return false;
    } catch (error) {
      console.error("[DataStorage] Error completing appointment with report:", error);
      return false;
    }
  }
  
  /**
   * Get users data with comprehensive error handling and logging
   */
  async getUsers(): Promise<User[]> {
    try {
      // First try to get from file system if available
      if (!this._fallbackToLocalStorage && this.basePath) {
        try {
          const usersPath = `${this.basePath}${DATA_FILES.USERS}`;
          const data = await readJsonData(usersPath, { users: [] });
          const usersFromFile = data.users || [];
          
          console.log("[DataStorage] Successfully loaded users from file system:", usersFromFile.length);
          
          // Check if passwords exist
          const allHavePasswords = usersFromFile.every(user => !!user.password);
          if (allHavePasswords) {
            return usersFromFile;
          } else {
            console.warn("[DataStorage] Some users missing passwords in file system, trying localStorage");
          }
        } catch (error) {
          console.error("[DataStorage] Error reading users from file system:", error);
        }
      }
      
      // Try localStorage as fallback
      const localData = localStorage.getItem('users');
      if (localData) {
        try {
          const localUsers = JSON.parse(localData);
          console.log("[DataStorage] Successfully loaded users from localStorage:", localUsers.length);
          
          // Check if passwords exist
          const allHavePasswords = localUsers.every(user => !!user.password);
          if (!allHavePasswords) {
            console.warn("[DataStorage] Some users missing passwords in localStorage");
          }
          
          return localUsers;
        } catch (error) {
          console.error("[DataStorage] Error parsing users from localStorage:", error);
        }
      }
      
      // If we get here, no valid users were found
      console.warn("[DataStorage] No users found in any storage");
      return [];
    } catch (error) {
      console.error("[DataStorage] Unexpected error in getUsers:", error);
      return [];
    }
  }
  
  /**
   * Save users data with comprehensive error handling
   */
  async saveUsers(users: User[]): Promise<boolean> {
    try {
      // Log users being saved
      console.log("[DataStorage] Saving users:", users.length);
      
      // Validate users before saving
      const validUsers = users.filter(user => {
        if (!user.email || !user.role) {
          console.warn("[DataStorage] Skipping invalid user:", user);
          return false;
        }
        
        if (!user.password) {
          console.warn("[DataStorage] User missing password during save:", user.email);
          return false;
        }
        
        return true;
      });
      
      if (validUsers.length !== users.length) {
        console.warn(`[DataStorage] Found ${users.length - validUsers.length} invalid users`);
      }
      
      // Always update localStorage
      localStorage.setItem('users', JSON.stringify(validUsers));
      console.log("[DataStorage] Saved users to localStorage:", validUsers.length);
      
      // If file system is available, save there too
      if (!this._fallbackToLocalStorage && this.basePath) {
        try {
          const usersPath = `${this.basePath}${DATA_FILES.USERS}`;
          await writeJsonData(usersPath, {
            users: validUsers,
            lastUpdated: new Date().toISOString()
          });
          
          console.log("[DataStorage] Saved users to file system:", validUsers.length);
          
          // Log the action
          await logAction(this.basePath, `Updated users data: ${validUsers.length} users`);
        } catch (error) {
          console.error("[DataStorage] Error saving users to file system:", error);
          return true; // Still return true since localStorage save succeeded
        }
      }
      
      return true;
    } catch (error) {
      console.error("[DataStorage] Error saving users:", error);
      return false;
    }
  }
}

// Export a singleton instance
const dataStorageService = new DataStorageService();

export { dataStorageService };
export default dataStorageService;
