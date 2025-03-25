import { RequestConfig, ErrorType, RequestError, NetworkStatus } from './types';

/**
 * 合并多个对象，后面的会覆盖前面的
 */
export function deepMerge<T>(...objects: any[]): T {
  const result: any = {};

  objects.forEach(obj => {
    if (!obj) return;
    
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        if (typeof result[key] === 'object' && result[key] !== null) {
          result[key] = deepMerge(result[key], value);
        } else {
          result[key] = deepMerge({}, value);
        }
      } else {
        result[key] = value;
      }
    });
  });

  return result as T;
}

/**
 * 构建完整的URL
 */
export function buildURL(url: string, baseURL?: string, params?: Record<string, any>): string {
  // 拼接baseURL和url
  let fullUrl = '';
  if (baseURL && !isAbsoluteURL(url)) {
    fullUrl = combineURLs(baseURL, url);
  } else {
    fullUrl = url;
  }

  // 添加查询参数
  if (params && Object.keys(params).length > 0) {
    const urlParts = fullUrl.split('#');
    const queryString = serializeParams(params);
    
    // 判断是否已有查询参数
    const separator = urlParts[0].indexOf('?') === -1 ? '?' : '&';
    urlParts[0] += separator + queryString;
    
    // 重组URL（包括hash部分）
    fullUrl = urlParts.join('#');
  }

  return fullUrl;
}

/**
 * 判断是否为绝对URL
 */
export function isAbsoluteURL(url: string): boolean {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}

/**
 * 合并BaseURL和相对URL
 */
export function combineURLs(baseURL: string, relativeURL: string): string {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
}

/**
 * 序列化参数对象为查询字符串
 */
export function serializeParams(params: Record<string, any>): string {
  const parts: string[] = [];

  Object.keys(params).forEach(key => {
    const value = params[key];
    
    if (value === null || typeof value === 'undefined') {
      return;
    }
    
    if (Array.isArray(value)) {
      value.forEach(val => {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
      });
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  });

  return parts.join('&');
}

/**
 * 生成缓存键
 * @param config 请求配置
 * @returns 缓存键
 */
export function generateCacheKey(config: RequestConfig): string {
  const { url = '', method = 'GET', params, data } = config;
  
  // 如果配置中提供了自定义缓存键，直接使用
  if (config.cacheKey) {
    return config.cacheKey;
  }
  
  // 基础缓存键
  let cacheKey = `${method}:${url}`;
  
  // 添加查询参数(如果有)
  if (params && Object.keys(params).length > 0) {
    cacheKey += `:params:${JSON.stringify(sortObjectKeys(params))}`;
  }
  
  // 添加请求数据
  if (data !== undefined) {
    try {
      // 对于对象数据，排序后再序列化，确保一致性
      if (typeof data === 'object' && data !== null) {
        cacheKey += `:data:${JSON.stringify(sortObjectKeys(data))}`;
      } else {
        cacheKey += `:data:${String(data)}`;
      }
    } catch (e) {
      // 如果数据无法序列化，使用简单的字符串表示
      cacheKey += `:data:${String(data)}`;
    }
  }
  
  // 使用哈希算法减小缓存键长度
  return sha256(cacheKey);
}

/**
 * 排序对象的键以确保一致性
 */
export function sortObjectKeys(obj: any): any {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }
  
  const sortedObj: Record<string, any> = {};
  const keys = Object.keys(obj).sort();
  
  keys.forEach(key => {
    sortedObj[key] = sortObjectKeys(obj[key]);
  });
  
  return sortedObj;
}

/**
 * 创建请求错误
 */
export function createError(
  message: string,
  config: RequestConfig,
  status?: number,
  data?: any,
  headers?: Record<string, string>,
  type: ErrorType = ErrorType.UNKNOWN
): RequestError {
  const error = new Error(message) as RequestError;
  
  error.config = config;
  error.status = status;
  error.data = data;
  error.headers = headers;
  error.type = type;
  
  return error;
}

/**
 * 使用Promise封装setTimeout
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 检查是否为网络错误
 */
export function isNetworkError(error: any): boolean {
  return !error.status && error.type === ErrorType.NETWORK;
}

