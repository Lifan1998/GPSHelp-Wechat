// pages/index/index.js
const app = getApp();
var QQMapWX = require('/lib/qqmap-wx-jssdk.js');
var qqmapsdk;
var markers = []; //坐标数组，0号元素为用户当前位置信息
var markerSelected = {}; //当前选定的救援单位信息
var help = false; //求救是否处于开启状态
var sec = 0; //计时-秒
var min = 0; //计时-分
var timer; //求救定时器
var rescuerTimer; //救援人员获取任务定时器
var aidType = '110'; //求救类型

Page({

  /**
   * 页面的初始数据
   */
  data: {
    msgEventLocation: '正在定位当前地点', //求救地点
    msgAidLocation: '正在选择施救单位', //施救地点
    msg: '110', //选择的求救类型
    label: '一键求救', //标签提示文字
    latitude: 31.95266, //地图中心纬度
    longitude: 118.84002, //地图中心经度
    markers: markers, //地图上显示的坐标
    polyline: [], //地图上显示的路径
    buttons: [{
      id: 0,
      name: '110',
      checked: true
    }, {
      id: 1,
      name: '120'
    }, {
      id: 2,
      name: '119'
    }], //三种求救按钮
    showAbout: false, //是否显示帮助页面
    userType: '未获取' //用户类型
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    console.log("生命周期函数--监听页面加载")

    // 实例化腾讯地图API核心类
    qqmapsdk = new QQMapWX({
      key: 'PTVBZ-O3734-C6SUY-XFJS3-DJ3GV-Y3FTY' // 必填
    });

    this.getMyMarker()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    console.log("生命周期函数--监听页面初次渲染完成")
    this.mapCtx = wx.createMapContext('map')

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    console.log("生命周期函数--监听页面显示")
    //以下代码用于等待app.js获取用户类型，如果用户为救援人员（在线）且没有正在进行的任务，则开启救援任务定时器
    if (!app.globalData.identity) {
      console.log("用户类型未获取，等待回调...")
      app.userInfoReadyCallback = () => {
        this.setData({
          userType: app.globalData.identity
        })
        console.log("用户类型回调完成！")
        if (app.globalData.identity == "救援人员（在线）" && app.globalData.taskId == null) {
          rescuerTimer = setInterval(this.getRescuerTask, 3000)
        } else {
          clearInterval(rescuerTimer)
        }
      }
    } else {
      if (app.globalData.identity == "救援人员（在线）" && app.globalData.taskId==null) {
        rescuerTimer = setInterval(this.getRescuerTask, 3000)
      } else {
        clearInterval(rescuerTimer)
      }
      this.setData({
        userType: app.globalData.identity
      })
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
    console.log("生命周期函数--监听页面隐藏")
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    console.log("生命周期函数--监听页面卸载")
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

  regionchange(e) {
    // console.log(e.type)
  },

  /***
   * 处理用户点击地图选择不同的求救单位
   */
  markertap(e) {
    console.log(e.markerId)
    if (e.markerId == 0) return false;
    for (let i = 1; i < markers.length; i++) {
      markers[i].iconPath = "/image/marker.png"
      delete markers[i].label
      if (e.markerId == markers[i].id) {
        markers[i].iconPath = "/image/markerTap.png"
        markerSelected = markers[i]
        markers[i].label = {}
        markers[i].label.content = markers[i].data.content
        markers[i].label.padding = 5
        markers[i].label.bgColor = "#e84c0a"
        markers[i].label.color = "#ffffff"
        markers[i].label.anchorX = 10
        markers[i].label.anchorY = -24
        markers[i].label.borderRadius = 6
      }
    }
    this.setData({
      markers: markers,
      msgAidLocation: markerSelected.data.content
    })
    console.log("=====救援对象变更=====")
    console.log(markerSelected)
  },

  controltap(e) {
  },

  /**
   * 获取用户坐标坐标
   * 并标记为待救援点
   */
  getMyMarker() {
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
          label: {
            content: ""
          },
          width: 20,
          height: 20
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
  confirm() {
    console.log("一键求救开始！")
    if (help) {
      this.setData({
        label: '一键求救',
        msg: aidType,
      })
      help = false
      //清除定时器
      clearInterval(timer)
      return
    }
    help = true
    // 开启定时器
    timer = setInterval(this.timer, 1000);
    this.setData({
      label: '正在呼救' + this.data.msg,
      msg: '00:00'
    });
    this.startHelp();
  },

  /**
   * 使自身定位显示在屏幕中心
   */
  moveToLocation() {
    this.mapCtx.moveToLocation()
  },

  /**
   * 获取所有可选救援点
   */
  initAllMarkers() {
    markers = markers.slice(0, 1)
    let that = this
    let key;
    if (this.data.msg == 110) {
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
      success: function(res) {
        let array = res.data
        console.log("=====initAllMarkers()=====");
        console.log(res);
        //标记
        for (let i = 0; i < array.length; i++) {
          let marker = {
            iconPath: "/image/marker.png",
            height: 20,
            width: 20,
            id: array[i].id,
            latitude: array[i].location.lat,
            longitude: array[i].location.lng,
            data: {
              content: array[i].title
            }
          };
          markers.push(marker)
        }
        that.getRecommendMarkers(res.data)
      },
      fail: function(res) {
        console.log(res);
      },
      complete: function(res) {
        console.log(res);
      }
    });

  },

  /**
   * 获取最优救援点
   * 这里暂定为搜索结果第一个
   */
  getRecommendMarkers(array) {
    console.log(array[0])
    //标记出系统推荐
    for (let i = 1; i < markers.length; i++) {
      if (array[0].id == markers[i].id) {
        markers[i].iconPath = "/image/markerTap.png"
        markerSelected = markers[i]
        markers[i].label = {}
        markers[i].label.content = markers[i].data.content
        markers[i].label.padding = 5
        markers[i].label.bgColor = "#e84c0a"
        markers[i].label.color = "#ffffff"
        markers[i].label.anchorX = 10
        markers[i].label.anchorY = -24
        markers[i].label.borderRadius = 6
      }
    }
    this.setData({
      markers: markers,
      msgAidLocation: markerSelected.data.content
    })
  },

  /**
   * 手动选择地理位置
   */
  chooseEventLocation() {
    console.log(this.data.msgEventLocation)
    let _this = this
    wx.chooseLocation({
      success: function(res) {
        console.log(res)
        markers[0].latitude = res.latitude,
        markers[0].longitude = res.longitude,
        markers[0].name = res.address
        _this.setData({
          msgEventLocation: markers[0].name
        })
      }
    })

  },

  /**
   * 单选按钮实现
   */
  radioButtonTap: function(e) {
    let id = e.currentTarget.dataset.id
    let name
    console.log(id)
    for (let i = 0; i < this.data.buttons.length; i++) {
      if (this.data.buttons[i].id == id) {
        //当前点击的位置为true即选中
        this.data.buttons[i].checked = true;
        name = this.data.buttons[i].name
      } else {
        //其他的位置为false
        this.data.buttons[i].checked = false;
      }
    }
    aidType = name
    this.setData({
      buttons: this.data.buttons,
      msg: name
    })
    this.initAllMarkers()
  },

  /**
   * 定时器回调方法
   */
  timer() {
    sec = sec + 1
    if (sec == 60) {
      min = min + 1
      sec = 0
    }
    let showSec = sec,
      showMin = min
    if (sec < 10) showSec = "0" + sec
    if (min < 10) showMin = "0" + min
    this.setData({
      msg: showMin + ":" + showSec
    })
    if (app.globalData.taskId) {
      clearInterval(timer)
      wx.setStorageSync("aidInfo", {
        eventLocationName: markers[0].name,
        eventLocationCoordinate: markers[0].latitude + "," + markers[0].longitude,
        aidLocationName: markerSelected.data.content,
        aidLocationCoordinate: markerSelected.latitude + "," + markerSelected.longitude,
        aidType: aidType
      })
      wx.redirectTo({
        url: '/pages/navigate/navigate'
      })
    }
    if (sec % 3 == 0) {
      this.startHelp();
    }
  },

  /**
   * 请求呼救
   */
  startHelp() {
    var _this = this;
    wx.request({
      url: app.globalData.rootUri + '/api/task',
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      data: {
        eventLocationName: markers[0].name,
        eventLocationCoordinate: markers[0].latitude + "," + markers[0].longitude,
        aidLocationName: markerSelected.data.content,
        aidLocationCoordinate: markerSelected.latitude + "," + markerSelected.longitude,
        aidType: aidType,
        openId: app.globalData.openId
      },
      success: function(res) {
        if (res.statusCode == 200) {
          console.log(res)
          if (res.data.taskId) {
            app.globalData.taskId = res.data.taskId;
          }
        } else {
          console.log(res.statusCode);
        }
      },
      fail: function() {
        console.log("api/task 出错！");
        app.errorModal('任务创建请求出错！请联系管理员！');
      }
    })
  },

  getAddressName() {
    var that = this
    //获取当前位置坐标
    wx.getLocation({
      //wgs84
      type: 'gcj02',
      success: function(res) {
        //根据坐标获取当前位置名称，显示在顶部:腾讯地图逆地址解析
        qqmapsdk.reverseGeocoder({
          location: {
            latitude: res.latitude,
            longitude: res.longitude
          },
          success: function(addressRes) {
            console.log(addressRes)
            var address = addressRes.result.address
            console.log(address)
            markers[0].name = address
            that.setData({
              msgEventLocation: address
            })
          }
        })
      }
    })
  },

  /**
   * 点击问号按钮时显示帮助页面
   */
  showAbout: function(e) {
    this.setData({
      showAbout: !this.data.showAbout
    })
  },

  /**
   * 打开救援人员注册页面
   */
  workerRegister: function(e) {
    console.log('普通用户发起救援人员注册')
    wx.navigateTo({
      url: "/pages/register/register"
    });
  },

  /**
   * 救援人员上线和下线
   */
  workerChange: function(e) {
    console.log('救援人员状态变更！')
    var _this = this;
    wx.request({
      url: app.globalData.rootUri + '/api/rescuer/status/' + app.globalData.rescuerId,
      method: 'PUT',
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      data: {
        status: e.target.dataset.status,
        openId: app.globalData.openId
      },
      success: function(res) {
        if (res.statusCode == 200) {
          if (res.data.status == '在线' || res.data.status == '离线') {
            app.globalData.identity = '救援人员（' + res.data.status + '）'
            _this.setData({
              userType: '救援人员（' + res.data.status + '）'
            })
            wx.showModal({
              title: '提示',
              content: '操作成功！',
              success: function(res) {},
            })
            if (app.globalData.identity == "救援人员（在线）") {
              rescuerTimer = setInterval(this.getRescuerTask, 3000)
            } else {
              clearInterval(rescuerTimer)
            }
          } else {
            app.errorModal('操作失败！请联系管理员！');
          }
        }
      },
      fail: function() {
        console.log("api/rescuer/status 出错！");
        app.errorModal('任务创建请求出错！请联系管理员！');
      }
    })
  },

  /**
   * 救援人员获取当前任务
   */
  getRescuerTask: function(e) {
    var _this = this;
    wx.request({
      url: app.globalData.rootUri + '/api/rescuer/task',
      method: 'GET',
      data: {
        openId: app.globalData.openId
      },
      success: function(res) {
        if (res.statusCode == 200) {
          console.log(res)
          if (res.data.taskId) {
            app.globalData.taskId = res.data.taskId;
            clearInterval(rescuerTimer)
            wx.redirectTo({
              url: '/pages/navigate/navigate'
            })
          }
        } else {
          console.log(res.statusCode);
        }
      },
      fail: function() {
        console.log("api/rescuer/task 出错！");
      }
    })
  },

  /**
   * 描述：显示遮罩层时拦截触摸事件
   */
  preventTouchMove: function(e) {

  }

})