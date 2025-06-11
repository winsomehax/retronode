// ROM Scanner Module

class RomScanner {
  constructor() {
    this.createModal();
    this.setupEventListeners();
    this.platformId = null;
    this.platformName = null;
    this.scanning = false;
    this.batchSize = 10; // Process ROMs in batches of 10
    this.currentBatch = [];
    this.foundRoms = [];
    this.processedCount = 0;
    this.totalCount = 0;
  }
  
  createModal() {
    // Create modal if it doesn't exist
    if (document.getElementById('romScannerModal')) {
      return;
    }
    
    const modalHTML = `
      <div id="romScannerModal" class="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center hidden">
        <div class="modal-content w-full max-w-md mx-4 glow-border">
          <div class="modal-header flex items-center justify-between p-4">
            <h3 id="romScannerTitle" class="text-xl font-medium font-heading">Scan ROMs</h3>
            <button id="closeRomScannerModal" class="text-secondary hover:text-primary">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="p-4">
            <div id="romScannerForm">
              <div class="mb-4">
                <label for="romFolderPath" class="block text-sm font-medium text-body mb-1">ROM Folder Path</label>
                <div class="flex">
                  <input id="romFolderPath" type="text" class="form-input rounded-r-none" placeholder="/path/to/roms" required>
                  <button type="button" id="browseFolderBtn" class="px-3 bg-dark border border-l-0 border-border rounded-r-md text-secondary hover:text-primary">
                    <i class="fas fa-folder-open"></i>
                  </button>
                </div>
                <p class="text-xs text-body-dim mt-1">Enter the full path to the folder containing ROM files</p>
              </div>
              
              <div class="mb-4">
                <label for="romExtensions" class="block text-sm font-medium text-body mb-1">File Extensions</label>
                <input id="romExtensions" type="text" class="form-input" value="zip,7z,nes,sfc,smc,n64,z64,gba,gb,md,smd,iso,cue,bin" placeholder="zip,nes,sfc,etc">
                <p class="text-xs text-body-dim mt-1">Comma-separated list of file extensions to scan for</p>
              </div>
              
              <div id="scanProgress" class="mb-4 hidden">
                <label class="block text-sm font-medium text-body mb-1">Scan Progress</label>
                <div class="w-full bg-dark rounded-full h-2.5">
                  <div id="scanProgressBar" class="bg-primary h-2.5 rounded-full" style="width: 0%"></div>
                </div>
                <p id="scanProgressText" class="text-xs text-body-dim mt-1">Scanning...</p>
              </div>
              
              <div id="scanResults" class="mb-4 max-h-60 overflow-y-auto hidden">
                <label class="block text-sm font-medium text-body mb-1">Found ROMs</label>
                <div id="scanResultsList" class="bg-dark p-2 rounded-md text-sm">
                </div>
              </div>
              
              <div class="flex justify-end space-x-2 mt-6">
                <button type="button" id="cancelScanBtn" class="px-4 py-2 bg-dark hover:bg-dark/80 text-body rounded-md">Cancel</button>
                <button type="button" id="startScanBtn" class="btn-primary">Start Scan</button>
                <button type="button" id="importRomsBtn" class="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-md hidden">Import ROMs</button>
              </div>
            </div>
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
    document.getElementById('closeRomScannerModal').addEventListener('click', () => this.hide());
    document.getElementById('cancelScanBtn').addEventListener('click', () => this.hide());
    
    document.getElementById('startScanBtn').addEventListener('click', () => {
      this.startScan();
    });
    
    document.getElementById('importRomsBtn').addEventListener('click', () => {
      this.importRoms();
    });
    
    // Browse folder button would typically open a file dialog
    // Since we can't do that directly in the browser, we'll just show a message
    document.getElementById('browseFolderBtn').addEventListener('click', () => {
      alert('In a real implementation, this would open a folder selection dialog.\nFor now, please enter the folder path manually.');
    });
  }
  
  async startScan() {
    const folderPath = document.getElementById('romFolderPath').value.trim();
    const extensions = document.getElementById('romExtensions').value.trim().split(',').map(ext => ext.trim());
    
    if (!folderPath) {
      alert('Please enter a folder path');
      return;
    }
    
    if (extensions.length === 0) {
      alert('Please enter at least one file extension');
      return;
    }
    
    this.scanning = true;
    this.foundRoms = [];
    this.processedCount = 0;
    this.currentBatch = [];
    
    // Show progress UI
    document.getElementById('scanProgress').classList.remove('hidden');
    document.getElementById('scanResults').classList.remove('hidden');
    document.getElementById('startScanBtn').disabled = true;
    document.getElementById('importRomsBtn').classList.add('hidden');
    
    try {
      // Scan the folder using the server endpoint
      await this.scanFolder(folderPath, extensions);
      
      // Update UI
      document.getElementById('scanProgressBar').style.width = '100%';
      document.getElementById('scanProgressText').textContent = `Scan complete. Found ${this.foundRoms.length} ROMs.`;
      document.getElementById('startScanBtn').disabled = false;
      document.getElementById('importRomsBtn').classList.remove('hidden');
      
    } catch (error) {
      console.error('Error scanning for ROMs:', error);
      document.getElementById('scanProgressText').textContent = `Error: ${error.message}`;
      document.getElementById('startScanBtn').disabled = false;
    }
    
    this.scanning = false;
  }
  
  async scanFolder(folderPath, extensions) {
    try {
      // Get all ROMs in the folder using the server endpoint
      const response = await fetch('/api/scan-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          folderPath,
          extensions
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to scan folder');
      }
      
      const romList = data.files;
      this.totalCount = romList.length;
      
      if (romList.length === 0) {
        document.getElementById('scanProgressText').textContent = 'No ROMs found in the specified folder.';
        return;
      }
      
      // Process all ROMs in batches of 10
      for (let i = 0; i < romList.length; i += this.batchSize) {
        // Take a slice of 10 ROMs (or fewer for the last batch)
        const batch = romList.slice(i, i + this.batchSize);
        this.currentBatch = batch;
        
        // Process this batch with a single GitHub Models API call
        await this.processRomBatch();
        
        // Update progress
        this.processedCount += batch.length;
        const progress = Math.round((this.processedCount / this.totalCount) * 100);
        document.getElementById('scanProgressBar').style.width = `${progress}%`;
        document.getElementById('scanProgressText').textContent = 
          `Processing... ${this.processedCount}/${this.totalCount} (Batch ${Math.floor(i/this.batchSize) + 1}/${Math.ceil(romList.length/this.batchSize)})`;
      }
    } catch (error) {
      console.error('Error scanning folder:', error);
      document.getElementById('scanProgressText').textContent = `Error: ${error.message}`;
      throw error;
    }
  }
  
  async processRomBatch() {
    if (this.currentBatch.length === 0) return;
    
    try {
      // In a real implementation, we would send the batch to the GitHub Models API
      const identifiedRoms = await this.identifyRomsWithGithubModels(this.currentBatch);
      
      // Add identified ROMs to the found ROMs list
      this.foundRoms = [...this.foundRoms, ...identifiedRoms];
      
      // Update the UI with the found ROMs
      this.updateRomsList();
      
      // Clear the current batch
      this.currentBatch = [];
    } catch (error) {
      console.error('Error processing ROM batch:', error);
    }
  }
  
  async identifyRomsWithGithubModels(romNames) {
    // In a real implementation, this would send a request to the GitHub Models API
    // The prompt would look like:
    /*
    You are the world's leading expert in identifying the name of a retro game from just the platform and rom name.
    Below is a list of rom names. YOU MUST RETURN ONLY JSON.
    The JSON should contain the full name of the game, a short description of the game, and a field called "success"
    which is true or false denoting whether you succeeded in identifying that rom.
    PLATFORM: ${this.platformName}
    ROM: ${romNames[0]}
    PLATFORM: ${this.platformName}
    ROM: ${romNames[1]}
    ...
    */
    
    console.log(`Identifying batch of ${romNames.length} ROMs for platform ${this.platformName}`);
    
    // For this demo, we'll simulate the response
    // In a real implementation, you would send a request to the GitHub Models API
    
    // Simulate a delay to represent API call time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Process each ROM name
    return romNames.map(romName => {
      // Generate generic data for ROMs
      const nameParts = romName.replace(/\.\w+$/, '').split(/[_\s\-\.]+/);
      const formattedName = nameParts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
      
      return {
        filename: romName,
        name: formattedName,
        description: `A ${this.platformName} game.`,
        success: true
      };
    });
  }
  
  updateRomsList() {
    const resultsList = document.getElementById('scanResultsList');
    
    // Clear existing content
    resultsList.innerHTML = '';
    
    // Add each ROM to the list
    this.foundRoms.forEach(rom => {
      const romElement = document.createElement('div');
      romElement.className = 'mb-2 p-2 border border-border rounded-md';
      
      romElement.innerHTML = `
        <div class="flex items-center">
          <div class="flex-1">
            <div class="text-primary font-medium">${rom.name}</div>
            <div class="text-xs text-body-dim">${rom.filename}</div>
          </div>
          <div>
            <input type="checkbox" class="rom-checkbox" data-filename="${rom.filename}" checked>
          </div>
        </div>
        <div class="text-xs text-body mt-1">${rom.description}</div>
      `;
      
      resultsList.appendChild(romElement);
    });
  }
  
  async importRoms() {
    // Get selected ROMs
    const selectedRoms = Array.from(document.querySelectorAll('.rom-checkbox:checked')).map(checkbox => {
      const filename = checkbox.getAttribute('data-filename');
      return this.foundRoms.find(rom => rom.filename === filename);
    });
    
    if (selectedRoms.length === 0) {
      alert('Please select at least one ROM to import');
      return;
    }
    
    // Show importing status
    document.getElementById('importRomsBtn').disabled = true;
    document.getElementById('importRomsBtn').textContent = 'Importing...';
    
    try {
      // Import each ROM
      for (const rom of selectedRoms) {
        await this.importRom(rom);
      }
      
      // Show success message
      alert(`Successfully imported ${selectedRoms.length} ROMs`);
      
      // Close the modal
      this.hide();
      
      // Reload games to show the new ones
      if (typeof loadGames === 'function') {
        loadGames();
      }
    } catch (error) {
      console.error('Error importing ROMs:', error);
      alert(`Error importing ROMs: ${error.message}`);
    } finally {
      document.getElementById('importRomsBtn').disabled = false;
      document.getElementById('importRomsBtn').textContent = 'Import ROMs';
    }
  }
  
  async importRom(rom) {
    // Create a game object from the ROM
    const gameData = {
      title: rom.name,
      description: rom.description,
      platforms: {
        [this.platformId]: `/roms/${this.platformId}/${rom.filename}`
      }
    };
    
    // Send the game data to the server
    const response = await fetch('/api/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(gameData)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to import ROM');
    }
    
    return data;
  }
  
  show(platformId, platformName) {
    this.platformId = platformId;
    this.platformName = platformName;
    
    // Reset the form
    document.getElementById('romFolderPath').value = `/roms/${platformId}`;
    document.getElementById('scanProgress').classList.add('hidden');
    document.getElementById('scanResults').classList.add('hidden');
    document.getElementById('startScanBtn').disabled = false;
    document.getElementById('importRomsBtn').classList.add('hidden');
    document.getElementById('scanResultsList').innerHTML = '';
    
    // Update the title
    document.getElementById('romScannerTitle').textContent = `Scan ROMs for ${platformName}`;
    
    // Show the modal
    document.getElementById('romScannerModal').classList.remove('hidden');
  }
  
  hide() {
    document.getElementById('romScannerModal').classList.add('hidden');
  }
}

// Initialize the ROM scanner
const romScanner = new RomScanner();