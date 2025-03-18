import { InterceptorHandlers, InterceptorManager } from './types';

/**
 * 拦截器管理器实现
 */
export default class Interceptor<T> implements InterceptorManager<T> {
  handlers: Array<InterceptorHandlers<T> | null> = [];

  /**
   * 添加一个拦截器
   * @param fulfilled 成功回调
   * @param rejected 失败回调
   * @returns 拦截器ID，用于移除拦截器
   */
  use(
    fulfilled: (value: T) => T | Promise<T>,
    rejected?: (error: any) => any
  ): number {
    this.handlers.push({
      fulfilled,
      rejected
    });
    
    return this.handlers.length - 1;
  }

  /**
   * 移除一个拦截器
   * @param id 拦截器ID
   */
  eject(id: number): void {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  /**
   * 遍历所有拦截器并执行回调
   * @param fn 回调函数
   */
  forEach(fn: (handler: InterceptorHandlers<T>) => void): void {
    this.handlers.forEach(handler => {
      if (handler !== null) {
        fn(handler);
      }
    });
  }
} 