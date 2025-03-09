import { OBJECT_POOL } from './gameState.js';
import { drawRoundedRect } from './utils.js';

export const STORE_COLORS = {
    WALL: '#98FB98',
    ROOF: '#32CD32',
    DOOR: '#228B22'
};

// Store constants
const STORE_CONFIG = {
    MAX_INVENTORY: 100,
    MIN_INVENTORY: 0,
    RESTOCK_AMOUNT: 5,
    RESTOCK_INTERVAL: 5000,  // 5 seconds
    LOW_STOCK_THRESHOLD: 20
};

// Building configuration constants
const RESIDENTIAL_CONFIG = {
    HOTEL: {
        MIN_CAPACITY: 50,
        MAX_CAPACITY: 75,
        STEP_SIZE: 5
    },
    CONDO: {
        MIN_CAPACITY: 20,
        MAX_CAPACITY: 40,
        STEP_SIZE: 5
    },
    DEFAULT_CAPACITY: 20
};

export class Building {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.hasRoad = false;
        this.town = null;
        this.familyName = null;
    }

    /**
     * Calculates screen coordinates from world coordinates
     * @param {Object} offset - The camera offset
     * @param {number} zoom - The current zoom level
     * @returns {{x: number, y: number}} Screen coordinates
     */
    calculateScreenPosition(offset, zoom) {
        return {
            x: (this.x + offset.x) * zoom,
            y: (this.y + offset.y) * zoom
        };
    }

    /**
     * Calculates a scaled dimension based on zoom level
     * @param {number} size - The base size to scale
     * @param {number} zoom - The current zoom level
     * @returns {number} The scaled size
     */
    calculateScaledSize(size, zoom) {
        return size * zoom;
    }

    draw(ctx, offset, zoom) {
        const { x: screenX, y: screenY } = this.calculateScreenPosition(offset, zoom);
        
        // Draw main building
        ctx.fillStyle = '#8B4513';
        const buildingSize = this.calculateScaledSize(30, zoom);
        ctx.fillRect(
            screenX - buildingSize/2,
            screenY - buildingSize/2,
            buildingSize,
            buildingSize
        );
        
        // Draw door
        ctx.fillStyle = '#4A2811';
        const doorSize = this.calculateScaledSize(10, zoom);
        ctx.fillRect(
            screenX - doorSize/2,
            screenY + this.calculateScaledSize(5, zoom),
            doorSize,
            doorSize
        );
        
        // Draw roof
        ctx.beginPath();
        const roofWidth = this.calculateScaledSize(40, zoom);
        const roofHeight = this.calculateScaledSize(15, zoom);
        ctx.moveTo(screenX - roofWidth/2, screenY - roofHeight);
        ctx.lineTo(screenX + roofWidth/2, screenY - roofHeight);
        ctx.lineTo(screenX, screenY - roofHeight * 2);
        ctx.closePath();
        ctx.fillStyle = '#654321';
        ctx.fill();

        if (this.familyName) {
            this.drawFamilyName(ctx, screenX, screenY, zoom);
        }
    }

    drawFamilyName(ctx, screenX, screenY, zoom) {
        const fontSize = this.calculateScaledSize(14, zoom);
        ctx.fillStyle = 'black';
        ctx.font = `bold ${fontSize}px Mojangles`;
        ctx.textAlign = 'center';
        ctx.fillText(this.familyName, screenX, screenY - this.calculateScaledSize(35, zoom));
        
        const nameWidth = ctx.measureText(this.familyName).width;
        const padding = this.calculateScaledSize(5, zoom);
        const boxHeight = this.calculateScaledSize(18, zoom);
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = this.calculateScaledSize(2, zoom);
        ctx.strokeRect(
            screenX - nameWidth/2 - padding,
            screenY - this.calculateScaledSize(48, zoom),
            nameWidth + padding * 2,
            boxHeight
        );
        
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(
            screenX - nameWidth/2 - padding,
            screenY - this.calculateScaledSize(48, zoom),
            nameWidth + padding * 2,
            boxHeight
        );
        
        ctx.fillStyle = '#333';
        ctx.fillText(this.familyName, screenX, screenY - this.calculateScaledSize(35, zoom));
    }

    update(deltaTime) {}
}

