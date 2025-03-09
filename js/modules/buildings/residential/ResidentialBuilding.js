import { Building } from '../Building.js';
import { RESIDENTIAL_CONFIG } from '../constants.js';

export class ResidentialBuilding extends Building {
    constructor(x, y, type) {
        super(x, y);
        this._type = type;
        this._capacity = this.calculateCapacity(type);
    }

    get type() {
        return this._type;
    }

    get capacity() {
        return this._capacity;
    }

    calculateCapacity(type) {
        const config = type === 'hotel' ?
            RESIDENTIAL_CONFIG.HOTEL :
            type === 'condo' ?
                RESIDENTIAL_CONFIG.CONDO :
                null;

        if (!config) return RESIDENTIAL_CONFIG.DEFAULT_CAPACITY;
        
        const range = (config.MAX_CAPACITY - config.MIN_CAPACITY) / config.STEP_SIZE;
        return Math.round(Math.random() * range) * config.STEP_SIZE + config.MIN_CAPACITY;
    }

    draw(ctx, offset, zoom) {
        const { x: screenX, y: screenY } = this.calculateScreenPosition(offset, zoom);
        
        ctx.fillStyle = this.type === 'hotel' ? '#4A90E2' : '#9B59B6';
        ctx.fillRect(screenX - 30 * zoom, screenY - 40 * zoom, 60 * zoom, 80 * zoom);
        
        // Draw windows
        ctx.fillStyle = '#FFF';
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                ctx.fillRect(screenX - 20 * zoom + j * 20 * zoom, screenY - 30 * zoom + i * 20 * zoom, 10 * zoom, 10 * zoom);
            }
        }
        
        this.drawLabel(ctx, screenX, screenY, zoom);
    }

    drawLabel(ctx, screenX, screenY, zoom) {
        ctx.fillStyle = 'black';
        ctx.font = `${12 * zoom}px Mojangles`;
        ctx.textAlign = 'center';
        ctx.fillText(`${this.type.charAt(0).toUpperCase() + this.type.slice(1)}`, screenX, screenY - 30 * zoom);
        ctx.fillText(`(${this.capacity})`, screenX, screenY - 40 * zoom);
    }
}
