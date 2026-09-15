<template>
	<view class="edit-profile-page" :style="formKeyboardPadStyle">
		<view class="page-content">
			<view class="form-card">
				<text class="edit-section-title">账号基础信息</text>
				<text class="editor-label">用户ID</text>
				<input class="editor-input disabled-input" :value="form.userId || '未获取到用户ID'" disabled />
				<view id="edit-nickname-field" class="edit-field-block">
					<text class="editor-label">昵称</text>
					<input
						class="editor-input"
						type="text"
						:value="form.nickname"
						placeholder="请输入昵称（2-16个字符）"
						maxlength="16"
						:adjust-position="false"
						@focus="onFormFieldFocus('edit-nickname-field')"
						@keyboardheightchange="onKeyboardHeightChange"
						@input="onNicknameInput"
					/>
				</view>

				<text class="edit-section-title">个人资料编辑</text>
				<text class="editor-label">头像</text>
				<view class="avatar-upload-row" @click="chooseAvatar">
					<view class="avatar-preview">
						<image
							v-if="isImageAvatar(form.avatar)"
							class="avatar-preview-img"
							:src="form.avatar"
							mode="aspectFill"
						/>
						<text v-else>{{ getDisplayAvatar(form.avatar) }}</text>
					</view>
					<text class="avatar-upload-tip">点击更换头像</text>
				</view>
				<text class="editor-label">性别 <text class="required-mark">*</text></text>
				<view class="sex-selector">
					<view
						class="sex-option"
						:class="{ active: form.sex === 1 }"
						@click="form.sex = 1"
					>
						<text>男</text>
					</view>
					<view
						class="sex-option"
						:class="{ active: form.sex === 2 }"
						@click="form.sex = 2"
					>
						<text>女</text>
					</view>
				</view>
				<view id="edit-age-field" class="edit-field-block">
					<text class="editor-label">年龄 <text class="required-mark">*</text></text>
					<input
						class="editor-input"
						type="number"
						:value="form.age"
						placeholder="请输入年龄（1-120）"
						min="1"
						max="120"
						:adjust-position="false"
						@focus="onFormFieldFocus('edit-age-field')"
						@keyboardheightchange="onKeyboardHeightChange"
						@input="onAgeInput"
					/>
				</view>
				<view id="edit-signature-field" class="edit-field-block">
					<text class="editor-label">简介</text>
					<textarea
						class="feedback-input"
						:value="form.signature"
						placeholder="请输入个人简介（最多100字）"
						maxlength="100"
						:adjust-position="false"
						@focus="onFormFieldFocus('edit-signature-field')"
						@keyboardheightchange="onKeyboardHeightChange"
						@input="onSignatureInput"
					/>
				</view>
				<button
					class="save-btn"
					:disabled="saving"
					hover-class="save-btn-hover"
					@click="handleSave"
				>
					{{ saving ? '保存中...' : '保存资料' }}
				</button>
			</view>
		</view>
	</view>
</template>

<script>
import { getUserProfile, updateProfile, changeAvatar } from '@/api/user';
import { getDisplayAvatar, isImageAvatar } from '@/utils/avatar';
import { formKeyboardMixin } from '@/utils/keyboard';
import { chooseAvatarImage } from '@/utils/chooseImage';

