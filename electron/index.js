
const { app } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// Check if running in development or production
const isDev = process.env.NODE_ENV === 'development';

async function ensureResourcesExist() {
  try {
    // Create resources directory if it doesn't exist
    const resourcesPath = path.join(isDev ? __dirname : process.resourcesPath, '..', 'resources');
    await fs.mkdir(resourcesPath, { recursive: true });
    
    console.log('Resources directory ensured at:', resourcesPath);
  } catch (error) {
    console.error('Error ensuring resources directory exists:', error);
  }
}

// Ensure resources directory exists before loading main process
async function startApp() {
  await ensureResourcesExist();
  require('./main');
}

// Start the application
startApp();
