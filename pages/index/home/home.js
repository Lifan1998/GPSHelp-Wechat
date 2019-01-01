// pages/index/home/home.js
const app = getApp()
Page({

  
  /**
   * 页面的初始数据
   */
  data: {
    latitude: 38.907231,
    longitude: -77.036464,
    markers: [],
    polyline: [{
      points: [{
        longitude: -77.036464,
        latitude: 38.907231
      }, {
          longitude: -77.036464,
          latitude: 38.900231
      }],
      color: '#FF0000DD',
      width: 2,
      dottedLine: true
    }],
  },
  regionchange(e) {
    console.log(e.type)
  },
  markertap(e) {
    console.log(e.markerId)
  },
  controltap(e) {
    console.log(e.controlId)
  },
   
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
   
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.mapCtx = wx.createMapContext('map')
    
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let that = this
    wx.getLocation({
      type: 'gcj02',
      success(res) {
        
        app.latitude = res.latitude
        app.longitude = res.longitude
        console.log(res)
        that.setData({
          longitude: res.longitude,
          latitude: res.latitude, 
          markers: that.getMarkers()
        })

      }
    })
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  getMarkers(){
    let markers = [];
    let marker = {
      iconPath: "/image/location.png",
      id: 0,
      latitude: app.latitude,
      longitude: app.longitude,
      width: 25,
      height: 48
    };
    markers.push(marker)
    return markers;
  },
  moveToLocation() {
    console.log("moveToLocation()")
    this.mapCtx.moveToLocation()
    translateMarker()
  },
  translateMarker() {
    this.mapCtx.translateMarker({
      markerId: 0,
      autoRotate: true,
      duration: 1000,
      destination: {
        latitude: app.latitude,
        longitude: app.longitude,
      },
      animationEnd() {
        console.log('animation end')
      }
    })
  },
})