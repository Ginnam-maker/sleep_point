// 云函数：sendMessage - 发送订阅消息
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const { openid, templateId, data, page } = event;
  
  try {
    // 验证参数
    if (!openid || !templateId || !data) {
      return {
        errCode: -1,
        errMsg: '缺少必要参数'
      };
    }
    
    // 发送订阅消息
    const result = await cloud.openapi.subscribeMessage.send({
      touser: openid,
      page: page || 'pages/index/index', // 点击消息跳转的页面
      data: data,
      templateId: templateId,
      miniprogramState: 'formal' // 正式版：formal，开发版：developer，体验版：trial
    });
    
    return {
      errCode: 0,
      errMsg: '发送成功',
      data: result
    };
    
  } catch (err) {
    console.error('发送订阅消息失败:', err);
    return {
      errCode: -999,
      errMsg: '发送失败: ' + err.message
    };
  }
};
