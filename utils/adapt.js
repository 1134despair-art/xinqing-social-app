/**
 * 适配工具函数
 * 提供屏幕适配、设备检测、尺寸转换等功能
 */

// 系统信息缓存
let systemInfo = null;

/**
 * 获取系统信息
 * @returns {Object} 系统信息对象
 */
export function getSystemInfo() {
	if (!systemInfo) {
		try {
			systemInfo = uni.getSystemInfoSync();
		} catch (e) {
			console.error('获取系统信息失败:', e);
			// 提供默认值
			systemInfo = {
				screenWidth: 375,
				screenHeight: 667,
				statusBarHeight: 20,
				platform: 'unknown',
				pixelRatio: 2
			};
		}
	}
	return systemInfo;
}

/**
 * 获取设备类型
 * @returns {String} 设备类型: 'mobile' | 'tablet' | 'desktop'
 */
export function getDeviceType() {
	const { screenWidth } = getSystemInfo();
	
	if (screenWidth < 768) {
		return 'mobile';
	} else if (screenWidth < 1024) {
		return 'tablet';
	} else {
		return 'desktop';
	}
}

/**
 * 获取屏幕尺寸分类
 * @returns {String} 屏幕尺寸: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 */
export function getScreenSize() {
	const { screenWidth } = getSystemInfo();
	
	if (screenWidth < 576) {
		return 'xs';
	} else if (screenWidth < 768) {
		return 'sm';
	} else if (screenWidth < 992) {
		return 'md';
	} else if (screenWidth < 1200) {
		return 'lg';
	} else {
		return 'xl';
	}
}

/**
 * rpx转px
 * @param {Number} rpx rpx值
 * @returns {Number} px值
 */
export function rpxToPx(rpx) {
	const { screenWidth } = getSystemInfo();
	return (rpx * screenWidth) / 750;
}

/**
 * px转rpx
 * @param {Number} px px值
 * @returns {Number} rpx值
 */
export function pxToRpx(px) {
	const { screenWidth } = getSystemInfo();
	return (px * 750) / screenWidth;
}

/**
 * 获取状态栏高度
 * @returns {Number} 状态栏高度(px)
 */
export function getStatusBarHeight() {
	const { statusBarHeight } = getSystemInfo();
	return statusBarHeight || 0;
}

/**
 * 获取导航栏高度
 * @returns {Number} 导航栏高度(px)
 */
export function getNavBarHeight() {
	const { platform } = getSystemInfo();
	
	// 不同平台的导航栏高度
	const navBarHeights = {
		'ios': 44,
		'android': 48,
		'devtools': 42
	};
	
	return navBarHeights[platform] || 44;
}

/**
 * 获取安全区域顶部高度
 * @returns {Number} 安全区域顶部高度(px)
 */
export function getSafeAreaTop() {
	const { safeAreaInsets } = getSystemInfo();
	return safeAreaInsets ? safeAreaInsets.top : getStatusBarHeight();
}

/**
 * 获取安全区域底部高度
 * @returns {Number} 安全区域底部高度(px)
 */
export function getSafeAreaBottom() {
	const { safeAreaInsets } = getSystemInfo();
	return safeAreaInsets ? safeAreaInsets.bottom : 0;
}

/**
 * 获取TabBar高度
 * @returns {Number} TabBar高度(px)
 */
export function getTabBarHeight() {
	// 一般TabBar高度为50px，加上安全区域
	return 50 + getSafeAreaBottom();
}

/**
 * 获取可用屏幕高度
 * @param {Boolean} includeTabBar 是否包含TabBar
 * @returns {Number} 可用屏幕高度(px)
 */
export function getUsableScreenHeight(includeTabBar = false) {
	const { screenHeight } = getSystemInfo();
	const statusBarHeight = getStatusBarHeight();
	const navBarHeight = getNavBarHeight();
	const tabBarHeight = includeTabBar ? 0 : getTabBarHeight();
	
	return screenHeight - statusBarHeight - navBarHeight - tabBarHeight;
}

/**
 * 检测是否为iOS平台
 * @returns {Boolean}
 */
export function isIOS() {
	const { platform } = getSystemInfo();
	return platform === 'ios';
}

