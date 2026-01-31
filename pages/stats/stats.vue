<template>
	<view class="stats-container">
		<!-- 核心指标卡片 -->
		<view class="metrics-section">
			<view class="metric-card primary">
				<view class="metric-icon">🔥</view>
				<view class="metric-info">
					<text class="metric-value">{{ streakDays }}</text>
					<text class="metric-label">连续打卡</text>
				</view>
			</view>
			
			<view class="metric-card">
				<view class="metric-icon">📅</view>
				<view class="metric-info">
					<text class="metric-value">{{ totalDays }}</text>
					<text class="metric-label">累计天数</text>
				</view>
			</view>
		</view>

		<!-- 本月打卡日历 -->
		<view class="calendar-section">
			<view class="section-header">
				<text class="section-title">本月打卡</text>
				<text class="month-text">{{ currentMonth }}</text>
			</view>
			
			<view class="calendar-grid">
				<!-- 星期标题 -->
				<view class="weekday-row">
					<text class="weekday" v-for="day in weekdays" :key="day">{{ day }}</text>
				</view>
				
				<!-- 日期格子 -->
				<view class="date-row">
					<!-- 月初空白占位 -->
					<view class="date-cell empty" v-for="n in monthStartDay" :key="'empty-' + n"></view>
					
					<!-- 日期 -->
					<view 
						v-for="day in monthDays" 
						:key="day"
						class="date-cell"
						:class="{ 
							today: isToday(day),
							checked: hasCheckin(day)
						}"
						@click="handleDateClick(day)"
					>
						<text class="date-number">{{ day }}</text>
						<text v-if="hasCheckin(day)" class="mood-emoji">{{ getMoodEmoji(day) }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 打卡详情弹窗 -->
		<view v-if="showDetail" class="detail-modal" @click="closeDetail">
			<view class="detail-content" @click.stop>
				<view class="detail-header">
					<text class="detail-date">{{ detailInfo.dateText }}</text>
				</view>
				<view class="detail-emoji">{{ detailInfo.emoji }}</view>
				<text class="detail-mood-name">{{ detailInfo.moodName }}</text>
				<view class="detail-time">
					<text class="time-label">打卡时间</text>
					<text class="time-value">{{ detailInfo.timeText }}</text>
				</view>
				<view class="detail-actions">
					<view class="action-btn secondary" @click="editCheckin">
						<text class="btn-text">修改心情</text>
					</view>
					<view class="action-btn" @click="closeDetail">
						<text class="btn-text">关闭</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 修改心情弹窗 -->
		<view v-if="showEditModal" class="detail-modal" @click="closeEditModal">
			<view class="edit-content" @click.stop>
				<text class="edit-title">修改心情</text>
				<text class="edit-subtitle">{{ detailInfo.dateText }}</text>
				
				<view class="mood-grid-edit">
					<view 
						v-for="mood in moodList" 
						:key="mood.id"
						class="mood-card-edit"
						:class="{ selected: selectedEditMood === mood.id }"
						@click="selectEditMood(mood.id)"
					>
						<text class="mood-emoji-edit">{{ mood.emoji }}</text>
						<text class="mood-label-edit">{{ mood.label }}</text>
					</view>
				</view>
				
				<view class="edit-actions">
					<view class="action-btn secondary" @click="closeEditModal">
						<text class="btn-text">取消</text>
					</view>
					<view class="action-btn" @click="confirmEdit">
						<text class="btn-text">确认修改</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { ref, computed } from 'vue';
import { useCheckins } from '@/composables';
import { useAuth } from '@/composables';
import { getMoodConfig, MOOD_CONFIG } from '@/utils/index.js';

export default {
	setup() {
		// ========== 使用 Composables ==========
		const { isLoggedIn } = useAuth();
		const { 
			checkins, 
			streakDays, 
			totalDays, 
			loadCheckins,
			hasCheckinOnDate,
			getCheckinByDate,
			updateCheckin,
			formatDateString
		} = useCheckins({ limitDays: 7 });

		// ========== 页面特有状态 ==========
		const currentMonth = ref('');
		const monthDays = ref(31);
		const monthStartDay = ref(0);
		const weekdays = ref(['日', '一', '二', '三', '四', '五', '六']);
		const showDetail = ref(false);
		const detailInfo = ref({});
		const showEditModal = ref(false);
		const selectedEditMood = ref('');
		const moodList = ref(MOOD_CONFIG);

		// ========== 初始化方法 ==========
		const loadData = async () => {
			// 检查登录状态，决定是否应用限制
			const shouldLimit = !isLoggedIn.value;
			await loadCheckins(shouldLimit);
			
			initCalendar();
			
			// 首次显示未登录提示
			if (shouldLimit) {
				const hasShownTip = uni.getStorageSync('hasShownStatsTip');
				if (!hasShownTip) {
					setTimeout(() => {
						uni.showModal({
							title: '试用模式限制',
							content: '当前为试用模式，仅显示最近7天数据。登录后可查看完整历史数据和更多统计功能。',
							confirmText: '去登录',
							cancelText: '稍后再说',
							success: (res) => {
								if (res.confirm) {
									uni.navigateTo({
										url: '/pages/login/login'
									});
								}
								uni.setStorageSync('hasShownStatsTip', true);
							}
						});
					}, 500);
				}
			}
		};

		// ========== 日历相关方法 ==========
		const initCalendar = () => {
			const now = new Date();
			const year = now.getFullYear();
			const month = now.getMonth();
			
			currentMonth.value = `${year}年${month + 1}月`;
			
			// 获取本月第一天是星期几
			const firstDay = new Date(year, month, 1);
			monthStartDay.value = firstDay.getDay();
			
			// 获取本月天数
			const lastDay = new Date(year, month + 1, 0);
			monthDays.value = lastDay.getDate();
		};
		
		// 判断是否是今天
		const isToday = (day) => {
			const now = new Date();
			return now.getDate() === day && 
				   now.getMonth() === new Date().getMonth();
		};
		
		// 判断某天是否有打卡
		const hasCheckin = (day) => {
			const now = new Date();
			const year = now.getFullYear();
			const month = String(now.getMonth() + 1).padStart(2, '0');
			const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
			
			return hasCheckinOnDate(dateStr);
		};
		
		// 获取某天的心情表情
		const getMoodEmoji = (day) => {
			const now = new Date();
			const year = now.getFullYear();
			const month = String(now.getMonth() + 1).padStart(2, '0');
			const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
			
			const checkin = getCheckinByDate(dateStr);
			if (!checkin) return '';
			
			const config = getMoodConfig(checkin.mood);
			return config.emoji;
		};

		// ========== 交互操作方法 ==========
		// 处理日期点击
		const handleDateClick = (day) => {
			const now = new Date();
			const year = now.getFullYear();
			const month = String(now.getMonth() + 1).padStart(2, '0');
			const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
			
			const checkin = getCheckinByDate(dateStr);
			
			if (!checkin) {
				// 未打卡日期
				uni.showToast({
					title: '该日期未打卡',
					icon: 'none'
				});
				return;
			}
			
			// 震动反馈
			uni.vibrateShort({
				type: 'light'
			});
			
			// 获取心情配置
			const moodConfig = getMoodConfig(checkin.mood);
			
			// 格式化日期和时间
			const dateObj = new Date(checkin.date);
			const timeObj = new Date(checkin.time);
			
			const dateText = `${year}年${parseInt(month)}月${day}日`;
			const hours = String(timeObj.getHours()).padStart(2, '0');
			const minutes = String(timeObj.getMinutes()).padStart(2, '0');
			const timeText = `${hours}:${minutes}`;
			
			// 设置详情信息
			detailInfo.value = {
				date: dateStr,
				dateText: dateText,
				emoji: moodConfig.emoji,
				moodName: moodConfig.label,
				timeText: timeText,
				checkin: checkin
			};
			
			showDetail.value = true;
		};
		
		// 关闭详情
		const closeDetail = () => {
			showDetail.value = false;
		};
		
		// 修改打卡
		const editCheckin = () => {
			// 获取当前心情
			selectedEditMood.value = detailInfo.value.checkin.mood;
			showEditModal.value = true;
			
			// 震动反馈
			uni.vibrateShort({
				type: 'light'
			});
		};
		
		// 选择编辑的心情
		const selectEditMood = (moodId) => {
			selectedEditMood.value = moodId;
			
			// 震动反馈
			uni.vibrateShort({
				type: 'light'
			});
		};
		
		// 关闭编辑弹窗
		const closeEditModal = () => {
			showEditModal.value = false;
		};
		
		// 确认修改
		const confirmEdit = async () => {
			if (!selectedEditMood.value) {
				uni.showToast({
					title: '请选择心情',
					icon: 'none'
				});
				return;
			}
			
			try {
				// 使用 composable 的更新方法
				await updateCheckin(detailInfo.value.date, selectedEditMood.value);
				
				// 震动反馈
				uni.vibrateLong();
				
				// 提示成功
				uni.showToast({
					title: '修改成功',
					icon: 'success'
				});
				
				// 关闭弹窗
				showEditModal.value = false;
				showDetail.value = false;
				
				// 重新加载数据
				setTimeout(() => {
					loadData();
				}, 500);
			} catch (err) {
				uni.showToast({
					title: '修改失败',
					icon: 'none'
				});
			}
		};

		// ========== 返回给模板使用 ==========
		return {
			// 来自 composables 的状态
			checkins,
			streakDays,
			totalDays,
			
			// 页面特有状态
			currentMonth,
			monthDays,
			monthStartDay,
			weekdays,
			showDetail,
			detailInfo,
			showEditModal,
			selectedEditMood,
			moodList,
			
			// 方法
			loadData,
			initCalendar,
			isToday,
			hasCheckin,
			getMoodEmoji,
			handleDateClick,
			closeDetail,
			editCheckin,
			selectEditMood,
			closeEditModal,
			confirmEdit
		};
	},
	
	onLoad() {
		this.loadData();
	},
	
	onShow() {
		// 每次显示页面时刷新数据
		this.loadData();
	}
}
</script>

<style>
.stats-container {
	min-height: 100vh;
	background-color: #ffffff;
	padding: 32rpx;
}

/* 核心指标 */
.metrics-section {
	display: flex;
	gap: 24rpx;
	margin-bottom: 48rpx;
}

.metric-card {
	flex: 1;
	background-color: #F3F4F6;
	border-radius: 24rpx;
	padding: 32rpx;
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.metric-card.primary {
	background-color: #000000;
	color: #ffffff;
}

.metric-icon {
	font-size: 56rpx;
}

.metric-info {
	display: flex;
	flex-direction: column;
}

.metric-value {
	font-size: 48rpx;
	font-weight: bold;
	color: #111827;
}

.metric-card.primary .metric-value {
	color: #ffffff;
}

.metric-label {
	font-size: 24rpx;
	color: #6B7280;
	margin-top: 4rpx;
}

.metric-card.primary .metric-label {
	color: #D1D5DB;
}

/* 区块标题 */
.calendar-section {
	margin-bottom: 48rpx;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24rpx;
}

.section-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #111827;
}

.month-text {
	font-size: 28rpx;
	color: #6B7280;
}

/* 日历 */
.calendar-grid {
	background-color: #F3F4F6;
	border-radius: 24rpx;
	padding: 24rpx;
}

.weekday-row {
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	margin-bottom: 16rpx;
}

.weekday {
	text-align: center;
	font-size: 24rpx;
	color: #6B7280;
	padding: 8rpx 0;
}

.date-row {
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: 8rpx;
}

.date-cell {
	aspect-ratio: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	border-radius: 12rpx;
	position: relative;
	transition: all 0.3s ease;
	cursor: pointer;
}

.date-cell.empty {
	background-color: transparent;
}

.date-cell.today {
	background-color: #ffffff;
	border: 2rpx solid #000000;
}

.date-cell.checked {
	background-color: #ffffff;
}

.date-cell.checked:active {
	transform: scale(0.9);
	background-color: #F3F4F6;
}

.date-number {
	font-size: 24rpx;
	color: #111827;
}

.mood-emoji {
	font-size: 32rpx;
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}

/* 详情弹窗 */
.detail-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
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

.detail-content {
	background-color: #ffffff;
	border-radius: 32rpx;
	padding: 48rpx 32rpx;
	margin: 0 48rpx;
	width: 560rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	animation: slide-up 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes slide-up {
	from {
		transform: translateY(100rpx);
		opacity: 0;
	}
	to {
		transform: translateY(0);
		opacity: 1;
	}
}

.detail-header {
	margin-bottom: 32rpx;
}

.detail-date {
	font-size: 32rpx;
	font-weight: bold;
	color: #111827;
}

.detail-emoji {
	font-size: 120rpx;
	margin-bottom: 24rpx;
	animation: emoji-bounce 0.6s ease;
}

@keyframes emoji-bounce {
	0%, 100% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.2);
	}
}

