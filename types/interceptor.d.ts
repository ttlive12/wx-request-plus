import { InterceptorHandlers, InterceptorManager } from './types';
export default class Interceptor<T> implements InterceptorManager<T> {
    handlers: Array<InterceptorHandlers<T> | null>;
    use(fulfilled: (value: T) => T | Promise<T>, rejected?: (error: any) => any): number;
    eject(id: number): void;
    forEach(fn: (handler: InterceptorHandlers<T>) => void): void;
}
