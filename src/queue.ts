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
   * @param item 队列项
   * @returns 无返回值
   */
  enqueue(item: QueueItem): void {
    // 检查网络状态
    if (!this.isNetworkAvailable && this.enableOfflineQueue) {
      // 无网络时添加到离线队列
      this.offlineQueue.push(item);
      return;
    }
    
    // 添加到主队列
    this.queue.push(item);
    
    // 按优先级排序
    this.sortQueue();
    
    // 如果没有在处理，则开始处理队列
    if (!this.isProcessing) {
      this.processQueue();
    }
  }
  
  /**
   * 取消队列中的请求
   * @param predicate 断言函数，用于确定哪些请求应该被取消
   */
  cancel(predicate: (config: RequestConfig) => boolean): void {
    // 从队列中找出要取消的项并移除
    const toCancel = this.queue.filter(item => predicate(item.config));
    this.queue = this.queue.filter(item => !predicate(item.config));
    
    // 从处理中的请求找出要取消的项
    const processingToCancel = this.processing.filter(item => predicate(item.config));
    
    // 对每个找到的项执行取消操作
    [...toCancel, ...processingToCancel].forEach(item => {
      if (item.status === 'pending' || item.status === 'processing') {
        // 标记为失败
        item.status = 'failed';
      }
    });
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