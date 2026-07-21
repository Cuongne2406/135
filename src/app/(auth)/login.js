'use client';

import Login_form from "@/components/(layout)/login";
import Image from "next/image";
import { Svg_Facebook, Svg_Website } from "@/components/(icon)/svg";
import Link from "next/link";


export default function Layout_Login() {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <div style={{ width: 400, alignItems: 'center', maxHeight: '100%', justifyContent: 'space-between' }} className="flex flex-col scroll">
        <div style={{ width: '100%', alignItems: 'center' }} className="flex flex-col">
          <div style={{ margin: '30px 0' }}>
            <p style={{ fontFamily: '"Oswald", serif', fontWeight: 600, color: 'var(--text-primary)', fontSize: 32, textAlign: 'center' }}>
              <span style={{ color: 'var(--main_d)' }}>AI</span> ROBOTIC</p>
            <p className="text-xs font-normal text-[var(--text-primary)]" style={{ marginTop: '-4px' }}>Khóa học công nghệ cho trẻ</p>
          </div>
          <Login_form />
        </div>
        <div style={{ width: 'calc(100% - 64px)', padding: '0 32px' }}>
          <p className='text-xs font-normal text-[var(--text-primary)]'>Theo dõi tại</p>
          <div style={{ height: 1, background: 'var(--border-color)', width: '100%', margin: '5px 0' }}></div>
          <div className="flex flex-col" style={{ gap: 5, padding: '12px 0 32px 0' }}>
            <Link href='https://www.facebook.com/airobotic.edu.vn' target="_blank">
              <div className="button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'start', gap: 8 }}>
                <span></span><span></span><span></span><span></span>
                <Svg_Facebook h={20} w={20} c={'white'} />  <p className="text-xs font-medium text-[var(--text-primary)]" style={{ color: 'white' }}>Trang Facebook chính thức </p>
              </div>
            </Link >
            <Link href='https://s4h.edu.vn/' target="_blank">
              <div className="button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'start', gap: 8 }}>
                <span></span><span></span><span></span><span style={{ background: '#696969' }}></span>
                <Svg_Website h={20} w={20} c={'white'} />  <p className="text-xs font-medium text-[var(--text-primary)]" style={{ color: 'white' }}>Website chính thức</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <Image src='https://lh3.googleusercontent.com/d/1sabbN5lI9r1HfaTQ7649xkdCj2MpyL45' priority fill style={{ objectFit: "cover" }} alt="Full screen image" />
      </div>
    </div >
  )
}

