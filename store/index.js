/**
 * 简单的状态管理
 * 基于Vue 3的reactive实现
 */

import { reactive, watch } from 'vue';

// 状态存储
const state = reactive({
	// 用户信息
	userInfo: {
		id: '',
		name: '',
		avatar: '',
		phone: '',
		email: ''
	},
	
	// 登录状态
	isLoggedIn: false,
	
	// 认证token
	token: '',
	
	// 主题设置
	theme: 'light', // 'light' | 'dark'
	
	// 语言设置
	language: 'zh-CN',
	
	// 应用设置
	settings: {
		enableNotification: true,
		enableLocation: false,
		autoUpdate: true
	},
	
	// 网络状态
	networkStatus: 'unknown', // 'wifi' | '2g' | '3g' | '4g' | '5g' | 'none' | 'unknown'
	
	// 设备信息
	deviceInfo: null
});

/**
 * 从本地存储加载状态
 */
function loadStateFromStorage() {
	try {
		// 加载用户信息
		const userInfo = uni.getStorageSync('userInfo');
		if (userInfo) {
			state.userInfo = { ...state.userInfo, ...JSON.parse(userInfo) };
		}
		
		// 加载登录状态
		const isLoggedIn = uni.getStorageSync('isLoggedIn');
		if (isLoggedIn !== '') {
			state.isLoggedIn = Boolean(isLoggedIn);
		}
		
		// 加载token
		const token = uni.getStorageSync('token');
		if (token) {
			state.token = token;
		}
		
		// 加载主题
		const theme = uni.getStorageSync('theme');
		if (theme) {
			state.theme = theme;
		}
		
		// 加载语言
		const language = uni.getStorageSync('language');
		if (language) {
			state.language = language;
		}
		
		// 加载设置
		const settings = uni.getStorageSync('settings');
		if (settings) {
			state.settings = { ...state.settings, ...JSON.parse(settings) };
		}
		
	} catch (e) {
		console.error('加载本地状态失败:', e);
	}
}

/**
 * 保存状态到本地存储
 * @param {String} key 状态键名
 * @param {*} value 状态值
 */
function saveStateToStorage(key, value) {
	try {
		if (typeof value === 'object') {
			uni.setStorageSync(key, JSON.stringify(value));
		} else {
			uni.setStorageSync(key, value);
		}
	} catch (e) {
		console.error(`保存状态 ${key} 失败:`, e);
	}
}

// 监听状态变化并自动保存到本地存储
watch(() => state.userInfo, (newValue) => {
	saveStateToStorage('userInfo', newValue);
}, { deep: true });

watch(() => state.isLoggedIn, (newValue) => {
	saveStateToStorage('isLoggedIn', newValue);
});

watch(() => state.token, (newValue) => {
	saveStateToStorage('token', newValue);
});

watch(() => state.theme, (newValue) => {
	saveStateToStorage('theme', newValue);
});

watch(() => state.language, (newValue) => {
	saveStateToStorage('language', newValue);
});

watch(() => state.settings, (newValue) => {
	saveStateToStorage('settings', newValue);
}, { deep: true });

