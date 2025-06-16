import "./as-dithered-image.js";
import { lifemachine } from "./lifeMachine.js";
import { gsap } from "gsap";

// Global config
const ANIMATION_FREQUENCY = {
  jitterStepTime: 2000,
  lifeMachineSpeed: 4000,
};

// Initialize the life machine canvas
const lifeMachineInstance = lifemachine('lifeMachine1', ANIMATION_FREQUENCY.lifeMachineSpeed);

// Jitter animation with bounding box clamping
function jitterInsideBounds(ids, parentId, options = {}) {
  const config = {
    stepTime: 2000,
    scaleMin: 0.92,
    scaleMax: 1.0,
    xPadding: 4,
    yPadding: 4,
    ...options,
  };

  const parent = document.getElementById(parentId);
  if (!parent) return;

  const getParentRect = () => parent.getBoundingClientRect();

  ids.forEach((id, index) => {
    const el = document.getElementById(id);
    if (!el) return;

    function step() {
      const pRect = getParentRect();
      const eRect = el.getBoundingClientRect();

      const scale = Math.random() * (config.scaleMax - config.scaleMin) + config.scaleMin;
      const scaledWidth = eRect.width * scale;
      const scaledHeight = eRect.height * scale;

      const maxX = Math.max(0, pRect.width - scaledWidth - config.xPadding);
      const maxY = Math.max(0, pRect.height - scaledHeight - config.yPadding);

      const x = Math.random() * maxX;
      const y = Math.random() * maxY;

      gsap.set(el, {
        x: x,
        y: y,
        scale: scale,
      });
    }

    // PHASE OFFSET: stagger the first trigger
    const phaseDelay = (config.stepTime / ids.length) * index;

    setTimeout(() => {
      step(); // first step after delay
      setInterval(step, config.stepTime);
    }, phaseDelay);
  });
}

// Start the animation on load
jitterInsideBounds(['jitter1', 'jitter2'], 'jitterBB', {
  stepTime: ANIMATION_FREQUENCY.jitterStepTime,
  scaleMin: 0.92,
  scaleMax: 1.0,
});

// Optional: debounce resize re-init
let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    jitterInsideBounds(['jitter1', 'jitter2'], 'jitterBB', {
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
