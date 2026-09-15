/**
 * @Author: zhanglimin
 * @Date: 2026-04-01 02:09:00
 * @LastEditors: zhanglimin
 * @LastEditTime: 2026-05-21 18:51:14
 * @Description: 
 * @FilePath: /uniapp-demo/utils/request.js
 */
/**
 * 网络请求工具
 * 封装uni.request，适配RuoYi后端响应格式
 */

import { mockRequest, mockUpload } from '@/mock';

// let baseURL = 'http://117.72.185.92:19500';
let baseURL = 'https://api-xqsj332.haichuang.pro';

// #ifdef H5
if (import.meta.env && import.meta.env.DEV) {
	baseURL = '/backend-api';
}
// #endif

// 请求配置
const config = {
	baseURL,
	timeout: 10000,
	header: {
		'Content-Type': 'application/json'
	}
};

const SUCCESS_CODES = new Set([0, 200, 1000]);
const isDev = typeof process === 'undefined' || !process.env || process.env.NODE_ENV !== 'production';

function isSuccessCode(code) {
	return SUCCESS_CODES.has(code);
}
const USE_MOCK = false;
let requestCounter = 0;

function createRequestId() {
	requestCounter += 1;
	return 'req_' + Date.now() + '_' + requestCounter;
}

function getDuration(startTime) {
	return Date.now() - startTime;
}

function parseResponseData(data) {
	if (typeof data !== 'string') {
		return data;
	}

	try {
		return JSON.parse(data);
	} catch (e) {
		return data;
	}
}

function isMockEnabled() {
	return USE_MOCK;
}

/**
 * 统一打印请求日志，方便排查接口问题
 * @param {String} stage 日志阶段
 * @param {Object} payload 日志内容
 */
function logRequest(stage, payload) {
	if (!isDev) {
		return;
	}

	const prefix = '[request][' + stage + ']';
	const safePayload = {
		...payload,
		header: maskSensitiveHeader(payload.header)
	};

	if (stage === 'fail' && console.error) {
		console.error(prefix, safePayload);
		return;
	}

	console.log(prefix, safePayload);
}

/**
 * 打码敏感请求头，避免日志泄露token
 * @param {Object} header 请求头
 * @returns {Object}
 */
function maskSensitiveHeader(header = {}) {
	const masked = { ...header };
	if (masked.Authorization) {
		masked.Authorization = maskToken(masked.Authorization);
	}
	if (masked['mood-social-satoken']) {
		masked['mood-social-satoken'] = maskToken(masked['mood-social-satoken']);
	}
	return masked;
}

/**
 * 打码token，仅保留前后少量字符便于识别
 * @param {String} token token字符串
 * @returns {String}
 */
function maskToken(token = '') {
	if (typeof token !== 'string' || !token) {
		return token;
	}

	if (token.length <= 16) {
		return token.slice(0, 4) + '****';
	}

	return token.slice(0, 10) + '****' + token.slice(-6);
}

/**
 * 获取存储的token
 * @returns {String} token
 */
function getToken() {
	try {
		return uni.getStorageSync('token') || '';
	} catch (e) {
		console.error('获取token失败:', e);
		return '';
	}
}

/**
 * 清除token并跳转登录页
 */
function handleUnauthorized() {
	try {
		uni.removeStorageSync('token');
		uni.removeStorageSync('userInfo');
		uni.removeStorageSync('isLoggedIn');
	} catch (e) {
		console.error('清除token失败:', e);
	}
	uni.reLaunch({ url: '/pages/login/login' });
}

/**
 * 显示错误提示
 * @param {String} message 错误信息
 */
function showError(message) {
	uni.showToast({
		title: message || '请求失败',
		icon: 'none',
		duration: 2000
	});
}

/**
 * 核心请求函数
 * @param {Object} options 请求选项
 * @returns {Promise} 请求Promise
 */
