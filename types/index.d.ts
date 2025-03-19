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
}, batch: {
    <T = any>(requests: import("./types").RequestConfig[], config?: import("./types").RequestConfig & {
        returnData?: true;
    }): Promise<T[]>;
    <T = any>(requests: import("./types").RequestConfig[], config?: import("./types").RequestConfig & {
        returnData: false;
    }): Promise<import("./types").Response<T>[]>;
}, preRequest: (config: import("./types").RequestConfig & {
    preloadKey: string;
}) => Promise<void>;
export { defaultInstance as wxRequest, request, get, post, put, deleteMethod as delete, head, options, batch, preRequest };
export declare const interceptors: {
    request: import("./interceptor").default<import("./types").RequestConfig>;
    response: import("./interceptor").default<import("./types").Response>;
};