export class Store extends Building {
    constructor(x, y) {
        super(x, y);
        this.type = 'store';
        this.owner = null;
        this.employees = [];
        this.inventory = STORE_CONFIG.MAX_INVENTORY;
        this.customers = [];
        this.restockTimer = STORE_CONFIG.RESTOCK_INTERVAL;
        this.lastRestockTime = Date.now();
    }

    draw(ctx, offset, zoom) {
        const { x: screenX, y: screenY } = this.calculateScreenPosition(offset, zoom);
        
        // Draw main building
        ctx.fillStyle = STORE_COLORS.WALL;
        const width = this.calculateScaledSize(40, zoom);
        const height = this.calculateScaledSize(30, zoom);
        ctx.fillRect(screenX - width/2, screenY - height/2, width, height);
        
        // Draw roof
        ctx.beginPath();
        const roofWidth = this.calculateScaledSize(50, zoom);
        ctx.moveTo(screenX - roofWidth/2, screenY - height/2);
        ctx.lineTo(screenX + roofWidth/2, screenY - height/2);
        ctx.lineTo(screenX, screenY - this.calculateScaledSize(35, zoom));
        ctx.closePath();
        ctx.fillStyle = STORE_COLORS.ROOF;
        ctx.fill();
        
        // Draw door
        ctx.fillStyle = STORE_COLORS.DOOR;
        const doorWidth = this.calculateScaledSize(10, zoom);
        const doorHeight = this.calculateScaledSize(20, zoom);
        ctx.fillRect(
            screenX - doorWidth/2,
            screenY - doorHeight/2,
            doorWidth,
            doorHeight
        );
        
        // Draw inventory bar
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        const barWidth = this.calculateScaledSize(30, zoom);
        const barHeight = this.calculateScaledSize(3, zoom);
        ctx.fillRect(
            screenX - barWidth/2,
            screenY - this.calculateScaledSize(25, zoom),
            barWidth * (this.inventory / STORE_CONFIG.MAX_INVENTORY),
            barHeight
        );
    }

    /**
     * Updates store state including inventory management
     * @param {number} deltaTime - Time elapsed since last update in milliseconds
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update restock timer
        this.restockTimer -= deltaTime;
        
        // Handle restocking
        if (this.restockTimer <= 0) {
            this.restock();
            this.restockTimer = STORE_CONFIG.RESTOCK_INTERVAL;
        }
    }

    /**
     * Restocks the store inventory
     * @returns {number} Amount of inventory added
     */
    restock() {
        if (this.inventory >= STORE_CONFIG.MAX_INVENTORY) return 0;
        
        const oldInventory = this.inventory;
        this.inventory = Math.min(
            STORE_CONFIG.MAX_INVENTORY,
            this.inventory + STORE_CONFIG.RESTOCK_AMOUNT
        );
        
        const amountAdded = this.inventory - oldInventory;
        this.lastRestockTime = Date.now();
        
        return amountAdded;
    }

    /**
     * Checks if the store needs supplies
     * @returns {boolean} True if inventory is below threshold
     */
    needsSupplies() {
        return this.inventory < STORE_CONFIG.LOW_STOCK_THRESHOLD;
    }
}

export class PublicBuilding extends Building {
    constructor(x, y, type) {
        super(x, y);
        this._type = type;
        this.occupants = [];
        this._capacity = this.determineCapacity(type);
    }

    get type() {
        return this._type;
    }

    get capacity() {
        return this._capacity;
    }

    determineCapacity(type) {
        switch(type) {
            case 'school': return 30;
            case 'playground': return 15;
            case 'mall': return 50;
            default: return 20;
        }
    }

    draw(ctx, offset, zoom) {
        const { x: screenX, y: screenY } = this.calculateScreenPosition(offset, zoom);
        
        ctx.fillStyle = '#A0A0A0';
        ctx.fillRect(screenX - 25 * zoom, screenY - 25 * zoom, 50 * zoom, 50 * zoom);
        
        this.drawBuildingType(ctx, screenX, screenY, zoom);
        this.drawLabel(ctx, screenX, screenY, zoom);
    }

