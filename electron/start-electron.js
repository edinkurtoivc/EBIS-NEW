import { spawn } from 'child_process';
import { platform } from 'os';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Zamjene za __dirname i __filename u ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 🔧 Prebaci radni direktorij u root projekta
const projectRoot = resolve(__dirname, '..');
process.chdir(projectRoot);

const npmCmd = platform() === 'win32' ? 'npm.cmd' : 'npm';

console.log('Starting development server...');
const devServer = spawn(npmCmd, ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

setTimeout(() => {
  console.log('Starting Electron...');
  const electron = spawn(npmCmd, ['run', 'electron:start'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });

  electron.on('close', (code) => {
    console.log(`Electron process exited with code ${code}`);
    devServer.kill();
    process.exit(code);
  });
}, 5000);

process.on('SIGINT', () => {
  devServer.kill();
  process.exit(0);
});
