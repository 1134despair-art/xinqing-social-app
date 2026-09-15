const TYPE_ALIAS = {
	TEXT: 'TEXT',
	TIMTEXTELEM: 'TEXT',
	IMAGE: 'IMAGE',
	TIMIMAGEELEM: 'IMAGE',
	PIC: 'IMAGE',
	IMG: 'IMAGE',
	PHOTO: 'IMAGE',
	VIDEO: 'VIDEO',
	TIMVIDEOFILEELEM: 'VIDEO',
	AUDIO: 'AUDIO',
	SOUND: 'AUDIO',
	TIMSOUNDELEM: 'AUDIO',
	FILE: 'FILE',
	TIMFILEELEM: 'FILE',
	RICH: 'RICH_TEXT',
	RICHTEXT: 'RICH_TEXT',
	RICH_TEXT: 'RICH_TEXT',
	HTML: 'RICH_TEXT',
	MARKDOWN: 'RICH_TEXT',
	CUSTOM: 'CUSTOM',
	TIMCUSTOMELEM: 'CUSTOM'
};

const NUMERIC_TYPE = {
	1: 'TEXT',
	2: 'IMAGE',
	3: 'FILE',
	4: 'AUDIO',
	5: 'VIDEO'
};

function tryParseJson(value) {
	if (value && typeof value === 'object') return value;
	const text = String(value == null ? '' : value).trim();
	if (!text || (text[0] !== '{' && text[0] !== '[')) return null;
	try {
		return JSON.parse(text);
	} catch (e) {
		return null;
	}
}

function firstString(...values) {
	for (let i = 0; i < values.length; i += 1) {
		const value = values[i];
		if (value != null && String(value).trim()) return String(value).trim();
	}
	return '';
}

function isHttpUrl(value) {
	return /^https?:\/\//i.test(String(value || '').trim());
}

function isImageUrl(value) {
	const url = String(value || '').split('?')[0].toLowerCase();
	return isHttpUrl(value) && /\.(png|jpe?g|gif|webp|bmp|heic|svg)$/i.test(url);
}

function looksLikeHtml(value) {
	return /<\/?[a-z][\s\S]*>/i.test(String(value || ''));
}

function looksLikeMarkdown(value) {
	const text = String(value || '');
	return /!\[[^\]]*\]\([^)]+\)/.test(text) || /\[[^\]]+\]\([^)]+\)/.test(text);
}

