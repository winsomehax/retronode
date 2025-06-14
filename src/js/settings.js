// Settings management for RetroNode

// Initialize settings from localStorage
export function initializeSettings() {
  // ROM identification model preference
  const modelPreference = localStorage.getItem('romIdentificationModel') || 'github';
  const modelSelect = document.getElementById('romIdentificationModel');
  if (modelSelect) {
    modelSelect.value = modelPreference;
  }

  // Add event listener for the settings form
  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm) {
    settingsForm.addEventListener('submit', saveSettings);
  }
}

// Save settings to localStorage
export function saveSettings(e) {
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
export function getSetting(key, defaultValue) {
  return localStorage.getItem(key) || defaultValue;
}