/**
 * 获取当前网络状态
 */
export function getNetworkStatus(): Promise<NetworkStatus> {
  return new Promise((resolve) => {
    wx.getNetworkType({
      success(res) {
        const networkType = res.networkType;
        const isConnected = networkType !== 'none';
        
        resolve({
          isConnected,
          networkType,
          // 信号强度可能需要通过其他API获取，这里做一个模拟
          signalStrength: isConnected ? (networkType === 'wifi' ? 90 : 70) : 0
        });
      },
      fail() {
        // 如果获取失败，假设网络连接正常
        resolve({
          isConnected: true,
          networkType: 'unknown'
        });
      }
    });
  });
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 判断请求是否应该被缓存
 */
export function shouldCache(config: RequestConfig): boolean {
  // 默认method为GET
  const method = (config.method || 'GET').toUpperCase();
  const { cache } = config;
  
  // 如果cache明确设为false或'no-cache'，不缓存
  if (cache === false || cache === 'no-cache') {
    return false;
  }
  
  // 只缓存GET请求
  if (method !== 'GET') {
    return false;
  }
  
  // 以下情况启用缓存:
  // 1. cache 为 true - 使用缓存并在后台刷新
  // 2. cache 为 'force-cache' - 优先使用缓存，不刷新
  // 3. cache 为 'only-if-cached' - 只使用缓存，没有缓存则失败
  return cache === true || 
         cache === 'force-cache' || 
         cache === 'only-if-cached';
}

/**
 * 获取请求的优先级
 */
export function getPriority(config: RequestConfig): number {
  return config.priority || 5; // 默认中等优先级
}

/**
 * 正规化请求头字段名
 */
export function normalizeHeaderName(headers: Record<string, string>, normalizedName: string): void {
  if (!headers) return;
  
  Object.keys(headers).forEach(name => {
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      headers[normalizedName] = headers[name];
      delete headers[name];
    }
  });
}

/**
 * 解析响应头字符串为对象
 */
export function parseHeaders(headers: string): Record<string, string> {
  const parsed: Record<string, string> = {};
  let key: string;
  let val: string;
  let i: number;
  
  if (!headers) {
    return parsed;
  }
  
  const headerArr = headers.split('\n');
  
  headerArr.forEach(line => {
    i = line.indexOf(':');
    if (i === -1) return; // 跳过无效行
    
    key = line.substring(0, i).trim().toLowerCase();
    val = line.substring(i + 1).trim();
    
    if (key) {
      parsed[key] = parsed[key] ? `${parsed[key]}, ${val}` : val;
    }
  });
  
  return parsed;
}

/**
 * 是否为JSON数据
 */
export function isJSONData(data: any): boolean {
  return Object.prototype.toString.call(data) === '[object Object]' || 
         Array.isArray(data);
}

/**
 * 随机ID生成
 */
export function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * 安全获取对象的嵌套属性
 * @param obj 目标对象
 * @param path 属性路径，例如'data.results'
 * @param defaultValue 默认值，如果未找到属性则返回此值
 * @returns 属性值或默认值
 */
export function get(obj: any, path: string, defaultValue: any = undefined): any {
  if (!obj || !path) return defaultValue;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result === undefined ? defaultValue : result;
}

/**
 * 根据路径从对象中提取值
 * @param obj 目标对象
 * @param path 属性路径，例如'data.results.0.id'
 * @param defaultValue 默认值，如果未找到属性则返回此值
 * @returns 属性值或默认值
 */
export function getValueByPath(obj: any, path: string, defaultValue: any = undefined): any {
  if (!obj || !path) return defaultValue;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result === undefined ? defaultValue : result;
}

/**
 * 简单的字符串哈希函数，生成固定长度哈希
 * 注意：这不是真正的SHA-256，仅用于缓存键生成
 * @param str 要哈希的字符串
 * @returns 哈希字符串
 */
export function sha256(str: string): string {
  let hash = 0;
  if (str.length === 0) return hash.toString(36);
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  // 转换为36进制并返回固定长度字符串
  return Math.abs(hash).toString(36).padStart(8, '0');
} 