
import { createRoot } from 'react-dom/client';
import ElectronApp from './ElectronApp.tsx';
import './index.css';

createRoot(document.getElementById("root")!).render(<ElectronApp />);
