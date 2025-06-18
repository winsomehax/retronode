(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))e(a);new MutationObserver(a=>{for(const s of a)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&e(o)}).observe(document,{childList:!0,subtree:!0});function n(a){const s={};return a.integrity&&(s.integrity=a.integrity),a.referrerPolicy&&(s.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?s.credentials="include":a.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function e(a){if(a.ep)return;a.ep=!0;const s=n(a);fetch(a.href,s)}})();class T{constructor(){this.createModal(),this.setupEventListeners(),this.platformId=null,this.emulatorId=null,this.isEdit=!1}createModal(){if(document.getElementById("emulatorModal"))return;const t=`
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
    `,n=document.createElement("div");n.innerHTML=t,document.body.appendChild(n.firstElementChild)}setupEventListeners(){document.getElementById("closeEmulatorModal").addEventListener("click",()=>this.hide()),document.getElementById("cancelEmulatorBtn").addEventListener("click",()=>this.hide()),document.getElementById("emulatorForm").addEventListener("submit",t=>{t.preventDefault(),this.saveEmulator()})}async saveEmulator(){const t=document.getElementById("emulatorPlatformId").value,n=document.getElementById("emulatorId").value,e=document.getElementById("emulatorName").value,a=document.getElementById("emulatorCommand").value,s=document.getElementById("emulatorDescription").value,o=document.getElementById("emulatorWebsite").value;if(!t||!e||!a){alert("Platform ID, Name, and Command are required");return}const r={platformId:t,emulator:{emulator_id:n||`${e.toLowerCase().replace(/[^a-z0-9]/g,"")}-${Date.now()}`,name:e,command:a,description:s,website:o}};try{let l,d;this.isEdit?(l=`/api/emulators/${t}/${n}`,d="PUT"):(l="/api/emulators",d="POST");const g=await(await fetch(l,{method:d,headers:{"Content-Type":"application/json"},body:JSON.stringify(r)})).json();g.success?(this.hide(),typeof w=="function"&&w(t),typeof v=="function"&&v(),typeof B=="function"&&B()):alert(g.message||"Failed to save emulator")}catch(l){console.error("Error saving emulator:",l),alert("Error saving emulator")}}show(t,n=null){this.platformId=t,this.emulatorId=n,this.isEdit=!!n;const e=document.getElementById("emulatorModal"),a=document.getElementById("emulatorForm"),s=document.getElementById("emulatorModalTitle");a.reset(),document.getElementById("emulatorPlatformId").value=t,n?(s.textContent="Edit Emulator",document.getElementById("emulatorId").value=n,fetch(`/api/emulators/${t}`).then(o=>o.json()).then(o=>{if(o.success){const r=o.data.find(l=>l.emulator_id===n);r&&(document.getElementById("emulatorName").value=r.name||"",document.getElementById("emulatorCommand").value=r.command||"",document.getElementById("emulatorDescription").value=r.description||"",document.getElementById("emulatorWebsite").value=r.website||"")}})):(s.textContent="Add Emulator",document.getElementById("emulatorId").value=""),e.classList.remove("hidden")}hide(){document.getElementById("emulatorModal").classList.add("hidden")}}class S{constructor(){this.createModal(),this.createScanCompleteModal(),this.createImportCompleteModal(),this.setupEventListeners(),this.platformId=null,this.platformName=null,this.scanning=!1,this.batchSize=20,this.currentBatch=[],this.foundRoms=[],this.processedCount=0,this.totalCount=0}createModal(){if(document.getElementById("romScannerModal"))return;const t=`
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
    `,n=document.createElement("div");n.innerHTML=t,document.body.appendChild(n.firstElementChild)}createScanCompleteModal(){if(document.getElementById("scanCompleteModal"))return;const t=`
      <div id="scanCompleteModal" class="fixed inset-0 bg-black bg-opacity-70 z-[51] flex items-center justify-center hidden">
        <div class="modal-content w-full max-w-xs mx-4 glow-border">
          <div class="modal-header flex items-center justify-between p-4">
            <h3 class="text-lg font-medium font-heading">Scan Complete</h3>
            <button id="closeScanCompleteModal" class="text-secondary hover:text-primary">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="p-4 text-center">
            <p id="scanCompleteMessage" class="text-body">Found 0 ROMs.</p>
          </div>
        </div>
      </div>
    `,n=document.createElement("div");n.innerHTML=t,document.body.appendChild(n.firstElementChild)}createImportCompleteModal(){if(document.getElementById("romImportCompleteModal"))return;const t=`
      <div id="romImportCompleteModal" class="fixed inset-0 bg-black bg-opacity-70 z-[51] flex items-center justify-center hidden">
        <div class="modal-content w-full max-w-xs mx-4 glow-border">
          <div class="modal-header flex items-center justify-between p-4">
            <h3 class="text-lg font-medium font-heading">Import Complete</h3>
            <button id="closeRomImportCompleteModal" class="text-secondary hover:text-primary">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="p-4 text-center">
            <p id="importCompleteMessage" class="text-body">Done!</p>
          </div>
        </div>
      </div>
    `,n=document.createElement("div");n.innerHTML=t,document.body.appendChild(n.firstElementChild)}setupEventListeners(){document.getElementById("closeRomScannerModal").addEventListener("click",()=>this.hide()),document.getElementById("cancelScanBtn").addEventListener("click",()=>this.hide()),document.getElementById("startScanBtn").addEventListener("click",()=>{this.startScan()}),document.getElementById("importRomsBtn").addEventListener("click",()=>{this.importRoms()}),document.getElementById("closeScanCompleteModal").addEventListener("click",()=>{document.getElementById("scanCompleteModal").classList.add("hidden")}),document.getElementById("closeRomImportCompleteModal").addEventListener("click",()=>{document.getElementById("romImportCompleteModal").classList.add("hidden"),this.hide()}),document.getElementById("browseFolderBtn").addEventListener("click",()=>{alert(`In a real implementation, this would open a folder selection dialog.
For now, please enter the folder path manually.`)})}async startScan(){const t=document.getElementById("romFolderPath").value.trim(),n=document.getElementById("romExtensions").value.trim().split(",").map(e=>e.trim());if(!t){alert("Please enter a folder path");return}if(n.length===0){alert("Please enter at least one file extension");return}if(!this.isValidPath(t)){alert("Invalid folder path format. Please enter a valid path.");return}this.scanning=!0,this.foundRoms=[],this.processedCount=0,this.currentBatch=[],document.getElementById("scanProgress").classList.remove("hidden"),document.getElementById("scanResultsList").innerHTML="",document.getElementById("scanResults").classList.add("hidden"),document.getElementById("startScanBtn").disabled=!0,document.getElementById("importRomsBtn").classList.add("hidden");try{await this.scanFolder(t,n),document.getElementById("scanProgressBar").style.width="100%",document.getElementById("scanProgressText").textContent=`Scan complete. Found ${this.foundRoms.length} ROMs.`,document.getElementById("startScanBtn").disabled=!1,this.foundRoms.length>0&&document.getElementById("importRomsBtn").classList.remove("hidden"),this.showScanCompleteModal(`Found ${this.foundRoms.length} ROMs.`)}catch(e){console.error("Error scanning for ROMs:",e),document.getElementById("scanProgressText").textContent=`Error: ${e.message}`,document.getElementById("startScanBtn").disabled=!1}this.scanning=!1}isValidPath(t){const n=/^(\/|~|\.)/,e=/^([a-zA-Z]:\\|\\\\)/;return n.test(t)||e.test(t)}async scanFolder(t,n){try{const e=await scanFolderApi(t,n);if(!e.success)throw new Error(e.message||"Failed to scan folder");const a=e.files;if(this.totalCount=a.length,a.length===0){document.getElementById("scanProgressText").textContent="No ROMs found in the specified folder.";return}for(let s=0;s<a.length;s+=this.batchSize){const o=a.slice(s,s+this.batchSize);this.currentBatch=o,await this.processRomBatch(),this.processedCount+=o.length;const r=Math.round(this.processedCount/this.totalCount*100);document.getElementById("scanProgressBar").style.width=`${r}%`,document.getElementById("scanProgressText").textContent=`Processing... ${this.processedCount}/${this.totalCount} (Batch ${Math.floor(s/this.batchSize)+1}/${Math.ceil(a.length/this.batchSize)})`}}catch(e){throw console.error("Error scanning folder:",e),document.getElementById("scanProgressText").textContent=`Error: ${e.message}`,e}}async processRomBatch(){if(this.currentBatch.length!==0)try{const t=await this.identifyRoms(this.currentBatch);this.foundRoms=[...this.foundRoms,...t],this.updateRomsList(),this.currentBatch=[]}catch(t){throw console.error("Error processing ROM batch:",t),new Error(`Failed to process ROM batch: ${t.message}`)}}async identifyRoms(t){console.log(`Identifying batch of ${t.length} ROMs for platform ${this.platformName}`);try{const n=await identifyRomsApi(this.platformName,t);if(!n.success)throw new Error(n.message||"Failed to identify ROMs");return t.map((e,a)=>{const s=n.data[a]||{};return{filename:e,name:s.name||e.replace(/\.\w+$/,"").replace(/[_\-\.]+/g," "),description:s.description||`A ${this.platformName} game.`,success:s.success||!1}})}catch(n){return console.error("Error identifying ROMs:",n),t.map(e=>{const a=e.replace(/\.\w+$/,"").replace(/[_\-\.]+/g," ");return{filename:e,name:a,description:`A ${this.platformName} game.`,success:!1}})}}updateRomsList(){const t=document.getElementById("scanResultsList");t.innerHTML="",this.foundRoms.forEach(n=>{const e=document.createElement("div");e.className="mb-2 p-2 border border-border rounded-md",e.innerHTML=`
        <div class="flex items-center">
          <div class="flex-1">
            <div class="text-primary font-medium">${n.name}</div>
            <div class="text-xs text-body-dim">${n.filename}</div>
          </div>
          <div>
            <input type="checkbox" class="rom-checkbox" data-filename="${n.filename}" checked>
          </div>
        </div>
        <div class="text-xs text-body mt-1">${n.description}</div>
      `,t.appendChild(e)})}async importRoms(){const t=Array.from(document.querySelectorAll(".rom-checkbox:checked")).map(n=>{const e=n.getAttribute("data-filename");return this.foundRoms.find(a=>a.filename===e)});if(t.length===0){alert("Please select at least one ROM to import");return}document.getElementById("importRomsBtn").disabled=!0,document.getElementById("importRomsBtn").textContent="Importing...";try{const n=t.map(e=>this.importRom(e));await Promise.all(n),this.showImportCompleteModal(`Successfully imported ${t.length} ROMs.`),typeof loadGames=="function"&&loadGames("",""),typeof updateStats=="function"&&updateStats()}catch(n){console.error("Error importing ROMs:",n),alert(`Error importing ROMs: ${n.message}`)}finally{document.getElementById("importRomsBtn").disabled=!1,document.getElementById("importRomsBtn").textContent="Import ROMs"}}async importRom(t){const n={title:t.name,description:t.description,platforms:{[this.platformId]:`/roms/${this.platformId}/${t.filename}`}};try{const e=await fetch("/api/games",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)});if(!e.ok){const s=await e.json();throw new Error(s.message||`Server error: ${e.status}`)}const a=await e.json();if(!a.success)throw new Error(a.message||"Failed to import ROM");return a}catch(e){throw console.error(`Error importing ROM ${t.filename}:`,e),new Error(`Failed to import ${t.name}: ${e.message}`)}}show(t,n){this.platformId=t,this.platformName=n,document.getElementById("romFolderPath").value=`/roms/${t}`,document.getElementById("scanProgress").classList.add("hidden"),document.getElementById("scanResults").classList.add("hidden"),document.getElementById("startScanBtn").disabled=!1,document.getElementById("importRomsBtn").classList.add("hidden"),document.getElementById("scanResultsList").innerHTML="",document.getElementById("romScannerTitle").textContent=`Scan ROMs for ${n}`,document.getElementById("romScannerModal").classList.remove("hidden")}hide(){document.getElementById("romScannerModal").classList.add("hidden")}showScanCompleteModal(t){document.getElementById("scanCompleteMessage").textContent=t,document.getElementById("scanCompleteModal").classList.remove("hidden")}showImportCompleteModal(t){document.getElementById("importCompleteMessage").textContent=t,document.getElementById("romImportCompleteModal").classList.remove("hidden")}}var P=new S;window.romScanner=P;class R{constructor(t,n){this.id=t,this.title=n,this.gameData=null,this.createPanel()}createPanel(){if(document.getElementById(this.id))return;const t=`
      <div id="${this.id}" class="api-panel hidden">
        <div class="api-panel-header">
          <h3>${this.title}</h3>
          <button class="api-panel-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="api-panel-body">
          <div class="api-panel-search">
            <input type="text" id="${this.id}Search" placeholder="Search games..." class="api-panel-search-input">
            <button id="${this.id}SearchBtn" class="api-panel-search-button">
              <i class="fas fa-search"></i>
            </button>
          </div>
          <div id="${this.id}Loading" class="api-panel-loading hidden">
            <div class="spinner"></div>
            <p>Loading results...</p>
          </div>
          <div id="${this.id}Error" class="api-panel-error hidden"></div>
          <div id="${this.id}NoResults" class="api-panel-no-results hidden">
            <p>No results found. Try a different search term.</p>
          </div>
          <div id="${this.id}Results" class="api-panel-results"></div>
        </div>
      </div>
    `,n=document.createElement("div");n.innerHTML=t,document.body.appendChild(n.firstElementChild),document.querySelector(`#${this.id} .api-panel-close`).addEventListener("click",()=>this.hide()),document.getElementById(`${this.id}SearchBtn`).addEventListener("click",()=>{const e=document.getElementById(`${this.id}Search`).value.trim();e&&this.search(e)}),document.getElementById(`${this.id}Search`).addEventListener("keypress",e=>{if(e.key==="Enter"){const a=e.target.value.trim();a&&this.search(a)}})}show(){document.getElementById(this.id).classList.remove("hidden")}hide(){document.getElementById(this.id).classList.add("hidden")}showLoading(){document.getElementById(`${this.id}Results`).innerHTML="",document.getElementById(`${this.id}Loading`).classList.remove("hidden"),document.getElementById(`${this.id}Error`).classList.add("hidden"),document.getElementById(`${this.id}NoResults`).classList.add("hidden")}hideLoading(){document.getElementById(`${this.id}Loading`).classList.add("hidden")}showError(t){this.hideLoading();const n=document.getElementById(`${this.id}Error`);n.textContent=t,n.classList.remove("hidden")}clearError(){document.getElementById(`${this.id}Error`).classList.add("hidden")}showNoResults(){this.hideLoading(),document.getElementById(`${this.id}NoResults`).classList.remove("hidden")}updateFormFields(t){document.getElementById("gameTitle")&&(document.getElementById("gameTitle").value=t.name||""),document.getElementById("gameDescription")&&(document.getElementById("gameDescription").value=t.description||""),document.getElementById("gameCover")&&(document.getElementById("gameCover").value=t.cover_url||"")}search(t){console.warn("search() method not implemented")}}class k extends R{constructor(){super("gamesDBPanel","TheGamesDB Search Results")}async search(t){this.clearError(),this.showLoading();try{const e=await(await fetch(`/api/thegamesdb/games?name=${encodeURIComponent(t)}`)).json();e.success&&e.results&&e.results.length>0?(this.gameData={data:{games:e.results},include:e.include||{}},this.renderResults(this.gameData)):this.showNoResults()}catch(n){console.error("Error searching TheGamesDB:",n),this.showError("Error searching TheGamesDB. Please try again.")}}renderResults(t){const n=document.getElementById(`${this.id}Results`);n.innerHTML="",t.data.games.forEach(e=>{const a=e.id?e.id.toString():"",s=e.platform?e.platform.toString():"";let o="https://via.placeholder.com/80x120?text=No+Image";if(e.boxart_image)o=e.boxart_image;else if(t.include&&t.include.boxart){const d=t.include.boxart.base_url,c=t.include.boxart.data[a];if(c&&c.length>0){const g=c.find(f=>f.side==="front");g&&(o=d.thumb+g.filename)}}let r=e.platform_name||"Unknown Platform";t.include&&t.include.platform&&t.include.platform[s]&&(r=t.include.platform[s].name);const l=document.createElement("div");l.className="games-db-card",l.innerHTML=`
        <h3 class="games-db-card-title">${e.game_title||e.name||"Unknown Title"}</h3>
        <div class="games-db-card-content">
          <img src="${o}" alt="${e.game_title||e.name||"Unknown Title"}" class="games-db-card-image" onerror="this.src='https://via.placeholder.com/80x120?text=No+Image'">
          <div class="games-db-card-details">
            <div class="games-db-card-platform">${r}</div>
            <div class="games-db-card-release">${e.release_date||"Unknown release date"}</div>
            <div class="games-db-card-overview">${e.overview||"No description available"}</div>
          </div>
        </div>
        <button class="games-db-card-select" data-game-id="${a}">Select This Game</button>
      `,l.querySelector(".games-db-card-select").addEventListener("click",()=>{this.selectGame(a)}),n.appendChild(l)})}selectGame(t){if(!this.gameData)return;const n=this.gameData.data.games.find(s=>s.id&&s.id.toString()===t);if(!n)return;n.platform&&n.platform.toString();let e="";if(n.boxart_image)e=n.boxart_image;else if(this.gameData.include&&this.gameData.include.boxart){const s=this.gameData.include.boxart.base_url,o=this.gameData.include.boxart.data[t];if(o&&o.length>0){const r=o.find(l=>l.side==="front");r&&(e=s.medium+r.filename)}}const a={name:n.game_title||n.name||"",description:n.overview||"",cover_url:e||""};this.updateFormFields(a),this.hide()}}class G extends R{constructor(){super("rawgPanel","RAWG.io Search Results")}async search(t){this.clearError(),this.showLoading();try{const e=await(await fetch(`/api/rawg/games?name=${encodeURIComponent(t)}`)).json();e.success&&e.results&&e.results.length>0?(this.gameData=e,this.renderResults(e.results)):this.showNoResults()}catch(n){console.error("Error searching RAWG.io:",n),this.showError("Error searching RAWG.io. Please try again.")}}renderResults(t){const n=document.getElementById(`${this.id}Results`);n.innerHTML="",t.forEach(e=>{const a=document.createElement("div");a.className="games-db-card",a.innerHTML=`
        <h3 class="games-db-card-title">${e.name||"Unknown Title"}</h3>
        <div class="games-db-card-content">
          <img src="${e.background_image||"https://via.placeholder.com/80x120?text=No+Image"}" 
               alt="${e.name||"Unknown Title"}" 
               class="games-db-card-image" 
               onerror="this.src='https://via.placeholder.com/80x120?text=No+Image'">
          <div class="games-db-card-details">
            <div class="games-db-card-platform">${e.platform_name||"Unknown Platform"}</div>
            <div class="games-db-card-release">${e.released||"Unknown release date"}</div>
            <div class="games-db-card-overview">${e.description||"No description available"}</div>
          </div>
        </div>
        <button class="games-db-card-select" data-game-id="${e.id}">Select This Game</button>
      `,a.querySelector(".games-db-card-select").addEventListener("click",()=>{this.selectGame(e.id)}),n.appendChild(a)})}async selectGame(t){try{const e=await(await fetch(`/api/rawg/games/${t}`)).json();if(e.success&&e.data){const a=e.data,s={name:a.name||"",description:a.description||"",cover_url:a.background_image||""};this.updateFormFields(s),this.hide()}}catch(n){console.error("Error fetching game details from RAWG.io:",n),this.showError("Error fetching game details. Please try again.")}}}class j{constructor(){this.createWindow(),this.setupEventListeners(),this.targetField=null}createWindow(){if(document.getElementById("geminiWindow"))return;const t=`
      <div id="geminiWindow" class="gemini-window">
        <div class="gemini-window-header">
          <div class="gemini-window-title">Gemini Generated Content</div>
          <button class="gemini-window-close" id="geminiWindowClose">&times;</button>
        </div>
        <div class="gemini-window-content">
          <textarea id="geminiWindowText" class="gemini-window-textarea" placeholder="Generated content will appear here..."></textarea>
          <div class="gemini-window-actions">
            <button id="geminiWindowCancel" class="gemini-window-button gemini-window-cancel">Cancel</button>
            <button id="geminiWindowTransfer" class="gemini-window-button gemini-window-transfer">Transfer to Description</button>
          </div>
        </div>
      </div>
    `,n=document.createElement("div");n.innerHTML=t,document.body.appendChild(n.firstElementChild)}setupEventListeners(){document.getElementById("geminiWindowClose").addEventListener("click",()=>this.hide()),document.getElementById("geminiWindowCancel").addEventListener("click",()=>this.hide()),document.getElementById("geminiWindowTransfer").addEventListener("click",()=>this.transferContent());const t=document.querySelector(".gemini-window-header"),n=document.getElementById("geminiWindow");let e=!1,a,s;t.addEventListener("mousedown",o=>{e=!0,a=o.clientX-n.getBoundingClientRect().left,s=o.clientY-n.getBoundingClientRect().top}),document.addEventListener("mousemove",o=>{if(!e)return;const r=o.clientX-a,l=o.clientY-s;n.style.left=`${r}px`,n.style.top=`${l}px`,n.style.transform="none"}),document.addEventListener("mouseup",()=>{e=!1})}show(t,n){const e=document.getElementById("geminiWindowText");e.value=t,this.targetField=n,document.getElementById("geminiWindow").style.display="block"}hide(){document.getElementById("geminiWindow").style.display="none",this.targetField=null}transferContent(){if(!this.targetField)return;const t=document.getElementById("geminiWindowText").value;this.targetField.value=t,this.hide()}}function O(){const i=localStorage.getItem("romIdentificationModel")||"github",t=document.getElementById("romIdentificationModel");t&&(t.value=i);const n=document.getElementById("settingsForm");n&&n.addEventListener("submit",F)}function F(i){i&&i.preventDefault();const t=document.getElementById("romIdentificationModel");t&&localStorage.setItem("romIdentificationModel",t.value),alert("Settings saved successfully")}let I=!1;console.log("app.js loaded, appInitialized:",I);document.addEventListener("DOMContentLoaded",function(){console.log("DOMContentLoaded event fired. appInitialized:",I),I||(console.log("Initializing app..."),_(),I=!0,console.log("App initialized state set to true.")),window.emulatorModal=new T,window.romScanner=new S,window.gamesDBPanel=new k,window.rawgPanel=new G,window.geminiWindow=new j;const i=document.getElementById("gameForm");i&&i.addEventListener("submit",async function(t){t.preventDefault();const n=document.getElementById("gameId").value,e=document.getElementById("gameTitle").value,a=document.getElementById("gameDescription").value,s=document.getElementById("gameCover").value,o=document.getElementById("gamePlatforms"),r=document.getElementById("gameRomPath").value;let l={};o&&r&&Array.from(o.selectedOptions).forEach(p=>{l[p.value]={path:r}});const d={title:e,description:a,cover_image_path:s,platforms:l};let c="/api/games",g="POST";n&&(c=`/api/games/${n}`,g="PUT");const m=await(await fetch(c,{method:g,headers:{"Content-Type":"application/json"},body:JSON.stringify(d)})).json();m.success?(document.getElementById("gameModal").classList.add("hidden"),E(),v()):alert(m.message||"Failed to save game")})});function _(){E("","",!1),B(),v(),O(),A()}function A(){const i=document.getElementById("searchInput");i&&i.addEventListener("input",function(){var m;const f=this.value.trim();E(f,(m=document.getElementById("platformFilter"))==null?void 0:m.value,!1)});const t=document.getElementById("platformFilter");t&&t.addEventListener("change",function(){var p;const f=this.value,m=((p=document.getElementById("searchInput"))==null?void 0:p.value.trim())||"";E(m,f,!1)});const n=document.getElementById("sortOption");n&&n.addEventListener("change",function(){const[f,m]=this.value.split("_");N(f,m)});const e=document.getElementById("addGameBtn");e&&e.addEventListener("click",function(){L()});const a=document.getElementById("addGameBtnFloat");a&&a.addEventListener("click",function(){L()});const s=document.getElementById("addPlatformBtn");s&&s.addEventListener("click",function(){openPlatformModal()});const o=document.getElementById("gamesGrid");o&&o.addEventListener("click",function(f){const m=f.target.closest(".fa-edit"),p=f.target.closest(".fa-trash-alt");if(m){const u=m.closest(".edit-game-btn").getAttribute("data-id");console.log("Edit button clicked for game ID:",u),$(u)}else if(p){const u=p.closest(".delete-game-btn").getAttribute("data-id");M(u)}else{const h=f.target.closest(".edit-game-btn"),u=f.target.closest(".delete-game-btn"),y=f.target.closest(".launch-game-btn");if(h){const b=h.getAttribute("data-id");console.log("Edit button clicked for game ID:",b),$(b)}else if(u){const b=u.getAttribute("data-id");M(b)}else if(y){const b=y.getAttribute("data-id");H(b)}}});const r=document.getElementById("platformsContainer");r&&r.addEventListener("click",function(f){const m=f.target.closest(".edit-platform-btn"),p=f.target.closest(".delete-platform-btn");if(m){const h=m.getAttribute("data-id");editPlatform(h)}else if(p){const h=p.getAttribute("data-id");deletePlatform(h)}});const l=document.getElementById("emulatorsContainer");l&&l.addEventListener("click",function(f){const m=f.target.closest(".edit-emulator-btn"),p=f.target.closest(".delete-emulator-btn"),h=f.target.closest(".add-emulator-btn");if(m){const u=m.getAttribute("data-platform-id"),y=m.getAttribute("data-emulator-id");editEmulator(u,y)}else if(p){const u=p.getAttribute("data-platform-id"),y=p.getAttribute("data-emulator-id");deleteEmulator(u,y)}else if(h){const u=h.getAttribute("data-platform-id");U(u)}});const d=document.getElementById("closeGameModal");d&&d.addEventListener("click",function(){document.getElementById("gameModal").classList.add("hidden")});const c=document.getElementById("cancelGameBtn");c&&c.addEventListener("click",function(){document.getElementById("gameModal").classList.add("hidden")});const g=document.getElementById("searchGameDbBtn");g&&g.addEventListener("click",function(){const f=document.getElementById("gameTitle").value.trim();if(!f){alert("Please enter a game title to search");return}const m=document.getElementById("gameDbResults");m.classList.remove("hidden"),m.innerHTML='<div class="p-4 text-center text-body">Searching...</div>',fetch(`/api/thegamesdb/games?name=${encodeURIComponent(f)}`).then(p=>p.json()).then(p=>{if(p.success&&p.results&&p.results.length>0){let h='<div class="p-4">';p.results.forEach(u=>{h+=`
                <div class="bg-dark p-3 mb-3 rounded-md">
                  <div class="flex">
                    <div class="w-12 h-12 bg-card rounded-md flex items-center justify-center mr-3">
                      <i class="fas fa-gamepad text-primary text-xl"></i>
                    </div>
                    <div class="flex-1">
                      <h4 class="text-primary font-medium font-heading">${u.game_title}</h4>
                      <p class="text-secondary text-sm">Platform: ${u.platform_name||u.platform||"Unknown"}</p>
                      <p class="text-body text-sm mt-2">${u.overview?u.overview.substring(0,100)+"...":"No description available"}</p>
                    </div>
                  </div>
                  <div class="mt-3 flex justify-end">
                    <button class="btn-primary text-sm import-game-btn" data-game-id="${u.id}" data-title="${u.game_title}" data-overview="${u.overview||""}" data-cover="${u.boxart_url||""}">Import</button>
                  </div>
                </div>`}),h+="</div>",m.innerHTML=h,m.querySelectorAll(".import-game-btn").forEach(u=>{u.addEventListener("click",function(){document.getElementById("gameTitle").value=this.dataset.title,document.getElementById("gameDescription").value=this.dataset.overview,document.getElementById("gameCover").value=this.dataset.cover,m.classList.add("hidden")})})}else m.innerHTML='<div class="p-4 text-center text-body">No results found</div>'}).catch(p=>{console.error("Error searching game database:",p),m.innerHTML='<div class="p-4 text-center text-accent">Error searching game database</div>'})})}let x=!1;async function E(i="",t="",n=!1){console.log(`loadGames called. search: "${i}", platform: "${t}", test: ${n}. isGamesLoading: ${x}`);const e=document.getElementById("gamesGrid");if(e){if(x){console.warn("loadGames: Already loading games. Skipping this call.");return}x=!0,e.innerHTML=`
    <div class="col-span-full flex justify-center items-center py-8">
      <div class="text-primary">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <span class="ml-3">Loading games...</span>
      </div>
    </div>
  `,console.log("loadGames: Spinner shown, gamesGrid cleared (1st time).");try{console.log("loadGames: Starting game fetch.");let a;if(n)a="/api/games?test=true";else{const r=new URLSearchParams;i&&r.append("search",i),t&&r.append("platform",t),a=`/api/games${r.toString()?"?"+r.toString():""}`}console.log(`loadGames: Fetching from URL: ${a}`);const o=await(await fetch(a)).json();if(o.success){console.log("loadGames: Game fetch successful.",o),e.innerHTML="",console.log("loadGames: gamesGrid cleared (2nd time).");const l=(Array.isArray(o.data)?o.data:[]).reduce((d,c)=>(d.some(g=>g.id===c.id)||d.push(c),d),[]);if(console.log("loadGames: Unique games processed:",l.length,l),l.length===0){e.innerHTML='<div class="col-span-full text-center text-body py-8">No games found matching your criteria.</div>';return}fetch("/api/platforms").then(d=>d.json()).then(d=>{const c=d.success?d.data:{};console.log("loadGames: Platform data fetched. Calling renderGameCards.",c),C(l,e,c)}).catch(d=>{console.error("Error fetching platforms:",d),console.log("loadGames: Platform fetch failed. Calling renderGameCards with empty platforms."),C(l,e,{})})}else console.error("Error loading games:",o.message),e.innerHTML=`
        <div class="col-span-full text-center text-accent py-8">
          Error loading games: ${o.message||"Unknown error"}
        </div>
      `}catch(a){console.error("Error loading games:",a),e.innerHTML=`
      <div class="col-span-full text-center text-accent py-8">
        Error loading games: ${a.message||"Unknown error"}
      </div>
    `}finally{x=!1,console.log("loadGames: Execution finished. isGamesLoading set to false."),setTimeout(()=>{const a=document.getElementById("gamesGrid");a?(console.log(`DEBUG: Post-render, gamesGrid childElementCount: ${a.childElementCount}`),console.log(`DEBUG: Post-render, gamesGrid className: '${a.className}'`)):console.log("DEBUG: Post-render, gamesGrid element NOT FOUND!")},200)}}}async function B(i){const t=document.getElementById("platformFilter"),n=document.getElementById("platformsContainer");try{const a=await(await fetch("/api/platforms")).json();a.success?(t&&(t.innerHTML='<option value="">All Platforms</option>',Object.entries(a.data).forEach(([s,o])=>{const r=document.createElement("option");r.value=s,r.textContent=o.name,t.appendChild(r)})),n&&(typeof i=="function"?i(a.data):D(a.data)),v()):console.error("Error loading platforms:",a.message)}catch(e){console.error("Error loading platforms:",e)}}async function w(i){if(!i){console.error("No platformId provided to loadEmulatorsForPlatform");return}const t=document.querySelector(`.emulators-list[data-platform-id="${i}"]`);if(t)try{const e=await(await fetch(`/api/platforms/${i}`)).json();if(e.success&&e.data){const a=e.data;if(!a.emulators||Object.keys(a.emulators).length===0){t.innerHTML='<p class="text-body-dim text-sm italic">No emulators configured</p>';return}let s='<ul class="space-y-2">';Object.entries(a.emulators).forEach(([o,r])=>{s+=`
          <li class="flex justify-between items-center">
            <span class="text-body text-sm">${r.name}</span>
            <button class="edit-emulator-btn text-secondary hover:text-primary" 
                    data-platform-id="${i}" 
                    data-emulator-id="${o}" 
                    title="Edit Emulator">
              <i class="fas fa-edit"></i>
            </button>
          </li>
        `}),s+="</ul>",t.innerHTML=s,t.querySelectorAll(".edit-emulator-btn").forEach(o=>{o.addEventListener("click",function(){const r=this.getAttribute("data-platform-id"),l=this.getAttribute("data-emulator-id");emulatorModal.show(r,l)})})}else t.innerHTML='<p class="text-accent text-sm">Error loading emulators</p>'}catch(n){console.error("Error loading emulators:",n),t.innerHTML='<p class="text-accent text-sm">Error loading emulators</p>'}}function C(i,t,n){console.log(`renderGameCards: Rendering ${i.length} game(s).`),i.forEach((e,a)=>{const s=document.createElement("div");s.className="game-card bg-card border-2 border-red-500 p-2";let o="No platform",r=[];e.platforms&&Object.keys(e.platforms).length>0?r=Object.keys(e.platforms):e.platform&&(r=[e.platform]),r.length>0&&(o=r.map(c=>n[c]&&n[c].name?n[c].name:c).join(", "));const l=`/api/game-media/covers?path=${encodeURIComponent("placeholder.webp")}`;let d=l;e.cover_image_path&&typeof e.cover_image_path=="string"&&/^\d+$/.test(e.cover_image_path)&&(console.warn(`Invalid cover image path '${e.cover_image_path}' for game '${e.title||e.id}'. Defaulting to placeholder.`),e.cover_image_path=""),console.log(`DEBUG: Game: '${e.title||e.id}', cover_image_path IS: `,e.cover_image_path,`TYPEOF: ${typeof e.cover_image_path}`),typeof e.cover_image_path=="string"&&e.cover_image_path.trim()!==""?e.cover_image_path.startsWith("http://")||e.cover_image_path.startsWith("https://")?d=e.cover_image_path:d=`/api/game-media/covers?path=${encodeURIComponent(e.cover_image_path)}`:d=l,s.innerHTML=`
      <div class="relative flex-grow min-h-0"> <!-- Image container -->
        <img src="${d}" 
             alt="${e.title||"No title"}" 
             class="absolute inset-0 w-full h-full object-cover"
             onerror="this.onerror=null; this.src='${l}';">
      </div>
      <div class="p-2 flex-shrink-0"> <!-- Text and actions container -->
        <h3 class="font-heading text-sm truncate" title="${e.title||"No title"}">${e.title||"No title"}</h3>
        <p class="text-xs text-body-dim truncate mb-1" title="${o}">${o}</p>
        
        <!-- Description re-enabled, using line-clamp-2 for a bit more text -->
        <p class="text-xs text-body-dim line-clamp-2 mb-1" title="${e.description||""}">${e.description||"No description available."}</p>

        <div class="flex justify-between items-center mt-1">
          <button class="launch-game-btn text-xs py-1 px-2 bg-primary text-white rounded hover:bg-primary/80" data-id="${e.id}">Launch</button>
          <div class="space-x-1">
            <button class="edit-game-btn text-secondary hover:text-primary text-xs" data-id="${e.id}" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="delete-game-btn text-accent hover:text-accent/80 text-xs" data-id="${e.id}" title="Delete">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      </div>
    `,t.appendChild(s),console.log(`renderGameCards: Appended card ${a+1} for game "${e.title||e.id}"`)})}function N(i,t){const n=document.getElementById("gamesGrid");if(!n)return;const e=Array.from(n.children);e.sort((a,s)=>{let o,r;return i==="title"?(o=a.querySelector(".game-card-title").textContent,r=s.querySelector(".game-card-title").textContent):i==="platform"&&(o=a.querySelector(".game-card-platform").textContent,r=s.querySelector(".game-card-platform").textContent),t==="asc"?o.localeCompare(r):r.localeCompare(o)}),n.innerHTML="",e.forEach(a=>n.appendChild(a))}function D(i){const t=document.getElementById("platformsContainer");if(t){if(t.innerHTML="",Object.keys(i).length===0){t.innerHTML='<div class="col-span-full text-center text-body py-8">No platforms found. Add your first platform!</div>';return}Object.entries(i).forEach(([n,e])=>{const a=document.createElement("div");a.className="game-card",a.innerHTML=`
      <h3 class="game-card-title font-heading">${e.name}</h3>
      <div class="p-4">
        <div class="flex items-center mb-3">
          <div class="w-12 h-12 bg-dark rounded-md flex items-center justify-center mr-4">
            <i class="fas fa-microchip text-primary text-xl"></i>
          </div>
          <div>
            <p class="text-body text-sm">Manufacturer: ${e.manufacturer||"Unknown"}</p>
            <p class="text-body text-sm">Released: ${e.release_year||"Unknown"}</p>
          </div>
        </div>
        <p class="text-body text-sm line-clamp-3">${e.description||"No description available"}</p>
        
        <div class="mt-4 border-t border-border pt-3">
          <div class="flex justify-between items-center mb-2">
            <h4 class="text-secondary font-heading text-sm">Emulators</h4>
            <button class="add-emulator-btn text-primary hover:text-secondary" data-platform-id="${n}" title="Add Emulator">
              <i class="fas fa-plus-circle"></i>
            </button>
          </div>
          <div class="emulators-list" data-platform-id="${n}">
            <p class="text-body-dim text-sm italic">Loading emulators...</p>
          </div>
        </div>
      </div>
      <div class="game-card-actions">
        <button class="edit-platform-btn" data-id="${n}" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="delete-platform-btn" data-id="${n}" title="Delete">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `,t.appendChild(a)}),document.querySelectorAll(".edit-platform-btn").forEach(n=>{n.addEventListener("click",function(){const e=this.getAttribute("data-id");openPlatformModal(e)})}),document.querySelectorAll(".delete-platform-btn").forEach(n=>{n.addEventListener("click",function(){const e=this.getAttribute("data-id");deletePlatform(e)})}),document.querySelectorAll(".add-emulator-btn").forEach(n=>{n.addEventListener("click",function(){const e=this.getAttribute("data-platform-id");emulatorModal.show(e)})}),Object.keys(i).forEach(n=>{setTimeout(()=>w(n),100)})}}function L(i=null){const t=document.getElementById("gameModal"),n=document.getElementById("gameForm"),e=document.getElementById("gameModalTitle");!t||!n||(n.reset(),i?(e.textContent="Edit Game",fetch(`/api/games/${i}`).then(a=>a.json()).then(a=>{if(a.success){const s=a.data;if(console.log("Game data:",s),document.getElementById("gameId").value=i,document.getElementById("gameTitle").value=s.title||"",document.getElementById("gameDescription").value=s.description||"",document.getElementById("gameCover").value=s.cover_image_path||"",s.platforms&&Object.keys(s.platforms).length>0){const o=Object.keys(s.platforms)[0];document.getElementById("gameRomPath").value=s.platforms[o]||""}fetch("/api/platforms").then(o=>o.json()).then(o=>{if(o.success){const r=document.getElementById("gamePlatforms");r.innerHTML="",Object.entries(o.data).forEach(([l,d])=>{const c=document.createElement("option");c.value=l,c.textContent=d.name,c.selected=s.platforms&&s.platforms[l],r.appendChild(c)})}})}})):(e.textContent="Add Game",document.getElementById("gameId").value="",fetch("/api/platforms").then(a=>a.json()).then(a=>{if(a.success){const s=document.getElementById("gamePlatforms");s.innerHTML="",Object.entries(a.data).forEach(([o,r])=>{const l=document.createElement("option");l.value=o,l.textContent=r.name,s.appendChild(l)})}})),t.classList.remove("hidden"))}function $(i){L(i)}function M(i){confirm("Are you sure you want to delete this game?")&&fetch(`/api/games/${i}`,{method:"DELETE"}).then(t=>t.json()).then(t=>{var n,e;if(t.success){const a=((n=document.getElementById("searchInput"))==null?void 0:n.value.trim())||"",s=((e=document.getElementById("platformFilter"))==null?void 0:e.value)||"";E(a,s,!1),v()}else alert(t.message||"Failed to delete game")}).catch(t=>{console.error("Error deleting game:",t),alert("Error deleting game")})}function H(i){fetch(`/api/games/${i}`).then(t=>t.json()).then(t=>{if(t.success){const n=t.data;if(!n.platforms||Object.keys(n.platforms).length===0){alert("This game has no ROM path configured");return}const e=Object.keys(n.platforms)[0];n.platforms[e],fetch(`/api/platforms/${e}`).then(a=>a.json()).then(a=>{if(a.success){const s=a.data;if(!s.emulators||Object.keys(s.emulators).length===0){alert(`No emulators configured for ${s.name}`);return}let o;if(Object.keys(s.emulators).length>1){const r=Object.entries(s.emulators).map(([d,c])=>`${d}: ${c.name}`).join(`
`),l=prompt(`Select an emulator to launch ${n.title}:
${r}`,Object.keys(s.emulators)[0]);if(!l||!s.emulators[l]){alert("Invalid emulator selected");return}o=l}else o=Object.keys(s.emulators)[0];fetch("/api/launch-game",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({gameId:i,emulatorId:o})}).then(r=>r.json()).then(r=>{r.success?(console.log(`Game launched: ${n.title}`),console.log(`Command: ${r.command}`)):alert(`Failed to launch game: ${r.message}`)}).catch(r=>{console.error("Error launching game:",r),alert("Error launching game")})}else alert("Failed to get platform details")}).catch(a=>{console.error("Error getting platform details:",a),alert("Error launching game")})}else alert("Failed to get game details")}).catch(t=>{console.error("Error getting game details:",t),alert("Error launching game")})}function v(){fetch("/api/games?test=false").then(i=>i.json()).then(i=>{if(i.success){const t=document.getElementById("totalGamesCount");t&&(t.textContent=i.totalItems||0)}}),fetch("/api/platforms").then(i=>i.json()).then(i=>{if(i.success){const t=document.getElementById("totalPlatformsCount"),n=document.getElementById("totalEmulatorsCount");if(t&&(t.textContent=Object.keys(i.data).length||0),n){let e=0;Object.values(i.data).forEach(a=>{a.emulators&&typeof a.emulators=="object"&&(e+=Object.keys(a.emulators).length)}),n.textContent=e}}}).catch(i=>{console.error("Error fetching platforms data:",i);const t=document.getElementById("totalPlatformsCount"),n=document.getElementById("totalEmulatorsCount");t&&(t.textContent="0"),n&&(n.textContent="0")})}function U(i,t=null){window.emulatorModal&&window.emulatorModal.show(i,t)}window.updateStats=v;export{B as l,v as u};
