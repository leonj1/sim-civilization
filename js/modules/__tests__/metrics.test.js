import { initializeMetrics, recordMetric, isMetricsEnabled } from '../telemetry/metrics.js';

// Mock fetch globally
global.fetch = jest.fn();

describe('Metrics', () => {
    // Mock OpenTelemetry API
    const mockCounter = {
        add: jest.fn()
    };
    const mockHistogram = {
        record: jest.fn()
    };
    const mockMeter = {
        createCounter: jest.fn().mockReturnValue(mockCounter),
        createHistogram: jest.fn().mockReturnValue(mockHistogram),
        createObservableGauge: jest.fn()
    };
    const mockMetrics = {
        getMeter: jest.fn().mockReturnValue(mockMeter)
    };

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        // Reset module state
        jest.resetModules();
        
        // Mock OpenTelemetry API import
        jest.mock('@opentelemetry/api', () => {
            return {
                metrics: mockMetrics
            };
        });
    });

    describe('when Jaeger is offline', () => {
        beforeEach(async () => {
            // Mock failed connection to Jaeger
            global.fetch.mockRejectedValueOnce(new Error('Connection refused'));
            await initializeMetrics();
        });

        test('metrics should be disabled', () => {
            expect(isMetricsEnabled()).toBe(false);
        });

        test('recordMetric should not create metrics', () => {
            recordMetric('person.created', 1, { gender: 'male' });
            
            expect(mockCounter.add).not.toHaveBeenCalled();
            expect(mockHistogram.record).not.toHaveBeenCalled();
        });

        test('multiple metric records should not throw errors', () => {
            expect(() => {
                recordMetric('person.created', 1);
                recordMetric('person.death', 1);
                recordMetric('person.age', 25);
            }).not.toThrow();
        });
    });

    describe('when Jaeger is online', () => {
        beforeEach(async () => {
            // Mock successful connection to Jaeger
            global.fetch.mockResolvedValueOnce({
                ok: true
            });
            await initializeMetrics();
        });

        test('metrics should be enabled', () => {
            expect(isMetricsEnabled()).toBe(true);
        });

        test('recordMetric should create counter metrics', () => {
            recordMetric('person.created', 1, { gender: 'male' });
            
            expect(mockCounter.add).toHaveBeenCalledWith(1, { gender: 'male' });
        });

        test('recordMetric should create histogram metrics', () => {
            recordMetric('person.age', 25, { occupation: 'Farmer' });
            
            expect(mockHistogram.record).toHaveBeenCalledWith(25, { occupation: 'Farmer' });
        });
    });

    describe('error handling', () => {
        test('should handle Jaeger connection timeout', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Timeout'));
            await initializeMetrics();
            
            expect(isMetricsEnabled()).toBe(false);
        });

        test('should handle invalid Jaeger response', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 500
            });
            await initializeMetrics();
            
            expect(isMetricsEnabled()).toBe(false);
        });

        test('should handle OpenTelemetry API initialization failure', async () => {
            mockMetrics.getMeter.mockImplementationOnce(() => {
                throw new Error('Failed to initialize meter');
            });
            
            global.fetch.mockResolvedValueOnce({
                ok: true
            });
            
            await initializeMetrics();
            
            expect(isMetricsEnabled()).toBe(false);
        });
    });
});