function escapeHtml(value) {
	return String(value || '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

export function extractHtmlImages(html) {
	const list = [];
	const re = /<img[^>]+src=["']([^"']+)["']/gi;
	let match = re.exec(html);
	while (match) {
		if (match[1]) list.push(match[1]);
		match = re.exec(html);
	}
	return list;
}

function markdownToHtml(markdown) {
	let html = escapeHtml(markdown);
	html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
	html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
	html = html.replace(/\n/g, '<br/>');
	return html;
}

function decorateHtml(html) {
	return String(html || '').replace(/<img\b/gi, '<img style="max-width:100%;height:auto;display:block;margin:8px 0;"');
}

function pickFromImageArray(arr = []) {
	if (!Array.isArray(arr) || !arr.length) return '';
	const typeOf = (item) => {
		if (!item) return 99;
		if (item.Type != null) return Number(item.Type);
		if (item.type != null) return Number(item.type);
		return 99;
	};
	const origin = arr.find((item) => typeOf(item) === 1) || arr.find((item) => typeOf(item) === 0);
	const large = arr.find((item) => typeOf(item) === 2);
	const best = origin || large || arr[0] || {};
	return firstString(best.url, best.URL);
}

function pickMediaUrl(obj = {}) {
	if (!obj || typeof obj !== 'object') return '';
	const direct = firstString(
		obj.url,
		obj.URL,
		obj.imageUrl,
		obj.imgUrl,
		obj.src,
		obj.fileUrl,
		obj.videoUrl,
		obj.audioUrl,
		obj.ossUrl,
		obj.path,
		obj.remoteUrl
	);
	if (isHttpUrl(direct)) return direct;
	return pickFromImageArray(obj.imageInfoArray || obj.ImageInfoArray || []);
}

function normalizeType(rawType) {
	if (rawType == null || rawType === '') return 'TEXT';
	if (NUMERIC_TYPE[rawType] != null) return NUMERIC_TYPE[rawType];
	const key = String(rawType).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
	return TYPE_ALIAS[key] || String(rawType).toUpperCase();
}

function fromCustomPayload(obj, fallbackText) {
	const src = String(obj.src != null ? obj.src : obj.Src || '');
	const html = firstString(obj.html, obj.HTML, obj.richText, obj.rich_text);
	const text = firstString(obj.content, obj.text, obj.Text, obj.desc, obj.description, fallbackText);
	const url = pickMediaUrl(obj);

	if (src === '30' || obj.markdown || looksLikeMarkdown(text)) {
		const source = firstString(obj.content, obj.markdown, text);
		return { displayType: 'RICH_TEXT', html: decorateHtml(markdownToHtml(source)), payload: { url, name: obj.name }, text: source };
	}
	if (html || looksLikeHtml(text)) {
		return { displayType: 'RICH_TEXT', html: decorateHtml(html || text), payload: { url, name: obj.name }, text };
	}
	if (url && (isImageUrl(url) || obj.msgType === 'IMAGE' || src === '2')) {
		return { displayType: 'IMAGE', payload: { ...obj, url }, text };
	}
	if (url && /\.(mp4|mov|m3u8)(\?|$)/i.test(url)) {
		return { displayType: 'VIDEO', payload: { ...obj, url }, text };
	}
	if (url) {
		return { displayType: 'FILE', payload: { ...obj, url, name: obj.name || obj.fileName || '附件' }, text };
	}
	return { displayType: 'TEXT', payload: obj, text };
}

function fromTimElement(msgType, msgContent, extra = {}) {
	const type = normalizeType(msgType);
	const content = msgContent && typeof msgContent === 'object' ? msgContent : tryParseJson(msgContent) || {};
	if (type === 'IMAGE') {
		const url = pickMediaUrl(content);
		return { displayType: 'IMAGE', payload: { ...content, url }, text: extra.content || '' };
	}
	if (type === 'VIDEO') {
		const url = firstString(content.remoteVideoUrl, content.videoUrl, pickMediaUrl(content));
		return { displayType: 'VIDEO', payload: { ...content, url }, text: extra.content || '' };
	}
	if (type === 'AUDIO' || type === 'FILE') {
		const url = firstString(content.remoteUrl, content.url, content.URL, pickMediaUrl(content));
		return {
			displayType: type === 'AUDIO' ? 'AUDIO' : 'FILE',
			payload: { ...content, url, name: content.fileName || content.name || (type === 'AUDIO' ? '语音附件' : '附件') },
			text: extra.content || ''
		};
	}
	if (type === 'RICH_TEXT') {
		const html = firstString(content.html, content.HTML, content.Data, content.data, content.Text, content.text);
		return { displayType: 'RICH_TEXT', html: decorateHtml(looksLikeMarkdown(html) ? markdownToHtml(html) : html), payload: content, text: html };
	}
	if (type === 'CUSTOM') {
		const data = tryParseJson(content.Data || content.data) || content;
		return fromCustomPayload(data, firstString(content.Desc, content.desc, content.description));
	}
	const text = firstString(content.Text, content.text, content.content, extra.content);
	if (looksLikeHtml(text)) {
		return { displayType: 'RICH_TEXT', html: decorateHtml(text), payload: content, text };
	}
	return { displayType: 'TEXT', payload: content, text };
}

export function parseImMessage(item = {}) {
	let msgType = item.msgType != null ? item.msgType : item.MsgType;
	let content = item.content != null ? item.content : (item.msgContent != null ? item.msgContent : item.MsgContent);
	if (content && typeof content === 'object') {
		if (content.MsgType || content.msgType) {
			return fromTimElement(content.MsgType || content.msgType, content.MsgContent || content.msgContent || content, item);
		}
		content = JSON.stringify(content);
	}

	const parsed = tryParseJson(content);
	if (Array.isArray(parsed) && parsed[0] && (parsed[0].MsgType || parsed[0].msgType)) {
		const first = parsed[0];
		return fromTimElement(first.MsgType || first.msgType, first.MsgContent || first.msgContent || first.content, item);
	}
	if (parsed && (parsed.MsgType || parsed.msgType) && (parsed.MsgContent || parsed.msgContent)) {
		return fromTimElement(parsed.MsgType || parsed.msgType, parsed.MsgContent || parsed.msgContent, item);
	}

	const type = normalizeType(msgType);
	if (parsed && typeof parsed === 'object') {
		if (type === 'CUSTOM') return fromCustomPayload(parsed, String(content || ''));
		const mediaUrl = pickMediaUrl(parsed);
		if (type === 'IMAGE' || isImageUrl(mediaUrl)) {
			return {
				displayType: 'IMAGE',
				payload: { ...parsed, url: mediaUrl },
				text: firstString(parsed.text, parsed.Text, parsed.content, content)
			};
		}
		if (type === 'RICH_TEXT' || looksLikeHtml(parsed.html || parsed.content || parsed.text)) {
			const html = firstString(parsed.html, parsed.content, parsed.text, content);
			return { displayType: 'RICH_TEXT', html: decorateHtml(html), payload: parsed, text: html };
		}
		if (type === 'TEXT' && looksLikeHtml(parsed.text || parsed.Text || parsed.content)) {
			const html = firstString(parsed.html, parsed.text, parsed.Text, parsed.content);
			return { displayType: 'RICH_TEXT', html: decorateHtml(html), payload: parsed, text: html };
		}
		if (type === 'VIDEO' || type === 'AUDIO' || type === 'FILE') {
			return { displayType: type, payload: { ...parsed, url: mediaUrl, name: parsed.name || parsed.fileName }, text: content };
		}
		if (mediaUrl && type !== 'TEXT') {
			return { displayType: type || 'FILE', payload: { ...parsed, url: mediaUrl, name: parsed.name || parsed.fileName }, text: content };
		}
	}

	const text = String(content == null ? '' : content);
	if (type === 'IMAGE') {
		const url = pickMediaUrl(parsed) || (isImageUrl(text) ? text : '') || extractHtmlImages(text)[0];
		if (url) return { displayType: 'IMAGE', payload: { url }, text };
		if (looksLikeHtml(text)) {
			return { displayType: 'RICH_TEXT', html: decorateHtml(text), payload: parsed || {}, text };
		}
	}
	if (isImageUrl(text)) {
		return { displayType: 'IMAGE', payload: { url: text }, text };
	}
	if (type === 'VIDEO') {
		return { displayType: 'VIDEO', payload: { url: pickMediaUrl(parsed) || (isHttpUrl(text) ? text : '') }, text };
	}
	if (type === 'AUDIO' || type === 'FILE') {
		return { displayType: type, payload: { url: pickMediaUrl(parsed) || (isHttpUrl(text) ? text : ''), name: text }, text };
	}
	if (type === 'RICH_TEXT' || looksLikeHtml(text)) {
		return { displayType: 'RICH_TEXT', html: decorateHtml(text), payload: parsed || {}, text };
	}
	if (looksLikeMarkdown(text)) {
		return { displayType: 'RICH_TEXT', html: decorateHtml(markdownToHtml(text)), payload: {}, text };
	}
	if (type === 'CUSTOM') {
		return fromCustomPayload(parsed || {}, text);
	}
	return { displayType: 'TEXT', payload: parsed || {}, text };
}
