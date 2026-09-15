import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { 
	getSystemInfo, 
	getScreenInfo, 
	getCurrentBreakpoint, 
	getResponsiveValue,
	isIOS,
	isAndroid,
	isWechatMiniProgram,
	isH5,
	isApp,
	throttle
} from '@/utils/adapt.js';

/**
 * 响应式混入
 * 提供响应式设计相关的数据和方法
 */
export default function useResponsive() {
	// 响应式数据
	const responsive = reactive({
		// 屏幕信息
		screenWidth: 375,
		screenHeight: 667,
		windowWidth: 375,
		windowHeight: 667,
		pixelRatio: 2,
		
		// 安全区域
		safeAreaTop: 0,
		safeAreaBottom: 0,
		safeAreaLeft: 0,
		safeAreaRight: 0,
		
		// 状态栏和导航栏
		statusBarHeight: 20,
		navigationBarHeight: 44,
		tabBarHeight: 50,
		
		// 当前断点
		currentBreakpoint: 'sm',
		
		// 平台信息
		platform: 'unknown',
		isIOS: false,
		isAndroid: false,
		isWechatMiniProgram: false,
		isH5: false,
		isApp: false,
		
		// 设备类型
		deviceType: 'mobile',
		
		// 网络状态
		networkType: 'unknown',
		
		// 主题模式
		isDarkMode: false
	});
	
	// 更新屏幕信息
	const updateScreenInfo = () => {
		try {
			const systemInfo = getSystemInfo();
			const screenInfo = getScreenInfo();
			
			// 更新屏幕尺寸
			responsive.screenWidth = systemInfo.screenWidth;
			responsive.screenHeight = systemInfo.screenHeight;
			responsive.windowWidth = systemInfo.windowWidth;
			responsive.windowHeight = systemInfo.windowHeight;
			responsive.pixelRatio = systemInfo.pixelRatio;
			
			// 更新安全区域
			responsive.safeAreaTop = screenInfo.safeAreaTop;
			responsive.safeAreaBottom = screenInfo.safeAreaBottom;
			responsive.safeAreaLeft = screenInfo.safeAreaLeft;
			responsive.safeAreaRight = screenInfo.safeAreaRight;
			
			// 更新状态栏和导航栏高度
			responsive.statusBarHeight = screenInfo.statusBarHeight;
			responsive.navigationBarHeight = screenInfo.navigationBarHeight;
			responsive.tabBarHeight = screenInfo.tabBarHeight;
			
			// 更新当前断点
			responsive.currentBreakpoint = getCurrentBreakpoint();
			
			// 更新平台信息
			responsive.platform = systemInfo.platform;
			responsive.isIOS = isIOS();
			responsive.isAndroid = isAndroid();
			responsive.isWechatMiniProgram = isWechatMiniProgram();
			responsive.isH5 = isH5();
			responsive.isApp = isApp();
			
			// 更新设备类型
			if (responsive.screenWidth >= 768) {
				responsive.deviceType = 'tablet';
			} else if (responsive.screenWidth >= 1024) {
				responsive.deviceType = 'desktop';
			} else {
				responsive.deviceType = 'mobile';
			}
			
			// 更新网络状态
			responsive.networkType = systemInfo.networkType || 'unknown';
			
			// 检测深色模式
			// #ifdef H5
			if (window.matchMedia) {
				responsive.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
			}
			// #endif
			
			console.log('屏幕信息已更新:', responsive);
		} catch (error) {
			console.error('更新屏幕信息失败:', error);
		}
	};
	
	// 节流的更新函数
	const throttledUpdate = throttle(updateScreenInfo, 300);
	
	// 获取响应式值
	const getResponsiveVal = (values) => {
		return getResponsiveValue(values);
	};
	
	// 检查是否匹配断点
	const matchBreakpoint = (breakpoint) => {
		return responsive.currentBreakpoint === breakpoint;
	};
	
	// 检查是否大于等于指定断点
	const minBreakpoint = (breakpoint) => {
		const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl'];
		const currentIndex = breakpoints.indexOf(responsive.currentBreakpoint);
		const targetIndex = breakpoints.indexOf(breakpoint);
		return currentIndex >= targetIndex;
	};
	
	// 检查是否小于等于指定断点
	const maxBreakpoint = (breakpoint) => {
		const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl'];
		const currentIndex = breakpoints.indexOf(responsive.currentBreakpoint);
		const targetIndex = breakpoints.indexOf(breakpoint);
		return currentIndex <= targetIndex;
	};
	
	// 获取安全区域样式
	const getSafeAreaStyle = () => {
		return {
			paddingTop: `${responsive.safeAreaTop}px`,
			paddingBottom: `${responsive.safeAreaBottom}px`,
			paddingLeft: `${responsive.safeAreaLeft}px`,
			paddingRight: `${responsive.safeAreaRight}px`
		};
	};
	
	// 获取状态栏高度样式
	const getStatusBarStyle = () => {
		return {
			height: `${responsive.statusBarHeight}px`,
			paddingTop: `${responsive.statusBarHeight}px`
		};
	};
	
	// 获取导航栏高度样式
	const getNavigationBarStyle = () => {
		return {
			height: `${responsive.navigationBarHeight}px`,
			paddingTop: `${responsive.navigationBarHeight}px`
		};
	};
	
	// 获取底部安全区域样式
	const getBottomSafeAreaStyle = () => {
		return {
			paddingBottom: `${responsive.safeAreaBottom}px`,
			marginBottom: `${responsive.safeAreaBottom}px`
		};
	};
	
	// 获取可用屏幕高度
	const getUsableHeight = () => {
		return responsive.windowHeight - responsive.statusBarHeight - responsive.navigationBarHeight - responsive.tabBarHeight - responsive.safeAreaBottom;
	};
	
	// 监听窗口大小变化
	let resizeListener = null;
	
	// 初始化
	onMounted(() => {
		updateScreenInfo();
		
		// #ifdef H5
		// H5端监听窗口大小变化
		resizeListener = () => {
			throttledUpdate();
		};
		window.addEventListener('resize', resizeListener);
		
		// 监听深色模式变化
		if (window.matchMedia) {
			const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
			const handleDarkModeChange = (e) => {
				responsive.isDarkMode = e.matches;
			};
			darkModeQuery.addListener(handleDarkModeChange);
			
			// 清理函数中移除监听器
			onUnmounted(() => {
				darkModeQuery.removeListener(handleDarkModeChange);
			});
		}
		// #endif
		
		// 监听网络状态变化
		uni.onNetworkStatusChange((res) => {
			responsive.networkType = res.networkType;
		});
	});
	
	// 清理
	onUnmounted(() => {
		// #ifdef H5
		if (resizeListener) {
			window.removeEventListener('resize', resizeListener);
		}
		// #endif
	});
	
	return {
		// 响应式数据
		responsive,
		
		// 方法
		updateScreenInfo,
		getResponsiveVal,
		matchBreakpoint,
		minBreakpoint,
		maxBreakpoint,
		getSafeAreaStyle,
		getStatusBarStyle,
		getNavigationBarStyle,
		getBottomSafeAreaStyle,
		getUsableHeight,
		
		// 计算属性
		isMobile: () => responsive.deviceType === 'mobile',
		isTablet: () => responsive.deviceType === 'tablet',
		isDesktop: () => responsive.deviceType === 'desktop',
		isSmallScreen: () => responsive.screenWidth < 768,
		isMediumScreen: () => responsive.screenWidth >= 768 && responsive.screenWidth < 1024,
		isLargeScreen: () => responsive.screenWidth >= 1024,
		
		// 断点检查
		isXS: () => matchBreakpoint('xs'),
		isSM: () => matchBreakpoint('sm'),
		isMD: () => matchBreakpoint('md'),
		isLG: () => matchBreakpoint('lg'),
		isXL: () => matchBreakpoint('xl'),
		
		// 平台检查
		isIOSDevice: () => responsive.isIOS,
		isAndroidDevice: () => responsive.isAndroid,
		isWechatMP: () => responsive.isWechatMiniProgram,
		isH5Platform: () => responsive.isH5,
		isAppPlatform: () => responsive.isApp,
		
		// 网络状态
		isOnline: () => responsive.networkType !== 'none',
		isWifi: () => responsive.networkType === 'wifi',
		isMobileNetwork: () => ['2g', '3g', '4g', '5g'].includes(responsive.networkType),
		
		// 主题模式
		isDark: () => responsive.isDarkMode,
		isLight: () => !responsive.isDarkMode
	};
}

// 全局响应式混入（可选）
export const globalResponsiveMixin = {
	setup() {
		return useResponsive();
	}
};