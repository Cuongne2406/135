/**
 * Client-side Image Compression Utility for SYS-AIR
 * Giảm 60% – 85% dung lượng ảnh máy ảnh/điện thoại trước khi upload lên Google Drive
 */

export function formatBytes(bytes, decimals = 1) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Nén 1 file ảnh bằng HTML5 Canvas
 * @param {File} file - File ảnh đầu vào
 * @param {Object} options - Cấu hình nén
 * @returns {Promise<{ file: File, originalSize: number, compressedSize: number, savedPercent: number, isCompressed: boolean }>}
 */
export async function compressImage(file, options = {}) {
    const {
        maxDimension = 1920,   // Chiều rộng/cao tối đa (px)
        quality = 0.8,         // Chất lượng nén JPEG (0.1 - 1.0)
        minSizeToCompress = 400 * 1024, // Dưới 400KB thì giữ nguyên
        mimeType = 'image/jpeg'
    } = options;

    const originalSize = file.size;

    // Bỏ qua nếu không phải hình ảnh hoặc là ảnh GIF/SVG (không nên nén canvas)
    if (!file.type.startsWith('image/') || file.type.includes('gif') || file.type.includes('svg')) {
        return {
            file,
            originalSize,
            compressedSize: originalSize,
            savedPercent: 0,
            isCompressed: false
        };
    }

    // Nếu ảnh đã quá nhẹ, không cần nén
    if (originalSize <= minSizeToCompress) {
        return {
            file,
            originalSize,
            compressedSize: originalSize,
            savedPercent: 0,
            isCompressed: false
        };
    }

    return new Promise((resolve) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            let { width, height } = img;

            // Tính toán kích thước mới giữ nguyên tỉ lệ
            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                } else {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                // Fallback nếu không lấy được context
                return resolve({
                    file,
                    originalSize,
                    compressedSize: originalSize,
                    savedPercent: 0,
                    isCompressed: false
                });
            }

            // Tăng cường chất lượng render mượt mà
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob || blob.size >= originalSize) {
                        // Nếu file nén lại lớn hơn file gốc, giữ nguyên file gốc
                        return resolve({
                            file,
                            originalSize,
                            compressedSize: originalSize,
                            savedPercent: 0,
                            isCompressed: false
                        });
                    }

                    // Đổi tên đuôi file thành .jpg nếu nén sang JPEG
                    let newName = file.name;
                    if (mimeType === 'image/jpeg' && !newName.toLowerCase().endsWith('.jpg') && !newName.toLowerCase().endsWith('.jpeg')) {
                        newName = newName.replace(/\.[^/.]+$/, "") + ".jpg";
                    }

                    const compressedFile = new File([blob], newName, {
                        type: mimeType,
                        lastModified: file.lastModified || Date.now()
                    });

                    const compressedSize = compressedFile.size;
                    const savedPercent = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

                    resolve({
                        file: compressedFile,
                        originalSize,
                        compressedSize,
                        savedPercent,
                        isCompressed: true
                    });
                },
                mimeType,
                quality
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve({
                file,
                originalSize,
                compressedSize: originalSize,
                savedPercent: 0,
                isCompressed: false
            });
        };

        img.src = objectUrl;
    });
}

/**
 * Nén hàng loạt danh sách file ảnh
 * @param {File[]} files - Mảng các file
 * @param {Object} options - Cấu hình nén
 * @param {Function} onProgress - Callback tiến độ (index, total, currentResult)
 */
export async function compressImages(files, options = {}, onProgress = null) {
    const results = [];
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await compressImage(file, options);
        results.push(res);

        totalOriginalSize += res.originalSize;
        totalCompressedSize += res.compressedSize;

        if (onProgress) {
            onProgress(i + 1, files.length, res);
        }
    }

    const savedPercent = totalOriginalSize > 0
        ? Math.max(0, Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100))
        : 0;

    return {
        results,
        compressedFiles: results.map(r => r.file),
        totalOriginalSize,
        totalCompressedSize,
        savedPercent
    };
}
