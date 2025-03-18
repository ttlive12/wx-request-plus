// app.js
import WxRequest from 'wx-request-plus';

App({
  onLaunch() {
    // 初始化请求库
    this.initRequest();
  },

  globalData: {
    userInfo: null,
    request: null
  },

  // 初始化请求库
  initRequest() {
    // 创建请求实例
    const request = new WxRequest({
      baseURL: 'https://api.example.com',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      // 启用缓存
      maxCacheSize: 100,
      maxCacheAge: 5 * 60 * 1000, // 5分钟
      // 设置重试
      retryTimes: 3,
      retryDelay: 1000,
      // 队列设置
      enableQueue: true,
      maxConcurrent: 5
    });

    // 请求拦截器
    request.interceptors.request.use(
      config => {
        const token = wx.getStorageSync('token');
        if (token) {
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`
          };
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    request.interceptors.response.use(
      response => {
        const { code, data, message } = response.data;
        
        // 统一处理响应数据
        if (code === 0) {
          // 成功响应，直接返回数据部分
          response.data = data;
          return response;
        } else {
          // 业务错误
          return Promise.reject({
            code,
            message,
            data
          });
        }
      },
      error => {
        // 网络错误等
        const { status } = error;
        
        // 处理特定错误
        if (status === 401) {
          // 未授权，需要登录
          wx.navigateTo({
            url: '/pages/login/login'
          });
        } else if (status === 403) {
          // 无权限
          wx.showToast({
            title: '您没有权限访问',
            icon: 'none'
          });
        } else {
          // 其他错误
          wx.showToast({
            title: error.message || '请求失败',
            icon: 'none'
          });
        }
        
        return Promise.reject(error);
      }
    );

    // 将实例保存到全局
    this.globalData.request = request;
  }
}); 