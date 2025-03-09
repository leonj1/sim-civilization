import { Person } from '../Person';
import { Store } from '../../Buildings';

describe('PersonParenting', () => {
    let parent, child, store;

    beforeEach(() => {
        parent = new Person(100, 100, 'female');
        child = new Person(110, 110, 'male');
        store = new Store(200, 200);
        
        child.age = 10;
        child.hunger = 80; // Initialize hunger
        child.happiness = 50; // Initialize happiness
        child.parent = parent;
        parent.children = [child];
        
        // Ensure store has the correct type
        store.type = 'store';
        
        parent.town = {
            buildings: [store],
            population: [parent, child]
        };
    });

    test('gives food from inventory to hungry child', () => {
        parent.inventory = new Map([['bread', 2]]);
        
        const result = parent.handleChildFoodRequest(child);
        
        expect(result).toBeTruthy();
        expect(parent.inventory.get('bread')).toBe(1);
        expect(child.hunger).toBeLessThan(75);
    });

    test('seeks store when has money but no food', () => {
        parent.money = 20;
        
        const result = parent.handleChildFoodRequest(child);
        
        expect(parent.targetX).toBe(store.x);
        expect(parent.targetY).toBe(store.y);
        expect(parent.currentThought).toBe('GETTING_FOOD_FOR_CHILD');
    });
});
