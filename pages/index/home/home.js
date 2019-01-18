// pages/index/home/home.js
const app = getApp();
var QQMapWX = require('/lib/qqmap-wx-jssdk.js');
var qqmapsdk;
/**
 * 此marker存储所有标记
 * 一般第一个为自身坐标，为待救援点
 * 后续为所有相关施救点
 * 最后为系统推荐施救方/用户手动选择
 * 
 */
var markers = [];
/**
 * 是否已经呼出
 * 控制请求和定时器
 */
var help = false;
/**
 * 分
 */
var sec = 0;
/**
 * 秒
 */
var min = 0;
/**
 * 定时器id
 * 关闭时要用
 */
var timer ;
Page({
  
  /**
   * 页面的初始数据
   */
  data: {
    msgEventLocation:'test',
    msgAidLocation: 'test',
    msg:'110',
    label:'一键求救',
    latitude: 31.95266,
    longitude: 118.84002,
    markers: markers,
    polyline: [],
    buttons: [{ id: 0, name: '110' }, { id: 1, name: '120' }, { id: 2, name: '119' }],
  },
  regionchange(e) {
    console.log(e.type)
  },
  markertap(e) {
    console.log(e.markerId)
    //标记出系统推荐
    for (let i = 0; i < markers.length-1; i++) {
      if (e.markerId == markers[i].id) {
        let marker = {
          iconPath: "/image/marker-1.png",
          id: markers[i].id.id,
          latitude: markers[i].latitude,
          longitude: markers[i].longitude,
          height: 40,
          width: 40,
          label: {
            content: markers[i].callout.content
          }
        }
        markers[markers.length - 1] = marker
      }
    }
   
    this.setData({
      markers: markers,
      msgAidLocation: markers[markers.length - 1].label.content
    })

  },
  controltap(e) {
    console.log(e.controlId)
  },
   
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log("生命周期函数--监听页面加载")
    this.data.buttons[0].checked = true;
    this.setData({
      buttons: this.data.buttons,
    })
   
    // 实例化腾讯地图API核心类
    qqmapsdk = new QQMapWX({
      key: 'PTVBZ-O3734-C6SUY-XFJS3-DJ3GV-Y3FTY' // 必填
    });
    if (markers.length == 0) {
      this.getMyMarker()
    }
    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    console.log("生命周期函数--监听页面初次渲染完成")
    this.mapCtx = wx.createMapContext('map')
   
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log("生命周期函数--监听页面显示")
    
     
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log("生命周期函数--监听页面隐藏")
    this.saveData()
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log("生命周期函数--监听页面卸载")
    this.saveData()
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
  /**
   * 获取用户坐标坐标
   * 并标记为待救援点
   */
  getMyMarker(){
    let _this = this
    wx.getLocation({
      type: 'gcj02',
      success(res) {
        console.log(res)
        _this.setData({
          longitude: res.longitude,
          latitude: res.latitude
        }) 
        let marker = {
          iconPath: "/image/location.png",
          id: 0,
          latitude: res.latitude,
          longitude: res.longitude,
          label:{
            content:""
          },
          width: 40,
          height: 40
        };
        markers.push(marker)
        _this.getAddressName()
      }
    })
    this.initAllMarkers()
    
  },
  /**
   * 确认呼救
   */
  confirm(){
    console.log("confirm()" )
    if(help){
      this.setData({
        label: '一键求救',
        msg: '110',
      })
      help = false
      //清除定时器
      clearInterval(timer)
      return
    } 
    help = true
    //开启定时器
    timer = setInterval(this.timer, 1000);
    this.setData({ 
      label:'正在呼救'+this.data.msg,
      msg: '00:00' 
    })
  },
  /**
   * 使自身定位显示在屏幕中心
   */
  moveToLocation() {
    console.log("moveToLocation()")
    this.mapCtx.moveToLocation()
  },
  /**
   * 获取所有可选救援点
   */
  initAllMarkers(){
    markers= markers.slice(0,1)
    let that = this
    let key ;
    if(this.data.msg == 110){
      key = "派出所"
    }
    if (this.data.msg == 120) {
      key = "医院"
    }
    if (this.data.msg == 119) {
      key = "消防大队"
    }
    // 调用接口
    qqmapsdk.search({
      keyword: key,
      success: function (res) {
        
        let array = res.data
        console.log(res);
        //标记
        for(let i=0;i<array.length;i++){
         
          let marker = {
            iconPath: "/image/marker-1.png",
            id: array[i].id,
            latitude: array[i].location.lat,
            longitude: array[i].location.lng,
            height: 20,
            width: 20,
            callout :{
              content: array[i].title,
              display: 'BYCLICK'
            }
          };
          markers.push(marker)
          
        }
        that.getRecommendMarkers(res.data)
      },
      fail: function (res) {
        console.log(res);
      },
      complete: function (res) {
        console.log(res);
      }
    });
    
  },
  /**
   * 获取最优救援点
   * 这里暂定为搜索结果第一个
   */
  getRecommendMarkers(array){
    console.log(array[0])
    let marker = {
      iconPath: "/image/marker-1.png",
      id: array[0].id,
      latitude: array[0].location.lat,
      longitude: array[0].location.lng,
      height: 40,
      width:40,
      label:{
        content: array[0].title
      }
    };
   
    //标记出系统推荐
    for(let i=0;i<markers.length;i++){
      if(marker.id==markers[i].id){
        markers[i].iconPath = "/image/location-1.png"
      }
    }
    markers.push(marker)
    this.setData({
      markers: markers,
      msgAidLocation: array[0].title
    })
  },
  /**
   * 手动选择地理位置
   */
  chooseEventLocation(){
    console.log(this.data.msgEventLocation)
    let _this = this
    wx.chooseLocation({
      success:function(res){
        console.log(res)
        markers[0].latitude = res.latitude,
        markers[0].longitude = res.longitude,
        markers[0].label.content = name
        _this.setData({
          msgEventLocation:res.name,
          markers:markers
        })
      }
    })

  },
  /**
   * 单选按钮实现
   */
  radioButtonTap: function (e) {
    console.log(e)
    let id = e.currentTarget.dataset.id
    let name 
    console.log(id)
    for (let i = 0; i < this.data.buttons.length; i++) {
      if (this.data.buttons[i].id == id) {

        //当前点击的位置为true即选中
        this.data.buttons[i].checked = true;
        name = this.data.buttons[i].name
      }
      else {
        //其他的位置为false
        this.data.buttons[i].checked = false;
      }
    }
    this.setData({
      buttons: this.data.buttons,
      msg: name
    })
    this.initAllMarkers()
  },
  /**
   * 定时器回调方法
   */
  timer(){
    sec = sec +1
    if(sec==60) {
      min = min+1
      sec = 0
    }
    let s = sec,s1 = min
    if(sec<10) s = "0"+sec
    if(min<10) s1 = "0"+min
    this.setData({
      msg: s1+":"+s
    })
    //手动测试请求成功
    if(sec==2){
      //网络请求
      //请求成功清除定时器
      clearInterval(timer)
      //打开导航页面，在该任务完成之前，主界面封锁
      wx.redirectTo({
        url: '/pages/navigate/navigate'
      })
    }
  },
  /**
   * 请求呼救
   */
  startHelp(){
    //网络请求

    //请求成功清除定时器
    clearInterval(timer)
    //打开导航页面，在该任务完成之前，主界面封锁
    wx.redirectTo({
      url: '../pages/navigate/navigate'
    })

  },
  /**
   * 页面隐藏时调用
   * 页面卸载时调用（请求成功，打开新页面）
   */
  saveData(){
   
    wx.setStorageSync("markers", markers)
   
  },
  getAddressName(){
    var that = this
    //获取当前位置坐标
    wx.getLocation({
      //wgs84
      type: 'gcj02',
      success: function (res) {
        //根据坐标获取当前位置名称，显示在顶部:腾讯地图逆地址解析
        qqmapsdk.reverseGeocoder({
          location: {
            latitude: res.latitude,
            longitude: res.longitude
          },
          success: function (addressRes) {
            console.log(addressRes)
            var address = addressRes.result.address
            console.log(address)
            markers[0].label.content = address
            that.setData({
              msgEventLocation: address
            })
          }
        })
      }
    })
  }
  
})