const app = getApp();

Page({
  data: {
    id: '',
    product: null,
    loading: true,
    error: false
  },

  onLoad(options) {
    const { id } = options;
    this.setData({ id });
    
    // 加载产品详情
    this.loadProductDetail(id);
  },

  // 加载产品详情
  loadProductDetail(id) {
    const request = app.globalData.request;
    
    // 检查是否有预加载数据
    const preloadKey = 'popularProductDetails';
    
    this.setData({ loading: true, error: false });
    
    // 发起请求，尝试使用预加载数据
    request.get(`/product/${id}`, {
      preloadKey,
      cache: true,
      // 高优先级
      priority: 8
    })
      .then(res => {
        this.setData({
          product: res.data,
          loading: false
        });
        
        // 加载相关数据
        this.loadRelatedData(id);
      })
      .catch(err => {
        console.error('获取产品详情失败', err);
        this.setData({
          error: true,
          loading: false
        });
        
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      });
  },
  
  // 加载相关数据
  loadRelatedData(id) {
    const request = app.globalData.request;
    
    // 使用批处理同时请求多个相关数据
    request.batch([
      { url: `/product/${id}/comments`, method: 'GET' },
      { url: `/product/${id}/related`, method: 'GET' },
      { url: `/product/${id}/specs`, method: 'GET' }
    ])
      .then(([commentsRes, relatedRes, specsRes]) => {
        this.setData({
          comments: commentsRes.data,
          related: relatedRes.data,
          specs: specsRes.data
        });
      })
      .catch(err => {
        console.error('获取相关数据失败', err);
      });
  },
  
  // 收藏产品
  toggleFavorite() {
    const { id, product } = this.data;
    const request = app.globalData.request;
    const isFavorite = product.isFavorite;
    
    request.post(`/product/${id}/favorite`, {
      favorite: !isFavorite
    })
      .then(res => {
        // 更新当前页面数据
        this.setData({
          'product.isFavorite': !isFavorite
        });
        
        wx.showToast({
          title: !isFavorite ? '已收藏' : '已取消收藏',
          icon: 'success'
        });
      })
      .catch(err => {
        wx.showToast({
          title: '操作失败，请重试',
          icon: 'none'
        });
      });
  },
  
  // 加入购物车
  addToCart() {
    const { id } = this.data;
    const request = app.globalData.request;
    
    wx.showLoading({
      title: '处理中'
    });
    
    request.post('/cart/add', {
      productId: id,
      quantity: 1
    })
      .then(res => {
        wx.showToast({
          title: '已加入购物车',
          icon: 'success'
        });
      })
      .catch(err => {
        wx.showToast({
          title: err.message || '添加失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },
  
  // 重试加载
  retry() {
    const { id } = this.data;
    this.loadProductDetail(id);
  }
}); 