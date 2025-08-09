/**
 * Utility functions for file system operations in Electron environment
 */
import type { MedicalReportFile } from '@/types/medical-report';
import type { Patient } from '@/types/patient';
import { ensurePatient } from '@/types/patient';

// Constants for directory and file paths
export const DEFAULT_DIRS = {
  ROOT: '',
  PATIENTS: '/Pacijenti',
  USERS: '/Korisnici',
  APPOINTMENTS: '/Termini',
  REPORTS: '/Nalazi',
  SETTINGS: '/Postavke',
  BACKUPS: '/SigurnosneKopije',
  LOGS: '/Logs',
  EXAMINATION_TYPES: '/VrstePregleda',
};

export const DATA_FILES = {
  PATIENTS_INDEX: `${DEFAULT_DIRS.PATIENTS}/index.json`,
  APPOINTMENTS: `${DEFAULT_DIRS.APPOINTMENTS}/appointments.json`,
  USERS: `${DEFAULT_DIRS.USERS}/users.json`,
  SETTINGS: `${DEFAULT_DIRS.SETTINGS}/clinic-info.json`,
  EXAMINATION_TYPES: `${DEFAULT_DIRS.EXAMINATION_TYPES}/examination-types.json`,
  SYSTEM_LOG: `${DEFAULT_DIRS.LOGS}/system-log.json`,
  REPORTS_INDEX: `${DEFAULT_DIRS.REPORTS}/index.json`,
  LOG_FILE: '/log.txt',
};

/**
 * Check if file system access is available through Electron API
 */
export const isFileSystemAvailable = () => {
  return Boolean(window.electron && window.electron.isElectron);
};

/**
 * Initialize file system directory structure
 */
export const initializeFileSystem = async (basePath: string): Promise<boolean> => {
  if (!isFileSystemAvailable()) {
    console.warn('File system access not available');
    return false;
  }
  
  try {
    const dirs = Object.values(DEFAULT_DIRS);
    let success = true;
    
    // Create all required directories
    for (const dir of dirs) {
      if (dir === DEFAULT_DIRS.ROOT) continue; // Skip root dir
      
      const dirPath = basePath + dir;
      const dirExists = await window.electron.fileExists(dirPath);
      
      if (!dirExists) {
        const created = await window.electron.createDirectory(dirPath);
        if (!created) {
          console.error(`Failed to create directory: ${dirPath}`);
          success = false;
        }
      }
    }
    
    // Initialize all required index files with empty structures
    await createEmptyJsonFiles(basePath);
    
    return success;
  } catch (error) {
    console.error('Error initializing file system:', error);
    return false;
  }
};

/**
 * Create empty JSON files for required data structures
 */
const createEmptyJsonFiles = async (basePath: string): Promise<void> => {
  const files = [
    { path: DATA_FILES.PATIENTS_INDEX, data: { patients: [] } },
    { path: DATA_FILES.APPOINTMENTS, data: { appointments: [] } },
    { path: DATA_FILES.USERS, data: { users: [] } },
    { path: DATA_FILES.SETTINGS, data: { name: '', address: '', phone: '' } },
    { path: DATA_FILES.EXAMINATION_TYPES, data: { types: [] } },
    { path: DATA_FILES.SYSTEM_LOG, data: { logs: [] } },
    { path: DATA_FILES.REPORTS_INDEX, data: { reports: [] } },
  ];
  
  for (const file of files) {
    const filePath = basePath + file.path;
    const exists = await window.electron.fileExists(filePath);
    
    if (!exists) {
      await writeJsonData(filePath, file.data);
    }
  }
};

/**
 * Read JSON data from file
 */
export const readJsonData = async <T>(filePath: string, defaultData: T | null): Promise<T> => {
  try {
    if (!isFileSystemAvailable()) {
      throw new Error('File system access not available');
    }
    
    const exists = await window.electron.fileExists(filePath);
    
    if (!exists) {
      if (defaultData === null) {
        throw new Error(`File does not exist: ${filePath}`);
      }
      return defaultData;
    }
    
    const data = await window.electron.readTextFile(filePath);
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    if (defaultData !== null) {
      return defaultData;
    }
    throw error;
  }
};

/**
 * Write JSON data to file
 */
export const writeJsonData = async <T>(filePath: string, data: T): Promise<boolean> => {
  try {
    if (!isFileSystemAvailable()) {
      throw new Error('File system access not available');
    }
    
    // Create directory if it doesn't exist
    const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
    await createFolderIfNotExists(dirPath);
    
    // Write data
    const jsonString = JSON.stringify(data, null, 2);
    await window.electron.writeTextFile(filePath, jsonString);
    return true;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    return false;
  }
};

