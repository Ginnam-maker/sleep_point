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

		<!-- 心情统计 -->
		<view class="mood-section">
			<view class="section-header">
				<text class="section-title">心情分布</text>
			</view>
			
			<!-- 饼图 -->
			<!-- 暂时隐藏，待修复
			<view v-if="moodChartData.series.length > 0" class="chart-container">
				<qiun-ucharts 
					type="pie" 
					:opts="moodChartOpts" 
					:chartData="moodChartData"
					canvasId="moodPieChart"
					:cWidth="chartWidth"
					:cHeight="260"
				/>
			</view>
			-->
			
			<view class="mood-stats">
				<view 
					v-for="mood in moodStats" 
					:key="mood.id"
					class="mood-stat-item"
				>
					<text class="mood-emoji-large">{{ mood.emoji }}</text>
					<view class="mood-bar-container">
						<view class="mood-bar" :style="{ width: mood.percentage + '%', backgroundColor: mood.color }"></view>
					</view>
					<text class="mood-count">{{ mood.count }}次</text>
				</view>
			</view>
		</view>
		
		<!-- 睡眠趋势 - 暂时隐藏，待修复
		<view class="trend-section">
			<view class="section-header">
				<text class="section-title">入睡趋势</text>
				<text class="section-subtitle">最近7天</text>
			</view>
			
			<view v-if="trendChartData.series.length > 0" class="chart-container">
				<qiun-ucharts 
					type="line" 
					:opts="trendChartOpts" 
					:chartData="trendChartData"
					canvasId="trendLineChart"
					:cWidth="chartWidth"
					:cHeight="200"
				/>
			</view>
			<view v-else class="empty-chart">
				<text class="empty-text">暂无足够数据</text>
			</view>
		</view>
		-->
		
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
import { getAllCheckins, saveCheckin } from '@/utils/storage.js';
import { calculateStreak, getMoodConfig, MOOD_CONFIG } from '@/utils/index.js';
import qiunUcharts from '@/components/qiun-ucharts.vue';

