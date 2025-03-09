export class PersonParenting {
    handleChildFoodRequest(child) {
        // Initialize inventory if it doesn't exist
        if (!this.inventory) {
            this.inventory = new Map();
        }
        
        if (!child.inventory) {
            child.inventory = new Map();
        }
        
        if (this.inventory.size > 0) {
            const [food, quantity] = this.inventory.entries().next().value;
            this.inventory.set(food, quantity - 1);
            if (this.inventory.get(food) <= 0) {
                this.inventory.delete(food);
            }
            child.inventory.set(food, (child.inventory.get(food) || 0) + 1);
            child.hunger = Math.max(0, child.hunger - 40);
            child.happiness += 10;
            child.currentThought = 'HAPPY_FED';
            return true;
        }

        if (this.money >= 10) {
            const store = this.findNearestStore();
            if (store) {
                this.targetX = store.x;
                this.targetY = store.y;
                this.currentThought = 'GETTING_FOOD_FOR_CHILD';
                
                if (Math.hypot(this.x - store.x, this.y - store.y) < 20) {
                    this.money -= 10;
                    child.hunger = Math.max(0, child.hunger - 40);
                    child.happiness += 10;
                    child.currentThought = 'HAPPY_FED';
                    return true;
                }
                
                // Return here to prevent overriding the currentThought
                return false;
            }
        }

        if (!this.occupation || this.occupation === 'Unemployed') {
            this.occupation = this.assignOccupation();
            this.currentThought = 'MUST_WORK_FOR_CHILD';
            const workplace = this.findWorkplace();
            if (workplace) {
                this.targetX = workplace.x;
                this.targetY = workplace.y;
            }
        }

        if (child.hunger > 90) {
            this.happiness -= 10;
            this.currentThought = 'VERY_WORRIED_ABOUT_CHILD';
        } else {
            this.currentThought = 'WORRIED_ABOUT_CHILD';
        }

        return false;
    }
    
    findNearestStore() {
        if (!this.town || !this.town.buildings) {
            return null;
        }
        
        let nearestStore = null;
        let minDistance = Infinity;
        
        for (const building of this.town.buildings) {
            // Check for both 'store' type and Store constructor
            if (building.type === 'store' || building.constructor.name === 'Store') {
                const distance = Math.hypot(this.x - building.x, this.y - building.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestStore = building;
                }
            }
        }
        
        return nearestStore;
    }
    
    findWorkplace() {
        if (!this.town || !this.town.buildings) {
            return null;
        }
        
        // Simple implementation - find any building that could be a workplace
        for (const building of this.town.buildings) {
            if (building.type !== 'residential') {
                return building;
            }
        }
        
        return null;
    }
    
    assignOccupation() {
        // Default to a basic occupation if no specific logic
        return 'Worker';
    }
}
