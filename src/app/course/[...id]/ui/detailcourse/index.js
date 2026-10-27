"use client";
import { useState, useMemo } from 'react';
import ResponsiveGrid from '@/components/(ui)/grid';
import DetailStudent from '../detatilstudent';
import Student from '../student';
import Calendar from '../calendarcourse';
import Image from 'next/image';
import { Svg_Area, Svg_Canlendar, Svg_Course, Svg_Map, Svg_Profile, Svg_Student } from '@/components/(icon)/svg';
import AnnounceStudent from '../bell';
import Report from '../Report';
import { useRouter } from 'next/navigation';
import Loading from '@/components/(ui)/(loading)/loading';
import CommentPopup from '../cmt';
import { driveImage, formatDate } from '@/function';
import ImageComponent from '@/components/(ui)/(image)';
import BoxFile from '@/components/(ui)/(box)/file';
import Noti from '@/components/(features)/(noti)/noti';
import Link from 'next/link';
import WrapIcon from '@/components/(ui)/(button)/hoveIcon';
import { reloadCourse } from '@/data/actions/reload';
import Pay from '@/app/student/list/ui/pay';
import Export from '../exportStudents';
import SendCmt from '../sencmt';
import { getEportfolioUrl } from '@/utils/env';
import TemplateSelector from '../templateSelector';
import ReviewSheetModal from '../reviewSheet';
import DriveFolderModal from '../driveFolderModal';
import CourseHealthBar from '@/components/(features)/courseHealthBar';
import AutoDateMatcherModal from '../autoDateMatcher';
import ShareQrModal from '../shareQrModal';

const SortIcon = ({ direction }) => {
    if (!direction) {
        return <span style={{ width: 16, display: 'inline-block' }}>↕️</span>;
    }
    return direction === 'ascending' ? <span style={{ width: 16, display: 'inline-block' }}>🔼</span> : <span style={{ width: 16, display: 'inline-block' }}>🔽</span>;
};

