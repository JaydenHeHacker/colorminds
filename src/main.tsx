import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Persistent debug logger that survives page reloads
const debugLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message} ${data ? JSON.stringify(data) : ''}`;
  console.log(logEntry);
  
  // Store in sessionStorage so it survives redirects
  const logs = JSON.parse(sessionStorage.getItem('oauth-debug-logs') || '[]');
  logs.push(logEntry);
  sessionStorage.setItem('oauth-debug-logs', JSON.stringify(logs.slice(-50))); // Keep last 50 logs
};

// Display logs on page load
const displayLogs = () => {
  const logs = JSON.parse(sessionStorage.getItem('oauth-debug-logs') || '[]');
  if (logs.length > 0) {
    console.log('=== PERSISTENT DEBUG LOGS ===');
    logs.forEach((log: string) => console.log(log));
    console.log('=== END DEBUG LOGS ===');
  }
};

// Monitor localStorage for debugging Google OAuth
const originalSetItem = localStorage.setItem.bind(localStorage);
const originalRemoveItem = localStorage.removeItem.bind(localStorage);
const originalClear = localStorage.clear.bind(localStorage);

localStorage.setItem = function(key: string, value: string) {
  if (key.includes('auth-token')) {
    debugLog('🟢 SET auth-token', { key });
  }
  return originalSetItem(key, value);
};

localStorage.removeItem = function(key: string) {
  if (key.includes('auth-token')) {
    debugLog('🔴 REMOVE auth-token', { key });
  }
  return originalRemoveItem(key);
};

localStorage.clear = function() {
  debugLog('🔴 CLEAR localStorage');
  return originalClear();
};

// Display logs on startup
displayLogs();
debugLog('App starting', { 
  hasAuthToken: !!localStorage.getItem('sb-gggmfhgavzworznuagzv-auth-token'),
  url: window.location.href 
});

createRoot(document.getElementById("root")!).render(<App />);
