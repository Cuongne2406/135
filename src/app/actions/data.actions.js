'use server';

import { google } from 'googleapis';
import { reloadForm, reloadArea } from "@/data/actions/reload";
import dbConnect from "@/config/connectDB";
import Area from "@/models/area";
import Form from "@/models/formclient";
import Customer from "@/models/customer";
import checkAuthToken from "@/utils/checktoken";

// ==============================================================================
// 1. CÁC ACTION CRUD KHU VỰC (AREA) - THAO TÁC TRỰC TIẾP TRÊN MODEL AREA
// ==============================================================================

export async function createAreaAction(_previousState, formData) {
    await dbConnect();
    const name = formData.get('name');
    const color = formData.get('color') || '#2563eb';
    const user = await checkAuthToken();
    if (!user || !user.id) return { message: 'Bạn cần đăng nhập để thực hiện hành động này.', status: false };
    if (!user.role?.includes('Admin') && !user.role?.includes('Sale') && !user.role?.includes('Academic')) {
        return { message: 'Bạn không có quyền thực hiện chức năng này', status: false };
    }

    if (!name) return { message: 'Tên khu vực là bắt buộc.', status: false };
    if (name.length > 50) return { message: 'Tên khu vực phải ít hơn 50 kí tự', status: false };
    const processedName = name.toString().trim();

    try {
        const existingArea = await Area.findOne({ name: { $regex: new RegExp(`^${processedName}$`, 'i') } });
        if (existingArea) {
            return { message: 'Lỗi: Tên khu vực này đã tồn tại.', status: false };
        }
        const newArea = new Area({
            name: processedName,
            color: color.toString().trim(),
            rooms: []
        });
        await newArea.save();
        await reloadArea();
        return { message: `Đã tạo thành công khu vực "${name}".`, status: true };
    } catch (error) {
        console.error("Lỗi tạo khu vực:", error);
        return { message: 'Lỗi hệ thống, không thể tạo khu vực.', status: false };
    }
}

export async function updateAreaAction(_previousState, formData) {
    const id = formData.get('id');
    const name = formData.get('name');
    const color = formData.get('color');
    const user = await checkAuthToken();
    if (!user || !user.id) return { message: 'Bạn cần đăng nhập để thực hiện hành động này.', status: false };
    if (!user.role?.includes('Admin') && !user.role?.includes('Sale') && !user.role?.includes('Academic')) {
        return { message: 'Bạn không có quyền thực hiện chức năng này', status: false };
    }
    if (!id || !name) {
        return { message: 'Dữ liệu không hợp lệ (thiếu ID hoặc tên).', status: false };
    }
    if (name.length > 50) {
        return { message: 'Tên khu vực phải ít hơn 50 kí tự', status: false };
    }
    const processedName = name.toString().trim();
    try {
        await dbConnect();
        const existingArea = await Area.findOne({
            name: { $regex: new RegExp(`^${processedName}$`, 'i') },
            _id: { $ne: id }
        });

        if (existingArea) {
            return { message: 'Lỗi: Tên khu vực này đã được sử dụng.', status: false };
        }

        const updateFields = { name: processedName };
        if (color) updateFields.color = color.toString().trim();

        const updatedArea = await Area.findByIdAndUpdate(
            id,
            updateFields,
            { new: true }
        );

        if (!updatedArea) {
            return { message: 'Không tìm thấy khu vực để cập nhật.', status: false };
        }
        await reloadArea(id);
        return { message: `Đã cập nhật thành công khu vực "${name}".`, status: true };

    } catch (error) {
        console.error("Lỗi cập nhật khu vực:", error);
        return { message: 'Lỗi hệ thống, không thể cập nhật khu vực.', status: false };
    }
}

