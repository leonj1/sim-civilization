import { Person } from '../Person';
import { terrain, COLORS } from '../../constants';

describe('PersonMovement', () => {
    test('calculates distance correctly', () => {
        const person = new Person(0, 0, 'male');
        const target = { x: 3, y: 4 };
        expect(person.distanceTo(target)).toBe(5);
    });

    test('validates position within town boundaries', () => {
        const person = new Person(100, 100, 'male');
        person.town = { x: 100, y: 100, radius: 50 };
        
        expect(person.isValidPosition(120, 120)).toBeTruthy();
        expect(person.isValidPosition(200, 200)).toBeFalsy();
    });

    test('checks if person is on screen', () => {
        const person = new Person(100, 100, 'male');
        const canvas = { width: 800, height: 600 };
        const offset = { x: 0, y: 0 };
        const zoom = 1;
        
        expect(person.isOnScreen(offset, zoom, canvas)).toBeTruthy();
    });
});