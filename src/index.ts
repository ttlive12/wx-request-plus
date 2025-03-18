import WxRequest from './core';
import { createError, delay } from './utils';
import { ErrorType } from './types';

// 导出主类
export default WxRequest;

// 导出类型
export * from './types';

// 导出工具函数
export { createError, delay };

// 导出错误类型
export { ErrorType };

// 创建默认实例
const defaultInstance = new WxRequest();

// 将请求方法添加到默认实例
const { request, get, post, put, delete: deleteMethod, head, options, batch, preRequest } = defaultInstance;

// 导出方法
export {
  defaultInstance as wxRequest,
  request,
  get,
  post,
  put,
  deleteMethod as delete,
  head,
  options,
  batch,
  preRequest
};

// 导出拦截器
export const interceptors = defaultInstance.interceptors; 