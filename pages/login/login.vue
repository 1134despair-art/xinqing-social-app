<template>
	<view class="login-page">
		<view class="login-shell">
			<view class="outer-frame">
				<view class="auth-card">
					<view class="auth-hero">
						<view class="welcome-logo">
							<image class="welcome-logo-icon" src="/static/images/icon.png" mode="aspectFit" />
						</view>
						<text class="welcome-brand-cn">橘子圆梦</text>
						<text class="welcome-brand-en">ORANGE BUBBLE</text>
						<text class="welcome-title">欢迎登录</text>
						<text class="welcome-subtitle">手机号验证码快速登录</text>
					</view>

					<view class="auth-divider"></view>

					<view class="login-panel">
						<view class="panel-head">
							<text class="panel-title">手机号登录</text>
							<text class="panel-desc">请输入手机号和验证码</text>
						</view>

						<view class="form">
							<view class="field-block">
								<text class="form-label">手机号</text>
								<view class="field-box" :class="{ 'is-filled': !!phone }">
									<text class="field-icon">📱</text>
									<input id="mobile" class="form-input" type="number" v-model="phone" maxlength="11"
										placeholder="请输入11位手机号" :adjust-position="false" @input="onPhoneInput" />
								</view>
								<text class="field-tip">仅支持中国大陆 11 位手机号登录。</text>
							</view>

							<view class="field-block">
								<text class="form-label">验证码</text>
								<view class="field-box code-field-box" :class="{ 'is-filled': !!code }">
									<text class="field-icon">🔐</text>
									<input id="code" class="form-input code-input" type="number" v-model="code" maxlength="6"
										placeholder="请输入6位验证码" :adjust-position="false" />
									<button type="default" class="code-btn" :disabled="countdown > 0 || !isPhoneValid" @click="sendCode">
										{{ countdown > 0 ? `${countdown}s 后重发` : '获取验证码' }}
									</button>
								</view>
							</view>

							<view class="form-meta">
								<view class="checkbox-label" @click="toggleAgreed">
									<checkbox :checked="agreed" color="#a78bfa" @click.stop="toggleAgreed" />
									<text class="checkbox-prefix">我已阅读并同意</text>
									<text class="agreement-link" @click.stop="openUserAgreement">《用户协议》</text>
									<text class="agreement-separator">和</text>
									<text class="agreement-link" @click.stop="openPrivacyPolicy">《隐私政策》</text>
								</view>
							</view>

							<button type="default" class="login-btn" :disabled="!canLogin || !agreed || loading" :loading="loading"
								@click="handleLogin">
								<text v-if="!loading" class="login-btn-arrow">→</text>
								<text>{{ loading ? '登录中...' : '立即登录' }}</text>
							</button>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { sendSmsCode, login } from '@/api/auth';
import store from '@/store';

export default {
	name: 'LoginPage',
	data() {
		return {
			phone: '',
			code: '',
			countdown: 0,
			agreed: false,
			loading: false,
			timer: null
		};
	},
	computed: {
		isPhoneValid() {
			return /^1\d{10}$/.test(this.phone);
		},
		canLogin() {
			return this.isPhoneValid && this.code.length >= 1 && !this.loading;
		}
	},
	onShow() {
		const token = uni.getStorageSync('token') || '';
		if (token) {
			uni.switchTab({ url: '/pages/index/index' });
		}
	},
	beforeDestroy() {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
	},
	methods: {
		onPhoneInput(e) {
			this.phone = e.detail.value;
		},
		toggleAgreed() {
			this.agreed = !this.agreed;
		},
		async sendCode() {
			if (this.countdown > 0) return;
			if (!this.isPhoneValid) {
				uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
				return;
			}
			try {
				await sendSmsCode(this.phone);
				uni.showToast({ title: '验证码已发送', icon: 'success' });
				this.startCountdown();
			} catch (err) {
				uni.showToast({
					title: (err && err.message) || '验证码发送失败，请稍后重试',
					icon: 'none'
				});
			}
		},
		startCountdown() {
			this.countdown = 60;
			this.timer = setInterval(() => {
				this.countdown--;
				if (this.countdown <= 0) {
					clearInterval(this.timer);
					this.timer = null;
				}
			}, 1000);
		},
		async handleLogin() {
			if (!this.canLogin || !this.agreed) return;
			if (!this.isPhoneValid) {
				uni.showToast({ title: '请输入正确手机号', icon: 'none' });
				return;
			}
			if (!this.code) {
				uni.showToast({ title: '请输入验证码', icon: 'none' });
				return;
			}
			this.loading = true;
			try {
				const res = await login(this.phone, this.code);
				const token = res.token || res.data;
				if (!token) {
					throw new Error('登录未返回有效 token');
				}
				store.actions.login({
					userInfo: res.userProfile || {},
					token
				});
				uni.showToast({ title: '登录成功', icon: 'success' });
				setTimeout(() => {
					uni.switchTab({ url: '/pages/index/index' });
				}, 500);
			} catch (err) {
				if (err && err.code !== 401) {
					console.error('登录失败:', err);
				}
				uni.showToast({ title: (err && err.message) || '登录失败', icon: 'none' });
			} finally {
				this.loading = false;
			}
		},
		openUserAgreement() {
			uni.navigateTo({ url: '/pages/settings/about?type=agreement' });
		},
		openPrivacyPolicy() {
			uni.navigateTo({ url: '/pages/settings/about?type=privacy' });
		}
	}
};
</script>

<style lang="scss" scoped>
/* 对齐 H5 /login：login-page > login-shell > outer-frame > auth-card */
.login-page {
	width: 100%;
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	align-items: stretch;
	justify-content: center;
	padding-top: calc(env(safe-area-inset-top) + 32rpx);
	padding-bottom: calc(env(safe-area-inset-bottom) + 32rpx);
	box-sizing: border-box;
	background: #fffcfd;
}

