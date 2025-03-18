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
- ✅ 高度可定制化

## 安装

```bash
npm install wx-request-plus --save
```

## 构建

如果你从源代码构建，可以使用以下方法：

```bash
# 方法1: 使用构建脚本
./build.sh

# 方法2: 手动构建
npm install
npm run build
```

如果遇到TypeScript编译错误，可以尝试使用跳过类型检查的构建：

```bash
npm run build
```

进行严格类型检查：

```bash
npm run type-check
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

// 批量请求
wxRequest.batch([
  { url: '/users', method: 'GET' },
  { url: '/products', method: 'GET' }
])
.then(([usersRes, productsRes]) => {
  console.log('用户:', usersRes.data);
  console.log('产品:', productsRes.data);
});
```

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

### 在小程序中引入

确保你的小程序项目配置中启用了 npm 支持：

1. 在微信开发者工具中，点击【工具】->【构建npm】
2. 在 `app.js` 中引入：
   ```javascript
   import WxRequest from 'wx-request-plus';
   ```

## 进阶用法

请参考详细文档了解更多高级特性和用法。

## 版本兼容性

- 支持的微信基础库版本: 2.2.1+
- TypeScript版本: 4.0+

## 许可证

MIT 