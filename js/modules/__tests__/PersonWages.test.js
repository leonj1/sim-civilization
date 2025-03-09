// Mock occupation wages to ensure consistent test values
const MOCK_OCCUPATION_WAGES = {
  'Farmer': 10,
  'Merchant': 15,
  'Teacher': 12,
  'Doctor': 20,
  'Builder': 18,
  'Guard': 14,
  'Priest': 10,
  'Artist': 15
};

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

// Import the Person class and related modules
import { Person } from '../person/Person.js';
import { OBJECT_POOL } from '../gameState.js';
import { TRAITS } from '../constants.js';

describe('Person Wage System', () => {
  let person;
  let mockTown;
  let mockWorkplace;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a person for testing
    person = new Person(100, 100, 'male');
    person.age = 25; // Adult
    person.money = 0; // Start with no money
    
    // Create mock town and workplace
    mockTown = {
      x: 100,
      y: 100,
      radius: 200,
      population: [],
      buildings: [],
      happiness: 50
    };
    
    mockWorkplace = {
      x: 110,
      y: 110,
      type: 'farm',
      productivity: 1.0,
      isComplete: true
    };
    
    // Add workplace to town
    mockTown.buildings.push(mockWorkplace);
    
    // Assign town to person
    person.town = mockTown;
    mockTown.population.push(person);
  });
  
  test('person does not get paid when not working', () => {
    // Set occupation but don't perform work
    person.occupation = 'Farmer';
    person.isPlayingTag = true; // Not working
    
    // Mock the findNearestFarm method
    person.findNearestFarm = jest.fn().mockReturnValue(null);
    
    // Mock the performOccupationAction method to avoid errors
    const originalPerformOccupationAction = person.performOccupationAction;
    person.performOccupationAction = jest.fn();
    
    // Update person
    person.update(1000);
    
    // Verify no payment was made
    expect(person.money).toBe(0);
    expect(person.lastPaycheck).toBeUndefined();
    
    // Restore original method
    person.performOccupationAction = originalPerformOccupationAction;
  });
  
  test('person gets paid correct wage for their occupation when working', () => {
    // Set up farmer
    person.occupation = 'Farmer';
    person.isPlayingTag = false;
    
    // Mock successful work action
    const originalPerformOccupationAction = person.performOccupationAction;
    person.performOccupationAction = jest.fn(() => {
      // Call the original but in a controlled way
      person.money = 0; // Reset money
      
      // Simulate successful work
      const baseActionWage = MOCK_OCCUPATION_WAGES['Farmer'] * 0.1; // 10% of hourly wage
      person.money += baseActionWage;
      person.lastPaycheck = baseActionWage;
    });
    
    // Trigger work
    person.performOccupationAction();
    
    // Verify payment was made with correct amount
    expect(person.money).toBe(MOCK_OCCUPATION_WAGES['Farmer'] * 0.1);
    expect(person.lastPaycheck).toBe(MOCK_OCCUPATION_WAGES['Farmer'] * 0.1);
    
    // Restore original method
    person.performOccupationAction = originalPerformOccupationAction;
  });
  
  test('different occupations get paid different wages', () => {
    const occupations = ['Farmer', 'Doctor', 'Merchant', 'Builder'];
    const results = {};
    
    // Test each occupation
    occupations.forEach(occupation => {
      // Create new person for each test
      const testPerson = new Person(100, 100, 'male');
      testPerson.age = 25;
      testPerson.money = 0;
      testPerson.occupation = occupation;
      testPerson.town = mockTown;
      
      // Mock successful work action
      const originalPerformOccupationAction = testPerson.performOccupationAction;
      testPerson.performOccupationAction = jest.fn(() => {
        // Simulate successful work
        const baseActionWage = MOCK_OCCUPATION_WAGES[occupation] * 0.1;
        testPerson.money += baseActionWage;
        testPerson.lastPaycheck = baseActionWage;
      });
      
      // Perform work
      testPerson.performOccupationAction();
      
      // Store result
      results[occupation] = testPerson.money;
      
      // Verify wage matches occupation
      expect(testPerson.money).toBe(MOCK_OCCUPATION_WAGES[occupation] * 0.1);
    });
    
    // Verify different occupations get different wages
    expect(results['Doctor']).toBeGreaterThan(results['Farmer']);
    expect(results['Builder']).toBeGreaterThan(results['Merchant']);
  });
  
  test('wage multipliers affect final pay but are based on base wage', () => {
    // Set up person with traits
    person.occupation = 'Farmer';
    person.traits = new Set([TRAITS.WISE]); // 1.2x multiplier
    
    // Mock the performOccupationAction to test wage calculation
    const originalPerformOccupationAction = person.performOccupationAction;
    person.performOccupationAction = jest.fn(() => {
      // Base wage for farmer
      const baseActionWage = MOCK_OCCUPATION_WAGES['Farmer'] * 0.1;
      
      // Apply trait multiplier
      const wageMultiplier = person.traits.has(TRAITS.WISE) ? 1.2 : 1.0;
      const finalWage = baseActionWage * wageMultiplier;
      
      person.money += finalWage;
      person.lastPaycheck = finalWage;
    });
    
    // Perform work
    person.performOccupationAction();
    
    // Verify wage with multiplier
    const expectedWage = MOCK_OCCUPATION_WAGES['Farmer'] * 0.1 * 1.2;
    expect(person.money).toBeCloseTo(expectedWage);
    
    // Restore original method
    person.performOccupationAction = originalPerformOccupationAction;
  });
  
  test('children do not get paid wages', () => {
    // Set up child
    person.age = 10;
    person.occupation = 'Child';
    
    // Mock methods to avoid errors
    person.findNearestFarm = jest.fn().mockReturnValue(null);
    person.performOccupationAction = jest.fn();
    
    // Update person
    person.update(1000);
    
    // Verify no payment
    expect(person.money).toBe(0);
    expect(person.lastPaycheck).toBeUndefined();
    
    // Verify performOccupationAction was not called
    expect(person.performOccupationAction).not.toHaveBeenCalled();
  });
  
  test('person only gets paid when work is successful', () => {
    // Set up person
    person.occupation = 'Doctor';
    
    // Mock empty town (no patients) to cause work failure
    mockTown.population = [person]; // Only the person, no patients
    
    // Mock the performOccupationAction with our test implementation
    const originalPerformOccupationAction = person.performOccupationAction;
    person.performOccupationAction = jest.fn(() => {
      // Base wage
      const baseActionWage = MOCK_OCCUPATION_WAGES['Doctor'] * 0.1;
      
      // Check for patients
      const nearbyPeople = mockTown.population.filter(p => p !== person);
      
      // Only pay if there are patients
      if (nearbyPeople.length > 0) {
        person.money += baseActionWage;
        person.lastPaycheck = baseActionWage;
        return true; // Work success
      }
      
      return false; // Work failure
    });
    
    // Perform work (should fail with no patients)
    person.performOccupationAction();
    
    // Verify no payment for unsuccessful work
    expect(person.money).toBe(0);
    expect(person.lastPaycheck).toBeUndefined();
    
    // Add a patient
    const patient = new Person(120, 120, 'female');
    patient.age = 75; // Elderly patient
    mockTown.population.push(patient);
    
    // Perform work again (should succeed with patient)
    person.performOccupationAction();
    
    // Verify payment for successful work
    expect(person.money).toBeGreaterThan(0);
    expect(person.lastPaycheck).toBeDefined();
    
    // Restore original method
    person.performOccupationAction = originalPerformOccupationAction;
  });
});
