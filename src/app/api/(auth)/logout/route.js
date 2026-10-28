export const dynamic = 'force-dynamic';
import { cookies } from 'next/headers';
import { getCookieName } from '@/utils/env';

export async function POST() {
    const cookieStore = await cookies();
    const cookieNames = new Set([
        getCookieName(),
        process.env.TOKEN_COOKIE_NAME,
        process.env.token,
        'token'
    ].filter(Boolean));

    for (const name of cookieNames) {
        cookieStore.set(name, '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
            expires: new Date(0)
        });
    }

    return new Response(JSON.stringify({ success: true, message: 'Logged out successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

export async function GET() {
    return POST();
}