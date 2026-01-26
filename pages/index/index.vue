<template>
	<view class="container">
		<!-- 顶部问候区 -->
		<view class="greeting-section">
			<view class="greeting-header">
				<text class="greeting-text">{{ greetingText }}</text>
				<!-- 未登录提示 -->
				<view v-if="!isLoggedIn" class="login-tip" @click="goToLogin">
					<text class="login-tip-text">登录</text>
				</view>
			</view>
			<view class="quote-card">
				<text class="quote-text">{{ currentQuote }}</text>
			</view>
		</view>

		<!-- 打卡状态展示区 -->
		<view class="checkin-status">
			<view v-if="todayCheckin" class="status-card checked">
				<text class="status-title">今日已打卡 ✨</text>
				<view class="status-detail">
					<text class="time-text">{{ formatTime(todayCheckin.time) }}</text>
					<text class="mood-emoji">{{ getMoodEmoji(todayCheckin.mood) }}</text>
				</view>
			</view>
			<view v-else class="status-card unchecked">
				<text class="status-title">今天还没打卡哦～</text>
				<text class="status-subtitle">选择你的心情开始记录</text>
			</view>
		</view>

		<!-- 心情选择区 -->
		<view class="mood-section">
			<view class="mood-grid">
				<view 
					v-for="mood in moodList" 
					:key="mood.id"
					class="mood-card"
					:class="{ 
						disabled: todayCheckin,
						'mood-pulse': selectedMood === mood.id && isAnimating
					}"
					@click="handleMoodClick(mood.id)"
				>
					<text class="mood-emoji">{{ mood.emoji }}</text>
					<text class="mood-label">{{ mood.label }}</text>
				</view>
			</view>
		</view>
		
		<!-- 打卡成功动画 -->
		<view v-if="showSuccessAnimation" class="success-overlay" @click="hideSuccessAnimation">
			<view class="success-content">
				<view class="success-icon">✨</view>
				<text class="success-text">打卡成功！</text>
				<view class="success-emoji">{{ getMoodEmoji(selectedMood) }}</view>
			</view>
		</view>
		
		<!-- 登录引导弹窗 -->
		<view v-if="showLoginGuide" class="login-guide-modal">
			<view class="guide-overlay" @click="closeLoginGuide"></view>
			<view class="guide-content">
				<view class="guide-icon">🎉</view>
				<text class="guide-title">体验不错吧？</text>
				<text class="guide-text">登录后可以：</text>
				<view class="guide-features">
					<text class="feature-item">📊 查看打卡统计</text>
					<text class="feature-item">🏆 解锁专属成就</text>
					<text class="feature-item">☁️ 云端同步数据</text>
				</view>
				<view class="guide-buttons">
					<button class="guide-btn secondary" @click="closeLoginGuide">稍后再说</button>
					<button class="guide-btn primary" @click="goToLogin">立即登录</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			todayCheckin: null, // 今日打卡记录
			currentQuote: '',
			greetingText: '',
			selectedMood: '',
			isAnimating: false,
			showSuccessAnimation: false,
			isLoggedIn: false, // 登录状态
			showLoginGuide: false, // 显示登录引导
			checkinCount: 0, // 打卡次数
			moodList: [
				{ id: 'happy', emoji: '😊', label: '高兴' },
				{ id: 'content', emoji: '😌', label: '满足' },
				{ id: 'sad', emoji: '😢', label: '难过' },
				{ id: 'tired', emoji: '😴', label: '疲惫' },
				{ id: 'angry', emoji: '😠', label: '愤怒' },
				{ id: 'worried', emoji: '😰', label: '担忧' }
			],
			sleepQuotes: [
				"星星都困得眨眼了，你也该休息啦～✨",
				"大脑需要重启，身体需要充电🔋",
				"早睡是给明天最好的礼物🎁",
				"月亮说：该交班给梦境了🌙",
				"好好睡一觉，醒来就是全新的自己💫",
				"别让今天的烦恼偷走明天的精力😴",
				"放下手机，拥抱枕头吧🛏️",
				"深夜不值得你熬，明天才值得你等🌃",
				"睡眠是最简单的自我修复💙",
				"晚安，世界。晚安，更好的自己🌟",
				"闭上眼睛，让身体自己去旅行✨",
				"今天已经很努力了，该奖励自己一个好梦🎈",
				"黑夜是用来休息的，不是用来焦虑的🌌",
				"规律作息，是对自己最温柔的爱💝",
				"每一次准时入睡，都是在投资未来的自己📈"
			]
		}
	},
	onLoad() {
		this.initPage();
	},
	onShow() {
		// 每次显示页面时检查登录状态
		this.checkLoginStatus();
	},
	methods: {
		// 检查登录状态
		checkLoginStatus() {
			const userInfo = uni.getStorageSync('userInfo');
			this.isLoggedIn = !!userInfo;
		},
		
		// 初始化页面
		initPage() {
			this.checkLoginStatus();
			this.setGreeting();
			this.setRandomQuote();
			this.checkTodayCheckin();
		},
		
		// 设置问候语
		setGreeting() {
			const hour = new Date().getHours();
			if (hour < 6) {
				this.greetingText = '深夜了，该休息啦';
			} else if (hour < 12) {
				this.greetingText = '早上好';
			} else if (hour < 18) {
				this.greetingText = '下午好';
			} else {
				this.greetingText = '晚上好';
			}
		},
		
		// 设置随机语录
		setRandomQuote() {
			const randomIndex = Math.floor(Math.random() * this.sleepQuotes.length);
			this.currentQuote = this.sleepQuotes[randomIndex];
		},
		
		// 检查今日是否已打卡
		checkTodayCheckin() {
			// 从本地存储获取今日打卡记录
			const today = this.getTodayDate();
			const checkinData = uni.getStorageSync('checkin_' + today);
			if (checkinData) {
				this.todayCheckin = JSON.parse(checkinData);
			}
		},
		
		// 获取今日日期字符串
		getTodayDate() {
			const date = new Date();
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			return `${year}-${month}-${day}`;
		},
		
		// 处理心情选择
		handleMoodClick(moodId) {
			if (this.todayCheckin) {
				uni.showToast({
					title: '今日已打卡',
					icon: 'none'
				});
				return;
			}
			
			// 触觉反馈
			uni.vibrateShort({
				type: 'light'
			});
			
			// 设置选中状态和动画
			this.selectedMood = moodId;
			this.isAnimating = true;
			
			// 动画延迟后执行打卡
			setTimeout(() => {
				this.performCheckin(moodId);
			}, 300);
		},
		
		// 执行打卡
		performCheckin(moodId) {
			// 保存打卡记录
			const checkinRecord = {
				mood: moodId,
				time: new Date().getTime(),
				date: this.getTodayDate()
			};
			
			// 保存到本地存储
			uni.setStorageSync('checkin_' + checkinRecord.date, JSON.stringify(checkinRecord));
			
			this.todayCheckin = checkinRecord;
			
			// 显示成功动画
			this.showSuccessAnimation = true;
			
			// 震动反馈
			uni.vibrateLong();
			
			// 2秒后隐藏动画
			setTimeout(() => {
				this.showSuccessAnimation = false;
				this.isAnimating = false;
				
				// 检查是否需要显示登录引导
				this.checkShowLoginGuide();
			}, 2000);
			
			// 检查成就解锁
			this.checkNewAchievements();
		},
		
		// 检查是否显示登录引导
		checkShowLoginGuide() {
			// 如果已登录，不显示
			if (this.isLoggedIn) {
				return;
			}
			
			// 检查是否已经显示过引导
			const hasShownGuide = uni.getStorageSync('hasShownLoginGuide');
			if (hasShownGuide) {
				return;
			}
			
			// 统计打卡次数
			let checkinCount = 0;
			const keys = uni.getStorageInfoSync().keys;
			keys.forEach(key => {
				if (key.startsWith('checkin_')) {
					checkinCount++;
				}
			});
			
			// 打卡2次后显示登录引导
			if (checkinCount >= 2) {
				this.showLoginGuide = true;
				uni.setStorageSync('hasShownLoginGuide', true);
			}
		},
		
		// 关闭登录引导
		closeLoginGuide() {
			this.showLoginGuide = false;
			uni.vibrateShort({ type: 'light' });
		},
		
		// 跳转到登录页
		goToLogin() {
			uni.navigateTo({
				url: '/pages/login/login'
			});
		},
		
		// 隐藏成功动画
		hideSuccessAnimation() {
			this.showSuccessAnimation = false;
			this.isAnimating = false;
		},
		
		// 重置今日打卡（测试用）
		resetTodayCheckin() {
			uni.showModal({
				title: '重置打卡',
				content: '确定要删除今日打卡记录吗？此操作仅用于测试。',
				success: (res) => {
					if (res.confirm) {
						// 删除本地存储中今天的打卡记录
						const today = this.getTodayDate();
						uni.removeStorageSync('checkin_' + today);
						
						// 重新加载数据
						this.loadTodayCheckin();
						
						uni.showToast({
							title: '已重置',
							icon: 'success'
						});
						
						uni.vibrateShort({ type: 'light' });
					}
				}
			});
		},
		
		// 检查新解锁的成就
		checkNewAchievements() {
			// 延迟执行，确保数据保存完成
			setTimeout(() => {
				const { getAllCheckins, getAchievements, saveAchievements } = require('@/utils/storage.js');
				const { checkAchievements, getAchievementConfig } = require('@/utils/achievement.js');
				
				const allCheckins = getAllCheckins();
				const unlockedAchievements = getAchievements();
				const unlockedIds = unlockedAchievements.map(a => a.id);
				
				const newAchievements = checkAchievements(allCheckins, unlockedIds);
				
				if (newAchievements.length > 0) {
					// 保存新解锁的成就
					const now = Date.now();
					newAchievements.forEach(achievementId => {
						unlockedAchievements.push({
							id: achievementId,
							unlockedAt: now
						});
					});
					saveAchievements(unlockedAchievements);
					
					// 显示解锁提示
					this.showAchievementUnlock(newAchievements);
				}
			}, 500);
		},
		
		// 显示成就解锁提示
		showAchievementUnlock(achievementIds) {
			const { getAchievementConfig } = require('@/utils/achievement.js');
			
			achievementIds.forEach((id, index) => {
				setTimeout(() => {
					const config = getAchievementConfig(id);
					if (config) {
						// 震动反馈
						uni.vibrateLong();
						
						// 显示弹窗
						uni.showModal({
							title: '🎉 恭喜解锁新成就',
							content: `${config.icon} ${config.name}\n\n${config.description}`,
							showCancel: false,
							confirmText: '太棒了！',
							confirmColor: '#000000',
							success: (res) => {
								if (res.confirm) {
									// 再次短震动反馈
									uni.vibrateShort({
										type: 'medium'
									});
								}
							}
						});
					}
				}, 2500 + index * 2500); // 成功动画2秒后开始，多个成就间隔2.5秒
			});
		},
		
		// 格式化时间显示
		formatTime(timestamp) {
			const date = new Date(timestamp);
			const hours = String(date.getHours()).padStart(2, '0');
			const minutes = String(date.getMinutes()).padStart(2, '0');
			return `${hours}:${minutes}`;
		},
		
		// 获取心情表情
		getMoodEmoji(moodId) {
			const mood = this.moodList.find(m => m.id === moodId);
			return mood ? mood.emoji : '😊';
		}
	}
}
</script>

