import { OBJECT_POOL } from '../game.js';
import { drawRoundedRect } from './utils.js';

export const STORE_COLORS = {
    WALL: '#98FB98',
    ROOF: '#32CD32',
    DOOR: '#228B22'
};

export class Building {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.hasRoad = false;
        this.town = null;
        this.familyName = null;
    }

    draw(ctx, offset, zoom) {
        const screenX = (this.x + offset.x) * zoom;
        const screenY = (this.y + offset.y) * zoom;
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(screenX - 15 * zoom, screenY - 15 * zoom, 30 * zoom, 30 * zoom);
        
        ctx.fillStyle = '#4A2811';
        ctx.fillRect(screenX - 5 * zoom, screenY + 5 * zoom, 10 * zoom, 10 * zoom);
        
        // Draw roof
        ctx.beginPath();
        ctx.moveTo(screenX - 20 * zoom, screenY - 15 * zoom);
        ctx.lineTo(screenX + 20 * zoom, screenY - 15 * zoom);
        ctx.lineTo(screenX, screenY - 30 * zoom);
        ctx.closePath();
        ctx.fillStyle = '#654321';
        ctx.fill();

        if (this.familyName) {
            this.drawFamilyName(ctx, screenX, screenY, zoom);
        }
    }

    drawFamilyName(ctx, screenX, screenY, zoom) {
        ctx.fillStyle = 'black';
        ctx.font = `bold ${14 * zoom}px Mojangles`;
        ctx.textAlign = 'center';
        ctx.fillText(this.familyName, screenX, screenY - 35 * zoom);
        
        const nameWidth = ctx.measureText(this.familyName).width;
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2 * zoom;
        ctx.strokeRect(screenX - nameWidth / 2 - 5 * zoom, screenY - 48 * zoom, nameWidth + 10 * zoom, 18 * zoom);
        
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(screenX - nameWidth / 2 - 5 * zoom, screenY - 48 * zoom, nameWidth + 10 * zoom, 18 * zoom);
        
        ctx.fillStyle = '#333';
        ctx.fillText(this.familyName, screenX, screenY - 35 * zoom);
    }

    update(deltaTime) {}
}

export class Store extends Building {
    constructor(x, y) {
        super(x, y);
        this.type = 'store';
        this.owner = null;
        this.employees = [];
        this.inventory = 100;
        this.customers = [];
        this.restockTimer = 0;
    }

    draw(ctx, offset, zoom) {
        const screenX = (this.x + offset.x) * zoom;
        const screenY = (this.y + offset.y) * zoom;
        
        ctx.fillStyle = STORE_COLORS.WALL;
        ctx.fillRect(screenX - 20 * zoom, screenY - 20 * zoom, 40 * zoom, 30 * zoom);
        
        // Draw roof
        ctx.beginPath();
        ctx.moveTo(screenX - 25 * zoom, screenY - 20 * zoom);
        ctx.lineTo(screenX + 25 * zoom, screenY - 20 * zoom);
        ctx.lineTo(screenX, screenY - 35 * zoom);
        ctx.closePath();
        ctx.fillStyle = STORE_COLORS.ROOF;
        ctx.fill();
        
        // Draw door
        ctx.fillStyle = STORE_COLORS.DOOR;
        ctx.fillRect(screenX - 5 * zoom, screenY - 10 * zoom, 10 * zoom, 20 * zoom);
        
        // Draw inventory bar
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(screenX - 15 * zoom, screenY - 25 * zoom, 30 * zoom * (this.inventory / 100), 3 * zoom);
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.restockTimer -= deltaTime;
        if (this.restockTimer <= 0) {
            this.inventory = Math.max(0, Math.min(100, this.inventory - 5));
            this.restockTimer = 5000;
        }
    }

    needsSupplies() {
        return this.inventory < 50;
    }
}

export class PublicBuilding extends Building {
    constructor(x, y, type) {
        super(x, y);
        this.type = type;
        this.occupants = [];
        this.capacity = this.determineCapacity(type);
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
        const screenX = (this.x + offset.x) * zoom;
        const screenY = (this.y + offset.y) * zoom;
        
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

export class ResidentialBuilding extends PublicBuilding {
    constructor(x, y, type) {
        super(x, y, type);
        this.capacity = this.calculateCapacity(type);
    }

    calculateCapacity(type) {
        if (type === 'hotel') {
            return Math.round(Math.random() * (75 - 50) / 5) * 5 + 50;
        } else if (type === 'condo') {
            return Math.round(Math.random() * (40 - 20) / 5) * 5 + 20;
        }
        return 20;
    }

    draw(ctx, offset, zoom) {
        const screenX = (this.x + offset.x) * zoom;
        const screenY = (this.y + offset.y) * zoom;
        
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
} 