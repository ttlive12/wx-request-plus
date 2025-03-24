import { InterceptorHandlers, InterceptorManager, RequestError } from './types';
export default class Interceptor<T> implements InterceptorManager<T> {
    handlers: Array<InterceptorHandlers<T> | null>;
    use(fulfilled: (value: T) => T | Promise<T>, rejected?: (error: RequestError) => any): number;
    eject(id: number): void;
    forEach(fn: (handler: InterceptorHandlers<T>) => void): void;
}
