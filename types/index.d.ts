import WxRequest from './core';
import { createError, delay } from './utils';
import { ErrorType } from './types';
export default WxRequest;
export * from './types';
export { createError, delay };
export { ErrorType };
declare const defaultInstance: WxRequest;
declare const request: {
    <T = any>(config: import("./types").RequestConfig & {
        returnData?: true;
    }): Promise<T>;
    <T = any>(config: import("./types").RequestConfig & {
        returnData: false;
    }): Promise<import("./types").Response<T>>;
    <T = any>(config: import("./types").RequestConfig): Promise<import("./types").Response<T> | T>;
    <T = any>(url: string, config?: import("./types").RequestConfig & {
        returnData?: true;
    }): Promise<T>;
    <T = any>(url: string, config?: import("./types").RequestConfig & {
        returnData: false;
    }): Promise<import("./types").Response<T>>;
    <T = any>(url: string, config?: import("./types").RequestConfig): Promise<import("./types").Response<T> | T>;
    <T = any>(url: string, method: import("./types").Method, config?: import("./types").RequestConfig & {
        returnData?: true;
    }): Promise<T>;
    <T = any>(url: string, method: import("./types").Method, config?: import("./types").RequestConfig & {
        returnData: false;
    }): Promise<import("./types").Response<T>>;
    <T = any>(url: string, method: import("./types").Method, config?: import("./types").RequestConfig): Promise<import("./types").Response<T> | T>;
    <T = any>(url: string, data: any, config?: import("./types").RequestConfig & {
        returnData?: true;
    }): Promise<T>;
    <T = any>(url: string, data: any, config?: import("./types").RequestConfig & {
        returnData: false;
    }): Promise<import("./types").Response<T>>;
    <T = any>(url: string, data: any, config?: import("./types").RequestConfig): Promise<import("./types").Response<T> | T>;
}, get: {
    <T = any>(url: string, config?: import("./types").RequestConfig & {
        returnData?: true;
    }): Promise<T>;
    <T = any>(url: string, config?: import("./types").RequestConfig & {
        returnData: false;
    }): Promise<import("./types").Response<T>>;
}, post: {
    <T = any>(url: string, data?: any, config?: import("./types").RequestConfig & {
        returnData?: true;
    }): Promise<T>;
    <T = any>(url: string, data?: any, config?: import("./types").RequestConfig & {
        returnData: false;
    }): Promise<import("./types").Response<T>>;
}, put: {
    <T = any>(url: string, data?: any, config?: import("./types").RequestConfig & {
        returnData?: true;
    }): Promise<T>;
    <T = any>(url: string, data?: any, config?: import("./types").RequestConfig & {
        returnData: false;
    }): Promise<import("./types").Response<T>>;
}, deleteMethod: {
    <T = any>(url: string, config?: import("./types").RequestConfig & {
        returnData?: true;
    }): Promise<T>;
    <T = any>(url: string, config?: import("./types").RequestConfig & {
        returnData: false;
    }): Promise<import("./types").Response<T>>;
}, head: {
    <T = any>(url: string, config?: import("./types").RequestConfig & {
        returnData?: true;
    }): Promise<T>;
    <T = any>(url: string, config?: import("./types").RequestConfig & {
        returnData: false;
    }): Promise<import("./types").Response<T>>;
}, options: {
    <T = any>(url: string, config?: import("./types").RequestConfig & {
        returnData?: true;
    }): Promise<T>;
    <T = any>(url: string, config?: import("./types").RequestConfig & {
        returnData: false;
    }): Promise<import("./types").Response<T>>;
}, all: {
    <T>(requests: Array<Promise<T>>): Promise<T[]>;
    <T extends any[]>(requests: [...{ [K in keyof T]: Promise<T[K]>; }]): Promise<T>;
}, spread: <T, R>(callback: (...args: T[]) => R) => (arr: T[]) => R;
export { defaultInstance as wxRequest, request, get, post, put, deleteMethod as delete, head, options, all, spread, };
export declare const interceptors: {
    request: import("./interceptor").default<import("./types").RequestConfig>;
    response: import("./interceptor").default<import("./types").Response>;
};