<style>
.container {
	min-height: 100vh;
	background-color: #ffffff;
	padding: 80rpx 32rpx 40rpx;
}

/* 问候区域 */
.greeting-section {
	margin-bottom: 60rpx;
}

.greeting-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24rpx;
}

.greeting-text {
	font-size: 56rpx;
	font-weight: bold;
	color: #111827;
}

.reset-btn {
	width: 64rpx;
	height: 64rpx;
	border-radius: 32rpx;
	background-color: #f5f5f5;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s;
}

.reset-btn:active {
	transform: scale(0.9);
	background-color: #e8e8e8;
}

.reset-icon {
	font-size: 32rpx;
}

.quote-card {
	background-color: #F3F4F6;
	padding: 32rpx;
	border-radius: 24rpx;
}

.quote-text {
	font-size: 28rpx;
	color: #6B7280;
	line-height: 1.6;
}

/* 打卡状态区 */
.checkin-status {
	margin-bottom: 60rpx;
}

.status-card {
	padding: 48rpx 32rpx;
	border-radius: 24rpx;
	text-align: center;
}

.status-card.checked {
	background-color: #000000;
}

.status-card.unchecked {
	background-color: #F3F4F6;
}

.status-title {
	display: block;
	font-size: 36rpx;
	font-weight: 600;
	margin-bottom: 16rpx;
}

