// Settings management for RetroNode

document.addEventListener('DOMContentLoaded', function() {
  // Initialize settings
  initializeSettings();
  
  // Add event listener for the settings form
  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm) {
    settingsForm.addEventListener('submit', saveSettings);
  }
});

// Initialize settings from localStorage
function initializeSettings() {
  // ROM identification model preference
  const modelPreference = localStorage.getItem('romIdentificationModel') || 'github';
  const modelSelect = document.getElementById('romIdentificationModel');
  if (modelSelect) {
    modelSelect.value = modelPreference;
  }
}

// Save settings to localStorage
function saveSettings(e) {
  if (e) e.preventDefault();
  
  // ROM identification model preference
  const modelSelect = document.getElementById('romIdentificationModel');
  if (modelSelect) {
    localStorage.setItem('romIdentificationModel', modelSelect.value);
  }
  
  // Show success message
  alert('Settings saved successfully');
}

// Get a setting value with default
function getSetting(key, defaultValue) {
  return localStorage.getItem(key) || defaultValue;
}