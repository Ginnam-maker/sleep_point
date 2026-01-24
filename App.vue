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
			// 获取当前页面
			const pages = getCurrentPages();
			const currentPage = pages[pages.length - 1];
			const currentRoute = currentPage ? currentPage.route : '';
			
			// 如果不是登录页，检查是否已登录
			if (currentRoute !== 'pages/login/login') {
				const userInfo = uni.getStorageSync('userInfo');
				if (!userInfo) {
					// 未登录，跳转到登录页
					uni.reLaunch({
						url: '/pages/login/login'
					});
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
