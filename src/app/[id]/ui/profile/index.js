'use client';

import { Svg_link, Svg_Save, Svg_Pen, Svg_Add } from '@/components/(icon)/svg';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import CourseAndImageSelection from '../pickimage';
import { useRouter } from 'next/navigation';
import { reloadStudent } from '@/data/actions/reload';
import { getEportfolioUrl } from '@/utils/env'

const CloseIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const ArrowIcon = ({ isOpen }) => (<svg style={{ transform: isOpen ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>);

const extractId = (urlOrId) => { if (!urlOrId || typeof urlOrId !== 'string') return ''; const match = urlOrId.match(/id=([^&]+)/) || urlOrId.match(/\/d\/([^/]+)/); return match ? match[1] : urlOrId; };
const buildUrl = (id) => id ? `https://lh3.googleusercontent.com/d/${id}` : 'https://lh3.googleusercontent.com/d/1iq7y8VE0OyFIiHmpnV_ueunNsTeHK1bG';

const defaultProfile = { Intro: '', Avatar: '', ImgSkill: '', ImgPJ: [], Skill: { "Sự tiến bộ và Phát triển": "50", "Kỹ năng giao tiếp": "50", "Diễn giải vấn đề": "50", "Tự tin năng động": "50", "Đổi mới sáng tạo": "50", "Giao lưu hợp tác": "50" }, Present: [] };

export default function Profile({ data, onSave }) {
    const [editableProfile, setEditableProfile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [popupState, setPopupState] = useState({ type: null, bookId: null });
    const [expandedPresentation, setExpandedPresentation] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const profile = { ...defaultProfile, ...(data.Profile || {}) };
        const completedCourses = data.Course?.filter(c => c.enrollmentStatus === 2) || [];
        const presentArr = Array.isArray(profile.Present) ? profile.Present : [];
        const presentMap = new Map(presentArr.map(p => [p.course, p]));
        const syncedPresent = completedCourses.map(course => {
            const existingPresent = presentMap.get(course._id) || {};
            return {
                bookId: course.Book.ID,
                bookName: course.Book.Name,
                Video: extractId(existingPresent.Video || ''),
                Img: extractId(existingPresent.Img || ''),
                Comment: existingPresent.Comment || '',
                course: existingPresent.course || course._id
            };
        }).filter(Boolean);

        setEditableProfile({
            ...profile,
            Avatar: extractId(profile.Avatar),
            ImgSkill: extractId(profile.ImgSkill),
            ImgPJ: (profile.ImgPJ || []).map(extractId),
            Present: syncedPresent
        });
    }, [data]);

    const handleInputChange = (field, value) => setEditableProfile(p => ({ ...p, [field]: value }));
    const handleSkillChange = (skill, value) => setEditableProfile(p => ({ ...p, Skill: { ...p.Skill, [skill]: value } }));
    const handleRemoveImgPj = (idToRemove) => setEditableProfile(p => ({ ...p, ImgPJ: p.ImgPJ.filter(id => id !== idToRemove) }));
    const handlePresentationChange = (bookId, field, value) => {
        setEditableProfile(p => ({ ...p, Present: p.Present.map(item => item.bookId === bookId ? { ...item, [field]: value } : item) }));
    };

    const handleSelectionChange = (id) => {
        const { type, bookId } = popupState;
        if (type === 'presentImg') handlePresentationChange(bookId, 'Img', id);
        else if (type === 'presentVideo') handlePresentationChange(bookId, 'Video', id);
        else if (type === 'avatar') handleInputChange('Avatar', id);
        else if (type === 'imgSkill') handleInputChange('ImgSkill', id);
        else if (type === 'imgPj') handleInputChange('ImgPJ', id);
        setPopupState({ type: null, bookId: null });
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`/api/student/${data._id}/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editableProfile) });
            const result = await response.json();
            if (response.ok) {
                onSave?.(editableProfile);
                alert('Cập nhật hồ sơ thành công!');
                router.refresh();
            } else { alert(`Có lỗi xảy ra: ${result.mes || 'Không rõ lỗi'}`); }
        } catch (error) { alert('Không thể kết nối đến máy chủ.'); }
        finally { setIsSaving(false); }
    };

    if (!editableProfile) return <div>Đang xử lý dữ liệu...</div>;
    console.log(editableProfile);
    
    const { Intro, Avatar, ImgPJ, Skill, ImgSkill, Present } = editableProfile;
    const popups = {
        avatar: { title: "Chọn ảnh đại diện", mode: "single", selected: Avatar },
        imgPj: { title: "Chọn ảnh sản phẩm", mode: "multiple", selected: ImgPJ },
        imgSkill: { title: "Chọn ảnh kĩ năng", mode: "single", selected: ImgSkill },
        presentImg: { title: "Chọn ảnh đại diện video", mode: "single", selected: Present.find(p => p.bookId === popupState.bookId)?.Img },
        presentVideo: { title: "Chọn video thuyết trình", mode: "single", selected: Present.find(p => p.bookId === popupState.bookId)?.Video, filter: "video" }
    };
    const currentPopup = popups[popupState.type];

    return (
        <>
            <div className="flex justify-between w-full items-start pb-2">
                <div className="flex gap-2 items-center"><p className="text-lg font-semibold text-[var(--text-primary)]">Hồ sơ điện tử</p><Link href={`${getEportfolioUrl()}/e-portfolio/${data._id}`} target="_blank"><Svg_link w={20} h={20} c={'blue'} /></Link></div>
                <button onClick={handleSaveChanges} className="flex items-center gap-2 px-4 py-2 border-none bg-[#007bff] text-white rounded-md cursor-pointer font-medium" disabled={isSaving}><Svg_Save w={18} h={18} c={'white'} /> {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
            </div>
            <div className="flex flex-col gap-4 w-full">
                <div className="p-4 border border-[#e0e0e0] rounded-lg bg-white">
                    <div className="flex justify-between items-center pb-3 border-b border-[#e0e0e0]"><p className="font-semibold text-lg">Giới thiệu bản thân</p></div>
                    <div className="flex gap-4 pt-4 max-md:flex-col">
                        <div className="flex-1"><textarea className={`px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none text-base font-medium text-[var(--text-primary)] w-[calc(100%-24px)] h-[calc(100%-20px)] resize-none`} placeholder='Nhập giới thiệu bản thân' value={Intro || ''} onChange={(e) => handleInputChange('Intro', e.target.value)} /></div>
                        <div className="w-[200px] rounded-md border border-[#e0e0e0] max-md:w-full max-md:max-w-[250px]"><div className="w-full relative aspect-square rounded-sm overflow-hidden cursor-pointer group" onClick={() => setPopupState({ type: 'avatar' })}><Image src={buildUrl(Avatar)} fill alt="Avatar" className="object-cover" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"><Svg_Pen w={20} h={20} c="white" /></div></div></div>
                    </div>
                </div>
                <div className="p-4 border border-[#e0e0e0] rounded-lg bg-white">
                    <div className="flex justify-between items-center pb-3 border-b border-[#e0e0e0]"><p className="font-semibold text-lg">Kĩ năng cá nhân</p></div>
                    <div className="flex gap-6 pt-4 flex-wrap max-md:flex-col">
                        <div className="flex-1 min-w-[300px] flex flex-col gap-4">{Skill && Object.entries(Skill).map(([name, value]) => (<div key={name} className="grid grid-cols-[1fr_2fr_50px] items-center gap-3"><label className="text-sm text-[#555] whitespace-nowrap">{name}</label><input type="range" min="0" max="100" value={value} className="w-full h-1.5 bg-[#ddd] outline-none rounded-sm appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:bg-[#007bff] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:rounded-full" onChange={(e) => handleSkillChange(name, e.target.value)} /><span className="text-sm font-medium text-[#007bff] text-right">{value}%</span></div>))}</div>
                        <div className="w-[200px] rounded-md border border-[#e0e0e0] max-md:w-full max-md:max-w-[250px]"><div className="w-full relative aspect-square rounded-sm overflow-hidden cursor-pointer group" onClick={() => setPopupState({ type: 'imgSkill' })}><Image src={buildUrl(ImgSkill)} fill alt="Skill Image" className="object-cover" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"><Svg_Pen w={20} h={20} c="white" /></div></div></div>
                    </div>
                </div>
                <div className="p-4 border border-[#e0e0e0] rounded-lg bg-white">
                    <div className="flex justify-between items-center pb-3 border-b border-[#e0e0e0]"><p className="font-semibold text-lg">Hình ảnh sản phẩm</p></div>
                    <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
                        <button onClick={() => setPopupState({ type: 'imgPj' })} className="flex flex-col items-center justify-center gap-2 aspect-square border-2 border-dashed border-[#ccc] rounded-md bg-[#f9f9f9] cursor-pointer transition-colors duration-200 text-[#888] hover:border-[#007bff]"><Svg_Add w={32} h={32} c={'var(--green)'} /><p className='text-sm font-normal text-[var(--text-primary)]'>Thêm ảnh</p></button>
                        {ImgPJ?.map(id => (<div key={id} className="relative w-full aspect-square rounded-md overflow-hidden group"><Image src={buildUrl(id)} alt="Ảnh sản phẩm" fill sizes="150px" className="object-cover" /><button className="absolute top-[5px] right-[5px] w-6 h-6 bg-black/60 text-white border-none rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={() => handleRemoveImgPj(id)}><CloseIcon /></button></div>))}
                    </div>
                </div>
                <div className="p-4 border border-[#e0e0e0] rounded-lg bg-white">
                    <div className="flex justify-between items-center pb-3 border-b border-[#e0e0e0]"><p className="font-semibold text-lg">Thuyết trình tổng kết</p></div>
                    <div className="flex flex-col gap-2.5 pt-4">
                        {Present.length === 0 ? <p>Học sinh chưa hoàn thành khóa học nào</p> : Present.map(p => {
                            console.log(p);
                            
                            const isExpanded = expandedPresentation === p.bookId;
                            return (
                                <div key={p.bookId} className="border border-[#e0e0e0] rounded-lg overflow-hidden">
                                    <button className="flex justify-between items-center w-full px-4 py-3 bg-[#f8f9fa] border-none cursor-pointer text-left font-medium text-base" onClick={() => setExpandedPresentation(prev => (prev === p.bookId ? null : p.bookId))}><span>{p.bookName}</span><ArrowIcon isOpen={isExpanded} /></button>
                                    <div className={`max-h-0 overflow-hidden transition-[max-height,padding] duration-[0.4s] ease-out px-4 ${isExpanded ? 'max-h-[500px] p-4 transition-[max-height,padding] duration-[0.5s] ease-in' : ''}`}>
                                        <div className="grid grid-cols-[1fr_2fr] gap-6 max-md:grid-cols-1">
                                            <div className="flex flex-col gap-4">
                                                <div className="relative w-full aspect-video rounded-md overflow-hidden cursor-pointer border border-[#ddd] bg-[#f0f2f5] group" onClick={() => setPopupState({ type: 'presentVideo', bookId: p.bookId })}>
                                                    {p.Video ? <Image src={`https://drive.google.com/thumbnail?id=${p.Video}`} fill alt="Thumbnail" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#8d949e] text-sm">Chưa có video</div>}
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"><Svg_Pen w={18} h={18} c="white" /></div>
                                                </div>
                                                <div className="relative w-full aspect-video rounded-md overflow-hidden cursor-pointer border border-[#ddd] bg-[#f0f2f5] group" onClick={() => setPopupState({ type: 'presentImg', bookId: p.bookId })}>
                                                    {p.Img ? <Image src={buildUrl(p.Img)} fill alt="Thumbnail" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#8d949e] text-sm">Chưa có ảnh</div>}
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"><Svg_Pen w={18} h={18} c="white" /></div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <p className='text-sm font-semibold text-[var(--text-primary)]'>Nhận xét tổng kết khóa</p>
                                                <textarea className="px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none" style={{ height: '100%' }} placeholder="Nhập nhận xét của bạn..." value={p.Comment || ''} onChange={e => handlePresentationChange(p.bookId, 'Comment', e.target.value)}></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {currentPopup && (
                <FlexiblePopup open={!!popupState.type} onClose={() => setPopupState({ type: null, bookId: null })} title={currentPopup.title} width={800} renderItemList={() => (<CourseAndImageSelection studentData={data} selectionMode={currentPopup.mode} selected={currentPopup.selected} onSelectionChange={handleSelectionChange} filterType={currentPopup.filter || "image"} />)} />
            )}
        </>
    );
}
