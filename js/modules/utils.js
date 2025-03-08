// Name generation
const STARTING_SYLLABLES = {
    masculine: ['kai', 'tho', 'rex', 'zak', 'jun'],
    feminine: ['mia', 'lia', 'ava', 'zoe', 'rei']
};

const MIDDLE_SYLLABLES = ['na', 'ri', 'ko', 'mi', 'shi', 'ta', 'ra', 'ki', 'sa', 'yu'];

const ENDING_SYLLABLES = {
    masculine: ['rus', 'tor', 'der', 'rin', 'ton'],
    feminine: ['lyn', 'ria', 'mae', 'bel', 'ren']
};

export function generateRandomName(gender = 'male') {
    const start = gender === 'male' ? 
        STARTING_SYLLABLES.masculine[Math.floor(Math.random() * STARTING_SYLLABLES.masculine.length)] :
        STARTING_SYLLABLES.feminine[Math.floor(Math.random() * STARTING_SYLLABLES.feminine.length)];
    
    const middle = MIDDLE_SYLLABLES[Math.floor(Math.random() * MIDDLE_SYLLABLES.length)];
    
    const end = gender === 'male' ?
        ENDING_SYLLABLES.masculine[Math.floor(Math.random() * ENDING_SYLLABLES.masculine.length)] :
        ENDING_SYLLABLES.feminine[Math.floor(Math.random() * ENDING_SYLLABLES.feminine.length)];

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

export function randomInt(min, max) {
    return Math.floor(randomRange(min, max + 1));
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