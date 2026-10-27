import { NextResponse } from 'next/server';

function isTokenExpired(token) {
    if (!token || typeof token !== 'string') return true;
    try {
        const parts = token.split('.');
        if (parts.length < 2) return true;
        const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(atob(payloadBase64));
        if (!decoded || typeof decoded !== 'object') return true;
        if (!decoded.exp) return false;
        // Kiểm tra thời gian hết hạn (lùi 5s để phòng trừ độ trễ mạng)
        return Date.now() >= (decoded.exp * 1000 - 5000);
    } catch {
        return true;
    }
}

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // 1. Cho phép truy cập công khai vào các đường dẫn public
    const publicPaths = ['/login', '/share', '/api/login', '/api/check'];
    const isPublic = publicPaths.some(path => pathname === path || pathname.startsWith(`${path}/`));

    // Lấy cookie token hoặc Authorization header
    const tokenCookieName = process.env.TOKEN_COOKIE_NAME || process.env.token || 'token';
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const rawToken = request.cookies.get(tokenCookieName)?.value || request.cookies.get('token')?.value || bearerToken;
    const isExpired = isTokenExpired(rawToken);
    const hasValidToken = Boolean(rawToken && !isExpired);

    // 2. Nếu đã đăng nhập với token hợp lệ mà truy cập /login thì tự động chuyển hướng về trang chủ
    if (pathname === '/login') {
        if (hasValidToken) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        // Token đã hết hạn -> Cho phép vào trang /login và xóa cookie hết hạn
        const res = NextResponse.next();
        if (rawToken && isExpired) {
            res.cookies.delete(tokenCookieName);
            res.cookies.delete('token');
        }
        return res;
    }

    // 3. Nếu đang truy cập trang công khai khác thì cho qua
    if (isPublic) {
        return NextResponse.next();
    }

    // 4. Nếu chưa có token hoặc token đã hết hạn -> Chuyển hướng về trang /login và xóa cookie cũ
    if (!hasValidToken) {
        // Nếu là request API -> Trả về lỗi 401 Unauthorized thay vì redirect HTML
        if (pathname.startsWith('/api/')) {
            if (pathname.startsWith('/api/login') || pathname.startsWith('/api/share')) {
                return NextResponse.next();
            }
            const res = NextResponse.json(
                { status: false, mes: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' },
                { status: 401 }
            );
            if (rawToken && isExpired) {
                res.cookies.delete(tokenCookieName);
                res.cookies.delete('token');
            }
            return res;
        }

        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        const res = NextResponse.redirect(loginUrl);
        if (rawToken && isExpired) {
            res.cookies.delete(tokenCookieName);
            res.cookies.delete('token');
        }
        return res;
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Khớp tất cả các đường dẫn ngoại trừ:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public images/assets (.png, .jpg, .jpeg, .svg, .webp)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
