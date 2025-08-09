
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron', {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    getFolderInfo: (path) => ipcRenderer.invoke('getFolderInfo', path),
    isElectron: true
  }
);
