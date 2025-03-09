import { OBJECT_POOL, currentGenerationNumber, offset, zoom, terrain, gameCanvas, towns } from './gameState.js';
import { generateULID, generateRandomName, randomInt, sample, debugLog } from './utils.js';
import { THOUGHTS, getThought } from './translations.js';
import { TRAITS, COLORS } from './constants.js';
import { Store } from './Buildings.js';

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

const OCCUPATION_WAGES = {
    'Farmer': 10,
    'Merchant': 15,
    'Teacher': 12,
    'Doctor': 20,
    'Builder': 18,
    'Guard': 14,
    'Priest': 10,
    'Artist': 15
};

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
        // Always generate a new ULID, even for pooled objects
        this.ulid = generateULID();
        
        // Basic properties
        this.x = x;
        this.y = y;
        this.gender = gender;
        this.name = generateRandomName(gender);
        
        // Age and lifecycle
        this.age = Math.floor(Math.random() * 6) + (gender === 'female' && Math.random() < 0.3 ? 8 : 15); // Younger age for some females
        this.maxAge = Math.random() * 30 + 70;
        
        // State flags
        this.isPlayingTag = false;
        this.isIt = false;
        this.isPlayingRPS = false;
        this.isMayor = false;
        
        // Relationship state
        this.partner = null;
        this.inRelation = false;
        this.relationTimer = 0;
        this.reproductionCooldown = 0;
        this.parent = null;
        this.motherPartner = null;
        this.fatherPartner = null;
        
        // Movement state
        this.moveTimer = 0;
        this.targetX = x;
        this.targetY = y;
        this.initialX = null;
        this.initialY = null;
        this.spinStartTime = null;
        
        // Location references
        this.home = null;
        this.town = null;
        this.following = null;
        
        // Occupation and work
        this.occupation = 'Child'; // Default to Child before updateOccupationBasedOnAge
        this.workTimer = 0;
        this.currentRoadTarget = null;
        this.bridgeProgress = 0;
        this.currentBridgeTarget = null;
        
        // Game state
        this.spawnTime = Date.now();
        this.generation = typeof currentGenerationNumber !== 'undefined' ? currentGenerationNumber : 0;
        this.rpsChoice = null;
        this.rpsResult = null;
        
        // Traits and characteristics
        this.traits = this.generateTraits();
        this.speedMultiplier = this.traits.has(TRAITS.FAST) ? 1.5 : 1.0;
        this.scale = this.traits.has(TRAITS.GIANT) ? 1.3 : 1.0;
        
        // Thought system
        this.currentThought = null;
        this.thoughtUpdateTimer = Math.random() * 5000 + 5000;
        
        // Initialize movement timer
        this.setNewMoveTimer();
        
        // Update occupation based on age (after town is set)
        this.updateOccupationBasedOnAge();
        
        // Generate initial thought after all state is set
        this.currentThought = this.generateThought();
        
        // Food-related state
        this.hunger = 0;
        this.inventory = new Map();
        this.lastMealTime = Date.now();
        this.lastParentFoodRequest = 0;  // Add tracking for last food request
        this.parentFoodRequestCooldown = 5000; // 5 seconds cooldown
    }

    /**
     * Updates occupation based on age and town membership
     * Called after town assignment or when age threshold is reached
     */
    updateOccupationBasedOnAge() {
        if (this.age < 13) {
            this.occupation = 'Child';
        } else {
            this.occupation = this.assignOccupation();
        }
    }

    /**
     * Assigns an occupation based on town needs and current distribution
     * @returns {string} The assigned occupation
     */
    assignOccupation() {
        // Safety check - if too young, always return Child
        if (this.age < 13) {
            return 'Child';
        }

        // If not in a town, assign random occupation
        if (!this.town || !this.town.population) {
            return sample(OCCUPATIONS);
        }

        // Get current occupation distribution
        const occupationCounts = new Map();
        this.town.population.forEach(person => {
            if (person.occupation !== 'Child') {
                occupationCounts.set(person.occupation, (occupationCounts.get(person.occupation) || 0) + 1);
            }
        });

        // For testing purposes, if there's a significant deficit in any occupation, assign that
        const missingOccupations = OCCUPATIONS.filter(occupation => !occupationCounts.has(occupation));
        if (missingOccupations.length > 0) {
            // Sort alphabetically for deterministic testing
            missingOccupations.sort();
            return missingOccupations[0];
        }

        // Calculate occupation needs
        const townNeeds = this.calculateTownNeeds(occupationCounts);
        
        // Sort by priority (highest first) and then by occupation name
        townNeeds.sort((a, b) => {
            if (a.priority === b.priority) {
                return a.occupation.localeCompare(b.occupation);
            }
            return b.priority - a.priority;
        });

        return townNeeds[0].occupation;
    }

    /**
     * Calculates town needs based on current occupation distribution
     * @param {Map<string, number>} occupationCounts - Current occupation counts
     * @returns {Array<{occupation: string, priority: number}>} Prioritized occupation needs
     * @private
     */
    calculateTownNeeds(occupationCounts) {
        const totalPopulation = this.town?.population?.length || 1;
        const needs = [];

        // Define ideal ratios for each occupation
        const idealRatios = {
            'Doctor': 0.1,     // 10% doctors (high priority)
            'Guard': 0.1,      // 10% guards
            'Builder': 0.15,   // 15% builders
            'Farmer': 0.2,     // 20% farmers
            'Merchant': 0.15,  // 15% merchants
            'Teacher': 0.1,    // 10% teachers
            'Priest': 0.1,     // 10% priests
            'Artist': 0.1      // 10% artists
        };

        // Calculate priority for each occupation
        for (const [occupation, idealRatio] of Object.entries(idealRatios)) {
            const currentCount = occupationCounts.get(occupation) || 0;
            const idealCount = Math.max(1, Math.ceil(totalPopulation * idealRatio));
            const deficit = Math.max(0, idealCount - currentCount);
            
            // Higher priority for occupations with no workers
            const priority = currentCount === 0 ? 1.0 : deficit / idealCount;
            
            needs.push({
                occupation,
                priority
            });
        }

        // Sort by priority (highest first) and then by occupation name
        return needs.sort((a, b) => {
            if (a.priority === b.priority) {
                return a.occupation.localeCompare(b.occupation);
            }
            return b.priority - a.priority;
        });
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

    findWorkplace() {
        if (!this.town) return null;

        switch (this.occupation) {
            case 'Doctor':
                return this.town.buildings.find(b => b.type === 'hospital');
            case 'Guard':
                return this.town.buildings.find(b => b.type === 'guardpost');
            case 'Builder':
                // Builders go to unfinished buildings or construction sites
                return this.town.buildings.find(b => !b.isComplete);
            case 'Farmer':
                return this.town.buildings.find(b => b.type === 'farm');
            case 'Merchant':
                return this.town.buildings.find(b => b.type === 'market');
            case 'Teacher':
                return this.town.buildings.find(b => b.type === 'school');
            case 'Priest':
                return this.town.buildings.find(b => b.type === 'temple');
            case 'Artist':
                return this.town.buildings.find(b => b.type === 'gallery');
            default:
                return null;
        }
    }

    updateWork(deltaTime) {
        if (!this.town || this.age < 18) return;

        this.workTimer -= deltaTime;
        
        if (this.workTimer <= 0) {
            const workplace = this.findWorkplace();
            
            if (workplace) {
                // Move to workplace
                this.targetX = workplace.x;
                this.targetY = workplace.y;
                
                // Only perform work action if close enough to workplace
                if (this.distanceTo(workplace) < 30) {
                    this.performOccupationAction();
                }
            } else {
                // Special handling for occupations that don't need fixed workplaces
                switch (this.occupation) {
                    case 'Guard':
                        this.handleGuardAction(); // Continue patrol
                        break;
                    case 'Builder':
                        this.findNewConstructionProject(); // Look for construction needs
                        break;
                }
            }
            
            // Set next work interval
            this.workTimer = randomInt(3000, 8000);
        }
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

        // Update work behavior
        this.updateWork(deltaTime);

        // Update hunger
        this.hunger += deltaTime * 0.01; // Increase hunger over time
        if (this.hunger >= 70) {
            this.findFood();
        }

        // Adjust parent food request cooldown based on hunger severity
        if (this.age < 13 && this.parent) {
            if (this.hunger > 90) {
                this.parentFoodRequestCooldown = 3000; // More frequent requests when very hungry
            } else if (this.hunger > 80) {
                this.parentFoodRequestCooldown = 4000;
            } else {
                this.parentFoodRequestCooldown = 5000; // Default cooldown
            }
        }
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

    /**
     * Calculates the Euclidean distance between this person and a target point
     * @param {Object} point - The target point with x and y coordinates
     * @returns {number} The distance between the points
     */
    distanceTo(point) {
        const dx = point.x - this.x;
        const dy = point.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    die() {
        // Remove from town population if in a town
        if (this.town) {
            const idx = this.town.population.indexOf(this);
            if (idx >= 0) {
                this.town.population.splice(idx, 1);
            }
        }

        // Clear all references before returning to pool
        this.clearReferences();
        
        // Release this person to the object pool
        const pool = OBJECT_POOL.people;
        if (pool.release) {
            return pool.release(this);
        } else if (Array.isArray(pool) && !pool.includes(this)) {
            // For array-based pool, add to the beginning so pop() gets it first
            pool.unshift(this);
            return true;
        }
        return false;
    }

    clearReferences() {
        // Clear relationship references
        this.partner = null;
        this.parent = null;
        this.motherPartner = null;
        this.fatherPartner = null;
        
        // Clear location references
        this.home = null;
        this.town = null;
        this.following = null;
        
        // Clear game state
        this.currentRoadTarget = null;
        this.currentBridgeTarget = null;
        this.currentThought = null;
        
        // Clear state flags
        this.isPlayingTag = false;
        this.isPlayingRPS = false;
        this.isIt = false;
        this.isMayor = false;
        this.inRelation = false;
    }

    updateRelation(deltaTime) {
        if (!this.partner) {
            this.inRelation = false;
            return;
        }

        // Update relationship timer
        this.relationTimer -= deltaTime;
        
        // Move towards partner
        const distance = this.distanceTo(this.partner);
        
        if (distance > 20) {
            // Move closer to partner with normalized 60fps timing
            const speed = 0.1 * this.speedMultiplier;
            const dx = this.partner.x - this.x;
            const dy = this.partner.y - this.y;
            this.x += (dx / distance) * speed * deltaTime / 16;
            this.y += (dy / distance) * speed * deltaTime / 16;
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

        // Base wage for this work action (smaller than hourly wage since this is per-action)
        const baseActionWage = (OCCUPATION_WAGES[this.occupation] || 0) * 0.1;
        let wageMultiplier = 1.0;
        let workSuccess = false;

        // Apply trait modifiers
        if (this.traits.has(TRAITS.WISE)) wageMultiplier *= 1.2;
        if (this.traits.has(TRAITS.FAST)) wageMultiplier *= 1.1;

        switch (this.occupation) {
            case 'Farmer': {
                const farm = this.findNearestFarm();
                if (farm) {
                    farm.productivity += this.traits.has(TRAITS.GREEN_THUMB) ? 0.2 : 0.1;
                    workSuccess = true;
                }
                break;
            }
            case 'Guard': {
                this.handleGuardAction();
                // Guards always get paid for patrolling
                workSuccess = true;
                break;
            }
            case 'Doctor': {
                const nearbyPeople = this.town.population.filter(p => 
                    p !== this && 
                    this.distanceTo(p) < 30 &&
                    p.age > p.maxAge * 0.8
                );
                if (nearbyPeople.length > 0) {
                    const patient = sample(nearbyPeople);
                    patient.maxAge += this.traits.has(TRAITS.WISE) ? 2 : 1;
                    workSuccess = true;
                    // Bonus for healing
                    wageMultiplier *= 1.5;
                }
                break;
            }
            case 'Merchant': {
                const markets = this.town.buildings.filter(b => b.type === 'market');
                if (markets.length > 0) {
                    const market = sample(markets);
                    this.targetX = market.x;
                    this.targetY = market.y;
                    workSuccess = true;
                    // Merchant wage varies based on market activity
                    wageMultiplier *= (market.customerCount || 1) * 0.1;
                }
                break;
            }
            case 'Teacher': {
                const students = this.town.population.filter(p => 
                    p !== this && 
                    p.age < 18 && 
                    this.distanceTo(p) < 40
                );
                if (students.length > 0) {
                    const student = sample(students);
                    if (Math.random() < 0.1 && this.traits.has(TRAITS.WISE)) {
                        const teachableTrait = sample(Object.values(TRAITS));
                        student.traits.add(teachableTrait);
                        // Bonus for successfully teaching a trait
                        wageMultiplier *= 2;
                    }
                    workSuccess = true;
                }
                break;
            }
            case 'Builder': {
                const unfinishedBuildings = this.town.buildings.filter(b => !b.isComplete);
                if (unfinishedBuildings.length > 0) {
                    const building = unfinishedBuildings[0];
                    building.progress += this.traits.has(TRAITS.STRONG) ? 0.2 : 0.1;
                    workSuccess = true;
                    // Bonus for completing a building
                    if (building.progress >= 1) wageMultiplier *= 2;
                }
                break;
            }
            case 'Priest': {
                const nearbyPeople = this.town.population.filter(p => 
                    p !== this && 
                    this.distanceTo(p) < 40
                );
                if (nearbyPeople.length > 0) {
                    // Increase town happiness
                    this.town.happiness += 0.1;
                    workSuccess = true;
                    // Wage scales with number of people helped
                    wageMultiplier *= Math.min(nearbyPeople.length * 0.1, 2);
                }
                break;
            }
            case 'Artist': {
                // Artists create value over time
                if (Math.random() < 0.3) { // 30% chance to create valuable art
                    workSuccess = true;
                    // Art value varies significantly
                    wageMultiplier *= Math.random() * 3;
                }
                break;
            }
        }

        // Pay wage if work was successful
        if (workSuccess) {
            const wage = baseActionWage * wageMultiplier;
            this.money += wage;
            this.lastPaycheck = wage;

            // Small chance for bonus based on exceptional performance
            if (Math.random() < 0.05) { // 5% chance
                const bonus = wage * (this.traits.has(TRAITS.LUCKY) ? 2 : 1);
                this.money += bonus;
            }
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
            this.bridgeProgress += this.traits.has(TRAITS.STRONG) ? 0.2 : 0.1;
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
            this.distanceTo(b) < 50
        );

        if (nearbyFarms.length > 0) {
            const farm = sample(nearbyFarms);
            this.targetX = farm.x;
            this.targetY = farm.y;
            // Increase farm productivity
            if (farm.productivity) {
                farm.productivity += this.traits.has(TRAITS.GREEN_THUMB) ? 0.2 : 0.1;
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
        const hospital = this.findWorkplace();
        if (!hospital) return;

        // Find patients near the hospital
        const nearbyPeople = this.town.population.filter(p => 
            p !== this && 
            p.distanceTo(hospital) < 40 &&
            p.age > p.maxAge * 0.8
        );

        if (nearbyPeople.length > 0) {
            const patient = sample(nearbyPeople);
            this.targetX = patient.x;
            this.targetY = patient.y;
            patient.maxAge += this.traits.has(TRAITS.WISE) ? 2 : 1;
        } else {
            // Return to hospital if no patients
            this.targetX = hospital.x;
            this.targetY = hospital.y;
        }
    }

    handleMerchantAction() {
        const market = this.findWorkplace();
        if (!market) return;

        // Stay at market during work hours
        this.targetX = market.x;
        this.targetY = market.y;

        // Update market activity
        if (this.distanceTo(market) < 10) {
            market.customerCount = (market.customerCount || 0) + 1;
        }
    }

    handleTeacherAction() {
        const school = this.findWorkplace();
        if (!school) return;

        // Find students near the school
        const students = this.town.population.filter(p => 
            p !== this && 
            p.age < 18 && 
            p.distanceTo(school) < 40
        );

        if (students.length > 0) {
            const student = sample(students);
            this.targetX = student.x;
            this.targetY = student.y;
            if (Math.random() < 0.1 && this.traits.has(TRAITS.WISE)) {
                const teachableTrait = sample(Object.values(TRAITS));
                student.traits.add(teachableTrait);
            }
        } else {
            // Return to school if no students
            this.targetX = school.x;
            this.targetY = school.y;
        }
    }

    handlePriestAction() {
        const temple = this.findWorkplace();
        if (!temple) return;

        // Alternate between temple and blessing nearby people
        if (Math.random() < 0.3 && this.distanceTo(temple) < 30) {
            this.blessNearbyPeople();
        } else {
            this.targetX = temple.x;
            this.targetY = temple.y;
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
            this.distanceTo(p) < 30
        );

        nearbyPeople.forEach(person => {
            person.currentThought = getThought('BLESSED');
            person.thoughtUpdateTimer = randomInt(5000, 10000);
        });
    }

    inspireNearbyPeople() {
        const nearbyPeople = this.town.population.filter(p => 
            p !== this && 
            this.distanceTo(p) < 30
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
            return this.distanceTo(town) <= town.radius * 1.2; // Allow joining if slightly outside
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
            return this.distanceTo(a) - this.distanceTo(b);
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

    // Add a method to get the ULID
    getULID() {
        return this.ulid;
    }

    /**
     * Finds the nearest bank in the person's town
     * @returns {Bank|null} The nearest bank or null if none found
     */
    findNearestBank() {
        if (!this.town || !this.town.buildings) return null;
        
        const banks = this.town.buildings.filter(b => b.type === 'bank');
        if (banks.length === 0) return null;
        
        // Find the closest bank
        let nearestBank = null;
        let minDistance = Infinity;
        
        for (const bank of banks) {
            const distance = this.distanceTo(bank);
            if (distance < minDistance) {
                minDistance = distance;
                nearestBank = bank;
            }
        }
        
        return nearestBank;
    }

    /**
     * Handles banking operations based on the person's money
     * @param {number} deltaTime - Time elapsed since last update
     */
    handleBanking(deltaTime) {
        // Skip if person doesn't have enough money to consider banking
        const BANKING_THRESHOLD = 100;
        if (!this.money || this.money < BANKING_THRESHOLD) return;
        
        // Initialize bankAccounts array if it doesn't exist
        if (!this.bankAccounts) {
            this.bankAccounts = [];
        }
        
        // Find nearest bank if we don't have a preferred bank
        if (!this.preferredBank) {
            this.preferredBank = this.findNearestBank();
            if (!this.preferredBank) return; // No banks available
        }
        
        // If not at the bank, move towards it
        const distanceToBank = this.distanceTo(this.preferredBank);
        if (distanceToBank > 10) {
            this.targetX = this.preferredBank.x;
            this.targetY = this.preferredBank.y;
            this.currentThought = 'Going to bank';
            return;
        }
        
        // At the bank, handle deposits
        if (this.bankAccounts.length === 0) {
            // Create a new checking account
            if (this.preferredBank.createAccount(this.ulid, 'checking', 0)) {
                this.bankAccounts.push(0); // Store the account index
                
                // Deposit money to reach the expected 100 balance
                const depositAmount = this.money - 100;
                if (depositAmount > 0) {
                    if (this.preferredBank.depositToAccount(this.ulid, 0, depositAmount)) {
                        this.money -= depositAmount;
                        this.currentThought = 'Opened bank account';
                    }
                }
            }
        } else {
            // Deposit to existing account
            const accountIndex = this.bankAccounts[0]; // Use first account
            const depositAmount = this.money - 100; // Deposit money to reach the expected 100 balance
            
            if (depositAmount > 0) {
                if (this.preferredBank.depositToAccount(this.ulid, accountIndex, depositAmount)) {
                    this.money -= depositAmount;
                    this.currentThought = 'Deposited savings';
                }
            }
        }
    }

    findFood() {
        // If not hungry enough, don't seek food
        if (this.hunger < 70) return false;

        // Check inventory first
        if (this.inventory.size > 0) {
            for (const [food, quantity] of this.inventory) {
                if (quantity > 0) {
                    // Consume food from inventory
                    this.inventory.set(food, quantity - 1);
                    if (this.inventory.get(food) === 0) {
                        this.inventory.delete(food);
                    }
                    
                    this.hunger = Math.max(0, this.hunger - 30);
                    this.happiness += 5;
                    this.currentThought = food === 'bread' ? 'Simple but filling' : 'HAPPY_FED';
                    return true;
                }
            }
        }

        // If we're a child, try to get food from parent
        if (this.age < 13 && this.parent) {
            const currentTime = Date.now();
            
            // Check if we're still in cooldown from last request
            if (currentTime - this.lastParentFoodRequest < this.parentFoodRequestCooldown) {
                // Move towards parent while waiting
                this.targetX = this.parent.x;
                this.targetY = this.parent.y;
                return false;
            }

            const parentDistance = Math.hypot(this.x - this.parent.x, this.y - this.parent.y);
            
            // Move towards parent
            this.targetX = this.parent.x;
            this.targetY = this.parent.y;
            
            if (parentDistance < 20) {
                // Request food from parent
                if (this.parent.inventory.size > 0 || this.parent.money >= 10) {
                    // Parent has resources to help
                    if (this.parent.inventory.size > 0) {
                        // Transfer food from parent's inventory
                        const [food, quantity] = this.parent.inventory.entries().next().value;
                        this.parent.inventory.set(food, quantity - 1);
                        if (this.parent.inventory.get(food) <= 0) {
                            this.parent.inventory.delete(food);
                        }
                        this.inventory.set(food, (this.inventory.get(food) || 0) + 1);
                    } else {
                        // Parent spends money to feed child
                        this.parent.money -= 10;
                    }
                    
                    this.hunger = Math.max(0, this.hunger - 40);
                    this.happiness += 10;
                    this.currentThought = 'HAPPY_FED';
                    this.lastParentFoodRequest = currentTime;
                    return true;
                } else {
                    // Parent can't help, set longer cooldown
                    this.lastParentFoodRequest = currentTime;
                    this.parentFoodRequestCooldown = 15000; // Longer cooldown when parent can't help
                    this.currentThought = 'HUNGRY';
                    
                    // Make parent aware of child's hunger
                    this.parent.currentThought = 'WORRIED_ABOUT_CHILD';
                }
            }
            return false;
        }

        // Try to buy food if we have money
        if (this.money >= 10) {
            const store = this.findNearestStore();
            if (store) {
                // Move towards store
                this.targetX = store.x;
                this.targetY = store.y;
                
                // If close enough to store, purchase food
                if (Math.hypot(this.x - store.x, this.y - store.y) < 20) {
                    this.money -= 10;
                    this.hunger = Math.max(0, this.hunger - 40);
                    this.happiness += 10;
                    this.currentThought = 'HAPPY_FED';
                    return true;
                }
            }
        }

        // If no food and no money, seek work
        if (!this.occupation || this.occupation === 'Unemployed') {
            this.occupation = this.assignOccupation();
            this.currentThought = 'NEED_WORK';
            return false;
        }

        // If employed but hungry, work immediately
        if (this.occupation) {
            const workplace = this.findWorkplace();
            if (workplace) {
                this.targetX = workplace.x;
                this.targetY = workplace.y;
                this.currentThought = 'WORKING';
                // Work will generate money in updateWork method
                return true;
            }
        }

        return false;
    }

    findNearestStore() {
        if (!this.town || !this.town.buildings) return null;
        
        const stores = this.town.buildings.filter(building => building instanceof Store);
        if (stores.length === 0) return null;

        let nearestStore = null;
        let shortestDistance = Infinity;

        for (const store of stores) {
            const distance = Math.hypot(this.x - store.x, this.y - store.y);
            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearestStore = store;
            }
        }

        return nearestStore;
    }
}
