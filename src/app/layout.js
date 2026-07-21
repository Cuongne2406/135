export const dynamic = 'force-dynamic';

import { Inter, Oswald } from 'next/font/google';
import { cookies } from 'next/headers';
import Layout_Login from '@/app/(auth)/login';
import Nav from '@/components/(layout)/nav';
import NavMobile from '@/components/(layout)/navMobile';
import '@/styles/all.css'
import '@/styles/font.css';
import { getAppUrl, getCookieName } from '@/utils/env';

const inter = Inter({
  subsets: ['vietnamese', 'latin'],
  display: 'swap',
  variable: '--font-inter',
});

const oswald = Oswald({
  subsets: ['vietnamese', 'latin'],
  display: 'swap',
  variable: '--font-oswald',
});

export const metadata = {
  title: "AI Robotic",
  description: "Khóa học công nghệ cho trẻ"
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }) {
  let data = null;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getCookieName())?.value;
    if (token) {
      const response = await fetch(`${getAppUrl()}/api/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ source: 1 }),
        cache: 'no-store'
      });
      const result = await response.json();
      if (result?.status === 2) { data = result.data }
    }
  } catch (error) {
    console.error('RootLayout check failed:', error);
  }
  
  return (
    <html lang="en">
      <body className={`${inter.variable} ${oswald.variable}`}>
        {data ?
          <div className="w-full h-full overflow-hidden flex">
            <div className="fixed top-0 left-0 h-full w-[var(--sidebar-w,240px)] border-r border-[var(--border-color)] bg-[var(--bg-primary)] z-[99] max-md:hidden transition-all duration-300">
              <Nav data={data} />
            </div>
            <NavMobile data={data} />
            <div className="ml-[var(--sidebar-w,240px)] w-[calc(100%-var(--sidebar-w,240px)-32px)] h-[calc(100%-32px)] bg-[var(--bg-secondary)] p-4 overflow-hidden overflow-y-auto max-md:ml-0 max-md:w-full max-md:h-[calc(100%-76px)] max-md:p-2 max-md:pb-[68px] transition-all duration-300">
              {children}
            </div>
          </div> :
          <Layout_Login />}
      </body>
    </html>
  );
}
