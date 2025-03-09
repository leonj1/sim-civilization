import { PersonBase } from './PersonBase.js';
import { PersonMovement } from './PersonMovement.js';
import { PersonParenting } from './PersonParenting.js';

export class Person extends PersonBase {
    constructor(x, y, gender) {
        super(x, y, gender);
        
        // Copy all methods from PersonMovement prototype to Person instance
        const movementMethods = Object.getOwnPropertyNames(PersonMovement.prototype);
        for (const method of movementMethods) {
            if (method !== 'constructor') {
                this[method] = PersonMovement.prototype[method];
            }
        }
        
        // Copy all methods from PersonParenting prototype to Person instance
        const parentingMethods = Object.getOwnPropertyNames(PersonParenting.prototype);
        for (const method of parentingMethods) {
            if (method !== 'constructor') {
                this[method] = PersonParenting.prototype[method];
            }
        }
    }

    // Main update loop
    update(deltaTime) {
        if (this.children && this.children.length > 0) {
            for (const child of this.children) {
                if (child.hunger > 70 && Math.hypot(this.x - child.x, this.y - child.y) < 20) {
                    this.handleChildFoodRequest(child);
                }
            }
        }

        // Rest of update logic...
    }
}