function request(options) {
	return new Promise((resolve, reject) => {
		const requestUrl = options.url;
		const url = requestUrl.startsWith('http') ? requestUrl : config.baseURL + requestUrl;
		const header = { ...config.header, ...options.header };
		const method = options.method || 'GET';
		const requestId = createRequestId();
		const startTime = Date.now();

		// 请求拦截：自动添加Authorization头
		const token = getToken();
		if (token) {
			header['mood-social-satoken'] = 'Bearer ' + token;
		}

		// 显示加载提示
		if (options.loading !== false) {
			uni.showLoading({ title: options.loadingText || '加载中...', mask: true });
		}

		logRequest('send', {
			requestId,
			path: requestUrl,
			url,
			method,
			requestData: options.data,
			header
		});

		if (isMockEnabled()) {
			mockRequest({
				url: requestUrl,
				method,
				data: options.data,
				token
			}).then((res) => {
				if (options.loading !== false) {
					uni.hideLoading();
				}

				logRequest('success', {
					requestId,
					path: requestUrl,
					url,
					method,
					duration: getDuration(startTime),
					statusCode: 200,
					requestData: options.data,
					responseData: res,
					response: { data: res, statusCode: 200, mock: true }
				});
				resolve(res);
			}).catch((error) => {
				if (options.loading !== false) {
					uni.hideLoading();
				}

				logRequest('fail', {
					requestId,
					path: requestUrl,
					url,
					method,
					duration: getDuration(startTime),
					requestData: options.data,
					error
				});

				if (error.code === 401) {
					handleUnauthorized();
					reject({ message: '登录已过期，请重新登录', code: 401 });
					return;
				}

				if (error.errMsg && error.errMsg.includes('timeout')) {
					const timeoutError = { message: '请求超时，请稍后重试', ...error };
					if (!options.silent) {
						showError(timeoutError.message);
					}
					reject(timeoutError);
					return;
				}

				if (!options.silent) {
					showError(error.msg || error.message || '请求失败');
				}
				reject(error);
			});
			return;
		}

		uni.request({
			url,
			method,
			data: options.data,
			header,
			timeout: config.timeout,
			success: (response) => {
				if (options.loading !== false) {
					uni.hideLoading();
				}

				const res = response.data;
				logRequest('success', {
					requestId,
					path: requestUrl,
					url,
					method,
					duration: getDuration(startTime),
					statusCode: response.statusCode,
					requestData: options.data,
					responseData: res,
					response
				});

				// 响应拦截：MoodSocial { code: 0, message: "", data: {} }
				if (response.statusCode === 200) {
					if (res && typeof res === 'object') {
						if (isSuccessCode(res.code)) {
							resolve(res);
						} else if (res.code === 401) {
							logRequest('fail', {
								requestId,
								path: requestUrl,
								url,
								method,
								duration: getDuration(startTime),
								statusCode: response.statusCode,
								requestData: options.data,
								responseData: res,
								error: { code: 401, message: '登录已过期，请重新登录' }
							});
							handleUnauthorized();
							reject({ message: '登录已过期，请重新登录', code: 401 });
						} else {
							const errMsg = res.message || res.msg || '请求失败';
							logRequest('fail', {
								requestId,
								path: requestUrl,
								url,
								method,
								duration: getDuration(startTime),
								statusCode: response.statusCode,
								requestData: options.data,
								responseData: res,
								error: { code: res.code, message: errMsg }
							});
							if (!options.silent) {
								showError(errMsg);
							}
							reject({ ...res, message: errMsg });
						}
					} else {
						resolve(res);
					}
				} else if (response.statusCode === 401) {
					// HTTP 401
					logRequest('fail', {
						requestId,
						path: requestUrl,
						url,
						method,
						duration: getDuration(startTime),
						statusCode: response.statusCode,
						requestData: options.data,
						responseData: res,
						error: { code: 401, message: '登录已过期，请重新登录' }
					});
					handleUnauthorized();
					reject({ message: '登录已过期，请重新登录', code: 401 });
				} else {
					// 其他HTTP错误
					const message = '请求失败 (' + response.statusCode + ')';
					logRequest('fail', {
						requestId,
						path: requestUrl,
						url,
						method,
						duration: getDuration(startTime),
						statusCode: response.statusCode,
						requestData: options.data,
						responseData: res,
						error: { message, statusCode: response.statusCode }
					});
					if (!options.silent) {
						showError(message);
					}
					reject({ message, statusCode: response.statusCode });
				}
			},
			fail: (error) => {
				if (options.loading !== false) {
					uni.hideLoading();
				}

				logRequest('fail', {
					requestId,
					path: requestUrl,
					url,
					method,
					duration: getDuration(startTime),
					requestData: options.data,
					error
				});

				let message = '网络连接失败，请检查网络设置';
				if (error.errMsg && error.errMsg.includes('timeout')) {
					message = '请求超时，请稍后重试';
				}

				if (!options.silent) {
					showError(message);
				}
				reject({ message, ...error });
			}
		});
	});
}

