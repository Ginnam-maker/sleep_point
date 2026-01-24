// 云开发配置示例文件
// 使用说明：
// 1. 复制此文件并重命名为 config.js
// 2. 填入你的云环境 ID
// 3. 根据需要调整其他配置

const CLOUD_CONFIG = {
  // 云开发环境ID（在腾讯云控制台获取）
  envId: 'your-cloud-env-id-here',
  
  // 是否启用云开发（开发阶段可以设为false使用本地存储）
  enabled: false, // 设为 true 启用云开发
  
  // 是否开启调试模式
  debug: true,
  
  // 订阅消息模板ID（需要在微信公众平台申请后填入）
  subscribeMessageTemplateId: ''
};

// 初始化云开发
function initCloud() {
  if (!CLOUD_CONFIG.enabled) {
    console.log('云开发未启用，使用本地存储模式');
    return false;
  }
  
  try {
    // #ifdef MP-WEIXIN
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return false;
    }
    
    wx.cloud.init({
      env: CLOUD_CONFIG.envId,
      traceUser: true
    });
    
    if (CLOUD_CONFIG.debug) {
      console.log('云开发初始化成功，环境ID:', CLOUD_CONFIG.envId);
    }
    
    return true;
    // #endif
    
    // #ifndef MP-WEIXIN
    console.warn('云开发仅支持微信小程序');
    return false;
    // #endif
  } catch (e) {
    console.error('云开发初始化失败:', e);
    return false;
  }
}

// 检查云开发是否可用
function isCloudAvailable() {
  return CLOUD_CONFIG.enabled;
}

// 获取云数据库引用
function getDB() {
  if (!isCloudAvailable()) {
    console.warn('云开发未启用');
    return null;
  }
  
  try {
    // #ifdef MP-WEIXIN
    return wx.cloud.database();
    // #endif
  } catch (e) {
    console.error('获取数据库引用失败:', e);
    return null;
  }
}

// 调用云函数
function callFunction(name, data = {}) {
  if (!isCloudAvailable()) {
    console.warn('云开发未启用，无法调用云函数');
    return Promise.reject(new Error('云开发未启用'));
  }
  
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    wx.cloud.callFunction({
      name: name,
      data: data,
      success: res => {
        if (CLOUD_CONFIG.debug) {
          console.log(`云函数 ${name} 调用成功:`, res);
        }
        resolve(res.result);
      },
      fail: err => {
        console.error(`云函数 ${name} 调用失败:`, err);
        reject(err);
      }
    });
    // #endif
    
    // #ifndef MP-WEIXIN
    reject(new Error('云函数仅支持微信小程序'));
    // #endif
  });
}

// 获取订阅消息模板ID
function getSubscribeTemplateId() {
  return CLOUD_CONFIG.subscribeMessageTemplateId;
}

// 导出配置和方法
export default {
  ...CLOUD_CONFIG,
  initCloud,
  isCloudAvailable,
  getDB,
  callFunction,
  getSubscribeTemplateId
};
