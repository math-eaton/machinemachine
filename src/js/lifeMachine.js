import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function lifemachine(containerId, customSimulationSpeed = 5000) {
  let grid = [];
  let nextGrid = [];
  const word = "MACHINE";
  let simulationSpeed = customSimulationSpeed; // Speed of the simulation in milliseconds
  // let currentRuleIndex = 3; // Track current rule set
  let currentRuleIndex = 1; // Track current rule set
  let generations = {}; // Track generations for decay
  let intervalId;
  
  // Shared resolution factor for consistent grid sizing
  const RESOLUTION_FACTOR = 25; // Target cell size in pixels

  const rules = [
    { // Conway's Game of Life
      survive: [2, 3],
      birth: [3]
    },
    { // Rule 30 (Wolfram's Rule 30 approximation for 2D)
      survive: [],
      birth: [1, 2]
    },
    { // Day & Night
      survive: [3, 4, 6, 7, 8],
      birth: [3, 6, 7, 8]
    },
    // { // Seeds
    //   survive: [],
    //   birth: [2]
    // },
    { // Maze
      survive: [1, 2, 3, 4, 5],
      birth: [3]
    },
    { // Coral
      survive: [4, 5, 6, 7, 8],
      birth: [3]
    },
    { // Morley
      survive: [2, 4, 5],
      birth: [3, 6, 8]
    },
    { // Anneal
      survive: [4, 6, 7, 8],
      birth: [3, 5, 6, 7, 8]
    }
  ];
  
  let scene, camera, renderer, controls, canvas, ctx;
  let gridWidth, gridHeight;
  let cellWidth, cellHeight;
  let resizeObserver;

  function initGrid(gridWidth, gridHeight) {
    for (let y = 0; y < gridHeight; y++) {
      grid[y] = [];
      nextGrid[y] = [];
      generations[y] = [];
      for (let x = 0; x < gridWidth; x++) {
        if (Math.random() < 0.1) {
          const char = word[Math.floor(Math.random() * word.length)];
          grid[y][x] = char;
          generations[y][x] = 0;
        } else {
          grid[y][x] = null;
          generations[y][x] = null;
        }
        nextGrid[y][x] = null;
      }
    }
  }

  function computeNextGrid(gridWidth, gridHeight) {
    const rule = rules[currentRuleIndex];
    let completedWords = findCompletedWords(gridWidth, gridHeight);

    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const aliveNeighbors = getAliveNeighbors(x, y, gridWidth, gridHeight);
        const currentCell = grid[y][x];

        if (currentCell) {
          generations[y][x]++;
          if (generations[y][x] > 10) {
            nextGrid[y][x] = null;
            generations[y][x] = null;
          } else {
            nextGrid[y][x] = rule.survive.includes(aliveNeighbors) ? currentCell : null;
          }
        } else {
          if (rule.birth.includes(aliveNeighbors)) {
            nextGrid[y][x] = computeBirthCharacter(x, y, gridWidth, gridHeight);
          } else {
            nextGrid[y][x] = null;
          }
        }
      }
    }

    enforceWordLimit(completedWords);
    ensureCharactersOnGrid();
    // seedRandomCharacterEveryTick();
    seedRandomCharacters();
    [grid, nextGrid] = [nextGrid, grid];
  }

  function getAliveNeighbors(x, y, gridWidth, gridHeight) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight && grid[ny][nx]) {
          count++;
        }
      }
    }
    return count;
  }

  function computeBirthCharacter(x, y, gridWidth, gridHeight) {
    const neighbors = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight && grid[ny][nx]) {
          neighbors.push(grid[ny][nx]);
        }
      }
    }

    if (neighbors.length > 0) {
      return word[(word.indexOf(neighbors[0]) + 1) % word.length];
    }
    return null;
  }

  function findCompletedWords(gridWidth, gridHeight) {
    let completedWords = [];
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        if (isCompleteWord(x, y, gridWidth, gridHeight)) {
          completedWords.push({ x, y });
        }
      }
    }
    return completedWords;
  }

  function isCompleteWord(x, y, gridWidth, gridHeight) {
    if (x + word.length > gridWidth) return false;
    for (let i = 0; i < word.length; i++) {
      if (grid[y][x + i] !== word[i]) return false;
    }
    return true;
  }

  function enforceWordLimit(completedWords) {
    if (completedWords.length > 2) {
      const excessWords = completedWords.slice(2);
      for (const { x, y } of excessWords) {
        for (let i = 0; i < word.length; i++) {
          grid[y][x + i] = null;
        }
      }
    }
  }

  function ensureCharactersOnGrid() {
    let hasCharacters = false;
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        if (grid[y][x] !== null) {
          hasCharacters = true;
          break;
        }
      }
      if (hasCharacters) break;
    }

    if (!hasCharacters) {
      seedRandomCharacters();
    }
  }

  function seedRandomCharacters() {
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        if (Math.random() < 0.5) {
          const char = word[Math.floor(Math.random() * word.length)];
          grid[y][x] = char;
          generations[y][x] = 0;
        }
      }
    }
  }

  // function seedRandomCharacterEveryTick() {
  //   const x = Math.floor(Math.random() * gridWidth);
  //   const y = Math.floor(Math.random() * gridHeight);
  //   if (!grid[y][x]) {
  //     const char = word[Math.floor(Math.random() * word.length)];
  //     grid[y][x] = char;
  //     generations[y][x] = 0;
  //   }
  // }

  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Use system sans-serif font with proper sizing for grid cells
    ctx.font = `${Math.floor(cellHeight * 0.6)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const cell = grid[y][x];
        if (cell) {
          ctx.fillStyle = "black";
          // Center each character in its cell regardless of character width
          const centerX = x * cellWidth + cellWidth / 2;
          const centerY = y * cellHeight + cellHeight / 2;
          ctx.fillText(cell, centerX, centerY);
        }
      }
    }
  }

  function getBodyDimensions() {
    // For a background that covers the entire document content area
    const body = document.body;
    const html = document.documentElement;
    
    // Get the full document dimensions including scrollable content
    const documentWidth = Math.max(
      body.scrollWidth, body.offsetWidth,
      html.clientWidth, html.scrollWidth, html.offsetWidth
    );
    
    const documentHeight = Math.max(
      body.scrollHeight, body.offsetHeight,
      html.clientHeight, html.scrollHeight, html.offsetHeight
    );
    
    // Ensure we always cover at least the full viewport
    const width = Math.max(documentWidth, window.innerWidth);
    const height = Math.max(documentHeight, window.innerHeight);
    
    return { width, height };
  }

  function resizeGrid() {
    const dimensions = getBodyDimensions();
    const newWidth = dimensions.width;
    const newHeight = dimensions.height;
    
    // Update canvas dimensions
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // Recalculate grid dimensions with square cells that fill the viewport
    const cellSize = RESOLUTION_FACTOR;
    
    // Calculate grid dimensions to fill entire viewport
    const newGridWidth = Math.ceil(newWidth / cellSize);
    const newGridHeight = Math.ceil(newHeight / cellSize);
    
    // Calculate actual cell sizes to fill the viewport exactly
    const newCellWidth = newWidth / newGridWidth;
    const newCellHeight = newHeight / newGridHeight;
    
    // Store old grid data
    const oldGrid = grid;
    const oldGenerations = generations;
    const oldGridWidth = gridWidth;
    const oldGridHeight = gridHeight;
    
    // Update grid dimensions
    gridWidth = newGridWidth;
    gridHeight = newGridHeight;
    cellWidth = newCellWidth;
    cellHeight = newCellHeight;
    
    // Create new grids
    grid = [];
    nextGrid = [];
    generations = {};
    
    // Initialize new grids
    for (let y = 0; y < gridHeight; y++) {
      grid[y] = [];
      nextGrid[y] = [];
      generations[y] = [];
      for (let x = 0; x < gridWidth; x++) {
        grid[y][x] = null;
        nextGrid[y][x] = null;
        generations[y][x] = null;
      }
    }
    
    // Copy data from old grid to new grid (preserve as much as possible)
    if (oldGrid && oldGrid.length > 0) {
      const minHeight = Math.min(oldGridHeight, gridHeight);
      const minWidth = Math.min(oldGridWidth, gridWidth);
      
      for (let y = 0; y < minHeight; y++) {
        for (let x = 0; x < minWidth; x++) {
          if (oldGrid[y] && oldGrid[y][x] !== undefined) {
            grid[y][x] = oldGrid[y][x];
            generations[y][x] = oldGenerations[y] ? oldGenerations[y][x] : null;
          }
        }
      }
    }
    
    // Update camera aspect ratio
    if (camera) {
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
    }
    
    // Redraw the grid
    drawGrid();
  }

  function animate() {
    intervalId = setInterval(() => {
      computeNextGrid(gridWidth, gridHeight);
      drawGrid();
    }, simulationSpeed);
  }

  function init() {
    scene = new THREE.Scene();
    
    // Get proper dimensions for camera setup
    const initialDimensions = getBodyDimensions();
    camera = new THREE.PerspectiveCamera(52, initialDimensions.width / initialDimensions.height, 0.1, 1000);
    renderer = new THREE.WebGLRenderer(
    { antialias: false });

    // var w,h = [window.innerWidth, window.innerHeight]
    // renderer.setSize(window.innerWidth*2, window.innerHeight*2);

    // renderer.domElement.style.width = w;
    // renderer.domElement.style.height = h;
    // renderer.domElement.width = w*2
    // renderer.domElement.height = h*2
    
    canvas = document.createElement("canvas");
    
    // Get proper dimensions for the canvas
    canvas.width = initialDimensions.width;
    canvas.height = initialDimensions.height;
    
    document.getElementById(containerId).appendChild(canvas);
    ctx = canvas.getContext("2d");

    let resolutionFactor = RESOLUTION_FACTOR; // Target cell size in pixels
    const cellSize = resolutionFactor;
    
    // Calculate grid dimensions to fill entire viewport
    gridWidth = Math.ceil(initialDimensions.width / cellSize);
    gridHeight = Math.ceil(initialDimensions.height / cellSize);
    
    // Calculate actual cell sizes to fill the viewport exactly
    cellWidth = initialDimensions.width / gridWidth;
    cellHeight = initialDimensions.height / gridHeight;

    camera.position.z = resolutionFactor;
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = false;

    initGrid(gridWidth, gridHeight);
    animate();

    // Add resize event listener for window changes
    let resizeTimeout;
    window.addEventListener('resize', () => {
      // Debounce resize events to avoid excessive recalculations
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resizeGrid();
      }, 100);
    });

    // Add ResizeObserver to monitor document body changes
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          resizeGrid();
        }, 100);
      });
      resizeObserver.observe(document.body);
    }

    // Load custom font
    const fontFace = new FontFace("Web437_IBM_PS-55_re", "url('./src/fonts/Web437_IBM_PS-55_re.woff2')");
    fontFace.load().then((loadedFace) => {
      document.fonts.add(loadedFace);
      drawGrid();
    });

  }

  function cleanup() {
    if (intervalId) {
      clearInterval(intervalId);
    }
    window.removeEventListener('resize', resizeGrid);
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  }

  init();

  // Return an object with useful methods for external control
  return {
    cleanup,
    resizeGrid,
    getCurrentRule: () => currentRuleIndex,
    setRule: (index) => {
      if (index >= 0 && index < rules.length) {
        currentRuleIndex = index;
      }
    },
    setSpeed: (speed) => {
      simulationSpeed = speed;
      if (intervalId) {
        clearInterval(intervalId);
        animate();
      }
    }
  };
}