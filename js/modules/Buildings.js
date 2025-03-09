import { Person } from './person/Person.js';
import { OBJECT_POOL } from './gameState.js';
import { drawRoundedRect } from './utils.js';

export const STORE_COLORS = {
    WALL: '#98FB98',
    ROOF: '#32CD32',
    DOOR: '#228B22',
    // Add new colors for food buildings
    GROCERY_WALL: '#F0E68C',
    SUPERMARKET_WALL: '#87CEEB',
    DINER_WALL: '#FFB6C1',
    RESTAURANT_WALL: '#DDA0DD'
};

// Store constants
const STORE_CONFIG = {
    MAX_INVENTORY: 100,
    MIN_INVENTORY: 0,
    RESTOCK_AMOUNT: 5,
    RESTOCK_INTERVAL: 5000,  // 5 seconds
    LOW_STOCK_THRESHOLD: 20
};

// Add new configuration constants
const FOOD_BUILDING_CONFIG = {
    GROCERY_STORE: {
        MAX_INVENTORY: 75,
        RESTOCK_AMOUNT: 5,
        RESTOCK_INTERVAL: 4000,  // 4 seconds
        LOW_STOCK_THRESHOLD: 15,
        FOOD_PRODUCTION: 0.15    // Food production rate per update
    },
    SUPERMARKET: {
        MAX_INVENTORY: 150,
        RESTOCK_AMOUNT: 10,
        RESTOCK_INTERVAL: 3000,  // 3 seconds
        LOW_STOCK_THRESHOLD: 30,
        FOOD_PRODUCTION: 0.25    // Higher food production rate
    },
    DINER: {
        MAX_INVENTORY: 50,
        RESTOCK_AMOUNT: 3,
        RESTOCK_INTERVAL: 2000,  // 2 seconds
        LOW_STOCK_THRESHOLD: 10,
        FOOD_PRODUCTION: 0.1,    // Lower but faster food production
        MAX_SEATS: 20
    },
    RESTAURANT: {
        MAX_INVENTORY: 60,
        RESTOCK_AMOUNT: 4,
        RESTOCK_INTERVAL: 2500,  // 2.5 seconds
        LOW_STOCK_THRESHOLD: 12,
        FOOD_PRODUCTION: 0.12,   // Moderate food production
        MAX_SEATS: 30
    }
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
    INTEREST_MARGIN: 0.025  // 2.5% margin above federal rate
};

// Add new configuration constants for accounts
const ACCOUNT_CONFIG = {
    CHECKING: {
        MIN_BALANCE: 0,
        INTEREST_RATE: 0.001  // 0.1% interest rate for checking
    },
    SAVINGS: {
        MIN_BALANCE: 100,     // Minimum balance requirement
        INTEREST_RATE: 0.02   // 2% interest rate for savings
    }
};

class BankAccount {
    constructor(type, initialDeposit = 0) {
        this.type = type;
        this.balance = initialDeposit;
        this.createdAt = Date.now();
        this.lastInterestApplied = Date.now();
    }
}

export class Bank extends Building {
    static federalRate = 0.05;  // 5% default federal rate
    
