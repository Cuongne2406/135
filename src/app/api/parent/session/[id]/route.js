import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import PostStudent from '@/models/student';
import PostCourse from '@/models/course';
import '@/models/book';
import '@/models/users';
import '@/models/area';
import { verifyParentToken, PARENT_COOKIE_NAME } from '@/utils/parentAuth';
import { srcImage } from '@/function';

// Bộ ảnh hoạt động thực hành mẫu chất lượng cao từ dataset nội bộ nếu bài học chưa có ảnh Drive
const SAMPLE_LESSON_PHOTOS = [
    [
        '/dataset_eportfolio/02_hoat_dong_lop_hoc_robotics/Buoi_1_Nhap_Mon_Co_Dien_Tu/B01_01_Toan_canh_lop_hoc_lam_quen_kit.jpg',
        '/dataset_eportfolio/02_hoat_dong_lop_hoc_robotics/Buoi_1_Nhap_Mon_Co_Dien_Tu/B01_02_Thao_tac_phan_loai_chi_tiet_lego.jpg',
        '/dataset_eportfolio/02_hoat_dong_lop_hoc_robotics/Buoi_1_Nhap_Mon_Co_Dien_Tu/B01_03_Hoc_vien_An_Duc_lap_khung_gam.jpg',
        '/dataset_eportfolio/02_hoat_dong_lop_hoc_robotics/Buoi_1_Nhap_Mon_Co_Dien_Tu/B01_06_Thanh_pham_khung_xe_chassis_buoi1.jpg'
    ],
    [
        '/dataset_eportfolio/02_hoat_dong_lop_hoc_robotics/Buoi_2_Banh_Rang_Dong_Co_DC/B02_01_Giang_vien_huong_dan_hop_so.jpg',
        '/dataset_eportfolio/02_hoat_dong_lop_hoc_robotics/Buoi_2_Banh_Rang_Dong_Co_DC/B02_02_Hoc_vien_lap_cum_banh_rang.jpg',
        '/dataset_eportfolio/02_hoat_dong_lop_hoc_robotics/Buoi_2_Banh_Rang_Dong_Co_DC/B02_03_Thu_nghiem_truyen_dong_dong_co.jpg'
    ],
    [
        '/dataset_eportfolio/02_hoat_dong_lop_hoc_robotics/Buoi_3_Lap_Rap_Xe_Do_Duong/B03_01_Hoc_vien_gan_cam_bien_hong_ngoai.jpg',
        '/dataset_eportfolio/02_hoat_dong_lop_hoc_robotics/Buoi_3_Lap_Rap_Xe_Do_Duong/B03_02_Kiem_tra_do_phan_xa_line_den.jpg',
        '/dataset_eportfolio/02_hoat_dong_lop_hoc_robotics/Buoi_3_Lap_Rap_Xe_Do_Duong/B03_03_Chay_thu_nghiem_sa_ban_line.jpg'
    ],
    [
        '/dataset_eportfolio/02_hoat_dong_lop_hoc_robotics/Buoi_4_Lap_Trinh_Scratch_Sieu_Am/B04_01_Lap_trinh_khoi_lenh_scratch.jpg',
        '/dataset_eportfolio/02_hoat_dong_lop_hoc_robotics/Buoi_4_Lap_Trinh_Scratch_Sieu_Am/B04_02_Kiem_tra_khoang_cach_sieu_am.jpg',
        '/dataset_eportfolio/02_hoat_dong_lop_hoc_robotics/Buoi_4_Lap_Trinh_Scratch_Sieu_Am/B04_03_Xe_dung_lai_khi_gap_vat_can.jpg'
    ],
    [
        '/dataset_eportfolio/02_hoat_dong_lop_hoc_robotics/Buoi_5_Toi_Uu_Xe_Me_Cung/B05_01_Hoc_vien_thao_luan_giai_me_cung.jpg',
        '/dataset_eportfolio/02_hoat_dong_lop_hoc_robotics/Buoi_5_Toi_Uu_Xe_Me_Cung/B05_02_Nap_chuong_trinh_re_phai_re_trai.jpg',
        '/dataset_eportfolio/02_hoat_dong_lop_hoc_robotics/Buoi_5_Toi_Uu_Xe_Me_Cung/B05_03_Hoan_thanh_duong_chay_me_cung.jpg'
    ],
    [
        '/dataset_eportfolio/02_hoat_dong_lop_hoc_robotics/Buoi_6_Che_Tao_Canh_Tay_Robot/B06_01_Lap_khop_xoay_servo_canh_tay.jpg',
        '/dataset_eportfolio/02_hoat_dong_lop_hoc_robotics/Buoi_6_Che_Tao_Canh_Tay_Robot/B06_02_Kiem_tra_luc_gap_vat_the.jpg',
        '/dataset_eportfolio/02_hoat_dong_lop_hoc_robotics/Buoi_6_Che_Tao_Canh_Tay_Robot/B06_03_Dieu_khien_canh_tay_qua_joystick.jpg'
    ],
    [
        '/dataset_eportfolio/02_hoat_dong_lop_hoc_robotics/Buoi_7_Bao_Cao_Tot_Nghiep_Gala/B07_01_Hoc_vien_thuyet_trinh_san_pham.jpg',
        '/dataset_eportfolio/02_hoat_dong_lop_hoc_robotics/Buoi_7_Bao_Cao_Tot_Nghiep_Gala/B07_02_Bieu_dien_robot_truoc_phu_huynh.jpg',
        '/dataset_eportfolio/02_hoat_dong_lop_hoc_robotics/Buoi_7_Bao_Cao_Tot_Nghiep_Gala/B07_03_Trao_chung_nhan_hoan_thanh_khoa.jpg'
    ]
];