export default {
	name: 'EditProfile',
	mixins: [formKeyboardMixin],
	data() {
		return {
			form: {
				userId: '',
				avatar: '',
				nickname: '',
				signature: '',
				sex: 0,
				age: ''
			},
			saving: false
		};
	},
	onLoad() {
		this.loadProfile();
	},
	methods: {
		applyProfileForm(data = {}) {
			const userId = data.userId != null ? data.userId : (data.id != null ? data.id : (data.uid != null ? data.uid : data.memberId));
			this.form.userId = userId != null ? String(userId) : '';
			this.form.avatar = data.avatar || '';
			this.form.nickname = data.nickname || data.nickName || '';
			this.form.signature = data.signature || data.bio || '';
			this.form.sex = data.sex || 0;
			this.form.age = data.age || '';
		},

		isImageAvatar,
		getDisplayAvatar,

		onSignatureInput(e) {
			this.form.signature = (e.detail && e.detail.value) || '';
		},

		onNicknameInput(e) {
			this.form.nickname = (e.detail && e.detail.value) || '';
		},

		onAgeInput(e) {
			const val = e.detail && e.detail.value;
			this.form.age = val === '' ? '' : Number(val);
		},

		/** 加载用户资料 */
		async loadProfile() {
			try {
				const res = await getUserProfile();
				this.applyProfileForm(res.data || {});
			} catch (e) {
				console.error('获取用户资料失败:', e);
			}
		},

		/** 选择头像 */
		async chooseAvatar() {
			try {
				const filePath = await chooseAvatarImage();
				await this.doUploadAvatar(filePath);
			} catch (e) {
				if (e && e.cancelled) return;
			}
		},

		/** 上传头像 */
		async doUploadAvatar(filePath) {
			try {
				const avatarUrl = await changeAvatar(filePath);
				this.form.avatar = avatarUrl || filePath;
				uni.showToast({ title: '头像已更新', icon: 'success' });
			} catch (e) {
				uni.showToast({ title: e.message || '上传失败，请稍后重试', icon: 'none' });
			}
		},

		/** 保存资料 */
		async handleSave() {
			const nickname = (this.form.nickname || '').trim();
			if (!nickname) {
				uni.showToast({ title: '请输入昵称', icon: 'none' });
				return;
			}
			if (nickname.length < 2 || nickname.length > 16) {
				uni.showToast({ title: '昵称长度需为2-16个字符', icon: 'none' });
				return;
			}
			if (!this.form.sex) {
				uni.showToast({ title: '请选择性别', icon: 'none' });
				return;
			}
			const age = this.form.age;
			if (!age || age < 1 || age > 120) {
				uni.showToast({ title: '请输入正确的年龄（1-120）', icon: 'none' });
				return;
			}
			this.saving = true;
			try {
				const res = await updateProfile({
					nickName: nickname,
					bio: (this.form.signature || '').trim(),
					sex: this.form.sex,
					age: Number(age)
				});
				this.applyProfileForm(res.data || {
					userId: this.form.userId,
					nickname,
					signature: this.form.signature,
					sex: this.form.sex,
					age: age
				});
				uni.showToast({ title: '保存成功', icon: 'success' });
				setTimeout(() => {
					uni.navigateBack();
				}, 500);
			} catch (e) {
				console.error('保存失败:', e);
			} finally {
				this.saving = false;
			}
		}
	}
};
</script>

<style lang="scss" scoped>
.edit-profile-page {
	min-height: 100vh;
	background: #f7f1f8;
	padding-bottom: 32rpx;
}

.page-content {
	padding: 24rpx;
}

.form-card {
	background: #ffffff;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	padding: 24rpx;
	min-height: 440rpx;
}

.edit-section-title {
	display: block;
	font-size: 28rpx;
	font-weight: 700;
	color: #57465b;
	margin: 8rpx 0 16rpx;
}

.editor-label {
	display: block;
	font-size: 26rpx;
	color: #7d6e81;
	margin-bottom: 12rpx;
}

.editor-input {
	width: 100%;
	border: 1rpx solid #e5e7f3;
	border-radius: 20rpx;
	padding: 20rpx;
	font-size: 28rpx;
	margin-bottom: 16rpx;
	background: #ffffff;
	line-height: 1.5;
}

.disabled-input {
	background: #f6f7fc;
	color: #8c93b3;
}

.feedback-input {
	width: 100%;
	min-height: 180rpx;
	border: 1rpx solid #e6e6e6;
	border-radius: 20rpx;
	font-size: 28rpx;
	padding: 20rpx;
	background: #ffffff;
	line-height: 1.5;
	margin-bottom: 16rpx;
	box-sizing: border-box;
}

.avatar-upload-row {
	display: flex;
	align-items: center;
	gap: 20rpx;
	margin-bottom: 16rpx;
}

.avatar-preview {
	width: 88rpx;
	height: 88rpx;
	border-radius: 50%;
	background: #f0f3ff;
	color: #5463b8;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 40rpx;
	overflow: hidden;
	flex-shrink: 0;
}

.avatar-preview-img {
	width: 100%;
	height: 100%;
}

.avatar-upload-tip {
	font-size: 26rpx;
	color: #8f6fb0;
}

.save-btn {
	width: 100%;
	margin-top: 24rpx;
	border: none;
	border-radius: 20rpx;
	background: linear-gradient(135deg, #efc2d6 0%, #c9b6f7 100%);
	color: #ffffff;
	font-size: 28rpx;
	padding: 20rpx 0;
	line-height: 1.2;
}

.save-btn::after {
	border: none;
}

.save-btn-hover {
	opacity: 0.92;
}

.save-btn[disabled] {
	opacity: 0.6;
}

.sex-selector {
	display: flex;
	gap: 24rpx;
	margin-bottom: 16rpx;
}

.sex-option {
	flex: 1;
	height: 80rpx;
	border: 1rpx solid #e5e7f3;
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	color: #7d6e81;
	background: #ffffff;
}

.sex-option.active {
	border-color: #8f6fb0;
	background: rgba(143, 111, 176, 0.08);
	color: #8f6fb0;
}

.required-mark {
	color: #ea6f88;
}
</style>
