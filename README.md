# wx-request-plus

一个功能强大的微信小程序请求库，对wx.request进行了全面增强，提供更优雅的API和丰富的功能。

## ✨ 主要特性

- 🚀 **完整的TypeScript支持** - 类型安全的API调用，智能提示
- ⛓️ **Promise风格API** - 告别回调地狱，优雅处理异步
- 💾 **智能缓存机制** - LRU缓存策略，优化请求性能
- 📶 **弱网环境支持** - 离线队列，自动重试，网络恢复自动发送
- 🚦 **请求队列管理** - 控制并发，设置优先级，避免请求风暴
- 🔀 **并发请求支持** - 使用all方法同时发送多个请求，提高效率
- 🔮 **预请求支持** - 提前加载数据，瞬时响应用户操作
- 🛡️ **拦截器机制** - 全局处理请求和响应，统一错误处理
- 🔍 **自动提取响应字段** - 简化数据获取，直达核心内容
- 🔄 **智能重试机制** - 网络错误自动重试，指数退避策略
- ❌ **请求取消支持** - 取消不需要的请求，优化资源利用
- 🔧 **高度可定制化** - 更多适应各种复杂场景的灵活配置
- 💥 **强大的错误处理** - 详细的错误类型和信息，便于调试和处理

## 安装

```bash
npm install wx-request-plus --save
```

## 在小程序中引入

确保你的小程序项目配置中启用了 npm 支持：

1. 在微信开发者工具中，点击【工具】->【构建npm】
2. 在 `request.ts` 中引入：

```javascript
// request.ts
import WxRequest from 'wx-request-plus';

const wxRequest = WxRequest.create({
  baseURL: ENV.PROD,
  timeout: 4000
});

export default wxRequest
```

## 基本使用

### 创建请求实例

```typescript
import WxRequest from 'wx-request-plus';

// 推荐方式: 使用静态工厂方法创建实例
const wxRequest = WxRequest.create({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 也可以使用构造函数方式
// const wxRequest = new WxRequest({...});
```

### 发起请求

```typescript
// 发起GET请求
wxRequest.get('/users')
  .then(res => {
    console.log('用户数据:', res.data);
  })
  .catch(err => {
    console.error('请求失败:', err);
  });

// 发起POST请求
wxRequest.post('/users', {name: '张三', age: 25})
  .then(res => {
    console.log('创建成功:', res.data);
  });

// 在页面组件中使用
import wxRequest from './request';

Page({
  onLoad() {
    wxRequest.get('/products')
      .then(res => {
        this.setData({
          products: res.data
        });
      });
  }
})
```

## 功能特性

### 支持多种请求方式

```typescript
// 便捷方法
wxRequest.get('/users');
wxRequest.post('/users', { name: '张三' });
wxRequest.put('/users/1', { name: '李四' });

// 通用request方法
wxRequest.request({
  url: '/users',
  method: 'GET',
  params: { role: 'admin' }
});

// 灵活参数
wxRequest.request('/users');  // GET请求
wxRequest.request('/users', { name: '张三' });  // POST请求带数据
```

### 自动提取响应字段

自动提取标准API响应中的特定字段，简化数据处理流程。

```typescript
// 全局配置自动提取data字段
const wxRequest = WxRequest.create({
  baseURL: 'https://api.example.com',
  extractField: 'data' // 自动提取response.data
});

// 单次请求配置
wxRequest.get('/users', {
  extractField: 'data.list'  // 提取嵌套字段
});

wxRequest.get('/raw', {
  skipExtract: true  // 跳过提取，获取原始响应
});

// 使用自定义提取函数
wxRequest.get('/custom', {
  extractField: (data) => data.result.items.filter(item => item.active)
});
```

### 强大的缓存机制

支持多种缓存策略，在弱网环境下提供更好的用户体验。

```typescript
// 使用缓存
wxRequest.get('/config', { 
  cache: true,              // 启用缓存
  cacheExpire: 60000        // 缓存60秒
});

// 缓存模式
wxRequest.get('/users', { 
  cache: 'force-cache'      // 强制使用缓存，优先从缓存读取
});

wxRequest.get('/profile', { 
  cache: 'only-if-cached'   // 只使用缓存，没有缓存则报错
});

// 清除缓存
wxRequest.clearCache();
```

