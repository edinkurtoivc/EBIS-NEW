import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// Za __dirname u ES modu
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

async function ensureResourcesExist() {
  try {
    const resourcesPath = path.join(isDev ? __dirname : process.resourcesPath, '..', 'resources');
    await fs.mkdir(resourcesPath, { recursive: true });
    console.log('Resources directory ensured at:', resourcesPath);
  } catch (error) {
    console.error('Error ensuring resources directory exists:', error);
  }
}

async function startApp() {
  await ensureResourcesExist();

  // Dinamički import main procesa (da ostane kompatibilan s ESM)
  const mainModule = await import('./main.js');
  if (typeof mainModule.default === 'function') {
    mainModule.default();
  }
}

startApp();
