import { RequestConfig, Response } from './types';
export default class BatchManager {
    private batchGroups;
    private maxBatchSize;
    private batchInterval;
    private batchTimers;
    private defaultBatchConfig;
    constructor(options?: {
        maxBatchSize?: number;
        batchInterval?: number;
        batchUrl?: string;
        batchMode?: 'json' | 'form';
        requestsFieldName?: string;
    });
    addToBatch(config: RequestConfig, adapter: (config: RequestConfig) => Promise<Response>): Promise<Response>;
    private processBatchGroup;
    private sendBatchRequest;
    private getBatchConfig;
    executeBatch(configs: RequestConfig[], adapter: (config: RequestConfig) => Promise<Response>): Promise<Response[]>;
}
