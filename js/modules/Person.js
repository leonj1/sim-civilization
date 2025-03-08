import { OBJECT_POOL, currentGenerationNumber, offset, zoom, terrain, gameCanvas } from './gameState.js';
import { generateRandomName, randomInt, sample } from './utils.js';
import { THOUGHTS, getThought } from './translations.js';
import { TRAITS, COLORS } from './constants.js';
import { debugLog } from './utils.js';

const OCCUPATIONS = [
    'Farmer',
    'Merchant',
    'Teacher',
    'Doctor',
    'Builder',
    'Guard',
    'Priest',
    'Artist'
];

export class Person {
    constructor(x, y, gender) {
        const pooledPerson = OBJECT_POOL.people.pop();
        if (pooledPerson) {
            Object.assign(this, pooledPerson);
            this.reset(x, y, gender);
            return;
        }
        this.reset(x, y, gender);
    }

    reset(x, y, gender) {
        this.x = x;
        this.y = y;
        this.gender = gender;
        this.name = generateRandomName(gender);
        this.partner = null;
        this.home = null;
        this.age = Math.floor(Math.random() * 6) + 15;
        this.isPlayingTag = false;
        this.isIt = false;
        this.inRelation = false;
        this.relationTimer = 0;
        this.moveTimer = 0;
        this.targetX = x;
        this.targetY = y;
        this.initialX = null;
        this.initialY = null;
        this.spinStartTime = null;
        this.maxAge = Math.random() * 30 + 70;
        this.occupation = this.age >= 13 ? this.assignOccupation() : 'Child';
        this.workTimer = 0;
        this.currentRoadTarget = null;
        this.bridgeProgress = 0;
        this.currentBridgeTarget = null;
        this.setNewMoveTimer();
        this.reproductionCooldown = 0;
        this.town = null;
        this.parent = null;
        this.motherPartner = null;
        this.fatherPartner = null;
        this.spawnTime = Date.now();
        this.following = null;
        this.generation = typeof currentGenerationNumber !== 'undefined' ? currentGenerationNumber : 0;
        this.isMayor = false;
        this.isPlayingRPS = false;
        this.rpsChoice = null;
        this.rpsResult = null;
        this.currentThought = this.generateThought();
        this.thoughtUpdateTimer = Math.random() * 5000 + 5000;
        this.traits = this.generateTraits();
        this.speedMultiplier = this.traits.includes(TRAITS.FAST) ? 1.5 : 1.0;
        this.scale = this.traits.includes(TRAITS.GIANT) ? 1.3 : 1.0;
    }

    assignOccupation() {
        // Weight occupations based on town needs and current distribution
        if (this.town) {
            const occupationCounts = new Map();
            this.town.people.forEach(person => {
                if (person.occupation !== 'Child') {
                    occupationCounts.set(person.occupation, (occupationCounts.get(person.occupation) || 0) + 1);
                }
            });

            // Prioritize underrepresented occupations
            const minCount = Math.min(...Array.from(occupationCounts.values(), count => count || 0));
            const neededOccupations = OCCUPATIONS.filter(occ => !occupationCounts.has(occ) || occupationCounts.get(occ) === minCount);
            
            if (neededOccupations.length > 0) {
                return sample(neededOccupations);
            }
        }
        
        return sample(OCCUPATIONS);
    }

