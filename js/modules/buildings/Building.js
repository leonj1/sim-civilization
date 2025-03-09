export class Building {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.hasRoad = false;
        this.town = null;
        this.familyName = null;
    }

    calculateScreenPosition(offset, zoom) {
        return {
            x: (this.x + offset.x) * zoom,
            y: (this.y + offset.y) * zoom
        };
    }

    calculateScaledSize(size, zoom) {
        return size * zoom;
    }

    draw(ctx, offset, zoom) {
        const { x: screenX, y: screenY } = this.calculateScreenPosition(offset, zoom);
        
        // Draw main building
        ctx.fillStyle = '#8B4513';
        const buildingSize = this.calculateScaledSize(30, zoom);
        ctx.fillRect(
            screenX - buildingSize/2,
            screenY - buildingSize/2,
            buildingSize,
            buildingSize
        );
        
        // Draw door
        ctx.fillStyle = '#4A2811';
        const doorSize = this.calculateScaledSize(10, zoom);
        ctx.fillRect(
            screenX - doorSize/2,
            screenY + this.calculateScaledSize(5, zoom),
            doorSize,
            doorSize
        );
        
        // Draw roof
        ctx.beginPath();
        const roofWidth = this.calculateScaledSize(40, zoom);
        const roofHeight = this.calculateScaledSize(15, zoom);
        ctx.moveTo(screenX - roofWidth/2, screenY - roofHeight);
        ctx.lineTo(screenX + roofWidth/2, screenY - roofHeight);
        ctx.lineTo(screenX, screenY - roofHeight * 2);
        ctx.closePath();
        ctx.fillStyle = '#654321';
        ctx.fill();

        if (this.familyName) {
            this.drawFamilyName(ctx, screenX, screenY, zoom);
        }
    }

    drawFamilyName(ctx, screenX, screenY, zoom) {
        const fontSize = this.calculateScaledSize(14, zoom);
        ctx.fillStyle = 'black';
        ctx.font = `bold ${fontSize}px Mojangles`;
        ctx.textAlign = 'center';
        ctx.fillText(this.familyName, screenX, screenY - this.calculateScaledSize(35, zoom));
        
        const nameWidth = ctx.measureText(this.familyName).width;
        const padding = this.calculateScaledSize(5, zoom);
        const boxHeight = this.calculateScaledSize(18, zoom);
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = this.calculateScaledSize(2, zoom);
        ctx.strokeRect(
            screenX - nameWidth/2 - padding,
            screenY - this.calculateScaledSize(48, zoom),
            nameWidth + padding * 2,
            boxHeight
        );
        
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(
            screenX - nameWidth/2 - padding,
            screenY - this.calculateScaledSize(48, zoom),
            nameWidth + padding * 2,
            boxHeight
        );
        
        ctx.fillStyle = '#333';
        ctx.fillText(this.familyName, screenX, screenY - this.calculateScaledSize(35, zoom));
    }

    update(deltaTime) {}
}