/**
 * 检测是否为Android平台
 * @returns {Boolean}
 */
export function isAndroid() {
	const { platform } = getSystemInfo();
	return platform === 'android';
}

/**
 * 检测是否为微信小程序
 * @returns {Boolean}
 */
export function isWeChat() {
	// #ifdef MP-WEIXIN
	return true;
	// #endif
	// #ifndef MP-WEIXIN
	return false;
	// #endif
}

/**
 * 检测是否为H5
 * @returns {Boolean}
 */
export function isH5() {
	// #ifdef H5
	return true;
	// #endif
	// #ifndef H5
	return false;
	// #endif
}

/**
 * 检测是否为App
 * @returns {Boolean}
 */
export function isApp() {
	// #ifdef APP-PLUS
	return true;
	// #endif
	// #ifndef APP-PLUS
	return false;
	// #endif
}

/**
 * 获取当前平台
 * @returns {String} 平台类型: 'h5' | 'mp-weixin' | 'app-plus' | 'unknown'
 */
export function getCurrentPlatform() {
	if (isH5()) return 'h5';
	if (isWeChat()) return 'mp-weixin';
	if (isApp()) return 'app-plus';
	return 'unknown';
}

/**
 * 响应式断点检测
 */
export const breakpoints = {
	xs: 0,
	sm: 576,
	md: 768,
	lg: 992,
	xl: 1200
};

/**
 * 检测当前屏幕是否匹配指定断点
 * @param {String} breakpoint 断点名称
 * @returns {Boolean}
 */
export function matchBreakpoint(breakpoint) {
	const { screenWidth } = getSystemInfo();
	const bp = breakpoints[breakpoint];
	
	if (!bp && bp !== 0) return false;
	
	switch (breakpoint) {
		case 'xs':
			return screenWidth < breakpoints.sm;
		case 'sm':
			return screenWidth >= breakpoints.sm && screenWidth < breakpoints.md;
		case 'md':
			return screenWidth >= breakpoints.md && screenWidth < breakpoints.lg;
		case 'lg':
			return screenWidth >= breakpoints.lg && screenWidth < breakpoints.xl;
		case 'xl':
			return screenWidth >= breakpoints.xl;
		default:
			return false;
	}
}

/**
 * 获取响应式值
 * @param {Object} values 响应式值对象 { xs: value1, sm: value2, ... }
 * @returns {*} 当前断点对应的值
 */
export function getResponsiveValue(values) {
	const currentSize = getScreenSize();
	const sizes = ['xl', 'lg', 'md', 'sm', 'xs'];
	
	// 从当前尺寸开始向下查找可用值
	for (let i = sizes.indexOf(currentSize); i < sizes.length; i++) {
		const size = sizes[i];
		if (values[size] !== undefined) {
			return values[size];
		}
	}
	
	// 如果没有找到，返回第一个可用值
	for (const size of sizes) {
		if (values[size] !== undefined) {
			return values[size];
		}
	}
	
	return null;
}

/**
 * 节流函数
 * @param {Function} func 要节流的函数
 * @param {Number} delay 延迟时间(ms)
 * @returns {Function} 节流后的函数
 */
export function throttle(func, delay) {
	let timer = null;
	return function(...args) {
		if (!timer) {
			timer = setTimeout(() => {
				func.apply(this, args);
				timer = null;
			}, delay);
		}
	};
}

/**
 * 防抖函数
 * @param {Function} func 要防抖的函数
 * @param {Number} delay 延迟时间(ms)
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, delay) {
	let timer = null;
	return function(...args) {
		clearTimeout(timer);
		timer = setTimeout(() => {
			func.apply(this, args);
		}, delay);
	};
}

// 导出默认对象
export default {
	getSystemInfo,
	getDeviceType,
	getScreenSize,
	rpxToPx,
	pxToRpx,
	getStatusBarHeight,
	getNavBarHeight,
	getSafeAreaTop,
	getSafeAreaBottom,
	getTabBarHeight,
	getUsableScreenHeight,
	isIOS,
	isAndroid,
	isWeChat,
	isH5,
	isApp,
	getCurrentPlatform,
	breakpoints,
	matchBreakpoint,
	getResponsiveValue,
	throttle,
	debounce
};