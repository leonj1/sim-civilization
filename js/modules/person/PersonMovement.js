import { terrain, COLORS } from '../constants.js';

export class PersonMovement {
    setNewTarget() {
        if (this.age < 10 && this.home) {
            this.targetX = this.home.x;
            this.targetY = this.home.y;
            return;
        }

        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 200 + 50;
            const newX = this.x + Math.cos(angle) * distance;
            const newY = this.y + Math.sin(angle) * distance;

            if (this.isValidPosition(newX, newY)) {
                this.targetX = newX;
                this.targetY = newY;
                return;
            }
            attempts++;
        }

        this.targetX = this.x;
        this.targetY = this.y;
    }

    isValidPosition(x, y) {
        const terrainX = Math.floor(x);
        const terrainY = Math.floor(y);
        
        // Check terrain boundaries if terrain is defined
        if (typeof terrain !== 'undefined' && terrain) {
            if (terrainY < 0 || terrainY >= terrain.length || 
                terrainX < 0 || terrainX >= terrain[0].length || 
                terrain[terrainY][terrainX] === COLORS.WATER) {
                return false;
            }
        }

        // Check town boundaries if town is defined
        if (this.town) {
            const distToTownCenter = Math.hypot(x - this.town.x, y - this.town.y);
            if (distToTownCenter > this.town.radius) {
                return false;
            }
        }

        return true;
    }

    distanceTo(point) {
        const dx = point.x - this.x;
        const dy = point.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    isOnScreen(offset, zoom, canvas) {
        const screenX = (this.x + offset.x) * zoom;
        const screenY = (this.y + offset.y) * zoom;
        return screenX >= -100 && screenX <= canvas.width + 100 && 
               screenY >= -100 && screenY <= canvas.height + 100;
    }
}
