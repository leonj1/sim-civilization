import { Building } from '../Building.js';
import { drawRoundedRect } from '../../utils.js';

export class PublicBuilding extends Building {
    constructor(x, y, type) {
        super(x, y);
        this._type = type;
        this.occupants = [];
        this._capacity = this.determineCapacity(type);
    }

    get type() {
        return this._type;
    }

    get capacity() {
        return this._capacity;
    }

    determineCapacity(type) {
        switch(type) {
            case 'school': return 30;
            case 'playground': return 15;
            case 'mall': return 50;
            default: return 20;
        }
    }

    draw(ctx, offset, zoom) {
        const { x: screenX, y: screenY } = this.calculateScreenPosition(offset, zoom);
        
        ctx.fillStyle = '#A0A0A0';
        ctx.fillRect(screenX - 25 * zoom, screenY - 25 * zoom, 50 * zoom, 50 * zoom);
        
        this.drawBuildingType(ctx, screenX, screenY, zoom);
        this.drawLabel(ctx, screenX, screenY, zoom);
    }

    drawBuildingType(ctx, screenX, screenY, zoom) {
        switch (this.type) {
            case 'school':
                this.drawSchool(ctx, screenX, screenY, zoom);
                break;
            case 'playground':
                this.drawPlayground(ctx, screenX, screenY, zoom);
                break;
            case 'mall':
                this.drawMall(ctx, screenX, screenY, zoom);
                break;
        }
    }

    drawLabel(ctx, screenX, screenY, zoom) {
        ctx.fillStyle = 'black';
        ctx.font = `${12 * zoom}px Mojangles`;
        ctx.textAlign = 'center';
        ctx.fillText(`${this.type.charAt(0).toUpperCase() + this.type.slice(1)}`, screenX, screenY - 30 * zoom);
        ctx.fillText(`(${this.occupants.length}/${this.capacity})`, screenX, screenY - 40 * zoom);
    }

    /**
     * Draws a school building with distinctive academic features
     */
    drawSchool(ctx, screenX, screenY, zoom) {
        // Main building
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1 * zoom;

        // Draw main building structure
        const width = 40 * zoom;
        const height = 30 * zoom;
        drawRoundedRect(ctx, screenX - width/2, screenY - height/2, width, height, 5 * zoom);
        ctx.fill();
        ctx.stroke();

        // Draw roof
        ctx.beginPath();
        ctx.moveTo(screenX - width/2 - 5 * zoom, screenY - height/2);
        ctx.lineTo(screenX, screenY - height/2 - 15 * zoom);
        ctx.lineTo(screenX + width/2 + 5 * zoom, screenY - height/2);
        ctx.fillStyle = '#8B4513';
        ctx.fill();

        // Draw windows
        ctx.fillStyle = '#87CEEB';
        const windowSize = 6 * zoom;
        for (let i = -1; i <= 1; i++) {
            drawRoundedRect(ctx, 
                screenX + i * (windowSize + 4 * zoom) - windowSize/2,
                screenY - windowSize/2,
                windowSize, windowSize,
                2 * zoom
            );
            ctx.fill();
            ctx.stroke();
        }
    }

    /**
     * Draws a playground with play equipment and safety features
     */
    drawPlayground(ctx, screenX, screenY, zoom) {
        // Base ground area
        ctx.fillStyle = '#90EE90';
        ctx.strokeStyle = '#228B22';
        ctx.lineWidth = 1 * zoom;

        // Draw safety mat area
        const baseSize = 35 * zoom;
        drawRoundedRect(ctx, screenX - baseSize/2, screenY - baseSize/2, baseSize, baseSize, 5 * zoom);
        ctx.fill();
        ctx.stroke();

        // Draw swing set frame
        ctx.beginPath();
        ctx.strokeStyle = '#4A4A4A';
        ctx.lineWidth = 2 * zoom;
        
        // Frame
        ctx.moveTo(screenX - 15 * zoom, screenY - 10 * zoom);
        ctx.lineTo(screenX, screenY - 15 * zoom);
        ctx.lineTo(screenX + 15 * zoom, screenY - 10 * zoom);
        
        // Swings
        ctx.moveTo(screenX - 8 * zoom, screenY - 12 * zoom);
        ctx.lineTo(screenX - 8 * zoom, screenY);
        ctx.moveTo(screenX + 8 * zoom, screenY - 12 * zoom);
        ctx.lineTo(screenX + 8 * zoom, screenY);
        
        ctx.stroke();
    }

    /**
     * Draws a mall with modern retail architecture
     */
    drawMall(ctx, screenX, screenY, zoom) {
        // Main structure
        ctx.fillStyle = '#B8860B';
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1 * zoom;

        // Draw main building
        const width = 45 * zoom;
        const height = 35 * zoom;
        drawRoundedRect(ctx, screenX - width/2, screenY - height/2, width, height, 8 * zoom);
        ctx.fill();
        ctx.stroke();

        // Draw entrance
        ctx.fillStyle = '#4682B4';
        const doorWidth = 15 * zoom;
        const doorHeight = 20 * zoom;
        drawRoundedRect(ctx,
            screenX - doorWidth/2,
            screenY + height/2 - doorHeight,
            doorWidth, doorHeight,
            3 * zoom
        );
        ctx.fill();
        ctx.stroke();

        // Draw sign
        ctx.fillStyle = '#FFD700';
        ctx.font = `${Math.floor(8 * zoom)}px Mojangles`;
        ctx.textAlign = 'center';
        ctx.fillText('MALL', screenX, screenY - height/2 + 10 * zoom);
    }
}
