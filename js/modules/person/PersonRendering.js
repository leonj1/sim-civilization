export class PersonRendering {
    draw(ctx, x, y, zoom) {
        this.drawStatusIndicators(ctx, x, y, zoom);
        if (this.currentThought) {
            this.drawThoughtBubble(ctx, x, y, zoom);
        }
    }

    drawStatusIndicators(ctx, x, y, zoom) {
        if (this.isPlayingTag) {
            ctx.beginPath();
            ctx.arc(x, y - 15 * zoom, 5 * zoom, 0, Math.PI * 2);
            ctx.fillStyle = this.isIt ? 'red' : 'yellow';
            ctx.fill();
        }

        if (this.isPlayingRPS && this.rpsChoice) {
            ctx.font = `${Math.floor(12 * zoom)}px Mojangles`;
            ctx.fillStyle = 'black';
            ctx.fillText(this.rpsChoice, x, y - 25 * zoom);
            if (this.rpsResult) {
                ctx.fillText(this.rpsResult, x, y - 40 * zoom);
            }
        }

        if (this.following) {
            ctx.strokeStyle = '#FFB6C1';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo((this.following.x + offset.x) * zoom, (this.following.y + offset.y) * zoom);
            ctx.stroke();
        }
    }

    drawThoughtBubble(ctx, x, y, zoom) {
        const padding = 10 * zoom;
        const bubbleWidth = 100 * zoom;
        const bubbleHeight = 30 * zoom;
        
        ctx.font = `${Math.floor(12 * zoom)}px Mojangles`;
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        
        // Draw bubble
        ctx.beginPath();
        ctx.roundRect(x - bubbleWidth / 2, y - bubbleHeight - 20 * zoom, 
                     bubbleWidth, bubbleHeight, 5 * zoom);
        ctx.fill();
        ctx.stroke();
        
        // Draw text
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.fillText(this.currentThought, x, y - bubbleHeight - 10 * zoom, 
                    bubbleWidth - padding * 2);
    }
}