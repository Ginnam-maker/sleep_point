// 本地存储管理

const STORAGE_KEYS = {
	CHECKIN_PREFIX: 'checkin_',
	USER_INFO: 'userInfo',
	ACHIEVEMENTS: 'achievements',
	SETTINGS: 'settings'
};

/**
 * 保存打卡记录
 */
export function saveCheckin(date, checkinData) {
	try {
		uni.setStorageSync(STORAGE_KEYS.CHECKIN_PREFIX + date, JSON.stringify(checkinData));
		return true;
	} catch (e) {
		console.error('保存打卡记录失败:', e);
		return false;
	}
}

/**
 * 获取打卡记录
 */
export function getCheckin(date) {
	try {
		const data = uni.getStorageSync(STORAGE_KEYS.CHECKIN_PREFIX + date);
		return data ? JSON.parse(data) : null;
	} catch (e) {
		console.error('获取打卡记录失败:', e);
		return null;
	}
}

/**
 * 获取所有打卡记录
 */
export function getAllCheckins() {
	try {
		const res = uni.getStorageInfoSync();
		const checkins = [];
		res.keys.forEach(key => {
			if (key.startsWith(STORAGE_KEYS.CHECKIN_PREFIX)) {
				const data = uni.getStorageSync(key);
				if (data) {
					checkins.push(JSON.parse(data));
				}
			}
		});
		return checkins.sort((a, b) => new Date(b.date) - new Date(a.date));
	} catch (e) {
		console.error('获取所有打卡记录失败:', e);
		return [];
	}
}

/**
 * 保存用户信息
 */
export function saveUserInfo(userInfo) {
	try {
		uni.setStorageSync(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
		return true;
	} catch (e) {
		console.error('保存用户信息失败:', e);
		return false;
	}
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
	try {
		const data = uni.getStorageSync(STORAGE_KEYS.USER_INFO);
		return data ? JSON.parse(data) : null;
	} catch (e) {
		console.error('获取用户信息失败:', e);
		return null;
	}
}

/**
 * 保存成就数据
 */
export function saveAchievements(achievements) {
	try {
		uni.setStorageSync(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
		return true;
	} catch (e) {
		console.error('保存成就数据失败:', e);
		return false;
	}
}

/**
 * 获取成就数据
 */
export function getAchievements() {
	try {
		const data = uni.getStorageSync(STORAGE_KEYS.ACHIEVEMENTS);
		return data ? JSON.parse(data) : [];
	} catch (e) {
		console.error('获取成就数据失败:', e);
		return [];
	}
}

/**
 * 保存设置
 */
export function saveSettings(settings) {
	try {
		uni.setStorageSync(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
		return true;
	} catch (e) {
		console.error('保存设置失败:', e);
		return false;
	}
}

/**
 * 获取设置
 */
export function getSettings() {
	try {
		const data = uni.getStorageSync(STORAGE_KEYS.SETTINGS);
		return data ? JSON.parse(data) : {};
	} catch (e) {
		console.error('获取设置失败:', e);
		return {};
	}
}