.status-card.checked .status-title {
	color: #ffffff;
}

.status-card.unchecked .status-title {
	color: #111827;
}

.status-subtitle {
	display: block;
	font-size: 28rpx;
	color: #6B7280;
}

.status-detail {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 24rpx;
}

.time-text {
	font-size: 48rpx;
	font-weight: bold;
	color: #ffffff;
}

.mood-emoji {
	font-size: 64rpx;
}

/* 心情选择区 */
.mood-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 24rpx;
}

.mood-card {
	background-color: #ffffff;
	border: 2rpx solid #F3F4F6;
	border-radius: 24rpx;
	padding: 32rpx 16rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12rpx;
	transition: all 0.3s ease;
	position: relative;
	overflow: hidden;
}

.mood-card:active {
	background-color: #F3F4F6;
	transform: scale(0.95);
}

.mood-card.disabled {
	opacity: 0.4;
	pointer-events: none;
}

/* 脉冲动画 */
.mood-card.mood-pulse {
	animation: pulse 0.6s ease-in-out;
	background-color: #000000;
}

.mood-card.mood-pulse .mood-emoji {
	animation: emoji-bounce 0.6s ease-in-out;
}

.mood-card.mood-pulse .mood-label {
	color: #ffffff;
}

@keyframes pulse {
	0% {
		transform: scale(1);
		box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.7);
	}
	50% {
		transform: scale(1.05);
		box-shadow: 0 0 0 20rpx rgba(0, 0, 0, 0);
	}
	100% {
		transform: scale(1);
		box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
	}
}

