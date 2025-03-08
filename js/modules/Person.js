import { OBJECT_POOL, currentGenerationNumber, offset, zoom, terrain, gameCanvas, towns } from './gameState.js';
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

    /**
     * Assigns an occupation based on town needs and current distribution
     * @returns {string} The assigned occupation
     */
    assignOccupation() {
        // If not in a town, assign random occupation
        if (!this.town || !this.town.population) {
            return sample(OCCUPATIONS);
        }

        try {
            // Get current occupation distribution
            const occupationCounts = new Map();
            this.town.population.forEach(person => {
                if (person.occupation !== 'Child') {
                    occupationCounts.set(person.occupation, (occupationCounts.get(person.occupation) || 0) + 1);
                }
            });

            // Calculate occupation needs
            const townNeeds = this.calculateTownNeeds(occupationCounts);
            
            // If there are critical needs, fulfill them first
            const criticalNeeds = townNeeds.filter(need => need.priority > 0.8);
            if (criticalNeeds.length > 0) {
                return sample(criticalNeeds).occupation;
            }

            // Otherwise, weight by general needs
            const totalNeed = townNeeds.reduce((sum, need) => sum + need.priority, 0);
            let random = Math.random() * totalNeed;
            
            for (const need of townNeeds) {
                random -= need.priority;
                if (random <= 0) return need.occupation;
            }

            // Fallback to random occupation if something goes wrong
            return sample(OCCUPATIONS);
        } catch (error) {
            console.error('Error assigning occupation:', error);
            return sample(OCCUPATIONS);
        }
    }

    /**
     * Calculates town needs based on current occupation distribution
     * @param {Map<string, number>} occupationCounts - Current occupation counts
     * @returns {Array<{occupation: string, priority: number}>} Prioritized occupation needs
     * @private
     */
    calculateTownNeeds(occupationCounts) {
        const totalPopulation = this.town.population.length;
        const needs = [];

        // Define ideal ratios for each occupation
        const idealRatios = {
            'Farmer': 0.2,    // 20% should be farmers
            'Builder': 0.15,  // 15% builders
            'Guard': 0.1,     // 10% guards
            'Doctor': 0.1,    // 10% doctors
            'Merchant': 0.15, // 15% merchants
            'Teacher': 0.1,   // 10% teachers
            'Priest': 0.1,    // 10% priests
            'Artist': 0.1     // 10% artists
        };

        // Calculate priority for each occupation
        for (const [occupation, idealRatio] of Object.entries(idealRatios)) {
            const currentCount = occupationCounts.get(occupation) || 0;
            const idealCount = Math.ceil(totalPopulation * idealRatio);
            const deficit = Math.max(0, idealCount - currentCount);
            
            needs.push({
                occupation,
                priority: deficit / idealCount // Higher deficit = higher priority
            });
        }

        // Sort by priority (highest first)
        return needs.sort((a, b) => b.priority - a.priority);
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

    clearReferences() {
        // Clear relationship references
        this.partner = null;
        this.motherPartner = null;
        this.fatherPartner = null;
        this.parent = null;

        // Clear location references
        this.town = null;
        this.home = null;
        this.following = null;

        // Clear occupation-related references
        this.currentRoadTarget = null;
        this.currentBridgeTarget = null;
        this.currentArtLocation = null;

        // Clear game state
        this.traits = new Set();
        this.currentThought = null;
        this.rpsChoice = null;
        this.rpsResult = null;
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

        // Clear all references before returning to pool
        this.clearReferences();

        // Return to object pool for reuse
        OBJECT_POOL.people.push(this);

        debugLog(`${this.name} has died at age ${Math.floor(this.age)}`, 'info');
    }

    updateRelation(deltaTime) {
        if (!this.partner) {
            this.inRelation = false;
            return;
        }

        // Update relationship timer
        this.relationTimer -= deltaTime;
        
        // Move towards partner
        const dx = this.partner.x - this.x;
        const dy = this.partner.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 20) {
            // Move closer to partner with normalized 60fps timing
            const speed = 0.1 * this.speedMultiplier;
            this.x += (dx / distance) * speed * deltaTime / 16; // Normalize for 60fps
            this.y += (dy / distance) * speed * deltaTime / 16; // Normalize for 60fps
        }

        // Check if relationship should end
        if (this.relationTimer <= 0) {
            this.endRelationship();
        }
    }

    endRelationship() {
        this.inRelation = false;
        if (this.partner) {
            this.partner.inRelation = false;
            this.partner.partner = null;
            this.partner = null;
        }
        // Set cooldown to prevent immediate new relationship
        this.relationTimer = randomInt(5000, 10000);
    }

    updateOccupation(deltaTime) {
        // Skip if too young or already in another activity
        if (this.age < 13 || this.occupation === 'Child' || this.isPlayingTag || this.isPlayingRPS || this.inRelation) {
            return;
        }

        // Update work timer
        this.workTimer -= deltaTime;
        if (this.workTimer <= 0) {
            this.performOccupationAction();
            // Set next work interval
            this.workTimer = randomInt(3000, 8000);
        }
    }

    performOccupationAction() {
        if (!this.town) return; // Must be in a town to work

        switch (this.occupation) {
            case 'Builder':
                this.handleBuilderAction();
                break;
            case 'Farmer':
                this.handleFarmerAction();
                break;
            case 'Guard':
                this.handleGuardAction();
                break;
            case 'Doctor':
                this.handleDoctorAction();
                break;
            case 'Merchant':
                this.handleMerchantAction();
                break;
            case 'Teacher':
                this.handleTeacherAction();
                break;
            case 'Priest':
                this.handlePriestAction();
                break;
            case 'Artist':
                this.handleArtistAction();
                break;
        }
    }

    handleBuilderAction() {
        // Check for road or bridge construction needs
        if (this.currentRoadTarget) {
            // Continue road construction
            this.targetX = this.currentRoadTarget.x;
            this.targetY = this.currentRoadTarget.y;
        } else if (this.currentBridgeTarget) {
            // Continue bridge construction
            this.bridgeProgress += this.traits.includes(TRAITS.STRONG) ? 0.2 : 0.1;
            if (this.bridgeProgress >= 1) {
                this.completeBridgeConstruction();
            }
        } else {
            // Look for new construction project
            this.findNewConstructionProject();
        }
    }

    handleFarmerAction() {
        // Find or maintain farm plots
        const nearbyFarms = this.town.buildings.filter(b => 
            b.type === 'farm' && 
            Math.hypot(b.x - this.x, b.y - this.y) < 50
        );

        if (nearbyFarms.length > 0) {
            const farm = sample(nearbyFarms);
            this.targetX = farm.x;
            this.targetY = farm.y;
            // Increase farm productivity
            if (farm.productivity) {
                farm.productivity += this.traits.includes(TRAITS.GREEN_THUMB) ? 0.2 : 0.1;
            }
        }
    }

    handleGuardAction() {
        // Patrol town perimeter
        const angle = (Date.now() % 10000) / 10000 * Math.PI * 2;
        const radius = this.town.radius * 0.8;
        this.targetX = this.town.x + Math.cos(angle) * radius;
        this.targetY = this.town.y + Math.sin(angle) * radius;
    }

    handleDoctorAction() {
        // Find and heal injured or sick people
        const nearbyPeople = this.town.population.filter(p => 
            p !== this && 
            Math.hypot(p.x - this.x, p.y - this.y) < 30 &&
            p.age > p.maxAge * 0.8
        );

        if (nearbyPeople.length > 0) {
            const patient = sample(nearbyPeople);
            this.targetX = patient.x;
            this.targetY = patient.y;
            // Extend their lifespan slightly
            patient.maxAge += this.traits.includes(TRAITS.WISE) ? 2 : 1;
        }
    }

    handleMerchantAction() {
        // Move between market areas
        const markets = this.town.buildings.filter(b => b.type === 'market');
        if (markets.length > 0) {
            const market = sample(markets);
            this.targetX = market.x;
            this.targetY = market.y;
        }
    }

    handleTeacherAction() {
        // Find young people to teach
        const students = this.town.population.filter(p => 
            p !== this && 
            p.age < 18 && 
            Math.hypot(p.x - this.x, p.y - this.y) < 40
        );

        if (students.length > 0) {
            const student = sample(students);
            this.targetX = student.x;
            this.targetY = student.y;
            // Teaching might occasionally grant a trait
            if (Math.random() < 0.1 && this.traits.includes(TRAITS.WISE)) {
                const teachableTrait = sample(Object.values(TRAITS));
                student.traits.add(teachableTrait);
            }
        }
    }

    handlePriestAction() {
        // Move between temple and people
        const temples = this.town.buildings.filter(b => b.type === 'temple');
        if (temples.length > 0) {
            const temple = sample(temples);
            this.targetX = temple.x;
            this.targetY = temple.y;
            // Occasionally bless nearby people
            if (Math.random() < 0.2) {
                this.blessNearbyPeople();
            }
        }
    }

    handleArtistAction() {
        // Create art at different locations
        if (!this.currentArtLocation) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * (this.town.radius * 0.7);
            this.currentArtLocation = {
                x: this.town.x + Math.cos(angle) * distance,
                y: this.town.y + Math.sin(angle) * distance,
                timer: randomInt(5000, 10000)
            };
        }
        
        this.targetX = this.currentArtLocation.x;
        this.targetY = this.currentArtLocation.y;
        
        // Occasionally inspire nearby people
        if (Math.random() < 0.1) {
            this.inspireNearbyPeople();
        }
    }

    blessNearbyPeople() {
        const nearbyPeople = this.town.population.filter(p => 
            p !== this && 
            Math.hypot(p.x - this.x, p.y - this.y) < 30
        );

        nearbyPeople.forEach(person => {
            person.currentThought = getThought('BLESSED');
            person.thoughtUpdateTimer = randomInt(5000, 10000);
        });
    }

    inspireNearbyPeople() {
        const nearbyPeople = this.town.population.filter(p => 
            p !== this && 
            Math.hypot(p.x - this.x, p.y - this.y) < 30
        );

        nearbyPeople.forEach(person => {
            person.currentThought = getThought('INSPIRED');
            person.thoughtUpdateTimer = randomInt(5000, 10000);
        });
    }

    findNewConstructionProject() {
        // Look for areas needing roads or bridges
        // Implementation depends on town's road/bridge system
        // Placeholder for now
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * (this.town.radius * 0.7);
        this.targetX = this.town.x + Math.cos(angle) * distance;
        this.targetY = this.town.y + Math.sin(angle) * distance;
    }

    completeBridgeConstruction() {
        if (this.currentBridgeTarget) {
            // Add bridge to town's infrastructure
            // Implementation depends on town's bridge system
            this.currentBridgeTarget = null;
            this.bridgeProgress = 0;
        }
    }

    updateMovement(deltaTime) {
        if (this.targetX !== this.x || this.targetY !== this.y) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const speed = 0.1 * this.speedMultiplier * deltaTime / 16; // Normalize for 60fps
            
            if (distance > speed) {
                this.x += (dx / distance) * speed;
                this.y += (dy / distance) * speed;
            } else {
                this.x = this.targetX;
                this.y = this.targetY;
            }
        }
    }

    updateTownMembership() {
        // Skip if already in a town or too young
        if (this.town || this.age < 15) return;

        // Check for nearby towns
        const nearbyTowns = this.findNearbyTowns();
        if (!nearbyTowns.length) return;

        // Choose the closest town or one with fewest people
        const targetTown = this.selectBestTown(nearbyTowns);
        if (!targetTown) return;

        // Join the town
        this.joinTown(targetTown);
    }

    findNearbyTowns() {
        if (!towns || !towns.length) return [];
        
        return towns.filter(town => {
            if (!town || town.population.includes(this)) return false;
            
            const distance = Math.hypot(town.x - this.x, town.y - this.y);
            return distance <= town.radius * 1.2; // Allow joining if slightly outside
        });
    }

    selectBestTown(towns) {
        if (!towns.length) return null;
        
        // Prefer towns with fewer people
        towns.sort((a, b) => {
            // Primary sort by population size
            const popDiff = a.population.length - b.population.length;
            if (popDiff !== 0) return popDiff;
            
            // Secondary sort by distance
            const distA = Math.hypot(a.x - this.x, a.y - this.y);
            const distB = Math.hypot(b.x - this.x, b.y - this.y);
            return distA - distB;
        });

        return towns[0];
    }

    joinTown(town) {
        if (!town || this.town === town) return;

        // Leave current town if any
        if (this.town) {
            const idx = this.town.population.indexOf(this);
            if (idx > -1) {
                this.town.population.splice(idx, 1);
            }
        }

        // Join new town
        this.town = town;
        town.population.push(this);

        // Update occupation based on town needs
        if (this.age >= 13 && this.occupation !== 'Child') {
            this.occupation = this.assignOccupation();
        }

        // Set initial position within town
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * (town.radius * 0.7);
        this.targetX = town.x + Math.cos(angle) * distance;
        this.targetY = town.y + Math.sin(angle) * distance;

        debugLog(`${this.name} has joined ${town.name}`, 'info');
    }
} 