export async function GET(request, { params }) {
    try {
        const { id: lessonId } = await params;
        const token = request.cookies.get(PARENT_COOKIE_NAME)?.value;
        const decoded = verifyParentToken(token);

        if (!decoded || !decoded.phone) {
            return NextResponse.json({
                success: false,
                mes: 'Phiên đăng nhập đã hết hạn.'
            }, { status: 401 });
        }

        await connectDB();

        // Tìm khóa học chứa buổi học này
        const course = await PostCourse.findOne({ 'Detail._id': lessonId })
            .populate('Book', 'Name Cover Topics')
            .populate('TeacherHR', 'name phone avt')
            .populate('Area', 'name address')
            .populate('Detail.Teacher', 'name')
            .populate('Detail.TeachingAs', 'name')
            .populate('Detail.Room', 'name')
            .lean();

        if (!course) {
            return NextResponse.json({
                success: false,
                mes: 'Không tìm thấy thông tin buổi học.'
            }, { status: 404 });
        }

        const lessonIndex = course.Detail.findIndex(d => String(d._id) === String(lessonId));
        const lessonDetail = course.Detail[lessonIndex];

        if (!lessonDetail) {
            return NextResponse.json({
                success: false,
                mes: 'Buổi học không tồn tại trong khóa.'
            }, { status: 404 });
        }

        // Tìm thông tin học sinh
        const student = await PostStudent.findOne({ ID: decoded.activeStudentId })
            .select('ID Name Avt')
            .lean();

        const studentInCourse = course.Student?.find(s => s.ID === decoded.activeStudentId);
        const learnEntry = studentInCourse?.Learn?.find(lr => String(lr.Lesson) === String(lessonId)) || {};

        // Tìm thông tin chủ đề bài học
        const topicInfo = course.Book?.Topics?.find(t => String(t._id) === String(lessonDetail.Topic)) || {};

        // Xử lý danh sách hình ảnh thực hành
        const sampleSet = SAMPLE_LESSON_PHOTOS[lessonIndex % SAMPLE_LESSON_PHOTOS.length] || SAMPLE_LESSON_PHOTOS[0];
        let photos = [];
        if (lessonDetail.DetailImage && lessonDetail.DetailImage.length > 0) {
            photos = lessonDetail.DetailImage.map((img, i) => {
                const imgId = img.id || '';
                // Nếu là mock ID từ dữ liệu mẫu (ví dụ: img_c1_l7...) -> map sang ảnh hoạt động thực tế trong dataset
                if (imgId.startsWith('img_') || imgId.includes('mock') || !imgId) {
                    return {
                        id: imgId || `sample_${i}`,
                        url: sampleSet[i % sampleSet.length]
                    };
                }
                return {
                    id: imgId,
                    url: imgId.startsWith('/') || imgId.startsWith('http') ? imgId : `https://lh3.googleusercontent.com/d/${imgId}`
                };
            });
        }

        // Nếu buổi học chưa có ảnh nào trong DetailImage, cung cấp ảnh từ dataset mẫu
        if (photos.length === 0) {
            photos = sampleSet.map((url, i) => ({
                id: `sample_${i}`,
                url: url
            }));
        }

        return NextResponse.json({
            success: true,
            lesson: {
                _id: String(lessonDetail._id),
                index: lessonIndex + 1,
                totalLessons: course.Detail.length,
                TopicName: topicInfo.Name || 'Chủ đề bài học Robotics',
                Day: lessonDetail.Day,
                Time: lessonDetail.Time || '08:00 - 10:00',
                Room: lessonDetail.Room?.name || 'Phòng Lab Robotics',
                Teacher: lessonDetail.Teacher?.name || course.TeacherHR?.name || 'Giáo viên hướng dẫn',
                TeachingAs: lessonDetail.TeachingAs?.name || '',
                Type: lessonDetail.Type || 'Chính thức',
                Checkin: learnEntry.Checkin ?? 0,
                Cmt: learnEntry.Cmt || [],
                CmtFn: learnEntry.CmtFn || '',
                Note: learnEntry.Note || '',
                absenceReason: learnEntry.absenceReason || '',
                photos
            },
            student: {
                ID: student?.ID,
                Name: student?.Name,
                Avt: srcImage(student?.Avt)
            },
            course: {
                ID: course.ID,
                BookName: course.Book?.Name || 'Chương trình Robotics'
            }
        });
    } catch (error) {
        console.error('[API_PARENT_SESSION_DETAIL_ERROR]', error);
        return NextResponse.json({
            success: false,
            mes: error.message || 'Lỗi lấy chi tiết buổi học.'
        }, { status: 500 });
    }
}
