// 云函数：updateCheckin - 修改打卡记录
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  try {
    const { checkinId, mood } = event;
    
    // 验证参数
    if (!checkinId) {
      return {
        code: -1,
        message: '缺少打卡记录ID'
      };
    }
    
    const validMoods = ['happy', 'content', 'sad', 'tired', 'angry', 'worried'];
    if (!mood || !validMoods.includes(mood)) {
      return {
        code: -2,
        message: '无效的心情参数'
      };
    }
    
    // 验证记录所有权
    const checkin = await db.collection('checkins')
      .doc(checkinId)
      .get();
    
    if (!checkin.data || checkin.data._openid !== openid) {
      return {
        code: -3,
        message: '无权修改此记录'
      };
    }
    
    // 更新记录
    await db.collection('checkins')
      .doc(checkinId)
      .update({
        data: {
          mood: mood,
          isModified: true,
          modifiedAt: db.serverDate()
        }
      });
    
    return {
      code: 0,
      message: '修改成功'
    };
    
  } catch (err) {
    console.error('修改打卡失败:', err);
    return {
      code: -999,
      message: '修改打卡失败: ' + err.message
    };
  }
};
