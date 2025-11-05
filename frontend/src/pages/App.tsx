import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Alerts as AlertNotification } from '../components/Alerts';
import { ToastContainer, ToastProvider } from '../components/Toast';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Dashboard } from './Dashboard';
import { Streams } from './Streams';
import { AlertsPage } from './Alerts';
import { Bot } from './Bot';
import { Settings } from './Settings';
import { History } from './History';
import '../styles/theme.css';

export function App() {
  const [alertTick, setAlertTick] = React.useState(0);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log error to console or error reporting service
        console.error('App-level error:', error, errorInfo);
      }}
    >
      <BrowserRouter>
        <ToastProvider>
          <div className="rs-grid" style={{padding:16}}>
            <ErrorBoundary>
              <Sidebar />
            </ErrorBoundary>
            <main style={{display:'flex',flexDirection:'column',gap:12}}>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/streams" element={<Streams />} />
                  <Route path="/alerts" element={<AlertsPage />} />
                  <Route path="/bot" element={<Bot />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </ErrorBoundary>
            </main>
            <ErrorBoundary>
              <AlertNotification trigger={alertTick} />
            </ErrorBoundary>
            <ErrorBoundary>
              <ToastContainer />
            </ErrorBoundary>
          </div>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}


