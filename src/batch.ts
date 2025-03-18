import { RequestConfig, BatchItem, Response, BatchConfig } from './types';
import { generateRandomId, delay } from './utils';

/**
 * 批处理管理器
 */
export default class BatchManager {
  private batchGroups: Map<string, BatchItem[]> = new Map();
  private maxBatchSize: number;
  private batchInterval: number;
  private batchTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  
  /**
   * 构造函数
   * @param options 批处理选项
   */
  constructor(options: {
    maxBatchSize?: number;
    batchInterval?: number;
  } = {}) {
    this.maxBatchSize = options.maxBatchSize || 5;
    this.batchInterval = options.batchInterval || 50;
  }
  
  /**
   * 添加请求到批处理组
   * @param config 请求配置
   * @param adapter 请求适配器
   */
  addToBatch(config: RequestConfig, adapter: (config: RequestConfig) => Promise<Response>): Promise<Response> {
    return new Promise<Response>((resolve, reject) => {
      // 如果没有groupKey，生成一个随机ID作为单独的组
      const groupKey = config.groupKey || generateRandomId();
      
      // 创建批处理项
      const batchItem: BatchItem = {
        config,
        resolve,
        reject
      };
      
      // 获取或创建批处理组
      if (!this.batchGroups.has(groupKey)) {
        this.batchGroups.set(groupKey, []);
      }
      
      const group = this.batchGroups.get(groupKey)!;
      group.push(batchItem);
      
      // 如果达到最大批处理大小，立即处理
      if (group.length >= this.maxBatchSize) {
        this.processBatchGroup(groupKey, adapter);
        return;
      }
      
      // 否则设置定时器，延迟处理
      if (this.batchTimers.has(groupKey)) {
        clearTimeout(this.batchTimers.get(groupKey)!);
      }
      
      this.batchTimers.set(
        groupKey,
        setTimeout(() => {
          this.processBatchGroup(groupKey, adapter);
        }, this.batchInterval)
      );
    });
  }
  
  /**
   * 处理批处理组
   * @param groupKey 组键
   * @param adapter 请求适配器
   */
  private processBatchGroup(
    groupKey: string,
    adapter: (config: RequestConfig) => Promise<Response>
  ): void {
    // 获取并移除组
    const group = this.batchGroups.get(groupKey) || [];
    this.batchGroups.delete(groupKey);
    
    // 清除定时器
    if (this.batchTimers.has(groupKey)) {
      clearTimeout(this.batchTimers.get(groupKey)!);
      this.batchTimers.delete(groupKey);
    }
    
    // 如果组为空，直接返回
    if (group.length === 0) {
      return;
    }
    
    // 如果只有一个请求，直接发送
    if (group.length === 1) {
      const item = group[0];
      adapter(item.config)
        .then(response => item.resolve(response))
        .catch(error => item.reject(error));
      return;
    }
    
    // 处理批量请求
    this.sendBatchRequest(group, adapter);
  }
  
  /**
   * 发送批量请求
   * @param items 批处理项列表
   * @param adapter 请求适配器
   */
  private sendBatchRequest(
    items: BatchItem[],
    adapter: (config: RequestConfig) => Promise<Response>
  ): void {
    // 从第一个请求获取基本配置
    const firstConfig = items[0].config;
    const baseURL = firstConfig.baseURL;
    const method = firstConfig.method || 'GET';
    
    // 构建批量请求数据
    const batchData = items.map(item => {
      const { url, method, data, params, headers } = item.config;
      
      return {
        url,
        method,
        data,
        params,
        headers
      };
    });
    
    // 构建批量请求配置
    const batchConfig: RequestConfig = {
      url: '/batch',  // 假设服务器有一个/batch端点
      method: 'POST',
      baseURL,
      data: batchData,
      headers: {
        'Content-Type': 'application/json',
        'X-Batch-Request': 'true'
      }
    };
    
    // 发送批量请求
    adapter(batchConfig)
      .then(batchResponse => {
        // 提取批量响应，假设服务器返回了一个数组响应
        const responseArray = Array.isArray(batchResponse.data) 
          ? batchResponse.data 
          : [batchResponse.data];
        
        // 处理每个响应
        items.forEach((item, index) => {
          if (index < responseArray.length) {
            const responseData = responseArray[index];
            
            // 创建单个响应对象
            const response: Response = {
              data: responseData.data,
              status: responseData.status || batchResponse.status,
              statusText: responseData.statusText || batchResponse.statusText,
              headers: responseData.headers || {},
              config: item.config,
              request: batchResponse.request,
              timestamp: Date.now()
            };
            
            item.resolve(response);
          } else {
            // 如果响应数量不匹配，拒绝Promise
            item.reject(new Error('批量响应不匹配'));
          }
        });
      })
      .catch(error => {
        // 所有批处理项都拒绝
        items.forEach(item => item.reject(error));
      });
  }
  
  /**
   * 执行批量请求（手动API，直接发送多个请求）
   * @param configs 请求配置数组
   * @param adapter 请求适配器
   */
  executeBatch(
    configs: RequestConfig[],
    adapter: (config: RequestConfig) => Promise<Response>
  ): Promise<Response[]> {
    return Promise.all(configs.map(config => adapter(config)));
  }
} 