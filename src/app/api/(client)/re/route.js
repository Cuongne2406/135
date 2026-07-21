import { google } from 'googleapis';

// --- CONFIGURATION ---
const SPREADSHEET_ID = '1Q6SXlW-UMI6xivsADF8X0cWG6IHUNYLx5xU_Jo5xHhk';
const TARGET_SHEET = 'data';

// --- CORS HEADERS ---
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// --- HELPER FUNCTIONS ---

/**
 * Creates a standardized JSON response.
 * @param {number} status - HTTP status code.
 * @param {object} body - The response body.
 * @returns {Response}
 */
function jsonRes(status, body) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
        },
    });
}

/**
 * Normalizes and validates a Vietnamese phone number.
 * @param {string} phone - The raw phone number input.
 * @returns {{isValid: boolean, normalizedPhone: string | null}} - An object indicating validity and the cleaned phone number.
 */
function normalizeAndValidatePhone(phone) {
    if (typeof phone !== 'string' || phone.trim() === '') {
        return { isValid: false, normalizedPhone: null };
    }

    // 1. Remove all non-digit characters (spaces, dots, parentheses, etc.)
    let cleanedPhone = phone.replace(/\D/g, '');

    // 2. Handle cases where the leading '0' is missing (e.g., 987654321)
    if (cleanedPhone.length === 9 && !cleanedPhone.startsWith('0')) {
        cleanedPhone = '0' + cleanedPhone;
    }

    // 3. Handle international format 84...
    if (cleanedPhone.startsWith('84') && cleanedPhone.length === 11) {
        cleanedPhone = '0' + cleanedPhone.substring(2);
    }

    // 4. Use a regular expression to validate the final format.
    // Must be 10 digits, start with 0, followed by a valid prefix (3,5,7,8,9).
    const vietnamPhoneRegex = /^0[35789]\d{8}$/;
    const isValid = vietnamPhoneRegex.test(cleanedPhone);

    return {
        isValid,
        normalizedPhone: isValid ? cleanedPhone : null,
    };
}


/**
 * Authenticates and connects to the Google Sheets API.
 * @returns {Promise<import('googleapis').sheets_v4.Sheets>}
 */
async function getSheets() {
    const scopes = ['https://www.googleapis.com/auth/spreadsheets'];

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        projectId: process.env.GOOGLE_PROJECT_ID,
        scopes,
    });

    return google.sheets({ version: 'v4', auth });
}

// --- API HANDLERS ---

/**
 * Handles OPTIONS requests for CORS preflight.
 */
export async function OPTIONS(req) {
    return new Response(null, { status: 204, headers: corsHeaders });
}

/**
 * Handles POST requests to add new data to the Google Sheet.
 * @param {Request} req - The request object.
 */
export async function POST(req) {
    try {
        const { name, phone, address } = await req.json();

        // 1. Basic validation for required fields
        if (!name || !phone || !address) {
            return jsonRes(400, {
                status: false,
                message: 'Thiếu thông tin. Vui lòng cung cấp đủ name, phone, và address.',
            });
        }

        // 2. Normalize and validate the phone number
        const phoneValidation = normalizeAndValidatePhone(phone);
        if (!phoneValidation.isValid) {
            return jsonRes(400, {
                status: false,
                message: 'Định dạng số điện thoại không hợp lệ. Vui lòng kiểm tra lại.',
            });
        }

        const sheets = await getSheets();

        // Use the validated and normalized phone number
        const newRow = [[name, phoneValidation.normalizedPhone, address, new Date().toISOString()]];

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: TARGET_SHEET,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: newRow,
            },
        });

        return jsonRes(200, { status: true, message: 'Thêm dữ liệu thành công!' });

    } catch (err) {
        console.error('Lỗi khi ghi dữ liệu vào Google Sheets:', err);
        return jsonRes(500, {
            status: false,
            message: 'Đã xảy ra lỗi phía máy chủ khi thêm dữ liệu.',
            error: err.message,
        });
    }
}

