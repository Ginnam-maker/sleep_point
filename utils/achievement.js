// 成就配置和判定逻辑

/**
 * 成就配置列表
 */
export const ACHIEVEMENT_CONFIG = [
	{
		id: 'first_checkin',
		name: '初来乍到',
		description: '完成首次打卡',
		icon: '🎉',
		requirement: '首次打卡'
	},
	{
		id: 'streak_3',
		name: '连续坚持者',
		description: '连续打卡3天',
		icon: '🔥',
		requirement: '连续3天打卡'
	},
	{
		id: 'streak_7',
		name: '习惯养成者',
		description: '连续打卡7天',
		icon: '⭐',
		requirement: '连续7天打卡'
	},
	{
		id: 'streak_30',
		name: '睡眠守护者',
		description: '连续打卡30天',
		icon: '👑',
		requirement: '连续30天打卡'
	},
	{
		id: 'early_bird',
		name: '早睡先锋',
		description: '最近7天内任意5天在23:00前打卡',
		icon: '🌅',
		requirement: '最近7天内5天23:00前打卡'
	},
	{
		id: 'mood_collector',
		name: '心情记录官',
		description: '集齐全部6种心情',
		icon: '🎭',
		requirement: '记录全部6种心情'
	},
	{
		id: 'full_attendance',
		name: '全勤之星',
		description: '当月每天都打卡',
		icon: '💯',
		requirement: '当月全勤'
	},
	{
		id: 'persistence_100',
		name: '持之以恒',
		description: '累计打卡100天',
		icon: '💪',
		requirement: '累计100天打卡'
	},
	{
		id: 'night_explorer',
		name: '深夜探索者',
		description: '累计10次凌晨1点后打卡',
		icon: '🌙',
		requirement: '累计10次凌晨1点后打卡'
	}
];

/**
 * 计算连续打卡天数
 */
export function calculateStreak(checkins) {
	if (!checkins || checkins.length === 0) return 0;
	
	// 按日期排序（降序）
	const sortedCheckins = [...checkins].sort((a, b) => {
		return new Date(b.date) - new Date(a.date);
	});
	
	let streak = 0;
	let currentDate = new Date();
	currentDate.setHours(0, 0, 0, 0);
	
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
}

/**
 * 检查新解锁的成就
 */
export function checkAchievements(checkins, unlockedAchievements = []) {
	const newAchievements = [];
	
	// 首次打卡
	if (checkins.length === 1 && !unlockedAchievements.includes('first_checkin')) {
		newAchievements.push('first_checkin');
	}
	
	// 连续打卡成就
	const streak = calculateStreak(checkins);
	if (streak >= 3 && !unlockedAchievements.includes('streak_3')) {
		newAchievements.push('streak_3');
	}
	if (streak >= 7 && !unlockedAchievements.includes('streak_7')) {
		newAchievements.push('streak_7');
	}
	if (streak >= 30 && !unlockedAchievements.includes('streak_30')) {
		newAchievements.push('streak_30');
	}
	
	// 心情收集者
	const moods = new Set(checkins.map(c => c.mood));
	if (moods.size === 6 && !unlockedAchievements.includes('mood_collector')) {
		newAchievements.push('mood_collector');
	}
	
	// 累计打卡100天
	if (checkins.length >= 100 && !unlockedAchievements.includes('persistence_100')) {
		newAchievements.push('persistence_100');
	}
	
	// 深夜探索者（凌晨1点后打卡）
	const lateNightCheckins = checkins.filter(c => {
		const hour = new Date(c.time).getHours();
		return hour >= 1 && hour < 6;
	});
	if (lateNightCheckins.length >= 10 && !unlockedAchievements.includes('night_explorer')) {
		newAchievements.push('night_explorer');
	}
	
	// 早睡先锋
	const recentSevenDays = checkins.slice(0, 7);
	const earlyCheckins = recentSevenDays.filter(c => {
		const hour = new Date(c.time).getHours();
		return hour < 23;
	});
	if (earlyCheckins.length >= 5 && !unlockedAchievements.includes('early_bird')) {
		newAchievements.push('early_bird');
	}
	
	return newAchievements;
}

/**
 * 根据成就ID获取成就配置
 */
export function getAchievementConfig(achievementId) {
	return ACHIEVEMENT_CONFIG.find(a => a.id === achievementId);
}