export async function deleteAreaAction(_previousState, formData) {
    const id = formData.get('id');
    const user = await checkAuthToken();
    if (!user || !user.id) return { message: 'Bạn cần đăng nhập để thực hiện hành động này.', status: false };
    if (!user.role?.includes('Admin') && !user.role?.includes('Sale') && !user.role?.includes('Academic')) {
        return { message: 'Bạn không có quyền thực hiện chức năng này', status: false };
    }
    try {
        await dbConnect();
        const areaToDelete = await Area.findById(id);
        if (!areaToDelete) { return { status: false, message: 'Không tìm thấy khu vực để xóa.' }; }
        await Area.findByIdAndDelete(id);
        await reloadArea(id);
        return { status: true, message: 'Xóa khu vực thành công!' };
    } catch (error) {
        console.error('Lỗi khi xóa khu vực:', error);
        return { status: false, message: 'Đã xảy ra lỗi. Không thể xóa khu vực.' };
    }
}

// ==============================================================================
// 2. CÁC ACTION CRUD NGUỒN KHÁCH HÀNG (FORM CLIENT)
// ==============================================================================

export async function createFormAction(_previousState, formData) {
    await dbConnect();
    const name = formData.get('name');
    const user = await checkAuthToken();
    if (!user || !user.id) return { message: 'Bạn cần đăng nhập để thực hiện hành động này.', status: false };
    if (!user.role?.includes('Admin') && !user.role?.includes('Sale')) {
        return { message: 'Bạn không có quyền thực hiện chức năng này', status: false };
    }
    const formInputValues = formData.getAll('formInput');
    const formInput = formInputValues.map(Number);
    const describe = formData.get('describe');
    if (!name) return { message: 'Tên form là bắt buộc.', status: false };
    if (name.length > 50) return { message: 'Tên form phải ít hơn 50 kí tự', status: false };
    if (describe && describe.length > 1000) return { message: 'Mô tả phải ít hơn 1000 kí tự', status: false };
    const processedName = name.toString().toLowerCase().trim();
    try {
        const existingForm = await Form.findOne({ name: processedName });
        if (existingForm) {
            return { message: 'Lỗi: Tên form này đã tồn tại.', status: false };
        }
        const newForm = new Form({
            name: processedName,
            describe: describe?.toString().trim(),
            createdBy: user.id,
            formInput: formInput,
        });
        await newForm.save();
        await reloadForm();
        return { message: `Đã tạo thành công form "${name}".`, status: true };
    } catch (error) {
        console.error("Lỗi tạo form:", error);
        return { message: 'Lỗi hệ thống, không thể tạo form.', status: false };
    }
}

export async function updateFormAction(_previousState, formData) {
    const id = formData.get('id');
    const name = formData.get('name');
    const describe = formData.get('describe');
    const formInputValues = formData.getAll('formInput');
    const formInput = formInputValues.map(Number);
    const user = await checkAuthToken();
    if (!user || !user.id) return { message: 'Bạn cần đăng nhập để thực hiện hành động này.', status: false };
    if (!user.role?.includes('Admin') && !user.role?.includes('Sale')) {
        return { message: 'Bạn không có quyền thực hiện chức năng này', status: false };
    }
    if (!id || !name) {
        return { message: 'Dữ liệu không hợp lệ (thiếu ID hoặc tên).', status: false };
    }
    if (name.length > 50) {
        return { message: 'Tên form phải ít hơn 50 kí tự', status: false };
    }
    const processedName = name.toString().toLowerCase().trim();
    try {
        await dbConnect();
        const existingForm = await Form.findOne({
            name: processedName,
            _id: { $ne: id }
        });

        if (existingForm) {
            return { message: 'Lỗi: Tên form này đã được sử dụng ở một nguồn khác.', status: false };
        }

        const updatedForm = await Form.findByIdAndUpdate(
            id,
            {
                name: processedName,
                describe: describe?.toString().trim(),
                formInput: formInput,
            },
            { new: true }
        );

        if (!updatedForm) {
            return { message: 'Không tìm thấy form để cập nhật.', status: false };
        }
        await reloadForm();
        return { message: `Đã cập nhật thành công form "${name}".`, status: true };

    } catch (error) {
        console.error("Lỗi cập nhật form:", error);
        return { message: 'Lỗi hệ thống, không thể cập nhật form.', status: false };
    }
}

