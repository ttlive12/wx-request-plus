import { CacheAdapter, Response } from './types';
import LRUCache from 'lru-cache';

/**
 * LRU缓存适配器
 */
export default class LRUCacheAdapter implements CacheAdapter {
  private cache: LRUCache<string, Response>;
  
  /**
   * 构造函数
   * @param options 缓存选项
   */
  constructor(options: {
    /**
     * 最大缓存条目数
     */
    maxSize?: number;
    /**
     * 默认过期时间(ms)
     */
    maxAge?: number;
  } = {}) {
    this.cache = new LRUCache({
      max: options.maxSize || 100,
      ttl: options.maxAge || 5 * 60 * 1000, // 默认5分钟
      allowStale: false,
      updateAgeOnGet: true,
      updateAgeOnHas: false
    });
  }

  /**
   * 获取缓存
   * @param key 缓存键
   */
  async get(key: string): Promise<Response | undefined> {
    const cachedResponse = this.cache.get(key);
    
    if (cachedResponse) {
      // 标记响应为来自缓存
      cachedResponse.fromCache = true;
    }
    
    return cachedResponse;
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间(ms)
   */
  async set(key: string, value: Response, ttl?: number): Promise<void> {
    // 添加时间戳
    value.timestamp = Date.now();
    
    this.cache.set(key, value, {
      ttl: ttl || undefined
    });
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }
} 