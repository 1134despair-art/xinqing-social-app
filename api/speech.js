import { post } from '@/utils/request';

export async function getTencentRealtimeSpeechCredential(data = {}, options = {}) {
	return post('/api/app/speech/tencent-sts', data, {
		loading: false,
		silent: true,
		...options
	});
}
