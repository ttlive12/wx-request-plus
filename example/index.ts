import WxRequest, { ErrorType } from '../src';

// 创建请求实例
const wxRequest = new WxRequest({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  // 启用缓存
  maxCacheSize: 200,
  maxCacheAge: 10 * 60 * 1000, // 10分钟
  // 设置重试
  retryTimes: 3,
  retryDelay: 1000,
  // 队列设置
  enableQueue: true,
  maxConcurrent: 5
});

// ===== 基本用法 =====

// GET请求
wxRequest.get('/users')
  .then(res => {
    console.log('用户数据:', res.data);
  })
  .catch(err => {
    console.error('请求失败:', err);
  });

// 带参数的GET请求
wxRequest.get('/users', {
  params: {
    page: 1,
    limit: 10
  }
})
  .then(res => {
    console.log('分页用户数据:', res.data);
  });

// POST请求
wxRequest.post('/users', {
  name: '张三',
  age: 25
})
  .then(res => {
    console.log('创建用户结果:', res.data);
  });

// ===== 进阶用法 =====

// 使用缓存
wxRequest.get('/config', {
  cache: true,
  cacheExpire: 5 * 60 * 1000 // 5分钟
})
  .then(res => {
    console.log('配置数据(可能来自缓存):', res.data);
    console.log('是否来自缓存:', res.fromCache);
  });

// 强制使用缓存
wxRequest.get('/products', {
  cache: 'only-if-cached'
})
  .then(res => {
    console.log('产品数据(仅从缓存):', res.data);
  })
  .catch(err => {
    console.error('缓存不存在:', err);
  });

// 批量请求
wxRequest.batch([
  { url: '/users', method: 'GET' },
  { url: '/products', method: 'GET' }
])
.then(([usersRes, productsRes]) => {
  console.log('用户:', usersRes.data);
  console.log('产品:', productsRes.data);
});

// 预请求
wxRequest.preRequest({
  url: '/user/profile',
  preloadKey: 'userProfile'
});

// 后续使用预请求结果
setTimeout(() => {
  wxRequest.get('/user/profile', {
    preloadKey: 'userProfile'
  })
    .then(res => {
      console.log('预加载的用户资料:', res.data);
    });
}, 1000);

// ===== 拦截器 =====

// 请求拦截器
wxRequest.interceptors.request.use(
  config => {
    // 在发送请求前做些什么
    config.headers = { 
      ...config.headers, 
      'Authorization': `Bearer token123` 
    };
    return config;
  },
  error => {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);

// 响应拦截器
wxRequest.interceptors.response.use(
  response => {
    // 对响应数据做些什么
    const data = response.data;
    
    // 假设服务端返回格式是 { code: 0, data: xxx, message: '' }
    if (data && data.code !== 0) {
      return Promise.reject({
        message: data.message || '请求失败',
        data: data,
        response
      });
    }
    
    // 直接返回data字段
    response.data = data.data;
    return response;
  },
  error => {
    // 对响应错误做些什么
    if (error.status === 401) {
      // 处理未授权错误
      console.log('需要登录');
      // 可以在这里调用登录页面
    }
    return Promise.reject(error);
  }
);

// ===== 高级用法 =====

// 取消请求
const cancelTokenSource = {
  promise: new Promise<string>((resolve) => {
    setTimeout(() => resolve('用户取消了操作'), 3000);
  })
};

wxRequest.get('/long-operation', {
  cancelToken: cancelTokenSource
})
  .catch(err => {
    if (err.type === ErrorType.CANCEL) {
      console.log('请求已取消');
    }
  });

// 获取网络状态
wxRequest.getNetworkStatus()
  .then(status => {
    console.log('当前网络状态:', status);
  });

// 监控请求状态
console.log('当前请求状态:', wxRequest.getStatus());

// 按照URL模式取消请求
wxRequest.cancelRequests(config => {
  if (config.url) {
    return config.url.includes('/users');
  }
  return false;
});

// 清除缓存
wxRequest.clearCache();

// 分组请求（会自动合并处理）
wxRequest.get('/users/1', { groupKey: 'user-info' });
wxRequest.get('/users/2', { groupKey: 'user-info' });
wxRequest.get('/users/3', { groupKey: 'user-info' }); 