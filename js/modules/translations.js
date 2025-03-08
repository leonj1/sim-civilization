export const LANGUAGES = {
    EN: 'en',
    ES: 'es',
    FR: 'fr',
    DE: 'de',
    IT: 'it',
    PT: 'pt',
    RU: 'ru',
    ZH: 'zh',
    JA: 'ja',
    KO: 'ko'
};

export const THOUGHTS = {
    [LANGUAGES.EN]: {
        HUNGRY: 'I\'m hungry...',
        TIRED: 'I need rest...',
        HAPPY: 'Life is good!',
        SAD: 'Feeling down...',
        WORK: 'Time to work',
        PLAY: 'Let\'s have fun!',
        SHOP: 'Need to buy stuff',
        SOCIALIZE: 'Want to meet people',
        LEARN: 'Time to study',
        BUILD: 'Let\'s build something'
    },
    [LANGUAGES.ES]: {
        HUNGRY: 'Tengo hambre...',
        TIRED: 'Necesito descansar...',
        HAPPY: '¡La vida es buena!',
        SAD: 'Me siento mal...',
        WORK: 'Hora de trabajar',
        PLAY: '¡Vamos a divertirnos!',
        SHOP: 'Necesito comprar cosas',
        SOCIALIZE: 'Quiero conocer gente',
        LEARN: 'Hora de estudiar',
        BUILD: 'Vamos a construir algo'
    },
    // Add more languages as needed
};

export const UI_TEXT = {
    [LANGUAGES.EN]: {
        MENU: {
            START: 'Start Game',
            OPTIONS: 'Options',
            HELP: 'Help',
            QUIT: 'Quit'
        },
        GAME: {
            POPULATION: 'Population',
            HAPPINESS: 'Happiness',
            RESOURCES: 'Resources',
            BUILDINGS: 'Buildings',
            SAVE: 'Save Game',
            LOAD: 'Load Game',
            PAUSE: 'Pause',
            RESUME: 'Resume'
        },
        BUILDINGS: {
            HOUSE: 'House',
            STORE: 'Store',
            SCHOOL: 'School',
            HOSPITAL: 'Hospital',
            FACTORY: 'Factory',
            PARK: 'Park',
            RESTAURANT: 'Restaurant',
            OFFICE: 'Office'
        },
        RESOURCES: {
            FOOD: 'Food',
            WATER: 'Water',
            ENERGY: 'Energy',
            MONEY: 'Money',
            MATERIALS: 'Materials'
        },
        NOTIFICATIONS: {
            SAVE_SUCCESS: 'Game saved successfully',
            SAVE_ERROR: 'Failed to save game',
            LOAD_SUCCESS: 'Game loaded successfully',
            LOAD_ERROR: 'Failed to load game',
            BUILD_SUCCESS: 'Building constructed',
            BUILD_ERROR: 'Cannot build here',
            NO_RESOURCES: 'Not enough resources'
        }
    },
    [LANGUAGES.ES]: {
        MENU: {
            START: 'Iniciar Juego',
            OPTIONS: 'Opciones',
            HELP: 'Ayuda',
            QUIT: 'Salir'
        },
        GAME: {
            POPULATION: 'Población',
            HAPPINESS: 'Felicidad',
            RESOURCES: 'Recursos',
            BUILDINGS: 'Edificios',
            SAVE: 'Guardar Juego',
            LOAD: 'Cargar Juego',
            PAUSE: 'Pausar',
            RESUME: 'Reanudar'
        },
        BUILDINGS: {
            HOUSE: 'Casa',
            STORE: 'Tienda',
            SCHOOL: 'Escuela',
            HOSPITAL: 'Hospital',
            FACTORY: 'Fábrica',
            PARK: 'Parque',
            RESTAURANT: 'Restaurante',
            OFFICE: 'Oficina'
        },
        RESOURCES: {
            FOOD: 'Comida',
            WATER: 'Agua',
            ENERGY: 'Energía',
            MONEY: 'Dinero',
            MATERIALS: 'Materiales'
        },
        NOTIFICATIONS: {
            SAVE_SUCCESS: 'Juego guardado exitosamente',
            SAVE_ERROR: 'Error al guardar el juego',
            LOAD_SUCCESS: 'Juego cargado exitosamente',
            LOAD_ERROR: 'Error al cargar el juego',
            BUILD_SUCCESS: 'Edificio construido',
            BUILD_ERROR: 'No se puede construir aquí',
            NO_RESOURCES: 'Recursos insuficientes'
        }
    }
    // Add more languages as needed
};

export function getTranslation(key, language = LANGUAGES.EN) {
    const keys = key.split('.');
    let current = UI_TEXT[language];
    
    for (const k of keys) {
        if (current && current[k]) {
            current = current[k];
        } else {
            console.warn(`Translation not found for key: ${key} in language: ${language}`);
            return key;
        }
    }
    
    return current;
}

export function getThought(key, language = LANGUAGES.EN) {
    if (THOUGHTS[language] && THOUGHTS[language][key]) {
        return THOUGHTS[language][key];
    }
    console.warn(`Thought not found for key: ${key} in language: ${language}`);
    return THOUGHTS[LANGUAGES.EN][key] || key;
}

export function formatNumber(number, language = LANGUAGES.EN) {
    return new Intl.NumberFormat(language).format(number);
}

export function formatDate(date, language = LANGUAGES.EN) {
    return new Intl.DateTimeFormat(language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

export function formatCurrency(amount, currency = 'USD', language = LANGUAGES.EN) {
    return new Intl.NumberFormat(language, {
        style: 'currency',
        currency: currency
    }).format(amount);
} 