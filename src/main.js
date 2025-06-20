// Global Image Error Logger
window.addEventListener('error', function(event) {
  if (event.target && event.target.tagName && event.target.tagName.toLowerCase() === 'img') {
    console.error(
      'GLOBAL IMG ERROR: Failed to load image.',
      'SRC:', event.target.src,
      'ALT:', event.target.alt,
      'OuterHTML:', event.target.outerHTML
    );
  }
}, true); // Use capture phase to catch errors early and broadly

// /src/main.js

// Import global styles (Tailwind CSS)
import './css/tailwind.css';
import './css/main.css'; // Purple theme
import './css/gemini-window.css';

// Import and initialize your main application logic
// This will execute app.js, including its DOMContentLoaded listener which calls initApp
import './js/app.js';

// Import third-party libraries like TW-Elements
import 'tw-elements'; // Or 'tw-elements/dist/js/index.min.js' if the short path doesn't resolve

// If you have other global initializations, add them here.
// For example, if settings.js was refactored to export an init function:
// import { initializeSettings } from './js/settings.js';
// initializeSettings();
// However, it's better to call such initializers from within app.js's initApp.
