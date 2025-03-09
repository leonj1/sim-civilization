import { getGenerationName } from '../utils.js';
import { ResidentialBuilding } from '../buildings/index.js';

export class PeopleListRenderer {
    constructor(translations) {
        this.t = translations;
    }

    renderPopulationStats(allPeopleEver, people, currentGenerationNumber) {
        return `
            <div style="font-size: 10px">
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
        if (person.occupation === 'Cashier') return this.t.working;
        if (person.occupation === 'Supplier' && person.targetX !== person.x) return this.t.delivering;
        if (person.occupation === 'Child' && person.age < 12) return this.t.playing;
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
                <br><span style="font-size: 9px; color: #666;">${this.t.currently}: ${activity}</span>
                <br><span style="font-size: 9px">${this.t.works}: ${occupationInfo}</span>
                <br><span style="font-size: 9px">${this.t.generation}: ${person.generation}<br>(${getGenerationName(person.generation)})</span>
                <br><span style="font-size: 9px">${this.t.mother}: ${motherInfo}</span>
                <br><span style="font-size: 9px">${this.t.father}: ${fatherInfo}</span>
                <br><span style="font-size: 9px">${this.t.citizen}: ${townInfo}</span>
                ${person.currentThought ? `<div class="thoughts">"${person.currentThought}"</div>` : ''}
                ${person.traits && person.traits.length ? `<div class="traits">Traits: ${person.traits.join(', ')}</div>` : ''}
                ${person.isPlayingTag ? `<br><span style="font-size: 9px; color: ${person.isIt ? 'red' : '#FFD700'}">
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
