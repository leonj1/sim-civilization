import { Store } from '../Store.js';
import { FOOD_BUILDING_CONFIG, STORE_COLORS } from '../constants.js';

export class Supermarket extends Store {
    constructor(x, y) {
        super(x, y);
        this.type = 'supermarket';
        this.inventory = FOOD_BUILDING_CONFIG.SUPERMARKET.MAX_INVENTORY;
        this.restockTimer = FOOD_BUILDING_CONFIG.SUPERMARKET.RESTOCK_INTERVAL;
        this.config = FOOD_BUILDING_CONFIG.SUPERMARKET;
        this.departments = ['produce', 'meat', 'dairy', 'bakery'];
    }

    draw(ctx, offset, zoom) {
        const { x: screenX, y: screenY } = this.calculateScreenPosition(offset, zoom);
        
        // Draw larger building
        ctx.fillStyle = STORE_COLORS.SUPERMARKET_WALL;
        const width = this.calculateScaledSize(60, zoom);
        const height = this.calculateScaledSize(45, zoom);
        ctx.fillRect(screenX - width/2, screenY - height/2, width, height);
        
        this.drawRoofAndDoor(ctx, screenX, screenY, zoom);
        
        // Draw "SUPERMARKET" text
        ctx.fillStyle = '#333';
        ctx.font = `${this.calculateScaledSize(8, zoom)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('SUPERMARKET', screenX, screenY);
        
        this.drawInventoryBar(ctx, screenX, screenY, zoom);
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (this.town) {
            this.town.resources.food += this.config.FOOD_PRODUCTION * deltaTime;
        }
    }
}
