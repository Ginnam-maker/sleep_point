# 云开发配置说明

## 环境准备

### 1. 注册腾讯云开发

1. 访问 [腾讯云开发控制台](https://console.cloud.tencent.com/tcb)
2. 创建一个新的云开发环境
3. 记录环境 ID (env-id)

### 2. 开通微信小程序云开发

1. 在微信小程序后台开通云开发
2. 关联腾讯云开发环境
3. 获取小程序 AppID

## 数据库设计

### 集合（Collection）

#### users - 用户表
```json
{
  "_id": "auto",
  "_openid": "auto",
  "nickName": "用户昵称",
  "avatarUrl": "头像URL",
  "createdAt": "注册时间",
  "updatedAt": "最后登录时间",
  "settings": {
    "reminderTime": "22:00",
    "reminderEnabled": true
  }
}
```

**索引**:
- `_openid` (唯一索引)

**权限**: 仅创建者可读写

---

#### checkins - 打卡记录表
```json
{
  "_id": "auto",
  "_openid": "auto",
  "mood": "happy",
  "checkinTime": "打卡时间戳",
  "checkinDate": "2026-01-24",
  "isModified": false,
  "modifiedAt": null,
  "createdAt": "创建时间"
}
```

**索引**:
- `_openid + checkinDate` (组合唯一索引)
- `_openid + createdAt` (普通索引)

**权限**: 仅创建者可读写

---

#### achievements - 成就记录表
```json
{
  "_id": "auto",
  "_openid": "auto",
  "achievementId": "streak_7",
  "unlockedAt": "解锁时间戳",
  "createdAt": "创建时间"
}
```

**索引**:
- `_openid + achievementId` (组合唯一索引)

**权限**: 仅创建者可读写

---

## 云函数列表

### 1. checkin - 打卡接口

**路径**: `cloudfunctions/checkin/index.js`

**输入**:
```json
{
  "mood": "happy"
}
```

**输出**:
```json
{
  "code": 0,
  "message": "打卡成功",
  "data": {
    "_id": "record_id",
    "checkinDate": "2026-01-24"
  }
}
```

---

### 2. unlockAchievement - 解锁成就

**路径**: `cloudfunctions/unlockAchievement/index.js`

**输入**:
```json
{
  "achievementId": "streak_7"
}
```

**输出**:
```json
{
  "code": 0,
  "message": "成就已解锁",
  "data": {
    "_id": "achievement_id"
  }
}
```

---

### 3. updateCheckin - 修改打卡记录

**路径**: `cloudfunctions/updateCheckin/index.js`

**输入**:
```json
{
  "checkinId": "record_id",
  "mood": "content"
}
```

**输出**:
```json
{
  "code": 0,
  "message": "修改成功"
}
```

---

### 4. getStats - 获取统计数据

**路径**: `cloudfunctions/getStats/index.js`

**输入**: 无

**输出**:
```json
{
  "code": 0,
  "data": {
    "totalDays": 30,
    "streakDays": 7,
    "checkins": [],
    "achievements": []
  }
}
```

---

## 配置步骤

### 1. 配置云开发环境 ID

在 `manifest.json` 中添加：

```json
{
  "mp-weixin": {
    "appid": "你的小程序AppID",
    "cloudfunctionRoot": "cloudfunctions/",
    "cloudbaseEnv": "你的环境ID"
  }
}
```

### 2. 初始化云开发

在 `main.js` 中添加：

```javascript
// 初始化云开发
wx.cloud.init({
  env: '你的环境ID',
  traceUser: true
});
```

### 3. 创建数据库集合

在腾讯云开发控制台中：
1. 进入「数据库」
2. 创建集合：`users`, `checkins`, `achievements`
3. 配置索引（见上方数据库设计）
4. 设置权限为「仅创建者可读写」

### 4. 上传云函数

在 HBuilderX 中：
1. 右键 `cloudfunctions` 文件夹
2. 选择「上传部署云函数」
3. 依次上传所有云函数

### 5. 配置订阅消息

1. 在微信小程序后台申请订阅消息模板
2. 获取模板 ID
3. 在代码中配置模板 ID

---

## 开发说明

### 本地调试

当前版本使用本地存储（localStorage），无需云开发即可运行。

### 云开发迁移

要启用云开发功能：

1. 完成上述配置步骤
2. 修改 `utils/storage.js`，将本地存储调用替换为云函数调用
3. 实现数据同步逻辑
4. 添加登录授权流程

---

## 注意事项

1. **openid 安全**: 不要在前端代码中硬编码 openid
2. **数据验证**: 云函数中需要验证输入数据
3. **错误处理**: 实现完善的错误处理和重试机制
4. **性能优化**: 使用数据缓存减少云函数调用
5. **成本控制**: 合理使用云函数，避免频繁调用

---

## 成本估算

**免费额度** (腾讯云开发):
- 数据库读写: 50000 次/天
- 云存储: 5GB
- 云函数调用: 10000 次/天

**预估使用**:
- 日活 1000 人
- 每人 2-3 次数据库操作
- 约 3000 次/天

**结论**: 在用户量较小时，免费额度完全够用。

---

## 相关文档

- [腾讯云开发文档](https://cloud.tencent.com/document/product/876)
- [微信小程序云开发](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [uni-app 云开发](https://uniapp.dcloud.net.cn/uniCloud/)

---

**创建时间**: 2026-01-24  
**版本**: v1.3.0 (P3规划)
