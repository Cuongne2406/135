import { google } from 'googleapis'
import jsonRes, { corsHeaders } from '@/utils/response'

const SPREADSHEET_ID = '1ZQsHUyVD3vmafcm6_egWup9ErXfxIg4U-TfVDgDztb8';
const RANGE_DATA = 'Data!A:L';

async function getSheets(mode = 'read') {
  const scopes = mode === 'read'
    ? ['https://www.googleapis.com/auth/spreadsheets.readonly']
    : ['https://www.googleapis.com/auth/spreadsheets']

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    projectId: process.env.GOOGLE_PROJECT_ID,
    scopes,
  });

  return google.sheets({ version: 'v4', auth })
}

export async function GET() {
  try {
    const sheets = await getSheets('read')
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE_DATA,
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING',
      majorDimension: 'ROWS',
      fields: 'values'
    })

    const rows = data.values ?? []
    if (rows.length < 2) return jsonRes(200, { status: true, mes: 'success', data: [] })

    const headers = rows[0]
    const results = rows.slice(1).map(row => {
      const obj = {}
      headers.forEach((key, idx) => {
        let cell = row[idx] ?? ''
        if (idx === 1) {
          const str = String(cell)
          cell = str && !str.startsWith('0') ? '0' + str : str
        }
        obj[key] = cell
      })
      return obj
    })

    return jsonRes(200, { status: true, mes: 'success', data: results.reverse() })
  } catch (err) {
    return jsonRes(500, { status: false, mes: 'Failed to fetch data from Google Sheets', data: null })
  }
}

export async function POST(req) {
  try {
    const { phone, care, studyTry, study, remove } = await req.json();

    if (!phone) return jsonRes(400, { status: false, mes: 'Thiếu số điện thoại (phone)', data: [] })

    const sheets = await getSheets('write')
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Data!B:B',
      valueRenderOption: 'UNFORMATTED_VALUE',
      majorDimension: 'COLUMNS',
      fields: 'values',
    });
    const normalizePhone = p => {
      const s = String(p).trim();
      return s && s[0] !== '0' ? '0' + s : s;
    }
    const phones = (data.values?.[0] ?? []).map(normalizePhone);
    const target = normalizePhone(phone);
    const idx = phones.findIndex(p => p === target);
    if (idx === -1) return jsonRes(404, { status: false, mes: 'Không tìm thấy phone trong Sheet', data: [] })
    const rowNum = idx + 1

    const { data: oldData } = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `Data!H${rowNum}:K${rowNum}`,
      valueRenderOption: 'UNFORMATTED_VALUE',
      majorDimension: 'ROWS',
      fields: 'values',
    });
    const oldValues = oldData.values?.[0] ?? [];
    const [oldCare = '', oldStudyTry = '', oldStudy = '', oldRemove = ''] = oldValues
    const newCare = care !== undefined ? care : oldCare;
    const newStudyTry = studyTry !== undefined ? studyTry : oldStudyTry;
    const newStudy = study !== undefined ? study : oldStudy;
    const newRemove = remove !== undefined ? remove : oldRemove;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Data!H${rowNum}:K${rowNum}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[newCare, newStudyTry, newStudy, newRemove]] }
    })
    return jsonRes(200, { status: true, mes: 'Đã cập nhật', data: rowNum })
  } catch (err) {
    return jsonRes(500, { status: false, mes: 'Failed to update Google Sheet', data: null })
  }
}