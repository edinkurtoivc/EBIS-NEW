
interface ElectronAPI {
  openDirectory: () => Promise<string>;
  getFolderInfo: (path: string) => Promise<{ 
    usedSpace: string; 
    totalSpace: string; 
    percentage: number; 
  }>;
  isElectron: boolean;
  
  // File system operations
  createDirectory: (dirPath: string) => Promise<boolean>;
  fileExists: (filePath: string) => Promise<boolean>;
  readJsonFile: (filePath: string) => Promise<any>;
  writeJsonFile: (filePath: string, data: any) => Promise<boolean>;
  readTextFile: (filePath: string) => Promise<string>;
  writeTextFile: (filePath: string, data: string, encoding?: string) => Promise<boolean>;
  appendToTextFile: (filePath: string, data: string) => Promise<boolean>;
  readDirectory: (dirPath: string) => Promise<string[]>;
  copyDirectory: (src: string, dest: string) => Promise<boolean>;
  createZipArchive: (sourceDir: string, outputPath: string, excludeDirs?: string[]) => Promise<boolean>;
  deleteFile: (filePath: string) => Promise<boolean>;
  deleteDirectory: (dirPath: string) => Promise<boolean>;
}

interface Window {
  electron: ElectronAPI;
}