    setNewMoveTimer() {
        this.moveTimer = randomInt(3000, 8000);
        this.targetX = this.x + randomInt(-100, 100);
        this.targetY = this.y + randomInt(-100, 100);
        
        // Keep within town boundaries if assigned to a town
        if (this.town) {
            const maxDistance = 180; // Town radius - some margin
            const dx = this.targetX - this.town.x;
            const dy = this.targetY - this.town.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > maxDistance) {
                const scale = maxDistance / distance;
                this.targetX = this.town.x + dx * scale;
                this.targetY = this.town.y + dy * scale;
            }
        }
    }

    generateThought() {
        const thoughts = [
            'HUNGRY', 'TIRED', 'HAPPY', 'SAD', 'WORK',
            'PLAY', 'SHOP', 'SOCIALIZE', 'LEARN', 'BUILD'
        ];
        
        // Weight thoughts based on current state
        const weightedThoughts = thoughts.filter(thought => {
            switch (thought) {
                case 'WORK':
                    return this.age >= 13 && !this.isPlayingTag && !this.isPlayingRPS;
                case 'PLAY':
                    return this.age < 18 || this.isPlayingTag || this.isPlayingRPS;
                case 'SHOP':
                    return this.age >= 15 && this.town && this.town.buildings.some(b => b.type === 'store');
                case 'BUILD':
                    return this.occupation === 'Builder';
                default:
                    return true;
            }
        });
        
        return getThought(sample(weightedThoughts));
    }

    generateTraits() {
        const traits = new Set();
        const traitList = Object.values(TRAITS);
        
        // Each person has a 20% chance for each trait
        traitList.forEach(trait => {
            if (Math.random() < 0.2) {
                traits.add(trait);
            }
        });
        
        return traits;
    }

    update(deltaTime) {
        // Skip update if off screen
        if (!this.isOnScreen(offset, zoom, gameCanvas)) return;

        // Update thought timer
        this.thoughtUpdateTimer -= deltaTime;
        if (this.thoughtUpdateTimer <= 0) {
            this.currentThought = this.generateThought();
            this.thoughtUpdateTimer = Math.random() * 5000 + 5000;
        }

        // Age update
        this.age += deltaTime / 10000;
        if (this.age >= this.maxAge) {
            this.die();
            return;
        }

        // Reproduction cooldown
        if (this.reproductionCooldown > 0) {
            this.reproductionCooldown -= deltaTime;
        }

        // Movement and behavior updates
        if (!this.inRelation) {
            this.moveTimer -= deltaTime;
            if (this.moveTimer <= 0) {
                this.setNewTarget();
                this.setNewMoveTimer();
            }
            this.updateMovement(deltaTime);
        }

        // Relationship updates
        if (this.inRelation) {
            this.updateRelation(deltaTime);
        }

        // Update occupation-specific behavior
        this.updateOccupation(deltaTime);

        // Update town membership
        this.updateTownMembership();
    }

    draw(ctx, offset, zoom) {
        const screenX = (this.x + offset.x) * zoom;
        const screenY = (this.y + offset.y) * zoom;
        
        // Draw person body
        ctx.save();
        if (this.scale !== 1) {
            ctx.translate(screenX, screenY);
            ctx.scale(this.scale, this.scale);
            ctx.translate(-screenX, -screenY);
        }

        const size = 8 * zoom;
        ctx.fillStyle = this.gender === 'male' ? '#2196F3' : '#E91E63';
        ctx.fillRect(screenX - size/2, screenY - size/2, size, size);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(screenX - size/2, screenY - size/2, size, size);

        // Draw mayor crown if applicable
        if (this.isMayor) {
            ctx.beginPath();
            ctx.moveTo(screenX - 8 * zoom, screenY - size/2 - 2 * zoom);
            ctx.lineTo(screenX, screenY - size/2 - 6 * zoom);
            ctx.lineTo(screenX + 8 * zoom, screenY - size/2 - 2 * zoom);
            ctx.fillStyle = 'gold';
            ctx.fill();
        }

        // Draw name and age if zoomed in enough
        if (zoom > 0.3) {
            ctx.fillStyle = 'black';
            ctx.font = `${Math.floor(10 * zoom)}px Mojangles`;
            ctx.textAlign = 'center';
            ctx.fillText(`${this.name} (${Math.floor(this.age)})`, screenX, screenY - 15 * zoom);
        }

        // Draw thought bubble if person has a current thought
        if (this.currentThought && zoom > 0.5) {
            this.drawThoughtBubble(ctx, screenX, screenY, zoom);
        }

        // Draw status indicators (tag, RPS, etc.)
        this.drawStatusIndicators(ctx, screenX, screenY, zoom);

        ctx.restore();
    }

    drawThoughtBubble(ctx, x, y, zoom) {
        const bubbleWidth = 100 * zoom;
        const bubbleHeight = 40 * zoom;
        const padding = 5 * zoom;

        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1 * zoom;

        // Draw bubble
        ctx.beginPath();
        ctx.roundRect(x - bubbleWidth/2, y - bubbleHeight - 30 * zoom, bubbleWidth, bubbleHeight, 5 * zoom);
        ctx.fill();
        ctx.stroke();

        // Draw thought text
        ctx.fillStyle = 'black';
        ctx.font = `${Math.floor(8 * zoom)}px Mojangles`;
        ctx.textAlign = 'center';
        ctx.fillText(this.currentThought, x, y - bubbleHeight - 10 * zoom, bubbleWidth - padding * 2);
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

        // If no valid position found, stay in place
        this.targetX = this.x;
        this.targetY = this.y;
    }

    isValidPosition(x, y) {
        // Check terrain bounds and type
        const terrainX = Math.floor(x);
        const terrainY = Math.floor(y);
        
        if (terrainY < 0 || terrainY >= terrain.length || 
            terrainX < 0 || terrainX >= terrain[0].length || 
            terrain[terrainY][terrainX] === COLORS.WATER) {
            return false;
        }

        // If in a town, check town boundaries
        if (this.town) {
            const distToTownCenter = Math.hypot(x - this.town.x, y - this.town.y);
            if (distToTownCenter > this.town.radius) {
                return false;
            }
        }

        return true;
    }

    isOnScreen(offset, zoom, canvas) {
        const screenX = (this.x + offset.x) * zoom;
        const screenY = (this.y + offset.y) * zoom;
        return screenX >= -100 && screenX <= canvas.width + 100 && 
               screenY >= -100 && screenY <= canvas.height + 100;
    }

    die() {
        // Clear partner references
        if (this.partner) {
            this.partner.partner = null;
        }

        // Remove from town if part of one
        if (this.town) {
            const idx = this.town.population.indexOf(this);
            if (idx > -1) {
                this.town.population.splice(idx, 1);
            }
        }

        // Return to object pool for reuse
        OBJECT_POOL.people.push(this);

        debugLog(`${this.name} has died at age ${Math.floor(this.age)}`, 'info');
    }
} 