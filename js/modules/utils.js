// Gender constants for consistent usage
export const GENDER = {
    MASCULINE: 'masculine',
    FEMININE: 'feminine'
};

const STARTING_SYLLABLES = {
    masculine: ['ber', 'thor', 'gar', 'ral', 'mal'],
    feminine: ['lyn', 'ria', 'mae', 'bel', 'ren']
};

const MIDDLE_SYLLABLES = ['an', 'en', 'in', 'on', 'un'];

const ENDING_SYLLABLES = {
    masculine: ['or', 'ar', 'ir', 'ur', 'er'],
    feminine: ['a', 'ia', 'ea', 'ara', 'ira']
};

/**
 * Generates a random name based on gender
 * @param {string} gender - Either 'masculine' or 'feminine'
 * @returns {string} Generated name
 * @throws {Error} If invalid gender is provided
 */
export function generateRandomName(gender = GENDER.MASCULINE) {
    // Convert legacy 'male'/'female' values to GENDER constants
    if (gender === 'male') gender = GENDER.MASCULINE;
    if (gender === 'female') gender = GENDER.FEMININE;

    // Validate gender parameter
    if (gender !== GENDER.MASCULINE && gender !== GENDER.FEMININE) {
        throw new Error(`Invalid gender: ${gender}. Must be either '${GENDER.MASCULINE}' or '${GENDER.FEMININE}'`);
    }

    const start = STARTING_SYLLABLES[gender][Math.floor(Math.random() * STARTING_SYLLABLES[gender].length)];
    const middle = MIDDLE_SYLLABLES[Math.floor(Math.random() * MIDDLE_SYLLABLES.length)];
    const end = ENDING_SYLLABLES[gender][Math.floor(Math.random() * ENDING_SYLLABLES[gender].length)];

    return (start + middle + end).charAt(0).toUpperCase() + (start + middle + end).slice(1);
}

// Color utilities
export function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const clamped = Math.min(255, Math.max(0, x));
        const hex = Math.round(clamped).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// Math utilities
export function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Generates a random integer between min and max (inclusive)
 * @param {number} min - The minimum value (inclusive)
 * @param {number} max - The maximum value (inclusive)
 * @returns {number} A random integer between min and max
 * @throws {Error} If min > max or if values exceed safe integer bounds
 */
export function randomInt(min, max) {
    // Validate inputs are integers
    min = Math.floor(min);
    max = Math.floor(max);

    // Validate bounds
    if (min > max) {
        throw new Error('Minimum value must be less than or equal to maximum value');
    }

    // Check for safe integer bounds
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max)) {
        throw new Error('Values must be within safe integer bounds');
    }

    // Calculate range size (add 1 to include max in possible results)
    const range = max - min + 1;
    
    // Check if range is safe
    if (!Number.isSafeInteger(range)) {
        throw new Error('Range size exceeds safe integer bounds');
    }

    return Math.floor(min + Math.random() * range);
}

// Distance calculations
export function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

export function manhattanDistance(x1, y1, x2, y2) {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

// Array utilities
export function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function sample(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Time utilities
export function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

// Debug utilities
export function debugLog(message, type = 'info') {
    const colors = {
        info: '\x1b[36m', // Cyan
        warning: '\x1b[33m', // Yellow
        error: '\x1b[31m', // Red
        success: '\x1b[32m' // Green
    };
    
    const timestamp = new Date().toISOString();
    console.log(`${colors[type]}[${timestamp}] ${message}\x1b[0m`);
}

// Canvas utilities
export function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// Object pool for performance
export class ObjectPool {
    constructor(createFn, maxSize = 1000) {
        this.createFn = createFn;
        this.maxSize = maxSize;
        this.objects = [];
        this.activeObjects = new Set();
    }
    
    acquire() {
        let obj;
        if (this.objects.length > 0) {
            obj = this.objects.pop();
        } else if (this.activeObjects.size < this.maxSize) {
            obj = this.createFn();
        } else {
            return null;
        }
        
        this.activeObjects.add(obj);
        return obj;
    }
    
    release(obj) {
        if (this.activeObjects.delete(obj)) {
            if (this.objects.length < this.maxSize) {
                this.objects.push(obj);
            }
        }
    }
    
    clear() {
        this.objects = [];
        this.activeObjects.clear();
    }
}

// ULID generation
const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ENCODING_LEN = ENCODING.length;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

export function generateULID() {
    const time = Date.now();
    let str = '';
    
    // Time component
    let t = time;
    for (let i = 0; i < TIME_LEN; i++) {
        str = ENCODING[t % ENCODING_LEN] + str;
        t = Math.floor(t / ENCODING_LEN);
    }
    
    // Random component
    for (let i = 0; i < RANDOM_LEN; i++) {
        str += ENCODING[Math.floor(Math.random() * ENCODING_LEN)];
    }
    
    return str;
}
