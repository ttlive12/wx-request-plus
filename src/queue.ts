import { QueueItem, RequestConfig, Response, ErrorType } from './types';
import { createError, getPriority, getNetworkStatus } from './utils';

/**
 * 请求队列管理器
 */
export default class RequestQueue {
  private queue: QueueItem[] = [];
  private processing: QueueItem[] = [];
  private maxConcurrent: number;
  private enableOfflineQueue: boolean;
  private offlineQueue: QueueItem[] = [];
  private isProcessing: boolean = false;
  private isNetworkAvailable: boolean = true;
  
  /**
   * 构造函数
   * @param options 队列选项
   */
  constructor(options: {
    maxConcurrent?: number;
    enableOfflineQueue?: boolean;
  } = {}) {
    this.maxConcurrent = options.maxConcurrent || 10;
    this.enableOfflineQueue = options.enableOfflineQueue !== false;
    
    // 监听网络状态变化
    this.setupNetworkListener();
  }
  
  /**
   * 添加请求到队列
   * @param config 请求配置
   * @param executor 请求执行函数，负责实际执行请求
   * @returns Promise
   */
  enqueue(config: RequestConfig, executor: () => Promise<Response>): Promise<Response> {
    return new Promise<Response>((resolve, reject) => {
      const priority = getPriority(config);
      
      // 创建队列项
      const queueItem: QueueItem = {
        config,
        execute: () => {
          
          // 使用传入的executor函数执行请求，并处理结果
          return executor()
            .then(response => {
              resolve(response);
              return Promise.resolve();
            })
            .catch(error => {
              reject(error);
              return Promise.resolve(); // 确保即使出错，Promise也会resolve，以便队列继续处理
            });
        },
        timestamp: Date.now(),
        priority,
        status: 'pending'
      };
      
      // 检查请求是否忽略队列
      if (config.ignoreQueue) {
        this.processItem(queueItem);
        return;
      }
      
      // 检查网络状态
      if (!this.isNetworkAvailable) {
        if (this.enableOfflineQueue) {
          this.offlineQueue.push(queueItem);
        } else {
          reject(createError(
            '网络不可用',
            config,
            undefined,
            undefined,
            undefined,
            ErrorType.OFFLINE
          ));
        }
        return;
      }
      
      // 添加到队列并按优先级排序
      this.queue.push(queueItem);
      this.sortQueue();
      
      // 尝试处理队列
      this.processQueue();
    });
  }
  
  /**
   * 取消请求
   * @param predicate 取消条件
   */
  cancel(predicate: (config: RequestConfig) => boolean): void {
    // 取消待处理队列中的请求
    this.queue = this.queue.filter(item => {
      if (predicate(item.config)) {
        // 不再需要调用reject，因为队列项现在没有reject函数
        return false;
      }
      return true;
    });
    
    // 取消离线队列中的请求
    this.offlineQueue = this.offlineQueue.filter(item => {
      if (predicate(item.config)) {
        return false;
      }
      return true;
    });
    
    // 注意：正在处理的请求需要通过cancelToken取消
  }
  
  /**
   * 清空队列
   */
  clear(): void {
    this.queue = [];
    this.offlineQueue = [];
  }
  
  /**
   * 获取队列状态
   */
  getStatus() {
    return {
      queueSize: this.queue.length,
      processingSize: this.processing.length,
      offlineQueueSize: this.offlineQueue.length,
      isNetworkAvailable: this.isNetworkAvailable
    };
  }
  
  /**
   * 处理队列中的请求
   */
  private processQueue(): void {
    if (this.isProcessing) {
      return;
    }
    
    this.isProcessing = true;
    
    const processNext = () => {
      // 检查是否有空闲槽位
      if (this.processing.length >= this.maxConcurrent || this.queue.length === 0) {
        this.isProcessing = false;
        return;
      }
      
      // 获取下一个请求
      const item = this.queue.shift();
      if (!item) {
        this.isProcessing = false;
        return;
      }
      
      // 处理请求
      this.processItem(item);
      
      // 继续处理下一个
      processNext();
    };
    
    processNext();
  }
  
  /**
   * 处理单个请求项
   * @param item 队列项
   */
  private processItem(item: QueueItem): void {
    // 标记为处理中
    item.status = 'processing';
    this.processing.push(item);
    
    // 创建处理完成的回调
    const handleComplete = () => {
      // 从处理列表中移除
      const index = this.processing.indexOf(item);
      if (index !== -1) {
        this.processing.splice(index, 1);
      }
      
      // 继续处理队列
      this.processQueue();
    };
    
    // 执行请求 - 使用队列项的execute方法
    item.execute()
      .then(() => {
        item.status = 'completed';
      })
      .catch(error => {
        item.status = 'failed';
        console.error('队列项执行失败:', error);
      })
      .finally(handleComplete);
  }
  
  /**
   * 按优先级排序队列
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // 首先按优先级排序（高到低）
      const priorityDiff = b.priority - a.priority;
      if (priorityDiff !== 0) return priorityDiff;
      
      // 然后按时间戳排序（先进先出）
      return a.timestamp - b.timestamp;
    });
  }
  
  /**
   * 设置网络状态监听
   */
  private setupNetworkListener(): void {
    // 初始检查网络状态
    getNetworkStatus().then(status => {
      this.handleNetworkChange(status.isConnected);
    });
    
    // 监听网络状态变化
    wx.onNetworkStatusChange(res => {
      this.handleNetworkChange(res.isConnected);
    });
  }
  
  /**
   * 处理网络状态变化
   * @param isConnected 是否连接
   */
  private handleNetworkChange(isConnected: boolean): void {
    this.isNetworkAvailable = isConnected;
    
    if (isConnected) {
      // 网络恢复，处理离线队列
      if (this.offlineQueue.length > 0) {
        const offlineItems = [...this.offlineQueue];
        this.offlineQueue = [];
        
        // 将离线队列的请求添加到主队列
        offlineItems.forEach(item => {
          this.queue.push(item);
        });
        
        this.sortQueue();
        this.processQueue();
      }
    }
  }
} 