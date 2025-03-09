import { Store } from '../Store.js';
import { STORE_COLORS, FOOD_BUILDING_CONFIG } from '../constants.js';

export class GroceryStore extends Store {
    constructor(x, y) {
        super(x, y);
        this.type = 'grocery';
        this.inventory = FOOD_BUILDING_CONFIG.GROCERY_STORE.MAX_INVENTORY;
        this.restockTimer = FOOD_BUILDING_CONFIG.GROCERY_STORE.RESTOCK_INTERVAL;
        this.config = FOOD_BUILDING_CONFIG.GROCERY_STORE;
    }

    draw(ctx, offset, zoom) {
        const { x: screenX, y: screenY } = this.calculateScreenPosition(offset, zoom);
        
        ctx.fillStyle = STORE_COLORS.GROCERY_WALL;
        const width = this.calculateScaledSize(45, zoom);
        const height = this.calculateScaledSize(35, zoom);
        ctx.fillRect(screenX - width/2, screenY - height/2, width, height);
        
        // Draw other components...
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (this.town) {
            this.town.resources.food += this.config.FOOD_PRODUCTION * deltaTime;
        }
    }
}