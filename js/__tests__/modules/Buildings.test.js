import { Building, Store, PublicBuilding, ResidentialBuilding, STORE_COLORS } from '../../modules/Buildings.js';
import { drawRoundedRect } from '../../modules/utils.js';

// Mock canvas context
const mockCtx = {
    _fillStyle: '',
    get fillStyle() { return this._fillStyle; },
    set fillStyle(value) {
        this._fillStyle = value;
        this.fillStyleHistory.push(value);
    },
    fillStyleHistory: [],
    strokeStyle: '',
    lineWidth: 0,
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    fillText: jest.fn(),
    measureText: jest.fn(() => ({ width: 100 })),
    font: '',
    textAlign: ''
};

// Mock utils
jest.mock('../../modules/utils.js', () => ({
    drawRoundedRect: jest.fn()
}));

describe('Building Classes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCtx._fillStyle = '';
        mockCtx.fillStyleHistory = [];
    });

    describe('Base Building', () => {
        const testCases = [
            {
                name: 'calculates screen position correctly',
                x: 100,
                y: 200,
                offset: { x: 10, y: 20 },
                zoom: 2,
                expected: { x: 220, y: 440 }
            },
            {
                name: 'calculates scaled size correctly',
                x: 0,
                y: 0,
                size: 30,
                zoom: 1.5,
                expectedSize: 45
            }
        ];

        test.each(testCases)('$name', ({ x, y, offset, zoom, size, expected, expectedSize }) => {
            const building = new Building(x, y);
            
            if (offset && zoom) {
                const pos = building.calculateScreenPosition(offset, zoom);
                expect(pos).toEqual(expected);
            }
            
            if (size && zoom) {
                const scaledSize = building.calculateScaledSize(size, zoom);
                expect(scaledSize).toBe(expectedSize);
            }
        });

        test('draws building with family name', () => {
            const building = new Building(100, 100);
            building.familyName = 'Test Family';
            building.draw(mockCtx, { x: 0, y: 0 }, 1);
            
            expect(mockCtx.fillRect).toHaveBeenCalled();
            expect(mockCtx.fillText).toHaveBeenCalledWith('Test Family', expect.any(Number), expect.any(Number));
        });
    });

    describe('Store', () => {
        const storeTestCases = [
            {
                name: 'initializes with correct default values',
                x: 50,
                y: 50,
                expectedInventory: 100,
                expectedType: 'store'
            },
            {
                name: 'restocks correctly when below max inventory',
                x: 50,
                y: 50,
                initialInventory: 90,
                restockAmount: 5,
                expectedInventory: 95
            },
            {
                name: 'does not exceed max inventory when restocking',
                x: 50,
                y: 50,
                initialInventory: 98,
                restockAmount: 5,
                expectedInventory: 100
            }
        ];

        test.each(storeTestCases)('$name', ({ x, y, expectedInventory, expectedType, initialInventory }) => {
            const store = new Store(x, y);
            
            if (initialInventory !== undefined) {
                store.inventory = initialInventory;
                store.restock();
                expect(store.inventory).toBe(expectedInventory);
            } else {
                expect(store.inventory).toBe(expectedInventory);
                if (expectedType) expect(store.type).toBe(expectedType);
            }
        });

        test('draws store with correct colors', () => {
            const store = new Store(100, 100);
            store.draw(mockCtx, { x: 0, y: 0 }, 1);
            
            // Verify that STORE_COLORS.WALL was used
            expect(mockCtx.fillStyleHistory).toContain(STORE_COLORS.WALL);
            expect(mockCtx.fillRect).toHaveBeenCalled();
        });

        test('updates inventory and restock timer', () => {
            const store = new Store(100, 100);
            const deltaTime = 6000;
            store.inventory = 50;
            
            store.update(deltaTime);
            
            expect(store.inventory).toBeGreaterThan(50);
        });
    });

    describe('PublicBuilding', () => {
        const publicBuildingTestCases = [
            {
                name: 'initializes school correctly',
                type: 'school',
                expectedCapacity: 30
            },
            {
                name: 'initializes playground correctly',
                type: 'playground',
                expectedCapacity: 15
            },
            {
                name: 'initializes mall correctly',
                type: 'mall',
                expectedCapacity: 50
            }
        ];

        test.each(publicBuildingTestCases)('$name', ({ type, expectedCapacity }) => {
            const building = new PublicBuilding(0, 0, type);
            expect(building.capacity).toBe(expectedCapacity);
            expect(building.type).toBe(type);
        });

        test('draws different building types correctly', () => {
            const types = ['school', 'playground', 'mall'];
            
            types.forEach(type => {
                mockCtx.fillStyleHistory = [];
                const building = new PublicBuilding(100, 100, type);
                building.draw(mockCtx, { x: 0, y: 0 }, 1);
                
                expect(mockCtx.fillRect).toHaveBeenCalled();
                expect(mockCtx.fillText).toHaveBeenCalled();
            });
        });
    });

    describe('ResidentialBuilding', () => {
        const residentialTestCases = [
            {
                name: 'initializes hotel with correct capacity range',
                type: 'hotel',
                minCapacity: 50,
                maxCapacity: 75
            },
            {
                name: 'initializes condo with correct capacity range',
                type: 'condo',
                minCapacity: 20,
                maxCapacity: 40
            },
            {
                name: 'initializes unknown type with default capacity',
                type: 'unknown',
                expectedCapacity: 20
            }
        ];

        test.each(residentialTestCases)('$name', ({ type, minCapacity, maxCapacity, expectedCapacity }) => {
            const building = new ResidentialBuilding(0, 0, type);
            
            if (expectedCapacity !== undefined) {
                expect(building.capacity).toBe(expectedCapacity);
            } else {
                expect(building.capacity).toBeGreaterThanOrEqual(minCapacity);
                expect(building.capacity).toBeLessThanOrEqual(maxCapacity);
                // Verify step size constraint
                const stepSize = type === 'hotel' ? 5 : type === 'condo' ? 5 : 1;
                expect(building.capacity % stepSize).toBe(0);
            }
        });

        test('draws residential building with correct style', () => {
            const building = new ResidentialBuilding(100, 100, 'hotel');
            building.draw(mockCtx, { x: 0, y: 0 }, 1);
            
            expect(mockCtx.fillRect).toHaveBeenCalled();
            // Verify that at least one color used was a hex color
            expect(mockCtx.fillStyleHistory.some(color => /#[0-9A-F]{6}/i.test(color))).toBe(true);
        });
    });
}); 