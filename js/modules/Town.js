import { Person } from './person/Person.js';
import { OBJECT_POOL } from './gameState.js';
import { 
    Building, 
    Store, 
    PublicBuilding, 
    ResidentialBuilding 
} from './buildings/index.js';
import { generateRandomName } from './utils.js';

export class Town {
    // Happiness adjustment constants
    static RESOURCE_THRESHOLD = 0.5;
    static RESOURCE_ADJUSTMENT = 0.5;
    static BUILDING_PENALTY = 0.25;
    static DENSITY_THRESHOLD = 10;
    static DENSITY_PENALTY = 1.0;
    static TIME_SCALE = 0.001;

    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.name = generateRandomName();
        this.buildings = [];
        this.people = [];
        this.roads = new Set();
        this.mayor = null;
        this.founded = Date.now();
        this.population = 0;
        this.happiness = 100;
        this.resources = {
            food: 100,
            water: 100,
            energy: 100
        };
    }

    update(deltaTime) {
        this.updateResources(deltaTime);
        this.updateHappiness(deltaTime);
        this.updatePopulation();
        
        for (const building of this.buildings) {
            building.update(deltaTime);
        }
    }

    updateResources(deltaTime) {
        const consumptionRate = this.population * 0.001 * deltaTime;
        
        this.resources.food = Math.max(0, this.resources.food - consumptionRate);
        this.resources.water = Math.max(0, this.resources.water - consumptionRate * 0.5);
        this.resources.energy = Math.max(0, this.resources.energy - consumptionRate * 0.75);
        
        // Resource regeneration from buildings
        const stores = this.buildings.filter(b => b instanceof Store);
        for (const store of stores) {
            if (store.inventory > 50) {
                this.resources.food += 0.1 * deltaTime;
            }
        }
        
        // Cap resources at 100
        Object.keys(this.resources).forEach(key => {
            this.resources[key] = Math.min(100, this.resources[key]);
        });
    }

    updateHappiness(deltaTime) {
        const resourceFactor = Object.values(this.resources).reduce((a, b) => a + b, 0) / 300;
        const buildingFactor = this.buildings.length > 0 ? 1 : 0.5;
        const populationDensity = this.population / Math.max(1, this.buildings.length);
        
        // Calculate base happiness change
        let happinessChange = 0;
        
        // Resource effect
        if (resourceFactor < Town.RESOURCE_THRESHOLD) {
            happinessChange -= Town.RESOURCE_ADJUSTMENT; // Decrease when resources are low
        } else {
            happinessChange += Town.RESOURCE_ADJUSTMENT; // Increase when resources are high
        }

        // Building effect
        if (buildingFactor < 1) {
            happinessChange -= Town.BUILDING_PENALTY; // Small penalty when no buildings
        }
        
        // Population density effect
        if (populationDensity > Town.DENSITY_THRESHOLD) {
            happinessChange -= Town.DENSITY_PENALTY; // Double penalty for overcrowding
        }
        
        // Apply time factor
        happinessChange = happinessChange * deltaTime * Town.TIME_SCALE;
        
        // Update happiness with bounds
        this.happiness = Math.max(0, Math.min(100, this.happiness + happinessChange));
    }

    updatePopulation() {
        // Remove deceased people (those not in OBJECT_POOL.people)
        for (let i = this.people.length - 1; i >= 0; i--) {
            const person = this.people[i];
            if (!OBJECT_POOL.people.includes(person)) {
                this.removePerson(person);
            }
        }
        
        this.population = this.people.length;
    }

    addBuilding(building) {
        building.town = this;
        this.buildings.push(building);
        return building;
    }

    removeBuilding(building) {
        const index = this.buildings.indexOf(building);
        if (index > -1) {
            this.buildings.splice(index, 1);
            building.town = null;
        }
    }

    addPerson(person) {
        person.town = this;
        this.people.push(person);
        return person;
    }

    removePerson(person) {
        const index = this.people.indexOf(person);
        if (index > -1) {
            this.people.splice(index, 1);
            person.town = null;
        }
    }

    draw(ctx, offset, zoom) {
        // Draw town boundary
        ctx.strokeStyle = 'rgba(100,100,100,0.5)';
        ctx.lineWidth = 2 * zoom;
        ctx.beginPath();
        ctx.arc((this.x + offset.x) * zoom, (this.y + offset.y) * zoom, 200 * zoom, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw town name
        ctx.fillStyle = 'black';
        ctx.font = `bold ${20 * zoom}px Mojangles`;
        ctx.textAlign = 'center';
        ctx.fillText(this.name, (this.x + offset.x) * zoom, (this.y + offset.y - 220) * zoom);
        
        // Draw stats
        this.drawStats(ctx, offset, zoom);
        
        // Draw roads
        this.drawRoads(ctx, offset, zoom);
        
        // Draw buildings
        for (const building of this.buildings) {
            building.draw(ctx, offset, zoom);
        }
    }

    drawStats(ctx, offset, zoom) {
        const screenX = (this.x + offset.x) * zoom;
        const screenY = (this.y + offset.y - 180) * zoom;
        
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(screenX - 60 * zoom, screenY - 40 * zoom, 120 * zoom, 60 * zoom);
        
        ctx.font = `${12 * zoom}px Mojangles`;
        ctx.textAlign = 'left';
        ctx.fillStyle = 'black';
        
        ctx.fillText(`Population: ${this.population}`, screenX - 55 * zoom, screenY - 25 * zoom);
        ctx.fillText(`Happiness: ${Math.round(this.happiness)}%`, screenX - 55 * zoom, screenY - 10 * zoom);
        ctx.fillText(`Buildings: ${this.buildings.length}`, screenX - 55 * zoom, screenY + 5 * zoom);
    }

    drawRoads(ctx, offset, zoom) {
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 4 * zoom;
        
        for (const road of this.roads) {
            const [x1, y1, x2, y2] = road.split(',').map(Number);
            ctx.beginPath();
            ctx.moveTo((x1 + offset.x) * zoom, (y1 + offset.y) * zoom);
            ctx.lineTo((x2 + offset.x) * zoom, (y2 + offset.y) * zoom);
            ctx.stroke();
        }
    }

    addRoad(x1, y1, x2, y2) {
        this.roads.add(`${x1},${y1},${x2},${y2}`);
    }

    removeRoad(x1, y1, x2, y2) {
        this.roads.delete(`${x1},${y1},${x2},${y2}`);
    }

    findNearestBuilding(x, y, type = null) {
        let nearest = null;
        let minDist = Infinity;
        
        for (const building of this.buildings) {
            if (type && !(building instanceof type)) continue;
            
            const dist = Math.hypot(building.x - x, building.y - y);
            if (dist < minDist) {
                minDist = dist;
                nearest = building;
            }
        }
        
        return nearest;
    }
}
