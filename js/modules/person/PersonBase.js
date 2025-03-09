import { OBJECT_POOL, currentGenerationNumber } from '../gameState.js';
import { generateULID, generateRandomName } from '../utils.js';
import { TRAITS } from '../constants.js';

// Age constants
const MIN_AGE_ADJUSTMENT = 6;
const FEMALE_MIN_AGE = 8;
const MALE_MIN_AGE = 15;
const FEMALE_AGE_PROBABILITY = 0.3;
const MAX_AGE_RANDOM_FACTOR = 30;
const MIN_MAX_AGE = 70;

export class PersonBase {
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
        this.ulid = generateULID();
        
        // Basic properties
        this.x = x;
        this.y = y;
        this.gender = gender;
        this.name = generateRandomName(gender);
        
        // Age and lifecycle
        this.age = Math.floor(Math.random() * MIN_AGE_ADJUSTMENT) + 
                  (gender === 'female' && Math.random() < FEMALE_AGE_PROBABILITY ? 
                   FEMALE_MIN_AGE : MALE_MIN_AGE);
        this.maxAge = Math.random() * MAX_AGE_RANDOM_FACTOR + MIN_MAX_AGE;
        
        // State flags
        this.isPlayingTag = false;
        this.isIt = false;
        this.isPlayingRPS = false;
        this.isMayor = false;
        
        this.generation = typeof currentGenerationNumber !== 'undefined' ? currentGenerationNumber : 0;
        
        // Traits and characteristics
        this.traits = this.generateTraits();
        this.speedMultiplier = this.traits.has(TRAITS.FAST) ? 1.5 : 1.0;
        this.scale = this.traits.has(TRAITS.GIANT) ? 1.3 : 1.0;
    }

    generateTraits() {
        const traits = new Set();
        const traitList = Object.values(TRAITS);
        const numTraits = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < numTraits; i++) {
            traits.add(traitList[Math.floor(Math.random() * traitList.length)]);
        }
        
        return traits;
    }

    clearReferences() {
        this.partner = null;
        this.parent = null;
        this.motherPartner = null;
        this.fatherPartner = null;
        this.home = null;
        this.town = null;
        this.following = null;
        this.currentRoadTarget = null;
        this.currentBridgeTarget = null;
        this.currentThought = null;
        this.isPlayingTag = false;
        this.isPlayingRPS = false;
        this.isIt = false;
        this.isMayor = false;
        this.inRelation = false;
    }
}