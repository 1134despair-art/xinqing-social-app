/**
 * 举报相关 API（C端接口文档）
 */
import { post } from '@/utils/request';
import { mapReportPayload } from '@/utils/apiAdapter';

/**
 * 提交举报
 * POST /api/reports
 */
export function submitReport(data) {
	return post('/api/reports', mapReportPayload(data));
}
