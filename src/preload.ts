import { PreRequestConfig, Response } from './types';

/**
 * 预请求管理器
 */
export default class PreloadManager {
  private preloadCache: Map<string, { response: Response; expireTime: number }> = new Map();
  
  /**
   * 构造函数
   */
  constructor() {
    // 定期清理过期预请求
    this.setupCleanupTimer();
  }
  
  /**
   * 预加载请求
   * @param config 预请求配置
   * @param adapter 请求适配器
   */
  preload(
    config: PreRequestConfig,
    adapter: (config: PreRequestConfig) => Promise<Response>
  ): Promise<void> {
    const { preloadKey, expireTime = 30000 } = config;
    
    return adapter(config)
      .then(response => {
        // 计算过期时间
        const expiresAt = Date.now() + expireTime;
        
        // 存储响应
        this.preloadCache.set(preloadKey, {
          response,
          expireTime: expiresAt
        });
      })
      .catch(error => {
        console.error('预请求失败:', error);
        // 预请求失败不会抛出错误，而是静默失败
      });
  }
  
  /**
   * 获取预加载的响应
   * @param key 预加载键
   */
  getPreloadResponse(key: string): Response | null {
    const cached = this.preloadCache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // 检查是否过期
    if (cached.expireTime < Date.now()) {
      this.preloadCache.delete(key);
      return null;
    }
    
    // 使用后删除
    this.preloadCache.delete(key);
    
    return cached.response;
  }
  
  /**
   * 检查是否有预加载响应
   * @param key 预加载键
   */
  hasPreloadResponse(key: string): boolean {
    const cached = this.preloadCache.get(key);
    
    if (!cached) {
      return false;
    }
    
    // 检查是否过期
    if (cached.expireTime < Date.now()) {
      this.preloadCache.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * 清理过期的预加载
   */
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, value] of this.preloadCache.entries()) {
      if (value.expireTime < now) {
        this.preloadCache.delete(key);
      }
    }
  }
  
  /**
   * 设置定期清理定时器
   */
  private setupCleanupTimer(): void {
    // 每分钟清理一次过期预请求
    setInterval(() => {
      this.cleanup();
    }, 60000);
  }
  
  /**
   * 获取当前缓存状态
   */
  getStatus(): { count: number; keys: string[] } {
    return {
      count: this.preloadCache.size,
      keys: Array.from(this.preloadCache.keys())
    };
  }
} 