.detail-mood-name {
	font-size: 36rpx;
	font-weight: 600;
	color: #111827;
	margin-bottom: 32rpx;
}

.detail-time {
	width: 100%;
	background-color: #F3F4F6;
	border-radius: 16rpx;
	padding: 24rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 32rpx;
}

.time-label {
	font-size: 28rpx;
	color: #6B7280;
}

.time-value {
	font-size: 32rpx;
	font-weight: bold;
	color: #111827;
}

.detail-actions {
	width: 100%;
	display: flex;
	flex-direction: row;
	gap: 16rpx;
}

.action-btn {
	width: 100%;
	background-color: #000000;
	border-radius: 16rpx;
	padding: 24rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	transition: opacity 0.3s ease;
}

.action-btn.secondary {
	background-color: #F3F4F6;
}

.action-btn.secondary .btn-text {
	color: #111827;
}

.action-btn:active {
	opacity: 0.8;
}

.btn-text {
	font-size: 28rpx;
	font-weight: 600;
	color: #ffffff;
}

/* 修改弹窗 */
.edit-content {
	background-color: #ffffff;
	border-radius: 32rpx;
	padding: 48rpx 32rpx;
	margin: 0 48rpx;
	width: 600rpx;
	max-height: 80vh;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	align-items: center;
	animation: slide-up 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.edit-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #111827;
	margin-bottom: 8rpx;
}

.edit-subtitle {
	font-size: 28rpx;
	color: #6B7280;
	margin-bottom: 32rpx;
}

.mood-grid-edit {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 16rpx;
	width: 100%;
	margin-bottom: 32rpx;
}

.mood-card-edit {
	background-color: #F3F4F6;
	border: 2rpx solid #F3F4F6;
	border-radius: 16rpx;
	padding: 24rpx 12rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
	transition: all 0.3s ease;
}

.mood-card-edit:active {
	transform: scale(0.95);
}

.mood-card-edit.selected {
	background-color: #000000;
	border-color: #000000;
}

.mood-emoji-edit {
	font-size: 48rpx;
}

.mood-label-edit {
	font-size: 24rpx;
	color: #111827;
	font-weight: 500;
}

.mood-card-edit.selected .mood-label-edit {
	color: #ffffff;
}

.edit-actions {
	width: 100%;
	display: flex;
	gap: 16rpx;
}

.edit-actions .action-btn {
	flex: 1;
}
</style>
