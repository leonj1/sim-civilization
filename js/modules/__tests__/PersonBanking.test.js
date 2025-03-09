import { Person } from '../person/Person.js';
import { Bank } from '../buildings/index.js';

describe('Person Banking Behavior', () => {
    let person;
    let bank;
    let mockTown;

    beforeEach(() => {
        person = new Person(100, 100, 'male');
        bank = new Bank(150, 150);
        
        mockTown = {
            buildings: [bank],
            x: 0,
            y: 0
        };
        
        person.town = mockTown;
        person.ulid = 'test123';
    });

    test('finds nearest bank', () => {
        const foundBank = person.findNearestBank();
        expect(foundBank).toBe(bank);
    });

    test('moves towards bank when having excess money', () => {
        person.money = 200;
        person.handleBanking(5000); // Force banking check
        
        expect(person.targetX).toBe(bank.x);
        expect(person.targetY).toBe(bank.y);
        expect(person.currentThought).toBe('Going to bank');
    });

    test('creates new account when at bank with excess money', () => {
        person.money = 200;
        person.x = bank.x;
        person.y = bank.y;
        person.preferredBank = bank;
        
        person.handleBanking(5000);
        
        expect(person.bankAccounts.length).toBe(1);
        expect(person.money).toBe(100);
        expect(bank.getAccountBalance(person.ulid, 0)).toBe(100);
        expect(person.currentThought).toBe('Opened bank account');
    });

    test('deposits into existing account', () => {
        person.money = 200;
        person.x = bank.x;
        person.y = bank.y;
        person.preferredBank = bank;
        person.bankAccounts = [0]; // Already has checking account
        bank.createAccount(person.ulid, 'checking', 0);
        
        person.handleBanking(5000);
        
        expect(person.money).toBe(100);
        expect(bank.getAccountBalance(person.ulid, 0)).toBe(100);
        expect(person.currentThought).toBe('Deposited savings');
    });

    test('ignores banking when money below threshold', () => {
        person.money = 90;
        const initialState = { ...person };
        
        person.handleBanking(5000);
        
        expect(person.targetX).toBe(initialState.targetX);
        expect(person.targetY).toBe(initialState.targetY);
        expect(person.bankAccounts).toEqual(initialState.bankAccounts);
    });
});
