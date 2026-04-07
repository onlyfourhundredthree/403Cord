/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Worker utilities for offloading heavy computations
 * from the main thread to improve UI responsiveness
 */

type WorkerFunction<T, R> = (input: T) => R;

interface WorkerTask<T, R> {
    id: string;
    input: T;
    resolve: (result: R) => void;
    reject: (error: Error) => void;
}

/**
 * Create a simple Web Worker from a function
 * Useful for one-off computations
 */
export function createWorker<T, R>(
    fn: WorkerFunction<T, R>
): {
    execute: (input: T) => Promise<R>;
    terminate: () => void;
} {
    const workerCode = `
        self.onmessage = function(e) {
            try {
                const result = (${fn.toString()})(e.data);
                self.postMessage({ success: true, result });
            } catch (error) {
                self.postMessage({ success: false, error: error.message });
            }
        };
    `;

    const blob = new Blob([workerCode], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    const pendingTasks = new Map<string, WorkerTask<T, R>>();
    let taskId = 0;

    worker.onmessage = e => {
        const { success, result, error, id } = e.data;
        const task = pendingTasks.get(id);
        if (task) {
            pendingTasks.delete(id);
            if (success) {
                task.resolve(result);
            } else {
                task.reject(new Error(error));
            }
        }
    };

    return {
        execute: (input: T) => {
            return new Promise((resolve, reject) => {
                const id = String(taskId++);
                pendingTasks.set(id, { id, input, resolve, reject });
                worker.postMessage({ id, input });
            });
        },
        terminate: () => {
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
        }
    };
}

/**
 * Worker pool for parallel processing
 * Distributes tasks across multiple workers
 */
export class WorkerPool<T, R> {
    private workers: Array<{
        worker: Worker;
        busy: boolean;
        currentTask: WorkerTask<T, R> | null;
    }> = [];
    private taskQueue: WorkerTask<T, R>[] = [];
    private workerCode: string;
    private maxWorkers: number;

    constructor(
        fn: WorkerFunction<T, R>,
        maxWorkers = navigator.hardwareConcurrency || 4
    ) {
        this.maxWorkers = maxWorkers;
        this.workerCode = `
            self.onmessage = function(e) {
                try {
                    const result = (${fn.toString()})(e.data);
                    self.postMessage({ success: true, result, id: e.data.id });
                } catch (error) {
                    self.postMessage({ success: false, error: error.message, id: e.data.id });
                }
            };
        `;

        for (let i = 0; i < maxWorkers; i++) {
            this.createWorker();
        }
    }

    private createWorker() {
        const blob = new Blob([this.workerCode], { type: "application/javascript" });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);

        const workerObj = {
            worker,
            busy: false,
            currentTask: null as WorkerTask<T, R> | null
        };

        worker.onmessage = e => {
            const { success, result, error, id } = e.data;
            if (workerObj.currentTask?.id === id && workerObj.currentTask) {
                const task = workerObj.currentTask;
                workerObj.currentTask = null;
                workerObj.busy = false;

                if (success) {
                    task.resolve(result);
                } else {
                    task.reject(new Error(error));
                }

                this.processQueue();
            }
        };

        this.workers.push(workerObj);
    }

    private processQueue() {
        const availableWorker = this.workers.find(w => !w.busy);
        if (availableWorker && this.taskQueue.length > 0) {
            const task = this.taskQueue.shift()!;
            availableWorker.busy = true;
            availableWorker.currentTask = task;
            availableWorker.worker.postMessage({ id: task.id, input: task.input });
        }
    }

    execute(input: T): Promise<R> {
        return new Promise((resolve, reject) => {
            const id = Math.random().toString(36).substring(7);
            const task: WorkerTask<T, R> = { id, input, resolve, reject };

            const availableWorker = this.workers.find(w => !w.busy);
            if (availableWorker) {
                availableWorker.busy = true;
                availableWorker.currentTask = task;
                availableWorker.worker.postMessage({ id, input });
            } else {
                this.taskQueue.push(task);
            }
        });
    }

    terminate() {
        this.workers.forEach(({ worker }) => worker.terminate());
    }
}

/**
 * Simple throttle function for rate-limiting operations
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
