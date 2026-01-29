<template>
	<view class="container">
		<!-- 页面标题 -->
		<view class="page-header">
			<text class="page-title">设置</text>
			<text class="page-subtitle">个性化你的睡眠助手</text>
		</view>
		
		<!-- 用户信息卡片 -->
		<view class="user-card" @click="showUserInfo" @longpress="editUserInfo">
			<view class="user-avatar">
				<image v-if="userInfo.avatarUrl" :src="userInfo.avatarUrl" class="avatar-img" />
				<text v-else class="avatar-text">👤</text>
			</view>
			<view class="user-info">
				<text class="user-name">{{ userInfo.nickName || '游客用户' }}</text>
				<text class="user-mode">{{ loginModeText }}</text>
			</view>
			<text class="user-arrow">›</text>
		</view>
		
		<!-- 升级为正式用户按钮（仅游客模式显示） -->
		<view v-if="loginMode === 'guest'" class="upgrade-section">
			<view class="upgrade-btn" @click="goToLogin">
				<text class="upgrade-icon">🚀</text>
				<view class="upgrade-info">
					<text class="upgrade-title">升级为正式用户</text>
					<text class="upgrade-desc">登录后将保留您的所有打卡数据</text>
				</view>
				<text class="upgrade-arrow">›</text>
			</view>
		</view>

		<!-- 数据管理 -->
		<view class="section">
			<view class="section-header">
				<text class="section-icon">📊</text>
				<text class="section-title">数据管理</text>
			</view>
			
			<view v-if="cloudEnabled" class="setting-item" @click="syncData">
				<view class="setting-info">
					<text class="setting-label">云端同步</text>
					<text class="setting-desc">同步数据到云端</text>
				</view>
				<text class="setting-arrow">›</text>
			</view>
			
			<view class="setting-item" @click="exportData">
				<view class="setting-info">
					<text class="setting-label">导出数据</text>
					<text class="setting-desc">导出所有打卡记录</text>
				</view>
				<text class="setting-arrow">›</text>
			</view>
			
			<view class="setting-item" @click="clearData">
				<view class="setting-info">
					<text class="setting-label">清除数据</text>
					<text class="setting-desc" style="color: #EF4444;">删除所有本地数据</text>
				</view>
				<text class="setting-arrow">›</text>
			</view>
		</view>

		<!-- 关于 -->
		<view class="section">
			<view class="section-header">
				<text class="section-icon">ℹ️</text>
				<text class="section-title">关于</text>
			</view>
			
			<view class="setting-item">
				<view class="setting-info">
					<text class="setting-label">版本号</text>
					<text class="setting-desc">v1.2.0</text>
				</view>
			</view>
			
			<view class="setting-item" @click="checkUpdate">
				<view class="setting-info">
					<text class="setting-label">检查更新</text>
				</view>
				<text class="setting-arrow">›</text>
			</view>
		</view>
		
		<!-- 退出登录 -->
		<view v-if="isLoggedIn" class="section">
			<view class="logout-btn" @click="handleLogout">
				<text class="logout-text">退出登录</text>
			</view>
		</view>
	</view>
</template>

<script>
import { syncFromCloud, uploadToCloud, saveUserInfoToCloud } from '@/utils/cloud/sync.js';
import { CLOUD_CONFIG } from '@/utils/cloud/config.js';