/**
 * GET请求
 * @param {String} url 请求地址
 * @param {Object} params 请求参数
 * @param {Object} options 额外选项
 * @returns {Promise}
 */
export function get(url, params = {}, options = {}) {
	return request({ url, method: 'GET', data: params, ...options });
}

/**
 * POST请求
 * @param {String} url 请求地址
 * @param {Object} data 请求数据
 * @param {Object} options 额外选项
 * @returns {Promise}
 */
export function post(url, data = {}, options = {}) {
	return request({ url, method: 'POST', data, ...options });
}

/**
 * PUT请求
 * @param {String} url 请求地址
 * @param {Object} data 请求数据
 * @param {Object} options 额外选项
 * @returns {Promise}
 */
export function put(url, data = {}, options = {}) {
	return request({ url, method: 'PUT', data, ...options });
}

/**
 * DELETE请求
 * @param {String} url 请求地址
 * @param {Object} params 请求参数
 * @param {Object} options 额外选项
 * @returns {Promise}
 */
export function del(url, params = {}, options = {}) {
	return request({ url, method: 'DELETE', data: params, ...options });
}

/** 上传请求头：禁止手动 Content-Type，由运行时生成 multipart boundary */
function buildUploadHeaders(extraHeader = {}) {
	const header = { ...extraHeader };
	delete header['Content-Type'];
	delete header['content-type'];
	const token = getToken();
	if (token) {
		header['mood-social-satoken'] = 'Bearer ' + token;
	}
	return header;
}

function guessUploadFileName(filePath, fallback = 'avatar.jpg') {
	if (!filePath || typeof filePath !== 'string') {
		return fallback;
	}
	const clean = filePath.split('?')[0];
	const base = clean.split('/').pop() || '';
	if (/\.(jpe?g|png|gif|webp|mp3|m4a|aac|wav|ogg)$/i.test(base)) {
		return base;
	}
	return fallback;
}

function hasCustomMultipartFileName(options = {}) {
	return Boolean(options && typeof options.fileName === 'string' && options.fileName.trim());
}

function getUploadBaseName(filePath = '') {
	return String(filePath || '').split('?')[0].split('/').pop() || '';
}

function pathHasVoiceUploadExtension(filePath = '') {
	return /\.(mp3|m4a|aac|wav|ogg)$/i.test(getUploadBaseName(filePath));
}

/** 路径本身无合法语音后缀时才需要自定义 multipart 文件名（否则 uni.uploadFile 会自带后缀） */
function needsCustomMultipartFileName(options = {}, prepared = {}, filePath = '') {
	if (!hasCustomMultipartFileName(options)) {
		return false;
	}
	const uploadPath = prepared.path || filePath;
	if (pathHasVoiceUploadExtension(uploadPath)) {
		return false;
	}
	// 兜底：options.fileName 与路径后缀一致时，uni.uploadFile 的 basename 已满足后端
	const customBaseName = getUploadBaseName(options.fileName);
	if (customBaseName && customBaseName === getUploadBaseName(uploadPath)) {
		return false;
	}
	return true;
}

