// Constants for the simulation

export const TRAITS = {
  FAST: 'FAST',
  STRONG: 'STRONG',
  WISE: 'WISE',
  GREEN_THUMB: 'GREEN_THUMB',
  GIANT: 'GIANT'
};

export const COLORS = {
  WATER: 'blue',
  GRASS: 'green',
  SAND: 'yellow',
  MOUNTAIN: 'gray'
};

export const OCCUPATION_WAGES = {
    'Doctor': 50,      // Highest wage due to skill/education
    'Guard': 30,       // Security is important
    'Builder': 35,     // Skilled labor
    'Farmer': 25,      // Essential but common
    'Merchant': 40,    // Business oriented
    'Teacher': 35,     // Education focused
    'Priest': 30,      // Community service
    'Artist': 25,      // Creative work
    'Child': 0         // No wage for children
};

// How often wages are paid (in milliseconds)
export const WAGE_PAYMENT_INTERVAL = 10000; // 10 seconds

export const OCCUPATIONS = {
    CASHIER: 'Cashier',
    SUPPLIER: 'Supplier',
    CHILD: 'Child',
    FARMER: 'Farmer',
    BUILDER: 'Builder',
    GUARD: 'Guard',
    DOCTOR: 'Doctor',
    MERCHANT: 'Merchant',
    TEACHER: 'Teacher',
    PRIEST: 'Priest',
    ARTIST: 'Artist',
    UNEMPLOYED: 'Unemployed'
};

export const AGE_THRESHOLDS = {
    CHILD: 12,
    TEEN: 13,
    ADULT: 18
};
