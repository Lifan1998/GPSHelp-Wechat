//app.js
App({
  onLaunch: function () {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    let that = this;

    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId      
        var code = res.code;
        console.log(res.code)
        let appid = "wxa466fa6fe3836361";
        let secret = "6b2cd5552ac166ea396a6e14ad4fda60"
        let js_code = code
        let url = "http://localhost:8088/jersey/users/getInitMsg" + "?code=" + js_code
       
       
        wx.request({
          url: url,
          success: function (res) {
            if (res.statusCode == 200) {
              console.log(res)
              console.log("openid:" + res.data.openid)
              console.log("session_key:" + res.data.session_key)
              that.globalData.openid = res.data.openid;
              let isWorker = res.data.isWorker;
              let isTask = res.data.isTask;
              let type = "110"
              that.globalData.isWorker = isWorker
              if (isWorker){
                if (isTask){
                  //工作人员已有任务
                  //直接进入导航界面
                  wx.redirectTo({
                    url: '/pages/navigate/navigate?msg=' + type
                  })
                }
              } else {
                
                if (isTask){
                  //普通用户已有任务
                  //定位界面
                  wx.redirectTo({
                    url: '/pages/navigate/navigate?msg=' + type
                  })
                }
              }
              //普通用户无任务
              //工作人员无任务
              
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
        

      }
    })

  },
  globalData: {
    userInfo: null,
    openid: null,
    session_key:null,
    isWorker: null
  }
  


})