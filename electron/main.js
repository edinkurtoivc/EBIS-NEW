import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const isDev = process.env.NODE_ENV === 'development';

// Zamjena za __dirname i __filename u ES modu
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

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

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('dialog:openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory']
  });

  if (canceled) {
    return null;
  } else {
    return filePaths[0];
  }
});

ipcMain.handle('getFolderInfo', async (event, folderPath) => {
  if (!folderPath) return { usedSpace: "0 MB", totalSpace: "Unknown", percentage: 0 };

  try {
    return { 
      usedSpace: "245 MB",
      totalSpace: "500 GB",
      percentage: 0.5
    };
  } catch (error) {
    console.error("Error getting folder info:", error);
    return { usedSpace: "0 MB", totalSpace: "Unknown", percentage: 0 };
  }
});
