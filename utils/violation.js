const VIOLATION_WORDS = ['违禁', '赌博', '色情', '暴力'];

export function detectViolationWords(text) {
	if (!text || !text.trim()) return [];
	const lower = text.toLowerCase();
	return VIOLATION_WORDS.filter(word => lower.includes(word.toLowerCase()));
}