/**
 * Log an action to the system log
 */
export const logAction = async (basePath: string, action: string): Promise<void> => {
  try {
    const logPath = basePath + DATA_FILES.SYSTEM_LOG;
    const logData = await readJsonData(logPath, { logs: [] });
    
    const timestamp = new Date().toISOString();
    logData.logs.push({
      timestamp,
      action
    });
    
    // Keep only the last 1000 log entries
    if (logData.logs.length > 1000) {
      logData.logs = logData.logs.slice(-1000);
    }
    
    await writeJsonData(logPath, logData);
  } catch (error) {
    console.error('Error logging action:', error);
  }
};

/**
 * Create a folder if it doesn't exist
 */
export const createFolderIfNotExists = async (path: string): Promise<boolean> => {
  if (!isFileSystemAvailable()) return false;
  
  try {
    const exists = await window.electron.fileExists(path);
    
    if (!exists) {
      return await window.electron.createDirectory(path);
    }
    
    return true;
  } catch (error) {
    console.error(`Error creating folder ${path}:`, error);
    return false;
  }
};

/**
 * Create patient directory and save initial patient data
 */
export const createPatientDirectory = async (basePath: string, patient: Patient): Promise<string> => {
  if (!isFileSystemAvailable()) return '';
  
  try {
    // Ensure patient has name getter
    const typedPatient = ensurePatient(patient);
    
    // Create patient folder name
    const folderName = `${typedPatient.name.replace(/\s+/g, '_')}_${typedPatient.jmbg}`;
    const patientDir = `${basePath}${DEFAULT_DIRS.PATIENTS}/${folderName}`;
    
    // Create directory
    await createFolderIfNotExists(patientDir);
    
    // Save patient data
    await writeJsonData(`${patientDir}/karton.json`, typedPatient);
    
    return folderName;
  } catch (error) {
    console.error('Error creating patient directory:', error);
    return '';
  }
};

/**
 * Read all patient directories
 */
export const readAllPatientDirectories = async (basePath: string): Promise<string[]> => {
  if (!isFileSystemAvailable() || !basePath) return [];
  
  try {
    const patientsPath = `${basePath}${DEFAULT_DIRS.PATIENTS}`;
    const dirs = await window.electron.readDirectory(patientsPath);
    return dirs.filter(dir => !dir.startsWith('.'));
  } catch (error) {
    console.error("[FileSystem] Error reading patient directories:", error);
    return [];
  }
};

/**
 * Get patient data from patient directory
 */
export const getPatientData = async (basePath: string, patientDir: string): Promise<any> => {
  if (!isFileSystemAvailable() || !basePath) return null;
  
  try {
    const patientPath = `${basePath}${DEFAULT_DIRS.PATIENTS}/${patientDir}`;
    return await readJsonData(`${patientPath}/karton.json`, null);
  } catch (error) {
    console.error("[FileSystem] Error reading patient data:", error);
    return null;
  }
};

/**
 * Move all data to a new location
 */
export const migrateData = async (oldPath: string, newPath: string): Promise<boolean> => {
  if (!isFileSystemAvailable() || !oldPath || !newPath) return false;
  
  try {
    // Initialize new location
    const initialized = await initializeFileSystem(newPath);
    if (!initialized) return false;
    
    // Copy all data from old location to new one
    await window.electron.copyDirectory(oldPath, newPath);
    
    await logAction(newPath, `Data migrated from ${oldPath} to ${newPath}`);
    return true;
  } catch (error) {
    console.error("[FileSystem] Error migrating data:", error);
    return false;
  }
};

/**
 * Create a backup of all data
 */
export const createBackup = async (basePath: string): Promise<string | null> => {
  if (!isFileSystemAvailable() || !basePath) return null;
  
  try {
    const date = new Date().toISOString().split('T')[0];
    const backupFileName = `backup_${date}.zip`;
    const backupPath = `${basePath}${DEFAULT_DIRS.BACKUPS}/${backupFileName}`;
    
    await window.electron.createZipArchive(basePath, backupPath, [DEFAULT_DIRS.BACKUPS]);
    
    await logAction(basePath, `Created backup: ${backupFileName}`);
    return backupPath;
  } catch (error) {
    console.error("[FileSystem] Error creating backup:", error);
    return null;
  }
};

/**
 * Save a medical report to the file system
 */