.login-shell {
	flex: 1;
	width: 100%;
	min-width: 0;
	align-self: stretch;
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
}

.outer-frame {
	flex: 1;
	width: 100%;
	min-width: 0;
	align-self: stretch;
	display: flex;
	flex-direction: column;
	padding: 24rpx;
	border-radius: 64rpx;
	background: #fffcfd;
	border: 1rpx solid #f2ebf7;
	box-sizing: border-box;
}

.auth-card {
	flex: 1;
	width: 100%;
	min-width: 0;
	align-self: stretch;
	display: flex;
	flex-direction: column;
	padding: 48rpx;
	border-radius: 56rpx;
	background: #fffdfd;
	border: 1rpx solid #f1ebf6;
	box-sizing: border-box;
	overflow: hidden;
}

.auth-hero {
	min-height: 376rpx;
	border-radius: 44rpx;
	background: linear-gradient(180deg, #fff0f5 0%, #f3e8ff 100%);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	padding: 64rpx 48rpx;
	box-sizing: border-box;
}

.welcome-logo {
	width: 112rpx;
	height: 112rpx;
	border-radius: 36rpx;
	background: #ffffff;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 16rpx 40rpx rgba(167, 139, 250, 0.12);
}

.welcome-logo-icon {
	width: 100%;
	height: 100%;
	border-radius: 36rpx;
}

.welcome-brand-cn {
	margin-top: 36rpx;
	font-size: 28rpx;
	font-weight: 500;
	color: #2d2640;
	letter-spacing: 0.04em;
}

.welcome-brand-en {
	margin-top: 8rpx;
	font-size: 24rpx;
	font-weight: 400;
	color: #594f70;
	letter-spacing: 0.14em;
}

.welcome-title {
	margin-top: 28rpx;
	font-size: 44rpx;
	font-weight: 600;
	color: #2d2640;
	line-height: 1.3;
}

.welcome-subtitle {
	margin-top: 16rpx;
	font-size: 26rpx;
	line-height: 1.6;
	color: #594f70;
	font-weight: 500;
}

.auth-divider {
	height: 1rpx;
	margin-top: 40rpx;
	background: linear-gradient(90deg, rgba(232, 222, 255, 0) 0%, #e8deff 50%, rgba(232, 222, 255, 0) 100%);
}

.login-panel {
	flex: 1;
	min-height: 0;
	padding-top: 56rpx;
	box-sizing: border-box;
}

.panel-head {
	margin-bottom: 48rpx;
}

.panel-title {
	display: block;
	font-size: 36rpx;
	font-weight: 600;
	color: #2d2640;
	line-height: 1.35;
}

.panel-desc {
	display: block;
	margin-top: 12rpx;
	font-size: 26rpx;
	line-height: 1.6;
	color: #8b80a0;
}

.form {
	display: flex;
	flex-direction: column;
	gap: 40rpx;
}

.field-block {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.form-label {
	font-size: 28rpx;
	font-weight: 500;
	color: #594f70;
}

.field-box {
	display: flex;
	align-items: center;
	min-height: 96rpx;
	padding: 0 32rpx;
	border-radius: 24rpx;
	border: 1rpx solid #e8deff;
	background: #f9f5ff;
	box-sizing: border-box;
}

.field-box.is-filled {
	background: #ffffff;
	border-color: #d8ccf0;
}

.field-icon {
	flex-shrink: 0;
	margin-right: 16rpx;
	font-size: 36rpx;
	color: #8b80a0;
}

.form-input {
	flex: 1;
	width: 100%;
	height: 96rpx;
	border: none;
	background: transparent;
	font-size: 30rpx;
	color: #2d2640;
	box-sizing: border-box;
}

.code-field-box {
	padding-right: 24rpx;
}

.code-input {
	flex: 1;
	min-width: 0;
}

.code-btn {
	min-width: 220rpx;
	flex-shrink: 0;
	height: 72rpx;
	line-height: 72rpx;
	padding: 0 28rpx;
	margin: 0;
	border: none;
	border-radius: 16rpx;
	background: #f3e8ff;
	color: #a78bfa;
	font-size: 26rpx;
	font-weight: 500;

	&::after {
		border: none;
	}

	&[disabled] {
		background: #f2f0f5;
		color: #8b80a0;
		opacity: 1;
	}
}

.field-tip {
	font-size: 24rpx;
	color: #8b80a0;
	line-height: 1.6;
}

.form-meta {
	display: flex;
	align-items: center;
	margin-top: 8rpx;
}

.checkbox-label {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 4rpx;
}

.checkbox-prefix,
.agreement-separator {
	font-size: 24rpx;
	color: #8b80a0;
	line-height: 1.6;
}

.agreement-link {
	font-size: 24rpx;
	color: #a78bfa;
	line-height: 1.6;
}

.login-btn {
	width: 100%;
	height: 96rpx;
	padding: 0;
	margin: 8rpx 0 0;
	border: none;
	border-radius: 24rpx;
	background: linear-gradient(90deg, #f9a8d4 0%, #a78bfa 100%);
	color: #ffffff;
	font-size: 32rpx;
	font-weight: 500;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 16rpx;
	box-shadow: 0 8rpx 24rpx rgba(167, 139, 250, 0.25);

	&::after {
		border: none;
	}

	&[disabled] {
		opacity: 0.4;
		box-shadow: none;
		color: #ffffff;
		background: linear-gradient(90deg, #f9a8d4 0%, #a78bfa 100%);
	}
}

.login-btn-arrow {
	font-size: 32rpx;
	line-height: 1;
}
</style>
