import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import PostStudent from '@/models/student';
import PostCourse from '@/models/course';
import authenticate from '@/utils/authenticate';
import mongoose from 'mongoose';

// Hàm xếp loại học lực dựa trên thang điểm 10
export function getGradeRank(score, maxScore = 10) {
    const normalized = (score / maxScore) * 10;
    if (normalized >= 9.0) return { rank: 'Xuất sắc', color: 'emerald', key: 'excellent' };
    if (normalized >= 8.0) return { rank: 'Giỏi', color: 'blue', key: 'good' };
    if (normalized >= 6.5) return { rank: 'Khá', color: 'amber', key: 'fair' };
    if (normalized >= 5.0) return { rank: 'Trung bình', color: 'orange', key: 'average' };
    return { rank: 'Chưa đạt', color: 'rose', key: 'poor' };
}

export async function GET(request) {
    try {
        const { user } = await authenticate(request);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('courseId');
        const search = searchParams.get('search')?.toLowerCase().trim() || '';

        // 1. Lấy danh sách khóa học cho dropdown bộ lọc
        const courses = await PostCourse.find({})
            .populate('Book', 'Name')
            .select('_id ID Book')
            .sort({ createdAt: -1 })
            .lean();

        // 2. Tìm kiếm học sinh
        const studentFilter = {};
        if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
            studentFilter['Course.course'] = new mongoose.Types.ObjectId(courseId);
        }

        const students = await PostStudent.find(studentFilter)
            .populate('Course.course', 'ID Book')
            .populate('Scores.courseId', 'ID')
            .select('ID Name Phone Scores Course')
            .lean();

        // 3. Tổng hợp danh sách điểm kiểm tra
        let allScores = [];
        let studentsWithoutScore = 0;

        students.forEach(stu => {
            const stuScores = stu.Scores || [];
            if (stuScores.length === 0) {
                studentsWithoutScore++;
            }

            stuScores.forEach(sc => {
                // Nếu đang lọc theo khóa học cụ thể
                if (courseId && sc.courseId?._id?.toString() !== courseId && sc.courseId?.toString() !== courseId) {
                    return;
                }

                const rankInfo = getGradeRank(sc.score, sc.maxScore || 10);
                const courseName = sc.courseId?.ID || (stu.Course?.[0]?.course?.ID) || 'Chưa gán';

                allScores.push({
                    _id: sc._id,
                    studentId: stu._id,
                    studentCode: stu.ID,
                    studentName: stu.Name,
                    phone: stu.Phone,
                    courseId: sc.courseId?._id || sc.courseId || null,
                    courseName,
                    testName: sc.testName,
                    score: sc.score,
                    maxScore: sc.maxScore || 10,
                    percentage: Math.round(((sc.score / (sc.maxScore || 10)) * 100)),
                    rank: rankInfo.rank,
                    rankColor: rankInfo.color,
                    rankKey: rankInfo.key,
                    date: sc.date,
                    note: sc.note || ''
                });
            });
        });

        // Lọc theo từ khóa tìm kiếm (Tên học viên, Mã học viên, Tên bài test)
        if (search) {
            allScores = allScores.filter(s =>
                s.studentName?.toLowerCase().includes(search) ||
                s.studentCode?.toLowerCase().includes(search) ||
                s.testName?.toLowerCase().includes(search) ||
                s.courseName?.toLowerCase().includes(search)
            );
        }

        // Sắp xếp theo ngày kiểm tra mới nhất
        allScores.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 4. Tính toán số liệu thống kê KPIs
        const totalTests = allScores.length;
        const totalScoreSum = allScores.reduce((acc, curr) => {
            const maxS = (curr.maxScore && curr.maxScore > 0) ? curr.maxScore : 10;
            return acc + (curr.score / maxS) * 10;
        }, 0);
        const averageScore = totalTests > 0 ? Number((totalScoreSum / totalTests).toFixed(1)) : 0;
        const passCount = allScores.filter(s => {
            const maxS = (s.maxScore && s.maxScore > 0) ? s.maxScore : 10;
            return (s.score / maxS) >= 0.5;
        }).length;
        const passRate = totalTests > 0 ? Math.round((passCount / totalTests) * 100) : 0;

        const distribution = {
            excellent: allScores.filter(s => s.rankKey === 'excellent').length,
            good: allScores.filter(s => s.rankKey === 'good').length,
            fair: allScores.filter(s => s.rankKey === 'fair').length,
            average: allScores.filter(s => s.rankKey === 'average').length,
            poor: allScores.filter(s => s.rankKey === 'poor').length,
        };

        return NextResponse.json({
            success: true,
            summary: {
                totalStudents: students.length,
                totalTests,
                averageScore: Number(averageScore),
                passRate,
                passCount,
                failCount: totalTests - passCount,
                distribution
            },
            courses: courses.map(c => ({ _id: c._id, name: `${c.ID} - ${c.Book?.Name || ''}` })),
            scores: allScores
        });

    } catch (error) {
        console.error('Error fetching test reports:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { user } = await authenticate(request);
        if (!user || (!user.role?.includes('Admin') && !user.role?.includes('Academic') && !user.role?.includes('Teacher'))) {
            return NextResponse.json({ success: false, error: 'Bạn không có quyền nhập điểm kiểm tra.' }, { status: 403 });
        }

        await connectDB();
        const body = await request.json();
        const { studentId, courseId, testName, score, maxScore = 10, note, date } = body;

        if (!studentId || !testName || score === undefined) {
            return NextResponse.json({ success: false, error: 'Thiếu thông tin bắt buộc (studentId, testName, score)' }, { status: 400 });
        }

        const student = await PostStudent.findById(studentId);
        if (!student) {
            return NextResponse.json({ success: false, error: 'Không tìm thấy học sinh' }, { status: 404 });
        }

        const isAdminOrAcademic = user.role?.includes('Admin') || user.role?.includes('Academic');
        if (!isAdminOrAcademic) {
            if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
                return NextResponse.json({ success: false, error: 'Giáo viên bắt buộc phải chọn khóa học khi nhập điểm.' }, { status: 400 });
            }
            const courseDoc = await PostCourse.findOne({
                _id: courseId,
                $or: [
                    { TeacherHR: user._id },
                    { 'Detail.Teacher': user._id },
                    { 'Detail.TeachingAs': user._id }
                ]
            }).lean();
            if (!courseDoc) {
                return NextResponse.json({ success: false, error: 'Bạn chỉ có quyền nhập điểm cho lớp học bạn trực tiếp phụ trách.' }, { status: 403 });
            }
            const studentInCourse = (courseDoc.Student || []).some(s => s.ID === student.ID);
            if (!studentInCourse) {
                return NextResponse.json({ success: false, error: 'Học sinh không thuộc danh sách lớp học này.' }, { status: 403 });
            }
        }

        const newScore = {
            testName: testName.trim(),
            courseId: courseId && mongoose.Types.ObjectId.isValid(courseId) ? new mongoose.Types.ObjectId(courseId) : null,
            score: Number(score),
            maxScore: Number(maxScore) || 10,
            date: date ? new Date(date) : new Date(),
            note: note ? note.trim() : ''
        };

        student.Scores.push(newScore);
        await student.save();

        return NextResponse.json({
            success: true,
            message: 'Đã lưu điểm kiểm tra thành công!',
            data: newScore
        });

    } catch (error) {
        console.error('Error creating test score:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
