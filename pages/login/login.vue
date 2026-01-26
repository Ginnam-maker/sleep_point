<template>
	<view class="login-container">
		<!-- 关闭按钮 -->
		<view class="close-btn" @click="goBack">
			<text class="close-icon">×</text>
		</view>
		
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
				<text class="feature-list">📊 查看打卡统计（试用7天）</text>
				<text class="feature-list">🏆 解锁专属成就（需登录）</text>
			</view>
			
		<!-- 用户信息输入区域 -->
		<view class="user-info-section">
			<!-- 头像选择 -->
			<view class="avatar-section">
				<button 
					class="avatar-btn" 
					open-type="chooseAvatar"
					@chooseavatar="onChooseAvatar"
				>
					<image 
						v-if="avatarUrl" 
						:src="avatarUrl" 
						class="avatar-image"
						mode="aspectFill"
					/>
					<view v-else class="avatar-placeholder">
						<text class="avatar-placeholder-icon">📷</text>
						<text class="avatar-placeholder-text">选择头像</text>
					</view>
				</button>
			</view>
			
			<!-- 昵称输入 -->
			<view class="nickname-section">
				<input 
					class="nickname-input"
					type="nickname"
					v-model="nickname"
					placeholder="请输入昵称"
					:adjust-position="true"
					@blur="onNicknameBlur"
				/>
			</view>
		</view>
		
		<!-- 登录按钮 -->
		<button 
			class="login-btn" 
			@click="handleLogin"
			:loading="isLoading"
			:disabled="!canLogin"
		>
			<text class="btn-text">{{ isLoading ? '登录中...' : '完成登录' }}</text>
			<!-- 试用模式说明 -->
			<view class="trial-tip">
				<text class="trial-text">💡 试用模式可体验打卡和7天统计，登录后解锁完整功能</text>
			</view>
		</view>
		
		<!-- 底部说明 - 带勾选框 -->
		<view class="footer-agreement">
			<view class="checkbox-wrapper" @click="toggleAgreement">
				<view class="checkbox" :class="{ checked: hasAgreedPrivacy }">
					<text v-if="hasAgreedPrivacy" class="checkbox-icon">✓</text>
				</view>
				<view class="agreement-text-wrapper">
					<text class="privacy-text">我已阅读并同意</text>
					<text class="privacy-link" @click.stop="showUserAgreement">《用户服务协议》</text>
					<text class="privacy-text">和</text>
					<text class="privacy-link" @click.stop="showPrivacyPolicy">《隐私政策》</text>
				</view>
			</view>
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
			userInfo: null,
			hasAgreedPrivacy: false,
			avatarUrl: '',
			nickname: ''
		};
	},
	
	computed: {
		// 是否可以登录(需要头像和昵称)
		canLogin() {
			return this.avatarUrl && this.nickname.trim();
		}
	},
	
	onLoad() {
		// 检查是否已登录
		this.checkLoginStatus();
		// 检查是否已同意隐私政策
		const agreed = uni.getStorageSync('privacyAgreed');
		if (agreed) {
			this.hasAgreedPrivacy = true;
		}
		// 不再自动弹出隐私政策弹窗
	},
	
	methods: {
		// 返回上一页或首页
		goBack() {
			const pages = getCurrentPages();
			if (pages.length > 1) {
				uni.navigateBack();
			} else {
				uni.switchTab({
					url: '/pages/index/index'
				});
			}
		},
		
		// 检查登录状态
		checkLoginStatus() {
			const userInfo = uni.getStorageSync('userInfo');
			if (userInfo) {
				// 已登录，直接跳转
				this.navigateToHome();
			}
		},
		
		// 切换协议同意状态
		toggleAgreement() {
			this.hasAgreedPrivacy = !this.hasAgreedPrivacy;
			uni.setStorageSync('privacyAgreed', this.hasAgreedPrivacy);
			uni.vibrateShort({ type: 'light' });
		},
		
		// 选择头像回调
		onChooseAvatar(e) {
			console.log('选择头像:', e);
			this.avatarUrl = e.detail.avatarUrl;
			uni.vibrateShort({ type: 'light' });
		},
		
		// 昵称输入失焦
		onNicknameBlur(e) {
			console.log('昵称输入:', e.detail.value);
		},
		
		// 登录处理
		async handleLogin() {
			// 检查是否已同意隐私政策
			if (!this.hasAgreedPrivacy) {
				uni.showModal({
					title: '温馨提示',
					content: '请先勾选并同意《用户服务协议》和《隐私政策》',
					showCancel: false,
					confirmText: '我知道了'
				});
				return;
			}
			
			// 检查是否已填写头像和昵称
			if (!this.avatarUrl || !this.nickname.trim()) {
				uni.showToast({
					title: '请选择头像并输入昵称',
					icon: 'none'
				});
				return;
			}
			
			this.isLoading = true;
			uni.vibrateShort({ type: 'medium' });
			
			try {
				// 初始化云开发
				if (CLOUD_CONFIG.enabled) {
					initCloud();
				}
				
				// 构建用户信息
				const userInfo = {
					nickName: this.nickname.trim(),
					avatarUrl: this.avatarUrl
				};
				
				// 保存用户信息
				uni.setStorageSync('userInfo', userInfo);
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
		
		// 跳转到首页
		navigateToHome() {
			uni.switchTab({
				url: '/pages/index/index'
			});
		},
		
		// 开始试用
		startTrial() {
			uni.vibrateShort({ type: 'light' });
			
			// 直接进入首页试用
			uni.switchTab({
				url: '/pages/index/index'
			});
		},
		
		// 显示用户服务协议
		showUserAgreement() {
			uni.showModal({
				title: '用户服务协议',
				content: '【更新日期：2026年1月26日】\n\n一、服务说明\n1.1 本应用（"睡点儿"小程序）是一款睡眠记录与统计工具，为用户提供睡眠打卡、心情记录、数据统计、成就系统等功能。\n1.2 本应用仅供个人记录使用，不构成任何医疗建议或诊断。\n\n二、用户账号\n2.1 用户可选择微信登录或本地模式使用本应用。\n2.2 微信登录模式下，用户可享受云端数据同步功能。\n2.3 本地模式下，数据仅保存在用户设备本地。\n\n三、使用规范\n3.1 用户应遵守中华人民共和国相关法律法规。\n3.2 禁止利用本应用发布违法违规信息。\n3.3 用户对其账号和数据安全承担责任。\n\n四、知识产权\n4.1 本应用的所有内容、功能、设计归开发者所有。\n4.2 用户生成的打卡数据归用户本人所有。\n\n五、免责声明\n5.1 本应用提供的睡眠记录功能仅供参考，不能替代专业医疗建议。\n5.2 因用户不当使用导致的任何损失，开发者不承担责任。\n5.3 因不可抗力因素导致的服务中断，开发者不承担责任。\n\n六、服务变更与终止\n6.1 开发者有权根据运营需要修改服务内容。\n6.2 开发者有权在必要时暂停或终止服务。\n6.3 如服务终止，将提前通知用户导出数据。',
				showCancel: false,
				confirmText: '我知道了'
			});
		},
		
		// 显示隐私政策
		showPrivacyPolicy() {
			uni.showModal({
				title: '隐私政策',
				content: '【更新日期：2026年1月26日】\n\n一、信息收集范围\n我们仅收集以下必要信息：\n1.1 用户头像：用于应用内个性化展示\n1.2 用户昵称：用于应用内个性化展示\n1.3 微信OpenID：用于用户身份识别（仅微信登录模式）\n1.4 打卡记录：包括打卡日期、时间、心情状态\n1.5 设备信息：系统版本、设备型号（用于兼容性优化）\n\n二、信息使用目的\n2.1 头像和昵称：仅在应用内展示，提供个性化体验\n2.2 OpenID：用于云端数据同步时识别用户身份，不与第三方共享\n2.3 打卡记录：用于生成统计图表、计算成就，数据仅供用户本人查看\n2.4 设备信息：用于功能适配和问题排查，不涉及用户隐私\n\n三、信息存储方式\n3.1 本地模式：所有数据仅存储在用户设备本地，我们无法访问\n3.2 微信登录模式：数据加密后存储在微信云开发数据库中\n3.3 数据存储期限：直至用户主动删除或注销账号\n\n四、信息保护措施\n4.1 采用HTTPS加密传输协议\n4.2 云端数据存储在腾讯云服务器，享受企业级安全防护\n4.3 严格的访问控制，仅开发者本人可访问后台\n4.4 不会将用户数据用于任何商业用途\n\n五、信息共享与披露\n5.1 我们不会向任何第三方出售、出租或共享您的个人信息\n5.2 除非获得您的明确授权\n5.3 除非法律法规要求披露\n\n六、用户权利\n6.1 查看权：您可随时查看自己的所有数据\n6.2 修改权：您可修改头像、昵称等信息\n6.3 删除权：您可在"数据管理"中删除所有数据\n6.4 导出权：您可导出自己的打卡记录\n6.5 注销权：您可通过"退出登录"注销账号\n\n七、未成年人保护\n7.1 我们重视未成年人个人信息保护\n7.2 若您是未成年人，请在监护人指导下使用\n\n八、政策更新\n8.1 我们可能适时修订本政策\n8.2 重大变更将通过应用内通知告知用户',
				showCancel: false,
				confirmText: '我知道了'
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

/* 关闭按钮 */
.close-btn {
	position: absolute;
	top: 48rpx;
	right: 48rpx;
	width: 64rpx;
	height: 64rpx;
	background-color: rgba(255, 255, 255, 0.2);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10;
	backdrop-filter: blur(10rpx);
}

.close-btn:active {
	opacity: 0.7;
}

.close-icon {
	font-size: 48rpx;
	color: #ffffff;
	line-height: 1;
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
	fo用户信息输入区域 */
.user-info-section {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
	margin-bottom: 48rpx;
}

/* 头像选择 */
.avatar-section {
	display: flex;
	justify-content: center;
}

.avatar-btn {
	width: 160rpx;
	height: 160rpx;
	padding: 0;
	border: none;
	background-color: transparent;
	border-radius: 50%;
	overflow: hidden;
}

.avatar-btn::after {
	border: none;
}

.avatar-image {
	width: 100%;
	height: 100%;
	border-radius: 50%;
}

.avatar-placeholder {
	width: 100%;
	height: 100%;
	background-color: #F3F4F6;
	border: 2rpx dashed #D1D5DB;
	border-radius: 50%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.avatar-placeholder-icon {
	font-size: 48rpx;
	margin-bottom: 8rpx;
}

.avatar-placeholder-text {
	font-size: 22rpx;
	color: #9CA3AF;
}

/* 昵称输入 */
.nickname-section {
	width: 100%;
}

.nickname-input {
	width: 100%;
	height: 88rpx;
	background-color: #F9FAFB;
	border: 2rpx solid #E5E7EB;
	border-radius: 16rpx;
	padding: 0 32rpx;
	font-size: 28rpx;
	color: #111827;
	box-sizing: border-box;
}

.nickname-input:focus {
	border-color: #667eea;
	background-color: #ffffff;
}

/* nt-weight: bold;
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

.login-btn[disabled] {
	opacity: 0.4;
}

.btn-text {
	color: #ffffff;
}

/* 试用按钮 */
.trial-btn {
	width: 100%;
	background-color: transparent;
	border: 2rpx solid #E5E7EB;
	border-radius: 16rpx;
	padding: 28rpx;
	margin-top: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s;
	box-sizing: border-box;
}

.trial-btn:active {
	background-color: #F9FAFB;
	opacity: 0.8;
}

.trial-btn-text {
	font-size: 32rpx;
	color: #374151;
	font-weight: 600;
}

/* 试用模式提示 */
.trial-tip {
	margin-top: 24rpx;
	padding: 16rpx 24rpx;
	background-color: #F0F9FF;
	border-radius: 12rpx;
	border: 1rpx solid #BAE6FD;
}

.trial-text {
	font-size: 22rpx;
	color: #0369A1;
	line-height: 1.6;
	text-align: center;
}

/* 底部协议区域 */
.footer-agreement {
	margin-top: 48rpx;
	animation: fade-in 0.6s ease-out 0.4s both;
}

.checkbox-wrapper {
	display: flex;
	align-items: flex-start;
	justify-content: center;
	padding: 0 16rpx;
}

.checkbox {
	width: 32rpx;
	height: 32rpx;
	border: 2rpx solid rgba(255, 255, 255, 0.6);
	border-radius: 6rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 12rpx;
	flex-shrink: 0;
	margin-top: 2rpx;
	background-color: transparent;
	transition: all 0.3s;
}

.checkbox.checked {
	background-color: #ffffff;
	border-color: #ffffff;
}

.checkbox-icon {
	font-size: 20rpx;
	color: #667eea;
	font-weight: bold;
}

.agreement-text-wrapper {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
}

.privacy-text {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.8);
	line-height: 1.6;
}

.privacy-link {
	font-size: 24rpx;
	color: #ffffff;
	text-decoration: underline;
	margin: 0 4rpx;
	font-weight: 500;
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
