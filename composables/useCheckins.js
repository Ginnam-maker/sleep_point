// 打卡数据管理 Composable
import { ref, computed, readonly } from 'vue';
import { 
	saveCheckin as saveCheckinToStorage, 
	getCheckin as getCheckinFromStorage, 
	getAllCheckins as getAllCheckinsFromStorage 
} from '@/utils/storage.js';
import { getTodayDate, formatTime } from '@/utils/index.js';
import { calculateStreak } from '@/utils/achievement.js';

/**
 * 打卡数据管理 Composable
 * @param {Object} options - 配置选项
 * @param {Boolean} options.autoLoad - 是否自动加载（默认 false，由组件控制）
 * @param {Number} options.limitDays - 未登录用户限制天数（默认 null）
 */
export function useCheckins(options = {}) {
	const { 
		autoLoad = false, 
		limitDays = null 
	} = options;

	// ========== 响应式状态 ==========
	const checkins = ref([]);           // 所有打卡记录
	const todayCheckin = ref(null);     // 今日打卡
	const isLoading = ref(false);       // 加载状态
	const error = ref(null);            // 错误信息

	// ========== 计算属性 ==========
	const totalDays = computed(() => checkins.value.length);
	
	const streakDays = computed(() => {
		if (checkins.value.length === 0) return 0;
		return calculateStreak(checkins.value);
	});
	
	const todayDate = computed(() => getTodayDate());
	
	const hasTodayCheckin = computed(() => todayCheckin.value !== null);

	// ========== 核心方法 ==========
	
	/**
	 * 加载所有打卡记录
	 * @param {Boolean} applyLimit - 是否应用天数限制
	 */
	const loadCheckins = async (applyLimit = false) => {
		isLoading.value = true;
		error.value = null;
		
		try {
			let allCheckins = getAllCheckinsFromStorage();
			
			// 应用天数限制（未登录用户）
			if (applyLimit && limitDays) {
				const limitDate = new Date();
				limitDate.setDate(limitDate.getDate() - limitDays);
				const limitDateStr = formatDateString(limitDate);
				allCheckins = allCheckins.filter(c => c.date >= limitDateStr);
			}
			
			checkins.value = allCheckins;
			
			// 同时加载今日打卡
			await loadTodayCheckin();
			
			return true;
		} catch (err) {
			error.value = err.message;
			console.error('加载打卡记录失败:', err);
			return false;
		} finally {
			isLoading.value = false;
		}
	};

	/**
	 * 加载今日打卡记录
	 */
	const loadTodayCheckin = async () => {
		try {
			const checkin = getCheckinFromStorage(todayDate.value);
			todayCheckin.value = checkin;
			return checkin;
		} catch (err) {
			console.error('加载今日打卡失败:', err);
			return null;
		}
	};

	/**
	 * 保存打卡记录
	 * @param {String} moodId - 心情ID
	 * @param {String} date - 日期（可选，默认今天）
	 */
	const performCheckin = async (moodId, date = null) => {
		const checkinDate = date || todayDate.value;
		
		const checkinRecord = {
			mood: moodId,
			time: Date.now(),
			date: checkinDate
		};
		
		const success = saveCheckinToStorage(checkinDate, checkinRecord);
		
		if (success) {
			// 更新本地状态
			todayCheckin.value = checkinRecord;
			
			// 重新加载所有记录
			await loadCheckins();
			
			return checkinRecord;
		}
		
		throw new Error('保存打卡失败');
	};

	/**
	 * 修改打卡记录
	 * @param {String} date - 日期
	 * @param {String} newMoodId - 新心情ID
	 */
	const updateCheckin = async (date, newMoodId) => {
		const existingCheckin = checkins.value.find(c => c.date === date);
		
		if (!existingCheckin) {
			throw new Error('打卡记录不存在');
		}
		
		const updatedCheckin = {
			...existingCheckin,
			mood: newMoodId,
			isModified: true,
			modifiedAt: Date.now()
		};
		
		const success = saveCheckinToStorage(date, updatedCheckin);
		
		if (success) {
			await loadCheckins();
			return updatedCheckin;
		}
		
		throw new Error('修改打卡失败');
	};

	/**
	 * 删除打卡记录（测试用）
	 * @param {String} date - 日期
	 */
	const deleteCheckin = async (date) => {
		uni.removeStorageSync('checkin_' + date);
		await loadCheckins();
	};

	/**
	 * 获取某个日期的打卡记录
	 * @param {String} date - 日期
	 */
	const getCheckinByDate = (date) => {
		return checkins.value.find(c => c.date === date) || null;
	};

	/**
	 * 检查某个日期是否有打卡
	 * @param {String} date - 日期
	 */
	const hasCheckinOnDate = (date) => {
		return checkins.value.some(c => c.date === date);
	};

	/**
	 * 获取某个月份的打卡记录
	 * @param {Number} year - 年份
	 * @param {Number} month - 月份（1-12）
	 */
	const getMonthCheckins = (year, month) => {
		const monthStr = `${year}-${String(month).padStart(2, '0')}`;
		return checkins.value.filter(c => c.date.startsWith(monthStr));
	};

	/**
	 * 格式化日期字符串
	 */
	const formatDateString = (date) => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	/**
	 * 格式化打卡时间显示
	 */
	const formatCheckinTime = (timestamp) => {
		return formatTime(timestamp);
	};

	// ========== 返回接口 ==========
	return {
		// 状态
		checkins: readonly(checkins),
		todayCheckin: readonly(todayCheckin),
		isLoading: readonly(isLoading),
		error: readonly(error),
		
		// 计算属性
		totalDays,
		streakDays,
		todayDate,
		hasTodayCheckin,
		
		// 方法
		loadCheckins,
		loadTodayCheckin,
		performCheckin,
		updateCheckin,
		deleteCheckin,
		getCheckinByDate,
		hasCheckinOnDate,
		getMonthCheckins,
		formatDateString,
		formatCheckinTime
	};
}
