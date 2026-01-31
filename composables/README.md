# Composables 使用文档

本目录包含睡点儿小程序的 Vue 3 Composition API 可组合函数（Composables）。

## 📦 可用的 Composables

### useCheckins - 打卡数据管理

管理打卡记录的加载、保存、修改等操作，以及连续天数、累计天数的计算。

#### 导入

```javascript
import { useCheckins } from '@/composables';
```

#### 使用示例

```javascript
export default {
  setup() {
    const { 
      checkins,        // 所有打卡记录
      todayCheckin,    // 今日打卡
      streakDays,      // 连续天数
      totalDays,       // 累计天数
      loadCheckins,    // 加载数据
      performCheckin,  // 执行打卡
      updateCheckin,   // 修改打卡
    } = useCheckins({ 
      limitDays: 7  // 可选：限制天数（用于未登录用户）
    });
    
    return {
      checkins,
      streakDays,
      totalDays
    };
  },
  
  onLoad() {
    // 在生命周期中加载数据
    this.loadCheckins();
  }
}
```

#### API 接口

**状态（只读）**
- `checkins` - 所有打卡记录数组
- `todayCheckin` - 今日打卡记录对象
- `isLoading` - 加载状态
- `error` - 错误信息

**计算属性**
- `totalDays` - 累计打卡天数
- `streakDays` - 连续打卡天数
- `todayDate` - 今日日期字符串 (YYYY-MM-DD)
- `hasTodayCheckin` - 是否已打卡

**方法**
- `loadCheckins(applyLimit)` - 加载所有打卡记录
- `loadTodayCheckin()` - 加载今日打卡
- `performCheckin(moodId, date?)` - 执行打卡
- `updateCheckin(date, newMoodId)` - 修改打卡
- `deleteCheckin(date)` - 删除打卡（测试用）
- `getCheckinByDate(date)` - 获取指定日期的打卡
- `hasCheckinOnDate(date)` - 检查指定日期是否有打卡
- `getMonthCheckins(year, month)` - 获取某月的打卡
- `formatDateString(date)` - 格式化日期
- `formatCheckinTime(timestamp)` - 格式化时间

---

### useAuth - 用户认证管理

管理用户登录状态、登录/登出操作、权限守卫等。

#### 导入

```javascript
import { useAuth } from '@/composables';
```

#### 使用示例

```javascript
export default {
  setup() {
    const { 
      isLoggedIn,      // 是否已登录
      userInfo,        // 用户信息
      requireAuth,     // 登录守卫
      navigateToLogin  // 跳转登录页
    } = useAuth();
    
    const handleAction = () => {
      requireAuth(() => {
        // 需要登录的操作
        console.log('用户已登录，执行操作');
      });
    };
    
    return {
      isLoggedIn,
      handleAction
    };
  }
}
```

#### API 接口

**状态（只读）**
- `userInfo` - 用户信息对象
- `isLoggedIn` - 是否已登录
- `isLoading` - 加载状态

**方法**
- `checkLoginStatus()` - 检查登录状态
- `login(loginData)` - 登录
- `logout()` - 登出
- `navigateToLogin()` - 跳转到登录页
- `requireAuth(callback, options?)` - 登录守卫，未登录时显示提示

---

## 🎯 设计原则

1. **职责单一**：每个 composable 只负责一个领域的功能
2. **状态只读**：通过 `readonly()` 防止外部直接修改状态
3. **方法明确**：提供清晰的方法名和参数
4. **生命周期分离**：不在 composable 内部调用生命周期钩子，由组件控制
5. **错误处理**：统一的错误处理和提示

## 📝 最佳实践

### 1. 在组件的 setup() 中使用

```javascript
export default {
  setup() {
    const { checkins, loadCheckins } = useCheckins();
    
    // 返回给模板使用
    return {
      checkins,
      loadCheckins
    };
  },
  
  // 在生命周期中调用方法
  onLoad() {
    this.loadCheckins();
  }
}
```

### 2. 未登录用户数据限制

```javascript
const { isLoggedIn } = useAuth();
const { loadCheckins } = useCheckins({ limitDays: 7 });

const loadData = () => {
  const shouldLimit = !isLoggedIn.value;
  loadCheckins(shouldLimit);
};
```

### 3. 权限守卫

```javascript
const { requireAuth } = useAuth();

const handleSensitiveAction = () => {
  requireAuth(() => {
    // 执行需要登录的操作
  }, {
    title: '需要登录',
    content: '该功能需要登录后使用'
  });
};
```

### 4. 数据更新后刷新

```javascript
const { performCheckin, loadCheckins } = useCheckins();

const handleCheckin = async (moodId) => {
  await performCheckin(moodId);
  // 不需要手动 loadCheckins，performCheckin 内部已自动刷新
};
```

## 🔄 页面间数据同步

由于 uni-app 的页面栈机制，推荐在 `onShow` 中重新加载数据：

```javascript
export default {
  setup() {
    const { loadCheckins } = useCheckins();
    
    return { loadCheckins };
  },
  
  onShow() {
    // 每次页面显示时刷新数据
    this.loadCheckins();
  }
}
```

## 🚀 后续扩展

可以继续添加以下 composables：

- **useAchievements** - 成就管理
- **useMood** - 心情配置管理
- **useVibrate** - 震动反馈封装
- **useCalendar** - 日历逻辑封装

## 📚 相关资源

- [Vue 3 Composition API 文档](https://v3.cn.vuejs.org/guide/composition-api-introduction.html)
- [uni-app Vue 3 支持](https://uniapp.dcloud.net.cn/tutorial/vue3-basics.html)
