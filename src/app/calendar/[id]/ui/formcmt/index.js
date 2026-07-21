'use client';

import { useState, useMemo } from 'react';
import Title from '@/components/(features)/(popup)/title';
import Menu from '@/components/(ui)/(button)/menu';

const TDHT_OPTIONS = [
    'Nhiệt tình và chăm chỉ',
    'Tích cực và chủ động',
    'Kiên trì và cầu tiến',
    'Sáng tạo và linh hoạt',
    'Tích cực hợp tác và tương tác',
    'Thiếu tập trung trong giờ học',
    'Hạn chế trong việc lắng nghe và tiếp thu ý kiến',
];
const KQHT_OPTIONS = [
    'Nắm bắt tốt các kiến thức cơ bản',
    'Kết quả học tập ổn định',
    'Thể hiện tư duy tốt nhưng cần thêm thời gian để hoàn thiện',
    'Tiềm năng lớn nhưng chưa tối đa hóa',
    'Cần cải thiện kỹ năng trình bày và làm việc nhóm',
    'Còn hạn chế ở một số kiến thức nâng cao',
];
const DCCT_OPTIONS = [
    'Cần tăng cường sự tập trung',
    'Phát triển tư duy phân tích',
    'Cải thiện tính tự giác',
    'Chú ý hơn đến cách trình bày và tính cẩn thận',
    'Khắc phục tính dễ nản khi gặp bài khó',
    'Tăng cường tính tương tác trong giờ học',
    'Cố gắng tiếp tục phát huy những điểm mạnh của mình',
];


