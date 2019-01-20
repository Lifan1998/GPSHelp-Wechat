// pages/navigate/navigate.js
/**
 * 定义用户类型
 * 0为求救方
 * 1为施救方
 */
const userType = 0;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    name: '李警官',
    tel: '15055735530',
    msgEventLocation: 'test',
    msgAidLocation: 'test',
    msg: '110',
    hintMsg: '警察正在赶来的路上！！',
    latitude: 39.989221,
    longitude: 116.306076,
    markers: [],
    polyline: [],
    distance:0,
    duration:0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options.msg)
    //从主页面获取
    if (options.msg == 110) {
      this.setData({
        msg: options.msg,
        hintMsg: '警察正在赶来的路上！！'
      })
    }
    if (options.msg == 120) {
      this.setData({
        msg: options.msg,
        hintMsg: '120正在赶来的路上！！'
      })
    }
    if (options.msg == 119) {
      this.setData({
        msg: options.msg,
        hintMsg: '消防员正在赶来的路上！！'
      })
    }
    
    this.initData()
    this.driving()
      
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
   
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
   
    
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
  //事件回调函数
  driving: function () {
    var _this = this;
    let urlHead = 'https://apis.map.qq.com/ws/direction/v1/driving/'
    let from = this.data.markers[0].latitude + "," + this.data.markers[0].longitude
    let to = this.data.markers[1].latitude + "," + this.data.markers[1].longitude
    let key = 'PTVBZ-O3734-C6SUY-XFJS3-DJ3GV-Y3FTY'
    //网络请求设置
    var opt = {
      //WebService请求地址，from为起点坐标，to为终点坐标，开发key为必填
      url: urlHead+'?from='+from+'&to='+to+'&key='+key,
      
      method: 'GET',
      dataType: 'json',
      //请求成功回调
      success: function (res) {
        var ret = res.data
        console.log(ret)
        if (ret.status != 0) return; //服务异常处理
        var coors = ret.result.routes[0].polyline, pl = [];
        //坐标解压（返回的点串坐标，通过前向差分进行压缩）
        var kr = 1000000;
        for (var i = 2; i < coors.length; i++) {
          coors[i] = Number(coors[i - 2]) + Number(coors[i]) / kr;
        }
        //将解压后的坐标放入点串数组pl中
        for (var i = 0; i < coors.length; i += 2) {
          pl.push({ latitude: coors[i], longitude: coors[i + 1] })
        }
        //设置polyline属性，将路线显示出来
        _this.setData({
          duration: ret.result.routes[0].duration,
          distance: ret.result.routes[0].distance,
          polyline: [{
            points: pl,
            color: '#00BFFF',
            width: 6
          }]
        })
      }
    };
    wx.request(opt);
  },
  /**
   * 页面数据初始化
   * 优先从本地获取
   * 可以从网络获取
   * 用户{报警类型，报警地点，报警坐标，救援方名称，救援方坐标}
   */
  initData(){
    //获取起点与终点坐标
    //获取双方名称
    let markers = [];
    markers = wx.getStorageSync("markers")
    console.log(markers)
    //console.log(markers[1].label.content)
    this.setData({
      markers:[markers[0],markers[markers.length-1]],
      latitude:markers[0].latitude,
      longitude: markers[0].longitude,
      msgEventLocation: markers[0].label.content,
      msgAidLocation: markers[markers.length-1].label.content,
    })
    //获取报警类型

  },
  /**
   * 定时器回调函数
   * 用户：获取对方定位，更新map
   */
  updateLocation(){
     //应从服务器获取，返回值为坐标
     //将获取坐标与坐标组比对
  }
  


})