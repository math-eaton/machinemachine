
// import { wordSearch } from '/src/js/wordsearch.js';
import { lifemachine } from "./lifeMachine.js";

lifemachine('lifeMachine1');

function applySteppedNoiseAnimation(ids, parentId, options = {}) {
    // Default configuration
    const config = {
        amplitude: 1, // Amplitude scaling factor
        frequency: 1, // Frequency scaling factor (lower = slower changes)
        stepTime: 500, // Time between steps in milliseconds
        scaleMin: 0.5, // Minimum scale
        scaleMax: 1.5, // Maximum scale
        offsetRange: 50, // Maximum step size in pixels
        ...options,
    };

    // Get parent container element
    const parent = document.getElementById(parentId);
    if (!parent) {
        console.error(`Parent container with ID "${parentId}" not found.`);
        return;
    }

    // Get parent container size and position
    function getParentBounds() {
        const rect = parent.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height,
            left: rect.left,
            top: rect.top,
        };
    }

    ids.forEach((id) => {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with ID "${id}" not found.`);
            return;
        }

        // Initialize position for the child element
        let posX = 0; // Start position within parent
        let posY = 0; // Start position within parent
        let currentScale = 1; // Track the current scale of the element

        // Function to update the element's position and scale
        function animate() {
            const parentBounds = getParentBounds();
            const elementRect = element.getBoundingClientRect();
            const originalWidth = elementRect.width / currentScale; // Get original unscaled width
            const originalHeight = elementRect.height / currentScale; // Get original unscaled height

            // Random scaling
            currentScale = Math.random() * (config.scaleMax - config.scaleMin) + config.scaleMin;
            const scaledWidth = originalWidth * currentScale;
            const scaledHeight = originalHeight * currentScale;

            // Calculate random step sizes
            let stepX = (Math.random() - 0.5) * 2 * config.offsetRange;
            let stepY = (Math.random() - 0.5) * 2 * config.offsetRange;

            // Predict new position
            const newX = posX + stepX;
            const newY = posY + stepY;

            // Check boundaries and adjust steps if necessary
            if (newX < 0) {
                stepX = parentBounds.width - scaledWidth*.5 - posX; 
            } else if (newX + scaledWidth > parentBounds.width) {
                stepX = parentBounds.width - scaledWidth - posX; // Move back within right boundary
            }

            if (newY < 0) {
                stepY = parentBounds.height - scaledHeight*.25 - posY; 
            } else if (newY + scaledHeight > parentBounds.height) {
                stepY = parentBounds.height - scaledHeight - posY; // Move back within bottom boundary
            }

            // Update position
            posX += stepX;
            posY += stepY;

            // Apply transformation relative to the parent container
            element.style.transform = `translate(${posX}px, ${posY}px) scale(${currentScale})`;

            let maxTime = 5000;
            
            let timeValue = (config.stepTime / (Math.random)(config.frequency));

            function limitMaxValue(timeValue, maxTime) {
                return Math.min(timeValue, maxTime);
              }

            let flexTime = limitMaxValue(timeValue, maxTime)
              
            setTimeout(animate, flexTime);
        }

        // Start the animation
        animate();
    });
}

// wordSearch('p5-1', {
//     gridResolution: 15,
//     hiddenWords: [
//       { word: 'MACHINE', count: 2, orientation: 'horizontal' },
//       { word: 'MACHINE', count: 10, orientation: 'diagonal' },
//     ],
//     fillerChars: ' ',
//   });
  

// Apply to elements with IDs XYZ with custom amplitude and frequency
applySteppedNoiseAnimation(['jitter1', 'jitter2'], 'jitterBB', {
    frequency: 1, // Updates per second
    stepTime: 250, // Time between steps in milliseconds
    scaleMin: 0.5,
    scaleMax: 1,
    offsetRange: 2,
});


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
