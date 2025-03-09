import { PeopleListRenderer } from '../ui/PeopleListRenderer.js';

describe('PeopleListRenderer', () => {
    let renderer;
    let mockTranslations;

    beforeEach(() => {
        mockTranslations = {
            totalPop: 'Total Population',
            currentPop: 'Current Population',
            currentGen: 'Current Generation',
            inRelation: 'In a relationship',
            building: 'Building',
            paving: 'Paving road',
            following: 'Following',
            working: 'Working',
            delivering: 'Delivering goods',
            playing: 'Playing',
            walking: 'Walking',
            idle: 'Idle',
            age: 'Age',
            mayor: 'Mayor of',
            mayoress: 'Mayoress of',
            currently: 'Currently',
            works: 'Occupation',
            generation: 'Generation',
            mother: 'Mother',
            father: 'Father',
            citizen: 'Citizen of',
            unknown: 'Unknown',
            noTown: 'No town',
            unemployed: 'Unemployed',
            it: 'IT',
            playingTag: 'Playing tag'
        };
        renderer = new PeopleListRenderer(mockTranslations);
    });

    test('renderPopulationStats shows correct statistics', () => {
        const stats = renderer.renderPopulationStats([1, 2, 3], [1, 2], 5);
        expect(stats).toContain('Total Population: 3');
        expect(stats).toContain('Current Population: 2');
        expect(stats).toContain('Current Generation: 5');
    });

    test('getPersonActivity returns correct activity string', () => {
        const person = {
            inRelation: true,
            occupation: 'Cashier'
        };
        expect(renderer.getPersonActivity(person)).toBe('In a relationship');
        
        person.inRelation = false;
        expect(renderer.getPersonActivity(person)).toBe('Working');
    });

    test('renderPersonEntry includes all required person information', () => {
        const person = {
            name: 'John Doe',
            age: 25,
            generation: 1,
            occupation: 'Farmer',
            town: { name: 'Springfield' },
            traits: ['Kind', 'Smart']
        };

        const entry = renderer.renderPersonEntry(person);
        expect(entry).toContain('John Doe');
        expect(entry).toContain('Age: 25');
        expect(entry).toContain('Generation: 1');
        expect(entry).toContain('Farmer');
        expect(entry).toContain('Springfield');
        expect(entry).toContain('Kind, Smart');
    });

    describe('renderPeopleList', () => {
        // Table-driven test cases
        const testCases = [
            {
                name: 'should only show living people',
                allPeopleEver: [
                    { 
                        id: 1, 
                        name: 'Living 1',
                        age: 25,
                        generation: 1,
                        occupation: 'Farmer',
                        gender: 'male',
                        town: { name: 'Springfield' }
                    },
                    { 
                        id: 2, 
                        name: 'Living 2',
                        age: 30,
                        generation: 1,
                        occupation: 'Builder',
                        gender: 'female',
                        town: { name: 'Springfield' }
                    },
                    { 
                        id: 3, 
                        name: 'Deceased Person',
                        age: 80,
                        generation: 1,
                        occupation: 'Retired',
                        gender: 'male',
                        town: { name: 'Springfield' }
                    }
                ],
                livingPeople: [
                    { 
                        id: 1, 
                        name: 'Living 1',
                        age: 25,
                        generation: 1,
                        occupation: 'Farmer',
                        gender: 'male',
                        town: { name: 'Springfield' }
                    },
                    { 
                        id: 2, 
                        name: 'Living 2',
                        age: 30,
                        generation: 1,
                        occupation: 'Builder',
                        gender: 'female',
                        town: { name: 'Springfield' }
                    }
                ],
                generation: 1,
                shouldContain: ['Living 1', 'Living 2'],
                shouldNotContain: ['Deceased Person']
            },
            {
                name: 'should handle empty people list',
                allPeopleEver: [
                    { 
                        id: 1, 
                        name: 'Deceased Person 1',
                        age: 80,
                        generation: 1,
                        occupation: 'Retired',
                        gender: 'male',
                        town: { name: 'Springfield' }
                    },
                    { 
                        id: 2, 
                        name: 'Deceased Person 2',
                        age: 85,
                        generation: 1,
                        occupation: 'Retired',
                        gender: 'female',
                        town: { name: 'Springfield' }
                    }
                ],
                livingPeople: [],
                generation: 1,
                shouldContain: ['Total Population: 2', 'Current Population: 0'],
                shouldNotContain: ['Deceased Person 1', 'Deceased Person 2']
            },
            {
                name: 'should handle multiple generations',
                allPeopleEver: [
                    { 
                        id: 1, 
                        name: 'Gen 1 Person',
                        age: 60,
                        generation: 1,
                        occupation: 'Farmer',
                        gender: 'male',
                        town: { name: 'Springfield' }
                    },
                    { 
                        id: 2, 
                        name: 'Gen 2 Person',
                        age: 30,
                        generation: 2,
                        occupation: 'Builder',
                        gender: 'female',
                        town: { name: 'Springfield' }
                    },
                    { 
                        id: 3, 
                        name: 'Deceased Person',
                        age: 80,
                        generation: 1,
                        occupation: 'Retired',
                        gender: 'male',
                        town: { name: 'Springfield' }
                    }
                ],
                livingPeople: [
                    { 
                        id: 1, 
                        name: 'Gen 1 Person',
                        age: 60,
                        generation: 1,
                        occupation: 'Farmer',
                        gender: 'male',
                        town: { name: 'Springfield' }
                    },
                    { 
                        id: 2, 
                        name: 'Gen 2 Person',
                        age: 30,
                        generation: 2,
                        occupation: 'Builder',
                        gender: 'female',
                        town: { name: 'Springfield' }
                    }
                ],
                generation: 2,
                shouldContain: ['Gen 1 Person', 'Gen 2 Person', 'Current Generation: 2', 'Pioneers'],
                shouldNotContain: ['Deceased Person']
            }
        ];

        // Run each test case
        test.each(testCases)('$name', ({ allPeopleEver, livingPeople, generation, shouldContain, shouldNotContain }) => {
            const list = renderer.renderPeopleList(allPeopleEver, livingPeople, generation);
            
            // Check that the list contains all expected strings
            shouldContain.forEach(text => {
                expect(list).toContain(text);
            });
            
            // Check that the list does not contain any unexpected strings
            shouldNotContain.forEach(text => {
                expect(list).not.toContain(text);
            });
        });
    });
});