function toPlusResolvableLocalUrl(filePath = '') {
	const raw = String(filePath || '').trim();
	if (!raw) return raw;
	if (/^file:\/\//i.test(raw)) return raw;
	if (raw.startsWith('/')) return `file://${raw}`;
	return raw;
}

function guessUploadMimeType(fileName = '', fallback = 'application/octet-stream') {
	const normalizedName = String(fileName || '').toLowerCase();
	if (/\.png$/i.test(normalizedName)) return 'image/png';
	if (/\.gif$/i.test(normalizedName)) return 'image/gif';
	if (/\.webp$/i.test(normalizedName)) return 'image/webp';
	if (/\.(jpe?g)$/i.test(normalizedName)) return 'image/jpeg';
	if (/\.mp3$/i.test(normalizedName)) return 'audio/mpeg';
	if (/\.m4a$/i.test(normalizedName)) return 'audio/mp4';
	if (/\.aac$/i.test(normalizedName)) return 'audio/aac';
	if (/\.wav$/i.test(normalizedName)) return 'audio/wav';
	if (/\.ogg$/i.test(normalizedName)) return 'audio/ogg';
	return fallback;
}

/**
 * 将 chooseImage 返回的本地路径转为可读取的文件路径（App 端 _doc 需转换）
 * @returns {Promise<{ mode: 'uploadFile', path: string } | { mode: 'formData', blob: Blob, fileName: string }>}
 */
function prepareUploadFile(filePath, options = {}) {
	return new Promise((resolve, reject) => {
		if (!filePath || typeof filePath !== 'string') {
			reject({ message: '文件路径无效' });
			return;
		}

		// #ifdef H5
		if (/^blob:|^https?:\/\//i.test(filePath)) {
			fetch(filePath)
				.then((res) => res.blob())
				.then((blob) => {
					resolve({
						mode: 'formData',
						blob,
						fileName: options.fileName || guessUploadFileName(filePath)
					});
				})
				.catch((err) => {
					reject({ message: '读取图片文件失败', ...err });
				});
			return;
		}
		// #endif

		const candidates = [filePath];
		// #ifdef APP-PLUS
		try {
			if (typeof plus !== 'undefined' && plus.io && plus.io.convertLocalFileSystemURL) {
				const converted = plus.io.convertLocalFileSystemURL(filePath);
				if (converted && converted !== filePath) {
					candidates.unshift(converted);
				}
			}
		} catch (e) {
			/* ignore */
		}
		// #endif

		const pickPath = (index) => {
			if (index >= candidates.length) {
				resolve({ mode: 'uploadFile', path: filePath });
				return;
			}
			const path = candidates[index];
			uni.getFileInfo({
				filePath: path,
				success: (info) => resolve({ mode: 'uploadFile', path, size: info.size }),
				fail: () => pickPath(index + 1)
			});
		};
		pickPath(0);
	});
}

function handleUploadHttpResponse(response, context, options) {
	const { resolve, reject, requestId, url, fullUrl, startTime, filePath, formData } = context;

	if (options.loading !== false) {
		uni.hideLoading();
	}

	logRequest('success', {
		requestId,
		path: url,
		url: fullUrl,
		method: 'UPLOAD',
		duration: getDuration(startTime),
		statusCode: response.statusCode,
		responseData: parseResponseData(response.data),
		filePath,
		formData,
		response
	});

	if (response.statusCode === 200) {
		try {
			const res = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
			if (isSuccessCode(res.code)) {
				resolve(res);
				return;
			}
			if (res.code === 401) {
				handleUnauthorized();
				reject({ message: '登录已过期，请重新登录', code: 401 });
				return;
			}
			const errMsg = res.message || res.msg || '上传失败';
			if (!options.silent) {
				showError(errMsg);
			}
			reject({ ...res, message: errMsg });
			return;
		} catch (e) {
			resolve(response.data);
			return;
		}
	}

	if (response.statusCode === 401) {
		handleUnauthorized();
		reject({ message: '登录已过期，请重新登录', code: 401 });
		return;
	}

	const message = '上传失败';
	if (!options.silent) {
		showError(message);
	}
	reject({ message, statusCode: response.statusCode });
}

/** 上传 HTTP 方法（默认 POST；头像等接口可为 PUT） */
function resolveUploadHttpMethod(options = {}) {
	return String(options.method || 'POST').toUpperCase();
}

/** 是否必须用 XHR + FormData（PUT 等非 POST 时 uni.uploadFile 不适用） */
function mustUseXHRMultipart(options = {}) {
	return resolveUploadHttpMethod(options) !== 'POST';
}

/** H5：使用 FormData 以 multipart 字段 file 上传二进制 */
function uploadByFormData(fullUrl, prepared, formData, options, context) {
	return new Promise((resolve, reject) => {
		const fieldName = options.name || 'file';
		const httpMethod = resolveUploadHttpMethod(options);
		const fd = new FormData();
		fd.append(fieldName, prepared.blob, prepared.fileName || 'avatar.jpg');
		Object.keys(formData || {}).forEach((key) => {
			fd.append(key, formData[key]);
		});

		const xhr = new XMLHttpRequest();
		xhr.open(httpMethod, fullUrl);
		const header = buildUploadHeaders(options.header);
		Object.keys(header).forEach((key) => {
			xhr.setRequestHeader(key, header[key]);
		});

		xhr.onload = () => {
			handleUploadHttpResponse(
				{ statusCode: xhr.status, data: xhr.responseText },
				{ ...context, resolve, reject },
				options
			);
		};
		xhr.onerror = () => {
			if (options.loading !== false) {
				uni.hideLoading();
			}
			const message = '网络连接失败，请检查网络设置';
			if (!options.silent) {
				showError(message);
			}
			reject({ message });
		};
		xhr.send(fd);
	});
}

/** 本地路径读成 Blob 后走 FormData 上传（用于 PUT 等非 POST） */
function uploadByFormDataFromPath(fullUrl, prepared, formData, options, context) {
	return new Promise((resolve, reject) => {
		uni.getFileSystemManager().readFile({
			filePath: prepared.path,
			success: (res) => {
				const fileName = options.fileName || guessUploadFileName(prepared.path);
				const mime = guessUploadMimeType(fileName);
				const blob = new Blob([res.data], { type: mime });
				uploadByFormData(
					fullUrl,
					{ mode: 'formData', blob, fileName, size: prepared.size },
					formData,
					options,
					context
				).then(resolve).catch(reject);
			},
			fail: (err) => {
				reject({ message: '读取本地文件失败', ...err });
			}
		});
	});
}

/** 构建上传日志（formData 参数仅含额外字段，文件在 multipart 的 file 字段） */
function buildUploadLogPayload(prepared, formData, options, extra = {}) {
	const fieldName = options.name || 'file';
	const filePart = prepared.mode === 'uploadFile'
		? {
			field: fieldName,
			uri: prepared.path,
			size: prepared.size,
			fileName: guessUploadFileName(prepared.path)
		}
		: {
			field: fieldName,
			fileName: prepared.fileName,
			size: prepared.blob && prepared.blob.size
		};

	return {
		contentType: 'multipart/form-data',
		multipart: {
			file: filePart,
			extraFields: formData || {},
			note: 'extraFields 为空是正常的；图片二进制在 multipart 的 file 字段，不在 extraFields'
		},
		...extra
	};
}

/**
 * App 端：plus.io 读出 File 对象 → FormData.append('file', file) → 原生 XHR 发送
 * 运行时会把文件编码进 multipart 请求体，控制台无法打印二进制，但可打印 file.size
 */
function uploadByPlusNativeXHR(fullUrl, prepared, formData, options, context) {
	return new Promise((resolve, reject) => {
		const fieldName = options.name || 'file';
		const httpMethod = resolveUploadHttpMethod(options);
		const header = buildUploadHeaders(options.header);
		const { requestId, url, startTime, filePath } = context;

		if (typeof plus === 'undefined' || !plus.io || !plus.net) {
			reject({ message: '当前环境不支持原生文件上传' });
			return;
		}

		plus.io.resolveLocalFileSystemURL(
			toPlusResolvableLocalUrl(prepared.path),
			(entry) => {
				entry.file(
					(file) => {
						const fileName = options.fileName || file.name || guessUploadFileName(prepared.path);
						const fileSize = file.size || prepared.size || 0;
						const fd = new FormData();
						fd.append(fieldName, file, fileName);
						Object.keys(formData || {}).forEach((key) => {
							fd.append(key, formData[key]);
						});

						logRequest('send', {
							requestId,
							path: url,
							url: fullUrl,
							method: httpMethod,
							transport: 'plus.net.XMLHttpRequest + FormData',
							...buildUploadLogPayload(
								{ ...prepared, size: fileSize },
								formData,
								options,
								{
									binaryAttached: true,
									fileBytes: fileSize,
									fileType: file.type || 'image/jpeg',
									fileName
								}
							)
						});

						const xhr = new plus.net.XMLHttpRequest();
						xhr.open(httpMethod, fullUrl);
						Object.keys(header).forEach((key) => {
							xhr.setRequestHeader(key, header[key]);
						});
						xhr.onload = () => {
							handleUploadHttpResponse(
								{ statusCode: xhr.status, data: xhr.responseText },
								{ ...context, resolve, reject },
								options
							);
						};
						xhr.onerror = () => {
							if (options.loading !== false) {
								uni.hideLoading();
							}
							reject({ message: '原生 FormData 上传失败' });
						};
						xhr.send(fd);
					},
					(err) => reject({ message: '读取本地文件失败', ...err })
				);
			},
			(err) => reject({ message: '解析本地文件路径失败', ...err })
		);
	});
}

/** 是否 App 端（5+ Runtime） */
function isAppPlusRuntime() {
	return typeof plus !== 'undefined' && !!(plus.io && plus.net);
}

/** uni.uploadFile 上传（各端统一 filePath + name，由运行时构造 multipart/form-data） */
function uploadByUniUploadFile(fullUrl, prepared, formData, options, context) {
	return new Promise((resolve, reject) => {
		const { requestId, url, startTime, filePath } = context;
		const header = buildUploadHeaders(options.header);
		const fieldName = options.name || 'file';
		logRequest('uploadByUniUploadFile', prepared, formData, options, context);
		if (!prepared.path) {
			reject({ message: '文件路径无效' });
			return;
		}
		if (prepared.size === 0) {
			reject({ message: '文件为空，无法上传' });
			return;
		}

		// chooseImage 原始临时路径优先保留；_doc 等运行时路径则改用已验证过的绝对路径上传。
		const shouldUsePreparedPath = /^_doc\//i.test(filePath) || /^file:\/\//i.test(filePath);
		const uploadPath = shouldUsePreparedPath ? prepared.path : (filePath || prepared.path);
		logRequest('uploadByUniUploadFile_uploadPath', {uploadPath, shouldUsePreparedPath, fullUrl, formData});
		const uploadOptions = {
			url: fullUrl,
			filePath: uploadPath,
			name: fieldName,
			formData: formData || {},
			header,
			success: (response) => {
				logRequest('uploadByUniUploadFile_success', response);
				handleUploadHttpResponse(response, { ...context, resolve, reject }, options);
			},
			fail: (error) => {
				logRequest('fail', {
					requestId,
					path: url,
					url: fullUrl,
					method: 'UPLOAD',
					duration: getDuration(startTime),
					filePath: uploadPath,
					error
				});

				// App 端 uni.uploadFile 失败时再尝试 plus FormData
				if (isAppPlusRuntime()) {
					uploadByPlusNativeXHR(fullUrl, prepared, formData, options, context)
						.then(resolve)
						.catch((fallbackError) => {
							if (options.loading !== false) {
								uni.hideLoading();
							}
							const message = fallbackError.message || error.errMsg || '上传失败';
							if (!options.silent) {
								showError(message);
							}
							reject({ message, ...fallbackError, ...error });
						});
					return;
				}

				if (options.loading !== false) {
					uni.hideLoading();
				}
				const message = error.errMsg || '网络连接失败，请检查网络设置';
				if (!options.silent) {
					showError(message);
				}
				reject({ message, ...error });
			}
		};

		uni.uploadFile(uploadOptions);
	});
}

/**
 * 文件上传（multipart/form-data，文件字段名默认 file）
 * @param {String} url 请求地址
 * @param {String} filePath 本地临时路径（非 JSON 字段；由运行时读取为二进制上传）
 * @param {Object} formData 额外表单字段
 * @param {Object} options 上传选项（name: 文件字段名；method: HTTP 方法，默认 POST）
 */
export function upload(url, filePath, formData = {}, options = {}) {
	const httpMethod = resolveUploadHttpMethod(options);

	return prepareUploadFile(filePath, options).then((prepared) => {
		if (options.loading !== false) {
			uni.showLoading({ title: options.loadingText || '上传中...', mask: true });
		}

		const fullUrl = url.startsWith('http') ? url : config.baseURL + url;
		const requestId = createRequestId();
		const startTime = Date.now();
		const context = {
			requestId,
			url,
			fullUrl,
			startTime,
			filePath,
			formData
		};

		// App 端在 uploadByPlusNativeXHR 内二次打日志（含 fileBytes）；其它端此处打日志
		if (!isAppPlusRuntime() || prepared.mode !== 'uploadFile') {
			logRequest('send', {
				requestId,
				path: url,
				url: fullUrl,
				method: httpMethod,
				uploadMode: prepared.mode,
				localFilePath: filePath,
				header: buildUploadHeaders(options.header),
				...buildUploadLogPayload(prepared, formData, options)
			});
		}

		if (isMockEnabled()) {
			return mockUpload({ url, filePath, formData, token: getToken() }).then((res) => {
				if (options.loading !== false) {
					uni.hideLoading();
				}
				logRequest('success', {
					requestId,
					path: url,
					url: fullUrl,
					method: 'UPLOAD',
					duration: getDuration(startTime),
					statusCode: 200,
					responseData: res,
					filePath,
					formData,
					response: { data: res, statusCode: 200, mock: true }
				});
				return res;
			}).catch((error) => {
				if (options.loading !== false) {
					uni.hideLoading();
				}
				if (error.code === 401) {
					handleUnauthorized();
					return Promise.reject({ message: '登录已过期，请重新登录', code: 401 });
				}
				if (!options.silent) {
					showError(error.msg || error.message || '上传失败');
				}
				return Promise.reject(error);
			});
		}

		// PUT 等非 POST：uni.uploadFile 仅支持 POST，统一走 FormData + XHR
		if (mustUseXHRMultipart(options)) {
			// #ifdef H5
			if (prepared.mode === 'formData') {
				return uploadByFormData(fullUrl, prepared, formData, options, context);
			}
			// #endif
			if (isAppPlusRuntime() && prepared.mode === 'uploadFile') {
				return uploadByPlusNativeXHR(fullUrl, prepared, formData, options, context);
			}
			return uploadByFormDataFromPath(fullUrl, prepared, formData, options, context);
		}

		// H5 blob 路径：浏览器 FormData + XHR
		// #ifdef H5
		if (prepared.mode === 'formData') {
			return uploadByFormData(fullUrl, prepared, formData, options, context);
		}
		// #endif

		if (isAppPlusRuntime() && prepared.mode === 'uploadFile' && needsCustomMultipartFileName(options, prepared, filePath)) {
			return uploadByFormDataFromPath(fullUrl, prepared, formData, options, context);
		}

		if (needsCustomMultipartFileName(options, prepared, filePath) && prepared.mode === 'uploadFile') {
			return uploadByFormDataFromPath(fullUrl, prepared, formData, options, context);
		}

		// App / 小程序 / H5 本地路径：优先 uni.uploadFile（官方 multipart 实现）
		return uploadByUniUploadFile(fullUrl, prepared, formData, options, context);
	});
}

export default { get, post, put, del, upload };
