<template>
	<view class="achievement-container">
		<!-- 头部统计 -->
		<view class="header-stats">
			<view class="unlock-info">
				<text class="unlock-count">{{ unlockedCount }}</text>
				<text class="total-count">/ {{ totalCount }}</text>
			</view>
			<text class="unlock-label">已解锁成就</text>
		</view>

		<!-- 成就网格 -->
		<view class="achievement-grid">
			<view 
				v-for="achievement in achievements" 
				:key="achievement.id"
				class="achievement-card"
				:class="{ unlocked: achievement.isUnlocked, locked: !achievement.isUnlocked }"
				@click="showAchievementDetail(achievement)"
			>
				<view class="achievement-icon">
					<text class="icon-emoji">{{ achievement.icon }}</text>
					<view v-if="achievement.isUnlocked" class="unlock-badge">✓</view>
				</view>
				<text class="achievement-name">{{ achievement.name }}</text>
				<text class="achievement-desc" v-if="achievement.isUnlocked">
					{{ formatUnlockTime(achievement.unlockedAt) }}
				</text>
				<text class="achievement-desc locked-desc" v-else>
					{{ achievement.requirement }}
				</text>
			</view>
		</view>

		<!-- 成就详情弹窗 -->
		<view v-if="showDetail" class="detail-modal" @click="closeDetail">
			<view class="detail-content" @click.stop>
				<view class="detail-icon">{{ selectedAchievement.icon }}</view>
				<text class="detail-name">{{ selectedAchievement.name }}</text>
				<text class="detail-description">{{ selectedAchievement.description }}</text>
				<view class="detail-divider"></view>
				<view class="detail-requirement">
					<text class="requirement-label">解锁条件</text>
					<text class="requirement-text">{{ selectedAchievement.requirement }}</text>
				</view>
				<view v-if="selectedAchievement.isUnlocked" class="detail-unlock-time">
					<text class="unlock-time-label">解锁时间</text>
					<text class="unlock-time-text">{{ formatFullTime(selectedAchievement.unlockedAt) }}</text>
				</view>
				<view class="detail-close" @click="closeDetail">
					<text class="close-btn">关闭</text>
				</view>
				<view v-if="selectedAchievement && selectedAchievement.isUnlocked" class="detail-share" @click="shareAchievement">
					<text class="share-btn">生成海报</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getAllCheckins, getAchievements } from '@/utils/storage.js';
import { ACHIEVEMENT_CONFIG, checkAchievements } from '@/utils/achievement.js';

export default {
	data() {
		return {
			achievements: [],
			unlockedCount: 0,
			totalCount: ACHIEVEMENT_CONFIG.length,
			showDetail: false,
			selectedAchievement: null
		}
	},
	onLoad() {
		this.checkLoginAndLoad();
	},
	onShow() {
		// 每次显示页面时刷新数据
		this.checkLoginAndLoad();
	},
	methods: {
		// 检查登录状态并加载
		checkLoginAndLoad() {
			const userInfo = uni.getStorageSync('userInfo');
			if (!userInfo) {
				// 未登录，显示引导
				uni.showModal({
					title: '成就功能需要登录',
					content: '登录后可以解锁专属成就，记录你的打卡里程碑。是否前往登录？',
					confirmText: '去登录',
					cancelText: '稍后再说',
					success: (res) => {
						if (res.confirm) {
							uni.navigateTo({
								url: '/pages/login/login'
							});
						} else {
							// 返回上一页
							uni.switchTab({
								url: '/pages/index/index'
							});
						}
					}
				});
				return;
			}
			this.loadAchievements();
		},
		
		// 加载成就数据
		loadAchievements() {
			const unlockedAchievements = getAchievements();
			
			this.achievements = ACHIEVEMENT_CONFIG.map(config => {
				const unlocked = unlockedAchievements.find(a => a.id === config.id);
				return {
					...config,
					isUnlocked: !!unlocked,
					unlockedAt: unlocked ? unlocked.unlockedAt : null
				};
			});
			
			this.unlockedCount = unlockedAchievements.length;
		},
		
		// 显示成就详情
		showAchievementDetail(achievement) {
			this.selectedAchievement = achievement;
			this.showDetail = true;
		},
		
		// 关闭详情
		closeDetail() {
			this.showDetail = false;
		},
		
		// 分享成就
		shareAchievement() {
			uni.vibrateShort({ type: 'medium' });
			
			// 跳转到分享页面
			uni.navigateTo({
				url: '/pages/share/share?type=achievement&count=' + this.unlockedCount
			});
		},
		
		// 格式化解锁时间（简短）
		formatUnlockTime(timestamp) {
			if (!timestamp) return '';
			const date = new Date(timestamp);
			const month = date.getMonth() + 1;
			const day = date.getDate();
			return `${month}月${day}日解锁`;
		},
		
		// 格式化完整时间
		formatFullTime(timestamp) {
			if (!timestamp) return '';
			const date = new Date(timestamp);
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const hours = String(date.getHours()).padStart(2, '0');
			const minutes = String(date.getMinutes()).padStart(2, '0');
			return `${year}年${month}月${day}日 ${hours}:${minutes}`;
		}
	}
}
</script>

