import { Store } from '../Store.js';
import { FOOD_BUILDING_CONFIG, STORE_COLORS } from '../constants.js';
import { drawRoundedRect } from '../../utils.js';

export class Restaurant extends Store {
    constructor(x, y) {
        super(x, y);
        this.type = 'restaurant';
        this.inventory = FOOD_BUILDING_CONFIG.RESTAURANT.MAX_INVENTORY;
        this.restockTimer = FOOD_BUILDING_CONFIG.RESTAURANT.RESTOCK_INTERVAL;
        this.config = FOOD_BUILDING_CONFIG.RESTAURANT;
        this.currentCustomers = 0;
        this.tables = Array(Math.floor(this.config.MAX_SEATS / 2)).fill(false); // 2 seats per table
        this.rating = 5; // 1-5 star rating
    }

    draw(ctx, offset, zoom) {
        const { x: screenX, y: screenY } = this.calculateScreenPosition(offset, zoom);
        
        // Draw upscale restaurant building
        ctx.fillStyle = STORE_COLORS.RESTAURANT_WALL;
        const width = this.calculateScaledSize(50, zoom);
        const height = this.calculateScaledSize(40, zoom);
        ctx.fillRect(screenX - width/2, screenY - height/2, width, height);
        
        // Draw fancy entrance
        ctx.fillStyle = STORE_COLORS.DOOR;
        const entranceWidth = this.calculateScaledSize(15, zoom);
        const entranceHeight = this.calculateScaledSize(20, zoom);
        drawRoundedRect(ctx, screenX - entranceWidth/2, screenY - entranceHeight/2, entranceWidth, entranceHeight, 3 * zoom);
        
        // Draw "RESTAURANT" text
        ctx.fillStyle = '#333';
        ctx.font = `${this.calculateScaledSize(8, zoom)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('RESTAURANT', screenX, screenY);
        
        // Draw star rating
        this.drawStarRating(ctx, screenX, screenY, zoom);
        
        this.drawInventoryBar(ctx, screenX, screenY, zoom);
    }

    drawStarRating(ctx, screenX, screenY, zoom) {
        const starSize = this.calculateScaledSize(5, zoom);
        const startX = screenX - (starSize * 5) / 2;
        
        ctx.fillStyle = '#FFD700'; // Gold color for stars
        for (let i = 0; i < this.rating; i++) {
            ctx.fillText('★', startX + (i * starSize), screenY + this.calculateScaledSize(15, zoom));
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (this.town) {
            this.town.resources.food += this.config.FOOD_PRODUCTION * deltaTime;
            // Occasionally update rating based on town happiness
            if (Math.random() < 0.01) {
                this.rating = Math.max(1, Math.min(5, Math.floor(this.town.happiness / 20)));
            }
        }
    }
}
