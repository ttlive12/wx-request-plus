// 全局声明微信小程序API，让TypeScript能够识别wx对象

// 声明wx全局对象
declare const wx: WechatMiniprogram.Wx;

// 导入微信小程序类型声明
/// <reference types="miniprogram-api-typings" />

// 扩展RequestTask接口，添加我们使用的但在类型声明中可能不存在的方法
declare namespace WechatMiniprogram {
  interface RequestTask {
    abort?(): void;
    onProgressUpdate?(callback: (res: any) => void): void;
  }
  
  interface RequestOption {
    sslVerify?: boolean;
  }
} 