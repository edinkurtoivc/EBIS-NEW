
/**
 * Checks if the application is running in Electron environment
 */
export const isElectron = (): boolean => {
  // Check if window.electron exists and has isElectron property
  if (typeof window !== 'undefined' && window.electron?.isElectron === true) {
    return true;
  }
  
  // Alternative check for Electron environment
  if (typeof navigator === 'object' && 
      typeof navigator.userAgent === 'string' && 
      navigator.userAgent.indexOf('Electron') >= 0) {
    return true;
  }
  
  return false;
};
