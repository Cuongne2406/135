export const dynamic = 'force-dynamic';

import { Inter, Oswald } from 'next/font/google';
import { cookies, headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import Nav from '@/components/(layout)/nav';
import NavMobile from '@/components/(layout)/navMobile';
import '@/styles/all.css';
import '@/styles/font.css';
import { getCookieName, getJwtSecret } from '@/utils/env';

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
  let user = null;
  let isPortalRoute = false;

  try {
    const [cookieStore, headerList] = await Promise.all([
      cookies(),
      headers()
    ]);

    const currentPath = headerList.get('x-pathname') || '';
    isPortalRoute = currentPath.startsWith('/parent') || 
                    currentPath.startsWith('/share') || 
                    currentPath.startsWith('/portfolio-lookbook');

    const token = cookieStore.get(getCookieName())?.value || cookieStore.get('token')?.value;
    if (token) {
      try {
        const decoded = jwt.verify(token, getJwtSecret());
        if (decoded && (decoded.id || decoded._id)) {
          user = decoded;
        }
      } catch (jwtErr) {
        // Token không hợp lệ hoặc đã hết hạn
      }
    }
  } catch (error) {
    console.error('RootLayout auth check error:', error);
  }

  const showAdminLayout = user && !isPortalRoute;

  return (
    <html lang="en">
      <body className={`${inter.variable} ${oswald.variable}`}>
        {showAdminLayout ? (
          <div className="w-full h-full overflow-hidden flex">
            <div className="fixed top-0 left-0 h-full w-[var(--sidebar-w,240px)] border-r border-[var(--border-color)] bg-[var(--bg-primary)] z-[99] max-md:hidden transition-all duration-300">
              <Nav data={user} />
            </div>
            <NavMobile data={user} />
            <div className="ml-[var(--sidebar-w,240px)] w-[calc(100%-var(--sidebar-w,240px)-32px)] h-[calc(100%-32px)] bg-[var(--bg-secondary)] p-4 overflow-hidden overflow-y-auto max-md:ml-0 max-md:w-full max-md:h-[calc(100%-76px)] max-md:p-2 max-md:pb-[68px] transition-all duration-300">
              {children}
            </div>
          </div>
        ) : (
          <main className="w-full h-full overflow-y-auto">
            {children}
          </main>
        )}
      </body>
    </html>
  );
}