@keyframes emoji-bounce {
	0%, 100% {
		transform: translateY(0) scale(1);
	}
	25% {
		transform: translateY(-10rpx) scale(1.2);
	}
	50% {
		transform: translateY(0) scale(1.1);
	}
	75% {
		transform: translateY(-5rpx) scale(1.15);
	}
}

.mood-card .mood-emoji {
	font-size: 56rpx;
	transition: transform 0.3s ease;
}

.mood-label {
	font-size: 28rpx;
	color: #111827;
	font-weight: 500;
	transition: color 0.3s ease;
}

/* 成功动画覆盖层 */
.success-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.8);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	animation: fade-in 0.3s ease;
}

@keyframes fade-in {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

.success-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 32rpx;
	animation: success-pop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes success-pop {
	0% {
		transform: scale(0.3);
		opacity: 0;
	}
	50% {
		transform: scale(1.1);
	}
	100% {
		transform: scale(1);
		opacity: 1;
	}
}

.success-icon {
	font-size: 120rpx;
	animation: rotate-star 1s ease infinite;
}

@keyframes rotate-star {
	0%, 100% {
		transform: rotate(0deg);
	}
	25% {
		transform: rotate(-10deg);
	}
	75% {
		transform: rotate(10deg);
	}
}

.success-text {
	font-size: 48rpx;
	font-weight: bold;
	color: #ffffff;
	text-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
}

.success-emoji {
	font-size: 120rpx;
	animation: emoji-float 2s ease-in-out infinite;
}

@keyframes emoji-float {
	0%, 100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-20rpx);
	}
}

/* 登录提示按钮 */
.login-tip {
	background-color: rgba(255, 255, 255, 0.2);
	padding: 8rpx 24rpx;
	border-radius: 20rpx;
	backdrop-filter: blur(10rpx);
}

.login-tip-text {
	font-size: 24rpx;
	color: #ffffff;
	font-weight: 500;
}

/* 登录引导弹窗 */
.login-guide-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 9998;
	display: flex;
	align-items: center;
	justify-content: center;
}

.guide-overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.6);
}

.guide-content {
	position: relative;
	width: 600rpx;
	background-color: #ffffff;
	border-radius: 32rpx;
	padding: 48rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	animation: guide-show 0.4s ease-out;
}

@keyframes guide-show {
	from {
		opacity: 0;
		transform: translateY(40rpx) scale(0.9);
	}
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

.guide-icon {
	font-size: 120rpx;
	margin-bottom: 24rpx;
}

.guide-title {
	font-size: 40rpx;
	font-weight: bold;
	color: #111827;
	margin-bottom: 16rpx;
}

.guide-text {
	font-size: 28rpx;
	color: #6B7280;
	margin-bottom: 24rpx;
}

.guide-features {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 16rpx;
	margin-bottom: 40rpx;
}

.feature-item {
	font-size: 28rpx;
	color: #111827;
	line-height: 1.6;
	padding-left: 16rpx;
}

.guide-buttons {
	width: 100%;
	display: flex;
	gap: 16rpx;
}

.guide-btn {
	flex: 1;
	height: 88rpx;
	border-radius: 16rpx;
	border: none;
	font-size: 30rpx;
	font-weight: 600;
	display: flex;
	align-items: center;
	justify-content: center;
}

.guide-btn.secondary {
	background-color: #F3F4F6;
	color: #6B7280;
}

.guide-btn.primary {
	background-color: #000000;
	color: #ffffff;
}

.guide-btn:active {
	opacity: 0.8;
}
</style>
