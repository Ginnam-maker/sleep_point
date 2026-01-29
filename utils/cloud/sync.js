// 云同步工具 - 打卡数据
import { callCloudFunction, CLOUD_CONFIG } from './config.js';
import { getAllCheckins } from '../storage.js';

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
    
    console.log('本地数据上传功能已移除（云函数 checkin 已删除）');
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

export default {
  syncFromCloud,
  uploadToCloud,
  saveUserInfoToCloud
};
