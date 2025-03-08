// Shared game state and constants
export const OBJECT_POOL = {
    people: []
};

export let currentGenerationNumber = 0;
export let terrain = null;
export const offset = { x: 0, y: 0 };
export const zoom = 1;

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