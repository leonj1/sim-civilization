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
        
        // Test RPS game activity
        // Reset other properties that might take precedence
        person.inRelation = false;
        person.occupation = null;
        person.isPlayingRPS = true;
        person.rpsChoice = 'Rock';
        expect(renderer.getPersonActivity(person)).toBe('Chose Rock...');
        
        person.rpsResult = 'Win';
        expect(renderer.getPersonActivity(person)).toBe('Chose Rock. Win!');
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
    
    test('escapeHtml properly escapes HTML special characters', () => {
        const testCases = [
            { input: '<script>alert("XSS")</script>', expected: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;' },
            { input: "Let's use some <b>HTML</b>", expected: "Let&#039;s use some &lt;b&gt;HTML&lt;/b&gt;" },
            { input: 'A & B are friends', expected: 'A &amp; B are friends' },
            { input: null, expected: '' },
            { input: undefined, expected: '' }
        ];
        
        testCases.forEach(({ input, expected }) => {
            expect(renderer.escapeHtml(input)).toBe(expected);
        });
    });
    
    test('renderPersonEntry escapes all user-generated content', () => {
        const person = {
            name: '<script>alert("XSS in name")</script>',
            age: 25,
            generation: 1,
            occupation: '<script>alert("XSS in occupation")</script>',
            town: { name: '<script>alert("XSS in town")</script>' },
            motherPartner: { name: '<script>alert("XSS in mother")</script>' },
            fatherPartner: { name: '<script>alert("XSS in father")</script>' },
            currentThought: '<script>alert("XSS in thought")</script>',
            traits: ['<script>alert("XSS in trait")</script>'],
            following: { name: '<script>alert("XSS in following")</script>' },
            isPlayingRPS: true,
            rpsChoice: '<script>alert("XSS in choice")</script>',
            rpsResult: '<script>alert("XSS in result")</script>'
        };

        const entry = renderer.renderPersonEntry(person);
        
        // Check that none of the raw script tags are present
        expect(entry).not.toContain('<script>');
        expect(entry).not.toContain('</script>');
        
        // Check that escaped versions are present for each field
        expect(entry).toContain('&lt;script&gt;alert(&quot;XSS in name&quot;)&lt;/script&gt;');
        expect(entry).toContain('&lt;script&gt;alert(&quot;XSS in occupation&quot;)&lt;/script&gt;');
        expect(entry).toContain('&lt;script&gt;alert(&quot;XSS in town&quot;)&lt;/script&gt;');
        expect(entry).toContain('&lt;script&gt;alert(&quot;XSS in mother&quot;)&lt;/script&gt;');
        expect(entry).toContain('&lt;script&gt;alert(&quot;XSS in father&quot;)&lt;/script&gt;');
        expect(entry).toContain('&lt;script&gt;alert(&quot;XSS in thought&quot;)&lt;/script&gt;');
        expect(entry).toContain('&lt;script&gt;alert(&quot;XSS in trait&quot;)&lt;/script&gt;');
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
