import { Store } from '../Store.js';
import { FOOD_BUILDING_CONFIG, STORE_COLORS } from '../constants.js';
import { drawRoundedRect } from '../../utils.js';

export class Diner extends Store {
    constructor(x, y) {
        super(x, y);
        this.type = 'diner';
        this.inventory = FOOD_BUILDING_CONFIG.DINER.MAX_INVENTORY;
        this.restockTimer = FOOD_BUILDING_CONFIG.DINER.RESTOCK_INTERVAL;
        this.config = FOOD_BUILDING_CONFIG.DINER;
        this.currentCustomers = 0;
        this.tables = Array(Math.floor(this.config.MAX_SEATS / 4)).fill(false); // 4 seats per table
    }

    draw(ctx, offset, zoom) {
        const { x: screenX, y: screenY } = this.calculateScreenPosition(offset, zoom);
        
        // Draw retro diner style building
        ctx.fillStyle = STORE_COLORS.DINER_WALL;
        const width = this.calculateScaledSize(40, zoom);
        const height = this.calculateScaledSize(30, zoom);
        
        // Draw rounded corners for retro look
        drawRoundedRect(ctx, screenX - width/2, screenY - height/2, width, height, 5 * zoom);
        
        // Draw "DINER" text
        ctx.fillStyle = '#333';
        ctx.font = `${this.calculateScaledSize(8, zoom)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('DINER', screenX, screenY);
        
        this.drawInventoryBar(ctx, screenX, screenY, zoom);
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (this.town) {
            this.town.resources.food += this.config.FOOD_PRODUCTION * deltaTime;
        }
    }
}
