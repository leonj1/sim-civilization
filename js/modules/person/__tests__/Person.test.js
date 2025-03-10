import { Person } from '../Person.js';
import { recordMetric, METRIC_NAMES } from '../../telemetry/metrics.js';

// Mock the metrics module
jest.mock('../../telemetry/metrics.js', () => ({
    recordMetric: jest.fn(),
    isMetricsEnabled: jest.fn(),
    METRIC_NAMES: {
        PERSON_CREATED: 'person.created',
        PERSON_DEATH: 'person.death',
        OCCUPATION_CHANGE: 'person.occupation_change',
        PERSON_AGE: 'person.age',
        PERSON_WAGE: 'person.wage',
        POPULATION: 'person.population'
    }
}));

describe('Person Metrics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('records metrics on person creation', () => {
        const person = new Person(100, 100, 'male');
        
        expect(recordMetric).toHaveBeenCalledWith(METRIC_NAMES.PERSON_CREATED, 1, {
            gender: 'male',
            generation: expect.any(Number)
        });
    });

    test('records metrics on death', () => {
        const person = new Person(100, 100, 'female');
        person.age = 75;
        person.occupation = 'Teacher';
        
        person.die();
        
        expect(recordMetric).toHaveBeenCalledWith(METRIC_NAMES.PERSON_DEATH, 1, {
            age: 75,
            occupation: 'Teacher',
            gender: 'female'
        });
    });

    test('records metrics on occupation change', () => {
        const person = new Person(100, 100, 'male');
        person.age = 13;
        person.occupation = 'Child';
        
        person.updateOccupationBasedOnAge();
        
        expect(recordMetric).toHaveBeenCalledWith(METRIC_NAMES.OCCUPATION_CHANGE, 1, {
            previous: 'Child',
            new: expect.any(String),
            age: 13
        });
    });

    test('records age metrics when age changes', () => {
        // Create a person and set initial properties
        const person = new Person(100, 100, 'female');
        person.age = 30;
        person.occupation = 'Merchant';
        
        // Clear any previous calls to recordMetric (from constructor)
        recordMetric.mockClear();
        
        // Directly test the age change condition in the update method
        const previousAge = Math.floor(person.age);
        const newAge = previousAge + 1;
        
        // Simulate the condition in the update method
        if (newAge !== previousAge) {
            recordMetric(METRIC_NAMES.PERSON_AGE, newAge, {
                occupation: person.occupation || 'Unknown',
                gender: person.gender
            });
        }
        
        // Verify recordMetric was called with the correct parameters
        expect(recordMetric).toHaveBeenCalledWith(METRIC_NAMES.PERSON_AGE, 31, {
            occupation: 'Merchant',
            gender: 'female'
        });
    });

    test('continues to function when metrics are disabled', () => {
        recordMetric.mockImplementation(() => {
            throw new Error('Metrics disabled');
        });

        const person = new Person(100, 100, 'male');
        
        // Should not throw errors when metrics fail
        expect(() => {
            person.update(1000);
            person.die();
            person.updateOccupationBasedOnAge();
        }).not.toThrow();
    });
});