export default function Detail({ data = [], params, book, users, studentsx }) {
    let allImages = []
    if (params.length > 1) {
        allImages = data.Detail?.filter((t) => t._id == params[1])[0]?.DetailImage || [];
    } else {
        allImages = data.Detail?.flatMap(lesson => lesson.DetailImage || []);
    }

    const images = allImages?.filter(item => item.type === 'image');
    const videos = allImages?.filter(item => item.type === 'video');

    const lessProductItems = images?.map((item, index) => (<ImageComponent key={index} width={'100%'} imageInfo={item} refreshData={() => reload()} />));
    const lessProductVideos = videos?.map((item, index) => (<ImageComponent key={index} width={'100%'} imageInfo={item} refreshData={() => reload()} />));

    const listColumnsConfig = { mobile: 3, tablet: 5, desktop: 6 };

    const [loading, setLoading] = useState(false);
    const [openReviewSheet, setOpenReviewSheet] = useState(false);
    const [openDriveModal, setOpenDriveModal] = useState(false);
    const [openAutoDateMatcher, setOpenAutoDateMatcher] = useState(false);
    const [openQrModal, setOpenQrModal] = useState(false);
    const [notification, setNotification] = useState({
        open: false,
        status: true,
        mes: ''
    });
    const router = useRouter();
    const today = new Date();
    const currentHour = today.getHours();

    const [sortConfig, setSortConfig] = useState({ key: 'Name', direction: 'ascending' });
    const handleCompleteCourseClick = () => {
        if (td.isCompleted) {
            setOpenReviewSheet(true);
        } else {
            setNotification({
                open: true,
                status: false,
                mes: td.failReason || 'Khóa học chưa đủ điều kiện để xác nhận hoàn thành.'
            });
        }
    };

    const calculateCourseProgress = (data, today) => {
        // --- BƯỚC 1: KIỂM TRA DỮ LIỆU ĐẦU VÀO ---
        if (!data || !Array.isArray(data.Detail) || !Array.isArray(data.Student)) {
            return {
                isCompleted: false,
                notCheckedInCount: 0,
                missingCommentCount: 0,
                failReason: 'Dữ liệu khóa học không hợp lệ.'
            };
        }

        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0); // Đặt về đầu ngày để so sánh

        // --- BƯỚC 2: KIỂM TRA TẤT CẢ CÁC BUỔI HỌC TRONG `data.Detail` ---
        for (const lesson of data.Detail) {
            // Điều kiện 1.1: Ngày của buổi học phải ở trong quá khứ
            const lessonDate = new Date(lesson.Day);
            if (isNaN(lessonDate.getTime()) || lessonDate > todayStart) {
                return {
                    isCompleted: false,
                    notCheckedInCount: 0,
                    missingCommentCount: 0,
                    failReason: `Còn buổi học trong tương lai (${formatDate(lessonDate)}).`
                };
            }

            // Điều kiện 1.2: Phải có hình ảnh minh chứng cho buổi học
            if (!lesson.DetailImage || lesson.DetailImage.length === 0) {

                return {
                    isCompleted: false,
                    notCheckedInCount: 0,
                    missingCommentCount: 0,
                    failReason: `Buổi học ngày ${formatDate(lessonDate)} thiếu hình ảnh.`
                };
            }
        }

        // --- BƯỚC 3: KIỂM TRA DỮ LIỆU HỌC TẬP CỦA TỪNG HỌC SINH ---
        let notCheckedInCount = 0;
        let missingCommentCount = 0;
        const lessonIds = new Set(data.Detail.map(d => d._id.toString())); // Lấy danh sách ID các buổi học của khóa

        // Duyệt qua từng học sinh trong khóa
        for (const student of data.Student) {
            // Duyệt qua lịch sử học tập của học sinh đó
            if (student.Learn && Array.isArray(student.Learn)) {
                // Chỉ xét những buổi học có trong khóa này
                const relevantLearnHistory = student.Learn.filter(learnItem => lessonIds.has(learnItem.Lesson.toString()));

                for (const learnItem of relevantLearnHistory) {
                    // Điều kiện 2: Đếm số lượt chưa điểm danh (checkin = 0)
                    if (learnItem.Checkin === 0) {
                        notCheckedInCount++;
                    }

                    // Điều kiện 3: Đếm số lượt đi học (checkin = 1) nhưng chưa có nhận xét
                    if (learnItem.Checkin === 1 && (!learnItem.Cmt || learnItem.Cmt.length === 0)) {
                        missingCommentCount++;
                    }
                }
            }
        }

        // --- BƯỚC 4: TỔNG KẾT VÀ TRẢ VỀ KẾT QUẢ ---
        if (notCheckedInCount > 0) {
            return {
                isCompleted: false,
                notCheckedInCount,
                missingCommentCount,
                failReason: `Còn ${notCheckedInCount} lượt học sinh chưa được điểm danh.`
            };
        }

        if (missingCommentCount > 0) {
            return {
                isCompleted: false,
                notCheckedInCount,
                missingCommentCount,
                failReason: `Còn ${missingCommentCount} lượt nhận xét cần hoàn thành.`
            };
        }

        // Nếu tất cả điều kiện đều được thỏa mãn
        return {
            isCompleted: true,
            notCheckedInCount: 0,
            missingCommentCount: 0,
            failReason: 'Khóa học đã hoàn thành đủ điều kiện.'
        };
    };
    let td = calculateCourseProgress(data, today, currentHour)


    const sortedStudents = useMemo(() => {
        const enrichedStudents = enrichStudents(data);

        if (sortConfig.key !== null) {
            const sorted = [...enrichedStudents].sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
            return sorted;
        }
        return enrichedStudents;
    }, [data, sortConfig]);

    const allDates = data.Detail.map(item => new Date(item.Day));
    const dateRange = [formatDate(new Date(Math.min(...allDates))), formatDate(new Date(Math.max(...allDates)))];
    const uniqueRooms = useMemo(() => {
        if (!data.Detail) return []
        const isObjectId = v => /^[0-9a-fA-F]{24}$/.test(v)
        const rooms = data.Detail.map(d => d.Room).filter(Boolean).filter(r => !isObjectId(r))
        return [...new Set(rooms)]
    }, [data.Detail])

    const handleSort = (key) => {
        let direction = 'descending';
        if (sortConfig.key === key && sortConfig.direction === 'descending') {
            direction = 'ascending';
        }
        setSortConfig({ key, direction });
    };

    const detailcourse = (
        <> {sortedStudents.map(stu => (
            <div key={stu._id || stu.ID} style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }} >
                {title.map(col =>
                    col.data === 'More' ? (
                        <Cell key="more" flex={col.flex} align={col.align}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} >
                                <Link href={`/${stu.userId}`}>
                                    <WrapIcon
                                        icon={<svg viewBox="0 0 448 512" width="16" height="16" fill="white">
                                            <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3 0 498.7 13.3 512 29.7 512h388.6c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z" />
                                        </svg>}
                                        content={"Chi tiết học sinh"}
                                        placement='bottom'
                                        style={{ background: 'var(--main_d)', borderRadius: 3, margin: 0 }}
                                    />
                                </Link>
                                <Link href={`${getEportfolioUrl()}/e-portfolio/${stu.userId}`} target='_blank'>
                                    <WrapIcon
                                        icon={<Svg_Profile w={16} h={16} c='white' />}
                                        content={"Hồ sơ điện tử"}
                                        placement='bottom'
                                        style={{ background: stu.StatusProfile ? 'var(--main_d)' : 'var(--red)', borderRadius: 3, margin: 0 }}
                                    />
                                </Link>
                                <Link href={`/portfolio-lookbook?studentId=${stu.userId || stu._id}&studentName=${encodeURIComponent(stu.Name || '')}&subject=${encodeURIComponent(data.Book?.Name || '')}`} target='_blank'>
                                    <WrapIcon
                                        icon={<span style={{ fontSize: 13, lineHeight: '16px' }}>📖</span>}
                                        content={"Kỷ yếu Lookbook A4"}
                                        placement='bottom'
                                        style={{ background: 'linear-gradient(135deg, #d97706, #ea580c)', borderRadius: 3, margin: 0 }}
                                    />
                                </Link>
                                <Pay _id={stu.userId} courseId={data._id} status={stu.StatusCourse} />
                                <DetailStudent data={stu} course={data.Detail} c={data} users={users} studentsx={studentsx} />
                            </div>
                        </Cell>
                    ) : (<Cell key={col.data} flex={col.flex} align={col.align}> {stu[col.data]} </Cell>)
                )}
            </div>
        ))} </>
    )

    const detaillesson = (
        <> {data.Student.filter((stu, idx, arr) => { const k = stu._id?.toString() || stu.ID || idx; return arr.findIndex(s => (s._id?.toString() || s.ID) === k) === idx; }).map(stu => {

            if (!params[1]) return null;
            if ((stu.Learn || []).filter(t => t.Lesson.toString() === params[1].toString()).length === 0) return null;
            return (
                <div key={stu._id || stu.ID} style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }} >
                    {title.map(col => {
                        let learnDetailsArray = Object.values(stu.Learn || {});
                        learnDetailsArray = (learnDetailsArray || []).filter(ld => ld.Lesson?.toString() === params[1].toString())[0]
                        if (learnDetailsArray === undefined) {
                            return null;
                        }
                        let m = learnDetailsArray?.Checkin == '1' ? 1 : 0;
                        let c = learnDetailsArray?.Checkin == '3' ? 1 : 0;
                        let k = learnDetailsArray?.Checkin == '2' ? 1 : 0;
                        let cmt = learnDetailsArray?.Cmt || [];
                        let cmtfn = learnDetailsArray?.CmtFn || '';
                        stu.course = data.ID;
                        stu.lesson = data.Detail.find(lesson => lesson._id === params[1]);
                        stu.m = m;
                        stu.c = c;
                        stu.k = k;
                        stu.cmt = cmt;
                        stu.cmtfn = cmtfn;

                        if (params.length > 1 && col.data === 'b') return null;
                        return (
                            col.data === 'More' ?
                                <Cell key="more" flex={col.flex} align={col.align}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} >
                                        <CommentPopup data={stu} lesson={params[1]} course={data._id} />
                                        <DetailStudent data={stu} course={data.Detail} c={data} users={users} studentsx={studentsx} />
                                    </div>
                                </Cell>
                                : <Cell key={col.data} flex={col.flex} align={col.align}>{stu[col.data]}</Cell>
                        )
                    })}
                </div>
            )
        })} </>
    )
    const reload = async () => {
        setLoading(true);
        reloadCourse(data._id);
        router.refresh();
        setLoading(false);
    }
    let lesson;
    let statusLesson = [1, 1, 1];
    let slide = ''
    if (params.length > 1) {
        lesson = data.Detail.find(lesson => lesson._id === params[1]);
        slide = lesson?.LessonDetails?.Slide || '';
        if (!lesson) lesson = data.Detail[0];
        lesson.Student = data.Student.flatMap((s) => {
            let g = (s.Learn || []).filter(t => t.Lesson == lesson._id)
            return g
        })

        let num = 0
        lesson.Student.forEach(element => {
            if (element.Checkin == 0) { statusLesson[0] = 0 }
            if (element.Checkin == 1) {
                num++;
                if ((element.Cmt || []).length == 0) {
                    statusLesson[1] = 0;
                }
                if ((element.Image || []).length == 0) {
                    statusLesson[2] = 0;
                }
            }
        });
        if (num == 0) {
            statusLesson[1] = 0
            statusLesson[2] = 0
        }

    }

    return (
        <div className={'p-4 flex flex-col gap-2 overflow-auto rounded-lg shadow-[var(--boxshaw2)] h-[calc(100%-32px)]'}>
            {params.length === 1 && <CourseHealthBar course={data} className="mb-1" />}
            <div className={'bg-white rounded flex justify-between border border-[var(--border-color)]'} style={{ padding: 16, gap: 16 }}>
                <div className={'relative w-[150px] aspect-[4/5]'}>
                    {data.Book?.Image ? (
                        <Image priority={true} src={driveImage(data.Book.Image)} fill alt={data.Book.Name} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-secondary)] bg-gray-100 rounded">No image</div>
                    )}
                </div>
                <div style={{ flex: 1 }}>
                    <p className="text-base font-semibold text-[var(--text-primary)]" style={{ marginBottom: 8 }}>{params.length == 1 ? 'Thông tin khóa học' : `Thông tin buổi học (${lesson.Type || 'Chính thức'})`}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {params.length == 1 ?
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width={14} height={14} fill='var(--text-primary)'><path d="M249.6 471.5c10.8 3.8 22.4-4.1 22.4-15.5l0-377.4c0-4.2-1.6-8.4-5-11C247.4 52 202.4 32 144 32C93.5 32 46.3 45.3 18.1 56.1C6.8 60.5 0 71.7 0 83.8L0 454.1c0 11.9 12.8 20.2 24.1 16.5C55.6 460.1 105.5 448 144 448c33.9 0 79 14 105.6 23.5zm76.8 0C353 462 398.1 448 432 448c38.5 0 88.4 12.1 119.9 22.6c11.3 3.8 24.1-4.6 24.1-16.5l0-370.3c0-12.1-6.8-23.3-18.1-27.6C529.7 45.3 482.5 32 432 32c-58.4 0-103.4 20-123 35.6c-3.3 2.6-5 6.8-5 11L304 456c0 11.4 11.7 19.3 22.4 15.5z" /></svg>
                                    <span className='text-sm font-semibold text-[var(--text-primary)]'>Chương trình học :</span>
                                    <span className="text-sm font-normal text-[var(--text-primary)]">{data.Book.Name}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width={14} height={14} fill='var(--text-primary)'>
                                        <path d="M0 48V487.7C0 501.1 10.9 512 24.3 512c5 0 9.9-1.5 14-4.4L192 400 345.7 507.6c4.1 2.9 9 4.4 14 4.4c13.4 0 24.3-10.9 24.3-24.3V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48z" /></svg>
                                    <span className='text-sm font-semibold text-[var(--text-primary)]'>Tên khóa học :</span>
                                    <span className="text-sm font-normal text-[var(--text-primary)]">{data.ID}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Svg_Student w={15} h={15} c='var(--text-primary)' />
                                    <span className='text-sm font-semibold text-[var(--text-primary)]'>Sỉ số khóa :</span>
                                    <span className="text-sm font-normal text-[var(--text-primary)]">{data.Student.length} học sinh</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Svg_Canlendar w={14} h={14} c='var(--text-primary)' />
                                    <span className='text-sm font-semibold text-[var(--text-primary)]'>Thời gian học :</span>
                                    <span className="text-sm font-normal text-[var(--text-primary)]">{dateRange[0] || 'Trống'} - {dateRange[1] || 'Trống'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Svg_Profile w={14} h={14} c='var(--text-primary)' />
                                    <span className='text-sm font-semibold text-[var(--text-primary)]'>Giáo viên chủ nhiệm :</span>
                                    <span className="text-sm font-normal text-[var(--text-primary)]">{data.TeacherHR?.name || 'Trống'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Svg_Map w={14} h={14} c='var(--text-primary)' />
                                    <span className='text-sm font-semibold text-[var(--text-primary)]'>Phòng học :</span>
                                    <span className="text-sm font-normal text-[var(--text-primary)]">
                                        {uniqueRooms.length > 0 ? uniqueRooms.join(', ') : (data.Area?.name || 'Trống')}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width={14} height={14} fill='var(--text-primary)'>
                                        <path d="M0 24C0 10.7 10.7 0 24 0L360 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-8 0 0 19c0 40.3-16 79-44.5 107.5L225.9 256l81.5 81.5C336 366 352 404.7 352 445l0 19 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24L24 512c-13.3 0-24-10.7-24-24s10.7-24 24-24l8 0 0-19c0-40.3 16-79 44.5-107.5L158.1 256 76.5 174.5C48 146 32 107.3 32 67l0-19-8 0C10.7 48 0 37.3 0 24zM110.5 371.5c-3.9 3.9-7.5 8.1-10.7 12.5l184.4 0c-3.2-4.4-6.8-8.6-10.7-12.5L192 289.9l-81.5 81.5zM284.2 128C297 110.4 304 89 304 67l0-19L80 48l0 19c0 22.1 7 43.4 19.8 61l184.4 0z" /></svg>
                                    <span className='text-sm font-semibold text-[var(--text-primary)]'>Tiến độ :</span>
                                    <span className="text-sm font-normal text-[var(--text-primary)]">{data.Progress} Tiết</span>
                                </div>
                            </> :
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Svg_Course w={14} h={14} c='var(--text-primary)' />
                                    <span className='text-sm font-semibold text-[var(--text-primary)]'>Chủ đề học :</span>
                                    <span className="text-sm font-normal text-[var(--text-primary)]">{lesson.LessonDetails.Name || 'Trống'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Svg_Canlendar w={14} h={14} c='var(--text-primary)' />
                                    <span className='text-sm font-semibold text-[var(--text-primary)]'>Thời gian học :</span>
                                    <span className="text-sm font-normal text-[var(--text-primary)]">{lesson.Time || 'Trống'} - {formatDate(new Date(lesson.Day)) || 'Trống'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Svg_Map w={14} h={14} c='var(--text-primary)' />
                                    <span className='text-sm font-semibold text-[var(--text-primary)]'>Phòng học :</span>
                                    <span className="text-sm font-normal text-[var(--text-primary)]">{lesson.Room && !/^[0-9a-fA-F]{24}$/.test(lesson.Room) ? lesson.Room : 'Trống'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Svg_Area w={14} h={14} c='var(--text-primary)' />
                                    <span className='text-sm font-semibold text-[var(--text-primary)]'>Khu vực :</span>
                                    <span className="text-sm font-normal text-[var(--text-primary)]">{data.Area?.name || 'Trống'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <Svg_Map w={14} h={14} c='var(--text-primary)' />
                                    <span className='text-sm font-semibold text-[var(--text-primary)]'>Trạng thái lớp học :</span>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <p className="Chip text-xs font-normal text-[var(--text-primary)]" style={{ background: statusLesson[0] == 1 ? 'var(--green)' : 'var(--red)', color: 'white', padding: '4px 12px', borderRadius: 12, width: 'max-content' }}>
                                        Điểm danh
                                    </p>
                                    <p className="Chip text-xs font-normal text-[var(--text-primary)]" style={{ background: statusLesson[1] == 1 ? 'var(--green)' : 'var(--red)', color: 'white', padding: '4px 12px', borderRadius: 12, width: 'max-content' }}>
                                        Nhận xét
                                    </p>
                                    <p className="Chip text-xs font-normal text-[var(--text-primary)]" style={{ background: statusLesson[2] == 1 ? 'var(--green)' : 'var(--red)', color: 'white', padding: '4px 12px', borderRadius: 12, width: 'max-content' }}>
                                        Minh chứng
                                    </p>
                                </div>
                            </>}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <div className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ marginTop: 8, borderRadius: 5, background: 'var(--main_d)' }} onClick={reload}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={16} height={16} fill='white'>
                                    <path d="M105.1 202.6c7.7-21.8 20.2-42.3 37.8-59.8c62.5-62.5 163.8-62.5 226.3 0L386.3 160 352 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l111.5 0c0 0 0 0 0 0l.4 0c17.7 0 32-14.3 32-32l0-112c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 35.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5zM39 289.3c-5 1.5-9.8 4.2-13.7 8.2c-4 4-6.7 8.8-8.1 14c-.3 1.2-.6 2.5-.8 3.8c-.3 1.7-.4 3.4-.4 5.1L16 432c0 17.7 14.3 32 32 32s32-14.3 32-32l0-35.1 17.6 17.5c0 0 0 0 0 0c87.5 87.4 229.3 87.4 316.7 0c24.4-24.4 42.1-53.1 52.9-83.8c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.5 62.5-163.8 62.5-226.3 0l-.1-.1L125.6 352l34.4 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L48.4 288c-1.6 0-3.2 .1-4.8 .3s-3.1 .5-4.6 1z" /></svg>
                                <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Tải lại dữ liệu</p>
                            </div>
                            {(params.length > 1 && !data.Status) &&
                                <SendCmt data={data} lesson={params[1]}/>}
                            {params.length == 1 &&
                                <>
                                    {data.Status ?
                                        <div
                                            className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5'
                                            style={{
                                                marginTop: 8,
                                                borderRadius: 5,
                                                background: 'var(--green)',
                                                cursor: 'not-allowed',
                                                transform: 'none'
                                            }}

                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width={16} height={16} fill='white'>
                                                <path d="M96 80c0-26.5 21.5-48 48-48l288 0c26.5 0 48 21.5 48 48l0 304L96 384 96 80zm313 47c-9.4-9.4-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L409 161c9.4-9.4 9.4-24.6 0-33.9zM0 336c0-26.5 21.5-48 48-48l16 0 0 128 448 0 0-128 16 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48L48 480c-26.5 0-48-21.5-48-48l0-96z" />
                                            </svg>
                                            <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Đã hoàn thành</p>
                                        </div> : <div
                                            className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5'
                                            style={{
                                                marginTop: 8,
                                                borderRadius: 5,
                                                background: td.isCompleted ? 'var(--main_d)' : 'var(--border-color)',
                                                cursor: td.isCompleted ? 'pointer' : 'not-allowed'
                                            }}
                                            onClick={handleCompleteCourseClick}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width={16} height={16} fill='white'>
                                                <path d="M96 80c0-26.5 21.5-48 48-48l288 0c26.5 0 48 21.5 48 48l0 304L96 384 96 80zm313 47c-9.4-9.4-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L409 161c9.4-9.4 9.4-24.6 0-33.9zM0 336c0-26.5 21.5-48 48-48l16 0 0 128 448 0 0-128 16 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48L48 480c-26.5 0-48-21.5-48-48l0-96z" />
                                            </svg>
                                            <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}> Xác nhận hoàn thành</p>
                                        </div>}
                                    <Export />
                                    <TemplateSelector course={data} book={book} />
                                    <button
                                        type="button"
                                        onClick={() => setOpenDriveModal(true)}
                                        className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 flex items-center gap-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors whitespace-nowrap"
                                        style={{ marginTop: 8 }}
                                        title="Đổi Folder Google Drive ảnh cho lớp học (Bản Demo)"
                                    >
                                        <span>📁</span>
                                        <span>Folder Drive</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOpenAutoDateMatcher(true)}
                                        className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 flex items-center gap-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors whitespace-nowrap"
                                        style={{ marginTop: 8 }}
                                        title="Tự động đọc EXIF ngày chụp và phân loại ảnh vào 7 buổi học"
                                    >
                                        <span>⚡</span>
                                        <span>Khớp Ảnh Tự Động</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOpenReviewSheet(true)}
                                        className="px-3 py-2 bg-[var(--main_d)] hover:bg-[var(--main_b)] text-white flex items-center gap-1.5 rounded-lg text-xs font-semibold cursor-pointer border-none shadow-xs transition-colors whitespace-nowrap"
                                        style={{ marginTop: 8 }}
                                        title="Mở Bảng Tuyển Chọn AI & Xuất Bản ePortfolio Học Viên"
                                    >
                                        <span>✨</span>
                                        <span>Duyệt ePortfolio (AI)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOpenQrModal(true)}
                                        className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 flex items-center gap-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors whitespace-nowrap"
                                        style={{ marginTop: 8 }}
                                        title="Xem mã QR & Liên kết ePortfolio cho phụ huynh"
                                    >
                                        <span>Xuất & Mã QR</span>
                                    </button>
                                    <Link
                                        href="/preview-templates"
                                        className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 flex items-center gap-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors no-underline whitespace-nowrap"
                                        style={{ marginTop: 8 }}
                                        title="Xem & So Sánh 15 Mẫu Giao Diện"
                                    >
                                        <span>🎨</span>
                                        <span>Kho Template (15)</span>
                                    </Link>
                                    <Link
                                        href="/portfolio-lookbook"
                                        className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 flex items-center gap-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors no-underline whitespace-nowrap"
                                        style={{ marginTop: 8 }}
                                        title="Xem Kỷ Yếu ePortfolio Tạp Chí Khổ A4"
                                    >
                                        <span>📖</span>
                                        <span>Kỷ Yếu Lookbook</span>
                                    </Link>
                                </>

                            }
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', width: 180, gap: 8, flexWrap: 'wrap', height: 150 }}>
                    <div className={'w-[calc(50%-4px)] aspect-square'}><Student course={data} student={sortedStudents} /></div>
                    <div className={'w-[calc(50%-4px)] aspect-square'}><Calendar course={data} student={sortedStudents} /></div>
                    <div className={'w-[calc(50%-4px)] aspect-square'}><AnnounceStudent course={data} /></div>
                    <div className={'w-[calc(50%-4px)] aspect-square'}><Report course={data} student={sortedStudents} /></div>
                </div>
            </div>

            <div className={'bg-white rounded flex justify-between border border-[var(--border-color)]'}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <div style={{ padding: 16, display: 'flex' }}>
                        <div className='text-base font-semibold text-[var(--text-primary)]'>Thông tin học sinh</div>
                    </div>
                    <div style={{ display: 'flex', background: 'var(--border-color)' }}>
                        {title.map((e, i) => {
                            if (params.length > 1 && e.content === 'Buổi bù') return null;
                            const isSortable = ['m', 'k', 'c', 'b'].includes(e.data);

                            return (
                                <div key={i} className="text-sm font-normal text-[var(--text-primary)]" style={{ flex: e.flex, padding: '12px 8px', fontWeight: '500', display: 'flex', justifyContent: e.align, alignItems: 'center' }}>
                                    {isSortable ? (
                                        <button onClick={() => handleSort(e.data)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)' }}>
                                            {e.content}
                                            <SortIcon direction={sortConfig.key === e.data ? sortConfig.direction : null} />
                                        </button>
                                    ) : (
                                        e.content
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    {params.length > 1 ? detaillesson : detailcourse}
                </div>
            </div>

            <div className={'bg-white rounded flex justify-between border border-[var(--border-color)]'}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <p style={{ padding: 16, borderBottom: 'thin solid var(--border-color)' }} className='text-base font-semibold text-[var(--text-primary)]'>Hình ảnh</p>
                    <div style={{ padding: 8 }}>
                        {images.length > 0 ? (
                            <ResponsiveGrid items={lessProductItems} columns={listColumnsConfig} type="list" />
                        ) : (
                            <div style={{ padding: 16, textAlign: 'center' }} className='text-sm font-normal text-[var(--text-primary)]'>Không có hình ảnh nào.</div>
                        )}
                    </div>
                </div>
            </div>

            <div className={'bg-white rounded flex justify-between border border-[var(--border-color)]'}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <p style={{ padding: 16, borderBottom: 'thin solid var(--border-color)' }} className='text-base font-semibold text-[var(--text-primary)]'>Video thuyết trình</p>
                    <div style={{ padding: 8 }}>
                        {videos.length > 0 ? (
                            <ResponsiveGrid items={lessProductVideos} columns={listColumnsConfig} type="list" />
                        ) : (
                            <div style={{ padding: 16, textAlign: 'center' }} className='text-sm font-normal text-[var(--text-primary)]'>Không có video nào.</div>
                        )}
                    </div>
                </div>
            </div>

            {params.length > 1 &&
                <div className={'bg-white rounded flex justify-between border border-[var(--border-color)]'}>
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <p style={{ padding: 16, borderBottom: 'thin solid var(--border-color)' }} className='text-base font-semibold text-[var(--text-primary)]'>Tài nguyên giảng dạy</p>
                        <div style={{ padding: 8 }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                <BoxFile type='Ppt' name='Slide giảng dạy' href={slide} />
                            </div>
                        </div>
                    </div>
                </div>
            }

            {loading && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                <Loading />
            </div>}

            <Noti
                open={notification.open}
                onClose={() => setNotification({ ...notification, open: false })}
                status={notification.status}
                mes={notification.mes}
            />

            <ReviewSheetModal
                isOpen={openReviewSheet}
                onClose={() => setOpenReviewSheet(false)}
                course={data}
                students={sortedStudents}
                onSuccess={() => {
                    setNotification({
                        open: true,
                        status: true,
                        mes: '⚡ Xuất bản Portfolio & hoàn thành khóa học thành công!'
                    });
                    reload();
                }}
            />

            <DriveFolderModal
                isOpen={openDriveModal}
                onClose={() => setOpenDriveModal(false)}
                course={data}
                onSuccess={() => {
                    setNotification({
                        open: true,
                        status: true,
                        mes: '📁 Đã cập nhật Folder Drive cho khóa học (Bản demo)!'
                    });
                    reload();
                }}
            />

            <AutoDateMatcherModal
                isOpen={openAutoDateMatcher}
                onClose={() => setOpenAutoDateMatcher(false)}
                course={data}
                onSuccess={() => {
                    setNotification({
                        open: true,
                        status: true,
                        mes: '✨ Đã phân loại và tải lên toàn bộ ảnh vào Google Drive thành công!'
                    });
                    reload();
                }}
            />

            <ShareQrModal
                isOpen={openQrModal}
                onClose={() => setOpenQrModal(false)}
                course={data}
                students={data?.aiPortfolioDraft || sortedStudents || []}
            />
        </div>
    )
}

const title = [
    { content: 'ID', flex: 0.5, data: 'ID', align: 'start' },
    { content: 'Họ và tên', flex: 1, data: 'Name', align: 'start' },
    { content: 'Có mặt', flex: 0.5, data: 'm', align: 'center' },
    { content: 'Không phép', flex: 0.5, data: 'k', align: 'center' },
    { content: 'Có phép', flex: 0.5, data: 'c', align: 'center' },
    { content: 'Thêm', flex: 1, data: 'More', align: 'center' },
]

function enrichStudents(course, now = new Date()) {
    if (!course || !course.Detail) {
        return [];
    }

    const pastLessonIds = new Set(
        course.Detail
            .filter(({ Day }) => {
                if (!Day) return false;
                return new Date(Day) <= now;
            })
            .map(({ _id }) => _id.toString())
    );

    const totalPastLessons = pastLessonIds.size;

    if (!course.Student) {
        return [];
    }

    const seen = new Set();
    return course.Student.filter(stu => {
        const key = stu._id?.toString() || stu.ID;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    }).map(stu => {
        const counts = [0, 0, 0, 0];

        if (stu.Learn && Array.isArray(stu.Learn)) {
            for (const learnItem of stu.Learn) {
                const { Lesson, Checkin } = learnItem;
                const lessonIdStr = Lesson?.toString();

                if (!lessonIdStr || !pastLessonIds.has(lessonIdStr)) {
                    continue;
                }

                const idx = Number(Checkin);
                if (!isNaN(idx) && idx >= 0 && idx <= 3) {
                    counts[idx] += 1;
                }
            }
        }
        const [_, m, k, c] = counts;
        return { ...stu, m, k, c };
    });
}

const Cell = ({ flex, align, children }) => (
    <div style={{ flex, padding: '8px 8px', display: 'flex', justifyContent: align }} className="text-sm font-normal text-[var(--text-primary)]" > {children} </div>
);