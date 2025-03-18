import {
  WxRequestConfig,
  RequestConfig,
  Method,
  Response,
  RequestError,
  ErrorType
} from './types';
import Interceptor from './interceptor';
import LRUCacheAdapter from './adapters/cache';
import wxRequestAdapter from './adapters/wx-request';
import RequestQueue from './queue';
import BatchManager from './batch';
import PreloadManager from './preload';
import {
  deepMerge,
  buildURL,
  generateCacheKey,
  shouldCache,
  createError,
  delay,
  isNetworkError,
  getNetworkStatus
} from './utils';

/**
 * 微信请求核心类
 */
export default class WxRequest {
  // 默认配置
  private defaults: WxRequestConfig;
  
  // 拦截器
  public interceptors: {
    request: Interceptor<RequestConfig>;
    response: Interceptor<Response>;
  };
  
  // 组件管理器
  private cacheAdapter: LRUCacheAdapter;
  private requestQueue: RequestQueue;
  private batchManager: BatchManager;
  private preloadManager: PreloadManager;
  
  /**
   * 构造函数
   * @param config 配置
   */
  constructor(config: WxRequestConfig = {}) {
    // 初始化默认配置
    this.defaults = {
      baseURL: '',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'GET',
      validateStatus: (status: number) => status >= 200 && status < 300,
      maxCacheSize: 100,
      maxCacheAge: 5 * 60 * 1000, // 5分钟
      retryTimes: 3,
      retryDelay: 1000,
      enableQueue: true,
      maxConcurrent: 10,
      enableOfflineQueue: true,
      batchInterval: 50,
      batchMaxSize: 5,
      ...config
    };
    
    // 初始化组件
    this.cacheAdapter = new LRUCacheAdapter({
      maxSize: this.defaults.maxCacheSize,
      maxAge: this.defaults.maxCacheAge
    });
    
    this.requestQueue = new RequestQueue({
      maxConcurrent: this.defaults.maxConcurrent,
      enableOfflineQueue: this.defaults.enableOfflineQueue
    });
    
    this.batchManager = new BatchManager({
      maxBatchSize: this.defaults.batchMaxSize,
      batchInterval: this.defaults.batchInterval
    });
    
    this.preloadManager = new PreloadManager();
    
    // 初始化拦截器
    this.interceptors = {
      request: new Interceptor<RequestConfig>(),
      response: new Interceptor<Response>()
    };
  }
  
