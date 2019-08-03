// pages/navigate/navigate.js
let WebIM = require("../../utils/WebIM")["default"];
let util = require("../../utils/util.js");
const app = getApp();
var locationTimer; //救援人员坐标定时器
var taskTimer; //任务定时器
var groupId; //任务通信群组Id
Page({

  /**
   * 页面的初始数据
   */
  data: {
    mapHeight: 0,
    name: '待分配',
    tel: '--------------',
    msgEventLocation: '正在定位当前地点',
    msgAidLocation: '正在选择施救单位',
    hintMsg: '等待分配救援...',
    latitude: 0,
    longitude: 0,
    markers: [],
    polyline: [],
    distance: 0,
    duration: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    //以下代码用于计算页面中各组件的高度以适应不同的手机屏幕
    let query = wx.createSelectorQuery().in(this);
    query.select('.bottom').boundingClientRect();
    query.exec(res => {
      let bottomHeight = res[0].height;
      let windowHeight = wx.getSystemInfoSync().windowHeight;
      let windowWidth = wx.getSystemInfoSync().windowWidth;
      let availableHeight = ((windowHeight - bottomHeight) * (750 / windowWidth))
      this.setData({
        mapHeight: availableHeight
      });
      console.log(windowHeight)
    });
    this.mapCtx = wx.createMapContext('map1');
    this.flushTaskData();
    taskTimer = setInterval(this.flushTaskData, 5000);
    if(app.globalData.identity == "救援人员（在线）"){
      locationTimer = setInterval(this.setRescuerLocation, 3000);
    }
    this.imLogin();
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

  /**
   * 刷新救援任务任务各种信息
   * 由taskTimer定时器控制，5秒请求一次
   */
  flushTaskData: function() {
    let _this = this
    let url = app.globalData.rootUri + "/api/task/" + app.globalData.taskId
    wx.request({
      url: url,
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: function(res) {
        if (res.statusCode == 200) {
          console.log(res)
          var markers = [];
          var hintMsg = _this.data.hintMsg;
          var name = _this.data.name;
          var tel = _this.data.tel;
          groupId = res.data.chatGroupId;
          markers.push({
            id: 'event',
            latitude: res.data.eventLocationCoordinate.split(',')[0],
            longitude: res.data.eventLocationCoordinate.split(',')[1],
            iconPath: '/image/markerTap.png'
          })
          markers.push({
            id: 'aid',
            latitude: res.data.aidLocationCoordinate.split(',')[0],
            longitude: res.data.aidLocationCoordinate.split(',')[1],
            iconPath: '/image/marker.png'
          })
          name = res.data.rescuerName ? res.data.rescuerName : name;
          tel = res.data.rescuerPhone ? res.data.rescuerPhone : tel;
          if (res.data.rescuerName) {
            if (res.data.type == 110 && app.globalData.identity == '普通用户') {
              hintMsg = '警察正在赶来的路上！！'
            } else if (res.data.type == 120 && app.globalData.identity == '普通用户') {
              hintMsg = '急救人员正在赶来的路上！！'
            } else if (res.data.type == 119 && app.globalData.identity == '普通用户') {
              hintMsg = '消防员正在赶来的路上！！'
            } else {
              hintMsg = '正在赶往现场！！'
            }
          } 
          var coors = res.data.aidRoute,
            pl = [];
          if(coors){
            var kr = 1000000;
            for (var i = 2; i < coors.length; i++) {
              coors[i] = Number(coors[i - 2]) + Number(coors[i]) / kr;
            }
            for (var i = 0; i < coors.length; i += 2) {
              pl.push({
                latitude: coors[i],
                longitude: coors[i + 1]
              })
            }
          }
          _this.setData({
            markers: markers,
            msgEventLocation: res.data.eventLocationName,
            msgAidLocation: res.data.aidLocationName,
            name: name,
            tel: tel,
            hintMsg: hintMsg,
            polyline: [{
              points: pl,
              color: '#00BFFF',
              width: 6
            }]
          })
          if (_this.data.latitude == 0 || _this.data.longitude == 0) {
            _this.setData({
              latitude: markers[0].latitude,
              longitude: markers[0].longitude
            })
            _this.mapCtx.includePoints({
              padding: [100],
              points: markers
            })
          }
          if (res.data.status == '进行中') {
            _this.getRescuerLocation();
          } else if (res.data.status == '已完结') {
            clearInterval(taskTimer)
            clearInterval(locationTimer)
            wx.showModal({
              title: '提示',
              content: '任务 ' + app.globalData.taskId + ' 已完结！',
              success: function(res) {
                app.globalData.taskId = null
                wx.reLaunch({
                  url: "/pages/index/index"
                })
              },
            })
          }
        } else {
          console.log(res.statusCode);
        }
      },
      fail: function() {
        app.errorModal("任务信息获取错误！请联系管理员！");
      }
    })
  },

  /**
   * 获取并显示救援人员（队长）实时位置
   */
  getRescuerLocation: function() {
    let url = app.globalData.rootUri + "/api/rescuerLocation/" + app.globalData.taskId
    var _this = this;
    wx.request({
      url: url,
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: function(res) {
        if (res.statusCode == 200 && res.data.rescuerLocationCoordinate) {
          let markers = _this.data.markers
          markers.push({
            id: 'rescuer',
            latitude: res.data.rescuerLocationCoordinate.split(',')[0],
            longitude: res.data.rescuerLocationCoordinate.split(',')[1],
            iconPath: '/image/rescuer.png'
          })
          _this.setData({
            markers: markers,
            distance: res.data.rescuerLocationCoordinate.split(',')[2],
            duration: res.data.rescuerLocationCoordinate.split(',')[3]
          });
        }
      }
    })
  },

  /**
   * 上报救援人员实时位置
   * 由locationTimer控制，默认3秒一次
   */
  setRescuerLocation() {
    var _this = this;
    wx.getLocation({
      type: 'gcj02',
      success(res) {
        console.log("救援人员位置上报！ " + res);
        wx.request({
          url: app.globalData.rootUri + "/api/rescuerLocation/" + app.globalData.taskId,
          method: 'PUT',
          header: {
            'content-type': 'application/x-www-form-urlencoded' // 默认值
          },
          data: {
            rescuerLocation: res.latitude + ',' + res.longitude,
            openId: app.globalData.openId
          },
          fail: function() {
            console.log("救援人员位置上报失败！");
          }
        })
      }
    })
  },

  /**
   * 点击定位按钮使地图地图回到中心
   */
  locationTap: function () {
    var that = this
    wx.getLocation({
      type: 'gcj02',
      success: function (res) {
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude
        });
      },
    })
  },

  /**
   * 拨打救援人员电话
   */
  makeCall: function(){
    var that = this
    if (that.data.tel.indexOf("-") == -1){
      wx.makePhoneCall({
        phoneNumber: that.data.tel
      })
    }
  },

  /**
   * 用户登录到通信系统
   */
  imLogin: function() {
    var account = util.baseEncode(app.globalData.openId).replace(new RegExp("=", "gm"), "");
    console.log('IM账号： ' + account);
    wx.setStorage({
      key: "myUsername",
      data: account
    });
    app.conn.open({
      apiUrl: WebIM.config.apiURL,
      user: account,
      pwd: account,
      grant_type: this.data.grant_type,
      appKey: WebIM.config.appkey
    });
  },

  /**
   * 点击聊天按钮进入聊天室
   */
  into_ChatRoom: function() {
    var my = wx.getStorageSync("myUsername");
    var nameList = {
      myName: my,
      your: app.globalData.taskId,
      groupId: groupId
    };
    wx.navigateTo({
      url: "../chat/chatroom?username=" + JSON.stringify(nameList)
    });
  }

})