# wx-request-plus

一个功能强大的微信小程序请求库，对wx.request进行了全面增强，提供更优雅的API和丰富的功能。

## ✨ 主要特性

- 🚀 **完整的TypeScript支持** - 类型安全的API调用，智能提示
- ⛓️ **Promise风格API** - 告别回调地狱，优雅处理异步
- 💾 **智能缓存机制** - LRU缓存策略，优化请求性能
- 📶 **弱网环境支持** - 离线队列，自动重试，网络恢复自动发送
- 🚦 **请求队列管理** - 控制并发，设置优先级，避免请求风暴
- 📦 **请求合并与批处理** - 合并多个请求为一个HTTP请求，减少网络开销
- 🔮 **预请求支持** - 提前加载数据，瞬时响应用户操作
- 🛡️ **拦截器机制** - 全局处理请求和响应，统一错误处理
- ⏳ **智能加载提示** - 自动管理loading状态，支持分组和自定义
- 🔍 **自动提取响应字段** - 简化数据获取，直达核心内容
- 🔄 **智能重试机制** - 网络错误自动重试，指数退避策略
- ❌ **请求取消支持** - 取消不需要的请求，优化资源利用
- 🔧 **高度可定制化** - 适应各种复杂场景的灵活配置

## 安装

```bash
npm install wx-request-plus --save
```

## 在小程序中引入

确保你的小程序项目配置中启用了 npm 支持：

1. 在微信开发者工具中，点击【工具】->【构建npm】
2. 在 `app.js` 中引入：

```javascript
import WxRequest from 'wx-request-plus';

// 创建实例并挂载到全局
const wxRequest = WxRequest.create({
  baseURL: 'https://api.example.com'
});

// 挂载到全局对象以便在其他页面使用
App({
  globalData: {
    wxRequest
  }
})
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
Page({
  onLoad() {
    const app = getApp();
    app.globalData.wxRequest.get('/products')
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
wxRequest.delete('/users/1');
wxRequest.head('/users');
wxRequest.options('/users');

// 通用request方法
wxRequest.request({
  url: '/users',
  method: 'GET',
  params: { role: 'admin' }
});

// 灵活参数
wxRequest.request('/users');  // GET请求
wxRequest.request('/users', 'POST');  // POST请求
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

### 请求队列和并发控制

智能管理请求队列，控制并发数量，确保重要请求优先处理。

```typescript
// 全局配置
const wxRequest = WxRequest.create({
  enableQueue: true,        // 启用请求队列
  maxConcurrent: 5,         // 最大并发请求数
  enableOfflineQueue: true  // 离线时自动加入队列
});

// 设置请求优先级
wxRequest.get('/important', { 
  priority: 10  // 高优先级(1-10)，数字越大优先级越高
});

// 忽略队列限制
wxRequest.get('/bypass-queue', { 
  ignoreQueue: true  // 该请求不进入队列
});
```

### 批量请求处理

支持将多个请求合并为一个HTTP请求发送，减少网络开销。

```typescript
// 自动批处理
wxRequest.get('/users/1', { groupKey: 'userGroup' });
wxRequest.get('/users/2', { groupKey: 'userGroup' });
wxRequest.get('/users/3', { groupKey: 'userGroup' });
// 相同groupKey的请求会自动合并发送

// 手动批量请求
wxRequest.batch([
  { url: '/users/1', method: 'GET' },
  { url: '/products/2', method: 'GET' },
  { url: '/orders', method: 'POST', data: { productId: 2 } }
])
.then(([userRes, productRes, orderRes]) => {
  console.log(userRes.data, productRes.data, orderRes.data);
});

// 批量请求配置
const wxRequest = WxRequest.create({
  batchConfig: {
    batchUrl: '/batch',             // 批量请求的URL
    batchMode: 'json',              // 合并模式: json或form
    requestsFieldName: 'requests',  // 请求数组字段名
    batchInterval: 50,              // 自动批处理间隔(ms)
    batchMaxSize: 5                 // 单批次最大请求数
  }
});
```

### 智能加载提示

自动管理加载提示的显示和隐藏，支持分组和自定义加载效果。

```typescript
// 全局配置
const wxRequest = WxRequest.create({
  enableLoading: true,      // 全局启用加载提示
  loadingOptions: {
    title: '加载中...',     // 提示文字
    mask: true,             // 显示遮罩
    delay: 300              // 延迟显示时间(ms)
  }
});

// 单次请求配置
wxRequest.get('/users', {
  showLoading: true  // 使用全局配置
});