/* ─────────────────── Form chính ─────────────────── */
export default function CommentForm({
    student,
    initialComment = [],
    onSave,
    onCancel,
}) {
    const init = useMemo(
        () => (Array.isArray(initialComment) ? initialComment : []),
        [initialComment]
    );

    // State lưu các giá trị đã chọn
    const [tdht, setTdht] = useState(init.filter((v) => TDHT_OPTIONS.includes(v)));
    const [kqht, setKqht] = useState(init.filter((v) => KQHT_OPTIONS.includes(v)));
    const [dcct, setDcct] = useState(init.filter((v) => DCCT_OPTIONS.includes(v)));

    // --- MỚI: Logic để khởi tạo và quản lý state cho textarea ---
    const initialOtherComment = useMemo(() => {
        if (!Array.isArray(initialComment)) return '';
        const allOptions = [...TDHT_OPTIONS, ...KQHT_OPTIONS, ...DCCT_OPTIONS];
        return initialComment.find(comment => !allOptions.includes(comment)) || '';
    }, [initialComment]);

    const [otherComment, setOtherComment] = useState(initialOtherComment);
    // --- KẾT THÚC PHẦN MỚI ---

    // State kiểm soát việc mở/đóng cho từng Menu
    const [isTdhtMenuOpen, setTdhtMenuOpen] = useState(false);
    const [isKqhtMenuOpen, setKqhtMenuOpen] = useState(false);
    const [isDcctMenuOpen, setDcctMenuOpen] = useState(false);

    const handleReset = () => {
        setTdht([]);
        setKqht([]);
        setDcct([]);
        setOtherComment(''); // <-- SỬA: Reset cả state của textarea
    };

    // Hàm chung để xử lý khi chọn một mục
    const handleSelect = (setter, setMenuOpen, option) => {
        setter(prev => [...prev, option]);
        setMenuOpen(false);
    };

    // Hàm chung để xử lý khi xóa một mục (chip)
    const handleRemove = (setter, option) => {
        setter(prev => prev.filter(v => v !== option));
    };

    // Hàm chung để render danh sách các mục trong menu
    const renderMenuItems = (options, selectedValues, setter, setMenuOpen) => useMemo(() => (
        <div className="p-1.5 bg-white border border-[var(--border-color)] rounded-lg shadow-[0_6px_24px_rgba(0,0,0,0.10)] max-h-[220px] overflow-y-auto">
            <div className="flex flex-col" style={{ gap: 3 }}>
                {options
                    .filter(o => !selectedValues.includes(o))
                    .map((option) => (
                        <p
                            key={option}
                            onClick={() => handleSelect(setter, setMenuOpen, option)}
                            className="rounded-md m-0 px-3 py-2.5 cursor-pointer list-none transition-colors duration-150 hover:bg-[var(--hover)] text-xs font-normal text-[var(--text-primary)]"
                        >
                            {option}
                        </p>
                    ))}
                {options.filter(o => !selectedValues.includes(o)).length === 0 && (
                    <p className="rounded-md m-0 px-3 py-2.5 cursor-pointer list-none transition-colors duration-150 text-[#999] cursor-not-allowed bg-transparent">Đã chọn hết</p>
                )}
            </div>
        </div>
    ), [options, selectedValues]);


    return (
        <>
            <Title content={'Nhận xét học sinh'} click={onCancel} />
            <div className="flex flex-col w-full overflow-hidden rounded-lg h-[calc(100%-2px)] bg-[var(--bg-primary)] border border-[var(--border-color)]">
                <div style={{ padding: 16 }}>
                    {/* --- Student Info & Reset Button --- */}
                    <div className="flex items-center mb-4 justify-between gap-3">
                        <div className="p-2.5 gap-4 bg-[var(--bg-secondary)] flex items-center flex-1 rounded">
                            <p className='text-sm font-semibold text-[var(--text-primary)]'>Tên học sinh: <span> {student?.Name}</span></p>
                            <p className='text-sm font-semibold text-[var(--text-primary)]'>ID học sinh: <span> {student?.ID}</span></p>
                        </div>
                        {/* --- SỬA: Cập nhật điều kiện disabled cho nút Reset --- */}
                        <button type="button" onClick={handleReset} disabled={!tdht.length && !kqht.length && !dcct.length && !otherComment.length} className="bg-[var(--main_d)] text-white border-none rounded px-4 h-10 shadow-[0_1px_4px_#e0e0e0] transition-[background,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-50 not-disabled:cursor-pointer text-sm font-normal">
                            Reset
                        </button>
                    </div>

                    {/* --- Menu cho Thái độ học tập --- */}
                    <div className="flex flex-col gap-1.5 relative mb-2">
                        <p className='text-sm font-semibold text-[var(--text-primary)]' style={{ padding: '8px 0 2px 0' }}>Thái độ học tập</p>
                        <Menu
                            isOpen={isTdhtMenuOpen}
                            onOpenChange={setTdhtMenuOpen}
                            menuItems={renderMenuItems(TDHT_OPTIONS, tdht, setTdht, setTdhtMenuOpen)}
                            customButton={
                                <div
                                    className={`relative flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-[#f8fafc] rounded-lg border border-[var(--border-color)] cursor-pointer transition-colors duration-200 hover:border-[var(--main_d)] ${isTdhtMenuOpen ? 'border-[var(--main_d)]' : ''}`}
                                    onClick={() => setTdhtMenuOpen(true)}
                                >
                                    {tdht.length === 0 ? <span className="text-[var(--text-secondary)] p-1.5 text-xs font-normal text-[var(--text-primary)]">Chọn nhận xét</span> : tdht.map(v => (
                                        <span key={v} className="bg-[var(--border-color)] text-[var(--text-primary)] px-3 py-1.5 rounded inline-flex items-center gap-2 text-xs font-normal text-[var(--text-primary)]" onClick={e => e.stopPropagation()}>
                                            {v}
                                            <span className="cursor-pointer text-[var(--text-primary)] font-bold text-base leading-none hover:text-[var(--red)]" onClick={() => handleRemove(setTdht, v)}>×</span>
                                        </span>
                                    ))}
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--main_d)] text-lg">{isTdhtMenuOpen ? '▴' : '▾'}</span>
                                </div>
                            }
                        />
                    </div>

                    {/* --- Menu cho Kết quả học tập --- */}
                    <div className="flex flex-col gap-1.5 relative mb-2">
                        <p className='text-sm font-semibold text-[var(--text-primary)]' style={{ padding: '8px 0 2px 0' }}>Kết quả học tập</p>
                        <Menu
                            isOpen={isKqhtMenuOpen}
                            onOpenChange={setKqhtMenuOpen}
                            menuItems={renderMenuItems(KQHT_OPTIONS, kqht, setKqht, setKqhtMenuOpen)}
                            menuPosition='top'
                            customButton={
                                <div className={`relative flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-[#f8fafc] rounded-lg border border-[var(--border-color)] cursor-pointer transition-colors duration-200 hover:border-[var(--main_d)] ${isKqhtMenuOpen ? 'border-[var(--main_d)]' : ''}`} onClick={() => setKqhtMenuOpen(true)}   >
                                    {kqht.length === 0 ? <span className="text-[var(--text-secondary)] p-1.5 text-xs font-normal text-[var(--text-primary)]">Chọn nhận xét</span> : kqht.map(v => (
                                        <span key={v} className="bg-[var(--border-color)] text-[var(--text-primary)] px-3 py-1.5 rounded inline-flex items-center gap-2 text-xs font-normal text-[var(--text-primary)]" onClick={e => e.stopPropagation()}>
                                            {v} <span className="cursor-pointer text-[var(--text-primary)] font-bold text-base leading-none hover:text-[var(--red)]" onClick={() => handleRemove(setKqht, v)}>×</span>
                                        </span>
                                    ))}
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--main_d)] text-lg">{isKqhtMenuOpen ? '▴' : '▾'}</span>
                                </div>
                            }
                        />
                    </div>

                    {/* --- Menu cho Điều cần cải thiện --- */}
                    <div className="flex flex-col gap-1.5 relative mb-2">
                        <p className='text-sm font-semibold text-[var(--text-primary)]' style={{ padding: '8px 0 2px 0' }}>Điều cần cải thiện</p>
                        <Menu
                            isOpen={isDcctMenuOpen}
                            onOpenChange={setDcctMenuOpen}
                            menuItems={renderMenuItems(DCCT_OPTIONS, dcct, setDcct, setDcctMenuOpen)}
                            menuPosition='top'
                            customButton={
                                <div
                                    className={`relative flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-[#f8fafc] rounded-lg border border-[var(--border-color)] cursor-pointer transition-colors duration-200 hover:border-[var(--main_d)] ${isDcctMenuOpen ? 'border-[var(--main_d)]' : ''}`}
                                    onClick={() => setDcctMenuOpen(true)}
                                >
                                    {dcct.length === 0 ? <span className="text-[var(--text-secondary)] p-1.5 text-xs font-normal text-[var(--text-primary)]">Chọn nhận xét</span> : dcct.map(v => (
                                        <span key={v} className="bg-[var(--border-color)] text-[var(--text-primary)] px-3 py-1.5 rounded inline-flex items-center gap-2 text-xs font-normal text-[var(--text-primary)]" onClick={e => e.stopPropagation()}>
                                            {v}
                                            <span className="cursor-pointer text-[var(--text-primary)] font-bold text-base leading-none hover:text-[var(--red)]" onClick={() => handleRemove(setDcct, v)}>×</span>
                                        </span>
                                    ))}
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--main_d)] text-lg">{isDcctMenuOpen ? '▴' : '▾'}</span>
                                </div>
                            }
                        />
                    </div>
                    <p className='text-sm font-semibold text-[var(--text-primary)]' style={{ padding: '8px 0 2px 0', marginBottom: 8 }}>Nhận xét khác</p>
                    {/* --- SỬA: Gán value và onChange cho textarea --- */}
                    <textarea
                        placeholder="Nhập nội dung nhận xét tại đây..."
                        className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none'
                        style={{ resize: 'none', height: 100, width: 'calc(100% - 26px)' }}
                        value={otherComment}
                        onChange={(e) => setOtherComment(e.target.value)}
                    />
                </div>

                {/* --- Nút bấm xác nhận và thoát --- */}
                <div className="mt-4 flex gap-3 justify-end px-4 py-3 border-t border-[var(--border-color)]">
                    <button className="px-5 py-2.5 border-none rounded-md cursor-pointer bg-[var(--bg-secondary)] text-sm font-medium text-[var(--text-secondary)]" onClick={onCancel}>
                        Thoát
                    </button>
                    <button className="px-5 py-2.5 border-none rounded-md cursor-pointer bg-[var(--green)] text-sm font-medium text-white" onClick={() => {
                        const finalComments = [...tdht, ...kqht, ...dcct, otherComment.trim()].filter(Boolean);
                        onSave(finalComments);
                    }}>
                        Xác nhận
                    </button>
                </div>
            </div>
        </>
    );
}
