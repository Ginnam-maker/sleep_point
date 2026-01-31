/**
 * 日历逻辑 Composable
 * 负责日历数据的计算和状态管理
 */

import { ref, readonly } from 'vue';
import { getMoodConfig } from '@/utils/index.js';

/**
 * 使用日历
 * @param {Object} options - 配置选项
 * @param {Object} options.checkinsComposable - useCheckins composable 实例（必需）
 * @param {Number} options.year - 年份（可选，默认当前年）
 * @param {Number} options.month - 月份（可选，默认当前月，0-11）
 */
export function useCalendar(options = {}) {
	const { checkinsComposable } = options;
	
	if (!checkinsComposable) {
		throw new Error('useCalendar requires checkinsComposable parameter');
	}
	
	// ========== 响应式状态 ==========
	const currentMonth = ref('');
	const currentYear = ref(0);
	const currentMonthNum = ref(0);
	const monthDays = ref(31);
	const monthStartDay = ref(0);
	
	// 星期标题（常量）
	const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
	
	// ========== 初始化方法 ==========
	/**
	 * 初始化日历
	 * @param {Number} year - 年份（可选）
	 * @param {Number} month - 月份 0-11（可选）
	 */
	const initCalendar = (year, month) => {
		const now = new Date();
		const targetYear = year !== undefined ? year : now.getFullYear();
		const targetMonth = month !== undefined ? month : now.getMonth();
		
		currentYear.value = targetYear;
		currentMonthNum.value = targetMonth;
		currentMonth.value = `${targetYear}年${targetMonth + 1}月`;
		
		// 获取本月第一天是星期几
		const firstDay = new Date(targetYear, targetMonth, 1);
		monthStartDay.value = firstDay.getDay();
		
		// 获取本月天数
		const lastDay = new Date(targetYear, targetMonth + 1, 0);
		monthDays.value = lastDay.getDate();
	};
	
	// ========== 日期判断方法 ==========
	/**
	 * 判断某天是否是今天
	 * @param {Number} day - 日期（1-31）
	 * @returns {Boolean}
	 */
	const isToday = (day) => {
		const now = new Date();
		return now.getFullYear() === currentYear.value &&
			   now.getMonth() === currentMonthNum.value &&
			   now.getDate() === day;
	};
	
	/**
	 * 判断某天是否有打卡
	 * @param {Number} day - 日期（1-31）
	 * @returns {Boolean}
	 */
	const hasCheckin = (day) => {
		const dateStr = getDateString(day);
		return checkinsComposable.hasCheckinOnDate(dateStr);
	};
	
	/**
	 * 获取某天的心情表情
	 * @param {Number} day - 日期（1-31）
	 * @returns {String} 心情表情
	 */
	const getMoodEmoji = (day) => {
		const dateStr = getDateString(day);
		const checkin = checkinsComposable.getCheckinByDate(dateStr);
		
		if (!checkin) return '';
		
		const config = getMoodConfig(checkin.mood);
		return config.emoji;
	};
	
	// ========== 工具方法 ==========
	/**
	 * 获取格式化的日期字符串
	 * @param {Number} day - 日期（1-31）
	 * @returns {String} 格式：YYYY-MM-DD
	 */
	const getDateString = (day) => {
		const year = currentYear.value;
		const month = String(currentMonthNum.value + 1).padStart(2, '0');
		const dayStr = String(day).padStart(2, '0');
		return `${year}-${month}-${dayStr}`;
	};
	
	/**
	 * 切换月份
	 * @param {Number} year - 年份
	 * @param {Number} month - 月份（0-11）
	 */
	const changeMonth = (year, month) => {
		initCalendar(year, month);
	};
	
	// 默认初始化为当前月份
	initCalendar();
	
	// ========== 返回接口 ==========
	return {
		// 响应式状态（只读）
		currentMonth: readonly(currentMonth),
		currentYear: readonly(currentYear),
		currentMonthNum: readonly(currentMonthNum),
		monthDays: readonly(monthDays),
		monthStartDay: readonly(monthStartDay),
		weekdays,
		
		// 方法
		initCalendar,
		isToday,
		hasCheckin,
		getMoodEmoji,
		getDateString,
		changeMonth
	};
}
