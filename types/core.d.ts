import { WxRequestConfig, RequestConfig, Response, Method } from './types';
import Interceptor from './interceptor';
export default class WxRequest {
    private defaults;
    interceptors: {
        request: Interceptor<RequestConfig>;
        response: Interceptor<Response>;
    };
    private cacheAdapter;
    private requestQueue;
    static create(config?: WxRequestConfig): WxRequest;
    constructor(config?: WxRequestConfig);
    request<T = any>(config: RequestConfig & {
        returnData?: true;
    }): Promise<T>;
    request<T = any>(config: RequestConfig & {
        returnData: false;
    }): Promise<Response<T>>;
    request<T = any>(config: RequestConfig): Promise<Response<T> | T>;
    request<T = any>(url: string, config?: RequestConfig & {
        returnData?: true;
    }): Promise<T>;
    request<T = any>(url: string, config?: RequestConfig & {
        returnData: false;
    }): Promise<Response<T>>;
    request<T = any>(url: string, config?: RequestConfig): Promise<Response<T> | T>;
    request<T = any>(url: string, method: Method, config?: RequestConfig & {
        returnData?: true;
    }): Promise<T>;
    request<T = any>(url: string, method: Method, config?: RequestConfig & {
        returnData: false;
    }): Promise<Response<T>>;
    request<T = any>(url: string, method: Method, config?: RequestConfig): Promise<Response<T> | T>;
    request<T = any>(url: string, data: any, config?: RequestConfig & {
        returnData?: true;
    }): Promise<T>;
    request<T = any>(url: string, data: any, config?: RequestConfig & {
        returnData: false;
    }): Promise<Response<T>>;
    request<T = any>(url: string, data: any, config?: RequestConfig): Promise<Response<T> | T>;
    private sendRequest;
    private prepareFinalConfig;
    private performRequest;
    private handleRequestError;
    private enhanceErrorMessage;
    private cacheResponse;
    private refreshCache;
    get<T = any>(url: string, config?: RequestConfig & {
        returnData?: true;
    }): Promise<T>;
    get<T = any>(url: string, config?: RequestConfig & {
        returnData: false;
    }): Promise<Response<T>>;
    post<T = any>(url: string, data?: any, config?: RequestConfig & {
        returnData?: true;
    }): Promise<T>;
    post<T = any>(url: string, data?: any, config?: RequestConfig & {
        returnData: false;
    }): Promise<Response<T>>;
    put<T = any>(url: string, data?: any, config?: RequestConfig & {
        returnData?: true;
    }): Promise<T>;
    put<T = any>(url: string, data?: any, config?: RequestConfig & {
        returnData: false;
    }): Promise<Response<T>>;
    delete<T = any>(url: string, config?: RequestConfig & {
        returnData?: true;
    }): Promise<T>;
    delete<T = any>(url: string, config?: RequestConfig & {
        returnData: false;
    }): Promise<Response<T>>;
    head<T = any>(url: string, config?: RequestConfig & {
        returnData?: true;
    }): Promise<T>;
    head<T = any>(url: string, config?: RequestConfig & {
        returnData: false;
    }): Promise<Response<T>>;
    options<T = any>(url: string, config?: RequestConfig & {
        returnData?: true;
    }): Promise<T>;
    options<T = any>(url: string, config?: RequestConfig & {
        returnData: false;
    }): Promise<Response<T>>;
    clearCache(): Promise<void>;
    cancelRequests(filter: (config: RequestConfig) => boolean): void;
    getStatus(): {
        queue: {
            queueSize: number;
            processingSize: number;
            offlineQueueSize: number;
            isNetworkAvailable: boolean;
        };
    };
    cancelAll(): void;
    all<T>(requests: Array<Promise<T>>): Promise<T[]>;
    all<T extends any[]>(requests: [...{
        [K in keyof T]: Promise<T[K]>;
    }]): Promise<T>;
    spread<T, R>(callback: (...args: T[]) => R): (arr: T[]) => R;
}
