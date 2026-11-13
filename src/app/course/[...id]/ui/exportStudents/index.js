'use client';

import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import { course_data } from '@/data/actions/get';
import Title from '@/components/(features)/(popup)/title';
import { Svg_Out } from '@/components/(icon)/svg';

// Import thêm Noti và Loading
import Noti from '@/components/(features)/(noti)/noti';
import Loading from '@/components/(ui)/(loading)/loading';
import { getEportfolioUrl } from '@/utils/env'


export default function Export() {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [apiState, setApiState] = useState({
        loading: false,
        data: null,
        error: null,
    });
    // State mới cho việc xuất file
    const [isExporting, setIsExporting] = useState(false);
    const [toast, setToast] = useState({ open: false, status: false, mes: '', link: '' });

    const [columnVisibility, setColumnVisibility] = useState({
        stt: true,
        id: true,
        name: true,
        courseId: true,
        courseName: true,
        feeStatus: true,
        eport: true,
    });
    const pathname = usePathname();

    const handleReload = useCallback(async () => {
        setIsPopupOpen(true);
        setApiState({ loading: true, data: null, error: null });

        try {
            const result = await course_data(pathname.split('/')[2]);
            setApiState({ loading: false, data: result, error: null });
        } catch (err) {
            setApiState({ loading: false, data: null, error: err.message || 'An error occurred' });
        }
    }, [pathname]);

    const closePopup = () => setIsPopupOpen(false);

    const toggleColumn = (column) => {
        setColumnVisibility(prevState => ({
            ...prevState,
            [column]: !prevState[column]
        }));
    };

    // Hàm xử lý xuất Excel mới
    const handleExportExcel = async () => {
        if (!apiState.data || !apiState.data.Student) {
            setToast({ open: true, status: false, mes: 'Không có dữ liệu để xuất.', link: '' });
            return;
        }

        setIsExporting(true);

        const payload = {
            courseId: apiState.data.ID,
            courseName: apiState.data.Book.Name,
            students: apiState.data.Student.map((student, index) => ({
                stt: index + 1,
                id: student.ID,
                name: student.Name,
                feeStatus: student.StatusCourse ? 'Đã thanh toán' : 'Chưa thanh toán',
                eport: `${getEportfolioUrl()}/e-portfolio/${student.userId}`
            }))
        };

        try {
            const response = await fetch('/api/exportx', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                setToast({ open: true, status: true, mes: 'Xuất Excel thành công!', link: url });
            } else {
                const msg = await response.text();
                setToast({ open: true, status: false, mes: msg || 'Xuất thất bại', link: '' });
            }
        } catch (error) {
            console.error("Lỗi khi xuất Excel:", error);
            setToast({ open: true, status: false, mes: 'Có lỗi khi gọi API', link: '' });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            <div>
                {/* Nút bấm để kích hoạt */}
                <div
                    className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5'
                    style={{ marginTop: 8, borderRadius: 5, background: 'var(--main_d)', cursor: 'pointer' }}
                    onClick={handleReload}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><g fill="none"><path d="M24 0v24H0V0z" /><path fill="#FFF" d="M15 5.5a3.5 3.5 0 1 1 .994 2.443L11.67 10.21c.213.555.33 1.16.33 1.79a4.99 4.99 0 0 1-.33 1.79l4.324 2.267a3.5 3.5 0 1 1-.93 1.771l-4.475-2.346a5 5 0 1 1 0-6.963l4.475-2.347A3.524 3.524 0 0 1 15 5.5" /></g></svg>
                    <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Xuất thông tin</p>
                </div>

                {/* Popup hiển thị trạng thái */}
                <CenterPopup
                    open={isPopupOpen}
                    onClose={closePopup}
                    size="lg"
                >
                    <Title content={'Xuất dữ liệu học sinh trong khóa học'} click={closePopup} />
                    {apiState.loading && <p>Đang tải, vui lòng chờ... ⏳</p>}
                    {apiState.error && <p style={{ color: 'red' }}>Lỗi: {apiState.error} ❌</p>}
                    {apiState.data && (
                        <div>
                            <div style={{ display: 'flex', gap: '10px', padding: 8, justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                    {Object.keys(columnVisibility).map(key => (
                                        <button key={key} onClick={() => toggleColumn(key)} className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ textTransform: 'capitalize', transform: 'none', margin: 0, background: columnVisibility[key] ? 'var(--green)' : 'grey', color: 'white' }}>
                                            {key}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={handleExportExcel} disabled={isExporting} className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ transform: 'none', margin: 0, background: 'var(--main_d)' }}>
                                    {isExporting ? 'Đang xuất...' : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><g fill="none"><path d="M24 0v24H0V0z" /><path fill="#FFF" d="M15 5.5a3.5 3.5 0 1 1 .994 2.443L11.67 10.21c.213.555.33 1.16.33 1.79a4.99 4.99 0 0 1-.33 1.79l4.324 2.267a3.5 3.5 0 1 1-.93 1.771l-4.475-2.346a5 5 0 1 1 0-6.963l4.475-2.347A3.524 3.524 0 0 1 15 5.5" /></g></svg>
                                            Xuất Excel
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Data Table */}
                            <div style={{ border: '1px solid var(--border-color)', margin: 8, marginTop: 0, maxHeight: '60vh', overflow: 'auto' }}>
                                {/* ...Nội dung bảng giữ nguyên... */}
                                <div style={{ display: 'flex', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', background: '#f8f9fa', position: 'sticky', top: 0 }}>
                                    {columnVisibility.stt && <div style={{ flex: 0.3, padding: '8px', borderRight: '1px solid var(--border-color)' }}>STT</div>}
                                    {columnVisibility.id && <div style={{ flex: 1, padding: '8px', borderRight: '1px solid var(--border-color)' }}>ID</div>}
                                    {columnVisibility.name && <div style={{ flex: 2, padding: '8px', borderRight: '1px solid var(--border-color)' }}>Name</div>}
                                    {columnVisibility.courseId && <div style={{ flex: 1, padding: '8px', borderRight: '1px solid var(--border-color)' }}>Course ID</div>}
                                    {columnVisibility.courseName && <div style={{ flex: 2, padding: '8px', borderRight: '1px solid var(--border-color)' }}>Course Name</div>}
                                    {columnVisibility.feeStatus && <div style={{ flex: 1, padding: '8px', borderRight: '1px solid var(--border-color)' }}>Fee Status</div>}
                                    {columnVisibility.eport && <div style={{ flex: 1, padding: '8px' }}>ePort</div>}
                                </div>
                                {apiState.data.Student.map((student, index) => (
                                    <div key={student._id} style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
                                        {columnVisibility.stt && <div style={{ flex: 0.3, padding: '8px', borderRight: '1px solid #eee' }}>{index + 1}</div>}
                                        {columnVisibility.id && <div style={{ flex: 1, padding: '8px', borderRight: '1px solid #eee' }}>{student.ID}</div>}
                                        {columnVisibility.name && <div style={{ flex: 2, padding: '8px', borderRight: '1px solid #eee' }}>{student.Name}</div>}
                                        {columnVisibility.courseId && <div style={{ flex: 1, padding: '8px', borderRight: '1px solid #eee' }}>{apiState.data.ID}</div>}
                                        {columnVisibility.courseName && <div style={{ flex: 2, padding: '8px', borderRight: '1px solid #eee' }}>{apiState.data.Book.Name}</div>}
                                        {columnVisibility.feeStatus && <div style={{ flex: 1, padding: '8px', borderRight: '1px solid #eee', color: student.StatusCourse ? 'green' : 'red' }}>{student.StatusCourse ? 'Đã thanh toán' : 'Chưa thanh toán'}</div>}
                                        {columnVisibility.eport && <div style={{ flex: 1, padding: '8px' }}><a href={`${getEportfolioUrl()}/e-portfolio/${student.userId}`} target="_blank" rel="noopener noreferrer">Xem hồ sơ</a></div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CenterPopup>
            </div>

            {/* Component Loading và Noti */}
            {isExporting && (
                <div className='loadingOverlay'>
                    <Loading content={<p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Đang xuất Excel...</p>} />
                </div>
            )}
            <Noti
                open={toast.open}
                status={toast.status}
                mes={toast.mes}
                onClose={() => setToast({ ...toast, open: false })}
                button={
                    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ border: 'none' }} onClick={() => setToast({ ...toast, open: false })}>Thoát</button>
                        {toast.link && (
                            <a
                                href={toast.link}
                                download={`Danh_sach_hoc_sinh_${apiState.data?.ID}.xlsx`}
                                className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5'
                                style={{ border: 'none', background: 'var(--green)', textDecoration: 'none' }}
                                onClick={() => setToast({ ...toast, open: false })}
                            >
                                Tải Excel
                            </a>
                        )}
                    </div>
                }
            />
        </>
    );
}