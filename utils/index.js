// 工具函数库

/**
 * 获取今日日期字符串 (YYYY-MM-DD)
 */
export function getTodayDate() {
	const date = new Date();
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * 格式化时间显示 (HH:MM)
 */
export function formatTime(timestamp) {
	const date = new Date(timestamp);
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	return `${hours}:${minutes}`;
}

/**
 * 获取问候语
 */
export function getGreeting() {
	const hour = new Date().getHours();
	if (hour < 6) {
		return '深夜了，该休息啦';
	} else if (hour < 12) {
		return '早上好';
	} else if (hour < 18) {
		return '下午好';
	} else {
		return '晚上好';
	}
}

/**
 * 随机获取助眠语录
 */
export function getRandomQuote() {
	const quotes = [
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
	];
	const randomIndex = Math.floor(Math.random() * quotes.length);
	return quotes[randomIndex];
}

/**
 * 心情配置
 */
export const MOOD_CONFIG = [
	{ id: 'happy', emoji: '😊', label: '高兴', color: '#FCD34D' },
	{ id: 'content', emoji: '😌', label: '满足', color: '#A7F3D0' },
	{ id: 'sad', emoji: '😢', label: '难过', color: '#93C5FD' },
	{ id: 'tired', emoji: '😴', label: '疲惫', color: '#C4B5FD' },
	{ id: 'angry', emoji: '😠', label: '愤怒', color: '#FCA5A5' },
	{ id: 'worried', emoji: '😰', label: '担忧', color: '#D1D5DB' }
];

/**
 * 根据心情ID获取心情配置
 */
export function getMoodConfig(moodId) {
	return MOOD_CONFIG.find(m => m.id === moodId) || MOOD_CONFIG[0];
}