    drawBuildingType(ctx, screenX, screenY, zoom) {
        switch (this.type) {
            case 'school':
                this.drawSchool(ctx, screenX, screenY, zoom);
                break;
            case 'playground':
                this.drawPlayground(ctx, screenX, screenY, zoom);
                break;
            case 'mall':
                this.drawMall(ctx, screenX, screenY, zoom);
                break;
        }
    }

    drawLabel(ctx, screenX, screenY, zoom) {
        ctx.fillStyle = 'black';
        ctx.font = `${12 * zoom}px Mojangles`;
        ctx.textAlign = 'center';
        ctx.fillText(`${this.type.charAt(0).toUpperCase() + this.type.slice(1)}`, screenX, screenY - 30 * zoom);
        ctx.fillText(`(${this.occupants.length}/${this.capacity})`, screenX, screenY - 40 * zoom);
    }

    /**
     * Draws a school building with distinctive academic features
     */
    drawSchool(ctx, screenX, screenY, zoom) {
        // Main building
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1 * zoom;

        // Draw main building structure
        const width = 40 * zoom;
        const height = 30 * zoom;
        drawRoundedRect(ctx, screenX - width/2, screenY - height/2, width, height, 5 * zoom);
        ctx.fill();
        ctx.stroke();

        // Draw roof
        ctx.beginPath();
        ctx.moveTo(screenX - width/2 - 5 * zoom, screenY - height/2);
        ctx.lineTo(screenX, screenY - height/2 - 15 * zoom);
        ctx.lineTo(screenX + width/2 + 5 * zoom, screenY - height/2);
        ctx.fillStyle = '#8B4513';
        ctx.fill();

        // Draw windows
        ctx.fillStyle = '#87CEEB';
        const windowSize = 6 * zoom;
        for (let i = -1; i <= 1; i++) {
            drawRoundedRect(ctx, 
                screenX + i * (windowSize + 4 * zoom) - windowSize/2,
                screenY - windowSize/2,
                windowSize, windowSize,
                2 * zoom
            );
            ctx.fill();
            ctx.stroke();
        }
    }

    /**
     * Draws a playground with play equipment and safety features
     */
    drawPlayground(ctx, screenX, screenY, zoom) {
        // Base ground area
        ctx.fillStyle = '#90EE90';
        ctx.strokeStyle = '#228B22';
        ctx.lineWidth = 1 * zoom;

        // Draw safety mat area
        const baseSize = 35 * zoom;
        drawRoundedRect(ctx, screenX - baseSize/2, screenY - baseSize/2, baseSize, baseSize, 5 * zoom);
        ctx.fill();
        ctx.stroke();

        // Draw swing set frame
        ctx.beginPath();
        ctx.strokeStyle = '#4A4A4A';
        ctx.lineWidth = 2 * zoom;
        
        // Frame
        ctx.moveTo(screenX - 15 * zoom, screenY - 10 * zoom);
        ctx.lineTo(screenX, screenY - 15 * zoom);
        ctx.lineTo(screenX + 15 * zoom, screenY - 10 * zoom);
        
        // Swings
        ctx.moveTo(screenX - 8 * zoom, screenY - 12 * zoom);
        ctx.lineTo(screenX - 8 * zoom, screenY);
        ctx.moveTo(screenX + 8 * zoom, screenY - 12 * zoom);
        ctx.lineTo(screenX + 8 * zoom, screenY);
        
        ctx.stroke();
    }

    /**
     * Draws a mall with modern retail architecture
     */
    drawMall(ctx, screenX, screenY, zoom) {
        // Main structure
        ctx.fillStyle = '#B8860B';
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1 * zoom;

        // Draw main building
        const width = 45 * zoom;
        const height = 35 * zoom;
        drawRoundedRect(ctx, screenX - width/2, screenY - height/2, width, height, 8 * zoom);
        ctx.fill();
        ctx.stroke();

        // Draw entrance
        ctx.fillStyle = '#4682B4';
        const doorWidth = 15 * zoom;
        const doorHeight = 20 * zoom;
        drawRoundedRect(ctx,
            screenX - doorWidth/2,
            screenY + height/2 - doorHeight,
            doorWidth, doorHeight,
            3 * zoom
        );
        ctx.fill();
        ctx.stroke();

        // Draw sign
        ctx.fillStyle = '#FFD700';
        ctx.font = `${Math.floor(8 * zoom)}px Mojangles`;
        ctx.textAlign = 'center';
        ctx.fillText('MALL', screenX, screenY - height/2 + 10 * zoom);
    }
}

