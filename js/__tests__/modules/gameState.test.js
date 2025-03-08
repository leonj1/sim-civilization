import {
    initializeCanvas,
    setCurrentGeneration,
    setTerrain,
    updateOffset,
    updateZoom,
    currentGenerationNumber,
    terrain,
    offset,
    zoom,
    OBJECT_POOL,
    towns
} from '../../modules/gameState.js';

// Mock browser environment for canvas
global.HTMLCanvasElement = class HTMLCanvasElement {};
global.CanvasRenderingContext2D = class CanvasRenderingContext2D {};

describe('gameState module', () => {
    // Mock canvas and context
    let mockCanvas;
    let mockContext;

    beforeEach(() => {
        // Reset all mutable state by re-importing the module
        jest.resetModules();
        
        // Reset global state
        global.currentGenerationNumber = 0;
        global.terrain = null;
        global.offset = { x: 0, y: 0 };
        global.zoom = 1;

        // Setup canvas mocks
        mockCanvas = Object.create(HTMLCanvasElement.prototype);
        mockCanvas.getContext = jest.fn();
        
        mockContext = Object.create(CanvasRenderingContext2D.prototype);
        mockContext.clearRect = jest.fn();
        mockContext.fillRect = jest.fn();
    });

    describe('initializeCanvas', () => {
        describe('canvas validation', () => {
            test('should throw error for invalid canvas', () => {
                expect(() => initializeCanvas({}, mockContext)).toThrow('Valid canvas element required');
            });

            test('should throw error for null canvas', () => {
                expect(() => initializeCanvas(null, mockContext)).toThrow('Valid canvas element required');
            });
        });

        describe('context validation', () => {
            test('should throw error for invalid context', () => {
                expect(() => initializeCanvas(mockCanvas, {})).toThrow('Valid 2D rendering context required');
            });

            test('should throw error for null context', () => {
                expect(() => initializeCanvas(mockCanvas, null)).toThrow('Valid 2D rendering context required');
            });
        });

        test('should initialize with valid canvas and context', () => {
            const result = initializeCanvas(mockCanvas, mockContext);
            expect(result).toEqual({
                gameCanvas: mockCanvas,
                ctx: mockContext
            });
        });
    });

    describe('setCurrentGeneration', () => {
        const testCases = [
            {
                name: 'valid generation number',
                input: 5,
                expectError: false,
                expected: 5
            },
            {
                name: 'zero generation',
                input: 0,
                expectError: false,
                expected: 0
            },
            {
                name: 'negative generation',
                input: -1,
                expectError: true,
                errorMessage: 'Generation must be a non-negative number'
            },
            {
                name: 'invalid type',
                input: '5',
                expectError: true,
                errorMessage: 'Generation must be a non-negative number'
            }
        ];

        testCases.forEach(({ name, input, expectError, errorMessage, expected }) => {
            test(name, () => {
                if (expectError) {
                    expect(() => setCurrentGeneration(input)).toThrow(errorMessage);
                } else {
                    setCurrentGeneration(input);
                    expect(currentGenerationNumber).toBe(expected);
                }
            });
        });
    });

    describe('setTerrain', () => {
        const testCases = [
            {
                name: 'valid 2D terrain',
                input: [[1, 2], [3, 4]],
                expectError: false
            },
            {
                name: 'empty array',
                input: [],
                expectError: true,
                errorMessage: 'Terrain must be a 2D array'
            },
            {
                name: 'non-array input',
                input: 'invalid',
                expectError: true,
                errorMessage: 'Terrain must be a 2D array'
            },
            {
                name: '1D array',
                input: [1, 2, 3],
                expectError: true,
                errorMessage: 'Terrain must be a 2D array'
            }
        ];

        testCases.forEach(({ name, input, expectError, errorMessage }) => {
            test(name, () => {
                if (expectError) {
                    expect(() => setTerrain(input)).toThrow(errorMessage);
                } else {
                    setTerrain(input);
                    expect(terrain).toEqual(input);
                }
            });
        });
    });

    describe('updateOffset', () => {
        const testCases = [
            {
                name: 'valid offset update',
                x: 10,
                y: 20,
                expectError: false,
                expected: { x: 10, y: 20 }
            },
            {
                name: 'negative coordinates',
                x: -5,
                y: -10,
                expectError: false,
                expected: { x: -5, y: -10 }
            },
            {
                name: 'invalid x coordinate',
                x: '10',
                y: 20,
                expectError: true,
                errorMessage: 'Offset coordinates must be numbers'
            },
            {
                name: 'invalid y coordinate',
                x: 10,
                y: '20',
                expectError: true,
                errorMessage: 'Offset coordinates must be numbers'
            }
        ];

        testCases.forEach(({ name, x, y, expectError, errorMessage, expected }) => {
            test(name, () => {
                if (expectError) {
                    expect(() => updateOffset(x, y)).toThrow(errorMessage);
                } else {
                    updateOffset(x, y);
                    expect(offset).toEqual(expected);
                }
            });
        });
    });

    describe('updateZoom', () => {
        const testCases = [
            {
                name: 'valid zoom level',
                input: 2,
                expectError: false,
                expected: 2
            },
            {
                name: 'minimum zoom clamping',
                input: 0.05,
                expectError: false,
                expected: 0.1
            },
            {
                name: 'maximum zoom clamping',
                input: 15,
                expectError: false,
                expected: 10
            },
            {
                name: 'negative zoom',
                input: -1,
                expectError: true,
                errorMessage: 'Zoom must be a positive number'
            },
            {
                name: 'invalid type',
                input: '2',
                expectError: true,
                errorMessage: 'Zoom must be a positive number'
            }
        ];

        testCases.forEach(({ name, input, expectError, errorMessage, expected }) => {
            test(name, () => {
                if (expectError) {
                    expect(() => updateZoom(input)).toThrow(errorMessage);
                } else {
                    updateZoom(input);
                    expect(zoom).toBe(expected);
                }
            });
        });
    });

    describe('initial state', () => {
        test('default values are correctly set', () => {
            // Re-import the module to get fresh initial state
            jest.resetModules();
            const freshModule = require('../../modules/gameState.js');
            
            expect(freshModule.currentGenerationNumber).toBe(0);
            expect(freshModule.terrain).toBeNull();
            expect(freshModule.offset).toEqual({ x: 0, y: 0 });
            expect(freshModule.zoom).toBe(1);
            expect(freshModule.OBJECT_POOL).toEqual({ people: [] });
            expect(freshModule.towns).toEqual([]);
        });
    });
}); 