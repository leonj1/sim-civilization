import { 
    Building, 
    Store, 
    PublicBuilding, 
    ResidentialBuilding, 
    STORE_COLORS 
} from '../buildings/index.js';
import { drawRoundedRect } from '../utils.js';

// Mock canvas context
const mockCtx = {
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    fillText: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    measureText: jest.fn(() => ({ width: 100 }))
};

// Mock utils
jest.mock('../utils.js', () => ({
    drawRoundedRect: jest.fn()
}));

describe('Building Class', () => {
    const testCases = [
        {
            name: 'basic building creation',
            x: 100,
            y: 200,
            expectedX: 100,
            expectedY: 200
        },
        {
            name: 'building with negative coordinates',
            x: -50,
            y: -100,
            expectedX: -50,
            expectedY: -100
        }
    ];

    testCases.forEach(({ name, x, y, expectedX, expectedY }) => {
        test(name, () => {
            const building = new Building(x, y);
            expect(building.x).toBe(expectedX);
            expect(building.y).toBe(expectedY);
            expect(building.hasRoad).toBe(false);
            expect(building.town).toBeNull();
            expect(building.familyName).toBeNull();
        });
    });

    describe('calculateScreenPosition', () => {
        const positionTestCases = [
            {
                name: 'basic position calculation',
                x: 100,
                y: 100,
                offset: { x: 0, y: 0 },
                zoom: 1,
                expected: { x: 100, y: 100 }
            },
            {
                name: 'with offset and zoom',
                x: 100,
                y: 100,
                offset: { x: 10, y: 20 },
                zoom: 2,
                expected: { x: 220, y: 240 }
            }
        ];

        positionTestCases.forEach(({ name, x, y, offset, zoom, expected }) => {
            test(name, () => {
                const building = new Building(x, y);
                const position = building.calculateScreenPosition(offset, zoom);
                expect(position).toEqual(expected);
            });
        });
    });
});

describe('Store Class', () => {
    const storeTestCases = [
        {
            name: 'basic store creation',
            x: 100,
            y: 200,
            expectedInventory: 100,
            expectedType: 'store'
        },
        {
            name: 'store with negative coordinates',
            x: -50,
            y: -100,
            expectedInventory: 100,
            expectedType: 'store'
        }
    ];

    storeTestCases.forEach(({ name, x, y, expectedInventory, expectedType }) => {
        test(name, () => {
            const store = new Store(x, y);
            expect(store.inventory).toBe(expectedInventory);
            expect(store.type).toBe(expectedType);
            expect(store.owner).toBeNull();
            expect(store.employees).toEqual([]);
            expect(store.customers).toEqual([]);
        });
    });

    describe('restock', () => {
        const restockTestCases = [
            {
                name: 'restock from empty',
                initialInventory: 0,
                expectedAmount: 5,
                expectedInventory: 5
            },
            {
                name: 'restock near max',
                initialInventory: 98,
                expectedAmount: 2,
                expectedInventory: 100
            },
            {
                name: 'restock at max',
                initialInventory: 100,
                expectedAmount: 0,
                expectedInventory: 100
            }
        ];

        restockTestCases.forEach(({ name, initialInventory, expectedAmount, expectedInventory }) => {
            test(name, () => {
                const store = new Store(0, 0);
                store.inventory = initialInventory;
                const amountAdded = store.restock();
                expect(amountAdded).toBe(expectedAmount);
                expect(store.inventory).toBe(expectedInventory);
            });
        });
    });
});

describe('PublicBuilding Class', () => {
    const publicBuildingTestCases = [
        {
            name: 'school creation',
            x: 100,
            y: 200,
            type: 'school',
            expectedCapacity: 30
        },
        {
            name: 'playground creation',
            x: 100,
            y: 200,
            type: 'playground',
            expectedCapacity: 15
        },
        {
            name: 'mall creation',
            x: 100,
            y: 200,
            type: 'mall',
            expectedCapacity: 50
        },
        {
            name: 'unknown type creation',
            x: 100,
            y: 200,
            type: 'unknown',
            expectedCapacity: 20
        }
    ];

    publicBuildingTestCases.forEach(({ name, x, y, type, expectedCapacity }) => {
        test(name, () => {
            const building = new PublicBuilding(x, y, type);
            expect(building.type).toBe(type);
            expect(building.capacity).toBe(expectedCapacity);
            expect(building.occupants).toEqual([]);
        });
    });

    test('draw methods call context functions', () => {
        const building = new PublicBuilding(100, 100, 'school');
        building.draw(mockCtx, { x: 0, y: 0 }, 1);
        expect(mockCtx.fillRect).toHaveBeenCalled();
        expect(mockCtx.fillText).toHaveBeenCalled();
    });
});

describe('ResidentialBuilding Class', () => {
    const residentialTestCases = [
        {
            name: 'hotel creation',
            x: 100,
            y: 200,
            buildingType: 'hotel',
            minCapacity: 50,
            maxCapacity: 75
        },
        {
            name: 'condo creation',
            x: 100,
            y: 200,
            buildingType: 'condo',
            minCapacity: 20,
            maxCapacity: 40
        },
        {
            name: 'unknown type creation',
            x: 100,
            y: 200,
            buildingType: 'unknown',
            expectedCapacity: 20
        }
    ];

    residentialTestCases.forEach(({ name, x, y, buildingType, minCapacity, maxCapacity, expectedCapacity }) => {
        test(name, () => {
            const building = new ResidentialBuilding(x, y, buildingType);
            expect(building.type).toBe(buildingType);
            
            if (expectedCapacity) {
                expect(building.capacity).toBe(expectedCapacity);
            } else {
                expect(building.capacity).toBeGreaterThanOrEqual(minCapacity);
                expect(building.capacity).toBeLessThanOrEqual(maxCapacity);
                // Check if capacity is a multiple of step size (5)
                expect(building.capacity % 5).toBe(0);
            }
        });
    });

    test('draw method calls context functions', () => {
        const building = new ResidentialBuilding(100, 100, 'hotel');
        building.draw(mockCtx, { x: 0, y: 0 }, 1);
        expect(mockCtx.fillRect).toHaveBeenCalled();
        expect(mockCtx.fillText).toHaveBeenCalled();
    });
}); 