    constructor(x, y) {
        super(x, y);
        this.type = 'bank';
        this.funds = BANK_CONFIG.DEFAULT_FUNDS;
        this.loans = new Map();  // Map of customer ULID to loan amount
        this.interestTimer = BANK_CONFIG.INTEREST_INTERVAL;
        this.lastInterestTime = Date.now();
        
        // New properties for customer accounts
        this.accounts = new Map(); // Map of ULID to array of accounts
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
     * Creates a new account for an NPC
     * @param {string} ulid - The NPC's ULID
     * @param {string} accountType - Either 'checking' or 'savings'
     * @param {number} initialDeposit - Initial deposit amount
     * @returns {boolean} True if account creation was successful
     */
    createAccount(ulid, accountType, initialDeposit = 0) {
        if (!ulid || !['checking', 'savings'].includes(accountType)) {
            return false;
        }

        const config = ACCOUNT_CONFIG[accountType.toUpperCase()];
        if (initialDeposit < config.MIN_BALANCE) {
            return false;
        }

        if (!this.accounts.has(ulid)) {
            this.accounts.set(ulid, []);
        }

        const customerAccounts = this.accounts.get(ulid);
        const newAccount = new BankAccount(accountType, initialDeposit);
        customerAccounts.push(newAccount);
        this.funds += initialDeposit;

        return true;
    }

    /**
     * Gets all accounts for an NPC
     * @param {string} ulid - The NPC's ULID
     * @returns {Array} Array of accounts or empty array if none found
     */
    getAccounts(ulid) {
        return this.accounts.get(ulid) || [];
    }

    /**
     * Deposits money into a specific account
     * @param {string} ulid - The NPC's ULID
     * @param {number} accountIndex - Index of the account
     * @param {number} amount - Amount to deposit
     * @returns {boolean} True if deposit was successful
     */
    depositToAccount(ulid, accountIndex, amount) {
        if (amount <= 0) return false;
        
        const accounts = this.accounts.get(ulid);
        if (!accounts || !accounts[accountIndex]) return false;

        accounts[accountIndex].balance += amount;
        this.funds += amount;
        return true;
    }

    /**
     * Withdraws money from a specific account
     * @param {string} ulid - The NPC's ULID
     * @param {number} accountIndex - Index of the account
     * @param {number} amount - Amount to withdraw
     * @returns {boolean} True if withdrawal was successful
     */
    withdrawFromAccount(ulid, accountIndex, amount) {
        if (amount <= 0) return false;
        
        const accounts = this.accounts.get(ulid);
        if (!accounts || !accounts[accountIndex]) return false;

        const account = accounts[accountIndex];
        const config = ACCOUNT_CONFIG[account.type.toUpperCase()];
        
        // Check if withdrawal would put account below minimum balance
        if (account.balance - amount < config.MIN_BALANCE) return false;

        account.balance -= amount;
        this.funds -= amount;
        return true;
    }

    /**
     * Gets the balance of a specific account
     * @param {string} ulid - The NPC's ULID
     * @param {number} accountIndex - Index of the account
     * @returns {number|null} Account balance or null if account not found
     */
    getAccountBalance(ulid, accountIndex) {
        const accounts = this.accounts.get(ulid);
        if (!accounts || !accounts[accountIndex]) return null;
        return accounts[accountIndex].balance;
    }

    /**
     * Applies interest to all accounts
     * @param {boolean} forceApply - Force apply interest regardless of time interval
     */
    applyAccountInterest(forceApply = false) {
        const now = Date.now();
        for (const [ulid, accounts] of this.accounts.entries()) {
            for (const account of accounts) {
                const timeDiff = now - account.lastInterestApplied;
                if (forceApply || timeDiff >= BANK_CONFIG.INTEREST_INTERVAL) {
                    const config = ACCOUNT_CONFIG[account.type.toUpperCase()];
                    const interest = account.balance * config.INTEREST_RATE;
                    account.balance += interest;
                    this.funds += interest;
                    account.lastInterestApplied = now;
                }
            }
        }
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
            this.applyAccountInterest(true); // Force apply interest in tests
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

        // Display total accounts
        const totalAccounts = Array.from(this.accounts.values()).reduce((sum, accounts) => sum + accounts.length, 0);
        ctx.fillStyle = '#000';
        ctx.font = `${this.calculateScaledSize(8, zoom)}px Arial`;
        ctx.fillText(`Accounts: ${totalAccounts}`, screenX, screenY + this.calculateScaledSize(35, zoom));
    }
}

export class GroceryStore extends Store {
    constructor(x, y) {
        super(x, y);
        this.type = 'grocery';
        this.inventory = FOOD_BUILDING_CONFIG.GROCERY_STORE.MAX_INVENTORY;
        this.restockTimer = FOOD_BUILDING_CONFIG.GROCERY_STORE.RESTOCK_INTERVAL;
        this.config = FOOD_BUILDING_CONFIG.GROCERY_STORE;
    }

    draw(ctx, offset, zoom) {
        const { x: screenX, y: screenY } = this.calculateScreenPosition(offset, zoom);
        
        // Draw main building
        ctx.fillStyle = STORE_COLORS.GROCERY_WALL;
        const width = this.calculateScaledSize(45, zoom);
        const height = this.calculateScaledSize(35, zoom);
        ctx.fillRect(screenX - width/2, screenY - height/2, width, height);
        
        // Draw roof and door similar to parent Store class
        this.drawRoofAndDoor(ctx, screenX, screenY, zoom);
        
        // Draw "GROCERY" text
        ctx.fillStyle = '#333';
        ctx.font = `${this.calculateScaledSize(8, zoom)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('GROCERY', screenX, screenY);
        
        // Draw inventory bar
        this.drawInventoryBar(ctx, screenX, screenY, zoom);
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (this.town) {
            this.town.resources.food += this.config.FOOD_PRODUCTION * deltaTime;
        }
    }
}

export class Supermarket extends Store {
    constructor(x, y) {
        super(x, y);
        this.type = 'supermarket';
        this.inventory = FOOD_BUILDING_CONFIG.SUPERMARKET.MAX_INVENTORY;
        this.restockTimer = FOOD_BUILDING_CONFIG.SUPERMARKET.RESTOCK_INTERVAL;
        this.config = FOOD_BUILDING_CONFIG.SUPERMARKET;
        this.departments = ['produce', 'meat', 'dairy', 'bakery'];
    }

    draw(ctx, offset, zoom) {
        const { x: screenX, y: screenY } = this.calculateScreenPosition(offset, zoom);
        
        // Draw larger building
        ctx.fillStyle = STORE_COLORS.SUPERMARKET_WALL;
        const width = this.calculateScaledSize(60, zoom);
        const height = this.calculateScaledSize(45, zoom);
        ctx.fillRect(screenX - width/2, screenY - height/2, width, height);
        
        this.drawRoofAndDoor(ctx, screenX, screenY, zoom);
        
        // Draw "SUPERMARKET" text
        ctx.fillStyle = '#333';
        ctx.font = `${this.calculateScaledSize(8, zoom)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('SUPERMARKET', screenX, screenY);
        
        this.drawInventoryBar(ctx, screenX, screenY, zoom);
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (this.town) {
            this.town.resources.food += this.config.FOOD_PRODUCTION * deltaTime;
        }
    }
}

export class Diner extends Store {
    constructor(x, y) {
        super(x, y);
        this.type = 'diner';
        this.inventory = FOOD_BUILDING_CONFIG.DINER.MAX_INVENTORY;
        this.restockTimer = FOOD_BUILDING_CONFIG.DINER.RESTOCK_INTERVAL;
        this.config = FOOD_BUILDING_CONFIG.DINER;
        this.currentCustomers = 0;
        this.tables = Array(Math.floor(this.config.MAX_SEATS / 4)).fill(false); // 4 seats per table
    }

