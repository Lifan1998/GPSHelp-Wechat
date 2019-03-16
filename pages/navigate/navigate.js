// pages/navigate/navigate.js
/**
 * 定义用户类型
 * 0为求救方
 * 1为施救方
 */
const userType = 0;
const app = getApp();
/**
 * 定时器id
 * 关闭时要用
 */
var timer;
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
    otherOpenid: ""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options.msg)
    this.initData()
    this.updateLocation()
    //this.driving()
      
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
   * 用户{任务类型，事故地点，事故坐标，救援方名称，救援方坐标，救援方姓名，救援方电话，救援方人数}
   * 工作人员{任务类型，事故地点，事故坐标，救援方名称，救援方坐标}
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

    let that = this
    let url = "http://localhost:8088/jersey/users/getTask" + "?isWorker=" + app.globalData.isWorker +
      "&openid=" + app.globalData.openid

    wx.request({
      url: url,
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: function (res) {
        if (res.statusCode == 200) {
          console.log(res)
          
          that.setData({
            markers: [{
              height: 40,
              iconPath: "/image/location.png",
              id: "0",
              label: { content: res.data.event_location},
              latitude: res.data.event_latitude,
              longitude: res.data.event_longitude,
              width:40},{

              height: 40,
              iconPath: "/image/marker-1.png",
              id: "1",
              label: { content: res.data.organization },
                latitude: res.data.organization_latitude,
                longitude: res.data.organization_longitude,
              width: 40
              }],
            name: res.data.name,
            tel: res.data.tel,
            msgEventLocation:res.data.event_location,
            msgAidLocation: res.data.organization,
            latitude: res.data.event_latitude,
            longitude: res.data.event_longitude,
            otherOpenid: res.data.otherOpenid

          })
          if (!app.globalData.isWorker) {
            if (res.data.type == 110) {
              that.setData({
                msg: 110,
                hintMsg: '警察正在赶来的路上！！'
              })
            }
            if (res.data.type == 120) {
              that.setData({
                msg: 120,
                hintMsg: '120正在赶来的路上！！'
              })
            }
            if (res.data.type == 119) {
              that.setData({
                msg: 119,
                hintMsg: '消防员正在赶来的路上！！'
              })
            }
          }

          

        } else {
          console.log(res.statusCode);
        }

      },
      fail: function () {
        console.log("index.js wx.request CheckCallUser fail");
      },
      complete: function () {
        // complete
      }
    })

  },
  /**
   * 定时器回调函数
   */
  updateLocation(){
     if(app.globalData.isWorker){
       //返回用户坐标，导航信息{路线，时间，距离}
       timer = setInterval(this.workerUpdateLocation, 2000);
     } else{
       // 返回救援方坐标，时间，距离
       //this.userUpdateLocation();
       timer = setInterval(this.userUpdateLocation, 2000);
     }
  },
  /**
   * 用户更新定位
   * 获取救援方定位
   * 获取时间与距离
   */
  userUpdateLocation(){
    let _this = this
    wx.getLocation({
      type: 'gcj02',
      success(res) {
        console.log(res)

        wx.request({
          url: 'http://localhost:8088/jersey/users/userUpdateLocation',
          method: 'POST',
          header: {
            'content-type': 'application/x-www-form-urlencoded' 
          },
          data: {
            openid: 'oAxVW4yKShgrBl_SZXyZTWRgvNYk',
            latitude: res.latitude,
            longitude: res.longitude,
            otherOpenid:_this.data.otherOpenid
          },
          success: function (result) {
            if (result.statusCode == 200) {
              console.log(result)
              let marker = {
                iconPath: "/image/car.jpg",
                id: "3",
                latitude: result.data.latitude,
                longitude: result.data.longitude,
                height: 20,
                width: 40
              };
              _this.setData({
                markers: [_this.data.markers[0], _this.data.markers[1],marker],
                duration: result.data.time,
                distance: result.data.distance
              })
            } else {
              console.log(result.statusCode);
            }
          },
          fail: function () {
            console.log("网络请求失败");
          },
          complete: function () {
            // complete
          }
        })

      }
    })


    // 网络请求
    
  },
  /**
   * 工作人员更新定位
   * 获取用户定位
   * 导航事故地点
   * 获取时间距离
   */
  workerupdateLocation() {
    var _this = this;

    wx.getLocation({
      type: 'gcj02',
      success(res) {
        console.log(res)
          wx.request({
            url: 'http://localhost:8088/jersey/users/workerUpdateLocation',
            method: 'POST',
            header: {
              'content-type': 'application/x-www-form-urlencoded' // 默认值
            },
            data: {
              openid:'oAxVW4yKShgrBl_SZXyZTWRgvNYk',
              latitude: res.latitude,
              longitude: res.longitude,
              toLatitude: "",
              toLongitude: "",
              otherOpenid: _this.data.otherOpenid,
            },
            success: function (result) {
              if (result.statusCode == 200) {
                console.log(result)

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
              } else {
                console.log(result.statusCode);
              }
            },
            fail: function () {
              console.log("网络请求失败");
            },
            complete: function () {
              // complete
            }
          })
      }
    })
  },
  


})