export default {
	data() {
		return {
			userInfo: {},
			loginMode: 'guest',
			cloudEnabled: false,
			isLoggedIn: false
		};
	},
	
	onLoad() {
		this.loadUserInfo();
	},
	
	onShow() {
		this.loadUserInfo();
	},
	
	computed: {
		loginModeText() {
			return this.loginMode === 'wechat' ? '微信登录' : '本地模式';
		}
	},
	
	methods: {
		// 加载用户信息
		loadUserInfo() {
			this.userInfo = uni.getStorageSync('userInfo') || { nickName: '游客用户' };
			this.loginMode = uni.getStorageSync('loginMode') || 'guest';
			this.cloudEnabled = CLOUD_CONFIG.enabled && this.loginMode === 'wechat';
			this.isLoggedIn = !!uni.getStorageSync('userInfo');
		},
		
		// 显示用户信息
		showUserInfo() {
			uni.vibrateShort({ type: 'light' });
			
			if (this.loginMode === 'guest') {
				uni.showModal({
					title: '切换登录方式',
					content: '当前使用本地模式，是否切换到微信登录以启用云同步？',
					confirmText: '去登录',
					success: (res) => {
						if (res.confirm) {
							uni.reLaunch({
								url: '/pages/login/login'
							});
						}
					}
				});
			} else {
				uni.showModal({
					title: '用户信息',
					content: `昵称：${this.userInfo.nickName}\n登录方式：${this.loginModeText}`,
					showCancel: false
				});
			}
		},
		
		// 编辑用户信息
		async editUserInfo() {
			if (this.loginMode !== 'wechat') {
				return; // 仅正式用户可编辑
			}
			
			uni.vibrateShort({ type: 'medium' });
			
			// 编辑昵称
			uni.showModal({
				title: '修改昵称',
				editable: true,
				placeholderText: this.userInfo.nickName,
				success: async (res) => {
					if (res.confirm && res.content && res.content.trim()) {
						const newNickName = res.content.trim();
						
						// 询问是否修改头像
						uni.showModal({
							title: '修改头像',
							content: '是否需要修改头像URL？',
							confirmText: '修改',
							cancelText: '不修改',
							success: async (res2) => {
								if (res2.confirm) {
									// 修改头像
									uni.showModal({
										title: '修改头像URL',
										editable: true,
										placeholderText: this.userInfo.avatarUrl,
										success: async (res3) => {
											if (res3.confirm && res3.content && res3.content.trim()) {
												await this.updateUserInfo(newNickName, res3.content.trim());
											} else {
												await this.updateUserInfo(newNickName, this.userInfo.avatarUrl);
											}
										}
									});
								} else {
									// 只修改昵称
									await this.updateUserInfo(newNickName, this.userInfo.avatarUrl);
								}
							}
						});
					}
				}
			});
		},
		
		// 更新用户信息
		async updateUserInfo(nickName, avatarUrl) {
			uni.showLoading({ title: '保存中...' });
			
			const newUserInfo = {
				nickName: nickName,
				avatarUrl: avatarUrl
			};
			
			// 更新本地存储
			uni.setStorageSync('userInfo', newUserInfo);
			this.userInfo = newUserInfo;
			
			// 同步到云端
			if (CLOUD_CONFIG.enabled) {
				const result = await saveUserInfoToCloud(newUserInfo);
				if (result.code === 0) {
					uni.hideLoading();
					uni.showToast({
						title: '修改成功',
						icon: 'success'
					});
				} else {
					uni.hideLoading();
					console.warn('保存用户信息到云端失败:', result.message);
					uni.showToast({
						title: '本地已保存，云端同步失败',
						icon: 'none'
					});
				}
			} else {
				uni.hideLoading();
				uni.showToast({
					title: '修改成功',
					icon: 'success'
				});
			}
		},
		
		// 跳转到登录页（升级为正式用户）
		goToLogin() {
			uni.vibrateShort({ type: 'medium' });
			uni.showModal({
				title: '升级为正式用户',
				content: '登录后将保留您的所有打卡数据，并解锁完整功能和云端同步。',
				confirmText: '立即登录',
				success: (res) => {
					if (res.confirm) {
						uni.reLaunch({
							url: '/pages/login/login'
						});
					}
				}
			});
		},
		
		// 云端同步
		async syncData() {
			uni.showLoading({ title: '同步中...' });
			uni.vibrateShort({ type: 'medium' });
			
			try {
				// 先上传本地数据
				await uploadToCloud();
				
				// 再从云端下载
				await syncFromCloud();
				
				uni.hideLoading();
				uni.showToast({
					title: '同步成功',
					icon: 'success'
				});
				
				uni.vibrateLong();
			} catch (error) {
				uni.hideLoading();
				uni.showToast({
					title: '同步失败',
					icon: 'none'
				});
			}
		},
		
		// 导出数据
		exportData() {
			uni.vibrateShort({ type: 'light' });
			
			const { getAllCheckins } = require('@/utils/storage.js');
			const checkins = getAllCheckins();
			
			if (checkins.length === 0) {
				uni.showToast({
					title: '暂无数据',
					icon: 'none'
				});
				return;
			}
			
			// 格式化数据为文本
			let exportText = '睡点儿 - 打卡记录\n';
			exportText += `导出时间: ${new Date().toLocaleString()}\n`;
			exportText += `总打卡次数: ${checkins.length}\n\n`;
			exportText += '---\n\n';
			
			checkins.forEach((item, index) => {
				const date = new Date(item.time);
				const mood = this.getMoodLabel(item.mood);
				exportText += `${index + 1}. ${item.date}\n`;
				exportText += `   时间: ${date.toLocaleTimeString()}\n`;
				exportText += `   心情: ${mood}\n\n`;
			});
			
			// 使用系统分享功能
			uni.showModal({
				title: '导出数据',
				content: `已准备好 ${checkins.length} 条打卡记录，点击确定复制到剪贴板`,
				success: (res) => {
					if (res.confirm) {
						uni.setClipboardData({
							data: exportText,
							success: () => {
								uni.showToast({
									title: '已复制到剪贴板',
									icon: 'success'
								});
								uni.vibrateLong();
							}
						});
					}
				}
			});
		},
		
		// 获取心情标签
		getMoodLabel(moodId) {
			const moodMap = {
				'happy': '😊 高兴',
				'content': '🤗 满足',
				'sad': '😢 难过',
				'tired': '😴 疲惫',
				'angry': '😠 愤怒',
				'worried': '😰 担忧'
			};
			return moodMap[moodId] || moodId;
		},
		
		// 清除数据
		clearData() {
			uni.vibrateShort({ type: 'light' });
			
			uni.showModal({
				title: '清除数据',
				content: '确定要删除所有打卡记录和成就吗？此操作不可恢复！',
				confirmText: '确定删除',
				confirmColor: '#EF4444',
				success: (res) => {
					if (res.confirm) {
						// 清除所有数据
						uni.clearStorageSync();
						
						uni.showToast({
							title: '数据已清除',
							icon: 'success'
						});
						
						uni.vibrateLong();
						
						// 1秒后跳转到首页
						setTimeout(() => {
							uni.switchTab({
								url: '/pages/index/index'
							});
						}, 1000);
					}
				}
			});
		},
		
		// 检查更新
		checkUpdate() {
			uni.vibrateShort({ type: 'light' });
			
			uni.showToast({
				title: '已是最新版本',
				icon: 'success'
			});
		},
		
		// 退出登录
		handleLogout() {
			uni.vibrateShort({ type: 'medium' });
			
			uni.showModal({
				title: '退出登录',
				content: '退出后将清除登录状态和隐私协议同意记录，下次打开需要重新登录和同意协议。本地打卡数据不会被清除。',
				confirmText: '确定退出',
				confirmColor: '#EF4444',
				success: (res) => {
					if (res.confirm) {
						// 清除登录相关信息
						uni.removeStorageSync('userInfo');
						uni.removeStorageSync('loginMode');
						uni.removeStorageSync('privacyAgreed');
						uni.removeStorageSync('hasShownLoginGuide');
						uni.removeStorageSync('cloudUserInfoSynced');
						
						uni.showToast({
							title: '已退出登录',
							icon: 'success'
						});
						
						uni.vibrateLong();
						
						// 延迟跳转到登录页
						setTimeout(() => {
							uni.reLaunch({
								url: '/pages/login/login'
							});
						}, 1000);
					}
				}
			});
		}
	}
};
</script>

