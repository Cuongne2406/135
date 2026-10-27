/**
 * Lightweight pure JavaScript EXIF metadata parser & Auto-Date Matcher
 * Trích xuất ngày giờ chụp ảnh (DateTimeOriginal) và khớp tự động với buổi học
 */

/**
 * Trích xuất ngày chụp ảnh từ file (EXIF DateTimeOriginal hoặc fallback lastModified)
 * @param {File} file 
 * @returns {Promise<{ date: Date | null, source: 'exif' | 'lastModified' | 'none' }>}
 */
export async function getPhotoCaptureDate(file) {
    if (!file) return { date: null, source: 'none' };

    // Thử đọc EXIF từ file JPEG
    if (file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
        try {
            const buffer = await readFileSlice(file, 0, 128 * 1024); // Đọc 128KB đầu tiên
            const exifDate = parseExifDateFromBuffer(buffer);
            if (exifDate && !isNaN(exifDate.getTime())) {
                return { date: exifDate, source: 'exif' };
            }
        } catch (err) {
            console.warn(`[EXIF] Không thể đọc EXIF từ ${file.name}:`, err);
        }
    }

    // Fallback: sử dụng file.lastModified nếu hợp lệ
    if (file.lastModified) {
        const modDate = new Date(file.lastModified);
        if (!isNaN(modDate.getTime())) {
            return { date: modDate, source: 'lastModified' };
        }
    }

    return { date: null, source: 'none' };
}

function readFileSlice(file, start, end) {
    return new Promise((resolve, reject) => {
        const slice = file.slice(start, end);
        const reader = new FileReader();
        reader.onload = () => resolve(new DataView(reader.result));
        reader.onerror = reject;
        reader.readAsArrayBuffer(slice);
    });
}

function parseExifDateFromBuffer(view) {
    if (view.byteLength < 16) return null;

    // Kiểm tra JPEG SOI marker: 0xFFD8
    if (view.getUint16(0, false) !== 0xFFD8) return null;

    let offset = 2;
    const length = view.byteLength;

    while (offset < length - 4) {
        const marker = view.getUint16(offset, false);
        offset += 2;

        // APP1 marker (0xFFE1) chứa EXIF
        if (marker === 0xFFE1) {
            const app1Length = view.getUint16(offset, false);
            offset += 2;

            // Kiểm tra chuỗi header 'Exif\0\0' (0x457869660000)
            if (view.getUint32(offset, false) === 0x45786966 && view.getUint16(offset + 4, false) === 0x0000) {
                const tiffOffset = offset + 6;
                return parseTiffForDate(view, tiffOffset);
            }
            offset += app1Length - 2;
        } else if ((marker & 0xFF00) === 0xFF00) {
            // Marker khác: nhảy qua độ dài segment
            const segLength = view.getUint16(offset, false);
            offset += segLength;
        } else {
            break;
        }
    }

    return null;
}

function parseTiffForDate(view, tiffOffset) {
    if (tiffOffset + 8 > view.byteLength) return null;

    // Endianness: 'II' = 0x4949 (little), 'MM' = 0x4D4D (big)
    const byteOrder = view.getUint16(tiffOffset, false);
    const littleEndian = byteOrder === 0x4949;

    if (!littleEndian && byteOrder !== 0x4D4D) return null;

    // Kiểm tra TIFF magic 42 (0x002A)
    if (view.getUint16(tiffOffset + 2, littleEndian) !== 0x002A) return null;

    const firstIFDOffset = view.getUint32(tiffOffset + 4, littleEndian);
    if (firstIFDOffset < 8) return null;

    let ifdOffset = tiffOffset + firstIFDOffset;
    if (ifdOffset + 2 > view.byteLength) return null;

    const numEntries = view.getUint16(ifdOffset, littleEndian);
    ifdOffset += 2;

    let exifIFDPointer = 0;
    let fallbackDateStr = null;

    for (let i = 0; i < numEntries; i++) {
        const entryOffset = ifdOffset + (i * 12);
        if (entryOffset + 12 > view.byteLength) break;

        const tag = view.getUint16(entryOffset, littleEndian);

        // Tag 0x8769: ExifIFDPointer
        if (tag === 0x8769) {
            exifIFDPointer = view.getUint32(entryOffset + 8, littleEndian);
        }
        // Tag 0x0132: DateTime
        else if (tag === 0x0132) {
            const valOffset = view.getUint32(entryOffset + 8, littleEndian);
            fallbackDateStr = readAsciiString(view, tiffOffset + valOffset, 20);
        }
    }

    // Nếu có Exif IFD Pointer, tìm Tag 0x9003 (DateTimeOriginal)
    if (exifIFDPointer > 0) {
        const subIFDOffset = tiffOffset + exifIFDPointer;
        if (subIFDOffset + 2 <= view.byteLength) {
            const subEntries = view.getUint16(subIFDOffset, littleEndian);
            const startSub = subIFDOffset + 2;

            for (let j = 0; j < subEntries; j++) {
                const subEntry = startSub + (j * 12);
                if (subEntry + 12 > view.byteLength) break;

                const subTag = view.getUint16(subEntry, littleEndian);
                // 0x9003: DateTimeOriginal, 0x9004: DateTimeDigitized
                if (subTag === 0x9003 || subTag === 0x9004) {
                    const dateOffset = view.getUint32(subEntry + 8, littleEndian);
                    const dateStr = readAsciiString(view, tiffOffset + dateOffset, 20);
                    if (dateStr) {
                        return parseExifDateString(dateStr);
                    }
                }
            }
        }
    }

    if (fallbackDateStr) {
        return parseExifDateString(fallbackDateStr);
    }

    return null;
}