export default {
	components: {
		qiunUcharts
	},
	data() {
		return {
			checkins: [],
			streakDays: 0,
			totalDays: 0,
			currentMonth: '',
			monthDays: 31,
			monthStartDay: 0,
			weekdays: ['日', '一', '二', '三', '四', '五', '六'],
			moodStats: [],
			showDetail: false,
			detailInfo: {},
			showEditModal: false,
			selectedEditMood: '',
			moodList: MOOD_CONFIG,
			// 图表宽度
			chartWidth: 300,
			// 图表数据
			moodChartData: {
				series: []
			},
			moodChartOpts: {
				color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'],
				padding: [5, 5, 5, 5],
				legend: {
					show: false
				},
				extra: {
					pie: {
						activeOpacity: 0.5,
						offsetAngle: 0,
						labelWidth: 15,
						border: true,
						borderWidth: 2,
						borderColor: '#FFFFFF'
					}
				}
			},
			trendChartData: {
				categories: [],
				series: []
			},
			trendChartOpts: {
				color: ['#000000'],
				padding: [15, 15, 0, 15],
				legend: {
					show: false
				},
				xAxis: {
					disableGrid: true,
					fontSize: 10
				},
				yAxis: {
					data: [
						{ min: 20, max: 26 }
					],
					fontSize: 10,
					format: (val) => val + ':00'
				},
				extra: {
					line: {
						type: 'curve',
						width: 2,
						activeType: 'hollow'
					}
				}
			}
		}
	},
	onLoad() {
		// 计算图表宽度
		const systemInfo = uni.getSystemInfoSync();
		this.chartWidth = systemInfo.windowWidth - 96; // 减去容器padding和margin
		
		this.loadData();
	},
	onShow() {
		// 每次显示页面时刷新数据
		this.loadData();
	},
	methods: {
		// 加载数据
		loadData() {
			const allCheckins = getAllCheckins();
			const userInfo = uni.getStorageSync('userInfo');
			
			// 未登录用户限制只能看7天数据
			if (!userInfo) {
				const sevenDaysAgo = new Date();
				sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
				const sevenDaysAgoStr = this.formatDate(sevenDaysAgo);
				
				this.checkins = allCheckins.filter(checkin => {
					return checkin.date >= sevenDaysAgoStr;
				});
				
				// 提示用户登录可查看完整数据
				if (allCheckins.length > this.checkins.length) {
					// 有超过7天的数据，显示提示
					this.showLoginTip();
				}
			} else {
				this.checkins = allCheckins;
			}
			
			this.calculateMetrics();
			this.initCalendar();
			this.calculateMoodStats();
			this.prepareMoodChartData();
			this.prepareTrendChartData();
		},
		
		// 显示登录提示
		showLoginTip() {
			// 检查是否已经显示过提示
			const hasShownTip = uni.getStorageSync('hasShownStatsTip');
			if (hasShownTip) return;
			
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
						// 标记已显示
						uni.setStorageSync('hasShownStatsTip', true);
					}
				});
			}, 500);
		},
		
		// 格式化日期为YYYY-MM-DD
		formatDate(date) {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			return `${year}-${month}-${day}`;
		},
		
		// 计算核心指标
		calculateMetrics() {
			this.totalDays = this.checkins.length;
			this.streakDays = this.calculateStreakDays();
		},
		
		// 计算连续打卡天数
		calculateStreakDays() {
			if (this.checkins.length === 0) return 0;
			
			let streak = 0;
			let currentDate = new Date();
			currentDate.setHours(0, 0, 0, 0);
			
			const sortedCheckins = [...this.checkins].sort((a, b) => {
				return new Date(b.date) - new Date(a.date);
			});
			
			for (let checkin of sortedCheckins) {
				const checkinDate = new Date(checkin.date);
				checkinDate.setHours(0, 0, 0, 0);
				
				const diffDays = Math.floor((currentDate - checkinDate) / (1000 * 60 * 60 * 24));
				
				if (diffDays === streak) {
					streak++;
					currentDate.setDate(currentDate.getDate() - 1);
				} else {
					break;
				}
			}
			
			return streak;
		},
		
		// 初始化日历
		initCalendar() {
			const now = new Date();
			const year = now.getFullYear();
			const month = now.getMonth();
			
			this.currentMonth = `${year}年${month + 1}月`;
			
			// 获取本月第一天是星期几
			const firstDay = new Date(year, month, 1);
			this.monthStartDay = firstDay.getDay();
			
			// 获取本月天数
			const lastDay = new Date(year, month + 1, 0);
			this.monthDays = lastDay.getDate();
		},
		
		// 判断是否是今天
		isToday(day) {
			const now = new Date();
			return now.getDate() === day && 
				   now.getMonth() === new Date().getMonth();
		},
		
		// 判断某天是否有打卡
		hasCheckin(day) {
			const now = new Date();
			const year = now.getFullYear();
			const month = String(now.getMonth() + 1).padStart(2, '0');
			const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
			
			return this.checkins.some(c => c.date === dateStr);
		},
		
		// 获取某天的心情表情
		getMoodEmoji(day) {
			const now = new Date();
			const year = now.getFullYear();
			const month = String(now.getMonth() + 1).padStart(2, '0');
			const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
			
			const checkin = this.checkins.find(c => c.date === dateStr);
			if (!checkin) return '';
			
			const config = getMoodConfig(checkin.mood);
			return config.emoji;
		},
		
		// 处理日期点击
		handleDateClick(day) {
			const now = new Date();
			const year = now.getFullYear();
			const month = String(now.getMonth() + 1).padStart(2, '0');
			const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
			
			const checkin = this.checkins.find(c => c.date === dateStr);
			
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
			this.detailInfo = {
				date: dateStr,
				dateText: dateText,
				emoji: moodConfig.emoji,
				moodName: moodConfig.label,
				timeText: timeText,
				checkin: checkin
			};
			
			this.showDetail = true;
		},
		
		// 关闭详情
		closeDetail() {
			this.showDetail = false;
		},
		
		// 修改打卡
		editCheckin() {
			// 获取当前心情
			this.selectedEditMood = this.detailInfo.checkin.mood;
			this.showEditModal = true;
			
			// 震动反馈
			uni.vibrateShort({
				type: 'light'
			});
		},
		
		// 选择编辑的心情
		selectEditMood(moodId) {
			this.selectedEditMood = moodId;
			
			// 震动反馈
			uni.vibrateShort({
				type: 'light'
			});
		},
		
		// 关闭编辑弹窗
		closeEditModal() {
			this.showEditModal = false;
		},
		
		// 确认修改
		confirmEdit() {
			if (!this.selectedEditMood) {
				uni.showToast({
					title: '请选择心情',
					icon: 'none'
				});
				return;
			}
			
			// 更新打卡记录
			const updatedCheckin = {
				...this.detailInfo.checkin,
				mood: this.selectedEditMood,
				isModified: true,
				modifiedAt: Date.now()
			};
			
			// 保存到本地存储
			saveCheckin(this.detailInfo.date, updatedCheckin);
			
			// 震动反馈
			uni.vibrateLong();
			
			// 提示成功
			uni.showToast({
				title: '修改成功',
				icon: 'success'
			});
			
			// 关闭弹窗
			this.showEditModal = false;
			this.showDetail = false;
			
			// 重新加载数据
			setTimeout(() => {
				this.loadData();
			}, 500);
		},
		
		// 计算心情统计
		calculateMoodStats() {
			const moodCount = {
				happy: 0,
				content: 0,
				sad: 0,
				tired: 0,
				angry: 0,
				worried: 0
			};
			
			this.checkins.forEach(checkin => {
				if (moodCount[checkin.mood] !== undefined) {
					moodCount[checkin.mood]++;
				}
			});
			
			const total = this.checkins.length || 1;
			
			this.moodStats = [
				{ id: 'happy', emoji: '😊', label: '高兴', count: moodCount.happy, color: '#FCD34D' },
				{ id: 'content', emoji: '😌', label: '满足', count: moodCount.content, color: '#A7F3D0' },
				{ id: 'sad', emoji: '😢', label: '难过', count: moodCount.sad, color: '#93C5FD' },
				{ id: 'tired', emoji: '😴', label: '疲惫', count: moodCount.tired, color: '#C4B5FD' },
				{ id: 'angry', emoji: '😠', label: '愤怒', count: moodCount.angry, color: '#FCA5A5' },
				{ id: 'worried', emoji: '😰', label: '担忧', count: moodCount.worried, color: '#D1D5DB' }
			].map(mood => ({
				...mood,
				percentage: (mood.count / total * 100).toFixed(1)
			})).filter(mood => mood.count > 0);
		},
		
		// 准备心情饼图数据
		prepareMoodChartData() {
			if (this.moodStats.length === 0) {
				this.moodChartData = { series: [] };
				return;
			}
			
			const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
			
			this.moodChartData = {
				series: [{
					data: this.moodStats.map((mood, index) => ({
						name: `${mood.emoji} ${mood.label}`,
						value: mood.count,
						color: colors[index % colors.length]
					}))
				}]
			};
		},
		
		// 准备睡眠趋势折线图数据
		prepareTrendChartData() {
			if (this.checkins.length === 0) {
				this.trendChartData = { categories: [], series: [] };
				return;
			}
			
			// 获取最近7天的打卡记录
			const sortedCheckins = [...this.checkins]
				.sort((a, b) => new Date(a.date) - new Date(b.date))
				.slice(-7);
			
			const categories = [];
			const data = [];
			
			sortedCheckins.forEach(checkin => {
				// 格式化日期为 MM/DD
				const date = new Date(checkin.date);
				const month = date.getMonth() + 1;
				const day = date.getDate();
				categories.push(`${month}/${day}`);
				
				// 将时间转换为小时数（如 22.5 表示 22:30）
				const time = new Date(checkin.time);
				const hours = time.getHours();
				const minutes = time.getMinutes();
				const hourValue = hours + minutes / 60;
				
				data.push(hourValue);
			});
			
			this.trendChartData = {
				categories: categories,
				series: [{
					name: '入睡时间',
					data: data
				}]
			};
		}
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
.calendar-section,
.mood-section {
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

/* 心情统计 */
.mood-stats {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.mood-stat-item {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.mood-emoji-large {
	font-size: 48rpx;
	width: 64rpx;
	text-align: center;
}

.mood-bar-container {
	flex: 1;
	height: 32rpx;
	background-color: #F3F4F6;
	border-radius: 16rpx;
	overflow: hidden;
}

.mood-bar {
	height: 100%;
	border-radius: 16rpx;
	transition: width 0.3s ease;
}

.mood-count {
	font-size: 28rpx;
	color: #6B7280;
	width: 80rpx;
	text-align: right;
}

/* 图表容器 */
.chart-container {
	background-color: #F9FAFB;
	border-radius: 24rpx;
	padding: 24rpx 8rpx;
	margin-top: 24rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	overflow: hidden;
}

.empty-chart {
	background-color: #F9FAFB;
	border-radius: 24rpx;
	padding: 80rpx 32rpx;
	margin-top: 24rpx;
	display: flex;
	justify-content: center;
	align-items: center;
}

.empty-text {
	font-size: 28rpx;
	color: #9CA3AF;
}

/* 睡眠趋势区 */
.trend-section {
	background-color: #ffffff;
	border-radius: 24rpx;
	padding: 32rpx 24rpx;
	margin-bottom: 32rpx;
}

.section-subtitle {
	font-size: 24rpx;
	color: #9CA3AF;
	margin-left: auto;
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
