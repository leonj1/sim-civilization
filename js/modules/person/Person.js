import { PersonBase } from './PersonBase.js';
import { PersonMovement } from './PersonMovement.js';
import { PersonParenting } from './PersonParenting.js';
import { PersonRendering } from './PersonRendering.js';
import { PersonOccupation } from './PersonOccupation.js';
import { recordMetric, METRIC_NAMES } from '../telemetry/metrics.js';

// Helper function for handling metrics errors with context
function handleMetricsError(error, metricName) {
    console.error(`Error recording metric '${metricName}':`, error);
}

// Helper function to record metrics with error handling
function recordPersonMetric(metricName, value, attributes = {}) {
    try {
        recordMetric(metricName, value, attributes);
    } catch (error) {
        handleMetricsError(error, metricName);
    }
}

export class Person extends PersonBase {
    constructor(x, y, gender) {
        super(x, y, gender);
        
        // Copy all methods from PersonMovement prototype to Person instance
        this.copyPrototypeMethods(PersonMovement.prototype);
        
        // Copy all methods from PersonParenting prototype to Person instance
        this.copyPrototypeMethods(PersonParenting.prototype);
        
        // Copy all methods from PersonRendering prototype to Person instance
        this.copyPrototypeMethods(PersonRendering.prototype);
        
        // Copy all methods from PersonOccupation prototype to Person instance
        this.copyPrototypeMethods(PersonOccupation.prototype);
        
        // Record metrics for person creation
        recordPersonMetric(METRIC_NAMES.PERSON_CREATED, 1, {
            gender: this.gender,
            generation: this.generation
        });
    }
    
    copyPrototypeMethods(prototype) {
        const methods = Object.getOwnPropertyNames(prototype);
        for (const method of methods) {
            if (method !== 'constructor') {
                this[method] = prototype[method];
            }
        }
    }

    update(deltaTime) {
        // Record age metrics only when age changes
        const previousAge = Math.floor(this.age);
        
        // Age update logic would happen here
        
        const newAge = Math.floor(this.age);
        if (newAge !== previousAge) {
            recordPersonMetric(METRIC_NAMES.PERSON_AGE, this.age, {
                occupation: this.occupation || 'Unknown',
                gender: this.gender
            });
        }
        
        if (this.children?.length > 0) {
            for (const child of this.children) {
                if (child.hunger > 70 && 
                    Math.hypot(this.x - child.x, this.y - child.y) < 20) {
                    this.handleChildFoodRequest(child);
                }
            }
        }

        this.updateOccupation(deltaTime);
        // ... other update logic
    }
    
    // Methods needed by tests
    updateOccupationBasedOnAge() {
        const previousOccupation = this.occupation;
        
        if (this.age < 13) {
            this.occupation = 'Child';
            return;
        }
        
        // For adults, assign occupation based on town needs
        if (!this.occupation || this.occupation === 'Child') {
            // Default adult occupations
            const adultOccupations = ['Farmer', 'Builder', 'Guard', 'Doctor', 'Merchant', 'Teacher', 'Priest', 'Artist'];
            
            // If town exists, check for occupation distribution
            if (this.town && this.town.population && this.town.population.length > 0) {
                // Count existing occupations
                const occupationCounts = {};
                for (const person of this.town.population) {
                    if (person.occupation) {
                        occupationCounts[person.occupation] = (occupationCounts[person.occupation] || 0) + 1;
                    }
                }
                
                // Find the least common occupation
                let leastCommonOccupation = adultOccupations[0];
                let minCount = Infinity;
                
                for (const occupation of adultOccupations) {
                    const count = occupationCounts[occupation] || 0;
                    if (count < minCount) {
                        minCount = count;
                        leastCommonOccupation = occupation;
                    }
                }
                
                this.occupation = leastCommonOccupation;
            } else {
                // No town, just assign Farmer as default
                this.occupation = 'Farmer';
            }
            
            // Record metrics for occupation change if occupation actually changed
            if (previousOccupation !== this.occupation) {
                recordPersonMetric(METRIC_NAMES.OCCUPATION_CHANGE, 1, {
                    previous: previousOccupation || 'None',
                    new: this.occupation,
                    age: this.age
                });
            }
        }
    }
    
