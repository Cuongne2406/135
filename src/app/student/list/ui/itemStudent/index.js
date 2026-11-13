"use client";

import Image from "next/image";
import { srcImage } from "@/function";
import Update from "../update";
import Pay from "../pay";
import Out from "../out";
import Reinstate from "../reinstate";
import Link from "next/link";
import WrapIcon from "@/components/(ui)/(button)/hoveIcon";
import { Svg_Profile } from "@/components/(icon)/svg";
import { getEportfolioUrl } from '@/utils/env';
import { Share2 } from "lucide-react";

export function Li_l({ data, dataArea, ReLoadData }) {
    const initialSrc = data.Avt ? srcImage(data.Avt) : 'https://lh3.googleusercontent.com/d/1iq7y8VE0OyFIiHmpnV_ueunNsTeHK1bG';
    const status = data.Status[data.Status.length - 1].status;
    const hasPaid = data.hasPaid ?? false;

    const statusObj = status === 2 
        ? { label: 'Đang học', cls: 'bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]' }
        : status === 1
        ? { label: 'Chờ lên khóa', cls: 'bg-[#fffbeb] text-[#b45309] border border-[#fde68a]' }
        : { label: 'Đã nghỉ', cls: 'bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]' };

    return (
        <div>
            <div className="hover:bg-slate-50/80 transition-colors bg-white flex items-center p-3 border-b border-slate-100">
                <Link href={`/${data._id}`} className="flex items-center cursor-pointer flex-1 gap-2">
                    <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="w-9 h-9 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            <Image
                                src={initialSrc}
                                width={36}
                                height={36}
                                alt={`avt của ${data.Name}`}
                                style={{ objectFit: 'cover' }}
                                unoptimized
                            />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-900 leading-tight">{data.Name}</div>
                            <div className="text-[11px] font-mono text-slate-500 mt-0.5">{data.ID}</div>
                        </div>
                    </div>
                    <div style={{ flex: 1 }} className="flex flex-col">
                        <span className="text-xs text-slate-700 font-medium">{data.Area ? data.Area.name : '—'}</span>
                    </div>
                    <div style={{ flex: 1 }} className="flex flex-col">
                        <span className="text-xs text-slate-600 font-mono">{data.Phone ? data.Phone : '—'}</span>
                    </div>
                    <div style={{ flex: 1 }} className="flex flex-col">
                        <span className="text-xs text-slate-500">{data.createdAt ? new Date(data.createdAt).toLocaleDateString('vi-VN') : '—'}</span>
                    </div>
                    <div style={{ flex: 0.8 }} className="flex items-center justify-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${statusObj.cls}`}>
                            {statusObj.label}
                        </span>
                    </div>
                </Link>
                <div style={{ flex: 1, gap: 6, borderLeft: '1px solid #e2e8f0' }} className="flex items-center justify-center pl-2">
                    <Link href={`${getEportfolioUrl()}/e-portfolio/${data._id}`} target="_blank" >
                        <WrapIcon
                            icon={<Svg_Profile w={16} h={16} c={'white'} />}
                            content={"Hồ sơ điện tử (Nội bộ)"}
                            style={{ background: data.statusProfile ? 'var(--main_d)' : 'var(--red)', borderRadius: 3, margin: 0 }}
                            placement="left"
                        />
                    </Link>
                    <Link href={`/share/student/${data.ID || data._id}`} target="_blank" >
                        <WrapIcon
                            icon={<Share2 className="w-3.5 h-3.5 text-white" />}
                            content={"Link Phụ huynh (Tổng)"}
                            style={{ background: '#0284c7', borderRadius: 3, margin: 0 }}
                            placement="left"
                        />
                    </Link>
                    <Update data={data} data_area={dataArea} reloadData={ReLoadData} />
                    <Pay _id={data._id} status={hasPaid} />
                    {status !== 0 ? (
                        <Out data={data} />
                    ) : (
                        <Reinstate data={data} reloadData={ReLoadData} />
                    )}
                </div>
            </div>
        </div>
    )
}