// Actions
const actions = {
	/**
	 * 设置用户信息
	 * @param {Object} userInfo 用户信息
	 */
	setUserInfo(userInfo) {
		state.userInfo = { ...state.userInfo, ...userInfo };
	},
	
	/**
	 * 清除用户信息
	 */
	clearUserInfo() {
		state.userInfo = {
			id: '',
			name: '',
			avatar: '',
			phone: '',
			email: ''
		};
	},
	
	/**
	 * 设置登录状态
	 * @param {Boolean} isLoggedIn 是否已登录
	 */
	setLoginStatus(isLoggedIn) {
		state.isLoggedIn = isLoggedIn;
	},
	
	/**
	 * 设置token
	 * @param {String} token 认证token
	 */
	setToken(token) {
		state.token = token;
	},
	
	/**
	 * 清除token
	 */
	clearToken() {
		state.token = '';
	},
	
	/**
	 * 登录
	 * @param {Object} loginData 登录数据
	 */
	login(loginData) {
		const { userInfo, token } = loginData;
		this.setUserInfo(userInfo);
		this.setToken(token);
		this.setLoginStatus(true);
	},
	
	/**
	 * 登出
	 */
	logout() {
		this.clearUserInfo();
		this.clearToken();
		this.setLoginStatus(false);
		
		// 清除本地存储
		try {
			uni.removeStorageSync('userInfo');
			uni.removeStorageSync('token');
			uni.removeStorageSync('isLoggedIn');
		} catch (e) {
			console.error('清除本地存储失败:', e);
		}
	},
	
	/**
	 * 设置主题
	 * @param {String} theme 主题名称
	 */
	setTheme(theme) {
		state.theme = theme;
	},
	
	/**
	 * 切换主题
	 */
	toggleTheme() {
		state.theme = state.theme === 'light' ? 'dark' : 'light';
	},
	
	/**
	 * 设置语言
	 * @param {String} language 语言代码
	 */
	setLanguage(language) {
		state.language = language;
	},
	
	/**
	 * 更新设置
	 * @param {Object} settings 设置对象
	 */
	updateSettings(settings) {
		state.settings = { ...state.settings, ...settings };
	},
	
	/**
	 * 设置网络状态
	 * @param {String} networkStatus 网络状态
	 */
	setNetworkStatus(networkStatus) {
		state.networkStatus = networkStatus;
	},
	
	/**
	 * 设置设备信息
	 * @param {Object} deviceInfo 设备信息
	 */
	setDeviceInfo(deviceInfo) {
		state.deviceInfo = deviceInfo;
	}
};

// Getters
const getters = {
	/**
	 * 获取用户信息
	 * @returns {Object} 用户信息
	 */
	getUserInfo() {
		return state.userInfo;
	},
	
	/**
	 * 获取登录状态
	 * @returns {Boolean} 是否已登录
	 */
	getLoginStatus() {
		return state.isLoggedIn;
	},
	
	/**
	 * 获取token
	 * @returns {String} 认证token
	 */
	getToken() {
		return state.token;
	},
	
	/**
	 * 获取主题
	 * @returns {String} 当前主题
	 */
	getTheme() {
		return state.theme;
	},
	
	/**
	 * 获取语言
	 * @returns {String} 当前语言
	 */
	getLanguage() {
		return state.language;
	},
	
	/**
	 * 获取设置
	 * @returns {Object} 应用设置
	 */
	getSettings() {
		return state.settings;
	},
	
	/**
	 * 获取网络状态
	 * @returns {String} 网络状态
	 */
	getNetworkStatus() {
		return state.networkStatus;
	},
	
	/**
	 * 获取设备信息
	 * @returns {Object} 设备信息
	 */
	getDeviceInfo() {
		return state.deviceInfo;
	},
	
	/**
	 * 检查是否有权限
	 * @param {String} permission 权限名称
	 * @returns {Boolean} 是否有权限
	 */
	hasPermission(permission) {
		// 这里可以根据用户角色或权限列表进行判断
		// 目前简单返回登录状态
		return state.isLoggedIn;
	}
};

/**
 * 初始化store
 */
function initStore() {
	// 从本地存储加载状态
	loadStateFromStorage();
	
	// 监听网络状态变化
	uni.onNetworkStatusChange((res) => {
		actions.setNetworkStatus(res.networkType);
	});
	
	// 获取初始网络状态
	uni.getNetworkType({
		success: (res) => {
			actions.setNetworkStatus(res.networkType);
		}
	});
	
	// 获取设备信息
	try {
		const deviceInfo = uni.getSystemInfoSync();
		actions.setDeviceInfo(deviceInfo);
	} catch (e) {
		console.error('获取设备信息失败:', e);
	}
}

// 创建store实例
const store = {
	state,
	actions,
	getters,
	init: initStore
};

// 导出store
export default store;

// 导出单独的模块
export { state, actions, getters, initStore };