// 云函数：unlockAchievement - 解锁成就
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  try {
    const { achievementId } = event;
    
    // 验证成就ID
    const validAchievements = [
      'first_checkin',
      'streak_3',
      'streak_7',
      'streak_30',
      'early_bird',
      'mood_collector',
      'full_attendance',
      'persistence_100',
      'night_explorer'
    ];
    
    if (!achievementId || !validAchievements.includes(achievementId)) {
      return {
        code: -1,
        message: '无效的成就ID'
      };
    }
    
    // 检查该成就是否已解锁
    const existingAchievement = await db.collection('achievements')
      .where({
        _openid: openid,
        achievementId: achievementId
      })
      .get();
    
    if (existingAchievement.data.length > 0) {
      return {
        code: -2,
        message: '该成就已解锁'
      };
    }
    
    // 插入成就记录
    const result = await db.collection('achievements').add({
      data: {
        achievementId: achievementId,
        unlockedAt: db.serverDate(),
        createdAt: db.serverDate()
      }
    });
    
    return {
      code: 0,
      message: '成就已解锁',
      data: {
        _id: result._id
      }
    };
    
  } catch (err) {
    console.error('解锁成就失败:', err);
    return {
      code: -999,
      message: '解锁成就失败: ' + err.message
    };
  }
};
