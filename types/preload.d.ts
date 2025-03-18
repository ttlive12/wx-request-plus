import { PreRequestConfig, Response } from './types';
export default class PreloadManager {
    private preloadCache;
    constructor();
    preload(config: PreRequestConfig, adapter: (config: PreRequestConfig) => Promise<Response>): Promise<void>;
    getPreloadResponse(key: string): Response | null;
    hasPreloadResponse(key: string): boolean;
    cleanup(): void;
    private setupCleanupTimer;
    getStatus(): {
        count: number;
        keys: string[];
    };
}
