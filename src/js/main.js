import "./as-dithered-image.js";
import { lifemachine } from "./lifeMachine.js";
// import { gsap } from "gsap";

// Global config
const ANIMATION_FREQUENCY_DEFAULTS = {
  jitterStepTime: 3000,
  lifeMachineSpeed: 1250,
  cursorUpdateFreq: 2000,
  cloneGenFreq: 6000,
};

function randomizeFrequency(base) {
  const variance = 0.5 * base;
  return base + (Math.random() * 2 - 1) * variance;
}

const ANIMATION_FREQUENCY = {
  get jitterStepTime() {
    return randomizeFrequency(ANIMATION_FREQUENCY_DEFAULTS.jitterStepTime);
  },
  get lifeMachineSpeed() {
    return randomizeFrequency(ANIMATION_FREQUENCY_DEFAULTS.lifeMachineSpeed);
  },
  get cursorUpdateFreq() {
    return randomizeFrequency(ANIMATION_FREQUENCY_DEFAULTS.cursorUpdateFreq);
  },
  get cloneGenFreq() {
    return randomizeFrequency(ANIMATION_FREQUENCY_DEFAULTS.cloneGenFreq);
  },
};

// Initialize the life machine canvas
const lifeMachineInstance = lifemachine('lifeMachine1', ANIMATION_FREQUENCY.lifeMachineSpeed);

// Function to swap product images with preloading
function swapProductImages() {
  const container = document.querySelector('.product-image-wrapper');
  const productPhotoR = document.getElementById('productPhoto');
  if (!container || !productPhotoR) return;
  
  // Make container relative for absolute positioning
  container.style.position = 'relative';
  
  // Clone the existing element for the L version
  const productPhotoL = productPhotoR.cloneNode(true);
  productPhotoL.id = 'productPhotoL';
  productPhotoL.setAttribute('src', 'product_L_v1.jpg');
  
  // Style both images for stacking - keep them in document flow size
  productPhotoR.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: opacity 0s;
    opacity: 1;
    margin: 0;
  `;
  
  productPhotoL.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: opacity 0s;
    opacity: 0;
    pointer-events: none;
    margin: 0;
  `;
  
  // Insert L image into container
  container.appendChild(productPhotoL);
  
  // Track which is visible
  let showingR = true;
  
  // Wait for L image to load and process
  setTimeout(() => {
    // Swap every 5 seconds using opacity for instant switching
    setInterval(() => {
      if (showingR) {
        productPhotoR.style.opacity = '0';
        productPhotoR.style.pointerEvents = 'none';
        productPhotoL.style.opacity = '1';
        productPhotoL.style.pointerEvents = 'auto';
      } else {
        productPhotoL.style.opacity = '0';
        productPhotoL.style.pointerEvents = 'none';
        productPhotoR.style.opacity = '1';
        productPhotoR.style.pointerEvents = 'auto';
      }
      showingR = !showingR;
    }, 5000);
  }, 500);
}

// Initialize image swapping when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', swapProductImages);
} else {
  swapProductImages();
}

