// Import the mocks first
jest.mock('../gameState.js');
jest.mock('../utils.js');
jest.mock('../translations.js');
jest.mock('../constants.js');

// Import the Person class
import { Person } from '../Person.js';

describe('Person', () => {
  let person;

  beforeEach(() => {
    // Create a new Person instance before each test
    person = new Person(100, 100, 'male');
  });

  test('should create a Person with correct initial properties', () => {
    expect(person).toBeDefined();
    expect(person.x).toBe(100);
    expect(person.y).toBe(100);
    expect(person.gender).toBe('male');
    expect(person.name).toBe('TestMaleName'); // From our mock
  });

  test('should assign occupation based on age', () => {
    // Test child occupation
    person.age = 10;
    person.updateOccupationBasedOnAge();
    expect(person.occupation).toBe('Child');

    // Test adult occupation
    person.age = 20;
    person.updateOccupationBasedOnAge();
    expect(person.occupation).not.toBe('Child');
  });

  test('should generate traits', () => {
    const traits = person.traits;
    expect(traits).toBeDefined();
    // Since our mock will return a predictable trait
    expect(traits instanceof Set).toBe(true);
  });

  test('should generate thoughts', () => {
    const thought = person.generateThought();
    expect(thought).toBeDefined();
    // Since we're mocking translations.js, we should expect a specific thought
    expect(thought).toBe('TestThought');
  });

  test('should update movement', () => {
    const initialX = person.x;
    const initialY = person.y;
    
    // Set a target position
    person.targetX = initialX + 10;
    person.targetY = initialY + 10;
    
    // Update movement with a large enough delta time to move the full distance
    person.updateMovement(1000);
    
    // Check if position has changed
    expect(person.x).not.toBe(initialX);
    expect(person.y).not.toBe(initialY);
  });

  test('should die and return to object pool', () => {
    // Import the object pool to check if the person is added back
    const { OBJECT_POOL } = require('../gameState.js');
    
    // Record initial pool size
    const initialPoolSize = OBJECT_POOL.people.length;
    
    // Call die method
    person.die();
    
    // Check if person was added to the pool
    expect(OBJECT_POOL.people.length).toBe(initialPoolSize + 1);
  });
});