export const saveMedicalReport = async (basePath: string, patientId: string, report: any): Promise<boolean> => {
  if (!isFileSystemAvailable() || !basePath) return false;
  
  try {
    // Ensure report has a unique ID
    const reportId = report.id || `nalaz_${Date.now()}`;
    const reportFileName = `${reportId}.json`;
    
    // Prepare report data structure according to requirements
    const reportData = {
      id: reportId,
      patientId: patientId,
      date: report.date || new Date().toISOString(),
      report: report.report || "",
      therapy: report.therapy || "",
      appointmentType: report.appointmentType || "Opći pregled",
      doctor: report.doctorInfo?.fullName || "Unknown Doctor",
      verified: report.verificationStatus === 'verified',
      notes: report.notes || ""
    };
    
    // Save report to Nalazi directory
    const reportsDir = `${basePath}${DEFAULT_DIRS.REPORTS}`;
    
    // Ensure the directory exists
    await createFolderIfNotExists(reportsDir);
    
    // Save the full report file
    const reportPath = `${reportsDir}/${reportFileName}`;
    const reportSaved = await writeJsonData(reportPath, reportData);
    
    if (!reportSaved) {
      console.error("[FileSystem] Failed to write report file:", reportPath);
      return false;
    }
    
    // Log success
    console.log("[FileSystem] Successfully wrote report file:", reportPath);
    
    // Update reports index
    const reportsIndexPath = `${basePath}${DATA_FILES.REPORTS_INDEX}`;
    const reportsIndex = await readJsonData<{ reports: any[] }>(reportsIndexPath, { reports: [] });
    
    // Add or update report reference in the index
    const existingIndex = reportsIndex.reports.findIndex(r => r.id === reportId);
    if (existingIndex >= 0) {
      reportsIndex.reports[existingIndex] = {
        id: reportId,
        patientId,
        date: reportData.date,
        type: reportData.appointmentType,
        doctor: reportData.doctor
      };
    } else {
      reportsIndex.reports.push({
        id: reportId,
        patientId,
        date: reportData.date,
        type: reportData.appointmentType,
        doctor: reportData.doctor
      });
    }
    
    // Write updated index file
    await writeJsonData(reportsIndexPath, reportsIndex);
    
    // Log this action
    await logAction(basePath, `Saved medical report: ${reportId} for patient: ${patientId}`);
    
    console.log("[fileSystemUtils] Successfully saved medical report:", reportId);
    return true;
  } catch (error) {
    console.error("[FileSystem] Error saving medical report:", error);
    return false;
  }
};

/**
 * Get medical reports for a specific patient
 */
export const getPatientReports = async (basePath: string, patientId: string): Promise<MedicalReportFile[]> => {
  if (!isFileSystemAvailable() || !basePath) return [];
  
  try {
    const reportsDir = `${basePath}${DEFAULT_DIRS.REPORTS}`;
    
    // First check if directory exists
    const dirExists = await window.electron.fileExists(reportsDir);
    if (!dirExists) {
      console.log("[FileSystem] Reports directory does not exist:", reportsDir);
      await window.electron.createDirectory(reportsDir);
      return [];
    }
    
    console.log("[FileSystem] Reading reports from directory:", reportsDir);
    const allFiles = await window.electron.readDirectory(reportsDir);
    console.log("[FileSystem] Found files:", allFiles);
    
    const reports: MedicalReportFile[] = [];
    
    // Read each JSON file and filter by patientId
    for (const file of allFiles) {
      if (file.endsWith('.json') && file !== 'index.json') {
        try {
          const filePath = `${reportsDir}/${file}`;
          console.log("[FileSystem] Reading report file:", filePath);
          const reportData = await readJsonData<MedicalReportFile>(filePath, null);
          
          if (reportData && reportData.patientId === patientId) {
            console.log("[FileSystem] Found matching report:", reportData.id);
            reports.push(reportData);
          }
        } catch (error) {
          console.error(`[FileSystem] Error reading report file ${file}:`, error);
        }
      }
    }
    
    // Sort by date descending (newest first)
    return reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("[FileSystem] Error getting patient reports:", error);
    return [];
  }
};

/**
 * Get a specific medical report by ID
 */
export const getMedicalReport = async (basePath: string, reportId: string): Promise<MedicalReportFile | null> => {
  if (!isFileSystemAvailable() || !basePath) return null;
  
  try {
    const reportPath = `${basePath}${DEFAULT_DIRS.REPORTS}/${reportId}.json`;
    return await readJsonData<MedicalReportFile>(reportPath, null);
  } catch (error) {
    console.error("[FileSystem] Error getting medical report:", error);
    return null;
  }
};
