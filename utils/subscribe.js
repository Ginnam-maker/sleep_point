// 订阅消息工具
import { CLOUD_CONFIG } from './cloud/config.js';

/**
 * 请求订阅消息权限
 * @param {string} templateId - 模板ID
 * @returns {Promise<boolean>}
 */
export async function requestSubscribeMessage(templateId) {
  if (!templateId) {
    console.error('缺少订阅消息模板ID');
    return false;
  }
  
  try {
    // #ifdef MP-WEIXIN
    const res = await uni.requestSubscribeMessage({
      tmplIds: [templateId]
    });
    
    // 检查用户是否同意
    if (res[templateId] === 'accept') {
      console.log('用户同意订阅消息');
      return true;
    } else {
      console.log('用户拒绝订阅消息');
      return false;
    }
    // #endif
    
    // #ifndef MP-WEIXIN
    console.warn('非微信小程序环境，订阅消息不可用');
    return false;
    // #endif
  } catch (error) {
    console.error('请求订阅消息失败:', error);
    return false;
  }
}

/**
 * 发送订阅消息（云函数）
 * @param {string} openid - 用户openid
 * @param {string} templateId - 模板ID
 * @param {Object} data - 消息内容
 * @returns {Promise<boolean>}
 */
export async function sendSubscribeMessage(openid, templateId, data) {
  if (!CLOUD_CONFIG.enabled) {
    console.log('云开发未启用，无法发送订阅消息');
    return false;
  }
  
  try {
    // 调用云函数发送消息
    const result = await wx.cloud.callFunction({
      name: 'sendMessage',
      data: {
        openid,
        templateId,
        data
      }
    });
    
    if (result.result.errCode === 0) {
      console.log('订阅消息发送成功');
      return true;
    } else {
      console.error('订阅消息发送失败:', result.result);
      return false;
    }
  } catch (error) {
    console.error('发送订阅消息异常:', error);
    return false;
  }
}

/**
 * 设置定时提醒
 * @param {string} time - 提醒时间 (HH:mm)
 */
export function setupReminder(time) {
  // 保存提醒设置
  const settings = uni.getStorageSync('app_settings') || {};
  settings.reminderTime = time;
  settings.reminderEnabled = true;
  uni.setStorageSync('app_settings', settings);
  
  console.log(`已设置提醒时间: ${time}`);
  
  // 注意：实际的定时提醒需要通过云函数配合云数据库触发器实现
  // 或使用小程序的后台定时任务（需要企业主体）
}

/**
 * 取消定时提醒
 */
export function cancelReminder() {
  const settings = uni.getStorageSync('app_settings') || {};
  settings.reminderEnabled = false;
  uni.setStorageSync('app_settings', settings);
  
  console.log('已取消提醒');
}

/**
 * 检查提醒权限状态
 * @returns {boolean}
 */
export function checkReminderPermission() {
  const settings = uni.getStorageSync('app_settings') || {};
  return settings.reminderEnabled || false;
}

export default {
  requestSubscribeMessage,
  sendSubscribeMessage,
  setupReminder,
  cancelReminder,
  checkReminderPermission
};
