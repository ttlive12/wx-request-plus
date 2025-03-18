# wx-request-plus

一个功能强大的微信小程序请求库，对wx.request进行了全面增强。

## 特性

- ✅ 完整的TypeScript支持和类型提示
- ✅ Promise风格API
- ✅ LRU缓存机制
- ✅ 无网/弱网支持
- ✅ 请求队列管理
- ✅ 请求合并与批处理
- ✅ 预请求支持
- ✅ 完善的错误处理
- ✅ 请求与响应拦截器
- ✅ 自动加载提示
- ✅ 高度可定制化

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
   ```

## 基本用法

```typescript
import WxRequest from 'wx-request-plus';

// 创建请求实例
const wxRequest = new WxRequest({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 使用Promise方式发起请求
wxRequest.get('/users')
  .then(res => {
    console.log('用户数据:', res.data);
  })
  .catch(err => {
    console.error('请求失败:', err);
  });

// 使用缓存
wxRequest.get('/config', { cache: true, cacheExpire: 60000 })
  .then(res => {
    console.log('配置数据(可能来自缓存):', res.data);
  });
```

## 加载提示

wx-request-plus 支持在请求过程中自动显示和隐藏加载提示，无需手动管理 wx.showLoading 和 wx.hideLoading。

### 基本用法

```typescript
// 全局启用加载提示
const wxRequest = new WxRequest({
  baseURL: 'https://api.example.com',
  enableLoading: true,  // 启用全局加载提示
  loadingOptions: {
    title: '加载中...',  // 自定义提示文字
    mask: true,         // 显示蒙层
    delay: 300          // 延迟显示，避免请求过快时闪烁
  }
});

// 为单个请求配置加载提示
wxRequest.get('/users', {
  showLoading: true  // 只显示加载提示，使用全局配置
});

// 自定义单个请求的加载提示
wxRequest.post('/orders', data, {
  showLoading: {
    title: '提交订单中...',
    mask: true,
    delay: 0  // 立即显示
  }
});

// 禁用特定请求的加载提示
wxRequest.get('/config', {
  showLoading: false
});
```

### 分组加载提示

```typescript
// 同一分组的请求共享一个loading，最后一个请求完成时才会隐藏
wxRequest.get('/users', { groupKey: 'userInfo', showLoading: true });
wxRequest.get('/orders', { groupKey: 'userInfo', showLoading: true });
// 只会显示一个loading，两个请求都完成后才会隐藏
```

### 自定义加载提示

```typescript
// 使用自定义加载组件
const wxRequest = new WxRequest({
  enableLoading: true,
  loadingOptions: {
    customLoader: (show, options) => {
      if (show) {
        // 使用自定义组件显示加载
        this.setData({ loading: true, loadingText: options?.title || '加载中' });
      } else {
        // 隐藏自定义加载
        this.setData({ loading: false });
      }
    }
  }
});
```

## 批量请求

批量请求功能支持将多个请求合并为一个HTTP请求发送，以减少网络开销和提高性能。

### 基本用法

```typescript
// 使用auto模式（自动批处理）
wxRequest.get('/users/1', { groupKey: 'userGroup' });
wxRequest.get('/users/2', { groupKey: 'userGroup' });
wxRequest.get('/users/3', { groupKey: 'userGroup' });

// 这些请求会被自动合并成一个批量请求

// 或者使用手动模式
wxRequest.batch([
  { url: '/users/1', method: 'GET' },
  { url: '/users/2', method: 'GET' },
  { url: '/categories', method: 'GET' }
])
.then(([user1Res, user2Res, categoriesRes]) => {
  console.log(user1Res.data, user2Res.data, categoriesRes.data);
});
```

### 高级配置

```typescript
// 全局配置
const wxRequest = new WxRequest({
  // 批量请求相关配置
  batchUrl: '/api/batch',         // 批量请求端点
  batchMode: 'json',              // 批量请求模式：'json'或'form'
  batchInterval: 50,              // 自动批处理的时间间隔(ms)
  batchMaxSize: 10,               // 单个批处理的最大请求数
  requestsFieldName: 'requests'   // 请求字段名称
});

// 单个请求的批处理配置
wxRequest.get('/users/1', {
  groupKey: 'userGroup',
  batchConfig: {
    batchUrl: '/api/v2/batch',    // 覆盖默认批处理URL
    responsePath: 'data.results', // 从响应数据的特定路径获取结果
    batchMode: 'form',            // 使用formData方式发送批量请求
    transformBatchRequest: (requests) => {
      // 自定义请求数据格式
      return { batch: requests, timestamp: Date.now() };
    },
    transformBatchResponse: (batchResponse, originalRequests) => {
      // 自定义响应数据处理
      const results = batchResponse.data.results;
      return originalRequests.map((req, index) => {
        return {
          data: results[index],
          status: 200,
          statusText: 'OK',
          headers: batchResponse.headers,
          config: req.config,
          request: batchResponse.request,
          timestamp: Date.now()
        };
      });
    }
  }
});
```

### 服务端接口规范

#### 默认格式（JSON模式）

请求格式：
```json
POST /batch
Content-Type: application/json
X-Batch-Request: true

{
  "requests": [
    {
      "url": "/users/1",
      "method": "GET",
      "headers": { "Authorization": "Bearer xxx" }
    },
    {
      "url": "/products/2",
      "method": "GET",
      "params": { "fields": "name,price" }
    },
    {
      "url": "/orders",
      "method": "POST",
      "data": { "productId": 123, "quantity": 1 }
    }
  ]
}
```

响应格式：
```json
200 OK
Content-Type: application/json

[
  {
    "data": { "id": 1, "name": "User 1" },
    "status": 200
  },
  {
    "data": { "id": 2, "name": "Product 2", "price": 99.99 },
    "status": 200
  },
  {
    "data": { "orderId": 456, "status": "created" },
    "status": 201
  }
]
```

#### 表单模式

请求格式：
```
POST /batch
Content-Type: multipart/form-data

0_url=/users/1
0_method=GET
1_url=/products/2
1_method=GET
1_params=fields=name,price
2_url=/orders
2_method=POST
2_data={"productId":123,"quantity":1}
```

#### 自定义响应格式

你可以使用`responsePath`或`transformBatchResponse`来处理非标准响应格式：

```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "results": [
      { "id": 1, "name": "User 1" },
      { "id": 2, "name": "Product 2", "price": 99.99 },
      { "orderId": 456, "status": "created" }
    ],
    "timestamp": 1620000000000
  }
}
```

使用`responsePath: "data.results"`即可正确获取结果数组。

## API文档

### 创建实例

```typescript
const wxRequest = new WxRequest(config);
```

#### 配置选项

| 参数 | 类型 | 描述 | 默认值 |
| --- | --- | --- | --- |
| baseURL | string | 请求的基础URL | - |
| timeout | number | 超时时间(ms) | 30000 |
| headers | object | 默认请求头 | {} |
| maxCacheSize | number | 最大缓存条目数 | 100 |
| maxCacheAge | number | 默认缓存过期时间(ms) | 5分钟 |
| retryTimes | number | 网络错误重试次数 | 3 |
| retryDelay | number | 重试间隔(ms) | 1000 |
| enableQueue | boolean | 是否启用请求队列 | true |
| maxConcurrent | number | 最大并发请求数 | 10 |
| enableOfflineQueue | boolean | 无网络时是否进入离线队列 | true |
| batchUrl | string | 批量请求URL | /batch |
| batchMode | 'json'\|'form' | 批量请求模式 | json |
| batchMaxSize | number | 单批次最大请求数 | 5 |
| batchInterval | number | 自动批处理间隔(ms) | 50 |
| requestsFieldName | string | 批量请求字段名 | requests |
| enableLoading | boolean | 是否全局启用加载提示 | false |
| loadingOptions | object | 全局加载提示配置 | {title:'加载中...',mask:false,delay:300} |

#### 加载提示配置

| 参数 | 类型 | 描述 | 默认值 |
| --- | --- | --- | --- |
| title | string | 加载提示文字 | 加载中... |
| mask | boolean | 是否显示透明蒙层 | false |
| delay | number | 延迟显示时间(ms) | 300 |
| customLoader | function | 自定义加载提示实现 | - |

### 请求方法

- `get(url, config)`
- `post(url, data, config)`
- `put(url, data, config)`
- `delete(url, config)`
- `head(url, config)`
- `options(url, config)`
- `request(config)`
- `batch(requests, config)`
- `preRequest(requests)`

### 拦截器

```typescript
// 请求拦截器
wxRequest.interceptors.request.use(
  config => {
    // 在发送请求前做些什么
    config.headers = { 
      ...config.headers, 
      'Authorization': `Bearer ${getToken()}` 
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
    if (response.data.code !== 0) {
      return Promise.reject(response.data);
    }
    return response;
  },
  error => {
    // 对响应错误做些什么
    if (error.status === 401) {
      // 处理未授权错误
    }
    return Promise.reject(error);
  }
);
```

## 常见问题

### 类型兼容性问题

由于微信小程序版本和TypeScript版本不同，可能会遇到类型兼容性问题。如果遇到类型错误，可以尝试：

1. 使用我们提供的构建脚本 `./build.sh`
2. 或手动运行 `npm run build`，它使用了 `--skipLibCheck` 选项跳过类型检查

## 版本兼容性

- 支持的微信基础库版本: 2.2.1+
- TypeScript版本: 4.0+

## 许可证

MIT 