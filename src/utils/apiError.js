/**
 * Standardized API Error Handling Helper for SYS-AIR Route Handlers
 * Bắt lỗi Google API, Gemini AI, Mongoose và trả về phản hồi chuẩn xác cho client
 */

import { NextResponse } from 'next/server';
import logger from './logger';

/**
 * Xử lý lỗi trong API Route Handler và trả về NextResponse chuẩn
 * @param {string} tag - Tag phân loại (VD: 'DRIVE', 'GEMINI', 'AUTH')
 * @param {Error|any} error - Đối tượng lỗi
 * @param {string} defaultMessage - Thông báo mặc định nếu không nhận diện được lỗi
 * @returns {NextResponse}
 */
export function handleApiError(tag, error, defaultMessage = 'Đã có lỗi xảy ra trên máy chủ.') {
    logger.error(tag, defaultMessage, error);

    let statusCode = 500;
    let userMessage = defaultMessage;
    let errorCode = 'INTERNAL_SERVER_ERROR';

    const errStr = error?.message || String(error || '');

    // 1. Lỗi Google Drive API
    if (errStr.includes('Google Drive') || error?.code === 403 || error?.code === 404 || error?.errors?.[0]?.domain === 'usageLimits') {
        errorCode = 'GOOGLE_DRIVE_ERROR';
        if (errStr.includes('File not found') || error?.code === 404) {
            statusCode = 404;
            userMessage = 'Không tìm thấy tệp hoặc thư mục trên Google Drive.';
        } else if (errStr.includes('quota') || errStr.includes('User Rate Limit Exceeded')) {
            statusCode = 429;
            userMessage = 'Hạn ngạch Google Drive của tài khoản đã vượt giới hạn tạm thời. Vui lòng thử lại sau ít phút.';
        } else if (error?.code === 403 || errStr.includes('permission')) {
            statusCode = 403;
            userMessage = 'Service Account chưa được cấp quyền truy cập vào thư mục Google Shared Drive này.';
        } else {
            statusCode = error?.code || 502;
            userMessage = `Lỗi kết nối dịch vụ Google Drive: ${error.message || ''}`;
        }
    }
    // 2. Lỗi Google Gemini AI API
    else if (errStr.includes('Gemini') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('API_KEY')) {
        errorCode = 'GEMINI_AI_ERROR';
        if (errStr.includes('API_KEY_INVALID') || errStr.includes('API key not valid')) {
            statusCode = 401;
            userMessage = 'API Key của Gemini AI không hợp lệ hoặc đã bị vô hiệu hóa.';
        } else if (errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('quota')) {
            statusCode = 429;
            userMessage = 'Đã hết hạn ngạch gọi Gemini AI hôm nay. Hệ thống đã kích hoạt chế độ phân bổ ảnh dự phòng an toàn.';
        } else {
            statusCode = 502;
            userMessage = 'Không thể kết nối đến mô hình Gemini Vision AI.';
        }
    }
    // 3. Lỗi Mongoose / MongoDB
    else if (error?.name === 'ValidationError') {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
        userMessage = `Dữ liệu không hợp lệ: ${Object.values(error.errors || {}).map(e => e.message).join(', ')}`;
    } else if (error?.name === 'CastError') {
        statusCode = 400;
        errorCode = 'INVALID_ID';
        userMessage = 'Mã định danh (ID) không đúng định dạng.';
    }
    // 4. Lỗi tự định nghĩa từ ứng dụng
    else if (error?.statusCode || error?.status) {
        statusCode = error.statusCode || error.status;
        userMessage = error.message || defaultMessage;
        errorCode = error.code || 'APPLICATION_ERROR';
    }

    return NextResponse.json(
        {
            status: 1, // Status 1 = thất bại (chuẩn của hệ thống SYS-AIR)
            success: false,
            code: errorCode,
            mes: userMessage,
            error: process.env.NODE_ENV !== 'production' ? errStr : undefined,
            timestamp: new Date().toISOString()
        },
        { status: statusCode }
    );
}

export default handleApiError;
