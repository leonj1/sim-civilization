import { Person } from '../Person.js';
import { recordMetric } from '../../telemetry/metrics.js';

// Mock the metrics module
jest.mock('../../telemetry/metrics.js', () => ({
    recordMetric: jest.fn(),
    isMetricsEnabled: jest.fn()
}));

describe('Person Metrics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('records metrics on person creation', () => {
        const person = new Person(100, 100, 'male');
        
        expect(recordMetric).toHaveBeenCalledWith('person.created', 1, {
            gender: 'male',
            generation: expect.any(Number)
        });
    });

    test('records metrics on death', () => {
        const person = new Person(100, 100, 'female');
        person.age = 75;
        person.occupation = 'Teacher';
        
        person.die();
        
        expect(recordMetric).toHaveBeenCalledWith('person.death', 1, {
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
        
        expect(recordMetric).toHaveBeenCalledWith('person.occupation_change', 1, {
            previous: 'Child',
            new: expect.any(String),
            age: 13
        });
    });

    test('records age metrics during update', () => {
        const person = new Person(100, 100, 'female');
        person.age = 30;
        person.occupation = 'Merchant';
        
        person.update(1000);
        
        expect(recordMetric).toHaveBeenCalledWith('person.age', 30, {
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
