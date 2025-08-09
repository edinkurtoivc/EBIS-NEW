const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  getFolderInfo: (path) => ipcRenderer.invoke('getFolderInfo', path),
  fileExists: (path) => ipcRenderer.invoke('fileExists', path),
  createDirectory: (path) => ipcRenderer.invoke('createDirectory', path),
  writeTextFile: (path, content) => ipcRenderer.invoke('writeTextFile', path, content),
  readTextFile: (path) => ipcRenderer.invoke('readTextFile', path),
  deleteFile: (path) => ipcRenderer.invoke('deleteFile', path),
  renameFile: (oldPath, newPath) => ipcRenderer.invoke('renameFile', oldPath, newPath),
  appendToLog: (path, entry) => ipcRenderer.invoke('appendToLog', path, entry),
  readDirectory: (path) => ipcRenderer.invoke('readDirectory', path),
  isElectron: true
});