  /**
   * 发送请求
   * @param config 请求配置
   * @returns Promise
   */
  request<T = any>(config: RequestConfig): Promise<Response<T>> {
    // 合并配置
    config = deepMerge(this.defaults, config);
    
    // 设置默认适配器
    if (!config.requestAdapter) {
      config.requestAdapter = wxRequestAdapter;
    }
    
    // 设置缓存适配器
    if (!config.cacheAdapter) {
      config.cacheAdapter = this.cacheAdapter;
    }
    
    // 处理请求URL
    if (config.url) {
      config.url = buildURL(config.url, config.baseURL, config.params);
    }
    
    // 初始化请求链
    let chain: Array<any> = [this.sendRequest.bind(this), undefined];
    
    // 添加请求拦截器到链前面
    let requestInterceptorChain: any[] = [];
    this.interceptors.request.forEach(interceptor => {
      requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
    });
    
    // 添加响应拦截器到链后面
    let responseInterceptorChain: any[] = [];
    this.interceptors.response.forEach(interceptor => {
      responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
    });
    
    // 构建完整请求链
    chain = [...requestInterceptorChain, ...chain, ...responseInterceptorChain];
    
    // 执行请求链
    let promise = Promise.resolve(config);
    
    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift());
    }
    
    return promise as Promise<Response<T>>;
  }
  
  /**
   * 发送实际请求
   * @param config 请求配置
   */
  private async sendRequest(config: RequestConfig): Promise<Response> {
    // 检查是否有预加载响应
    if (config.preloadKey && this.preloadManager.hasPreloadResponse(config.preloadKey)) {
      const preloadedResponse = this.preloadManager.getPreloadResponse(config.preloadKey);
      if (preloadedResponse) {
        return preloadedResponse;
      }
    }
    
    // 检查缓存
    if (shouldCache(config) && config.cacheAdapter) {
      const cacheKey = generateCacheKey(config);
      const cachedResponse = await config.cacheAdapter.get(cacheKey);
      
      if (cachedResponse) {
        // 检查是否强制使用缓存
        if (config.cache === 'only-if-cached') {
          return cachedResponse;
        }
        
        // 在后台刷新缓存
        if (config.cache !== 'force-cache') {
          this.refreshCache(config, cacheKey);
        }
        
        return cachedResponse;
      }
    }
    
    // 没有缓存，发送实际请求
    return this.performRequest(config);
  }
  
  /**
   * 执行实际请求
   * @param config 请求配置
   */
  private async performRequest(config: RequestConfig): Promise<Response> {
    // 如果启用队列，加入请求队列
    if (this.defaults.enableQueue && !config.ignoreQueue) {
      return this.requestQueue.enqueue(config);
    }
    
    // 如果开启了批处理并且有groupKey，加入批处理
    if (config.groupKey && this.defaults.batchInterval! > 0) {
      return this.batchManager.addToBatch(config, config.requestAdapter!);
    }
    
    // 直接发送请求
    try {
      const response = await config.requestAdapter!(config);
      
      // 缓存响应
      this.cacheResponse(config, response);
      
      return response;
    } catch (error) {
      // 处理错误和重试
      return this.handleRequestError(error as RequestError, config);
    }
  }
  
  /**
   * 处理请求错误
   * @param error 错误
   * @param config 请求配置
   */
  private async handleRequestError(error: RequestError, config: RequestConfig): Promise<Response> {
    // 获取重试次数
    const retryCount = error.retryCount || 0;
    const maxRetries = typeof config.retry === 'number' ? config.retry : 
                       (config.retry === true ? this.defaults.retryTimes || 0 : 0);
    
    // 检查是否需要重试
    if (
      retryCount < maxRetries && 
      (isNetworkError(error) || (error.status && error.status >= 500))
    ) {
      // 增加重试计数
      error.retryCount = retryCount + 1;
      
      // 计算延迟
      let retryDelay = config.retryDelay || this.defaults.retryDelay || 1000;
      
      // 如果使用递增延迟
      if (config.retryIncrementalDelay) {
        retryDelay = retryDelay * (error.retryCount);
      }
      
      // 延迟后重试
      await delay(retryDelay);
      
      // 重试请求
      return this.performRequest(config);
    }
    
    // 超过重试次数，抛出错误
    throw error;
  }
  
  /**
   * 缓存响应
   * @param config 请求配置
   * @param response 响应
   */
  private async cacheResponse(config: RequestConfig, response: Response): Promise<void> {
    if (shouldCache(config) && config.cacheAdapter) {
      const cacheKey = generateCacheKey(config);
      const cacheExpire = config.cacheExpire || this.defaults.maxCacheAge;
      
      await config.cacheAdapter.set(cacheKey, response, cacheExpire);
    }
  }
  
  /**
   * 在后台刷新缓存
   * @param config 请求配置
   * @param cacheKey 缓存键
   */
  private async refreshCache(config: RequestConfig, cacheKey: string): Promise<void> {
    try {
      // 创建一个新的配置，不使用缓存
      const refreshConfig = {
        ...config,
        cache: false,
        ignoreQueue: true,  // 忽略队列限制
        priority: 1         // 低优先级
      };
      
      // 静默发送请求
      const response = await config.requestAdapter!(refreshConfig);
      
      // 更新缓存
      if (config.cacheAdapter) {
        const cacheExpire = config.cacheExpire || this.defaults.maxCacheAge;
        await config.cacheAdapter.set(cacheKey, response, cacheExpire);
      }
    } catch (error) {
      // 刷新缓存失败，但不影响主流程，所以只记录错误
      console.error('刷新缓存失败:', error);
    }
  }
  
  /**
   * GET请求
   * @param url 请求URL
   * @param config 请求配置
   */
  get<T = any>(url: string, config: RequestConfig = {}): Promise<Response<T>> {
    return this.request<T>({
      ...config,
      method: 'GET',
      url
    });
  }
  
  /**
   * POST请求
   * @param url 请求URL
   * @param data 请求数据
   * @param config 请求配置
   */
  post<T = any>(url: string, data?: any, config: RequestConfig = {}): Promise<Response<T>> {
    return this.request<T>({
      ...config,
      method: 'POST',
      url,
      data
    });
  }
  
  /**
   * PUT请求
   * @param url 请求URL
   * @param data 请求数据
   * @param config 请求配置
   */
  put<T = any>(url: string, data?: any, config: RequestConfig = {}): Promise<Response<T>> {
    return this.request<T>({
      ...config,
      method: 'PUT',
      url,
      data
    });
  }
  
  /**
   * DELETE请求
   * @param url 请求URL
   * @param config 请求配置
   */
  delete<T = any>(url: string, config: RequestConfig = {}): Promise<Response<T>> {
    return this.request<T>({
      ...config,
      method: 'DELETE',
      url
    });
  }
  
  /**
   * HEAD请求
   * @param url 请求URL
   * @param config 请求配置
   */
  head<T = any>(url: string, config: RequestConfig = {}): Promise<Response<T>> {
    return this.request<T>({
      ...config,
      method: 'HEAD',
      url
    });
  }
  
  /**
   * OPTIONS请求
   * @param url 请求URL
   * @param config 请求配置
   */
  options<T = any>(url: string, config: RequestConfig = {}): Promise<Response<T>> {
    return this.request<T>({
      ...config,
      method: 'OPTIONS',
      url
    });
  }
  
  /**
   * 批量请求
   * @param requests 请求配置数组
   * @param config 批处理配置
   */
  batch<T = any>(requests: RequestConfig[], config: RequestConfig = {}): Promise<Response<T>[]> {
    return this.batchManager.executeBatch(
      requests.map(req => deepMerge(config, req)),
      this.sendRequest.bind(this)
    );
  }
  
  /**
   * 预请求
   * @param config 预请求配置
   */
  preRequest(config: RequestConfig & { preloadKey: string }): Promise<void> {
    return this.preloadManager.preload(config, this.sendRequest.bind(this));
  }
  
  /**
   * 获取网络状态
   */
  getNetworkStatus(): Promise<{
    isConnected: boolean;
    networkType: string;
    signalStrength?: number;
  }> {
    return getNetworkStatus();
  }
  
  /**
   * 清除缓存
   * @param pattern 缓存键模式（暂未实现）
   */
  clearCache(): Promise<void> {
    return this.cacheAdapter.clear();
  }
  
  /**
   * 取消请求
   * @param filter 过滤条件
   */
  cancelRequests(filter: (config: RequestConfig) => boolean): void {
    this.requestQueue.cancel(filter);
  }
  
  /**
   * 获取请求库状态
   */
  getStatus() {
    return {
      queue: this.requestQueue.getStatus(),
      preload: this.preloadManager.getStatus()
    };
  }
} 