export async function deleteFormAction(_previousState, formData) {
    const id = formData.get('id');
    const user = await checkAuthToken();
    if (!user || !user.id) return { message: 'Bạn cần đăng nhập để thực hiện hành động này.', status: false };
    if (!user.role?.includes('Admin') && !user.role?.includes('Sale')) {
        return { message: 'Bạn không có quyền thực hiện chức năng này', status: false };
    }
    try {
        await dbConnect();
        const formToDelete = await Form.findById(id);
        if (!formToDelete) { return { status: false, message: 'Không tìm thấy form để xóa.' }; }
        await Form.findByIdAndDelete(id);
        await reloadForm();
        return { status: true, message: 'Xóa form thành công!' };
    } catch (error) {
        console.error('Lỗi khi xóa form:', error);
        return { status: false, message: 'Đã xảy ra lỗi. Không thể xóa form.' };
    }
}

// ==============================================================================
// 3. ĐỒNG BỘ KHÁCH HÀNG TỪ GOOGLE SHEETS
// ==============================================================================

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_CUSTOMER_ID || '1ZQsHUyVD3vmafcm6_egWup9ErXfxIg4U-TfVDgDztb8';
const RANGE_DATA = process.env.GOOGLE_SHEETS_CUSTOMER_RANGE || 'Data!A:G';
const DEFAULT_SOURCE_ID = process.env.DEFAULT_CUSTOMER_SOURCE_ID || '6892cfa3154663935b4a9b1e';
const PHONE_HEADER = 'phone';

async function getSheets() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    return google.sheets({ version: 'v4', auth });
}

export async function syncCustomersFromSheetAction(_previousState, _formData) {
    const user = await checkAuthToken();
    if (!user || !user.id) return { message: 'Bạn cần đăng nhập để thực hiện hành động này.', status: false };
    if (!user.role?.includes('Admin') && !user.role?.includes('Sale')) {
        return { message: 'Bạn không có quyền thực hiện chức năng này', status: false };
    }

    try {
        await dbConnect();
        const sheets = await getSheets();
        const response = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: RANGE_DATA });

        const rows = response.data.values;
        if (!rows || rows.length < 2) {
            return { status: true, message: 'Không có dữ liệu mới để đồng bộ.' };
        }

        const headers = rows[0].map(h => h.trim().toLowerCase());
        const dataRows = rows.slice(1);
        const phoneColumnIndex = headers.indexOf(PHONE_HEADER);

        if (phoneColumnIndex === -1) {
            return { status: false, message: `Không tìm thấy cột '${PHONE_HEADER}'.` };
        }

        const existingCustomers = await Customer.find({}, 'phone').lean();
        const existingPhones = new Set(existingCustomers.map(c => c.phone));
        const customersToInsert = [];

        for (const row of dataRows) {
            const phone = row[phoneColumnIndex]?.toString().trim();
            if (!phone || existingPhones.has(phone)) continue;

            const newCustomerData = {};
            headers.forEach((key, index) => {
                if (!key || row[index] === null || row[index] === undefined) return;
                let src = DEFAULT_SOURCE_ID
                if (key === 'source' && row[index].toString().trim().length === 24) {
                    src = row[index].toString().trim()
                }
                newCustomerData[key] = key === 'bd' && !isNaN(new Date(row[index]).getTime()) ? new Date(row[index]) : row[index];
                newCustomerData['source'] = key === 'source' ? src : DEFAULT_SOURCE_ID
            });
            if (newCustomerData.name && newCustomerData.phone) {
                customersToInsert.push(newCustomerData);
                existingPhones.add(phone);
            }
        }

        if (customersToInsert.length > 0) {
            await Customer.insertMany(customersToInsert);
            return { status: true, message: `Đồng bộ thành công! Đã thêm ${customersToInsert.length} khách hàng mới.` };
        }

        return { status: true, message: 'Không có khách hàng mới nào để thêm.' };
    } catch (error) {
        console.error("Lỗi đồng bộ Google Sheet:", error);
        return { message: 'Lỗi hệ thống, không thể đồng bộ dữ liệu.', status: false };
    }
}