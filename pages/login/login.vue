<template>
	<view class="login-container">
		<!-- 顶部装饰 -->
		<view class="header-decoration">
			<text class="app-icon">🌙</text>
			<text class="app-name">睡点儿</text>
			<text class="app-slogan">记录每一个好梦</text>
		</view>
		
		<!-- 登录卡片 -->
		<view class="login-card">
			<view class="card-content">
				<text class="welcome-text">欢迎使用</text>
				<text class="feature-list">✨ 记录睡眠心情</text>
				<text class="feature-list">📊 查看打卡统计</text>
				<text class="feature-list">🏆 解锁专属成就</text>
			</view>
			
			<!-- 登录按钮 -->
			<button 
				class="login-btn" 
				@click="handleLogin"
				:loading="isLoading"
			>
				<text class="btn-text">{{ isLoading ? '登录中...' : '微信一键登录' }}</text>
			</button>
			
			<!-- 游客模式 -->
			<view class="guest-mode" @click="guestLogin">
				<text class="guest-text">暂不登录，使用本地模式</text>
			</view>
		</view>
		
		<!-- 底部说明 -->
		<view class="footer-text">
			<text class="privacy-text">登录即代表同意</text>
			<text class="privacy-link" @click="showPrivacy">《用户协议》</text>
			<text class="privacy-text">和</text>
			<text class="privacy-link" @click="showPrivacy">《隐私政策》</text>
		</view>
	</view>
</template>

<script>
import { initCloud, CLOUD_CONFIG } from '@/utils/cloud/config.js';
import { syncFromCloud } from '@/utils/cloud/sync.js';

export default {
	data() {
		return {
			isLoading: false,
			userInfo: null
		};
	},
	
	onLoad() {
		// 检查是否已登录
		this.checkLoginStatus();
	},
	
	methods: {
		// 检查登录状态
		checkLoginStatus() {
			const userInfo = uni.getStorageSync('userInfo');
			if (userInfo) {
				// 已登录，直接跳转
				this.navigateToHome();
			}
		},
		
		// 微信登录
		async handleLogin() {
			this.isLoading = true;
			uni.vibrateShort({ type: 'medium' });
			
			try {
				// 初始化云开发
				if (CLOUD_CONFIG.enabled) {
					initCloud();
				}
				
				// 获取用户信息
				const userProfile = await this.getUserProfile();
				
				if (userProfile) {
					// 保存用户信息
					uni.setStorageSync('userInfo', userProfile);
					uni.setStorageSync('loginMode', 'wechat');
					
					// 如果启用了云开发，同步数据
					if (CLOUD_CONFIG.enabled) {
						await syncFromCloud();
					}
					
					uni.showToast({
						title: '登录成功',
						icon: 'success'
					});
					
					uni.vibrateLong();
					
					// 延迟跳转
					setTimeout(() => {
						this.navigateToHome();
					}, 1000);
				}
			} catch (error) {
				console.error('登录失败:', error);
				
				uni.showModal({
					title: '登录失败',
					content: error.errMsg || '请稍后重试',
					showCancel: false
				});
			} finally {
				this.isLoading = false;
			}
		},
		
		// 获取用户信息
		getUserProfile() {
			return new Promise((resolve, reject) => {
				uni.getUserProfile({
					desc: '用于完善用户资料',
					success: (res) => {
						resolve(res.userInfo);
					},
					fail: (error) => {
						reject(error);
					}
				});
			});
		},
		
		// 游客模式
		guestLogin() {
			uni.vibrateShort({ type: 'light' });
			
			uni.showModal({
				title: '使用本地模式',
				content: '本地模式下，数据仅保存在当前设备，不会同步到云端。确定继续吗？',
				confirmText: '继续',
				cancelText: '取消',
				success: (res) => {
					if (res.confirm) {
						// 设置游客模式
						uni.setStorageSync('loginMode', 'guest');
						uni.setStorageSync('userInfo', {
							nickName: '游客用户',
							avatarUrl: ''
						});
						
						uni.showToast({
							title: '已进入本地模式',
							icon: 'success'
						});
						
						setTimeout(() => {
							this.navigateToHome();
						}, 1000);
					}
				}
			});
		},
		
		// 跳转到首页
		navigateToHome() {
			uni.switchTab({
				url: '/pages/index/index'
			});
		},
		
		// 显示隐私协议
		showPrivacy() {
			uni.showModal({
				title: '用户协议',
				content: '本应用尊重并保护所有用户的个人隐私权。除法律或政府要求外，未经用户同意，我们不会向第三方公开或透露用户个人信息。',
				showCancel: false
			});
		}
	}
};
</script>

<style scoped>
.login-container {
	min-height: 100vh;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 64rpx 48rpx;
}

/* 顶部装饰 */
.header-decoration {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 80rpx;
	animation: fade-in-down 0.6s ease-out;
}

.app-icon {
	font-size: 120rpx;
	margin-bottom: 24rpx;
}

.app-name {
	font-size: 56rpx;
	font-weight: bold;
	color: #ffffff;
	margin-bottom: 16rpx;
}

.app-slogan {
	font-size: 28rpx;
	color: rgba(255, 255, 255, 0.8);
}

/* 登录卡片 */
.login-card {
	width: 100%;
	background-color: #ffffff;
	border-radius: 32rpx;
	padding: 64rpx 48rpx;
	box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
	animation: fade-in-up 0.6s ease-out 0.2s both;
}

.card-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 48rpx;
}

.welcome-text {
	font-size: 40rpx;
	font-weight: bold;
	color: #111827;
	margin-bottom: 32rpx;
}

.feature-list {
	font-size: 28rpx;
	color: #6B7280;
	line-height: 2;
	width: 100%;
	text-align: left;
}

/* 登录按钮 */
.login-btn {
	width: 100%;
	background-color: #000000;
	color: #ffffff;
	border-radius: 16rpx;
	padding: 28rpx;
	border: none;
	font-size: 32rpx;
	font-weight: 600;
	transition: opacity 0.3s;
}

.login-btn:active {
	opacity: 0.8;
}

.btn-text {
	color: #ffffff;
}

/* 游客模式 */
.guest-mode {
	margin-top: 32rpx;
	text-align: center;
	padding: 16rpx;
}

.guest-text {
	font-size: 26rpx;
	color: #9CA3AF;
	text-decoration: underline;
}

/* 底部说明 */
.footer-text {
	margin-top: 48rpx;
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	animation: fade-in 0.6s ease-out 0.4s both;
}

.privacy-text {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.7);
}

.privacy-link {
	font-size: 24rpx;
	color: #ffffff;
	text-decoration: underline;
	margin: 0 4rpx;
}

/* 动画 */
@keyframes fade-in-down {
	from {
		opacity: 0;
		transform: translateY(-40rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes fade-in-up {
	from {
		opacity: 0;
		transform: translateY(40rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes fade-in {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}
</style>
