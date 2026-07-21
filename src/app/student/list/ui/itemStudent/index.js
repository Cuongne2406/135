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
import { getEportfolioUrl } from '@/utils/env'

export function Li_l({ data, dataArea, ReLoadData }) {
    const initialSrc = data.Avt ? srcImage(data.Avt) : 'https://lh3.googleusercontent.com/d/1iq7y8VE0OyFIiHmpnV_ueunNsTeHK1bG';
    const status = data.Status[data.Status.length - 1].status;
    const hasPaid = data.hasPaid ?? false;

    return (
        <div>
            <div className="hover:bg-[var(--hover)]" style={{
                display: 'flex', padding: 8, borderBottom: 'thin solid var(--border-color)',
                background: status === 0 ? '#ffebed' : status === 1 ? '#fff9e7' : 'transparent'
            }}>
                <Link href={`/${data._id}`} className="hover:bg-[var(--hover)]" style={{ flex: 5, display: 'flex', cursor: 'pointer' }}>
                    <div style={{ flex: 2, display: 'flex', gap: 8 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden' }}>
                            <Image
                                src={initialSrc}
                                width={40}
                                height={40}
                                alt={`avt của ${data.Name}`}
                                style={{ objectFit: 'cover' }}
                            />
                        </div>
                        <div>
                            <h5 className="text-base font-medium text-[var(--text-primary)]">{data.ID}</h5>
                            <h5 className="text-base font-medium text-[var(--text-primary)]">{data.Name}</h5>
                        </div>
                    </div>
                    <div style={{ flex: 1, gap: 6 }} className="flex flex-col">
                        <h5 className="text-xs font-medium text-[var(--text-primary)]">Khu vực:</h5>
                        <h5 className="text-base font-medium text-[var(--text-primary)]">{data.Area ? data.Area.name : '-'}</h5>
                    </div>
                    <div style={{ flex: 1, gap: 6 }} className="flex flex-col">
                        <h5 className="text-xs font-medium text-[var(--text-primary)]">Liên hệ:</h5>
                        <h5 className="text-base font-medium text-[var(--text-primary)]">{data.Phone ? data.Phone : '-'}</h5>
                    </div>
                    <div style={{ flex: 1, gap: 6 }} className="flex flex-col">
                        <h5 className="text-xs font-medium text-[var(--text-primary)]">Ngày tạo:</h5>
                        <h5 className="text-base font-medium text-[var(--text-primary)]">{data.createdAt ? new Date(data.createdAt).toLocaleDateString('vi-VN') : '-'}</h5>
                    </div>
                    <div style={{ flex: 0.8, gap: 6 }} className="flex flex-col items-center justify-center">
                        <h5 className="text-xs font-medium text-[var(--text-primary)]">Xếp hạng:</h5>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '2px 10px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                            color: data.rank?.color || '#9ca3af',
                            backgroundColor: data.rank?.bg || '#f3f4f6',
                            border: `1px solid ${data.rank?.color || '#e5e7eb'}33`,
                        }}>
                            {data.rank?.name || 'Mới'}
                        </div>
                    </div>
                </Link>
                <div style={{ flex: 1, gap: 5, borderLeft: 'thin solid var(--border-color)' }} className="flex items-center justify-center">
                    <Link href={`${getEportfolioUrl()}/e-portfolio/${data._id}`} target="_blank" >
                        <WrapIcon
                            icon={<Svg_Profile w={16} h={16} c={'white'} />}
                            content={"Hô sơ điện tử"}
                            style={{ background: data.statusProfile ? 'var(--main_d)' : 'var(--red)', borderRadius: 3, margin: 0 }}
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