// 自定义加载提示
wxRequest.post('/orders', data, {
  showLoading: {
    title: '提交订单中...',
    mask: true
  }
});

// 分组加载提示
wxRequest.get('/users', { groupKey: 'userInfo', showLoading: true });
wxRequest.get('/orders', { groupKey: 'userInfo', showLoading: true });
// 相同分组共享一个loading，全部完成后才会隐藏

// 自定义加载组件
const wxRequest = WxRequest.create({
  loadingOptions: {
    customLoader: (show, options) => {
      if (show) {
        this.setData({ loading: true, loadingText: options?.title });
      } else {
        this.setData({ loading: false });
      }
    }
  }
});
```

### 预请求支持

提前加载数据，在用户实际需要时立即提供，提升用户体验。

```typescript
// 预加载数据
wxRequest.preRequest({
  url: '/products',
  preloadKey: 'hotProducts',  // 预加载键
  expireTime: 60000           // 预加载数据有效期
});

// 实际使用时直接获取预加载的数据
wxRequest.get('/products', { 
  preloadKey: 'hotProducts'  // 使用预加载的数据
})
.then(res => {
  console.log('立即获取预加载数据:', res.data);
});
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
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
wxRequest.interceptors.response.use(
  response => {
    // 统一处理业务逻辑错误
    if (response.data.code !== 0) {
      wx.showToast({ title: response.data.message, icon: 'none' });
      return Promise.reject(response.data);
    }
    return response;
  },
  error => {
    // 统一处理HTTP错误
    if (error.status === 401) {
      // 处理登录过期
      wx.navigateTo({ url: '/pages/login/index' });
    } else {
      wx.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
    }
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
| timeout | number | 超时时间(ms) | 30000 |
| headers | object | 默认请求头 | {'Content-Type': 'application/json'} |
| maxCacheSize | number | 最大缓存条目数 | 100 |
| maxCacheAge | number | 默认缓存过期时间(ms) | 5分钟 |
| retryTimes | number | 全局默认重试次数 | 3 |
| retryDelay | number | 全局默认重试延迟 | 1000 |
| enableQueue | boolean | 是否启用请求队列 | true |
| maxConcurrent | number | 最大并发请求数 | 10 |
| enableOfflineQueue | boolean | 无网络时是否进入离线队列 | true |
| enableLoading | boolean | 全局是否启用加载提示 | false |
| loadingOptions | object | 全局加载提示配置 | {title:'加载中...',mask:false,delay:300} |
| extractField | string/function | 自动提取响应字段 | undefined |
| batchConfig | object | 批量请求配置 | {batchUrl:'/batch',batchMode:'json',...} |

### 批量请求配置选项

| 参数 | 类型 | 描述 | 默认值 |
| --- | --- | --- | --- |
| batchUrl | string | 批量请求的URL | /batch |
| batchMode | 'json'\|'form' | 请求合并模式 | json |
| requestsFieldName | string | 请求数组在请求体中的字段名 | requests |
| batchInterval | number | 自动批处理的时间间隔(ms) | 50 |
| batchMaxSize | number | 单个批处理的最大请求数 | 5 |
| responsePath | string | 响应数据的提取路径 | - |
| transformBatchRequest | function | 自定义请求数据转换函数 | - |
| transformBatchResponse | function | 自定义响应数据转换函数 | - |

## 常见问题

### this上下文丢失问题

如果遇到以下错误：`TypeError: Cannot read property 'defaults' of undefined`，通常是因为调用方法时丢失了this上下文。

#### 错误用法

```javascript
// ❌ 错误用法: 解构或单独传递方法会丢失this上下文
const { request, get } = wxRequest;
request('/api/users'); // 错误: this是undefined

const myRequest = wxRequest.request;
myRequest('/api/users'); // 错误: this是undefined
```

#### 正确用法

```javascript
// ✅ 正确用法1: 直接通过实例调用
wxRequest.request('/api/users');
wxRequest.get('/api/users');

// ✅ 正确用法2: 使用bind绑定上下文
const request = wxRequest.request.bind(wxRequest);
request('/api/users');

// ✅ 正确用法3: 使用箭头函数封装
const request = (url, config) => wxRequest.request(url, config);
request('/api/users');
```

### 类型兼容性问题

如果遇到TypeScript类型错误，可以尝试：

1. 使用构建脚本 `./build.sh`
2. 或手动运行 `npm run build --skipLibCheck`

## 版本兼容性

- 支持的微信基础库版本: 2.2.1+
- TypeScript版本: 4.0+

## 许可证

MIT 