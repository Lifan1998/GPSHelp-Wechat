// pages/register/register.js
const app = getApp()
let WebIM = require("../../utils/WebIM")["default"];
Page({

  /**
   * 页面的初始数据
   */
  data: {
    genders: ["男", "女"],
    genderIndex: 0,
    showTopTips: false,
    topTips: '错误提示'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  },

  bindGenderChange: function(e) {
    this.setData({
      genderIndex: e.detail.value
    })
  },

  showTopTips: function() {
    var that = this;
    this.setData({
      showTopTips: true
    });
    setTimeout(function() {
      that.setData({
        showTopTips: false
      });
    }, 3000);
  },

  /**
   * 救援人员注册
   */
  formSubmit: function(e) {
    console.log('发生了submit事件，携带数据为：', e.detail.value)
    if (!(e.detail.value.unitCode && e.detail.value.unitKey && e.detail.value.name && e.detail.value.code && e.detail.value.phoneNumber)) {
      this.setData({
        topTips: "请填写全部信息！"
      })
      this.showTopTips();
      return false
    }
    var _this = this;
    wx.request({
      url: app.globalData.rootUri + '/api/rescuer',
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      data: {
        unitId: e.detail.value.unitCode,
        unitKey: e.detail.value.unitKey,
        name: e.detail.value.name,
        id: e.detail.value.code,
        gender: this.data.genders[e.detail.value.gender],
        phone: e.detail.value.phoneNumber,
        openId: app.globalData.openId
      },
      success: function(res) {
        console.log(res)
        if (res.statusCode == 200) {
          if (res.data.status == 1) {
            wx.showModal({
              title: '提示',
              content: '注册成功！',
              success: function (res) {
                app.globalData.identity = '救援人员（在线）'
                app.globalData.rescuerId = e.detail.value.code
                wx.navigateTo({
                  url: "/pages/index/index"
                })
              },
            })
          } else {
            _this.setData({
              topTips: res.data.info
            })
            _this.showTopTips();
          }
        }
      },
      fail: function() {
        console.log("api/rescuer 出错！");
        app.errorModal('救援人员注册请求出错！请联系管理员！');
      },
      complete: function() {
        // complete
      }
    })
  },
})