import { LoadingOptions } from './types';

/**
 * 加载管理器，处理请求过程中的加载提示
 */
export default class LoadingManager {
  private activeLoadings: Map<string, number> = new Map(); // 记录活跃的loading数量
  private loadingTimers: Map<string, ReturnType<typeof setTimeout>> = new Map(); // 延迟显示计时器
  private defaultOptions: LoadingOptions = {
    title: '加载中...',
    mask: false,
    delay: 300 // 默认延迟300ms显示，避免请求太快导致闪烁
  };

  /**
   * 构造函数
   * @param options 默认加载选项
   */
  constructor(options?: LoadingOptions) {
    if (options) {
      this.defaultOptions = { ...this.defaultOptions, ...options };
    }
  }

  /**
   * 显示加载提示
   * @param groupKey 分组键，相同键的请求共享一个loading
   * @param options 加载选项
   * @returns 用于取消loading的处理函数
   */
  show(groupKey: string = 'global', options?: LoadingOptions): () => void {
    // 合并选项
    const mergedOptions = { ...this.defaultOptions, ...options };
    const currentCount = this.activeLoadings.get(groupKey) || 0;
    
    // 增加loading计数
    this.activeLoadings.set(groupKey, currentCount + 1);
    
    // 如果是第一个请求，显示loading
    if (currentCount === 0) {
      // 清除可能存在的计时器
      if (this.loadingTimers.has(groupKey)) {
        clearTimeout(this.loadingTimers.get(groupKey)!);
        this.loadingTimers.delete(groupKey);
      }
      
      // 如果有延迟，设置计时器
      if (mergedOptions.delay && mergedOptions.delay > 0) {
        this.loadingTimers.set(
          groupKey,
          setTimeout(() => {
            this.showLoading(mergedOptions);
            this.loadingTimers.delete(groupKey);
          }, mergedOptions.delay)
        );
      } else {
        // 立即显示
        this.showLoading(mergedOptions);
      }
    }
    
    // 返回取消函数
    return () => this.hide(groupKey, mergedOptions);
  }
  
  /**
   * 隐藏加载提示
   * @param groupKey 分组键
   * @param options 加载选项
   */
  hide(groupKey: string = 'global', options?: LoadingOptions): void {
    const currentCount = this.activeLoadings.get(groupKey) || 0;
    
    // 减少loading计数
    if (currentCount > 0) {
      const newCount = currentCount - 1;
      this.activeLoadings.set(groupKey, newCount);
      
      // 如果计数为0，隐藏loading
      if (newCount === 0) {
        // 清除可能存在的定时器
        if (this.loadingTimers.has(groupKey)) {
          clearTimeout(this.loadingTimers.get(groupKey)!);
          this.loadingTimers.delete(groupKey);
        } else {
          // 清除loading
          this.hideLoading(options || this.defaultOptions);
        }
      }
    }
  }
  
  /**
   * 强制隐藏所有加载提示
   */
  hideAll(): void {
    // 清除所有计时器
    this.loadingTimers.forEach(timer => clearTimeout(timer));
    this.loadingTimers.clear();
    
    // 清空计数
    this.activeLoadings.clear();
    
    // 隐藏loading
    this.hideLoading(this.defaultOptions);
  }
  
  /**
   * 实际显示加载提示
   * @param options 加载选项
   */
  private showLoading(options: LoadingOptions): void {
    if (options.customLoader) {
      // 使用自定义loader
      options.customLoader(true, options);
    } else {
      // 使用微信原生loading
      wx.showLoading({
        title: options.title || '加载中...',
        mask: options.mask || false
      });
    }
  }
  
  /**
   * 实际隐藏加载提示
   * @param options 加载选项
   */
  private hideLoading(options: LoadingOptions): void {
    if (options.customLoader) {
      // 使用自定义loader
      options.customLoader(false, options);
    } else {
      // 使用微信原生loading
      wx.hideLoading();
    }
  }
} 