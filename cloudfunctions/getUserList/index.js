// 云函数：getUserList - 获取用户列表（管理员使用）
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const { page = 1, pageSize = 20, sortBy = 'lastLoginTime' } = event;
    
    // 计算分页
    const skip = (page - 1) * pageSize;
    
    // 查询用户列表
    const result = await db.collection('users')
      .orderBy(sortBy, 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();
    
    // 获取总数
    const countResult = await db.collection('users').count();
    
    // 统计数据
    const stats = {
      totalUsers: countResult.total,
      currentPage: page,
      pageSize: pageSize,
      totalPages: Math.ceil(countResult.total / pageSize)
    };
    
    return {
      code: 0,
      message: '获取成功',
      data: {
        users: result.data,
        stats: stats
      }
    };
    
  } catch (err) {
    console.error('获取用户列表失败:', err);
    return {
      code: -999,
      message: '获取用户列表失败: ' + err.message
    };
  }
};
