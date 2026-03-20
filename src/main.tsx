import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './index.css';
import App from './App.tsx';
import { ThemeProvider } from './contexts/ThemeContext';

// Initialize Firebase (side effect import)
import './services/firebaseService';

// Sentry — จับ runtime error จาก user จริง (production only)
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: 'production',
    release: import.meta.env.VITE_APP_VERSION,
    // บันทึก 10% ของ session สำหรับ performance tracing
    tracesSampleRate: 0.1,
    // แสดงเฉพาะ error ที่เกิดใน production ไม่รวม localhost
    beforeSend(event) {
      if (window.location.hostname === 'localhost') return null;
      return event;
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
