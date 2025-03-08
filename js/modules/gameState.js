// Shared game state and constants
export const OBJECT_POOL = {
    people: []
};

export let currentGenerationNumber = 0;
export let terrain = null;
export const offset = { x: 0, y: 0 };
export const zoom = 1;

// Canvas state
export let gameCanvas = null;
export let ctx = null;

// Functions to update game state
export function setCurrentGeneration(gen) {
    currentGenerationNumber = gen;
}

export function setTerrain(newTerrain) {
    terrain = newTerrain;
}

export function updateOffset(x, y) {
    offset.x = x;
    offset.y = y;
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