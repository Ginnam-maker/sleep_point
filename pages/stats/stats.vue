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
import { useCheckins, useAuth, useCalendar } from '@/composables';
import { getMoodConfig, MOOD_CONFIG } from '@/utils/index.js';

export default {
	setup() {
		// ========== 使用 Composables ==========
		const { isLoggedIn } = useAuth();
		const checkinsComposable = useCheckins({ limitDays: 7 });
		const { 
			checkins, 
			streakDays, 
			totalDays, 
			loadCheckins,
			getCheckinByDate,
			updateCheckin
		} = checkinsComposable;
		
		// 使用日历 composable
		const {
			currentMonth,
			monthDays,
			monthStartDay,
			weekdays,
			isToday,
			hasCheckin,
			getMoodEmoji,
			getDateString,
			initCalendar
		} = useCalendar({ checkinsComposable });

		// ========== 页面特有状态 ==========
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

		// ========== 交互操作方法 ==========
		// 处理日期点击
		const handleDateClick = (day) => {
			const dateStr = getDateString(day);
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
			
			const dateText = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
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
			// 来自 useCheckins 的状态
			checkins,
			streakDays,
			totalDays,
			
			// 来自 useCalendar 的状态和方法
			currentMonth,
			monthDays,
			monthStartDay,
			weekdays,
			isToday,
			hasCheckin,
			getMoodEmoji,
			
			// 页面特有状态
			showDetail,
			detailInfo,
			showEditModal,
			selectedEditMood,
			moodList,
			
			// 方法
			loadData,
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

<style src="./stats.scss"></style>
