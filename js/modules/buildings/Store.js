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
        
        // Draw roof and other components...
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