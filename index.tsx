

import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Corrected the import path to point to the App component in the 'src' directory,
// as the root App.tsx is a blank placeholder and not a valid module.
import App from './src/App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);