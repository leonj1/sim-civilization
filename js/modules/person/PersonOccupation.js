import { TRAITS, OCCUPATION_WAGES } from '../constants.js';
import { randomInt, sample } from '../utils.js';

export class PersonOccupation {
    updateOccupation(deltaTime) {
        if (this.age < 13 || this.occupation === 'Child' || 
            this.isPlayingTag || this.isPlayingRPS || this.inRelation) {
            return;
        }

        this.workTimer -= deltaTime;
        if (this.workTimer <= 0) {
            this.performOccupationAction();
            this.workTimer = randomInt(3000, 8000);
        }
    }

    performOccupationAction() {
        if (!this.town) return;

        const baseActionWage = (OCCUPATION_WAGES[this.occupation] || 0) * 0.1;
        let wageMultiplier = 1.0;
        let workSuccess = false;

        if (this.traits.has(TRAITS.WISE)) wageMultiplier *= 1.2;
        if (this.traits.has(TRAITS.FAST)) wageMultiplier *= 1.1;

        switch (this.occupation) {
            case 'Farmer':
                workSuccess = this.handleFarmerAction();
                break;
            case 'Guard':
                workSuccess = this.handleGuardAction();
                break;
            // ... other occupation handlers
        }

        if (workSuccess) {
            const wage = baseActionWage * wageMultiplier;
            this.money += wage;
            this.lastPaycheck = wage;

            if (Math.random() < 0.05) {
                const bonus = wage * (this.traits.has(TRAITS.LUCKY) ? 2 : 1);
                this.money += bonus;
            }
        }
    }

    /**
     * Handles the farmer's work action
     * @returns {boolean} True if work was successful
     */
    handleFarmerAction() {
        // Find nearest farm or create one if none exists
        const farm = this.findNearestFarm();
        if (!farm) {
            // No farm available
            this.currentThought = 'Need farmland...';
            return false;
        }

        // Move towards farm if not close enough
        if (Math.hypot(this.x - farm.x, this.y - farm.y) > 20) {
            this.targetX = farm.x;
            this.targetY = farm.y;
            this.currentThought = 'Going to farm';
            return false;
        }

        // Perform farming action
        const productionBonus = this.traits.has(TRAITS.GREEN_THUMB) ? 1.5 : 1.0;
        this.town.resources.food += 0.5 * productionBonus;
        this.currentThought = 'Tending crops';
        
        // Higher success chance with GREEN_THUMB trait
        return Math.random() < (this.traits.has(TRAITS.GREEN_THUMB) ? 0.9 : 0.7);
    }

    /**
     * Handles the guard's work action
     * @returns {boolean} True if work was successful
     */
    handleGuardAction() {
        if (!this.town) return false;

        // Guards patrol the town perimeter
        const patrolRadius = this.town.radius || 100;
        const angle = (Date.now() * 0.001) % (Math.PI * 2);
        
        // Calculate patrol position
        const targetX = this.town.x + Math.cos(angle) * patrolRadius;
        const targetY = this.town.y + Math.sin(angle) * patrolRadius;

        // Move towards patrol position
        if (Math.hypot(this.x - targetX, this.y - targetY) > 10) {
            this.targetX = targetX;
            this.targetY = targetY;
            this.currentThought = 'Patrolling';
            return false;
        }

        // Perform guard duty
        this.currentThought = 'Keeping watch';
        
        // Check for nearby threats (simplified)
        const nearbyPeople = this.town.population.filter(p => 
            p !== this && 
            Math.hypot(p.x - this.x, p.y - this.y) < 30
        );

        // Guards are more effective with STRONG trait
        const effectivenessBonus = this.traits.has(TRAITS.STRONG) ? 1.3 : 1.0;
        
        // Success rate increases with fewer nearby people (less crowded = easier to guard)
        const baseSuccessRate = 0.6;
        const crowdFactor = Math.max(0.1, 1 - (nearbyPeople.length * 0.05));
        
        return Math.random() < (baseSuccessRate * effectivenessBonus * crowdFactor);
    }

    /**
     * Finds the nearest farm building
     * @returns {Building|null} The nearest farm or null if none found
     */
    findNearestFarm() {
        if (!this.town || !this.town.buildings) return null;

        let nearestFarm = null;
        let minDistance = Infinity;

        for (const building of this.town.buildings) {
            if (building.type === 'farm') {
                const distance = Math.hypot(this.x - building.x, this.y - building.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestFarm = building;
                }
            }
        }

        return nearestFarm;
    }
}