function applySteppedNoiseAnimation(ids, parentId, options = {}) {
    // Default configuration
    const config = {
        amplitude: 1,
        stepTime: ANIMATION_FREQUENCY.jitterStepTime, // Use master config
        scaleMin: 0.9,
        scaleMax: 1,
        xOffsetRatio: 0.15, // Max horizontal offset as a ratio of parent size
        yOffsetRatio: 0.25, // Max vertical offset as a ratio of parent size
        ...options,
    };

    const parent = document.getElementById(parentId);
    if (!parent) {
        console.error(`Parent container with ID "${parentId}" not found.`);
        return;
    }

    function getParentBounds() {
        const rect = parent.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height,
        };
    }

    // Shared array to track all element positions for collision avoidance
    let lastPositions = ids.map(() => ({ x: 0, y: 0, w: 0, h: 0, scale: 1 }));

    ids.forEach((id, idx) => {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with ID "${id}" not found.`);
            return;
        }

        // Get the element's original size (unscaled)
        const prevTransform = element.style.transform;
        element.style.transform = 'scale(1)';
        const originalRect = element.getBoundingClientRect();
        const originalWidth = originalRect.width;
        const originalHeight = originalRect.height;
        element.style.transform = prevTransform;

        // Initial vertical offset: each child offset by 100% of a single child's height (in px)
        const fontSizePx = 48; // 3rem = 48px if root font-size is 16px
        let posX = 0;
        let posY = idx * fontSizePx;
        let currentScale = 1;
        let lastTimestamp = null;
        // Use px units for base padding as well
        const basePaddingPx = 48;
        const verticalOffset = idx * basePaddingPx;
        // Phase offset for each child (in ms)
        const phaseOffset = (config.stepTime / ids.length) * idx;
        let phaseStarted = false;

        // Allow up to N% overlap
        // const maxOverlap = .1; // N% overlap allowed

        function isOverlapping(x1, y1, w1, h1, x2, y2, w2, h2, maxOverlap) {
            // Axis-aligned bounding box overlap
            const overlapX = Math.max(0, Math.min(x1 + w1, x2 + w2) - Math.max(x1, x2));
            const overlapY = Math.max(0, Math.min(y1 + h1, y2 + h2) - Math.max(y1, y2));
            const overlapArea = overlapX * overlapY;
            const minArea = Math.min(w1 * h1, w2 * h2);
            return overlapArea > maxOverlap * minArea;
        }

        function animate(timestamp) {
            if (!phaseStarted) {
                if (timestamp < phaseOffset) {
                    requestAnimationFrame(animate);
                    return;
                } else {
                    lastTimestamp = timestamp;
                    phaseStarted = true;
                }
            }
            const elapsed = timestamp - lastTimestamp;
            // Get fresh random timing for each step - brownian motion effect
            const currentStepTime = ANIMATION_FREQUENCY.jitterStepTime;
            if (elapsed >= currentStepTime) {
                const parentBounds = getParentBounds();
                const maxOffsetX = parentBounds.width * config.xOffsetRatio;
                const maxOffsetY = parentBounds.height * config.yOffsetRatio;

                // Random scaling
                currentScale = Math.random() * (config.scaleMax - config.scaleMin) + config.scaleMin;
                const scaledWidth = originalWidth * currentScale;
                const scaledHeight = originalHeight * currentScale;

                // Ensure scaled element fits in parent
                const maxPosX = Math.max(0, parentBounds.width - scaledWidth);
                const maxPosY = Math.max(0, parentBounds.height - scaledHeight);

                // Try up to 10 times to find a non-overlapping position
                let tryCount = 0;
                let newX, newY, overlapFound;
                do {
                    let stepX = (Math.random() - 0.5) * 2 * Math.min(maxOffsetX, maxPosX);
                    let stepY = (Math.random() - 0.5) * 2 * Math.min(maxOffsetY, maxPosY);
                    newX = posX + stepX;
                    newY = posY + stepY + verticalOffset;
                    newX = Math.max(0, Math.min(newX, maxPosX));
                    newY = Math.max(0, Math.min(newY, maxPosY));
                    overlapFound = false;
                    // Check against all other elements' last positions
                    for (let otherIdx = 0; otherIdx < lastPositions.length; otherIdx++) {
                        if (otherIdx !== idx) {
                            const pos = lastPositions[otherIdx];
                            if (isOverlapping(
                                newX, newY, scaledWidth, scaledHeight,
                                pos.x, pos.y, pos.w * pos.scale, pos.h * pos.scale,
                                0.1 // allow 10% overlap
                            )) {
                                overlapFound = true;
                                break;
                            }
                        }
                    }
                    tryCount++;
                } while (overlapFound && tryCount < 15);
                posX = newX;
                posY = newY;
                element.style.transform = `translate(${posX}px, ${posY}px) scale(${currentScale})`;
                // Update this element's last position for next frame
                lastPositions[idx] = { x: posX, y: posY, w: originalWidth, h: originalHeight, scale: currentScale };
                lastTimestamp = timestamp;
            }
            requestAnimationFrame(animate);
        }
        // Set initial transform for offset on page load (use px units)
        element.style.transform = `translate(${posX}px, ${posY}px) scale(1)`;
        lastPositions[idx] = { x: posX, y: posY, w: originalWidth, h: originalHeight, scale: 1 };
        requestAnimationFrame(animate);
    });
}

// Initialize dynamic jitter animation
let jitterCleanup = applyDynamicJitterAnimation('jitterBB');

// Optional: debounce resize re-init
let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    // Cleanup existing animation and restart with new bounds
    if (jitterCleanup) jitterCleanup();
    jitterCleanup = applyDynamicJitterAnimation('jitterBB', {
      stepTime: ANIMATION_FREQUENCY.jitterStepTime,
      scaleMin: 0.92,
      scaleMax: 1.0,
    });
  }, 300);
});

// Text skew effect
function skewHandText(root = document.body) {
  const SKEW_CLASS = 'skew-hand';
  const SKEW_STYLE_ID = 'skew-hand-style';
  if (!document.getElementById(SKEW_STYLE_ID)) {
    const style = document.createElement('style');
    style.id = SKEW_STYLE_ID;
    style.textContent = `.${SKEW_CLASS} { display: inline-block; transform: skewX(-25deg); }`;
    document.head.appendChild(style);
  }

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const idx = node.nodeValue.indexOf('hand.');
      if (idx !== -1) {
        const parent = node.parentNode;
        const before = node.nodeValue.slice(0, idx);
        const match = node.nodeValue.slice(idx, idx + 5);
        const after = node.nodeValue.slice(idx + 5);
        const frag = document.createDocumentFragment();
        if (before) frag.appendChild(document.createTextNode(before));
        const span = document.createElement('span');
        span.className = SKEW_CLASS;
        span.textContent = match;
        frag.appendChild(span);
        if (after) frag.appendChild(document.createTextNode(after));
        parent.replaceChild(frag, node);
        if (after.indexOf('hand.') !== -1) {
          walk(parent.childNodes[parent.childNodes.length - 1]);
        }
        return;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE && node.childNodes) {
      if (['SCRIPT', 'STYLE'].includes(node.tagName)) return;
      Array.from(node.childNodes).forEach(walk);
    }
  }

  walk(root);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => skewHandText());
} else {
  skewHandText();
}

// copy email in footer
document.addEventListener('DOMContentLoaded', function() {
  var emailSpan = document.getElementById('contactEmail');
  var copyMsg = document.getElementById('copyMessage');
  if (emailSpan && copyMsg) {
    emailSpan.addEventListener('click', function() {
      var email = 'machinemachineltd@gmail.com';
      var tempTextArea = document.createElement('textarea');
      tempTextArea.value = email;
      document.body.appendChild(tempTextArea);
      tempTextArea.select();
      document.execCommand('copy');
      document.body.removeChild(tempTextArea);
      copyMsg.style.display = 'inline-block';
      copyMsg.style.opacity = '1';
      setTimeout(function() {
        copyMsg.style.opacity = '0';
        setTimeout(function() {
          copyMsg.style.display = 'none';
          copyMsg.style.opacity = '1';
        }, 400);
      }, 900);
    });
  }
});

// --- Cursor mirroring animation ---
const CURSOR_NORMAL = "src/cursor/hand.cur";
const CURSOR_MIRRORED = "src/cursor/hand_inv.cur"; 

let cursorMirrored = false;
let cursorMirrorTimeout = null;

function startCursorMirrorAnimation() {
  if (cursorMirrorTimeout) return; // Already running
  function swapCursorAndSchedule() {
    cursorMirrored = !cursorMirrored;
    document.documentElement.style.cursor = `url('${cursorMirrored ? CURSOR_MIRRORED : CURSOR_NORMAL}'), auto`;
    const nextDelay = ANIMATION_FREQUENCY.cursorUpdateFreq;
    cursorMirrorTimeout = setTimeout(swapCursorAndSchedule, nextDelay);
  }
  swapCursorAndSchedule();
}

// Start the cursor mirroring animation on page load
startCursorMirrorAnimation();

// Dynamic jitter clone animation system
function applyDynamicJitterAnimation(parentId, options = {}) {
    // Default configuration
    const config = {
        amplitude: 1,
        stepTime: ANIMATION_FREQUENCY.jitterStepTime,
        cloneInterval: ANIMATION_FREQUENCY.cloneGenFreq,
        scaleMin: 0.9,
        scaleMax: 1,
        xOffsetRatio: 0.15,
        yOffsetRatio: 0.25,
        maxClones: 2, // Maximum number of clones to prevent memory issues
        ...options,
    };

    const parent = document.getElementById(parentId);
    if (!parent) {
        console.error(`Parent container with ID "${parentId}" not found.`);
        return;
    }

    // Create the template jitterChild element
    const jitterChild = document.createElement('h1');
    jitterChild.id = 'jitterChild';
    jitterChild.textContent = 'MACHINE';
    // Basic positioning styles (CSS handles the rest via #jitterBB h1 selector)
    jitterChild.style.position = 'absolute';
    jitterChild.style.transform = 'translate(0px, 0px) scale(1)';

    // Array to track all clones and their data
    let clones = [];
    let cloneCounter = 0;

    function getParentBounds() {
        const rect = parent.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height,
        };
    }

    function isOverlapping(x1, y1, w1, h1, x2, y2, w2, h2, maxOverlap = 0.1) {
        const overlapX = Math.max(0, Math.min(x1 + w1, x2 + w2) - Math.max(x1, x2));
        const overlapY = Math.max(0, Math.min(y1 + h1, y2 + h2) - Math.max(y1, y2));
        const overlapArea = overlapX * overlapY;
        const minArea = Math.min(w1 * h1, w2 * h2);
        return overlapArea > maxOverlap * minArea;
    }

    function createClone() {
        if (clones.length >= config.maxClones) {
            // Remove oldest clone when at max capacity
            const oldestClone = clones.shift();
            if (oldestClone.element.parentNode) {
                oldestClone.element.parentNode.removeChild(oldestClone.element);
            }
        }

        const clone = jitterChild.cloneNode(true);
        clone.id = `jitterClone${cloneCounter++}`;
        parent.appendChild(clone);

        // Get original dimensions
        const tempStyle = clone.style.transform;
        clone.style.transform = 'scale(1)';
        const originalRect = clone.getBoundingClientRect();
        const originalWidth = originalRect.width;
        const originalHeight = originalRect.height;
        clone.style.transform = tempStyle;

        // Generate random initial scale within config bounds
        const initialScale = Math.random() * (config.scaleMax - config.scaleMin) + config.scaleMin;
        const scaledWidth = originalWidth * initialScale;
        const scaledHeight = originalHeight * initialScale;

        // Get parent bounds for random positioning
        const parentBounds = getParentBounds();
        
        // Calculate maximum positions to ensure scaled element stays within bounds
        const maxPosX = Math.max(0, parentBounds.width - scaledWidth);
        const maxPosY = Math.max(0, parentBounds.height - scaledHeight);

        // Generate random initial position within bounds
        let initialX, initialY;
        let tryCount = 0;
        let overlapFound;

        do {
            initialX = Math.random() * maxPosX;
            initialY = Math.random() * maxPosY;
            
            overlapFound = false;
            // Check against all existing clones for overlap
            for (const existingClone of clones) {
                if (isOverlapping(
                    initialX, initialY, scaledWidth, scaledHeight,
                    existingClone.x, existingClone.y, 
                    existingClone.originalWidth * existingClone.scale, 
                    existingClone.originalHeight * existingClone.scale,
                    0.1
                )) {
                    overlapFound = true;
                    break;
                }
            }
            tryCount++;
        } while (overlapFound && tryCount < 15);

        // Initialize position data with random values
        const cloneData = {
            element: clone,
            x: initialX,
            y: initialY,
            scale: initialScale,
            originalWidth,
            originalHeight,
            lastTimestamp: performance.now(),
            index: clones.length
        };

        // Set initial transform with random position and scale
        clone.style.transform = `translate(${cloneData.x}px, ${cloneData.y}px) scale(${cloneData.scale})`;

        clones.push(cloneData);
        return cloneData;
    }

    function animateClone(cloneData, timestamp) {
        const elapsed = timestamp - cloneData.lastTimestamp;
        
        // Get fresh random timing for each step - brownian motion effect
        const currentStepTime = ANIMATION_FREQUENCY.jitterStepTime;
        if (elapsed >= currentStepTime) {
            const parentBounds = getParentBounds();
            const maxOffsetX = parentBounds.width * config.xOffsetRatio;
            const maxOffsetY = parentBounds.height * config.yOffsetRatio;

            // Random scaling
            cloneData.scale = Math.random() * (config.scaleMax - config.scaleMin) + config.scaleMin;
            const scaledWidth = cloneData.originalWidth * cloneData.scale;
            const scaledHeight = cloneData.originalHeight * cloneData.scale;

            // Ensure scaled element fits in parent
            const maxPosX = Math.max(0, parentBounds.width - scaledWidth);
            const maxPosY = Math.max(0, parentBounds.height - scaledHeight);

            // Try to find a non-overlapping position
            let tryCount = 0;
            let newX, newY, overlapFound;

            do {
                const stepX = (Math.random() - 0.5) * 2 * Math.min(maxOffsetX, maxPosX);
                const stepY = (Math.random() - 0.5) * 2 * Math.min(maxOffsetY, maxPosY);
                newX = cloneData.x + stepX;
                newY = cloneData.y + stepY;
                newX = Math.max(0, Math.min(newX, maxPosX));
                newY = Math.max(0, Math.min(newY, maxPosY));

                overlapFound = false;
                // Check against all other clones
                for (const otherClone of clones) {
                    if (otherClone !== cloneData) {
                        if (isOverlapping(
                            newX, newY, scaledWidth, scaledHeight,
                            otherClone.x, otherClone.y, 
                            otherClone.originalWidth * otherClone.scale, 
                            otherClone.originalHeight * otherClone.scale,
                            0.1
                        )) {
                            overlapFound = true;
                            break;
                        }
                    }
                }
                tryCount++;
            } while (overlapFound && tryCount < 15);

            cloneData.x = newX;
            cloneData.y = newY;
            cloneData.element.style.transform = `translate(${cloneData.x}px, ${cloneData.y}px) scale(${cloneData.scale})`;
            cloneData.lastTimestamp = timestamp;
        }
    }

    function animate(timestamp) {
        // Animate all existing clones
        clones.forEach(cloneData => animateClone(cloneData, timestamp));
        requestAnimationFrame(animate);
    }

    // Create initial clone
    createClone();

    // Set up clone generation interval with dynamic timing
    let cloneTimeoutId = null;
    function scheduleNextClone() {
        const nextInterval = ANIMATION_FREQUENCY.cloneGenFreq;
        cloneTimeoutId = setTimeout(() => {
            createClone();
            scheduleNextClone(); // Schedule the next one with fresh random timing
        }, nextInterval);
    }
    
    // Start the clone generation cycle
    scheduleNextClone();

    // Start animation loop
    requestAnimationFrame(animate);

    // Return cleanup function
    return function cleanup() {
        if (cloneTimeoutId) clearTimeout(cloneTimeoutId);
        clones.forEach(cloneData => {
            if (cloneData.element.parentNode) {
                cloneData.element.parentNode.removeChild(cloneData.element);
            }
        });
        clones = [];
    };
}

// Apply dynamic jitter animation to the container
applyDynamicJitterAnimation('jitterBB');
