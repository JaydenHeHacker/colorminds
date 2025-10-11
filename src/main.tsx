import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Monitor localStorage for debugging Google OAuth
const originalSetItem = localStorage.setItem.bind(localStorage);
const originalRemoveItem = localStorage.removeItem.bind(localStorage);
const originalClear = localStorage.clear.bind(localStorage);

localStorage.setItem = function(key: string, value: string) {
  if (key.includes('auth-token')) {
    console.log('🟢 SET auth-token:', key);
    console.trace('Stack trace:');
  }
  return originalSetItem(key, value);
};

localStorage.removeItem = function(key: string) {
  if (key.includes('auth-token')) {
    console.log('🔴 REMOVE auth-token:', key);
    console.trace('Stack trace:');
  }
  return originalRemoveItem(key);
};

localStorage.clear = function() {
  console.log('🔴 CLEAR localStorage');
  console.trace('Stack trace:');
  return originalClear();
};

createRoot(document.getElementById("root")!).render(<App />);
