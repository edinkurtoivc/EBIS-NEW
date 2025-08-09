import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import checkDiskSpace from 'check-disk-space';

const isDev = process.env.NODE_ENV === 'development';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const appURL = isDev
    ? 'http://localhost:8080'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(appURL);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

export default function main() {
  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // 📁 Dijalog za izbor foldera
  ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory']
    });
    return canceled ? null : filePaths[0];
  });

  // 📦 Info o folderu
  ipcMain.handle('getFolderInfo', async (event, folderPath) => {
    if (!folderPath) {
      return { usedSpace: '0 MB', totalSpace: 'Unknown', percentage: 0 };
    }

    try {
      const usedBytes = await calculateFolderSize(folderPath);
      const root = path.parse(folderPath).root;
      const diskInfo = await checkDiskSpace(root);
      const totalBytes = diskInfo.size;
      const percentage = totalBytes ? usedBytes / totalBytes : 0;

      return {
        usedSpace: formatBytes(usedBytes),
        totalSpace: formatBytes(totalBytes),
        percentage: parseFloat((percentage * 100).toFixed(2))
      };
    } catch (error) {
      console.error('❌ Failed to calculate folder info:', error);
      return { usedSpace: '0 MB', totalSpace: 'Unknown', percentage: 0 };
    }
  });

  // ✅ Provjeri postoji li fajl
  ipcMain.handle('fileExists', async (event, filePath) => {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  });

  // ✅ Kreiraj direktorij
  ipcMain.handle('createDirectory', async (event, dirPath) => {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to create directory:', error);
      return { success: false, error: error.message };
    }
  });

  // ✅ Snimi tekst u fajl
  ipcMain.handle('writeTextFile', async (_, path, content) => {
    try {
      await fs.promises.writeFile(path, content, 'utf-8');
      return { success: true };
    } catch (error) {
      console.error('[writeTextFile] Error:', error);
      return { success: false, error: error.message };
    }
  });   

  // ✅ Učitaj fajl kao tekst (vrati string direktno)
  ipcMain.handle('readTextFile', async (event, filePath) => {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      return content;
    } catch (error) {
      console.error('❌ Failed to read file:', error);
      return null;
    }
  });

  // ✅ Obriši fajl
  ipcMain.handle('deleteFile', async (event, filePath) => {
    try {
      await fs.promises.unlink(filePath);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete file:', error);
      return { success: false, error: error.message };
    }
  });

  // ✅ Preimenuj fajl
  ipcMain.handle('renameFile', async (event, oldPath, newPath) => {
    try {
      await fs.promises.rename(oldPath, newPath);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to rename file:', error);
      return { success: false, error: error.message };
    }
  });

  // ✅ Dodaj unos u JSON log
  ipcMain.handle('appendToLog', async (event, filePath, entry) => {
    try {
      let logData = [];
      try {
        const existing = await fs.promises.readFile(filePath, 'utf8');
        logData = JSON.parse(existing);
      } catch {
        logData = [];
      }

      const timestampedEntry = {
        timestamp: new Date().toISOString(),
        ...entry
      };

      logData.push(timestampedEntry);
      await fs.promises.writeFile(filePath, JSON.stringify(logData, null, 2), 'utf8');

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to append to log file:', error);
      return { success: false, error: error.message };
    }
  });

  // ✅ Pročitaj sadržaj foldera
  ipcMain.handle('readDirectory', async (event, dirPath) => {
    try {
      const entries = await fs.promises.readdir(dirPath);
      return entries;
    } catch (error) {
      console.error('❌ Failed to read directory:', error);
      return [];
    }
  });
}

// 📘 Pomoćne funkcije

function formatBytes(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

async function calculateFolderSize(folderPath) {
  let totalSize = 0;

  async function walk(dir) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        const { size } = await fs.promises.stat(fullPath);
        totalSize += size;
      }
    }
  }

  await walk(folderPath);
  return totalSize;
}
