<script>
import { initCloud, CLOUD_CONFIG } from '@/utils/cloud/config.js';
import { saveUserInfoToCloud } from '@/utils/cloud/sync.js';

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
		
		async checkLogin() {
			// 试用模式：允许所有页面访问，不强制登录
			// 具体功能限制在各个页面内部实现
			
			// 兜底逻辑：检查已登录但未同步到云端的用户
			const userInfo = uni.getStorageSync('userInfo');
			const cloudUserInfoSynced = uni.getStorageSync('cloudUserInfoSynced');
			
			if (userInfo && CLOUD_CONFIG.enabled && !cloudUserInfoSynced) {
				console.log('检测到未同步的用户信息，开始同步到云端...');
				try {
					const result = await saveUserInfoToCloud(userInfo);
					if (result.code === 0) {
						console.log('用户信息兜底同步成功');
						uni.setStorageSync('cloudUserInfoSynced', true);
					} else {
						console.warn('用户信息兜底同步失败:', result.message);
					}
				} catch (error) {
					console.warn('用户信息兜底同步异常:', error);
				}
			}
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
