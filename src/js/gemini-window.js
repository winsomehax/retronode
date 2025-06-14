// Gemini Window Manager

export default class GeminiWindow {
  constructor() {
    this.createWindow();
    this.setupEventListeners();
    this.targetField = null;
  }
  
  createWindow() {
    // Create window if it doesn't exist
    if (document.getElementById('geminiWindow')) {
      return;
    }
    
    const windowHTML = `
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
    `;
    
    // Add window to the document
    const div = document.createElement('div');
    div.innerHTML = windowHTML;
    document.body.appendChild(div.firstElementChild);
  }
  
  setupEventListeners() {
    document.getElementById('geminiWindowClose').addEventListener('click', () => this.hide());
    document.getElementById('geminiWindowCancel').addEventListener('click', () => this.hide());
    document.getElementById('geminiWindowTransfer').addEventListener('click', () => this.transferContent());
    
    // Make window draggable
    const header = document.querySelector('.gemini-window-header');
    const window = document.getElementById('geminiWindow');
    
    let isDragging = false;
    let offsetX, offsetY;
    
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - window.getBoundingClientRect().left;
      offsetY = e.clientY - window.getBoundingClientRect().top;
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      
      window.style.left = `${x}px`;
      window.style.top = `${y}px`;
      window.style.transform = 'none';
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }
  
  show(content, targetField) {
    const textarea = document.getElementById('geminiWindowText');
    textarea.value = content;
    this.targetField = targetField;
    
    document.getElementById('geminiWindow').style.display = 'block';
  }
  
  hide() {
    document.getElementById('geminiWindow').style.display = 'none';
    this.targetField = null;
  }
  
  transferContent() {
    if (!this.targetField) return;
    
    const content = document.getElementById('geminiWindowText').value;
    this.targetField.value = content;
    this.hide();
  }
}