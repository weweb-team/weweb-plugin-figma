// Performance tracking utilities inspired by FigmaToCode

interface PerformanceMetric {
    name: string;
    totalTime: number;
    callCount: number;
    averageTime: number;
}

interface ConversionStats {
    totalTime: number;
    nodeCount: number;
    variableResolutions: number;
    imageExtractions: number;
    cacheHits: number;
    cacheMisses: number;
}

export class PerformanceTracker {
    private static instance: PerformanceTracker;
    private metrics: Map<string, { totalTime: number; callCount: number }> = new Map();
    private startTimes: Map<string, number> = new Map();
    private conversionStats: ConversionStats = {
        totalTime: 0,
        nodeCount: 0,
        variableResolutions: 0,
        imageExtractions: 0,
        cacheHits: 0,
        cacheMisses: 0,
    };

    private constructor() {}

    static getInstance(): PerformanceTracker {
        if (!PerformanceTracker.instance) {
            PerformanceTracker.instance = new PerformanceTracker();
        }
        return PerformanceTracker.instance;
    }

    /**
     * Start timing an operation
     */
    startTimer(operationName: string): void {
        this.startTimes.set(operationName, Date.now());
    }

    /**
     * End timing an operation and record the duration
     */
    endTimer(operationName: string): number {
        const startTime = this.startTimes.get(operationName);
        if (!startTime) {
            console.warn(`No start time found for operation: ${operationName}`);
            return 0;
        }

        const duration = Date.now() - startTime;
        this.recordMetric(operationName, duration);
        this.startTimes.delete(operationName);
        return duration;
    }

    /**
     * Time a function execution
     */
    async timeFunction<T>(operationName: string, fn: () => Promise<T>): Promise<T> {
        this.startTimer(operationName);
        try {
            const result = await fn();
            this.endTimer(operationName);
            return result;
        } catch (error) {
            this.endTimer(operationName);
            throw error;
        }
    }

    /**
     * Time a synchronous function execution
     */
    timeFunctionSync<T>(operationName: string, fn: () => T): T {
        this.startTimer(operationName);
        try {
            const result = fn();
            this.endTimer(operationName);
            return result;
        } catch (error) {
            this.endTimer(operationName);
            throw error;
        }
    }

    /**
     * Record a metric manually
     */
    recordMetric(name: string, duration: number): void {
        const existing = this.metrics.get(name) || { totalTime: 0, callCount: 0 };
        existing.totalTime += duration;
        existing.callCount += 1;
        this.metrics.set(name, existing);
    }

    /**
     * Increment a counter
     */
    incrementCounter(counterName: keyof ConversionStats): void {
        if (counterName === 'totalTime')
            return; // This should be calculated

        this.conversionStats[counterName] += 1;
    }

    /**
     * Record cache hit
     */
    recordCacheHit(): void {
        this.conversionStats.cacheHits += 1;
    }

    /**
     * Record cache miss
     */
    recordCacheMiss(): void {
        this.conversionStats.cacheMisses += 1;
    }

    /**
     * Set total conversion time
     */
    setTotalTime(time: number): void {
        this.conversionStats.totalTime = time;
    }

    /**
     * Get all performance metrics
     */
    getMetrics(): PerformanceMetric[] {
        return Array.from(this.metrics.entries()).map(([name, data]) => ({
            name,
            totalTime: data.totalTime,
            callCount: data.callCount,
            averageTime: data.callCount > 0 ? data.totalTime / data.callCount : 0,
        }));
    }

    /**
     * Get conversion statistics
     */
    getConversionStats(): ConversionStats {
        return { ...this.conversionStats };
    }

    /**
     * Get cache efficiency
     */
    getCacheEfficiency(): { hitRate: number; missRate: number; totalAccess: number } {
        const total = this.conversionStats.cacheHits + this.conversionStats.cacheMisses;
        return {
            hitRate: total > 0 ? this.conversionStats.cacheHits / total : 0,
            missRate: total > 0 ? this.conversionStats.cacheMisses / total : 0,
            totalAccess: total,
        };
    }