<style>
.achievement-container {
	min-height: 100vh;
	background-color: #ffffff;
	padding: 32rpx;
}

/* 头部统计 */
.header-stats {
	text-align: center;
	margin-bottom: 48rpx;
	padding: 32rpx;
	background-color: #F3F4F6;
	border-radius: 24rpx;
}

.unlock-info {
	margin-bottom: 8rpx;
}

.unlock-count {
	font-size: 72rpx;
	font-weight: bold;
	color: #000000;
}

.total-count {
	font-size: 48rpx;
	color: #6B7280;
}

.unlock-label {
	font-size: 28rpx;
	color: #6B7280;
}

/* 成就网格 */
.achievement-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 24rpx;
}

.achievement-card {
	background-color: #F3F4F6;
	border-radius: 24rpx;
	padding: 24rpx 16rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	transition: all 0.3s;
}

.achievement-card.unlocked {
	background-color: #000000;
}

.achievement-card.locked {
	opacity: 0.5;
}

.achievement-card:active {
	transform: scale(0.95);
}

.achievement-icon {
	width: 96rpx;
	height: 96rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #ffffff;
	border-radius: 50%;
	margin-bottom: 16rpx;
	position: relative;
}

.achievement-card.unlocked .achievement-icon {
	background-color: #FCD34D;
}

.icon-emoji {
	font-size: 56rpx;
}

.unlock-badge {
	position: absolute;
	bottom: -4rpx;
	right: -4rpx;
	width: 36rpx;
	height: 36rpx;
	background-color: #10B981;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24rpx;
	color: #ffffff;
	border: 3rpx solid #ffffff;
}

.achievement-name {
	font-size: 26rpx;
	font-weight: 600;
	color: #111827;
	margin-bottom: 8rpx;
	text-align: center;
}

.achievement-card.unlocked .achievement-name {
	color: #ffffff;
}

.achievement-desc {
	font-size: 20rpx;
	color: #10B981;
	text-align: center;
	line-height: 1.4;
}

.locked-desc {
	color: #6B7280;
}

.achievement-card.unlocked .achievement-desc {
	color: #D1D5DB;
}

/* 详情弹窗 */
.detail-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.detail-content {
	background-color: #ffffff;
	border-radius: 32rpx;
	padding: 48rpx 32rpx;
	margin: 0 48rpx;
	width: 600rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.detail-icon {
	font-size: 120rpx;
	margin-bottom: 24rpx;
}

.detail-name {
	font-size: 40rpx;
	font-weight: bold;
	color: #111827;
	margin-bottom: 16rpx;
}

.detail-description {
	font-size: 28rpx;
	color: #6B7280;
	text-align: center;
	line-height: 1.6;
	margin-bottom: 32rpx;
}

.detail-divider {
	width: 100%;
	height: 2rpx;
	background-color: #F3F4F6;
	margin-bottom: 32rpx;
}

.detail-requirement,
.detail-unlock-time {
	width: 100%;
	margin-bottom: 24rpx;
}

.requirement-label,
.unlock-time-label {
	display: block;
	font-size: 24rpx;
	color: #6B7280;
	margin-bottom: 8rpx;
}

.requirement-text,
.unlock-time-text {
	display: block;
	font-size: 28rpx;
	color: #111827;
}

.detail-close {
	margin-top: 16rpx;
	width: 100%;
}

.detail-share {
	margin-top: 12rpx;
	width: 100%;
}

.close-btn {
	display: block;
	width: 100%;
	text-align: center;
	padding: 24rpx;
	background-color: #000000;
	color: #ffffff;
	border-radius: 16rpx;
	font-size: 28rpx;
	font-weight: 600;
}

.close-btn:active {
	opacity: 0.8;
}

.share-btn {
	display: block;
	width: 100%;
	text-align: center;
	padding: 24rpx;
	background-color: #3B82F6;
	color: #ffffff;
	border-radius: 16rpx;
	font-size: 28rpx;
	font-weight: 600;
}

.share-btn:active {
	opacity: 0.8;
}
</style>
