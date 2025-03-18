// HTTP方法类型
export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'TRACE' | 'CONNECT';

// 缓存模式
export type CacheMode = boolean | 'force-cache' | 'only-if-cached' | 'no-cache';

type a = WechatMiniprogram.RequestOption

// 请求配置接口
export interface RequestConfig {
  url?: string;                     // 请求URL
  baseURL?: string;                 // 基础URL
  method?: Method;                  // HTTP方法
  data?: any;                       // 请求数据
  params?: Record<string, any>;     // URL参数
  headers?: Record<string, string>; // 请求头
  timeout?: number;                 // 超时时间(ms)
  
  // 缓存相关
  cache?: CacheMode;                // 缓存模式
  cacheKey?: string;                // 缓存键，默认为url+params+data的组合
  cacheExpire?: number;             // 缓存过期时间(ms)
  
  // 重试相关
  retry?: boolean | number;         // 是否重试或重试次数
  retryDelay?: number;              // 重试延迟(ms)
  retryIncrementalDelay?: boolean;  // 是否使用递增延迟
  
  // 队列相关
  priority?: number;                // 优先级(1-10，10为最高)
  cancelOnNavigate?: boolean;       // 页面跳转时是否取消
  ignoreQueue?: boolean;            // 是否忽略队列限制
  groupKey?: string;                // 分组键（相同组的请求可以进行合并）
  
  // 请求/响应处理
  transformRequest?: (data: any, headers: Record<string, string>) => any;   // 转换请求数据
  transformResponse?: (data: any, response: Response) => any;               // 转换响应数据
  validateStatus?: (status: number) => boolean;                             // 验证状态码
  
  // 进度回调
  onDownloadProgress?: (progressEvent: any) => void;                        // 下载进度
  onUploadProgress?: (progressEvent: any) => void;                          // 上传进度
  
  // 微信原生配置透传
  enableHttp2?: boolean;            // 开启HTTP2
  enableQuic?: boolean;             // 开启QUIC
  enableCache?: boolean;            // 开启HTTP缓存
  enableVerify?: boolean;           // SSL证书校验(替代sslVerify)
  
  // 其他选项
  onDone?: (res: Response) => void;                        // 完成回调
  mock?: boolean | ((config: RequestConfig) => Response);  // 模拟响应
  cancelToken?: { promise: Promise<string> };              // 取消令牌
  [key: string]: any;                                      // 扩展字段
}

// 请求实例配置
export interface WxRequestConfig extends RequestConfig {
  // 全局配置
  maxCacheSize?: number;            // 最大缓存条目数
  maxCacheAge?: number;             // 默认缓存过期时间(ms)
  retryTimes?: number;              // 全局默认重试次数
  retryDelay?: number;              // 全局默认重试延迟
  enableQueue?: boolean;            // 是否启用请求队列
  maxConcurrent?: number;           // 最大并发请求数
  enableOfflineQueue?: boolean;     // 无网络时是否进入离线队列
  batchInterval?: number;           // 批处理请求间隔(ms)
  batchMaxSize?: number;            // 批处理最大请求数
  requestAdapter?: RequestAdapter;  // 请求适配器
  cacheAdapter?: CacheAdapter;      // 缓存适配器
}

// 响应接口
export interface Response<T = any> {
  data: T;                          // 响应数据
  status: number;                   // HTTP状态码
  statusText: string;               // 状态文本
  headers: Record<string, string>;  // 响应头
  config: RequestConfig;            // 请求配置
  request?: any;                    // 原始请求对象
  fromCache?: boolean;              // 是否来自缓存
  timestamp?: number;               // 响应时间戳
}

// 错误接口
export interface RequestError extends Error {
  config: RequestConfig;            // 请求配置
  status?: number;                  // HTTP状态码
  statusText?: string;              // 状态文本
  headers?: Record<string, string>; // 响应头
  data?: any;                       // 响应数据
  request?: any;                    // 原始请求对象
  type?: ErrorType;                 // 错误类型
  retryCount?: number;              // 已重试次数
}

// 错误类型枚举
export enum ErrorType {
  TIMEOUT = 'TIMEOUT',              // 超时
  NETWORK = 'NETWORK',              // 网络错误
  CANCEL = 'CANCEL',                // 请求取消
  SERVER = 'SERVER',                // 服务器错误
  CLIENT = 'CLIENT',                // 客户端错误
  OFFLINE = 'OFFLINE',              // 离线错误
  UNKNOWN = 'UNKNOWN'               // 未知错误
}

// 拦截器处理函数
export interface InterceptorHandlers<T> {
  fulfilled: (value: T) => T | Promise<T>;
  rejected?: (error: any) => any;
}

// 拦截器接口
export interface Interceptor<T> {
  use(handlers: InterceptorHandlers<T>): number;
  eject(id: number): void;
}

// 拦截器管理器
export interface InterceptorManager<T> {
  handlers: Array<InterceptorHandlers<T> | null>;
  use(fulfilled: (value: T) => T | Promise<T>, rejected?: (error: any) => any): number;
  eject(id: number): void;
  forEach(fn: (handler: InterceptorHandlers<T>) => void): void;
}

// 请求适配器接口
export interface RequestAdapter {
  (config: RequestConfig): Promise<Response>;
}

// 缓存适配器接口
export interface CacheAdapter {
  get(key: string): Promise<Response | undefined>;
  set(key: string, value: Response, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

// 队列项接口
export interface QueueItem {
  config: RequestConfig;
  resolve: (value: Response | PromiseLike<Response>) => void;
  reject: (reason?: any) => void;
  timestamp: number;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// 批处理项
export interface BatchItem {
  config: RequestConfig;
  resolve: (value: Response) => void;
  reject: (reason: any) => void;
}

// 批处理配置
export interface BatchConfig {
  urls: string[];
  method?: Method;
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

// 网络状态
export interface NetworkStatus {
  isConnected: boolean;
  networkType: 'wifi' | '2g' | '3g' | '4g' | '5g' | 'unknown' | 'none';
  signalStrength?: number; // 信号强度，范围0-100
}

// 预请求配置
export interface PreRequestConfig extends RequestConfig {
  preloadKey: string;  // 预加载键
  expireTime?: number; // 过期时间
}

// 状态监控数据
export interface MonitorData {
  totalRequests: number;
  successRequests: number;
  failedRequests: number;
  cachedRequests: number;
  averageResponseTime: number;
  requestsPerMinute: number;
  errorRate: number;
  currentQueueSize: number;
  currentNetworkStatus: NetworkStatus;
} 