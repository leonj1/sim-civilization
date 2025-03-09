import { PersonBase } from '../PersonBase';
import { TRAITS } from '../../constants';

describe('PersonBase', () => {
    test('initializes with basic properties', () => {
        const person = new PersonBase(100, 100, 'male');
        
        expect(person.x).toBe(100);
        expect(person.y).toBe(100);
        expect(person.gender).toBe('male');
        expect(person.name).toBeTruthy();
        expect(person.traits).toBeInstanceOf(Set);
    });

    test('generates appropriate number of traits', () => {
        const person = new PersonBase(100, 100, 'female');
        expect(person.traits.size).toBeGreaterThanOrEqual(1);
        expect(person.traits.size).toBeLessThanOrEqual(3);
    });

    test('clears all references', () => {
        const person = new PersonBase(100, 100, 'male');
        person.partner = {};
        person.town = {};
        person.home = {};
        
        person.clearReferences();
        
        expect(person.partner).toBeNull();
        expect(person.town).toBeNull();
        expect(person.home).toBeNull();
    });
});