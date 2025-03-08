// Shared game state and constants
export const OBJECT_POOL = {
    people: []
};

export let currentGenerationNumber = 0;
export let terrain = null;
export const offset = { x: 0, y: 0 };
export let zoom = 1;

// Game entities
export const towns = [];

// Canvas state
export let gameCanvas = null;
export let ctx = null;

// Functions to update game state
export function setCurrentGeneration(gen) {
    if (typeof gen !== 'number' || gen < 0) {
        throw new Error('Generation must be a non-negative number');
    }
    currentGenerationNumber = gen;
}

export function setTerrain(newTerrain) {
    if (!Array.isArray(newTerrain) || !newTerrain.length || !Array.isArray(newTerrain[0])) {
        throw new Error('Terrain must be a 2D array');
    }
    terrain = newTerrain;
}

export function updateOffset(x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') {
        throw new Error('Offset coordinates must be numbers');
    }
    offset.x = x;
    offset.y = y;
}

/**
 * Update zoom level with bounds checking
 * @param {number} newZoom - New zoom level (must be between 0.1 and 10)
 */
export function updateZoom(newZoom) {
    if (typeof newZoom !== 'number' || newZoom <= 0) {
        throw new Error('Zoom must be a positive number');
    }
    // Clamp zoom between reasonable bounds
    zoom = Math.max(0.1, Math.min(10, newZoom));
}

// Canvas initialization
export function initializeCanvas() {
    gameCanvas = document.getElementById('gameCanvas');
    if (!gameCanvas) {
        throw new Error('Canvas element not found');
    }
    ctx = gameCanvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not get canvas context');
    }
    return { gameCanvas, ctx };
} 