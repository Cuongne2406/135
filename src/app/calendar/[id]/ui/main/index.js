'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Re_lesson } from '@/data/course';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import CommentForm from '../formcmt';
import BoxFile from '@/components/(ui)/(box)/file';
import Loading from '@/components/(ui)/(loading)/loading';
import Noti from '@/components/(features)/(noti)/noti';
import Image from 'next/image';
import ImageUploader from '../formimage';
import StudentCourseImageManager from '../formimages';
import { Svg_Detail } from '@/components/(icon)/svg';
import Link from 'next/link';
import { srcImage } from '@/function';

const updateAttendance = async (courseId, sessionId, attendanceData) => {
    const r = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, sessionId, attendanceData })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
};

export default function Main({ data }) {
    const { course, session, students } = data;
    const [showComment, setShowComment] = useState(false);
    const [selStu, setSelStu] = useState(null);
    const [att, setAtt] = useState({});
    const [cmts, setCmts] = useState({});

    const [saving, setSaving] = useState(false);
    const [notiOpen, setNotiOpen] = useState(false);
    const [notiOK, setNotiOK] = useState(false);
    const [notiMsg, setNotiMsg] = useState('');

    const [showImagePopup, setShowImagePopup] = useState(false);
    const [popupImageUrl, setPopupImageUrl] = useState('');

    const router = useRouter();

    const isTrialCourse = course?.type === 'trial' || false;

    const roll = (students || []).map(stu => ({
        ID: stu.ID,
        Name: stu.Name,
        Image: stu.attendance?.Image ?? [],
        Checkin: stu.attendance?.Checkin,
        absenceReason: stu.attendance?.absenceReason ?? '',
        originalComment: stu.attendance?.Cmt ?? [],
        Avt: srcImage(stu.Avt)
    }));

    const cur = s => (att[s.ID] !== undefined ? att[s.ID] : s.Checkin);

    const cm = roll.filter(s => cur(s) == '1').length;
    const vk = roll.filter(s => cur(s) == '2').length;
    const vc = isTrialCourse ? 0 : roll.filter(s => cur(s) == '3').length;

    const changeAtt = (id, v) => setAtt(prev => ({ ...prev, [id]: v }));

    const saveComment = arr => {
        if (selStu) setCmts(p => ({ ...p, [selStu.ID]: arr }));
        setShowComment(false);
        setSelStu(null);
    };

    const buildPayload = () => {
        const arr = [];
        Object.keys(att).forEach(id =>
            arr.push({ studentId: id, checkin: att[id], comment: cmts[id] })
        );
        Object.keys(cmts).forEach(id => {
            if (!arr.find(i => i.studentId === id)) {
                const stu = roll.find(s => s.ID === id);
                if (stu) arr.push({ studentId: id, checkin: stu.Checkin, comment: cmts[id] });
            }
        });
        return arr;
    };

    const saveAll = async () => {
        const payload = buildPayload();
        if (!payload.length) {
            setNotiOK(false); setNotiMsg('Không có thay đổi nào để lưu!'); setNotiOpen(true); return;
        }

        setSaving(true);
        try {
            const res = await updateAttendance(course._id, session._id, payload);
            setNotiOK(res.status === 2);
            setNotiMsg(res.mes || (res.status === 2 ? 'Lưu thành công!' : 'Lưu thất bại!'));

            if (res.status === 2) {
                setAtt({}); setCmts({});
                await Re_lesson(session._id);
                router.refresh();
            }
        } catch {
            setNotiOK(false); setNotiMsg('Có lỗi xảy ra khi gọi API!');
        } finally {
            setSaving(false); setNotiOpen(true);
        }
    };

    const notiBtn = (
        <button
            onClick={() => setNotiOpen(false)}
            style={{
                alignSelf: 'flex-start', padding: '10px 26px', border: 'none', borderRadius: 6,
                background: 'var(--main_d)', color: '#fff', fontWeight: 500, cursor: 'pointer',
                transition: 'opacity .25s', width: '100%'
            }}
        >
            Tắt thông báo
        </button>
    );

    const reloadData = async () => {
        setSaving(true);
        try {
            await Re_lesson(data.session._id);
            router.refresh();
        } catch {
            setSaving(false);
        }
    }

    const handleImageClick = (imageUrl) => {
        setPopupImageUrl(imageUrl);
        setShowImagePopup(true);
    };

    const headers = isTrialCourse
        ? ['ID', 'Học sinh', 'Có mặt', 'Vắng mặt', 'Nhận xét']
        : ['ID', 'Học sinh', 'Có mặt', 'Vắng mặt', 'Có phép', 'Nhận xét'];

    const attendanceOptions = isTrialCourse ? ['1', '2'] : ['1', '2', '3'];

    return (
        <>
            {saving && (
                <div className="fixed bg-black/35 flex justify-center items-center w-full h-full top-0 left-0 z-[1200]">
                    <Loading content="Đang lưu điểm danh…" />
                </div>
            )}

            <Noti open={notiOpen} onClose={() => setNotiOpen(false)}
                status={notiOK} mes={notiMsg} button={notiBtn} />

            {showImagePopup && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050, cursor: 'pointer' }} onClick={() => setShowImagePopup(false)}>
                    <div style={{ position: 'relative', width: '60vh', height: '60vh', backgroundColor: 'white', overflow: 'hidden', borderRadius: '8px' }} onClick={(e) => e.stopPropagation()}>
                        <Image src={popupImageUrl} alt="Student Avatar Popup" fill sizes="60vh" style={{ objectFit: 'contain' }} unoptimized />
                    </div>
                </div>
            )}

            <div className="flex flex-col w-full overflow-hidden rounded-lg h-[calc(100%-2px)] bg-[var(--bg-primary)] border border-[var(--border-color)]">
                <header className="flex items-center justify-between bg-[var(--bg-primary)] text-[var(--text-primary)] px-6 py-3 border-b border-[var(--border-color)]">
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <p className="text-lg font-semibold text-[var(--text-primary)]" style={{ color: 'var(--text-primary)' }}>{course.ID ?? '-'} – Chủ đề: {session.Topic.Name ?? '-'}</p>
                        <Link href={`/course/${course._id}`} className='px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100' >
                            <Svg_Detail w={16} h={16} c={'var(--main_d)'} />
                            <h5>Chi tiết khóa học</h5>
                        </Link>
                    </div>
                    <div className="flex gap-3">
                        <h5 className={`px-4 py-2 rounded border-2 border-[#43a300] bg-[#e6f4e6] text-[#1f4d1f]`}>Có mặt: {cm}</h5>
                        <h5 className={`px-4 py-2 rounded border-2 border-[#cc1d1d] bg-[#fdecea] text-[#5a1a1a]`}>Vắng mặt: {vk + (isTrialCourse ? vc : 0)}</h5>
                        {!isTrialCourse && (
                            <h5 className={`px-4 py-2 rounded border-2 border-[#d6a800] bg-[#fff8e1] text-[#665900]`}>Vắng có phép: {vc}</h5>
                        )}
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    <aside className="w-[240px] p-6 bg-[var(--bg-primary)] border-r border-[var(--border-color)] overflow-y-auto flex flex-col gap-4">
                        <p className="text-base font-semibold text-[var(--text-primary)]">Tài liệu buổi học</p>
                        {course.Version == 0 ? (<BoxFile type="Image" name="Hình ảnh buổi học" href={`https://drive.google.com/drive/folders/${session.Image}`} />) : <ImageUploader session={session} courseId={course.ID} />}
                        {session.Topic?.Slide && <BoxFile type="Ppt" name="Slide giảng dạy" href={session.Topic.Slide} />}
                    </aside>

                    <main className="flex-1 p-6 overflow-y-auto">
                        <p className="text-base font-semibold text-[var(--text-primary)]" style={{ marginBottom: 16 }}>Thông tin buổi học</p>
                        <section className="bg-[var(--bg-primary)] rounded border border-[var(--border-color)] p-4">
                            <div className="flex gap-4 bg-[var(--main_d)] text-white p-2 rounded">
                                <h5 style={{ color: 'white' }}>Thời gian: <span className="font-normal">{session.Time}</span></h5>
                                <h5 style={{ color: 'white' }}>Giáo viên: <span className="font-normal">{session.Teacher.name}</span></h5>
                                <h5 style={{ color: 'white' }}>Trợ giảng: <span className="font-normal">{session.TeachingAs?.name || '–'}</span></h5>
                            </div>
                            <div className="h-px bg-[#e0e0e0] my-3" />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <p className="text-base font-semibold text-[var(--text-primary)]">Sổ điểm danh</p>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={reloadData} disabled={saving} className="text-sm font-normal text-[var(--text-primary)]" style={{ padding: '8px 16px', background: saving ? 'var(--text-secondary)' : 'var(--green)', color: '#fff', border: 'none', borderRadius: 5, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {saving && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                        {saving ? 'Đang tải lại…' : 'Tải lại dữ liệu '}
                                    </button>
                                    <button onClick={saveAll} disabled={saving} className="text-sm font-normal text-[var(--text-primary)]" style={{ padding: '8px 16px', background: saving ? 'var(--text-secondary)' : 'var(--green)', color: '#fff', border: 'none', borderRadius: 5, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {saving && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                        {saving ? 'Đang lưu…' : 'Lưu tất cả thay đổi'}
                                    </button>
                                </div>
                            </div>
                            {roll.length ? (
                                <>
                                    <div className="flex items-center transition-colors duration-200 bg-[var(--main_d)] rounded text-white mt-2 border-b border-[var(--border-color)]">
                                        {headers.map((t, i) => (
                                            <div key={t} className="text-sm font-normal text-[var(--text-primary)]" style={{ flex: t === 'Học sinh' ? 3 : (t === 'Có mặt' || t === 'Vắng mặt') ? (isTrialCourse ? 1.5 : 1) : 1, color: '#fff', padding: i <= 1 ? 8 : '8px 0', textAlign: i <= 1 ? 'left' : 'center' }}>
                                                {t}
                                            </div>
                                        ))}
                                        {course.Version != 0 && (<div className="text-sm font-normal text-[var(--text-primary)]" style={{ flex: 1, color: '#fff', padding: '8px 0', textAlign: 'center' }}>Hình ảnh</div>)}
                                    </div>
                                    {roll.map(stu => {
                                        if (stu.Checkin == '-1') return null;

                                        const currentCheckinValue = cur(stu);
                                        let displayValue = currentCheckinValue;
                                        if (isTrialCourse) {
                                            displayValue = (currentCheckinValue == 1) ? '1' : '2';
                                        }

                                        return (
                                            <div key={stu.ID} className="flex items-center transition-colors duration-200 hover:bg-[var(--hover)]" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                                                <div className="text-sm font-normal text-[var(--text-primary)]" style={{ flex: 1, padding: '12px 8px', fontWeight: 500 }}>{stu.ID}</div>
                                                <div className="text-sm font-normal text-[var(--text-primary)]" style={{ flex: 3, padding: '0 8px', fontWeight: 500, display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    <div className="w-9 h-9 relative shrink-0 overflow-hidden cursor-pointer" style={{ borderRadius: 5 }} onClick={() => handleImageClick(stu.Avt)}>
                                                        <Image fill sizes="35px" className="object-cover" src={stu.Avt} alt={stu.Name} unoptimized />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="truncate">{stu.Name}</span>
                                                        {(cur(stu) == '3' || Boolean(stu.absenceReason)) && (
                                                            <span 
                                                                className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-0.5 truncate max-w-[220px]"
                                                                title={stu.absenceReason || 'Phụ huynh xin nghỉ phép'}
                                                            >
                                                                <span>⚠️</span>
                                                                <span className="truncate">{stu.absenceReason ? `Phép: ${stu.absenceReason}` : 'Vắng có phép'}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{ flex: 3, display: 'flex', alignItems: 'center' }}>
                                                    {attendanceOptions.map(v => (
                                                        <label key={v} style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '16px 0', cursor: 'pointer' }}>
                                                            <input type="radio" name={`att_${stu.ID}`} value={v}
                                                                checked={displayValue == v}
                                                                onChange={() => changeAtt(stu.ID, v)}
                                                                style={{ transform: 'scale(1.1)', cursor: 'pointer' }} />
                                                        </label>
                                                    ))}
                                                </div>
                                                <button onClick={() => { setSelStu(stu); setShowComment(true); }} style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: 0, alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--text-primary)"><path d="M14 11c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1s.45-1 1-1h9c.55 0 1-.45 1-1M3 7c0 .55.45 1 1 1h9c.55 0 1-.45 1-1s-.45-1-1-1H4c-.55 0-1 .45-1 1m7 8c0-.55-.45 1-1-1H4c-.55 0-1 .45-1 1s.45 1 1 1h5c.55 0 1-.45 1-1m8.01-2.13.71-.71c.39-.39 1.02-.39 1.41 0l.71.71c.39.39.39 1.02 0 1.41l-.71.71zm-.71.71-5.16 5.16c-.09.09-.14.21-.14.35v1.41c0 .28.22.5.5.5h1.41c.13 0 .26-.05.35-.15l5.16-5.16z" /></svg>
                                                </button>
                                                {course.Version != 0 && (
                                                    <StudentCourseImageManager courseInfo={data.session} studentInfo={stu} course={data.course} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </>
                            ) : (
                                <div className="p-4 text-center text-[#777]"><p>Không có học sinh tham gia khóa học</p></div>
                            )}
                        </section>
                    </main>
                </div>
            </div>

            <CenterPopup open={showComment} onClose={() => setShowComment(false)} size="lg">
                <CommentForm
                    student={selStu}
                    initialComment={selStu ? cmts[selStu.ID] || selStu.originalComment : []}
                    onSave={saveComment}
                    onCancel={() => setShowComment(false)}
                />
            </CenterPopup>
        </>
    );
}