    generateThought() {
        let thoughtType = 'general';
        
        if (this.age < 13 || this.isPlayingTag) {
            thoughtType = 'play';
        } else if (this.occupation === 'Builder') {
            thoughtType = 'build';
        } else if (this.occupation && this.occupation !== 'Unemployed') {
            thoughtType = 'work';
        }
        
        // Import and call getThought from translations
        const { getThought } = require('../translations.js');
        return getThought(thoughtType);
    }
    
    updateMovement(deltaTime) {
        if (this.targetX === undefined || this.targetY === undefined) {
            return;
        }
        
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If very close to target, snap to exact position
        if (distance < 1) {
            this.x = this.targetX;
            this.y = this.targetY;
            return;
        }
        
        let speed = 0.1;
        if (this.traits && this.traits.has('Fast')) {
            speed *= 1.5;
        }
        
        // Calculate movement based on speed and delta time
        const moveX = (dx / distance) * speed * deltaTime;
        const moveY = (dy / distance) * speed * deltaTime;
        
        // If movement would overshoot target, snap to target
        if (Math.abs(moveX) > Math.abs(dx) || Math.abs(moveY) > Math.abs(dy)) {
            this.x = this.targetX;
            this.y = this.targetY;
        } else {
            this.x += moveX;
            this.y += moveY;
        }
    }
    
    die() {
        // Record metrics for person death
        recordPersonMetric(METRIC_NAMES.PERSON_DEATH, 1, {
            age: this.age,
            occupation: this.occupation || 'Unknown',
            gender: this.gender
        });
        
        // Clear references
        this.town = null;
        this.parent = null;
        this.children = [];
        this.following = null;
        this.followers = [];
        
        // Add to object pool
        const { OBJECT_POOL } = require('../gameState.js');
        
        // Check if already in pool
        if (OBJECT_POOL.people.includes(this)) {
            return false;
        }
        
        // Add to pool if not full
        if (OBJECT_POOL.people.length < OBJECT_POOL.maxPoolSize) {
            OBJECT_POOL.people.push(this);
            return true;
        }
        
        return false;
    }
    
    // Banking methods
    findNearestBank() {
        if (!this.town || !this.town.buildings) {
            return null;
        }
        
        let nearestBank = null;
        let minDistance = Infinity;
        
        for (const building of this.town.buildings) {
            if (building.constructor.name === 'Bank') {
                const distance = Math.hypot(this.x - building.x, this.y - building.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestBank = building;
                }
            }
        }
        
        return nearestBank;
    }
    
    handleBanking(deltaTime) {
        if (this.money < 100) {
            return;
        }
        
        const bank = this.findNearestBank();
        if (!bank) {
            return;
        }
        
        this.targetX = bank.x;
        this.targetY = bank.y;
        this.currentThought = 'Going to bank';
        
        if (Math.hypot(this.x - bank.x, this.y - bank.y) < 10) {
            this.preferredBank = bank;
            
            if (!this.bankAccounts || this.bankAccounts.length === 0) {
                // Create a new account
                const accountCreated = bank.createAccount(this.ulid, 'checking', this.money / 2);
                if (accountCreated) {
                    this.bankAccounts = [0]; // First account has index 0
                    this.money -= this.money / 2;
                    this.currentThought = 'Opened bank account';
                }
            } else {
                // Deposit into existing account
                const depositAmount = this.money / 2;
                const depositSuccess = bank.depositToAccount(this.ulid, this.bankAccounts[0], depositAmount);
                if (depositSuccess) {
                    this.money -= depositAmount;
                    this.currentThought = 'Deposited savings';
                }
            }
        }
    }
}
