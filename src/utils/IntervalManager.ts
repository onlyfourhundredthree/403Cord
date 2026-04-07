/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Performance-optimized interval management system
 * Provides automatic cleanup and memory leak prevention
 */
export class IntervalManager {
    private intervals = new Map<string, ReturnType<typeof setInterval>>();
    private timeouts = new Map<string, ReturnType<typeof setTimeout>>();
    private animationFrames = new Map<string, number>();

    /**
     * Set an interval with automatic cleanup support
     * @param id Unique identifier for this interval
     * @param callback Function to call
     * @param delay Delay in milliseconds
     * @returns The interval ID
     */
    setInterval(id: string, callback: () => void, delay: number): ReturnType<typeof setInterval> {
        this.clearInterval(id);
        const intervalId = setInterval(callback, delay);
        this.intervals.set(id, intervalId);
        return intervalId;
    }

    /**
     * Set a timeout with automatic cleanup support
     * @param id Unique identifier for this timeout
     * @param callback Function to call
     * @param delay Delay in milliseconds
     * @returns The timeout ID
     */
    setTimeout(id: string, callback: () => void, delay: number): ReturnType<typeof setTimeout> {
        this.clearTimeout(id);
        const timeoutId = setTimeout(() => {
            callback();
            this.timeouts.delete(id);
        }, delay);
        this.timeouts.set(id, timeoutId);
        return timeoutId;
    }

    /**
     * Request animation frame with automatic cleanup support
     * @param id Unique identifier for this animation frame
     * @param callback Function to call
     * @returns The animation frame ID
     */
    requestAnimationFrame(id: string, callback: (timestamp: number) => void): number {
        this.cancelAnimationFrame(id);
        const frameId = requestAnimationFrame(timestamp => {
            callback(timestamp);
            this.animationFrames.delete(id);
        });
        this.animationFrames.set(id, frameId);
        return frameId;
    }

    /**
     * Clear a specific interval
     */
    clearInterval(id: string): void {
        const intervalId = this.intervals.get(id);
        if (intervalId !== undefined) {
            clearInterval(intervalId);
            this.intervals.delete(id);
        }
    }

    /**
     * Clear a specific timeout
     */
    clearTimeout(id: string): void {
        const timeoutId = this.timeouts.get(id);
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
            this.timeouts.delete(id);
        }
    }

    /**
     * Cancel a specific animation frame
     */
    cancelAnimationFrame(id: string): void {
        const frameId = this.animationFrames.get(id);
        if (frameId !== undefined) {
            cancelAnimationFrame(frameId);
            this.animationFrames.delete(id);
        }
    }

    /**
     * Clear all intervals (cleanup on plugin stop)
     */
    clearAllIntervals(): void {
        for (const id of this.intervals.values()) {
            clearInterval(id);
        }
        this.intervals.clear();
    }

    /**
     * Clear all timeouts
     */
    clearAllTimeouts(): void {
        for (const id of this.timeouts.values()) {
            clearTimeout(id);
        }
        this.timeouts.clear();
    }

    /**
     * Clear all animation frames
     */
    cancelAllAnimationFrames(): void {
        for (const id of this.animationFrames.values()) {
            cancelAnimationFrame(id);
        }
        this.animationFrames.clear();
    }

    /**
     * Clear everything (call on plugin stop)
     */
    clearAll(): void {
        this.clearAllIntervals();
        this.clearAllTimeouts();
        this.cancelAllAnimationFrames();
    }

    /**
     * Get active interval count (for debugging)
     */
    get activeIntervalCount(): number {
        return this.intervals.size;
    }

    /**
     * Get active timeout count (for debugging)
     */
    get activeTimeoutCount(): number {
        return this.timeouts.size;
    }

    /**
     * Get active animation frame count (for debugging)
     */
    get activeAnimationFrameCount(): number {
        return this.animationFrames.size;
    }
}

/**
 * Throttle function execution
 * @param fn Function to throttle
 * @param limit Time limit in milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
    fn: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;
    return function (this: any, ...args: Parameters<T>) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Request Idle Callback polyfill with fallback
 */
export const requestIdleCallbackPolyfill: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions
) => number = typeof requestIdleCallback === "function"
    ? requestIdleCallback
    : (callback: IdleRequestCallback) => {
        const start = Date.now();
        return setTimeout(() => {
            callback({
                didTimeout: false,
                timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
            } as IdleDeadline);
        }, 1) as unknown as number;
    };

/**
 * Cancel Idle Callback polyfill with fallback
 */
export const cancelIdleCallbackPolyfill: (id: number) => void =
    typeof cancelIdleCallback === "function"
        ? cancelIdleCallback
        : (id: number) => clearTimeout(id);