    draw(ctx, offset, zoom) {
        const { x: screenX, y: screenY } = this.calculateScreenPosition(offset, zoom);
        
        // Draw retro diner style building
        ctx.fillStyle = STORE_COLORS.DINER_WALL;
        const width = this.calculateScaledSize(40, zoom);
        const height = this.calculateScaledSize(30, zoom);
        
        // Draw rounded corners for retro look
        drawRoundedRect(ctx, screenX - width/2, screenY - height/2, width, height, 5 * zoom);
        
        // Draw "DINER" text
        ctx.fillStyle = '#333';
        ctx.font = `${this.calculateScaledSize(8, zoom)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('DINER', screenX, screenY);
        
        this.drawInventoryBar(ctx, screenX, screenY, zoom);
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (this.town) {
            this.town.resources.food += this.config.FOOD_PRODUCTION * deltaTime;
        }
    }
}

export class Restaurant extends Store {
    constructor(x, y) {
        super(x, y);
        this.type = 'restaurant';
        this.inventory = FOOD_BUILDING_CONFIG.RESTAURANT.MAX_INVENTORY;
        this.restockTimer = FOOD_BUILDING_CONFIG.RESTAURANT.RESTOCK_INTERVAL;
        this.config = FOOD_BUILDING_CONFIG.RESTAURANT;
        this.currentCustomers = 0;
        this.tables = Array(Math.floor(this.config.MAX_SEATS / 2)).fill(false); // 2 seats per table
        this.rating = 5; // 1-5 star rating
    }

    draw(ctx, offset, zoom) {
        const { x: screenX, y: screenY } = this.calculateScreenPosition(offset, zoom);
        
        // Draw upscale restaurant building
        ctx.fillStyle = STORE_COLORS.RESTAURANT_WALL;
        const width = this.calculateScaledSize(50, zoom);
        const height = this.calculateScaledSize(40, zoom);
        ctx.fillRect(screenX - width/2, screenY - height/2, width, height);
        
        // Draw fancy entrance
        ctx.fillStyle = STORE_COLORS.DOOR;
        const entranceWidth = this.calculateScaledSize(15, zoom);
        const entranceHeight = this.calculateScaledSize(20, zoom);
        drawRoundedRect(ctx, screenX - entranceWidth/2, screenY - entranceHeight/2, entranceWidth, entranceHeight, 3 * zoom);
        
        // Draw "RESTAURANT" text
        ctx.fillStyle = '#333';
        ctx.font = `${this.calculateScaledSize(8, zoom)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('RESTAURANT', screenX, screenY);
        
        // Draw star rating
        this.drawStarRating(ctx, screenX, screenY, zoom);
        
        this.drawInventoryBar(ctx, screenX, screenY, zoom);
    }

    drawStarRating(ctx, screenX, screenY, zoom) {
        const starSize = this.calculateScaledSize(5, zoom);
        const startX = screenX - (starSize * 5) / 2;
        
        ctx.fillStyle = '#FFD700'; // Gold color for stars
        for (let i = 0; i < this.rating; i++) {
            ctx.fillText('★', startX + (i * starSize), screenY + this.calculateScaledSize(15, zoom));
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (this.town) {
            this.town.resources.food += this.config.FOOD_PRODUCTION * deltaTime;
            // Occasionally update rating based on town happiness
            if (Math.random() < 0.01) {
                this.rating = Math.max(1, Math.min(5, Math.floor(this.town.happiness / 20)));
            }
        }
    }
}
