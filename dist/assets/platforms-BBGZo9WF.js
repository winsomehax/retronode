import{l as m,u}from"./app-BsjPpv4N.js";document.addEventListener("DOMContentLoaded",function(){m(f),u(),document.getElementById("searchInput").addEventListener("input",function(){const r=this.value.toLowerCase().trim();document.querySelectorAll("#platformsContainer > div").forEach(t=>{var o,s,d;const a=((o=t.querySelector(".game-card-title"))==null?void 0:o.textContent.toLowerCase())||"",n=((s=t.querySelector("p:nth-of-type(1)"))==null?void 0:s.textContent.toLowerCase())||"",l=((d=t.querySelector("p:nth-of-type(3)"))==null?void 0:d.textContent.toLowerCase())||"";a.includes(r)||n.includes(r)||l.includes(r)?t.style.display="":t.style.display="none"})}),document.getElementById("addPlatformBtn").addEventListener("click",function(){p()}),document.getElementById("addPlatformBtnFloat").addEventListener("click",function(){p()}),document.getElementById("closePlatformModal").addEventListener("click",function(){document.getElementById("platformModal").classList.add("hidden")}),document.getElementById("cancelPlatformBtn").addEventListener("click",function(){document.getElementById("platformModal").classList.add("hidden")}),document.getElementById("platformForm").addEventListener("submit",function(r){r.preventDefault();const e=document.getElementById("platformId").value.trim(),t=document.getElementById("platformName").value.trim(),a=document.getElementById("platformManufacturer").value.trim(),n=document.getElementById("platformReleaseYear").value.trim(),l=document.getElementById("platformDescription").value.trim();if(!e||!t){alert("Platform ID and Name are required");return}const o={platform_id:e,name:t,manufacturer:a,release_year:n?parseInt(n):null,description:l},s=document.getElementById("platformModalTitle").textContent==="Edit Platform",d=s?"PUT":"POST",i=s?`/api/platforms/${e}`:"/api/platforms";fetch(i,{method:d,headers:{"Content-Type":"application/json"},body:JSON.stringify(o)}).then(c=>c.json()).then(c=>{c.success?(document.getElementById("platformModal").classList.add("hidden"),m(f),u()):alert(c.message||"Failed to save platform")}).catch(c=>{console.error("Error saving platform:",c),alert("Error saving platform")})}),document.getElementById("searchPlatformDbBtn").addEventListener("click",function(){const r=document.getElementById("platformName").value.trim();if(!r){alert("Please enter a platform name to search");return}const e=document.getElementById("platformDbResults");e.classList.remove("hidden"),e.innerHTML='<div class="p-4 text-center text-body">Searching...</div>',fetch(`/api/thegamesdb/platforms?name=${encodeURIComponent(r)}`).then(t=>t.json()).then(t=>{if(t.success&&t.results.length>0){let a='<div class="p-4">';t.results.forEach(n=>{a+=`
                  <div class="bg-dark p-3 mb-3 rounded-md">
                    <div class="flex">
                      <div class="w-12 h-12 bg-card rounded-md flex items-center justify-center mr-3">
                        <i class="fas fa-microchip text-primary text-xl"></i>
                      </div>
                      <div class="flex-1">
                        <h4 class="text-primary font-medium font-heading">${n.name}</h4>
                        <p class="text-secondary text-sm">Manufacturer: ${n.manufacturer||"Unknown"}</p>
                        <p class="text-body text-sm mt-2">${n.overview||"No description available"}</p>
                      </div>
                    </div>
                    <div class="mt-3 flex justify-end">
                      <button class="btn-primary text-sm import-platform-btn" data-index="${t.results.indexOf(n)}">Import</button>
                    </div>
                  </div>
                `}),a+="</div>",e.innerHTML=a,document.querySelectorAll(".import-platform-btn").forEach(n=>{n.addEventListener("click",function(){const l=parseInt(this.getAttribute("data-index")),o=t.results[l],s=o.name.toLowerCase().replace(/[^a-z0-9]/g,"");document.getElementById("platformId").value=s,document.getElementById("platformName").value=o.name,document.getElementById("platformManufacturer").value=o.manufacturer||"",document.getElementById("platformDescription").value=o.overview||"",e.classList.add("hidden")})})}else e.innerHTML='<div class="p-4 text-center text-body">No results found</div>'}).catch(t=>{console.error("Error searching platform database:",t),e.innerHTML='<div class="p-4 text-center text-accent">Error searching platform database</div>'})})});function f(r){const e=document.getElementById("platformsContainer");if(e){if(e.innerHTML="",Object.keys(r).length===0){e.innerHTML='<div class="col-span-full text-center text-body py-8">No platforms found. Add your first platform!</div>';return}Object.entries(r).forEach(([t,a])=>{const n=document.createElement("div");n.className="game-card",n.innerHTML=`
          <h3 class="game-card-title font-heading">${a.name}</h3>
          <div class="p-4">
            <div class="flex items-center mb-3">
              <div class="w-12 h-12 bg-dark rounded-md flex items-center justify-center mr-4">
                <i class="fas fa-microchip text-primary text-xl"></i>
              </div>
              <div>
                <p class="text-body text-sm">Manufacturer: ${a.manufacturer||"Unknown"}</p>
                <p class="text-body text-sm">Released: ${a.release_year||"Unknown"}</p>
              </div>
            </div>
            <p class="text-body text-sm line-clamp-3">${a.description||"No description available"}</p>
            
            <div class="mt-4 border-t border-border pt-3">
              <div class="flex justify-between items-center mb-2">
                <h4 class="text-secondary font-heading text-sm">Emulators</h4>
                <div>
                  <button class="scan-roms-btn text-secondary hover:text-primary mr-2" data-platform-id="${t}" title="Scan ROMs">
                    <i class="fas fa-search"></i>
                  </button>
                  <button class="add-emulator-btn text-primary hover:text-secondary" data-platform-id="${t}" title="Add Emulator">
                    <i class="fas fa-plus-circle"></i>
                  </button>
                </div>
              </div>
              <div class="emulators-list" data-platform-id="${t}">
                <p class="text-body-dim text-sm italic">Loading emulators...</p>
              </div>
            </div>
          </div>
          <div class="game-card-actions">
            <button class="edit-platform-btn" data-id="${t}" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="delete-platform-btn" data-id="${t}" title="Delete">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        `,e.appendChild(n)}),document.querySelectorAll(".edit-platform-btn").forEach(t=>{t.addEventListener("click",function(){const a=this.getAttribute("data-id");p(a)})}),document.querySelectorAll(".delete-platform-btn").forEach(t=>{t.addEventListener("click",function(){const a=this.getAttribute("data-id");h(a)})}),document.querySelectorAll(".add-emulator-btn").forEach(t=>{t.addEventListener("click",function(){const a=this.getAttribute("data-platform-id");emulatorModal.show(a)})}),document.querySelectorAll(".scan-roms-btn").forEach(t=>{t.addEventListener("click",function(){const a=this.getAttribute("data-platform-id"),n=this.closest(".game-card").querySelector(".game-card-title").textContent;romScanner.show(a,n)})}),Object.keys(r).forEach(t=>{setTimeout(()=>y(t),100)})}}async function y(r){const e=document.querySelector(`.emulators-list[data-platform-id="${r}"]`);if(e){e.innerHTML='<p class="text-body-dim text-sm italic">Loading emulators...</p>';try{const t=`/api/emulators/${r}`,a=await fetch(t);if(!a.ok){let o=`HTTP error ${a.status}: ${a.statusText}`;try{const s=await a.text();o+=` - Response preview: ${s.substring(0,200)}${s.length>200?"...":""}`}catch{}throw console.error(`Failed to fetch emulators from ${t}. ${o}`),new Error(`Failed to fetch emulators: ${a.status} ${a.statusText}`)}const n=a.headers.get("content-type");if(!n||!n.includes("application/json")){let o=await a.text();const s=`Expected JSON response from ${t}, but got ${n||"unknown content type"}. Response preview: ${o.substring(0,200)}${o.length>200?"...":""}`;throw console.error(s),new Error(`Invalid response type: Expected JSON, got ${n||"text/plain"}`)}const l=await a.json();if(l.success){if(l.data.length===0){e.innerHTML='<p class="text-body-dim text-sm italic">No emulators configured</p>';return}let o='<ul class="space-y-2">';l.data.forEach(s=>{o+=`
              <li class="flex justify-between items-center">
                <span class="text-body text-sm">${s.name}</span>
                <button class="edit-emulator-btn text-secondary hover:text-primary" 
                        data-platform-id="${r}" 
                        data-emulator-id="${s.emulator_id}" 
                        title="Edit Emulator">
                  <i class="fas fa-edit"></i>
                </button>
              </li>
            `}),o+="</ul>",e.innerHTML=o,e.querySelectorAll(".edit-emulator-btn").forEach(s=>{s.addEventListener("click",function(){const d=this.getAttribute("data-platform-id"),i=this.getAttribute("data-emulator-id");emulatorModal.show(d,i)})})}else e.innerHTML=`<p class="text-accent text-sm">Error loading emulators: ${l.message||"Unknown error"}</p>`}catch(t){console.error(`Error loading emulators for platform ${r}: ${t.message}`,t),e.innerHTML='<p class="text-accent text-sm">Failed to load emulators. Check console for details.</p>'}}}function p(r=null){const e=document.getElementById("platformModal"),t=document.getElementById("platformForm"),a=document.getElementById("platformModalTitle");!e||!t||(t.reset(),r?(a.textContent="Edit Platform",fetch(`/api/platforms/${r}`).then(n=>n.json()).then(n=>{if(n.success){const l=n.data;document.getElementById("platformId").value=r,document.getElementById("platformId").readOnly=!0,document.getElementById("platformName").value=l.name||"",document.getElementById("platformManufacturer").value=l.manufacturer||"",document.getElementById("platformReleaseYear").value=l.release_year||"",document.getElementById("platformDescription").value=l.description||""}})):(a.textContent="Add Platform",document.getElementById("platformId").readOnly=!1),e.classList.remove("hidden"))}function h(r){confirm("Are you sure you want to delete this platform?")&&fetch(`/api/platforms/${r}`,{method:"DELETE"}).then(e=>e.json()).then(e=>{e.success?(m(f),u()):alert(e.message||"Failed to delete platform")}).catch(e=>{console.error("Error deleting platform:",e),alert("Error deleting platform")})}