<style scoped>
.container {
	min-height: 100vh;
	background-color: #F9FAFB;
	padding: 32rpx;
}

/* 页面标题 */
.page-header {
	margin-bottom: 48rpx;
}

.page-title {
	font-size: 56rpx;
	font-weight: bold;
	color: #111827;
	display: block;
	margin-bottom: 8rpx;
}

.page-subtitle {
	font-size: 28rpx;
	color: #6B7280;
}

/* 用户信息卡片 */
.user-card {
	background-color: #FFFFFF;
	border-radius: 24rpx;
	padding: 32rpx;
	margin-bottom: 24rpx;
	display: flex;
	align-items: center;
	gap: 20rpx;
	transition: background-color 0.3s;
}

.user-card:active {
	background-color: #F9FAFB;
}

.user-avatar {
	width: 96rpx;
	height: 96rpx;
	border-radius: 48rpx;
	background-color: #F3F4F6;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
}

.avatar-img {
	width: 100%;
	height: 100%;
}

.avatar-text {
	font-size: 48rpx;
}

.user-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.user-name {
	font-size: 32rpx;
	font-weight: 600;
	color: #111827;
}

.user-mode {
	font-size: 24rpx;
	color: #9CA3AF;
}

.user-arrow {
	font-size: 48rpx;
	color: #D1D5DB;
}

/* 升级为正式用户按钮区域 */
.upgrade-section {
	margin-bottom: 24rpx;
}

.upgrade-btn {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 24rpx;
	padding: 32rpx;
	display: flex;
	align-items: center;
	gap: 20rpx;
	box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.3);
	transition: all 0.3s;
}

.upgrade-btn:active {
	opacity: 0.85;
	transform: translateY(2rpx);
	box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.2);
}

.upgrade-icon {
	font-size: 48rpx;
}

.upgrade-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.upgrade-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #ffffff;
}

.upgrade-desc {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.8);
}

.upgrade-arrow {
	font-size: 48rpx;
	color: rgba(255, 255, 255, 0.6);
}

/* 设置区块 */
.section {
	background-color: #FFFFFF;
	border-radius: 24rpx;
	padding: 32rpx;
	margin-bottom: 24rpx;
}

.section-header {
	display: flex;
	align-items: center;
	margin-bottom: 24rpx;
	padding-bottom: 24rpx;
	border-bottom: 1px solid #F3F4F6;
}

.section-icon {
	font-size: 36rpx;
	margin-right: 12rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #111827;
}

/* 设置项 */
.setting-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx 0;
	border-bottom: 1px solid #F3F4F6;
}

.setting-item:last-child {
	border-bottom: none;
}

.setting-info {
	flex: 1;
}

.setting-label {
	font-size: 30rpx;
	color: #111827;
	display: block;
	margin-bottom: 4rpx;
}

.setting-desc {
	font-size: 24rpx;
	color: #6B7280;
}

.setting-arrow {
	font-size: 48rpx;
	color: #D1D5DB;
	margin-left: 16rpx;
}

/* 退出登录按钮 */
.logout-btn {
	background-color: #ffffff;
	border-radius: 16rpx;
	padding: 28rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
	margin-top: 32rpx;
}

.logout-btn:active {
	opacity: 0.7;
}

.logout-text {
	font-size: 30rpx;
	color: #EF4444;
	font-weight: 600;
}
</style>
