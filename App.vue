<script>
import { initCloud } from '@/utils/cloud/config.js';

export default {
	onLaunch: function() {
		console.log('App Launch')
		// 初始化应用
		this.initApp();
		
		// 初始化云开发
		initCloud();
		
		// 检查登录状态
		this.checkLogin();
	},
	onShow: function() {
		console.log('App Show')
	},
	onHide: function() {
		console.log('App Hide')
	},
	methods: {
		initApp() {
			// 检查系统信息
			const systemInfo = uni.getSystemInfoSync();
			console.log('系统信息:', systemInfo);
		},
		
		checkLogin() {
			// 试用模式：允许所有页面访问，不强制登录
			// 具体功能限制在各个页面内部实现
		}
	}
}
</script>

<style>
/* 全局CSS变量 */
page {
	--primary-color: #000000;
	--bg-color: #ffffff;
	--text-primary: #111827;
	--text-secondary: #6B7280;
	--bg-gray: #F3F4F6;
	--border-radius-lg: 24rpx;
	--border-radius-xl: 32rpx;
}

/* 全局样式重置 */
page {
	background-color: var(--bg-color);
	color: var(--text-primary);
	font-size: 28rpx;
	line-height: 1.5;
}

/* 通用工具类 */
.flex {
	display: flex;
}

.flex-center {
	display: flex;
	align-items: center;
	justify-content: center;
}

.flex-column {
	display: flex;
	flex-direction: column;
}

.rounded-lg {
	border-radius: var(--border-radius-lg);
}

.rounded-xl {
	border-radius: var(--border-radius-xl);
}

.text-primary {
	color: var(--text-primary);
}

.text-secondary {
	color: var(--text-secondary);
}

.bg-primary {
	background-color: var(--primary-color);
}

.bg-gray {
	background-color: var(--bg-gray);
}
</style>
