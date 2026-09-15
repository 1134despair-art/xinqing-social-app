export function openUserProfile(user = {}, currentUserId = '') {
	const userId = user.userId != null ? user.userId : user.id;
	if (userId == null || userId === '') {
		return false;
	}

	if (currentUserId !== '' && currentUserId != null && String(userId) === String(currentUserId)) {
		uni.navigateTo({ url: '/pages/profile/sub?tab=posts' });
		return true;
	}

	const params = [`tab=posts`, `userId=${encodeURIComponent(String(userId))}`];
	const nickname = user.nickname || user.nickName || '';
	const avatar = user.avatar || '';
	if (nickname) {
		params.push(`nickname=${encodeURIComponent(nickname)}`);
	}
	if (avatar) {
		params.push(`avatar=${encodeURIComponent(avatar)}`);
	}

	uni.navigateTo({ url: `/pages/profile/sub?${params.join('&')}` });
	return true;
}
