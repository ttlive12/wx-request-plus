import { RequestAdapter, RequestConfig, Response, ErrorType, RequestError } from './types';
import { createError, parseHeaders } from './utils';

/**
 * 微信小程序请求适配器
 */
const wxRequestAdapter: RequestAdapter = (config: RequestConfig): Promise<Response> => {
  return new Promise((resolve, reject) => {
    // 准备请求参数
    const { 
      url, 
      data, 
      headers = {}, 
      method = 'GET',
      timeout,
      responseType,
      enableHttp2,
      enableQuic,
      enableCache,
      enableVerify  // 使用enableVerify替代sslVerify
    } = config;

    if (!url) {
      reject(createError('请求URL不能为空', config, undefined, undefined, undefined, ErrorType.CLIENT));
      return;
    }

    // 创建请求参数对象，只包含wx.request支持的选项
    const requestOptions: WechatMiniprogram.RequestOption = {
      url,
      data,
      header: headers,
      method: method as any,
      timeout,
      enableHttp2,
      enableQuic,
      enableCache,
      
      success(res) {
        // 处理成功响应
        const response: Response = {
          data: res.data,
          status: res.statusCode,
          statusText: res.errMsg || '',
          headers: res.header || {},
          config,
          request: requestTask,
          timestamp: Date.now()
        };

        const validateStatus = config.validateStatus || ((status: number) => status >= 200 && status < 300);

        if (validateStatus(res.statusCode)) {
          // 如果状态码符合预期，解析响应
          if (config.transformResponse) {
            try {
              response.data = config.transformResponse(response.data, response);
            } catch (e) {
              reject(createError(
                `转换响应数据失败: ${(e as Error).message}`,
                config,
                res.statusCode,
                res.data,
                res.header,
                ErrorType.CLIENT
              ));
              return;
            }
          }
          
          // 回调完成处理函数
          if (config.onDone) {
            config.onDone(response);
          }
          
          resolve(response);
        } else {
          // 状态码不符合预期，创建错误
          reject(createError(
            `请求失败，状态码: ${res.statusCode}`,
            config,
            res.statusCode,
            res.data,
            res.header,
            res.statusCode >= 500 ? ErrorType.SERVER : ErrorType.CLIENT
          ));
        }
      },
      
      fail(err) {
        // 处理错误响应
        let errorType: ErrorType = ErrorType.UNKNOWN;
        let errorMessage = err.errMsg || '请求失败';
        
        // 详细分析错误类型
        if (err.errMsg) {
          if (err.errMsg.includes('timeout')) {
            errorType = ErrorType.TIMEOUT;
            errorMessage = '请求超时';
          } else if (err.errMsg.includes('abort')) {
            errorType = ErrorType.CANCEL;
            errorMessage = '请求已取消';
          } else if (err.errMsg.includes('fail')) {
            // 进一步细分网络错误类型
            if (err.errMsg.includes('断开') || err.errMsg.includes('disconnect')) {
              errorType = ErrorType.NETWORK;
              errorMessage = '网络连接断开';
            } else if (err.errMsg.includes('超时') || err.errMsg.includes('timeout')) {
              errorType = ErrorType.TIMEOUT;
              errorMessage = '请求超时';
            } else if (err.errMsg.includes('找不到') || err.errMsg.includes('not found')) {
              errorType = ErrorType.CLIENT;
              errorMessage = '未找到请求地址';
            } else {
              errorType = ErrorType.NETWORK;
              errorMessage = '网络请求失败';
            }
          }
        }
        
        const error = createError(
          errorMessage,
          config,
          0, // 微信小程序的错误对象没有statusCode
          undefined, // 微信小程序的错误对象没有data
          undefined, // 微信小程序的错误对象没有header
          errorType
        );
        
        // 添加原始错误对象，方便调试
        error.originalError = err;
        
        reject(error);
      }
    };

    // 某些版本的微信API支持这些选项，我们需要条件判断添加
    if (enableVerify !== undefined) {
      // @ts-ignore - 可能在某些版本API中不存在
      requestOptions.sslVerify = enableVerify;
    }

    if (responseType) {
      // @ts-ignore - 处理可能的类型兼容问题
      requestOptions.responseType = responseType;
    }
    
    let requestTask: WechatMiniprogram.RequestTask | null = null;
    
    try {
      // 创建请求任务
      requestTask = wx.request(requestOptions);
    } catch (e) {
      // 处理请求创建失败的情况
      const error = createError(
        `创建请求失败: ${(e as Error).message}`,
        config,
        0,
        undefined,
        undefined,
        ErrorType.CLIENT
      );
      error.originalError = e;
      reject(error);
      return;
    }
    
    // 处理请求进度回调，使用更兼容的方式
    try {
      if (config.onDownloadProgress && requestTask) {
        // @ts-ignore - 不同版本微信类型定义可能不包含此属性
        if (requestTask.onProgressUpdate) {
          // @ts-ignore
          requestTask.onProgressUpdate(config.onDownloadProgress);
        } else {
          console.warn('当前环境不支持下载进度监听');
        }
      }
    } catch (e) {
      console.warn('设置下载进度监听失败', e);
    }
    
    // 处理请求被取消的情况
    try {
      if (config.cancelToken && requestTask) {
        // @ts-ignore - 不同版本微信类型定义可能不包含此属性
        if (typeof requestTask.abort === 'function') {
          config.cancelToken.promise.then((reason: string) => {
            if (requestTask) {
              try {
                // @ts-ignore
                requestTask.abort();
              } catch (e) {
                console.warn('取消请求操作失败', e);
              }
              
              reject(createError(
                reason || '请求已取消',
                config,
                undefined,
                undefined,
                undefined,
                ErrorType.CANCEL
              ));
            }
          }).catch(e => {
            console.error('处理取消令牌时出错', e);
          });
        }
      }
    } catch (e) {
      console.warn('设置取消请求操作失败', e);
    }
  });
};

export default wxRequestAdapter; 