export class ResidentialBuilding extends PublicBuilding {
    constructor(x, y, type) {
        super(x, y, type);
        // Cache the calculated capacity
        this._capacity = this.calculateCapacity(type);
    }

    /**
     * Get the building's capacity
     * @returns {number} The cached capacity value
     */
    get capacity() {
        return this._capacity;
    }

    /**
     * Calculates initial capacity based on building type
     * @param {string} type - The type of residential building
     * @returns {number} The calculated capacity
     * @private
     */
    calculateCapacity(type) {
        const config = type === 'hotel' ?
            RESIDENTIAL_CONFIG.HOTEL :
            type === 'condo' ?
                RESIDENTIAL_CONFIG.CONDO :
                null;

        if (!config) return RESIDENTIAL_CONFIG.DEFAULT_CAPACITY;

        const range = (config.MAX_CAPACITY - config.MIN_CAPACITY) / config.STEP_SIZE;
        return Math.round(Math.random() * range) * config.STEP_SIZE + config.MIN_CAPACITY;
    }

    draw(ctx, offset, zoom) {
        const { x: screenX, y: screenY } = this.calculateScreenPosition(offset, zoom);
        
        ctx.fillStyle = this.type === 'hotel' ? '#4A90E2' : '#9B59B6';
        ctx.fillRect(screenX - 30 * zoom, screenY - 40 * zoom, 60 * zoom, 80 * zoom);
        
        // Draw windows
        ctx.fillStyle = '#FFF';
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                ctx.fillRect(screenX - 20 * zoom + j * 20 * zoom, screenY - 30 * zoom + i * 20 * zoom, 10 * zoom, 10 * zoom);
            }
        }
        
        this.drawLabel(ctx, screenX, screenY, zoom);
    }
}

// Bank configuration constants
const BANK_CONFIG = {
    DEFAULT_FUNDS: 10000,
    INTEREST_INTERVAL: 10000,  // 10 seconds
    LOAN_LIMIT: 5000,
    INTEREST_MARGIN: 0.024  // 2.4% margin above federal rate
};

export class Bank extends Building {
    static federalRate = 0.05;  // 5% default federal interest rate
    
    constructor(x, y) {
        super(x, y);
        this.type = 'bank';
        this.funds = BANK_CONFIG.DEFAULT_FUNDS;
        this.customers = [];
        this.loans = new Map();  // Map of customer ID to loan amount
        this.interestTimer = BANK_CONFIG.INTEREST_INTERVAL;
        this.lastInterestTime = Date.now();
    }
    
    /**
     * Gets the current interest rate (federal rate + margin)
     * @returns {number} The current interest rate
     */
    getInterestRate() {
        return Bank.federalRate + BANK_CONFIG.INTEREST_MARGIN;
    }

    /**
     * Deposits money into the bank
     * @param {number} amount - The amount to deposit
     * @returns {boolean} True if deposit was successful
     */
    deposit(amount) {
        if (amount <= 0) return false;
        
        this.funds += amount;
        return true;
    }

    /**
     * Withdraws money from the bank
     * @param {number} amount - The amount to withdraw
     * @returns {boolean} True if withdrawal was successful
     */
    withdraw(amount) {
        if (amount <= 0 || amount > this.funds) return false;
        
        this.funds -= amount;
        return true;
    }

    /**
     * Issues a loan to a customer
     * @param {string} customerId - The ID of the customer
     * @param {number} amount - The loan amount
     * @returns {boolean} True if loan was issued successfully
     */
    issueLoan(customerId, amount) {
        if (amount <= 0 || amount > BANK_CONFIG.LOAN_LIMIT) return false;
        if (this.loans.has(customerId)) return false;  // Customer already has a loan
        if (amount > this.funds) return false;  // Bank doesn't have enough funds
        
        this.loans.set(customerId, amount);
        this.funds -= amount;
        return true;
    }

