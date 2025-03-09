import { Building } from './Building.js';
import { STORE_COLORS, STORE_CONFIG } from './constants.js';

export class Store extends Building {
    constructor(x, y) {
        super(x, y);
        this.type = 'store';
        this.owner = null;
        this.employees = [];
        this.inventory = STORE_CONFIG.MAX_INVENTORY;
        this.customers = [];
        this.restockTimer = STORE_CONFIG.RESTOCK_INTERVAL;
        this.lastRestockTime = Date.now();
    }

    draw(ctx, offset, zoom) {
        const { x: screenX, y: screenY } = this.calculateScreenPosition(offset, zoom);
        
        // Draw main building
        ctx.fillStyle = STORE_COLORS.WALL;
        const width = this.calculateScaledSize(40, zoom);
        const height = this.calculateScaledSize(30, zoom);
        ctx.fillRect(screenX - width/2, screenY - height/2, width, height);
        
        // Draw roof
        ctx.fillStyle = STORE_COLORS.ROOF;
        ctx.beginPath();
        ctx.moveTo(screenX - width/2, screenY - height/2);
        ctx.lineTo(screenX + width/2, screenY - height/2);
        ctx.lineTo(screenX, screenY - height/2 - this.calculateScaledSize(15, zoom));
        ctx.closePath();
        ctx.fill();
        
        // Draw door
        ctx.fillStyle = STORE_COLORS.DOOR;
        const doorWidth = this.calculateScaledSize(10, zoom);
        const doorHeight = this.calculateScaledSize(15, zoom);
        ctx.fillRect(screenX - doorWidth/2, screenY + height/2 - doorHeight, doorWidth, doorHeight);
        
        // Draw store type and inventory
        ctx.fillStyle = '#333';
        ctx.font = `${this.calculateScaledSize(8, zoom)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('STORE', screenX, screenY);
        
        this.drawInventoryBar(ctx, screenX, screenY, zoom);
    }

    drawInventoryBar(ctx, screenX, screenY, zoom) {
        const barWidth = this.calculateScaledSize(30, zoom);
        const barHeight = this.calculateScaledSize(4, zoom);
        const barY = screenY + this.calculateScaledSize(20, zoom);
        
        // Draw background bar
        ctx.fillStyle = '#ddd';
        ctx.fillRect(screenX - barWidth/2, barY, barWidth, barHeight);
        
        // Draw inventory level
        const fillWidth = (this.inventory / STORE_CONFIG.MAX_INVENTORY) * barWidth;
        ctx.fillStyle = this.inventory < STORE_CONFIG.LOW_STOCK_THRESHOLD ? '#ff4444' : '#44ff44';
        ctx.fillRect(screenX - barWidth/2, barY, fillWidth, barHeight);
        
        // Draw border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = zoom;
        ctx.strokeRect(screenX - barWidth/2, barY, barWidth, barHeight);
        
        // Draw inventory text
        ctx.fillStyle = '#333';
        ctx.font = `${this.calculateScaledSize(6, zoom)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(`${this.inventory}/${STORE_CONFIG.MAX_INVENTORY}`, screenX, barY + this.calculateScaledSize(10, zoom));
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.restockTimer -= deltaTime;
        
        if (this.restockTimer <= 0) {
            this.restock();
            this.restockTimer = STORE_CONFIG.RESTOCK_INTERVAL;
        }
    }

    restock() {
        if (this.inventory >= STORE_CONFIG.MAX_INVENTORY) return 0;
        
        const oldInventory = this.inventory;
        this.inventory = Math.min(
            STORE_CONFIG.MAX_INVENTORY,
            this.inventory + STORE_CONFIG.RESTOCK_AMOUNT
        );
        
        const amountAdded = this.inventory - oldInventory;
        this.lastRestockTime = Date.now();
        
        return amountAdded;
    }

    needsSupplies() {
        return this.inventory < STORE_CONFIG.LOW_STOCK_THRESHOLD;
    }
}