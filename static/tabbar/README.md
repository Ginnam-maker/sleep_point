# TabBar 图标说明

此目录用于存放底部导航栏图标。

## 需要的图标

### 1. 打卡图标
- `checkin.png` - 未选中状态（灰色）
- `checkin-active.png` - 选中状态（黑色）
- 建议图标：月亮、床、枕头等睡眠相关图标

### 2. 统计图标
- `stats.png` - 未选中状态（灰色）
- `stats-active.png` - 选中状态（黑色）
- 建议图标：图表、数据、趋势线等

### 3. 成就图标
- `achievement.png` - 未选中状态（灰色）
- `achievement-active.png` - 选中状态（黑色）
- 建议图标：奖杯、徽章、星星等

## 图标规格

- **尺寸**: 81px × 81px（@1x，微信小程序会自动适配）
- **格式**: PNG（支持透明背景）
- **颜色**: 
  - 未选中：`#6B7280`（灰色）
  - 选中：`#000000`（黑色）

## 临时方案

如果暂时没有图标，可以在 `pages.json` 中临时注释掉图标配置：

```json
{
  "pagePath": "pages/index/index",
  "text": "打卡"
  // "iconPath": "static/tabbar/checkin.png",
  // "selectedIconPath": "static/tabbar/checkin-active.png"
}
```

这样 TabBar 会只显示文字，不显示图标。

## 推荐图标资源

- [Iconify](https://icon-sets.iconify.design/) - 大量免费图标
- [Iconfont](https://www.iconfont.cn/) - 阿里巴巴矢量图标库
- [Flaticon](https://www.flaticon.com/) - 免费图标资源

## 在线生成工具

可以使用在线工具将 SVG 转换为 PNG：
- https://svgtopng.com/
- https://www.aconvert.com/cn/image/svg-to-png/
