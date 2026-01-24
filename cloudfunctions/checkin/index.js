// 云函数：checkin - 打卡接口
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  try {
    const { mood } = event;
    
    // 验证心情参数
    const validMoods = ['happy', 'content', 'sad', 'tired', 'angry', 'worried'];
    if (!mood || !validMoods.includes(mood)) {
      return {
        code: -1,
        message: '无效的心情参数'
      };
    }
    
    // 获取当前日期（服务器时间）
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const checkinDate = `${year}-${month}-${day}`;
    
    // 检查今日是否已打卡
    const existingCheckin = await db.collection('checkins')
      .where({
        _openid: openid,
        checkinDate: checkinDate
      })
      .get();
    
    if (existingCheckin.data.length > 0) {
      return {
        code: -2,
        message: '今日已打卡'
      };
    }
    
    // 插入打卡记录
    const result = await db.collection('checkins').add({
      data: {
        mood: mood,
        checkinTime: db.serverDate(),
        checkinDate: checkinDate,
        isModified: false,
        createdAt: db.serverDate()
      }
    });
    
    return {
      code: 0,
      message: '打卡成功',
      data: {
        _id: result._id,
        checkinDate: checkinDate
      }
    };
    
  } catch (err) {
    console.error('打卡失败:', err);
    return {
      code: -999,
      message: '打卡失败: ' + err.message
    };
  }
};
