// Define metric name constants to avoid string literals
export const METRIC_NAMES = {
    PERSON_CREATED: 'person.created',
    PERSON_DEATH: 'person.death',
    OCCUPATION_CHANGE: 'person.occupation_change',
    PERSON_AGE: 'person.age',
    PERSON_WAGE: 'person.wage',
    POPULATION: 'person.population'
};

let metricsEnabled = false;
let meter = null;

// Counters
let personCreatedCounter = null;
let personDeathCounter = null;
let occupationChangeCounter = null;

// Gauges
let populationGauge = null;
let averageAgeGauge = null;

// Histograms
let personAgeHistogram = null;
let wageDistributionHistogram = null;

export async function initializeMetrics() {
    try {
        const { metrics } = await import('@opentelemetry/api');
        
        // Try to connect to Jaeger
        // Extract port from URL or use the value directly if it's just a port
        let jaegerUrl = process.env.JAEGER_COLLECTOR_OTLP_HTTP || '4318';
        
        // If it's a full URL, use it directly, otherwise construct localhost URL with port
        if (jaegerUrl.startsWith('http')) {
            jaegerUrl = `${jaegerUrl}/health`;
        } else {
            jaegerUrl = `http://localhost:${jaegerUrl}/health`;
        }
        
        const response = await fetch(jaegerUrl);
        if (!response.ok) {
            console.log('Jaeger not available, metrics disabled');
            metricsEnabled = false;
            return;
        }

        meter = metrics.getMeter('person-simulation');
        
        // Initialize metrics
        personCreatedCounter = meter.createCounter(METRIC_NAMES.PERSON_CREATED, {
            description: 'Number of people created'
        });
        
        personDeathCounter = meter.createCounter(METRIC_NAMES.PERSON_DEATH, {
            description: 'Number of people who died'
        });
        
        occupationChangeCounter = meter.createCounter(METRIC_NAMES.OCCUPATION_CHANGE, {
            description: 'Number of occupation changes'
        });
        
        populationGauge = meter.createObservableGauge(METRIC_NAMES.POPULATION, {
            description: 'Current total population'
        }, (observableResult) => {
            // Get current population from game state
            const { towns } = require('../gameState.js');
            const population = towns.reduce((total, town) => total + town.population, 0);
            observableResult.observe(population);
        });
        
        averageAgeGauge = meter.createObservableGauge(METRIC_NAMES.PERSON_AGE + '_average', {
            description: 'Average age of population'
        }, (observableResult) => {
            // Calculate the average age from game state
            const { towns } = require('../gameState.js');
            const allPeople = towns.flatMap(town => town.people);
            const avgAge = allPeople.length > 0 ? 
                allPeople.reduce((sum, person) => sum + person.age, 0) / allPeople.length : 0;
            observableResult.observe(avgAge);
        });
        
        personAgeHistogram = meter.createHistogram(METRIC_NAMES.PERSON_AGE + '_distribution', {
            description: 'Distribution of person ages'
        });
        
        wageDistributionHistogram = meter.createHistogram(METRIC_NAMES.PERSON_WAGE + '_distribution', {
            description: 'Distribution of wages'
        });

        metricsEnabled = true;
        console.log('Metrics initialized successfully');
    } catch (error) {
        console.log('Failed to initialize metrics:', error);
        metricsEnabled = false;
    }
}

export function recordMetric(metricName, value, attributes = {}) {
    if (!metricsEnabled) return;

    switch (metricName) {
        case METRIC_NAMES.PERSON_CREATED:
            personCreatedCounter?.add(1, attributes);
            break;
        case METRIC_NAMES.PERSON_DEATH:
            personDeathCounter?.add(1, attributes);
            break;
        case METRIC_NAMES.OCCUPATION_CHANGE:
            occupationChangeCounter?.add(1, attributes);
            break;
        case METRIC_NAMES.PERSON_AGE:
            personAgeHistogram?.record(value, attributes);
            break;
        case METRIC_NAMES.PERSON_WAGE:
            wageDistributionHistogram?.record(value, attributes);
            break;
        default:
            console.warn(`Unknown metric name: ${metricName}`);
            break;
    }
}

export function isMetricsEnabled() {
    return metricsEnabled;
}
