import { getGenerationName } from '../utils.js';
import { ResidentialBuilding } from '../buildings/index.js';
import { OCCUPATIONS, AGE_THRESHOLDS } from '../constants.js';

export class PeopleListRenderer {
    constructor(translations) {
        this.t = translations;
    }
    
    /**
     * Escapes HTML special characters to prevent XSS attacks
     * @param {string} unsafe - The unsafe string that might contain HTML special characters
     * @returns {string} - The escaped string safe for insertion into HTML
     */
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    renderPopulationStats(allPeopleEver, people, currentGenerationNumber) {
        return `
            <div class="stats-container">
                ${this.t.totalPop}: ${allPeopleEver.length}<br>
                ${this.t.currentPop}: ${people.length}<br>
                ${this.t.currentGen}: ${currentGenerationNumber}<br>
                (${getGenerationName(currentGenerationNumber)})<br><br>
            </div>`;
    }

    getPersonActivity(person) {
        if (person.inRelation) return this.t.inRelation;
        if (person.currentBridgeTarget) {
            return `${this.t.building} (${Math.floor(person.bridgeProgress * 100)}% complete)`;
        }
        if (person.currentRoadTarget) return this.t.paving;
        if (person.following) return `${this.t.following} ${person.following.name}`;
        if (person.occupation === OCCUPATIONS.CASHIER) return this.t.working;
        if (person.occupation === OCCUPATIONS.SUPPLIER && person.targetX !== person.x) return this.t.delivering;
        if (person.occupation === OCCUPATIONS.CHILD && person.age < AGE_THRESHOLDS.CHILD) return this.t.playing;
        if (person.moveTimer > 0) return this.t.walking;
        if (person.isPlayingRPS) {
            return `Hit ${person.rpsChoice}${person.rpsResult ? `. ${person.rpsResult}!` : '...'}`;
        }
        return this.t.idle;
    }

    renderPersonEntry(person) {
        const townInfo = person.town ? person.town.name : this.t.noTown;
        const motherInfo = person.motherPartner ? person.motherPartner.name : this.t.unknown;
        const fatherInfo = person.fatherPartner ? person.fatherPartner.name : this.t.unknown;
        const mayorTitle = person.isMayor && person.town 
            ? (person.gender === 'female' ? ` ${this.t.mayoress} ` : ` ${this.t.mayor} `) + person.town.name 
            : '';
        const occupationInfo = person.occupation || this.t.unemployed;
        const activity = this.getPersonActivity(person);

        return `
            <div class="personEntry ${person.isMayor ? 'mayor' : ''} ${person.isPlayingTag ? 'it' : ''} ${person.isPlayingRPS ? 'playing-rps' : ''}">
                ${person.name} - ${this.t.age}: ${Math.floor(person.age)}
                ${mayorTitle}
                <br><span class="person-activity">${this.t.currently}: ${activity}</span>
                <br><span class="person-detail">${this.t.works}: ${occupationInfo}</span>
                <br><span class="person-detail">${this.t.generation}: ${person.generation}<br>(${getGenerationName(person.generation)})</span>
                <br><span class="person-detail">${this.t.mother}: ${motherInfo}</span>
                <br><span class="person-detail">${this.t.father}: ${fatherInfo}</span>
                <br><span class="person-detail">${this.t.citizen}: ${townInfo}</span>
                ${person.currentThought ? `<div class="thoughts">"${this.escapeHtml(person.currentThought)}"</div>` : ''}
                ${person.traits && person.traits.length ? `<div class="traits">Traits: ${person.traits.join(', ')}</div>` : ''}
                ${person.isPlayingTag ? `<br><span class="tag-status ${person.isIt ? 'tag-it' : 'tag-playing'}">
                    ${person.isIt ? this.t.it : this.t.playingTag}</span>` : ''}
                ${person.currentBridgeTarget instanceof ResidentialBuilding ? 
                    `<br><span class="capacity-info">Capacity: ${person.currentBridgeTarget.capacity}</span>` : ''}
            </div>`;
    }

    renderPeopleList(allPeopleEver, people, currentGenerationNumber) {
        const stats = this.renderPopulationStats(allPeopleEver, people, currentGenerationNumber);
        // Only show living people
        const peopleEntries = people.map(person => this.renderPersonEntry(person)).join('');
        return stats + peopleEntries;
    }
}
