import { LANGUAGES, getTranslation, getThought, formatNumber, formatDate, formatCurrency } from '../translations.js';

describe('Translations Module', () => {
    describe('getTranslation', () => {
        const testCases = [
            {
                name: 'returns menu start text in English',
                key: 'MENU.START',
                language: LANGUAGES.EN,
                expected: 'Start Game'
            },
            {
                name: 'returns menu start text in Spanish',
                key: 'MENU.START',
                language: LANGUAGES.ES,
                expected: 'Iniciar Juego'
            },
            {
                name: 'returns nested building text in English',
                key: 'BUILDINGS.SCHOOL',
                language: LANGUAGES.EN,
                expected: 'School'
            },
            {
                name: 'returns nested building text in Spanish',
                key: 'BUILDINGS.SCHOOL',
                language: LANGUAGES.ES,
                expected: 'Escuela'
            },
            {
                name: 'returns key when translation not found',
                key: 'INVALID.KEY',
                language: LANGUAGES.EN,
                expected: 'INVALID.KEY'
            },
            {
                name: 'defaults to English when language not found',
                key: 'MENU.START',
                language: 'invalid',
                expected: 'MENU.START'
            }
        ];

        test.each(testCases)('$name', ({ key, language, expected }) => {
            expect(getTranslation(key, language)).toBe(expected);
        });
    });

    describe('getThought', () => {
        const testCases = [
            {
                name: 'returns thought in English',
                key: 'HUNGRY',
                language: LANGUAGES.EN,
                expected: 'I\'m hungry...'
            },
            {
                name: 'returns thought in Spanish',
                key: 'HUNGRY',
                language: LANGUAGES.ES,
                expected: 'Tengo hambre...'
            },
            {
                name: 'falls back to English when language not found',
                key: 'HUNGRY',
                language: 'invalid',
                expected: 'I\'m hungry...'
            },
            {
                name: 'returns key when thought not found',
                key: 'INVALID',
                language: LANGUAGES.EN,
                expected: 'INVALID'
            }
        ];

        test.each(testCases)('$name', ({ key, language, expected }) => {
            expect(getThought(key, language)).toBe(expected);
        });
    });

    describe('formatNumber', () => {
        const testCases = [
            {
                name: 'formats integer in English',
                number: 1234567,
                language: LANGUAGES.EN,
                expected: '1,234,567'
            },
            {
                name: 'formats decimal in English',
                number: 1234.567,
                language: LANGUAGES.EN,
                expected: '1,234.567'
            },
            {
                name: 'formats negative number',
                number: -1234.56,
                language: LANGUAGES.EN,
                expected: '-1,234.56'
            }
        ];

        test.each(testCases)('$name', ({ number, language, expected }) => {
            expect(formatNumber(number, language)).toBe(expected);
        });
    });

    describe('formatDate', () => {
        const testCases = [
            {
                name: 'formats date in English',
                date: new Date('2024-03-15'),
                language: LANGUAGES.EN,
                expected: 'March 15, 2024'
            },
            {
                name: 'formats date in Spanish',
                date: new Date('2024-03-15'),
                language: LANGUAGES.ES,
                expected: '15 de marzo de 2024'
            }
        ];

        test.each(testCases)('$name', ({ date, language, expected }) => {
            expect(formatDate(date, language)).toBe(expected);
        });
    });

    describe('formatCurrency', () => {
        const testCases = [
            {
                name: 'formats USD in English',
                amount: 1234.56,
                currency: 'USD',
                language: LANGUAGES.EN,
                expected: '$1,234.56'
            },
            {
                name: 'formats EUR in English',
                amount: 1234.56,
                currency: 'EUR',
                language: LANGUAGES.EN,
                expected: '€1,234.56'
            },
            {
                name: 'formats negative amount',
                amount: -1234.56,
                currency: 'USD',
                language: LANGUAGES.EN,
                expected: '-$1,234.56'
            }
        ];

        test.each(testCases)('$name', ({ amount, currency, language, expected }) => {
            expect(formatCurrency(amount, currency, language)).toBe(expected);
        });
    });
}); 