function readAsciiString(view, offset, maxLength) {
    if (offset >= view.byteLength) return null;
    let str = '';
    const end = Math.min(view.byteLength, offset + maxLength);
    for (let i = offset; i < end; i++) {
        const charCode = view.getUint8(i);
        if (charCode === 0) break; // null-terminated
        str += String.fromCharCode(charCode);
    }
    return str.trim();
}

/**
 * Chuyển chuỗi EXIF date ("YYYY:MM:DD HH:MM:SS") thành Date
 */
export function parseExifDateString(str) {
    if (!str || typeof str !== 'string' || str.length < 10) return null;
    // Chuẩn hóa "2026:06:26 14:30:00" -> Date
    const parts = str.split(' ');
    const dateParts = parts[0].split(':');
    if (dateParts.length !== 3) return null;

    const y = parseInt(dateParts[0], 10);
    const m = parseInt(dateParts[1], 10) - 1;
    const d = parseInt(dateParts[2], 10);

    let h = 0, min = 0, s = 0;
    if (parts[1]) {
        const timeParts = parts[1].split(':');
        h = parseInt(timeParts[0] || 0, 10);
        min = parseInt(timeParts[1] || 0, 10);
        s = parseInt(timeParts[2] || 0, 10);
    }

    const res = new Date(y, m, d, h, min, s);
    return isNaN(res.getTime()) ? null : res;
}

/**
 * Chuẩn hóa ngày của một buổi học thành Date object (0h00)
 */
export function normalizeSessionDate(session) {
    if (!session) return null;
    let dateStr = session.Day || session.Date;
    if (!dateStr) return null;

    // Nếu dạng "DD/MM/YYYY"
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
        const [dd, mm, yyyy] = dateStr.split('/');
        const parsed = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
        if (!isNaN(parsed.getTime())) return parsed;
    }

    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
        parsed.setHours(0, 0, 0, 0);
        return parsed;
    }

    return null;
}

/**
 * Khớp 1 ngày chụp ảnh với danh sách buổi học của khóa học
 * @param {Date} photoDate - Ngày chụp ảnh
 * @param {Array} sessions - Mảng Detail[] của khóa học
 * @returns {{ matchedIndex: number, session: Object | null, confidence: 'exact' | 'close' | 'unmatched', diffDays: number }}
 */
export function matchPhotoToSessions(photoDate, sessions = []) {
    if (!photoDate || !Array.isArray(sessions) || sessions.length === 0) {
        return { matchedIndex: -1, session: null, confidence: 'unmatched', diffDays: 999 };
    }

    const photoMidnight = new Date(photoDate);
    photoMidnight.setHours(0, 0, 0, 0);

    let bestIndex = -1;
    let minDiffDays = 999;

    sessions.forEach((sess, idx) => {
        const sessDate = normalizeSessionDate(sess);
        if (!sessDate) return;

        const diffTime = Math.abs(photoMidnight.getTime() - sessDate.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < minDiffDays) {
            minDiffDays = diffDays;
            bestIndex = idx;
        }
    });

    if (bestIndex === -1) {
        return { matchedIndex: -1, session: null, confidence: 'unmatched', diffDays: 999 };
    }

    let confidence = 'unmatched';
    if (minDiffDays === 0) {
        confidence = 'exact';   // Trùng chính xác ngày học
    } else if (minDiffDays <= 1) {
        confidence = 'close';   // Chênh lệch 1 ngày (ví dụ học tối sang rạng sáng hoặc lệch múi giờ)
    }

    return {
        matchedIndex: bestIndex,
        session: sessions[bestIndex],
        confidence,
        diffDays: minDiffDays
    };
}
