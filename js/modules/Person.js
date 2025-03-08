import { OBJECT_POOL, currentGenerationNumber } from '../game.js';
import { generateRandomName, randomInt, sample } from './utils.js';
import { THOUGHTS, getThought } from './translations.js';

export const TRAITS = {
    FERTILE: 'Fertile',
    FAST: 'Fast',
    GIANT: 'Giant',
    AUTISTIC: 'Autistic',
    PTSD: 'PTSD'
};

const OCCUPATIONS = [
    'Farmer',
    'Merchant',
    'Teacher',
    'Doctor',
    'Builder',
    'Guard',
    'Priest',
    'Artist'
];

export class Person {
    constructor(x, y, gender) {
        const pooledPerson = OBJECT_POOL.people.pop();
        if (pooledPerson) {
            Object.assign(this, pooledPerson);
            this.reset(x, y, gender);
            return;
        }
        this.reset(x, y, gender);
    }

    reset(x, y, gender) {
        this.x = x;
        this.y = y;
        this.gender = gender;
        this.name = generateRandomName(gender);
        this.partner = null;
        this.home = null;
        this.age = Math.floor(Math.random() * 6) + 15;
        this.isPlayingTag = false;
        this.isIt = false;
        this.inRelation = false;
        this.relationTimer = 0;
        this.moveTimer = 0;
        this.targetX = x;
        this.targetY = y;
        this.initialX = null;
        this.initialY = null;
        this.spinStartTime = null;
        this.maxAge = Math.random() * 30 + 70;
        this.occupation = this.age >= 13 ? this.assignOccupation() : 'Child';
        this.workTimer = 0;
        this.currentRoadTarget = null;
        this.bridgeProgress = 0;
        this.currentBridgeTarget = null;
        this.setNewMoveTimer();
        this.reproductionCooldown = 0;
        this.town = null;
        this.parent = null;
        this.motherPartner = null;
        this.fatherPartner = null;
        this.spawnTime = Date.now();
        this.following = null;
        this.generation = typeof currentGenerationNumber !== 'undefined' ? currentGenerationNumber : 0;
        this.isMayor = false;
        this.isPlayingRPS = false;
        this.rpsChoice = null;
        this.rpsResult = null;
        this.currentThought = this.generateThought();
        this.thoughtUpdateTimer = Math.random() * 5000 + 5000;
        this.traits = this.generateTraits();
    }

    assignOccupation() {
        // Weight occupations based on town needs and current distribution
        if (this.town) {
            const occupationCounts = new Map();
            this.town.people.forEach(person => {
                if (person.occupation !== 'Child') {
                    occupationCounts.set(person.occupation, (occupationCounts.get(person.occupation) || 0) + 1);
                }
            });

            // Prioritize underrepresented occupations
            const minCount = Math.min(...Array.from(occupationCounts.values(), count => count || 0));
            const neededOccupations = OCCUPATIONS.filter(occ => !occupationCounts.has(occ) || occupationCounts.get(occ) === minCount);
            
            if (neededOccupations.length > 0) {
                return sample(neededOccupations);
            }
        }
        
        return sample(OCCUPATIONS);
    }

    setNewMoveTimer() {
        this.moveTimer = randomInt(3000, 8000);
        this.targetX = this.x + randomInt(-100, 100);
        this.targetY = this.y + randomInt(-100, 100);
        
        // Keep within town boundaries if assigned to a town
        if (this.town) {
            const maxDistance = 180; // Town radius - some margin
            const dx = this.targetX - this.town.x;
            const dy = this.targetY - this.town.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > maxDistance) {
                const scale = maxDistance / distance;
                this.targetX = this.town.x + dx * scale;
                this.targetY = this.town.y + dy * scale;
            }
        }
    }

    generateThought() {
        const thoughts = [
            'HUNGRY', 'TIRED', 'HAPPY', 'SAD', 'WORK',
            'PLAY', 'SHOP', 'SOCIALIZE', 'LEARN', 'BUILD'
        ];
        
        // Weight thoughts based on current state
        const weightedThoughts = thoughts.filter(thought => {
            switch (thought) {
                case 'WORK':
                    return this.age >= 13 && !this.isPlayingTag && !this.isPlayingRPS;
                case 'PLAY':
                    return this.age < 18 || this.isPlayingTag || this.isPlayingRPS;
                case 'SHOP':
                    return this.age >= 15 && this.town && this.town.buildings.some(b => b.type === 'store');
                case 'BUILD':
                    return this.occupation === 'Builder';
                default:
                    return true;
            }
        });
        
        return getThought(sample(weightedThoughts));
    }

    generateTraits() {
        const traits = new Set();
        const traitList = Object.values(TRAITS);
        
        // Each person has a 20% chance for each trait
        traitList.forEach(trait => {
            if (Math.random() < 0.2) {
                traits.add(trait);
            }
        });
        
        return traits;
    }

    // Add all the Person class methods here...
    // Methods like update(), draw(), setNewMoveTimer(), etc.
} 