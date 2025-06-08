
let currentHighlight: HTMLElement | null = null;

export const highlightElement = (selector: string) => {
  // Remove any existing highlights first
  removeHighlight();
  
  const element = document.querySelector(selector) as HTMLElement;
  if (!element) {
    console.warn(`Tutorial: Element with selector "${selector}" not found`);
    return;
  }

  // Create highlight overlay
  const overlay = document.createElement('div');
  const rect = element.getBoundingClientRect();
  
  overlay.style.position = 'fixed';
  overlay.style.top = `${rect.top - 8}px`;
  overlay.style.left = `${rect.left - 8}px`;
  overlay.style.width = `${rect.width + 16}px`;
  overlay.style.height = `${rect.height + 16}px`;
  overlay.style.border = '3px solid #3b82f6';
  overlay.style.borderRadius = '8px';
  overlay.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
  overlay.style.zIndex = '9999';
  overlay.style.pointerEvents = 'none';
  overlay.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.2)';
  overlay.style.animation = 'pulse 2s infinite';
  overlay.id = 'tutorial-highlight';

  // Add pulse animation
  if (!document.querySelector('#tutorial-pulse-style')) {
    const style = document.createElement('style');
    style.id = 'tutorial-pulse-style';
    style.textContent = `
      @keyframes pulse {
        0%, 100% { 
          transform: scale(1);
          opacity: 0.8;
        }
        50% { 
          transform: scale(1.02);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(overlay);
  currentHighlight = overlay;

  // Scroll element into view if needed
  element.scrollIntoView({ 
    behavior: 'smooth', 
    block: 'center',
    inline: 'center'
  });
};

export const removeHighlight = () => {
  if (currentHighlight) {
    currentHighlight.remove();
    currentHighlight = null;
  }
  
  // Remove pulse style
  const style = document.querySelector('#tutorial-pulse-style');
  if (style) {
    style.remove();
  }
};

// Clean up on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', removeHighlight);
}