### 并发请求

使用`all`方法可以同时发送多个请求，并在所有请求完成后统一处理结果。

```typescript
// 并发请求示例
const request1 = wxRequest.get('/users');
const request2 = wxRequest.get('/products');
const request3 = wxRequest.post('/orders', { id: 123 });

// 使用async/await
async function fetchData() {
  const [users, products, order] = await wxRequest.all([
    wxRequest.get('/users'),
    wxRequest.get('/products'),
    wxRequest.post('/orders', { id: 123 })
  ]);
  
  console.log('用户列表:', users.data);
  console.log('产品列表:', products.data);
  console.log('订单详情:', order.data);
}
```

### 请求和响应拦截器

拦截请求和响应，进行全局处理，如添加认证信息、统一错误处理等。

```typescript
// 请求拦截器
wxRequest.interceptors.request.use(
  config => {
    // 添加token
    config.headers = { 
      ...config.headers,
      'Authorization': `Bearer ${wx.getStorageSync('token')}` 
    };
    // 对GET请求默认启用缓存
    if (config.method?.toUpperCase() === 'GET' && config.cache === undefined) {
      config.cache = true;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 使用响应拦截器可以统一处理错误
wxRequest.interceptors.response.use(
  response => response,
  error => {
    // 根据错误类型处理
    switch(error.type) {
      case ErrorType.TIMEOUT:
        console.error('请求超时', error.config.url);
        break;
      case ErrorType.NETWORK:
        console.error('网络连接错误', error.config.url);
        break;
      case ErrorType.SERVER:
        console.error('服务器错误', error.status, error.config.url);
        break;
      case ErrorType.CLIENT:
        console.error('客户端错误', error.status, error.config.url);
        break;
    }
    
    // 可以选择继续抛出错误或返回特定值
    return Promise.reject(error);
  }
);

```

### 错误重试和网络状态管理

智能处理网络错误，支持自动重试和网络状态监控。

```typescript
// 全局配置重试
const wxRequest = WxRequest.create({
  retryTimes: 3,     // 最大重试次数
  retryDelay: 1000   // 重试间隔(ms)
});

// 单次请求配置
wxRequest.get('/important-api', {
  retry: 5,  // 指定重试次数
  retryDelay: 2000,  // 重试间隔
  retryIncrementalDelay: true  // 递增延迟
});

// 获取网络状态
wxRequest.getNetworkStatus().then(status => {
  console.log('当前网络状态:', status.isConnected, status.networkType);
});
```

### 请求取消

支持取消正在进行的请求，避免不必要的网络开销。

```typescript
// 取消特定请求
wxRequest.cancelRequests(config => config.url.includes('/users'));

// 取消所有请求和加载提示
wxRequest.cancelAll();
```

## API文档

### 配置选项

| 参数 | 类型 | 描述 | 默认值 |
| --- | --- | --- | --- |
| baseURL | string | 请求的基础URL | '' |
| timeout | number | 超时时间(ms) | 10000 |
| headers | object | 默认请求头 | {'Content-Type': 'application/json'} |
| maxCacheSize | number | 最大缓存条目数 | 100 |
| maxCacheAge | number | 默认缓存过期时间(ms) | 5分钟 |
| retryTimes | number | 全局默认重试次数 | 3 |
| retryDelay | number | 全局默认重试延迟 | 1000 |
| enableQueue | boolean | 是否启用请求队列 | true |
| maxConcurrent | number | 最大并发请求数 | 10 |
| enableOfflineQueue | boolean | 无网络时是否进入离线队列 | true |
| extractField | string/function | 自动提取响应字段 | undefined |
| returnData | boolean | 是否直接返回数据而非Response对象 | false |


## 版本兼容性

- 支持的微信基础库版本: 2.2.1+
- TypeScript版本: 4.0+

## 许可证

MIT 