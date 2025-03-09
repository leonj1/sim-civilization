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

    // ... other occupation-specific handlers
}