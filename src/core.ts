import {
  WxRequestConfig,
  RequestConfig,
  Response,
  RequestError,
  LoadingOptions,
  Method
} from './types';
import Interceptor from './interceptor';
import LRUCacheAdapter from './adapters/cache';
import wxRequestAdapter from './adapters/wx-request';
import RequestQueue from './queue';
import BatchManager from './batch';
import PreloadManager from './preload';
import LoadingManager from './loading';
import {
  deepMerge,
  buildURL,
  generateCacheKey,
  shouldCache,
  delay,
  isNetworkError,
  getNetworkStatus,
  getValueByPath
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
  private loadingManager: LoadingManager;
  
  /**
   * 静态工厂方法，创建WxRequest实例
   * 防止用户忘记使用new关键字
   * @param config 配置
   * @returns WxRequest实例
   */
  static create(config?: WxRequestConfig): WxRequest {
    return new WxRequest(config);
  }
  
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
      enableLoading: false, // 默认不启用全局loading
      loadingOptions: {
        title: '加载中...',
        mask: false,
        delay: 300
      },
      // 默认的批量请求配置
      batchConfig: {
        batchUrl: '/batch',
        batchMode: 'json',
        requestsFieldName: 'requests',
        batchInterval: 50,
        batchMaxSize: 5
      },
      ...config
    };
    
    // 合并批量请求配置
    if (config.batchConfig) {
      this.defaults.batchConfig = {
        ...this.defaults.batchConfig,
        ...config.batchConfig
      };
    }
    
    // 初始化组件
    this.cacheAdapter = new LRUCacheAdapter({
      maxSize: this.defaults.maxCacheSize,
      maxAge: this.defaults.maxCacheAge
    });
    
    this.requestQueue = new RequestQueue({
      maxConcurrent: this.defaults.maxConcurrent,
      enableOfflineQueue: this.defaults.enableOfflineQueue
    });
    
    // 确保batchConfig存在
    const batchConfig = this.defaults.batchConfig || {
      batchUrl: '/batch',
      batchMode: 'json',
      requestsFieldName: 'requests',
      batchInterval: 50,
      batchMaxSize: 5
    };
    
    this.batchManager = new BatchManager({
      maxBatchSize: batchConfig.batchMaxSize,
      batchInterval: batchConfig.batchInterval,
      batchUrl: batchConfig.batchUrl,
      batchMode: batchConfig.batchMode,
      requestsFieldName: batchConfig.requestsFieldName
    });
    
    this.preloadManager = new PreloadManager();
    
    this.loadingManager = new LoadingManager(this.defaults.loadingOptions);
    
    // 初始化拦截器
    this.interceptors = {
      request: new Interceptor<RequestConfig>(),
      response: new Interceptor<Response>()
    };

    // 绑定所有实例方法以确保正确的this上下文
    this.request = this.request.bind(this);
    this.get = this.get.bind(this);
    this.post = this.post.bind(this);
    this.put = this.put.bind(this);
    this.delete = this.delete.bind(this);
    this.head = this.head.bind(this);
    this.options = this.options.bind(this);
    this.batch = this.batch.bind(this);
    this.preRequest = this.preRequest.bind(this);
    this.clearCache = this.clearCache.bind(this);
    this.cancelRequests = this.cancelRequests.bind(this);
    this.getStatus = this.getStatus.bind(this);
    this.cancelAll = this.cancelAll.bind(this);
    this.sendRequest = this.sendRequest.bind(this);
    this.performRequest = this.performRequest.bind(this);
    this.handleRequestError = this.handleRequestError.bind(this);
    this.cacheResponse = this.cacheResponse.bind(this);
    this.refreshCache = this.refreshCache.bind(this);
    this.handleLoading = this.handleLoading.bind(this);
  }
  
  /**
   * 发送请求
   * @param config 请求配置
   * @returns Promise<Response<T>> 或 Promise<T>，取决于returnData配置
   */
  request<T = any>(config: RequestConfig & { returnData?: true }): Promise<T>;
  request<T = any>(config: RequestConfig & { returnData: false }): Promise<Response<T>>;
  request<T = any>(config: RequestConfig): Promise<Response<T> | T>;
  /**
   * 发送请求
   * @param url 请求URL
   * @param config 请求配置（可选）
   * @returns Promise<Response<T>> 或 Promise<T>，取决于returnData配置
   */
  request<T = any>(url: string, config?: RequestConfig & { returnData?: true }): Promise<T>;
  request<T = any>(url: string, config?: RequestConfig & { returnData: false }): Promise<Response<T>>;
  request<T = any>(url: string, config?: RequestConfig): Promise<Response<T> | T>;
  /**
   * 发送请求
   * @param url 请求URL
   * @param method 请求方法
   * @param config 请求配置（可选）
   * @returns Promise<Response<T>> 或 Promise<T>，取决于returnData配置
   */
  request<T = any>(url: string, method: Method, config?: RequestConfig & { returnData?: true }): Promise<T>;
  request<T = any>(url: string, method: Method, config?: RequestConfig & { returnData: false }): Promise<Response<T>>;
  request<T = any>(url: string, method: Method, config?: RequestConfig): Promise<Response<T> | T>;
  /**
   * 发送请求
   * @param url 请求URL
   * @param data 请求数据
   * @param config 请求配置（可选）
   * @returns Promise<Response<T>> 或 Promise<T>，取决于returnData配置
   */
  request<T = any>(url: string, data: any, config?: RequestConfig & { returnData?: true }): Promise<T>;
  request<T = any>(url: string, data: any, config?: RequestConfig & { returnData: false }): Promise<Response<T>>;
  request<T = any>(url: string, data: any, config?: RequestConfig): Promise<Response<T> | T>;
  request<T = any>(
    urlOrConfig: string | RequestConfig,
    methodOrDataOrConfig?: Method | any | RequestConfig,
    configArg?: RequestConfig
  ): Promise<Response<T> | T> {
    // 创建一个安全的this引用
    const self = this;

    // 检查this上下文是否存在
    if (!self || !self.defaults) {
      const instanceError = new Error(
        '调用WxRequest方法时遇到this上下文丢失问题。\n' +
        '可能的原因:\n' +
        '1. 解构调用 - 例如: const {request} = wxRequest;\n' +
        '2. 单独传递方法 - 例如: const req = wxRequest.request;\n' +
        '3. 在事件处理函数中调用没有绑定this\n\n' +
        '正确用法:\n' +
        '- wxRequest.request(...) // 直接通过实例调用\n' +
        '- const req = wxRequest.request.bind(wxRequest) // 使用bind绑定\n' +
        '- const req = (...args) => wxRequest.request(...args) // 使用箭头函数'
      );
      console.error(instanceError);
      throw instanceError;
    }
    
    try {
      let config: RequestConfig;
      
      // 处理不同的参数组合
      if (typeof urlOrConfig === 'string') {
        // 情况1: request(url, config?)
        // 情况2: request(url, method, config?)
        // 情况3: request(url, data, config?)
        
        config = configArg || (typeof methodOrDataOrConfig === 'object' && !Array.isArray(methodOrDataOrConfig) && !(methodOrDataOrConfig instanceof Date) ? methodOrDataOrConfig : {}) as RequestConfig;
        config.url = urlOrConfig;
        
        if (methodOrDataOrConfig) {
          if (typeof methodOrDataOrConfig === 'string') {
            // 如果第二个参数是字符串，认为是HTTP方法
            config.method = methodOrDataOrConfig as Method;
          } else if (typeof methodOrDataOrConfig === 'object' || Array.isArray(methodOrDataOrConfig)) {
            // 如果第二个参数是对象或数组，认为是数据
            config.data = methodOrDataOrConfig;
            // 默认为POST
            config.method = config.method || 'POST';
          }
        } else {
          // 如果只有URL参数，默认为GET
          config.method = config.method || 'GET';
        }
      } else {
        // 情况4: request(config)
        config = urlOrConfig;
      }

      // 合并配置
      config = deepMerge(self.defaults, config);
      
      // 设置默认适配器
      if (!config.requestAdapter) {
        config.requestAdapter = wxRequestAdapter;
      }
      
      // 设置缓存适配器
      if (!config.cacheAdapter) {
        config.cacheAdapter = self.cacheAdapter;
      }
      
      // 处理请求URL
      if (config.url) {
        config.url = buildURL(config.url, config.baseURL, config.params);
      }
      
      // 初始化请求链
      let chain: Array<any> = [self.sendRequest.bind(self), undefined];
      
      // 添加请求拦截器到链前面
      let requestInterceptorChain: any[] = [];
      self.interceptors.request.forEach(interceptor => {
        requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
      });
      
      // 添加响应拦截器到链后面
      let responseInterceptorChain: any[] = [];
      self.interceptors.response.forEach(interceptor => {
        responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
      });
      
      // 构建完整请求链
      chain = [...requestInterceptorChain, ...chain, ...responseInterceptorChain];
      
      // 执行请求链
      let promise = Promise.resolve(config);
      
      while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift());
      }
      
      // 处理自动提取字段
      promise = promise.then(response => {
        // 如果配置了skipExtract，则跳过提取
        if (config.skipExtract) {
          return response;
        }

        // 获取提取配置（优先使用请求配置，其次使用全局配置）
        const extractField = config.extractField || self.defaults.extractField;
        
        if (!extractField) {
          return response;
        }

        // 如果extractField是函数，直接使用它处理数据
        if (typeof extractField === 'function') {
          return {
            ...response,
            data: extractField(response.data)
          };
        }

        // 如果extractField是字符串，使用路径提取
        const extractedData = getValueByPath(response.data, extractField);
        
        // 如果提取失败，返回原始数据
        if (extractedData === undefined) {
          console.warn(`无法从响应中提取字段: ${extractField}`);
          return response;
        }

        return {
          ...response,
          data: extractedData
        };
      });

      // 处理returnData选项，直接返回数据而非完整Response
      promise = promise.then(response => {
        // 获取returnData配置（优先使用请求配置，其次使用全局配置）
        const shouldReturnData = config.returnData !== undefined 
          ? config.returnData 
          : self.defaults.returnData;
        
        // 如果配置了returnData为true，则只返回data部分
        if (shouldReturnData) {
          return response.data;
        }
        
        // 否则返回完整response
        return response;
      });

      return promise as any; // 使用any是因为返回类型可能是T或Response<T>
    } catch (error) {
      console.error('WxRequest.request调用失败:', error);
      return Promise.reject(error);
    }
  }
  
  /**
   * 发送实际请求
   * @param config 请求配置
   */
  private async sendRequest(config: RequestConfig): Promise<Response> {
    // 处理加载提示
    let hideLoading: (() => void) | null = null;
    try {
      hideLoading = this.handleLoading(config);
      
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
          
          // 在后台刷新缓存，但仅当cache !== 'force-cache'时
          if (config.cache !== 'force-cache') {
            setTimeout(() => {
              this.refreshCache(config, cacheKey).catch(err => {
                console.error('后台刷新缓存失败:', err);
              });
            }, 10);
          }
          
          return cachedResponse;
        }
      }
      
      // 没有缓存，发送实际请求
      return this.performRequest(config);
    } finally {
      // 确保在所有情况下都隐藏加载提示
      if (hideLoading) {
        hideLoading();
      }
    }
  }
  
  /**
   * 处理加载提示的显示
   * @param config 请求配置
   * @returns 隐藏加载提示的函数
   */
  private handleLoading(config: RequestConfig): (() => void) | null {
    // 确定是否显示加载提示
    const shouldShowLoading = config.showLoading !== undefined 
      ? config.showLoading 
      : this.defaults.enableLoading;
    
    if (!shouldShowLoading) {
      return null;
    }
    
    // 获取加载选项
    let loadingOptions: LoadingOptions | undefined;
    if (typeof config.showLoading === 'object') {
      loadingOptions = config.showLoading;
    } else {
      loadingOptions = this.defaults.loadingOptions;
    }
    
    // 使用请求的groupKey或URL作为loading分组键
    const groupKey = config.groupKey || config.url || 'global';
    
    // 显示加载提示
    return this.loadingManager.show(groupKey, loadingOptions);
  }
  
  /**
   * 执行实际请求
   * @param config 请求配置
   */
  private async performRequest(config: RequestConfig): Promise<Response> {

    // 定义直接执行请求的函数
    const directExecute = async (): Promise<Response> => {
      console.log('📡 直接执行请求:', {
        url: config.url,
        method: config.method
      });
      
      try {
        // 直接发送请求
        const response = await config.requestAdapter!(config);
        
        // 缓存响应
        this.cacheResponse(config, response);
        
        return response;
      } catch (error) {
        // 处理错误和重试
        return this.handleRequestError(error as RequestError, config);
      }
    };
    
    // 决定请求的执行方式（直接执行或加入队列）
    let executeRequest: () => Promise<Response>;
    
    // 如果启用队列，让队列管理请求的执行时机，但执行逻辑仍使用directExecute
    if (this.defaults.enableQueue && !config.ignoreQueue) {
      executeRequest = () => this.requestQueue.enqueue(config, directExecute);
    } else {
      executeRequest = directExecute;
    }
    
    // 如果开启了批处理并且有groupKey，交给批处理
    if (config.groupKey && this.defaults.batchInterval! > 0) {
      return this.batchManager.addToBatch(config, config.requestAdapter!);
    }
    
    return executeRequest();
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
      // 创建一个全新的配置对象，确保与原配置完全隔离
      const refreshConfig = {
        ...config,
        cache: false,           // 关闭缓存以避免循环
        ignoreQueue: true,      // 强制跳过队列
        priority: 1             // 低优先级
      };
      
      // 直接使用adapter发送请求，完全绕过队列和其他机制
      if (config.requestAdapter) {
        const response = await config.requestAdapter(refreshConfig);
        
        // 仅当请求成功时才更新缓存
        if (config.cacheAdapter) {
          const cacheExpire = config.cacheExpire || this.defaults.maxCacheAge;
          await config.cacheAdapter.set(cacheKey, response, cacheExpire);
          console.log('✅ 后台刷新的缓存已设置成功');
        }
      } else {
        console.warn('⚠️ 无法刷新缓存：缺少请求适配器');
      }
    } catch (error) {
      // 刷新缓存失败，但不影响主流程，所以只记录错误
      console.error('❌ 刷新缓存失败:', error);
    }
  }
  
  /**
   * GET请求
   * @param url 请求URL
   * @param config 请求配置
   * @returns Promise<Response<T>> 或 Promise<T>，取决于returnData配置
   */
  get<T = any>(url: string, config?: RequestConfig & { returnData?: true }): Promise<T>;
  get<T = any>(url: string, config?: RequestConfig & { returnData: false }): Promise<Response<T>>;
  get<T = any>(url: string, config: RequestConfig = {}): Promise<Response<T> | T> {
    if (!this || !this.defaults) {
      throw new Error('WxRequest实例的this上下文丢失。请使用wxRequest.get()的方式调用，或使用bind绑定上下文。');
    }
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
   * @returns Promise<Response<T>> 或 Promise<T>，取决于returnData配置
   */
  post<T = any>(url: string, data?: any, config?: RequestConfig & { returnData?: true }): Promise<T>;
  post<T = any>(url: string, data?: any, config?: RequestConfig & { returnData: false }): Promise<Response<T>>;
  post<T = any>(url: string, data?: any, config: RequestConfig = {}): Promise<Response<T> | T> {
    if (!this || !this.defaults) {
      throw new Error('WxRequest实例的this上下文丢失。请使用wxRequest.post()的方式调用，或使用bind绑定上下文。');
    }
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
   * @returns Promise<Response<T>> 或 Promise<T>，取决于returnData配置
   */
  put<T = any>(url: string, data?: any, config?: RequestConfig & { returnData?: true }): Promise<T>;
  put<T = any>(url: string, data?: any, config?: RequestConfig & { returnData: false }): Promise<Response<T>>;
  put<T = any>(url: string, data?: any, config: RequestConfig = {}): Promise<Response<T> | T> {
    if (!this || !this.defaults) {
      throw new Error('WxRequest实例的this上下文丢失。请使用wxRequest.put()的方式调用，或使用bind绑定上下文。');
    }
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
   * @returns Promise<Response<T>> 或 Promise<T>，取决于returnData配置
   */
  delete<T = any>(url: string, config?: RequestConfig & { returnData?: true }): Promise<T>;
  delete<T = any>(url: string, config?: RequestConfig & { returnData: false }): Promise<Response<T>>;
  delete<T = any>(url: string, config: RequestConfig = {}): Promise<Response<T> | T> {
    if (!this || !this.defaults) {
      throw new Error('WxRequest实例的this上下文丢失。请使用wxRequest.delete()的方式调用，或使用bind绑定上下文。');
    }
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
   * @returns Promise<Response<T>> 或 Promise<T>，取决于returnData配置
   */
  head<T = any>(url: string, config?: RequestConfig & { returnData?: true }): Promise<T>;
  head<T = any>(url: string, config?: RequestConfig & { returnData: false }): Promise<Response<T>>;
  head<T = any>(url: string, config: RequestConfig = {}): Promise<Response<T> | T> {
    if (!this || !this.defaults) {
      throw new Error('WxRequest实例的this上下文丢失。请使用wxRequest.head()的方式调用，或使用bind绑定上下文。');
    }
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
   * @returns Promise<Response<T>> 或 Promise<T>，取决于returnData配置
   */
  options<T = any>(url: string, config?: RequestConfig & { returnData?: true }): Promise<T>;
  options<T = any>(url: string, config?: RequestConfig & { returnData: false }): Promise<Response<T>>;
  options<T = any>(url: string, config: RequestConfig = {}): Promise<Response<T> | T> {
    if (!this || !this.defaults) {
      throw new Error('WxRequest实例的this上下文丢失。请使用wxRequest.options()的方式调用，或使用bind绑定上下文。');
    }
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
   * @returns 批量响应结果
   */
  batch<T = any>(requests: RequestConfig[], config?: RequestConfig & { returnData?: true }): Promise<T[]>;
  batch<T = any>(requests: RequestConfig[], config?: RequestConfig & { returnData: false }): Promise<Response<T>[]>;
  batch<T = any>(requests: RequestConfig[], config: RequestConfig = {}): Promise<(Response<T> | T)[]> {
    if (!this || !this.batchManager) {
      throw new Error('WxRequest实例的this上下文丢失。请使用wxRequest.batch()的方式调用，或使用bind绑定上下文。');
    }
    return this.batchManager.executeBatch(
      requests.map(req => deepMerge(config, req)),
      this.sendRequest.bind(this)
    ).then(responses => {
      if (config.returnData !== undefined ? config.returnData : this.defaults.returnData) {
        return responses.map(response => response.data);
      }
      return responses;
    });
  }
  
  /**
   * 预请求
   * @param config 预请求配置
   */
  preRequest(config: RequestConfig & { preloadKey: string }): Promise<void> {
    if (!this || !this.preloadManager) {
      throw new Error('WxRequest实例的this上下文丢失。请使用wxRequest.preRequest()的方式调用，或使用bind绑定上下文。');
    }
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
    if (!this || !this.cacheAdapter) {
      throw new Error('WxRequest实例的this上下文丢失。请使用wxRequest.clearCache()的方式调用，或使用bind绑定上下文。');
    }
    return this.cacheAdapter.clear();
  }
  
  /**
   * 取消请求
   * @param filter 过滤条件
   */
  cancelRequests(filter: (config: RequestConfig) => boolean): void {
    if (!this || !this.requestQueue) {
      throw new Error('WxRequest实例的this上下文丢失。请使用wxRequest.cancelRequests()的方式调用，或使用bind绑定上下文。');
    }
    this.requestQueue.cancel(filter);
  }
  
  /**
   * 获取请求库状态
   */
  getStatus() {
    if (!this || !this.requestQueue || !this.preloadManager) {
      throw new Error('WxRequest实例的this上下文丢失。请使用wxRequest.getStatus()的方式调用，或使用bind绑定上下文。');
    }
    return {
      queue: this.requestQueue.getStatus(),
      preload: this.preloadManager.getStatus()
    };
  }
  
  /**
   * 取消所有请求和加载提示
   */
  cancelAll(): void {
    if (!this || !this.loadingManager) {
      throw new Error('WxRequest实例的this上下文丢失。请使用wxRequest.cancelAll()的方式调用，或使用bind绑定上下文。');
    }
    // 取消所有请求
    this.cancelRequests(() => true);
    
    // 隐藏所有加载提示
    this.loadingManager.hideAll();
  }
} 