import { RequestAdapter, RequestConfig, Response, ErrorType } from './types';
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
        
        // 分析错误类型
        if (err.errMsg) {
          if (err.errMsg.includes('timeout')) {
            errorType = ErrorType.TIMEOUT;
          } else if (err.errMsg.includes('fail')) {
            errorType = ErrorType.NETWORK;
          }
        }
        
        reject(createError(
          err.errMsg || '请求失败',
          config,
          err.errno,
          undefined,
          undefined,
          errorType
        ));
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
    
    // 创建请求任务
    const requestTask = wx.request(requestOptions);
    
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
            // @ts-ignore
            requestTask.abort();
            reject(createError(
              reason || '请求已取消',
              config,
              undefined,
              undefined,
              undefined,
              ErrorType.CANCEL
            ));
          });
        }
      }
    } catch (e) {
      console.warn('取消请求操作失败', e);
    }
  });
};

export default wxRequestAdapter; 