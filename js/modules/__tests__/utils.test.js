import { 
    GENDER,
    generateRandomName,
    rgbToHex,
    hexToRgb,
    lerp,
    clamp,
    randomRange,
    randomInt,
    distance,
    manhattanDistance,
    shuffle,
    sample,
    formatTime,
    ObjectPool
} from '../utils.js';

describe('Utils Module', () => {
    describe('generateRandomName', () => {
        const testCases = [
            {
                name: 'generates masculine name',
                gender: GENDER.MASCULINE,
                validator: (result) => {
                    expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase());
                    expect(result.length).toBeGreaterThan(3);
                }
            },
            {
                name: 'generates feminine name',
                gender: GENDER.FEMININE,
                validator: (result) => {
                    expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase());
                    expect(result.length).toBeGreaterThan(3);
                }
            },
            {
                name: 'handles legacy male value',
                gender: 'male',
                validator: (result) => {
                    expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase());
                    expect(result.length).toBeGreaterThan(3);
                }
            },
            {
                name: 'handles legacy female value',
                gender: 'female',
                validator: (result) => {
                    expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase());
                    expect(result.length).toBeGreaterThan(3);
                }
            },
            {
                name: 'throws error for invalid gender',
                gender: 'invalid',
                expectError: true
            }
        ];

        test.each(testCases)('$name', ({ gender, validator, expectError }) => {
            if (expectError) {
                expect(() => generateRandomName(gender)).toThrow();
            } else {
                const result = generateRandomName(gender);
                validator(result);
            }
        });
    });

    describe('rgbToHex', () => {
        const testCases = [
            {
                name: 'converts black',
                r: 0, g: 0, b: 0,
                expected: '#000000'
            },
            {
                name: 'converts white',
                r: 255, g: 255, b: 255,
                expected: '#ffffff'
            },
            {
                name: 'converts red',
                r: 255, g: 0, b: 0,
                expected: '#ff0000'
            },
            {
                name: 'clamps values above 255',
                r: 300, g: 300, b: 300,
                expected: '#ffffff'
            },
            {
                name: 'clamps negative values',
                r: -10, g: -10, b: -10,
                expected: '#000000'
            }
        ];

        test.each(testCases)('$name', ({ r, g, b, expected }) => {
            expect(rgbToHex(r, g, b).toLowerCase()).toBe(expected);
        });
    });

    describe('hexToRgb', () => {
        const testCases = [
            {
                name: 'converts black',
                hex: '#000000',
                expected: { r: 0, g: 0, b: 0 }
            },
            {
                name: 'converts white',
                hex: '#FFFFFF',
                expected: { r: 255, g: 255, b: 255 }
            },
            {
                name: 'converts red',
                hex: '#FF0000',
                expected: { r: 255, g: 0, b: 0 }
            },
            {
                name: 'handles lowercase hex',
                hex: '#ff00ff',
                expected: { r: 255, g: 0, b: 255 }
            },
            {
                name: 'returns null for invalid hex',
                hex: 'invalid',
                expected: null
            }
        ];

        test.each(testCases)('$name', ({ hex, expected }) => {
            expect(hexToRgb(hex)).toEqual(expected);
        });
    });

    describe('lerp', () => {
        const testCases = [
            {
                name: 'interpolates at start',
                start: 0, end: 10, t: 0,
                expected: 0
            },
            {
                name: 'interpolates at end',
                start: 0, end: 10, t: 1,
                expected: 10
            },
            {
                name: 'interpolates at middle',
                start: 0, end: 10, t: 0.5,
                expected: 5
            },
            {
                name: 'handles negative numbers',
                start: -10, end: 10, t: 0.5,
                expected: 0
            }
        ];

        test.each(testCases)('$name', ({ start, end, t, expected }) => {
            expect(lerp(start, end, t)).toBe(expected);
        });
    });

    describe('clamp', () => {
        const testCases = [
            {
                name: 'clamps to minimum',
                value: -5, min: 0, max: 10,
                expected: 0
            },
            {
                name: 'clamps to maximum',
                value: 15, min: 0, max: 10,
                expected: 10
            },
            {
                name: 'returns value within range',
                value: 5, min: 0, max: 10,
                expected: 5
            }
        ];

        test.each(testCases)('$name', ({ value, min, max, expected }) => {
            expect(clamp(value, min, max)).toBe(expected);
        });
    });

    describe('randomInt', () => {
        const testCases = [
            {
                name: 'generates number within range',
                min: 1, max: 10,
                validator: (result) => {
                    expect(result).toBeGreaterThanOrEqual(1);
                    expect(result).toBeLessThanOrEqual(10);
                    expect(Number.isInteger(result)).toBe(true);
                }
            },
            {
                name: 'handles same min and max',
                min: 5, max: 5,
                expected: 5
            },
            {
                name: 'throws error when min > max',
                min: 10, max: 1,
                expectError: true
            }
        ];

        test.each(testCases)('$name', ({ min, max, validator, expected, expectError }) => {
            if (expectError) {
                expect(() => randomInt(min, max)).toThrow();
            } else if (validator) {
                const result = randomInt(min, max);
                validator(result);
            } else {
                expect(randomInt(min, max)).toBe(expected);
            }
        });
    });

    describe('distance', () => {
        const testCases = [
            {
                name: 'calculates zero distance',
                x1: 0, y1: 0, x2: 0, y2: 0,
                expected: 0
            },
            {
                name: 'calculates horizontal distance',
                x1: 0, y1: 0, x2: 3, y2: 0,
                expected: 3
            },
            {
                name: 'calculates vertical distance',
                x1: 0, y1: 0, x2: 0, y2: 4,
                expected: 4
            },
            {
                name: 'calculates diagonal distance',
                x1: 0, y1: 0, x2: 3, y2: 4,
                expected: 5
            }
        ];

        test.each(testCases)('$name', ({ x1, y1, x2, y2, expected }) => {
            expect(distance(x1, y1, x2, y2)).toBe(expected);
        });
    });

    describe('manhattanDistance', () => {
        const testCases = [
            {
                name: 'calculates zero distance',
                x1: 0, y1: 0, x2: 0, y2: 0,
                expected: 0
            },
            {
                name: 'calculates horizontal distance',
                x1: 0, y1: 0, x2: 3, y2: 0,
                expected: 3
            },
            {
                name: 'calculates vertical distance',
                x1: 0, y1: 0, x2: 0, y2: 4,
                expected: 4
            },
            {
                name: 'calculates total distance',
                x1: 0, y1: 0, x2: 3, y2: 4,
                expected: 7
            }
        ];

        test.each(testCases)('$name', ({ x1, y1, x2, y2, expected }) => {
            expect(manhattanDistance(x1, y1, x2, y2)).toBe(expected);
        });
    });

    describe('formatTime', () => {
        const testCases = [
            {
                name: 'formats seconds',
                ms: 45000,
                expected: '45s'
            },
            {
                name: 'formats minutes and seconds',
                ms: 125000,
                expected: '2m 5s'
            },
            {
                name: 'formats hours and minutes',
                ms: 7500000,
                expected: '2h 5m'
            },
            {
                name: 'formats days and hours',
                ms: 90000000,
                expected: '1d 1h'
            }
        ];

        test.each(testCases)('$name', ({ ms, expected }) => {
            expect(formatTime(ms)).toBe(expected);
        });
    });

    describe('ObjectPool', () => {
        const createFn = () => ({ value: Math.random() });
        let pool;

        beforeEach(() => {
            pool = new ObjectPool(createFn, 3);
        });

        const testCases = [
            {
                name: 'acquires new object',
                setup: () => {},
                action: (pool) => pool.acquire(),
                validator: (result) => {
                    expect(result).toBeTruthy();
                    expect(typeof result.value).toBe('number');
                }
            },
            {
                name: 'reuses released object',
                setup: (pool) => {
                    const obj = pool.acquire();
                    pool.release(obj);
                },
                action: (pool) => pool.acquire(),
                validator: (result) => {
                    expect(result).toBeTruthy();
                    expect(typeof result.value).toBe('number');
                }
            },
            {
                name: 'respects max size',
                setup: (pool) => {
                    pool.acquire();
                    pool.acquire();
                    pool.acquire();
                },
                action: (pool) => pool.acquire(),
                validator: (result) => {
                    expect(result).toBeNull();
                }
            }
        ];

        test.each(testCases)('$name', ({ setup, action, validator }) => {
            setup(pool);
            const result = action(pool);
            validator(result);
        });

        test('clear removes all objects', () => {
            const obj1 = pool.acquire();
            const obj2 = pool.acquire();
            pool.clear();
            expect(pool.acquire()).toBeTruthy();
            expect(pool.acquire()).toBeTruthy();
            expect(pool.acquire()).toBeTruthy();
            expect(pool.acquire()).toBeNull();
        });
    });
}); 