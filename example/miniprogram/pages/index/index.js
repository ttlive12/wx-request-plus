// index.js
const app = getApp();

Page({
  data: {
    userInfo: {},
    productList: [],
    loading: false,
    refreshing: false,
    hasMore: true,
    page: 1,
    pageSize: 10
  },

  onLoad() {
    // 初始化
    this.loadUserInfo();
    this.loadProducts(1);
    
    // 预加载其他数据
    this.preloadData();
  },

  // 获取用户信息
  loadUserInfo() {
    const request = app.globalData.request;
    
    request.get('/user/profile', { cache: true })
      .then(res => {
        this.setData({
          userInfo: res.data
        });
      })
      .catch(err => {
        console.error('获取用户信息失败', err);
      });
  },

  // 加载产品列表
  loadProducts(page = 1, refresh = false) {
    if (this.data.loading) return;
    
    const request = app.globalData.request;
    const { pageSize } = this.data;
    
    this.setData({ 
      loading: true,
      refreshing: refresh
    });
    
    request.get('/products', {
      params: {
        page,
        pageSize
      },
      // 缓存首页数据
      cache: page === 1,
      // 使用低优先级
      priority: 3
    })
      .then(res => {
        const { list, total } = res.data;
        const hasMore = page * pageSize < total;
        
        this.setData({
          productList: refresh ? list : [...this.data.productList, ...list],
          page,
          hasMore,
          loading: false,
          refreshing: false
        });
      })
      .catch(err => {
        console.error('获取产品列表失败', err);
        this.setData({
          loading: false,
          refreshing: false
        });
        
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      });
  },
  
  // 下拉刷新
  onPullDownRefresh() {
    this.loadProducts(1, true);
  },
  
  // 上拉加载更多
  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return;
    
    this.loadProducts(this.data.page + 1);
  },
  
  // 批量加载数据
  batchLoadData() {
    const request = app.globalData.request;
    
    wx.showLoading({
      title: '加载中'
    });
    
    request.batch([
      { url: '/categories', method: 'GET' },
      { url: '/banners', method: 'GET' },
      { url: '/hot-products', method: 'GET' }
    ])
      .then(([categoriesRes, bannersRes, hotProductsRes]) => {
        this.setData({
          categories: categoriesRes.data,
          banners: bannersRes.data,
          hotProducts: hotProductsRes.data
        });
      })
      .catch(err => {
        console.error('批量加载数据失败', err);
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },
  
  // 预加载数据
  preloadData() {
    const request = app.globalData.request;
    
    // 预加载详情页需要的数据
    request.preRequest({
      url: '/product-details/popular',
      preloadKey: 'popularProductDetails'
    });
  },
  
  // 查看产品详情
  viewProductDetail(e) {
    const { id } = e.currentTarget.dataset;
    
    wx.navigateTo({
      url: `/pages/product/detail?id=${id}`
    });
  },
  
  // 提交表单
  submitForm(e) {
    const formData = e.detail.value;
    const request = app.globalData.request;
    
    wx.showLoading({
      title: '提交中'
    });
    
    request.post('/feedback', formData)
      .then(res => {
        wx.showToast({
          title: '提交成功',
          icon: 'success'
        });
      })
      .catch(err => {
        wx.showToast({
          title: err.message || '提交失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  }
}); 