import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Monkey-patch Module._load to map '@tensorflow/tfjs-node' to pure JS '@tensorflow/tfjs'
// This ensures 100% compatibility with Next.js and Vercel Serverless (zero native C++ build tools required)
if (!global._tfjsNodePatched) {
    global._tfjsNodePatched = true;
    const Module = require('module');
    const origLoad = Module._load;
    Module._load = function (req, ...args) {
        if (req === '@tensorflow/tfjs-node') {
            return require('@tensorflow/tfjs');
        }
        return origLoad.call(this, req, ...args);
    };
}

const faceapi = require('@vladmandic/face-api');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

let modelsLoaded = false;
let modelLoadingPromise = null;

/**
 * Khởi tạo & nạp trọng số mô hình sinh trắc học vào bộ nhớ (Singleton)
 */
export async function ensureBiometricsReady() {
    if (modelsLoaded) return;
    if (modelLoadingPromise) return modelLoadingPromise;

    modelLoadingPromise = (async () => {
        const modelPath = path.join(process.cwd(), 'public', 'models', 'face-recognition');
        await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
        await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
        await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
        modelsLoaded = true;
    })();

    return modelLoadingPromise;
}

/**
 * Chuyển đổi Buffer ảnh (JPEG hoặc PNG) thành TensorFlow 3D RGB Tensor
 */
export function bufferToTensor(buffer) {
    if (!buffer || buffer.length < 10) return null;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    let decoded;
    try {
        decoded = isPng ? PNG.sync.read(buffer) : jpeg.decode(buffer, { useTArray: true });
    } catch {
        return null;
    }

    const { width, height, data } = decoded;
    const numPixels = width * height;
    const values = new Int32Array(numPixels * 3);
    for (let i = 0; i < numPixels; i++) {
        values[i * 3 + 0] = data[i * 4 + 0];
        values[i * 3 + 1] = data[i * 4 + 1];
        values[i * 3 + 2] = data[i * 4 + 2];
    }
    return faceapi.tf.tensor3d(values, [height, width, 3], 'int32');
}

/**
 * Tính khoảng cách hình học Euclid giữa 2 vector đặc trưng 128 chiều
 */
export function euclideanDistance(v1, v2) {
    if (!v1 || !v2 || v1.length !== v2.length) return 999;
    let sum = 0;
    for (let i = 0; i < v1.length; i++) {
        const diff = v1[i] - v2[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}

/**
 * Tải thumbnail độ phân giải 800px từ Google Drive hoặc đọc file local
 */
export async function fetchMediaBuffer(fileIdOrPath) {
    if (!fileIdOrPath || typeof fileIdOrPath !== 'string') return null;

    // File nội bộ trong thư mục public
    if (fileIdOrPath.startsWith('/')) {
        const fullPath = path.join(process.cwd(), 'public', fileIdOrPath);
        if (fs.existsSync(fullPath)) {
            return fs.readFileSync(fullPath);
        }
    }

    // Google Drive File ID (hỗ trợ cả ảnh và video thông qua keyframe thumbnail)
    const urls = [
        `https://drive.google.com/thumbnail?id=${fileIdOrPath}&sz=w800`,
        `https://lh3.googleusercontent.com/d/${fileIdOrPath}=w800`
    ];

    for (const url of urls) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 7000);
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);
            if (res.ok) {
                const arrayBuffer = await res.arrayBuffer();
                if (arrayBuffer.byteLength > 1000) {
                    return Buffer.from(arrayBuffer);
                }
            }
        } catch {}
    }

    return null;
}

/**
 * CỔNG KIỂM SOÁT KÉP (Biometric & Quality Gate):
 * 1. Cổng 1 (Quality Gate): Phát hiện khuôn mặt rõ nét, loại bỏ ảnh mờ/lưng/sa bàn/linh kiện (isRejected = true).
 * 2. Cổng 2 (Identity Gate): So khớp Euclid với danh sách học viên đăng ký (ngưỡng d <= 0.40).
 */
export async function scanMediaBiometrics({ fileId, fileName, enrolledStudents = [], threshold = 0.40 }) {
    await ensureBiometricsReady();

    const buffer = await fetchMediaBuffer(fileId);
    if (!buffer) {
        return {
            isRejected: true,
            taggedStudentIds: [],
            reason: 'Không thể tải tệp hình ảnh/video từ Drive',
            aiScanned: true
        };
    }

    const tensor = bufferToTensor(buffer);
    if (!tensor) {
        return {
            isRejected: true,
            taggedStudentIds: [],
            reason: 'Định dạng hình ảnh không hợp lệ',
            aiScanned: true
        };
    }

    // CỔNG 1: Phát hiện khuôn mặt
    let detections = [];
    try {
        detections = await faceapi
            .detectAllFaces(tensor, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.45 }))
            .withFaceLandmarks()
            .withFaceDescriptors();
    } catch (err) {
        tensor.dispose();
        return {
            isRejected: true,
            taggedStudentIds: [],
            reason: `Lỗi quét khuôn mặt: ${err.message}`,
            aiScanned: true
        };
    } finally {
        tensor.dispose();
    }

    // Không phát hiện được khuôn mặt rõ ràng nào -> LOẠI BỎ HẲN (Ảnh linh kiện, chụp sa bàn, quay lưng)
    if (!detections || detections.length === 0) {
        return {
            isRejected: true,
            taggedStudentIds: [],
            reason: 'Ảnh/video không rõ khuôn mặt (chụp linh kiện robot, sa bàn hoặc quay lưng)',
            aiScanned: true
        };
    }

    // CỔNG 2: So khớp sinh trắc học với học viên trong lớp
    const matchedStudentIds = new Set();
    const studentsWithEmbeddings = enrolledStudents.filter(s => Array.isArray(s.faceDescriptor) && s.faceDescriptor.length === 128);

    for (const detection of detections) {
        // Bỏ qua mặt quá nhỏ (xa tít hậu cảnh, < 35px)
        if (detection.detection.box.width < 35 || detection.detection.box.height < 35) {
            continue;
        }

        let bestMatch = null;
        let minDistance = 999;

        for (const stu of studentsWithEmbeddings) {
            const dist = euclideanDistance(detection.descriptor, stu.faceDescriptor);
            if (dist < minDistance) {
                minDistance = dist;
                bestMatch = stu;
            }
        }

        // Nếu khoảng cách Euclid đạt chuẩn nhận diện đích danh
        if (bestMatch && minDistance <= threshold) {
            matchedStudentIds.add(bestMatch.ID);
        }
    }

    // Nếu có khuôn mặt nhưng không phải của học viên trong lớp (giáo viên, khách mời...)
    if (matchedStudentIds.size === 0) {
        return {
            isRejected: true,
            taggedStudentIds: [],
            reason: 'Khuôn mặt trong ảnh/video không khớp với bất kỳ học viên nào trong lớp',
            aiScanned: true
        };
    }

    // Nhận diện thành công 1 hoặc nhiều học sinh
    return {
        isRejected: false,
        taggedStudentIds: Array.from(matchedStudentIds),
        confidence: 0.95,
        aiScanned: true
    };
}

