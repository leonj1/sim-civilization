// Import modules
import { Person } from './modules/Person.js';
import { Building, Store, PublicBuilding, ResidentialBuilding } from './modules/Buildings.js';
import { Town } from './modules/Town.js';
import { MarkovChain } from './modules/MarkovChain.js';
import { TRANSLATIONS, THOUGHTS } from './modules/translations.js';
import { 
    TOWN_PREFIXES, TOWN_SYLLABLES, MOTTO_TEMPLATES,
    GENERATION_NAMING_STYLES, GREEK_ALPHABET, HEBREW_ALPHABET,
    NATO_PHONETIC, OLD_NATO_ALPHABET, PAGASA_NAMES,
    NHC_NAMES, TYPHOON_NAMES
} from './modules/constants.js';
import { getTranslation, LANGUAGES } from './modules/translations.js';
import { debugLog, ObjectPool } from './modules/utils.js';

// Global variables
let people = [];
let buildings = [];
let towns = [];
let terrain = [];
let offset = { x: 0, y: 0 };
let zoom = 0.7;
let isDragging = false;
let lastMousePos = null;
let currentMode = null;
let gameSpeed = 1.0;
let currentLanguage = LANGUAGES.EN;
let currentGenerationNumber = 0;
let activeBubble = null;
let allPeopleEver = [];
let currentBirthCount = 0;
let targetFPS = 30;
let lastTime = 0;
let lastRender = 0;
let lastUIUpdate = 0;
const FRAME_RATE = 30;
const birthData = Array(60).fill(0);
let currentBirthRate = 0;

// Game state
const tagGame = {
    isActive: false,
    players: [],
    it: null,
    lastTagTime: 0,
    gameStartTime: 0,
    gameDuration: Math.random() * 15000 + 5000
};

const rpsGame = {
    isActive: false,
    players: [],
    choices: ['Rock', 'Paper', 'Scissors'],
    roundStartTime: 0,
    roundDuration: 2000,
    results: {}
};

// Game objects
export const OBJECT_POOL = {
    people: new ObjectPool(() => new Person()),
    buildings: new ObjectPool(() => new Building()),
    stores: new ObjectPool(() => new Store()),
    publicBuildings: new ObjectPool(() => new PublicBuilding()),
    residentialBuildings: new ObjectPool(() => new ResidentialBuilding())
};

// Camera
const camera = {
    x: 0,
    y: 0,
    zoom: 1,
    target: null,
    speed: 5
};

// Initialize game
export function init() {
    debugLog('Initializing game...', 'info');
    
    // Setup canvas
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas(canvas);
    
    // Setup event listeners
    setupEventListeners();
    
    // Create initial game objects
    createInitialTown();
    
    // Start game loop
    requestAnimationFrame(gameLoop);
    
    debugLog('Game initialized successfully', 'success');
}

function resizeCanvas(canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function setupEventListeners() {
    // Window resize
    window.addEventListener('resize', () => resizeCanvas(document.getElementById('gameCanvas')));
    
    // Mouse events
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleMouseWheel);
    
    // Touch events
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // Keyboard events
    window.addEventListener('keydown', handleKeyDown);
}

function createInitialTown() {
    const town = new Town(camera.x + camera.zoom * (camera.x - camera.x) / 2, camera.y + camera.zoom * (camera.y - camera.y) / 2);
    towns.push(town);
    
    // Add initial buildings
    const house = OBJECT_POOL.residentialBuildings.acquire();
    house.x = town.x - 50;
    house.y = town.y - 50;
    town.addBuilding(house);
    buildings.push(house);
    
    const store = OBJECT_POOL.stores.acquire();
    store.x = town.x + 50;
    store.y = town.y - 50;
    town.addBuilding(store);
    buildings.push(store);
    
    // Add initial people
    for (let i = 0; i < 5; i++) {
        const person = OBJECT_POOL.people.acquire();
        person.x = town.x + Math.random() * 100 - 50;
        person.y = town.y + Math.random() * 100 - 50;
        town.addPerson(person);
        people.push(person);
    }
}

// Game loop
function gameLoop(timestamp) {
    const deltaTime = (timestamp - lastTime) * gameSpeed;
    lastTime = timestamp;
    
    if (!isPaused) {
        update();
    }
    
    render();
    requestAnimationFrame(gameLoop);
}

function update() {
    // Update camera
    updateCamera();
    
    // Update game objects
    for (const town of towns) {
        town.update(deltaTime);
    }
    
    for (const person of people) {
        person.update(deltaTime);
    }
    
    for (const building of buildings) {
        building.update(deltaTime);
    }
}

function updateCamera() {
    if (camera.target) {
        camera.x += (camera.target.x - camera.x) * 0.1;
        camera.y += (camera.target.y - camera.y) * 0.1;
    }
}

function render() {
    // Clear canvas
    ctx.fillStyle = '#87CEEB'; // Sky blue background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set up camera transform
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x - canvas.width / 2 / camera.zoom, -camera.y - canvas.height / 2 / camera.zoom);
    
    // Draw game objects
    for (const town of towns) {
        town.draw(ctx, { x: 0, y: 0 }, camera.zoom);
    }
    
    for (const building of buildings) {
        building.draw(ctx, { x: 0, y: 0 }, camera.zoom);
    }
    
    for (const person of people) {
        person.draw(ctx, { x: 0, y: 0 }, camera.zoom);
    }
    
    // Restore canvas state
    ctx.restore();
    
    // Draw UI
    drawUI();
}

function drawUI() {
    // Draw game speed
    ctx.fillStyle = 'black';
    ctx.font = '16px Mojangles';
    ctx.textAlign = 'left';
    ctx.fillText(`Speed: ${gameSpeed}x`, 10, 30);
    
    // Draw population
    const totalPopulation = towns.reduce((sum, town) => sum + town.population, 0);
    ctx.fillText(`${getTranslation('GAME.POPULATION', currentLanguage)}: ${totalPopulation}`, 10, 60);
    
    // Draw FPS
    const fps = Math.round(1000 / deltaTime);
    ctx.fillText(`FPS: ${fps}`, 10, 90);
}

// Event handlers
function handleMouseDown(event) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / camera.zoom + camera.x;
    const y = (event.clientY - rect.top) / camera.zoom + camera.y;
    
    // Check for clicks on game objects
    for (const town of towns) {
        // Handle town clicks
    }
    
    for (const building of buildings) {
        // Handle building clicks
    }
    
    for (const person of people) {
        // Handle person clicks
    }
}

function handleMouseMove(event) {
    // Handle mouse movement
}

function handleMouseUp(event) {
    // Handle mouse up
}

function handleMouseWheel(event) {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    camera.zoom = Math.max(0.5, Math.min(2, camera.zoom * zoomFactor));
}

function handleTouchStart(event) {
    // Handle touch start
}

function handleTouchMove(event) {
    // Handle touch movement
}

function handleTouchEnd(event) {
    // Handle touch end
}

function handleKeyDown(event) {
    switch (event.key) {
        case ' ':
            isPaused = !isPaused;
            break;
        case '1':
        case '2':
        case '3':
            gameSpeed = parseInt(event.key);
            break;
        // Add more keyboard controls
    }
}

// Start the game when the page loads
window.addEventListener('load', init);

// Export necessary functions and variables
export {
    people,
    buildings,
    towns,
    terrain,
    offset,
    zoom,
    gameSpeed,
    currentLanguage,
    currentGenerationNumber,
    tagGame,
    rpsGame,
    OBJECT_POOL,
    init
}; 