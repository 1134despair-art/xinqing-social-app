/**
 * C端消息中心 API。
 */
import { get, post } from '@/utils/request';
import { normalizePageResult } from '@/utils/apiAdapter';

function getTypeLabel(eventType, isActorMine) {
	if (isActorMine) {
		switch (String(eventType || '').toUpperCase()) {
			case 'LIKE': return '我点赞';
			case 'COMMENT': return '我评论';
			case 'REPLY': return '我回复';
			default: return '我发出的';
		}
	}
	switch (String(eventType || '').toUpperCase()) {
		case 'LIKE': return '点赞我';
		case 'COMMENT': return '评论我';
		case 'REPLY': return '回复我';
		case 'SYSTEM': return '系统消息';
		default: return '互动消息';
	}
}

function normalizeMessage(raw = {}) {
	if (!raw || typeof raw !== 'object') return raw;
	const type = String(raw.category || '').toUpperCase() === 'SYSTEM' ? 'system' : 'comment';
	const eventType = String(raw.eventType || '').toUpperCase();
	const contentId = raw.contentId != null ? raw.contentId : raw.targetId;
	const isActorMine = raw.isActorMine === true || raw.isActorMine === 1;
	return {
		...raw,
		id: raw.messageId != null ? raw.messageId : raw.id,
		type,
		typeLabel: getTypeLabel(eventType, isActorMine),
		eventType,
		isActorMine,
		actorNickName: raw.actorNickName || '',
		actorAvatar: raw.actorAvatar || '',
		contentPreview: raw.contentPreview || '',
		contentAuthorUserId: raw.contentAuthorUserId || null,
		contentAuthorNickName: raw.contentAuthorNickName || '',
		commentText: raw.content || raw.contentPreview || '',
		title: raw.title || '',
		desc: raw.content || raw.contentPreview || '',
		postId: contentId,
		read: Number(raw.readStatus) === 1,
		createdAt: raw.createTime || raw.eventTime || ''
	};
}

export async function getMessageList(params = {}, options = {}) {
	const res = await get('/api/messages', {
		category: params.category || 'all',
		pageNum: params.pageNum || 1,
		pageSize: params.pageSize || 20
	}, options);
	return normalizePageResult(res, normalizeMessage);
}

export async function getUnreadMessageCount(options = {}) {
	const res = await get('/api/messages/unread-count', {}, options);
	return res && res.data ? res.data : { total: 0, comment: 0, system: 0 };
}

export function markMessageRead(messageId, options = {}) {
	return post(`/api/messages/${messageId}/read`, {}, options);
}

export function markAllMessagesRead(category = 'all', options = {}) {
	return post(`/api/messages/read-all?category=${encodeURIComponent(category || 'all')}`, {}, options);
}
