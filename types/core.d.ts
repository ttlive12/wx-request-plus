import { WxRequestConfig, RequestConfig, Response } from './types';
import Interceptor from './interceptor';
export default class WxRequest {
    private defaults;
    interceptors: {
        request: Interceptor<RequestConfig>;
        response: Interceptor<Response>;
    };
    private cacheAdapter;
    private requestQueue;
    private batchManager;
    private preloadManager;
    constructor(config?: WxRequestConfig);
    request<T = any>(config: RequestConfig): Promise<Response<T>>;
    private sendRequest;
    private performRequest;
    private handleRequestError;
    private cacheResponse;
    private refreshCache;
    get<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>;
    post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>>;
    put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>>;
    delete<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>;
    head<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>;
    options<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>;
    batch<T = any>(requests: RequestConfig[], config?: RequestConfig): Promise<Response<T>[]>;
    preRequest(config: RequestConfig & {
        preloadKey: string;
    }): Promise<void>;
    getNetworkStatus(): Promise<{
        isConnected: boolean;
        networkType: string;
        signalStrength?: number;
    }>;
    clearCache(): Promise<void>;
    cancelRequests(filter: (config: RequestConfig) => boolean): void;
    getStatus(): {
        queue: {
            queueSize: number;
            processingSize: number;
            offlineQueueSize: number;
            isNetworkAvailable: boolean;
        };
        preload: {
            count: number;
            keys: string[];
        };
    };
}
