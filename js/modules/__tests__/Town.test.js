import { Town } from '../Town.js';
import { Building, Store, PublicBuilding, ResidentialBuilding } from '../Buildings.js';
import { jest } from '@jest/globals';

// Mock the gameState module
jest.mock('../gameState.js', () => ({
    OBJECT_POOL: {
        buildings: [],
        people: []
    },
    towns: []
}));

// Mock the utils module for deterministic name generation
jest.mock('../utils.js', () => ({
    generateRandomName: () => 'TestTown',
    randomInt: (min, max) => min
}));

describe('Town', () => {
    let town;

    beforeEach(() => {
        town = new Town(100, 200);
    });

    describe('constructor', () => {
        const testCases = [
            {
                name: 'initializes with correct coordinates',
                x: 100,
                y: 200,
                expectedX: 100,
                expectedY: 200
            },
            {
                name: 'initializes with zero coordinates',
                x: 0,
                y: 0,
                expectedX: 0,
                expectedY: 0
            },
            {
                name: 'initializes with negative coordinates',
                x: -100,
                y: -200,
                expectedX: -100,
                expectedY: -200
            }
        ];

        test.each(testCases)('$name', ({ x, y, expectedX, expectedY }) => {
            const town = new Town(x, y);
            expect(town.x).toBe(expectedX);
            expect(town.y).toBe(expectedY);
            expect(town.name).toBe('TestTown');
            expect(town.buildings).toEqual([]);
            expect(town.people).toEqual([]);
            expect(town.roads).toBeInstanceOf(Set);
            expect(town.roads.size).toBe(0);
            expect(town.mayor).toBeNull();
            expect(town.population).toBe(0);
            expect(town.happiness).toBe(100);
            expect(town.resources).toEqual({
                food: 100,
                water: 100,
                energy: 100
            });
        });
    });

    describe('updateResources', () => {
        const testCases = [
            {
                name: 'consumes resources based on population',
                population: 10,
                deltaTime: 1000,
                initialResources: { food: 100, water: 100, energy: 100 },
                expectedResources: { food: 90, water: 95, energy: 92.5 }
            },
            {
                name: 'does not allow resources to go below 0',
                population: 1000,
                deltaTime: 1000,
                initialResources: { food: 5, water: 3, energy: 2 },
                expectedResources: { food: 0, water: 0, energy: 0 }
            },
            {
                name: 'regenerates food from stores',
                population: 0,
                deltaTime: 1000,
                initialResources: { food: 90, water: 90, energy: 90 },
                stores: [{ inventory: 51 }],
                expectedResources: { food: 100, water: 90, energy: 90 }
            }
        ];

        test.each(testCases)('$name', ({ population, deltaTime, initialResources, expectedResources, stores = [] }) => {
            town.population = population;
            town.resources = { ...initialResources };
            
            if (stores.length > 0) {
                stores.forEach(storeData => {
                    const store = new Store(0, 0);
                    store.inventory = storeData.inventory;
                    town.addBuilding(store);
                });
            }

            town.updateResources(deltaTime);

            Object.entries(expectedResources).forEach(([resource, value]) => {
                expect(town.resources[resource]).toBeCloseTo(value, 1);
            });
        });
    });

    describe('updateHappiness', () => {
        const testCases = [
            {
                name: 'decreases happiness when resources are low',
                resources: { food: 30, water: 30, energy: 30 },
                buildings: 5,
                population: 10,
                deltaTime: 1000,
                initialHappiness: 100,
                expectedHappiness: 99.5
            },
            {
                name: 'increases happiness when resources are high',
                resources: { food: 90, water: 90, energy: 90 },
                buildings: 5,
                population: 10,
                deltaTime: 1000,
                initialHappiness: 50,
                expectedHappiness: 50.5
            },
            {
                name: 'decreases happiness with high population density',
                resources: { food: 50, water: 50, energy: 50 },
                buildings: 1,
                population: 20,
                deltaTime: 1000,
                initialHappiness: 75,
                expectedHappiness: 74.5
            }
        ];

        test.each(testCases)('$name', ({ resources, buildings, population, deltaTime, initialHappiness, expectedHappiness }) => {
            town.resources = { ...resources };
            town.population = population;
            town.happiness = initialHappiness;
            
            // Add dummy buildings
            for (let i = 0; i < buildings; i++) {
                town.addBuilding(new Building(0, 0));
            }

            town.updateHappiness(deltaTime);
            // Use a more reasonable precision for floating-point comparisons
            expect(Math.round(town.happiness * 10) / 10).toBe(expectedHappiness);
        });
    });

    describe('building management', () => {
        const testCases = [
            {
                name: 'adds and removes a building',
                operation: 'add-remove',
                buildingType: Building,
                expectedInitialCount: 1,
                expectedFinalCount: 0
            },
            {
                name: 'adds multiple buildings',
                operation: 'add-multiple',
                buildingType: Store,
                count: 3,
                expectedFinalCount: 3
            },
            {
                name: 'removes non-existent building',
                operation: 'remove-nonexistent',
                buildingType: PublicBuilding,
                expectedFinalCount: 0
            }
        ];

        test.each(testCases)('$name', ({ operation, buildingType, count = 1, expectedInitialCount, expectedFinalCount }) => {
            if (operation === 'add-remove') {
                const building = new buildingType(0, 0);
                town.addBuilding(building);
                expect(town.buildings.length).toBe(expectedInitialCount);
                expect(building.town).toBe(town);

                town.removeBuilding(building);
                expect(town.buildings.length).toBe(expectedFinalCount);
                expect(building.town).toBeNull();
            }
            else if (operation === 'add-multiple') {
                for (let i = 0; i < count; i++) {
                    town.addBuilding(new buildingType(i * 10, 0));
                }
                expect(town.buildings.length).toBe(expectedFinalCount);
            }
            else if (operation === 'remove-nonexistent') {
                const building = new buildingType(0, 0);
                town.removeBuilding(building);
                expect(town.buildings.length).toBe(expectedFinalCount);
            }
        });
    });

    describe('road management', () => {
        const testCases = [
            {
                name: 'adds and removes a road',
                operation: 'add-remove',
                road: { x1: 0, y1: 0, x2: 10, y2: 10 },
                expectedInitialCount: 1,
                expectedFinalCount: 0
            },
            {
                name: 'adds multiple roads',
                operation: 'add-multiple',
                roads: [
                    { x1: 0, y1: 0, x2: 10, y2: 10 },
                    { x1: 10, y1: 10, x2: 20, y2: 20 },
                    { x1: 20, y1: 20, x2: 30, y2: 30 }
                ],
                expectedFinalCount: 3
            },
            {
                name: 'removes non-existent road',
                operation: 'remove-nonexistent',
                road: { x1: 0, y1: 0, x2: 10, y2: 10 },
                expectedFinalCount: 0
            }
        ];

        test.each(testCases)('$name', ({ operation, road, roads, expectedInitialCount, expectedFinalCount }) => {
            if (operation === 'add-remove') {
                town.addRoad(road.x1, road.y1, road.x2, road.y2);
                expect(town.roads.size).toBe(expectedInitialCount);

                town.removeRoad(road.x1, road.y1, road.x2, road.y2);
                expect(town.roads.size).toBe(expectedFinalCount);
            }
            else if (operation === 'add-multiple') {
                roads.forEach(r => town.addRoad(r.x1, r.y1, r.x2, r.y2));
                expect(town.roads.size).toBe(expectedFinalCount);
            }
            else if (operation === 'remove-nonexistent') {
                town.removeRoad(road.x1, road.y1, road.x2, road.y2);
                expect(town.roads.size).toBe(expectedFinalCount);
            }
        });
    });

    describe('findNearestBuilding', () => {
        const testCases = [
            {
                name: 'finds nearest building of any type',
                buildings: [
                    { type: Building, x: 0, y: 0 },
                    { type: Store, x: 10, y: 10 },
                    { type: PublicBuilding, x: 20, y: 20 }
                ],
                searchPoint: { x: 5, y: 5 },
                searchType: null,
                expectedNearest: { x: 0, y: 0 }
            },
            {
                name: 'finds nearest building of specific type',
                buildings: [
                    { type: Building, x: 0, y: 0 },
                    { type: Store, x: 10, y: 10 },
                    { type: Store, x: 20, y: 20 }
                ],
                searchPoint: { x: 15, y: 15 },
                searchType: Store,
                expectedNearest: { x: 10, y: 10 }
            },
            {
                name: 'returns null when no buildings exist',
                buildings: [],
                searchPoint: { x: 0, y: 0 },
                searchType: null,
                expectedNearest: null
            }
        ];

        test.each(testCases)('$name', ({ buildings, searchPoint, searchType, expectedNearest }) => {
            buildings.forEach(b => {
                town.addBuilding(new b.type(b.x, b.y));
            });

            const nearest = town.findNearestBuilding(searchPoint.x, searchPoint.y, searchType);

            if (expectedNearest === null) {
                expect(nearest).toBeNull();
            } else {
                expect(nearest.x).toBe(expectedNearest.x);
                expect(nearest.y).toBe(expectedNearest.y);
            }
        });
    });
}); 