import { CacheAdapter, Response } from './types';
export default class LRUCacheAdapter implements CacheAdapter {
    private cache;
    constructor(options?: {
        maxSize?: number;
        maxAge?: number;
    });
    get(key: string): Promise<Response | undefined>;
    set(key: string, value: Response, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
