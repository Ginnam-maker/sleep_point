// 云函数：saveUserInfo - 保存/更新用户信息
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  try {
    const { nickName, avatarUrl, phoneNumber } = event;
    
    // 验证必填参数
    if (!nickName || !avatarUrl) {
      return {
        code: -1,
        message: '昵称和头像不能为空'
      };
    }
    
    // 查询用户是否已存在
    const existingUser = await db.collection('users')
      .where({
        _openid: openid
      })
      .get();
    
    const userData = {
      nickName,
      avatarUrl,
      phoneNumber: phoneNumber || '',
      lastLoginTime: db.serverDate(),
      updatedAt: db.serverDate()
    };
    
    if (existingUser.data.length > 0) {
      // 用户已存在，更新信息
      await db.collection('users')
        .where({
          _openid: openid
        })
        .update({
          data: userData
        });
      
      return {
        code: 0,
        message: '用户信息更新成功',
        data: {
          openid,
          isNewUser: false
        }
      };
    } else {
      // 新用户，创建记录
      userData.createdAt = db.serverDate();
      userData.totalCheckins = 0;
      userData.totalAchievements = 0;
      
      const result = await db.collection('users').add({
        data: userData
      });
      
      return {
        code: 0,
        message: '用户信息保存成功',
        data: {
          openid,
          _id: result._id,
          isNewUser: true
        }
      };
    }
    
  } catch (err) {
    console.error('保存用户信息失败:', err);
    return {
      code: -999,
      message: '保存用户信息失败: ' + err.message
    };
  }
};
