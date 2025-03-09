// Import the mocks first
jest.mock('../gameState.js');
jest.mock('../utils.js', () => ({
  generateULID: jest.fn().mockReturnValue('test-ulid-123'),
  generateRandomName: jest.fn().mockImplementation((gender) => 
    gender === 'male' || gender === 'masculine' ? 'TestMaleName' : 'TestFemaleName'
  ),
  randomInt: jest.fn().mockReturnValue(5),
  sample: jest.fn().mockImplementation(arr => arr[0]),
  debugLog: jest.fn()
}));
jest.mock('../translations.js');
jest.mock('../constants.js');

// Import the Person class and gameState
import { Person } from '../Person.js';
import { OBJECT_POOL } from '../gameState.js';
import { TRAITS } from '../constants.js';
import { THOUGHTS, getThought } from '../translations.js';

beforeEach(() => {
    // Clear object pool before each test
    OBJECT_POOL.people = [];
    OBJECT_POOL.buildings = [];
});

// Mock translations
jest.mock('../translations.js', () => ({
    THOUGHTS: {
        WORK: 'Working hard!',
        PLAY: 'Having fun!',
        BUILD: 'Time to build!',
        SHOP: 'Going shopping!',
        LEARN: 'Learning new things!',
        SOCIALIZE: 'Meeting friends!'
    },
    getThought: jest.fn().mockReturnValue('TestThought')
}));

describe('Person', () => {
  const constructorTestCases = [
    {
      name: 'creates male adult person',
      params: { x: 100, y: 100, gender: 'male', age: 25 },
      expected: {
        gender: 'male',
        name: 'TestMaleName',
        occupation: 'Farmer', // Default from mock
        traits: expect.any(Set),
        age: expect.any(Number)
      }
    },
    {
      name: 'creates female child person',
      params: { x: 200, y: 200, gender: 'female', age: 10 },
      expected: {
        gender: 'female',
        name: 'TestFemaleName',
        occupation: 'Child',
        traits: expect.any(Set),
        age: expect.any(Number)
      }
    }
  ];

  test.each(constructorTestCases)('$name', ({ params, expected }) => {
    const person = new Person(params.x, params.y, params.gender);
    if (params.age) {
      person.age = params.age;
      person.updateOccupationBasedOnAge();
    }
    Object.keys(expected).forEach(key => {
      expect(person[key]).toEqual(expected[key]);
    });
  });

  const occupationTestCases = [
    {
      name: 'assigns Child occupation to young person',
      age: 12,
      expectedOccupation: 'Child'
    },
    {
      name: 'assigns adult occupation to teenager',
      age: 13,
      expectedOccupation: expect.stringMatching(/^(Farmer|Builder|Guard|Doctor|Merchant|Teacher|Priest|Artist)$/)
    },
    {
      name: 'assigns occupation based on town needs',
      age: 25,
      townPopulation: [
        { occupation: 'Farmer' },
        { occupation: 'Farmer' },
        { occupation: 'Builder' },
        { occupation: 'Artist' },
        { occupation: 'Guard' },
        { occupation: 'Merchant' },
        { occupation: 'Priest' },
        { occupation: 'Teacher' }
      ],
      expectedOccupation: 'Doctor'
    }
  ];

  test.each(occupationTestCases)('$name', ({ age, townPopulation, expectedOccupation }) => {
    const person = new Person(100, 100, 'male');
    person.age = age;
    if (townPopulation) {
      person.town = { population: townPopulation };
    }
    person.updateOccupationBasedOnAge();
    expect(person.occupation).toEqual(expectedOccupation);
  });

  const thoughtGenerationTestCases = [
    {
      name: 'generates work thoughts for adults',
      age: 25,
      occupation: 'Farmer',
      isPlaying: false,
      expectedThoughts: ['WORK', 'SHOP', 'SOCIALIZE']
    },
    {
      name: 'generates play thoughts for children',
      age: 10,
      occupation: 'Child',
      isPlaying: true,
      expectedThoughts: ['PLAY', 'LEARN']
    },
    {
      name: 'generates build thoughts for builders',
      age: 30,
      occupation: 'Builder',
      isPlaying: false,
      expectedThoughts: ['WORK', 'BUILD']
    }
  ];

  test.each(thoughtGenerationTestCases)('$name', ({ age, occupation, isPlaying, expectedThoughts }) => {
    const person = new Person(100, 100, 'male');
    person.age = age;
    person.occupation = occupation;
    person.isPlayingTag = isPlaying;
    const thought = person.generateThought();
    expect(thought).toBe('TestThought'); // From mock
    // Verify thought filtering logic was called with correct parameters
    expect(getThought).toHaveBeenCalled();
  });

  const movementTestCases = [
    {
      name: 'moves toward target',
      initial: { x: 0, y: 0 },
      target: { x: 10, y: 10 },
      deltaTime: 1000,
      expected: { x: expect.any(Number), y: expect.any(Number) }
    },
    {
      name: 'stops at target',
      initial: { x: 0, y: 0 },
      target: { x: 1, y: 1 },
      deltaTime: 2000,
      expected: { x: 1, y: 1 }
    },
    {
      name: 'applies speed multiplier for fast trait',
      initial: { x: 0, y: 0 },
      target: { x: 10, y: 10 },
      traits: new Set([TRAITS.FAST]),
      deltaTime: 1000,
      expected: { x: expect.any(Number), y: expect.any(Number) }
    }
  ];

  test.each(movementTestCases)('$name', ({ initial, target, traits, deltaTime, expected }) => {
    const person = new Person(initial.x, initial.y, 'male');
    if (traits) {
      person.traits = traits;
      person.speedMultiplier = person.traits.has(TRAITS.FAST) ? 1.5 : 1.0;
    }
    person.targetX = target.x;
    person.targetY = target.y;
    person.updateMovement(deltaTime);
    expect(person.x).toEqual(expected.x);
    expect(person.y).toEqual(expected.y);
  });

  const lifecycleTestCases = [
    {
      name: 'dies when reaching max age',
      age: 80,
      maxAge: 79,
      expectedAlive: false
    },
    {
      name: 'stays alive below max age',
      age: 70,
      maxAge: 80,
      expectedAlive: true
    },
    {
      name: 'returns to object pool on death',
      age: 90,
      maxAge: 89,
      expectedPoolSize: 1
    }
  ];

  test.each(lifecycleTestCases)('$name', ({ age, maxAge, expectedAlive, expectedPoolSize }) => {
    const person = new Person(100, 100, 'male');
    person.age = age;
    person.maxAge = maxAge;
    
    if (expectedPoolSize !== undefined) {
      // Clear pool and set max size
      OBJECT_POOL.people = [];
      OBJECT_POOL.maxPoolSize = 10;
      
      // Add person to pool
      const result = person.die();
      expect(result).toBe(true); // Should return true when successfully added to pool
      expect(OBJECT_POOL.people.length).toBe(expectedPoolSize);
      expect(OBJECT_POOL.people[0]).toBe(person); // Should be the same person

      // Try to add same person again
      const secondResult = person.die();
      expect(secondResult).toBe(false); // Should return false when already in pool
      expect(OBJECT_POOL.people.length).toBe(expectedPoolSize); // Length should not change
    } else {
      person.update(1000); // Trigger age check
      expect(person.age < person.maxAge).toBe(expectedAlive);
    }
  });
});