    /**
     * Repays a loan (partial or full)
     * @param {string} customerId - The ID of the customer
     * @param {number} amount - The amount to repay
     * @returns {boolean} True if repayment was successful
     */
    repayLoan(customerId, amount) {
        if (!this.loans.has(customerId) || amount <= 0) return false;
        
        const loanAmount = this.loans.get(customerId);
        const repayment = Math.min(amount, loanAmount);
        
        this.loans.set(customerId, loanAmount - repayment);
        this.funds += repayment;
        
        // Remove loan if fully repaid
        if (this.loans.get(customerId) === 0) {
            this.loans.delete(customerId);
        }
        
        return true;
    }

    /**
     * Calculates and applies interest to all loans
     */
    applyInterest() {
        for (const [customerId, amount] of this.loans.entries()) {
            const interest = amount * this.getInterestRate();
            this.loans.set(customerId, amount + interest);
        }
        this.lastInterestTime = Date.now();
    }

    /**
     * Updates bank state including interest calculation
     * @param {number} deltaTime - Time elapsed since last update in milliseconds
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update interest timer
        this.interestTimer -= deltaTime;
        
        // Apply interest when timer expires
        if (this.interestTimer <= 0) {
            this.applyInterest();
            this.interestTimer = BANK_CONFIG.INTEREST_INTERVAL;
        }
    }

    /**
     * Draws the bank building
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     * @param {Object} offset - The camera offset
     * @param {number} zoom - The current zoom level
     */
    draw(ctx, offset, zoom) {
        const { x: screenX, y: screenY } = this.calculateScreenPosition(offset, zoom);
        
        // Draw main building
        ctx.fillStyle = '#E6E6FA';  // Light lavender color
        const width = this.calculateScaledSize(45, zoom);
        const height = this.calculateScaledSize(35, zoom);
        
        // Draw building with columns
        ctx.fillRect(screenX - width/2, screenY - height/2, width, height);
        
        // Draw columns
        ctx.fillStyle = '#FFFFFF';
        const columnWidth = this.calculateScaledSize(5, zoom);
        const columnSpacing = this.calculateScaledSize(10, zoom);
        
        for (let i = -2; i <= 2; i++) {
            ctx.fillRect(
                screenX + i * columnSpacing - columnWidth/2,
                screenY - height/2,
                columnWidth,
                height
            );
        }
        
        // Draw roof/pediment
        ctx.beginPath();
        const roofWidth = this.calculateScaledSize(55, zoom);
        const roofHeight = this.calculateScaledSize(15, zoom);
        ctx.moveTo(screenX - roofWidth/2, screenY - height/2);
        ctx.lineTo(screenX, screenY - height/2 - roofHeight);
        ctx.lineTo(screenX + roofWidth/2, screenY - height/2);
        ctx.closePath();
        ctx.fillStyle = '#D8BFD8';  // Lighter lavender for roof
        ctx.fill();
        
        // Draw steps
        ctx.fillStyle = '#DCDCDC';
        const stepsWidth = this.calculateScaledSize(35, zoom);
        const stepsHeight = this.calculateScaledSize(5, zoom);
        ctx.fillRect(
            screenX - stepsWidth/2,
            screenY + height/2,
            stepsWidth,
            stepsHeight
        );
        
        // Draw bank sign
        ctx.fillStyle = '#4B0082';  // Indigo
        ctx.font = `bold ${this.calculateScaledSize(12, zoom)}px Mojangles`;
        ctx.textAlign = 'center';
        ctx.fillText('BANK', screenX, screenY);
        
        // Draw funds indicator
        const fundsText = `$${this.funds.toLocaleString()}`;
        ctx.font = `${this.calculateScaledSize(10, zoom)}px Mojangles`;
        ctx.fillText(fundsText, screenX, screenY + this.calculateScaledSize(15, zoom));
        
        // Draw loan count
        if (this.loans.size > 0) {
            ctx.fillText(`Loans: ${this.loans.size}`, screenX, screenY + this.calculateScaledSize(25, zoom));
        }
    }
}
