import { Building } from '../Building.js';
import { drawRoundedRect } from '../../utils.js';

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
