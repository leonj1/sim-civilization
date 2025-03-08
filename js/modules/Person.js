import { OBJECT_POOL } from '../game.js';
import { generateRandomName } from './utils.js';
import { THOUGHTS } from './translations.js';

export const TRAITS = {
    FERTILE: 'Fertile',
    FAST: 'Fast',
    GIANT: 'Giant',
    AUTISTIC: 'Autistic',
    PTSD: 'PTSD'
};

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
        this.generation = currentGenerationNumber;
        this.isMayor = false;
        this.isPlayingRPS = false;
        this.rpsChoice = null;
        this.rpsResult = null;
        this.currentThought = this.generateThought();
        this.thoughtUpdateTimer = Math.random() * 5000 + 5000;
        this.traits = this.generateTraits();
    }

    // Add all the Person class methods here...
    // Methods like update(), draw(), setNewMoveTimer(), etc.
} 