import Counter from '@/models/counter';
import PostStudent from '@/models/student';

/**
 * Sinh mã học viên tự động dạng AIxxxx (AI0001, AI0002, ...)
 * Sử dụng atomic counter trong MongoDB để chống race-condition trùng lặp mã khi tạo đồng thời.
 */
export async function getNextStudentId() {
    // 1. Kiểm tra nếu Counter chưa từng được khởi tạo, đồng bộ với số lớn nhất hiện có
    let counter = await Counter.findById('student_id');
    if (!counter) {
        const lastStudent = await PostStudent.findOne({ ID: /^AI\d{4}$/ })
            .sort({ ID: -1 })
            .select('ID')
            .lean();
        const currentMax = lastStudent ? parseInt(lastStudent.ID.slice(2), 10) : 0;
        await Counter.findByIdAndUpdate(
            'student_id',
            { $setOnInsert: { seq: currentMax } },
            { upsert: true, new: true }
        );
    }

    // 2. Tăng nguyên tử và đảm bảo mã chưa bị chiếm dụng
    for (let attempt = 0; attempt < 10; attempt++) {
        const updated = await Counter.findByIdAndUpdate(
            'student_id',
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        const candidateId = 'AI' + String(updated.seq).padStart(4, '0');
        const exists = await PostStudent.exists({ ID: candidateId });
        if (!exists) {
            return candidateId;
        }
    }

    // Fallback nếu có nhảy cóc ID
    const latestStudent = await PostStudent.findOne({ ID: /^AI\d{4}$/ })
        .sort({ ID: -1 })
        .select('ID')
        .lean();
    const fallbackNum = latestStudent ? parseInt(latestStudent.ID.slice(2), 10) + 1 : 1;
    await Counter.findByIdAndUpdate('student_id', { $set: { seq: fallbackNum } });
    return 'AI' + String(fallbackNum).padStart(4, '0');
}
