import { QueueItem, RequestConfig } from './types';
export default class RequestQueue {
    private queue;
    private processing;
    private maxConcurrent;
    private enableOfflineQueue;
    private offlineQueue;
    private isProcessing;
    private isNetworkAvailable;
    constructor(options?: {
        maxConcurrent?: number;
        enableOfflineQueue?: boolean;
    });
    enqueue(item: QueueItem): void;
    cancel(predicate: (config: RequestConfig) => boolean): void;
    clear(): void;
    getStatus(): {
        queueSize: number;
        processingSize: number;
        offlineQueueSize: number;
        isNetworkAvailable: boolean;
    };
    private processQueue;
    private processItem;
    private sortQueue;
    private setupNetworkListener;
    private handleNetworkChange;
}
