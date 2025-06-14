// Emulator Modal Manager
import { loadEmulatorsForPlatform, updateStats, loadPlatforms } from './app.js';

export default class EmulatorModal {
  constructor() {
    this.createModal();
    this.setupEventListeners();
    this.platformId = null;
    this.emulatorId = null;
    this.isEdit = false;
  }
  
  createModal() {
    // Create modal if it doesn't exist
    if (document.getElementById('emulatorModal')) {
      return;
    }
    
    const modalHTML = `
      <div id="emulatorModal" class="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center hidden">
        <div class="modal-content w-full max-w-md mx-4 glow-border">
          <div class="modal-header flex items-center justify-between p-4">
            <h3 id="emulatorModalTitle" class="text-xl font-medium font-heading">Add Emulator</h3>
            <button id="closeEmulatorModal" class="text-secondary hover:text-primary">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="p-4">
            <form id="emulatorForm">
              <input type="hidden" id="emulatorPlatformId">
              <input type="hidden" id="emulatorId">
              
              <div class="mb-4">
                <label for="emulatorName" class="block text-sm font-medium text-body mb-1">Name</label>
                <input id="emulatorName" type="text" class="form-input" placeholder="e.g., VICE, Nestopia" required>
              </div>
              
              <div class="mb-4">
                <label for="emulatorCommand" class="block text-sm font-medium text-body mb-1">Command</label>
                <input id="emulatorCommand" type="text" class="form-input" placeholder="e.g., vice %ROM%" required>
              </div>
              
              <div class="mb-4">
                <label for="emulatorDescription" class="block text-sm font-medium text-body mb-1">Description</label>
                <textarea id="emulatorDescription" class="form-input" rows="3" placeholder="Brief description of the emulator"></textarea>
              </div>
              
              <div class="mb-4">
                <label for="emulatorWebsite" class="block text-sm font-medium text-body mb-1">Website</label>
                <input id="emulatorWebsite" type="url" class="form-input" placeholder="e.g., https://vice-emu.sourceforge.io/">
              </div>
              
              <div class="flex justify-end space-x-2 mt-6">
                <button type="button" id="cancelEmulatorBtn" class="px-4 py-2 bg-dark hover:bg-dark/80 text-body rounded-md">Cancel</button>
                <button type="submit" class="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to the document
    const div = document.createElement('div');
    div.innerHTML = modalHTML;
    document.body.appendChild(div.firstElementChild);
  }
  
  setupEventListeners() {
    document.getElementById('closeEmulatorModal').addEventListener('click', () => this.hide());
    document.getElementById('cancelEmulatorBtn').addEventListener('click', () => this.hide());
    
    document.getElementById('emulatorForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveEmulator();
    });
  }
  
  async saveEmulator() {
    const platformId = document.getElementById('emulatorPlatformId').value;
    const emulatorId = document.getElementById('emulatorId').value;
    const name = document.getElementById('emulatorName').value;
    const command = document.getElementById('emulatorCommand').value;
    const description = document.getElementById('emulatorDescription').value;
    const website = document.getElementById('emulatorWebsite').value;
    
    if (!platformId || !name || !command) {
      alert('Platform ID, Name, and Command are required');
      return;
    }
    
    const emulatorData = {
      platformId,
      emulator: {
        emulator_id: emulatorId || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`,
        name,
        command,
        description,
        website
      }
    };
    
    try {
      let url, method;
      
      if (this.isEdit) {
        url = `/api/emulators/${platformId}/${emulatorId}`;
        method = 'PUT';
      } else {
        url = '/api/emulators';
        method = 'POST';
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emulatorData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.hide();
        // Reload emulators for the platform
        if (typeof loadEmulatorsForPlatform === 'function') {
          loadEmulatorsForPlatform(platformId);
        }
        // Update stats
        if (typeof updateStats === 'function') {
          updateStats();
        }
        // Reload platform card if we're on the platforms page
        if (typeof loadPlatforms === 'function') {
          loadPlatforms();
        }
      } else {
        alert(data.message || 'Failed to save emulator');
      }
    } catch (error) {
      console.error('Error saving emulator:', error);
      alert('Error saving emulator');
    }
  }
  
  show(platformId, emulatorId = null) {
    this.platformId = platformId;
    this.emulatorId = emulatorId;
    this.isEdit = !!emulatorId;
    
    const modal = document.getElementById('emulatorModal');
    const form = document.getElementById('emulatorForm');
    const modalTitle = document.getElementById('emulatorModalTitle');
    
    // Reset form
    form.reset();
    
    // Set platform ID
    document.getElementById('emulatorPlatformId').value = platformId;
    
    if (emulatorId) {
      // Edit mode
      modalTitle.textContent = 'Edit Emulator';
      document.getElementById('emulatorId').value = emulatorId;
      
      // Load emulator data
      fetch(`/api/emulators/${platformId}`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            const emulator = data.data.find(e => e.emulator_id === emulatorId);
            
            if (emulator) {
              document.getElementById('emulatorName').value = emulator.name || '';
              document.getElementById('emulatorCommand').value = emulator.command || '';
              document.getElementById('emulatorDescription').value = emulator.description || '';
              document.getElementById('emulatorWebsite').value = emulator.website || '';
            }
          }
        });
    } else {
      // Add mode
      modalTitle.textContent = 'Add Emulator';
      document.getElementById('emulatorId').value = '';
    }
    
    // Show modal
    modal.classList.remove('hidden');
  }
  
  hide() {
    document.getElementById('emulatorModal').classList.add('hidden');
  }
}