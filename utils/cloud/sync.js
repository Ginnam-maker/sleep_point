// 云同步工具 - 打卡数据
import { callCloudFunction, CLOUD_CONFIG } from './config.js';
import { saveCheckin as saveLocalCheckin, getAllCheckins } from '../storage.js';

/**
 * 云端打卡
 * @param {string} mood - 心情类型
 * @returns {Promise<Object>}
 */
export async function cloudCheckin(mood) {
  if (!CLOUD_CONFIG.enabled) {
    // 如果云开发未启用，使用本地存储
    const checkinRecord = {
      mood: mood,
      time: new Date().getTime(),
      date: getTodayDate()
    };
    saveLocalCheckin(checkinRecord.date, checkinRecord);
    return { code: 0, message: '本地打卡成功', data: checkinRecord };
  }
  
  try {
    const result = await callCloudFunction('checkin', { mood });
    
    if (result.code === 0) {
      // 云端打卡成功，同步到本地
      const checkinRecord = {
        mood: mood,
        time: new Date().getTime(),
        date: result.data.checkinDate
      };
      saveLocalCheckin(checkinRecord.date, checkinRecord);
    }
    
    return result;
  } catch (error) {
    console.error('云端打卡失败，使用本地存储:', error);
    
    // 云端失败，降级到本地
    const checkinRecord = {
      mood: mood,
      time: new Date().getTime(),
      date: getTodayDate()
    };
    saveLocalCheckin(checkinRecord.date, checkinRecord);
    
    return { code: 0, message: '本地打卡成功', data: checkinRecord };
  }
}

/**
 * 从云端同步数据到本地
 * @returns {Promise<void>}
 */
export async function syncFromCloud() {
  if (!CLOUD_CONFIG.enabled) {
    console.log('云开发未启用，跳过同步');
    return;
  }
  
  console.log('云端数据同步功能暂未实现');
}

/**
 * 上传本地数据到云端
 * @returns {Promise<void>}
 */
export async function uploadToCloud() {
  if (!CLOUD_CONFIG.enabled) {
    console.log('云开发未启用，跳过上传');
    return;
  }
  
  try {
    const checkins = getAllCheckins();
    
    // 逐条上传打卡记录
    for (const checkin of checkins) {
      try {
        await callCloudFunction('checkin', {
          mood: checkin.mood,
          date: checkin.date,
          time: checkin.time
        });
      } catch (error) {
        console.log('记录已存在或上传失败:', checkin.date);
      }
    }
    
    console.log('本地数据上传成功');
  } catch (error) {
    console.error('本地数据上传失败:', error);
  }
}

/**
 * 保存用户信息到云端
 * @param {Object} userInfo - 用户信息对象
 * @param {string} userInfo.nickName - 用户昵称
 * @param {string} userInfo.avatarUrl - 用户头像URL
 * @param {string} [userInfo.phoneNumber] - 用户手机号（可选）
 * @returns {Promise<Object>} 返回保存结果
 */
export async function saveUserInfoToCloud(userInfo) {
  if (!CLOUD_CONFIG.enabled) {
    return { code: -1, message: '云开发未启用' };
  }
  
  try {
    const result = await callCloudFunction('saveUserInfo', {
      nickName: userInfo.nickName,
      avatarUrl: userInfo.avatarUrl,
      phoneNumber: userInfo.phoneNumber || ''
    });
    
    if (result.code === 0) {
      console.log('用户信息已保存到云端:', result);
    }
    
    return result;
  } catch (error) {
    console.error('保存用户信息到云端失败:', error);
    return { code: -999, message: error.message || '未知错误' };
  }
}

/**
 * 获取今天日期字符串
 */
function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default {
  cloudCheckin,
  syncFromCloud,
  uploadToCloud,
  saveUserInfoToCloud
};
