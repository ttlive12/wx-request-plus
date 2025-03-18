import { RequestConfig, Response } from './types';
export default class BatchManager {
    private batchGroups;
    private maxBatchSize;
    private batchInterval;
    private batchTimers;
    constructor(options?: {
        maxBatchSize?: number;
        batchInterval?: number;
    });
    addToBatch(config: RequestConfig, adapter: (config: RequestConfig) => Promise<Response>): Promise<Response>;
    private processBatchGroup;
    private sendBatchRequest;
    executeBatch(configs: RequestConfig[], adapter: (config: RequestConfig) => Promise<Response>): Promise<Response[]>;
}
