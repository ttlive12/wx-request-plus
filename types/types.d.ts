export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE' | 'CONNECT';
export type CacheMode = boolean | 'force-cache' | 'only-if-cached' | 'no-cache';
export interface LoadingOptions {
    title?: string;
    mask?: boolean;
    delay?: number;
    customLoader?: (show: boolean, options?: LoadingOptions) => void;
}
export interface RequestConfig {
    url?: string;
    baseURL?: string;
    method?: Method;
    data?: any;
    params?: Record<string, any>;
    headers?: Record<string, string>;
    timeout?: number;
    cache?: CacheMode;
    cacheKey?: string;
    cacheExpire?: number;
    retry?: boolean | number;
    retryDelay?: number;
    retryIncrementalDelay?: boolean;
    priority?: number;
    cancelOnNavigate?: boolean;
    ignoreQueue?: boolean;
    groupKey?: string;
    batchConfig?: Partial<BatchConfig>;
    showLoading?: boolean | LoadingOptions;
    extractField?: string | ((data: any) => any);
    skipExtract?: boolean;
    returnData?: boolean;
    transformRequest?: (data: any, headers: Record<string, string>) => any;
    transformResponse?: (data: any, response: Response) => any;
    validateStatus?: (status: number) => boolean;
    onDownloadProgress?: (progressEvent: any) => void;
    onUploadProgress?: (progressEvent: any) => void;
    enableHttp2?: boolean;
    enableQuic?: boolean;
    enableCache?: boolean;
    enableVerify?: boolean;
    onDone?: (res: Response) => void;
    mock?: boolean | ((config: RequestConfig) => Response);
    cancelToken?: {
        promise: Promise<string>;
    };
    [key: string]: any;
}
export interface WxRequestConfig extends RequestConfig {
    maxCacheSize?: number;
    maxCacheAge?: number;
    retryTimes?: number;
    retryDelay?: number;
    enableQueue?: boolean;
    maxConcurrent?: number;
    enableOfflineQueue?: boolean;
    enableLoading?: boolean;
    loadingOptions?: LoadingOptions;
    extractField?: string | ((data: any) => any);
    returnData?: boolean;
    requestAdapter?: RequestAdapter;
    cacheAdapter?: CacheAdapter;
    batchConfig?: BatchConfig;
}
export interface Response<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config: RequestConfig;
    request?: any;
    fromCache?: boolean;
    timestamp?: number;
}
export interface RequestError extends Error {
    config: RequestConfig;
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    data?: any;
    request?: any;
    type?: ErrorType;
    retryCount?: number;
}
export declare enum ErrorType {
    TIMEOUT = "TIMEOUT",
    NETWORK = "NETWORK",
    CANCEL = "CANCEL",
    SERVER = "SERVER",
    CLIENT = "CLIENT",
    OFFLINE = "OFFLINE",
    UNKNOWN = "UNKNOWN"
}
export interface InterceptorHandlers<T> {
    fulfilled: (value: T) => T | Promise<T>;
    rejected?: (error: any) => any;
}
export interface Interceptor<T> {
    use(handlers: InterceptorHandlers<T>): number;
    eject(id: number): void;
}
export interface InterceptorManager<T> {
    handlers: Array<InterceptorHandlers<T> | null>;
    use(fulfilled: (value: T) => T | Promise<T>, rejected?: (error: any) => any): number;
    eject(id: number): void;
    forEach(fn: (handler: InterceptorHandlers<T>) => void): void;
}
export interface RequestAdapter {
    (config: RequestConfig): Promise<Response>;
}
export interface CacheAdapter {
    get(key: string): Promise<Response | undefined>;
    set(key: string, value: Response, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
export interface QueueItem {
    config: RequestConfig;
    execute: () => Promise<void>;
    timestamp: number;
    priority: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
}
export interface BatchItem {
    config: RequestConfig;
    resolve: (value: Response) => void;
    reject: (reason: any) => void;
}
export interface BatchConfig {
    batchUrl?: string;
    responsePath?: string;
    batchMode?: 'json' | 'form';
    transformBatchRequest?: (requests: any[]) => any;
    transformBatchResponse?: (batchResponse: Response, originalRequests: BatchItem[]) => any[];
    method?: Method;
    baseURL?: string;
    headers?: Record<string, string>;
    timeout?: number;
    requestsFieldName?: string;
    batchInterval?: number;
    batchMaxSize?: number;
}
export interface NetworkStatus {
    isConnected: boolean;
    networkType: 'wifi' | '2g' | '3g' | '4g' | '5g' | 'unknown' | 'none';
    signalStrength?: number;
}
export interface PreRequestConfig extends RequestConfig {
    preloadKey: string;
    expireTime?: number;
}
export interface MonitorData {
    totalRequests: number;
    successRequests: number;
    failedRequests: number;
    cachedRequests: number;
    averageResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
    currentQueueSize: number;
    currentNetworkStatus: NetworkStatus;
}