    /**
     * Log performance summary to console
     */
    logSummary(): void {
        const stats = this.getConversionStats();
        const metrics = this.getMetrics();
        const cacheStats = this.getCacheEfficiency();

        console.log('=== WeWeb Conversion Performance Summary ===');
        console.log(`Total conversion time: ${stats.totalTime}ms`);
        console.log(`Nodes processed: ${stats.nodeCount}`);
        console.log(`Variable resolutions: ${stats.variableResolutions}`);
        console.log(`Image extractions: ${stats.imageExtractions}`);
        console.log(`Cache hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}% (${stats.cacheHits}/${stats.cacheHits + stats.cacheMisses})`);

        if (metrics.length > 0) {
            console.log('\n=== Detailed Metrics ===');
            metrics
                .sort((a, b) => b.totalTime - a.totalTime)
                .forEach((metric) => {
                    console.log(
                        `${metric.name}: ${metric.totalTime}ms (${metric.callCount} calls, avg: ${metric.averageTime.toFixed(2)}ms)`,
                    );
                });
        }

        console.log('==========================================');
    }

    /**
     * Reset all metrics and stats
     */
    reset(): void {
        this.metrics.clear();
        this.startTimes.clear();
        this.conversionStats = {
            totalTime: 0,
            nodeCount: 0,
            variableResolutions: 0,
            imageExtractions: 0,
            cacheHits: 0,
            cacheMisses: 0,
        };
    }

    /**
     * Create a scoped timer for automatic cleanup
     */
    createScopedTimer(operationName: string) {
        this.startTimer(operationName);
        return {
            end: () => this.endTimer(operationName),
        };
    }

    /**
     * Decorator for timing method calls
     */
    static timed(operationName?: string) {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const originalMethod = descriptor.value;
            const name = operationName || `${target.constructor.name}.${propertyKey}`;

            descriptor.value = async function (...args: any[]) {
                const tracker = PerformanceTracker.getInstance();
                return await tracker.timeFunction(name, () => originalMethod.apply(this, args));
            };

            return descriptor;
        };
    }

    /**
     * Get performance metrics in a format suitable for UI display
     */
    getUIMetrics(): {
        summary: ConversionStats & { cacheHitRate: number };
        details: PerformanceMetric[];
        slowest: PerformanceMetric[];
        mostCalled: PerformanceMetric[];
    } {
        const stats = this.getConversionStats();
        const metrics = this.getMetrics();
        const cacheStats = this.getCacheEfficiency();

        return {
            summary: {
                ...stats,
                cacheHitRate: cacheStats.hitRate,
            },
            details: metrics,
            slowest: metrics
                .filter((m) => m.totalTime > 0)
                .sort((a, b) => b.totalTime - a.totalTime)
                .slice(0, 5),
            mostCalled: metrics
                .filter((m) => m.callCount > 1)
                .sort((a, b) => b.callCount - a.callCount)
                .slice(0, 5),
        };
    }
}

/**
 * Utility functions for common performance tracking patterns
 */
export class PerformanceUtils {
    private static tracker = PerformanceTracker.getInstance();

    /**
     * Time node conversion
     */
    static async timeNodeConversion<T>(
        nodeType: string,
        nodeId: string,
        fn: () => Promise<T>,
    ): Promise<T> {
        const operationName = `convert-${nodeType}-${nodeId}`;
        this.tracker.incrementCounter('nodeCount');
        return await this.tracker.timeFunction(operationName, fn);
    }

    /**
     * Time variable resolution
     */
    static timeVariableResolution<T>(variableId: string, fn: () => T): T {
        const operationName = `resolve-variable-${variableId}`;
        this.tracker.incrementCounter('variableResolutions');
        return this.tracker.timeFunctionSync(operationName, fn);
    }

    /**
     * Time image extraction
     */
    static async timeImageExtraction<T>(nodeId: string, fn: () => Promise<T>): Promise<T> {
        const operationName = `extract-image-${nodeId}`;
        this.tracker.incrementCounter('imageExtractions');
        return await this.tracker.timeFunction(operationName, fn);
    }

    /**
     * Track cache access
     */
    static trackCacheAccess<T>(_cacheKey: string, fn: () => T | null): T | null {
        const result = fn();
        if (result !== null) {
            this.tracker.recordCacheHit();
        } else {
            this.tracker.recordCacheMiss();
        }
        return result;
    }

    /**
     * Batch operation timer
     */
    static async timeBatchOperation<T>(
        operationName: string,
        items: T[],
        processor: (item: T) => Promise<any>,
    ): Promise<any[]> {
        return await this.tracker.timeFunction(`${operationName}-batch-${items.length}`, async () => {
            const results = [];
            for (const item of items) {
                const result = await processor(item);
                results.push(result);
            }
            return results;
        });
    }
}

// Export singleton instance for convenience
export const performanceTracker = PerformanceTracker.getInstance();
