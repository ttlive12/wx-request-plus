// @ts-nocheck

import WxRequest from "wx-request-plus";

const wxRequest = WxRequest.create({
  baseURL: "api.com",
  timeout: 6000,
  returnData: true,
});

const LOADING_DELAY = 200;
let requestCount = 0;
let loadingTimer: number | null = null;

wxRequest.interceptors.request.use(
  (config) => {
    // 对GET请求默认启用强缓存
    if (config.method?.toUpperCase() === "GET" && config.cache === undefined) {
      config.cache = "force-cache";
      config.cacheExpire = 120000;
    }
    // loading逻辑
    if (config.showLoading && ++requestCount === 1) {
      // 延迟200ms显示loading
      loadingTimer = setTimeout(() => {
        wx.showLoading({
          title: "加载中",
        });
        loadingTimer = null;
      }, LOADING_DELAY);
    }
    return config;
  },
  (error) => {
    if (error.config.showLoading && --requestCount === 0) {
      // 清除定时器
      if (loadingTimer) {
        clearTimeout(loadingTimer);
        loadingTimer = null;
      }
      wx.hideLoading();
    }
    return Promise.reject(error);
  }
);

wxRequest.interceptors.response.use(
  (response) => {
    // loading逻辑
    if (response.config.showLoading && --requestCount === 0) {
      // 清除定时器
      if (loadingTimer) {
        clearTimeout(loadingTimer);
        loadingTimer = null;
      } else {
        wx.hideLoading();
      }
    }
    // 埋点
    if (response.config?.varLabs) {
      wx.reportEvent("wxdata_perf_monitor", {
        ...response.config.varLabs,
        wxdata_perf_error_code: 0,
        wxdata_perf_error_msg: "success",
      });
    }
    return response;
  },
  (error) => {
    // loading
    if (error.config.showLoading && --requestCount === 0) {
      // 清除定时器
      if (loadingTimer) {
        clearTimeout(loadingTimer);
        loadingTimer = null;
      } else {
        wx.hideLoading();
      }
    }
    if (error.config?.varLabs) {
      // 埋点
      wx.reportEvent("wxdata_perf_monitor", {
        ...error.config.varLabs,
        wxdata_perf_error_code: 1,
        wxdata_perf_error_msg: error.message,
      });
    }
    // 跳转错误页
    wx.redirectTo({
      url: `/pages/fail/fail?message=${error.type}`,
    });
    return Promise.reject(error);
  }
);

export default wxRequest;
