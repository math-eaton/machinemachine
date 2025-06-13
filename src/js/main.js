import "./as-dithered-image.js";
// import { wordSearch } from '/src/js/wordsearch.js';
import { lifemachine } from "./lifeMachine.js";
// import { SpeedInsights } from "@vercel/speed-insights/next"

// Global animation frequency configuration
const ANIMATION_FREQUENCY = {
    jitterStepTime: 5000,        // Time between jitter steps in milliseconds
    lifeMachineSpeed: 4000      // Life machine simulation speed in milliseconds
};

// Initialize the life machine with responsive grid
const lifeMachineInstance = lifemachine('lifeMachine1', ANIMATION_FREQUENCY.lifeMachineSpeed);

function applySteppedNoiseAnimation(ids, parentId, options = {}) {
    // Default configuration
    const config = {
        amplitude: 1,
        stepTime: 1500, // ms between steps
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
            if (elapsed >= config.stepTime) {
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

// Apply to elements with IDs XYZ using only the function defaults
applySteppedNoiseAnimation(['jitter1', 'jitter2'], 'jitterBB');


// import { gsap } from "gsap";


// function addMagnetizedEffect(targetId, repulsionRadius = 100, repulsionForce = 1, damping = 0.02) {
//     const target = document.getElementById(targetId);
//     if (!target) {
//         // console.error(Element with ID "${targetId}" not found.);
//         return;
//     }

//     target.style.position = "absolute";

//     let velocity = { x: 0, y: 0 };
//     const bounds = () => ({
//         width: window.innerWidth,
//         height: window.innerHeight,
//     });

//     const getCenter = () => {
//         const rect = target.getBoundingClientRect();
//         return {
//             x: rect.left + rect.width / 2,
//             y: rect.top + rect.height / 2,
//         };
//     };


//     const updatePosition = () => {
//         const left = parseFloat(target.style.left || target.offsetLeft);
//         const top = parseFloat(target.style.top || target.offsetTop);

//         // Apply velocity with damping
//         velocity.x *= damping;
//         velocity.y *= damping;

//         const newLeft = left + velocity.x;
//         const newTop = top + velocity.y;

//         // Check for boundaries and apply bouncing
//         const targetRect = target.getBoundingClientRect();
//         const screenBounds = bounds();

//         if (newLeft < 0 || newLeft + targetRect.width > screenBounds.width) {
//             velocity.x *= -1; // Reverse X direction
//         }
//         if (newTop < 0 || newTop + targetRect.height > screenBounds.height) {
//             velocity.y *= -1; // Reverse Y direction
//         }

//         const boundedLeft = Math.min(
//             Math.max(0, newLeft),
//             screenBounds.width - targetRect.width
//         );
//         const boundedTop = Math.min(
//             Math.max(0, newTop),
//             screenBounds.height - targetRect.height
//         );

//         gsap.to(target, {
//             duration: 0.1,
//             x: boundedLeft,
//             y: boundedTop,
//             overwrite: true,
//         });

//         requestAnimationFrame(updatePosition);
//     };

//     // Track mouse movement and apply force
//     document.addEventListener("mousemove", (event) => {
//         const cursor = { x: event.clientX, y: event.clientY };
//         const center = getCenter();

//         const dx = center.x - cursor.x;
//         const dy = center.y - cursor.y;
//         const distance = Math.sqrt(dx * dx + dy * dy);

//         if (distance < repulsionRadius) {
//             const repulsionX = (dx / distance) * repulsionForce * (repulsionRadius - distance);
//             const repulsionY = (dy / distance) * repulsionForce * (repulsionRadius - distance);

//             velocity.x += repulsionX;
//             velocity.y += repulsionY;
//         }
//     });

//     updatePosition(); // init animation loop
// }

// addMagnetizedEffect("magnetDiv", 100, 1, 0.25);


// random jitter to divs //////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

// Skew only the text 'hand.' in the document by 25 degrees
function skewHandText(root = document.body) {
    const SKEW_CLASS = 'skew-hand';
    const SKEW_STYLE_ID = 'skew-hand-style';
    // Inject CSS if not already present
    if (!document.getElementById(SKEW_STYLE_ID)) {
        const style = document.createElement('style');
        style.id = SKEW_STYLE_ID;
        style.textContent = `\n.${SKEW_CLASS} {\n  display: inline-block;\n  transform: skewX(-25deg);\n}\n`;
        document.head.appendChild(style);
    }
    // Helper to recursively walk nodes
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
                // Continue on the new nodes (in case of multiple 'hand.' in one node)
                if (after.indexOf('hand.') !== -1) {
                    walk(parent.childNodes[parent.childNodes.length - 1]);
                }
                return;
            }
        } else if (node.nodeType === Node.ELEMENT_NODE && node.childNodes) {
            // Avoid script/style tags
            if (['SCRIPT', 'STYLE'].includes(node.tagName)) return;
            // Copy childNodes to array to avoid live collection issues
            Array.from(node.childNodes).forEach(walk);
        }
    }
    walk(root);
}
// Call after DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => skewHandText());
} else {
    skewHandText();
}
