<template>
	<view class="container">
		<!-- 页面标题 -->
		<view class="page-header">
			<text class="page-title">设置</text>
			<text class="page-subtitle">个性化你的睡眠助手</text>
		</view>
		
		<!-- 用户信息卡片 -->
		<view class="user-card" @click="showUserInfo">
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

		<!-- 提醒设置 -->
		<view class="section">
			<view class="section-header">
				<text class="section-icon">⏰</text>
				<text class="section-title">睡眠提醒</text>
			</view>
			
			<view class="setting-item" @click="toggleReminder">
				<view class="setting-info">
					<text class="setting-label">定时提醒</text>
					<text class="setting-desc">每日定时推送睡眠提醒</text>
				</view>
				<switch 
					:checked="reminderEnabled" 
					@change="handleReminderToggle"
					color="#000000"
					style="transform: scale(0.9);"
				/>
			</view>
			
			<view v-if="reminderEnabled" class="setting-item" @click="showTimePicker">
				<view class="setting-info">
					<text class="setting-label">提醒时间</text>
					<text class="setting-desc">{{ reminderTime }}</text>
				</view>
				<text class="setting-arrow">›</text>
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

		<!-- 时间选择器 -->
		<picker-view 
			v-if="showTimePickerModal" 
			class="time-picker-modal"
			:value="pickerValue"
			@change="onTimeChange"
		>
			<picker-view-column>
				<view v-for="hour in hours" :key="hour" class="picker-item">{{ hour }}</view>
			</picker-view-column>
			<picker-view-column>
				<view v-for="minute in minutes" :key="minute" class="picker-item">{{ minute }}</view>
			</picker-view-column>
		</picker-view>
		
		<!-- 时间选择器遮罩和按钮 -->
		<view v-if="showTimePickerModal" class="picker-overlay" @click="hideTimePicker">
			<view class="picker-container" @click.stop>
				<view class="picker-header">
					<text class="picker-cancel" @click="hideTimePicker">取消</text>
					<text class="picker-title">选择提醒时间</text>
					<text class="picker-confirm" @click="confirmTime">确定</text>
				</view>
				<picker-view 
					class="picker-view"
					:value="pickerValue"
					@change="onTimeChange"
				>
					<picker-view-column>
						<view v-for="hour in hours" :key="hour" class="picker-item">{{ hour }}时</view>
					</picker-view-column>
					<picker-view-column>
						<view v-for="minute in minutes" :key="minute" class="picker-item">{{ minute }}分</view>
					</picker-view-column>
				</picker-view>
			</view>
		</view>
	</view>
</template>

<script>
import { syncFromCloud, uploadToCloud } from '@/utils/cloud/sync.js';
import { CLOUD_CONFIG } from '@/utils/cloud/config.js';

export default {
	data() {
		return {
			userInfo: {},
			loginMode: 'guest',
			cloudEnabled: false,
			reminderEnabled: false,
			reminderTime: '22:00',
			showTimePickerModal: false,
			pickerValue: [22, 0],
			hours: [],
			minutes: []
		};
	},
	
	onLoad() {
		this.initTimePicker();
		this.loadSettings();
		this.loadUserInfo();
	},
	
	onShow() {
		this.loadSettings();
		this.loadUserInfo();
	},
	
	computed: {
		loginModeText() {
			return this.loginMode === 'wechat' ? '微信登录' : '本地模式';
		}
	},
	
	methods: {
		// 初始化时间选择器数据
		initTimePicker() {
			// 生成小时数组 0-23
			for (let i = 0; i < 24; i++) {
				this.hours.push(String(i).padStart(2, '0'));
			}
			// 生成分钟数组 0-59
			for (let i = 0; i < 60; i++) {
				this.minutes.push(String(i).padStart(2, '0'));
			}
		},
		
		// 加载设置
		loadSettings() {
			const settings = uni.getStorageSync('app_settings') || {};
			this.reminderEnabled = settings.reminderEnabled || false;
			this.reminderTime = settings.reminderTime || '22:00';
			
			// 解析时间到选择器
			const [hour, minute] = this.reminderTime.split(':');
			this.pickerValue = [parseInt(hour), parseInt(minute)];
		},
		
		// 加载用户信息
		loadUserInfo() {
			this.userInfo = uni.getStorageSync('userInfo') || { nickName: '游客用户' };
			this.loginMode = uni.getStorageSync('loginMode') || 'guest';
			this.cloudEnabled = CLOUD_CONFIG.enabled && this.loginMode === 'wechat';
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
		
		// 保存设置
		saveSettings() {
			const settings = {
				reminderEnabled: this.reminderEnabled,
				reminderTime: this.reminderTime
			};
			uni.setStorageSync('app_settings', settings);
		},
		
		// 切换提醒开关
		handleReminderToggle(e) {
			this.reminderEnabled = e.detail.value;
			this.saveSettings();
			
			uni.vibrateShort({ type: 'light' });
			
			if (this.reminderEnabled) {
				uni.showToast({
					title: '已开启提醒',
					icon: 'success'
				});
			} else {
				uni.showToast({
					title: '已关闭提醒',
					icon: 'none'
				});
			}
		},
		
		// 显示时间选择器
		showTimePicker() {
			this.showTimePickerModal = true;
			uni.vibrateShort({ type: 'light' });
		},
		
		// 隐藏时间选择器
		hideTimePicker() {
			this.showTimePickerModal = false;
			uni.vibrateShort({ type: 'light' });
		},
		
		// 时间变化
		onTimeChange(e) {
			this.pickerValue = e.detail.value;
		},
		
		// 确认时间选择
		confirmTime() {
			const hour = this.hours[this.pickerValue[0]];
			const minute = this.minutes[this.pickerValue[1]];
			this.reminderTime = `${hour}:${minute}`;
			this.saveSettings();
			this.hideTimePicker();
			
			uni.showToast({
				title: `已设置为 ${this.reminderTime}`,
				icon: 'success'
			});
			
			uni.vibrateShort({ type: 'medium' });
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
				'content': '😌 满足',
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
						
						// 保留设置
						this.saveSettings();
						
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

/* 时间选择器遮罩 */
.picker-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: flex-end;
	z-index: 9999;
	animation: fade-in 0.3s;
}

.picker-container {
	width: 100%;
	background-color: #FFFFFF;
	border-radius: 24rpx 24rpx 0 0;
	animation: slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.picker-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx 32rpx;
	border-bottom: 1px solid #F3F4F6;
}

.picker-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #111827;
}

.picker-cancel,
.picker-confirm {
	font-size: 28rpx;
	padding: 8rpx 16rpx;
}

.picker-cancel {
	color: #6B7280;
}

.picker-confirm {
	color: #000000;
	font-weight: 600;
}

.picker-view {
	height: 400rpx;
}

.picker-item {
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
	color: #111827;
}

/* 动画 */
@keyframes fade-in {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

@keyframes slide-up {
	from {
		transform: translateY(100%);
	}
	to {
		transform: translateY(0);
	}
}
</style>
