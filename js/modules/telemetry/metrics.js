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
        const response = await fetch(`http://localhost:${process.env.JAEGER_COLLECTOR_OTLP_HTTP || 4318}/health`);
        if (!response.ok) {
            console.log('Jaeger not available, metrics disabled');
            return;
        }

        meter = metrics.getMeter('person-simulation');
        
        // Initialize metrics
        personCreatedCounter = meter.createCounter('person.created', {
            description: 'Number of people created'
        });
        
        personDeathCounter = meter.createCounter('person.death', {
            description: 'Number of people who died'
        });
        
        occupationChangeCounter = meter.createCounter('person.occupation_change', {
            description: 'Number of occupation changes'
        });
        
        populationGauge = meter.createObservableGauge('person.population', {
            description: 'Current total population'
        });
        
        averageAgeGauge = meter.createObservableGauge('person.average_age', {
            description: 'Average age of population'
        });
        
        personAgeHistogram = meter.createHistogram('person.age_distribution', {
            description: 'Distribution of person ages'
        });
        
        wageDistributionHistogram = meter.createHistogram('person.wage_distribution', {
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
        case 'person.created':
            personCreatedCounter?.add(1, attributes);
            break;
        case 'person.death':
            personDeathCounter?.add(1, attributes);
            break;
        case 'person.occupation_change':
            occupationChangeCounter?.add(1, attributes);
            break;
        case 'person.age':
            personAgeHistogram?.record(value, attributes);
            break;
        case 'person.wage':
            wageDistributionHistogram?.record(value, attributes);
            break;
    }
}

export function isMetricsEnabled() {
    return metricsEnabled;
}