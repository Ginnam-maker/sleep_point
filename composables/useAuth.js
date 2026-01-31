// 用户认证管理 Composable
import { ref, readonly } from 'vue';
import { getUserInfo, saveUserInfo as saveUserInfoToStorage } from '@/utils/storage.js';

/**
 * 用户认证管理 Composable
 */
export function useAuth() {
	// ========== 响应式状态 ==========
	const userInfo = ref(null);
	const isLoggedIn = ref(false);
	const isLoading = ref(false);

	// ========== 核心方法 ==========
	
	/**
	 * 检查登录状态
	 */
	const checkLoginStatus = () => {
		try {
			const info = getUserInfo();
			userInfo.value = info;
			isLoggedIn.value = !!info;
			return !!info;
		} catch (err) {
			console.error('检查登录状态失败:', err);
			return false;
		}
	};

	/**
	 * 登录
	 * @param {Object} loginData - 登录数据
	 */
	const login = async (loginData) => {
		isLoading.value = true;
		
		try {
			// 调用云函数登录
			const res = await uni.cloud.callFunction({
				name: 'saveUserInfo',
				data: loginData
			});
			
			if (res.result && res.result.success) {
				const info = res.result.userInfo;
				saveUserInfoToStorage(info);
				userInfo.value = info;
				isLoggedIn.value = true;
				return { success: true, userInfo: info };
			}
			
			throw new Error(res.result?.message || '登录失败');
		} catch (err) {
			return { success: false, error: err.message };
		} finally {
			isLoading.value = false;
		}
	};

	/**
	 * 登出
	 */
	const logout = () => {
		uni.removeStorageSync('userInfo');
		userInfo.value = null;
		isLoggedIn.value = false;
	};

	/**
	 * 跳转到登录页
	 */
	const navigateToLogin = () => {
		uni.navigateTo({
			url: '/pages/login/login'
		});
	};

	/**
	 * 需要登录的功能守卫
	 * @param {Function} callback - 登录后执行的回调
	 * @param {Object} options - 配置选项
	 */
	const requireAuth = (callback, options = {}) => {
		const {
			title = '需要登录',
			content = '该功能需要登录后使用',
			showModal = true
		} = options;
		
		if (isLoggedIn.value) {
			callback();
			return true;
		}
		
		if (showModal) {
			uni.showModal({
				title,
				content,
				confirmText: '去登录',
				cancelText: '稍后再说',
				success: (res) => {
					if (res.confirm) {
						navigateToLogin();
					}
				}
			});
		}
		
		return false;
	};

	// 初始化时检查登录状态
	checkLoginStatus();

	// ========== 返回接口 ==========
	return {
		// 状态
		userInfo: readonly(userInfo),
		isLoggedIn: readonly(isLoggedIn),
		isLoading: readonly(isLoading),
		
		// 方法
		checkLoginStatus,
		login,
		logout,
		navigateToLogin,
		requireAuth
	};
}
