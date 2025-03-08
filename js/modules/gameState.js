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

/**
 * Initialize the game's rendering context
 * @param {HTMLCanvasElement} canvas - The canvas element to use for rendering
 * @param {CanvasRenderingContext2D} context - The 2D rendering context
 * @throws {Error} If canvas or context are invalid
 * @returns {Object} The initialized canvas and context
 */
export function initializeCanvas(canvas, context) {
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
        throw new Error('Valid canvas element required');
    }
    if (!context || !(context instanceof CanvasRenderingContext2D)) {
        throw new Error('Valid 2D rendering context required');
    }

    gameCanvas = canvas;
    ctx = context;
    
    return { gameCanvas, ctx };
}

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