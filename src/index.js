
import React from 'react';

import ReactDOM from 'react-dom/client';
import './index.css';
import './style/custom.css';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS for map functionality
import App from './App';
//import gitRev from 'git-rev-sync';  // Correct way to import git-rev-sync


import { UserProvider } from './context/user_context';


// // Get the current commit hash
// const APP_VERSION = gitRev.long();

// const checkVersionAndReload = () => {
//   const storedVersion = localStorage.getItem("appVersion");

//   // If the versions don't match, update the version and force a reload
//   if (storedVersion !== APP_VERSION) {
//     localStorage.setItem("appVersion", APP_VERSION);
//     window.location.reload(true); // Force reload to clear cache
//   }
// };

// useEffect(() => {
//   checkVersionAndReload();
// }, []);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <UserProvider>
        <App />
    </UserProvider>
);
