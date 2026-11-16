import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getCookieName, getJwtSecret } from '@/utils/env';

export default async function checkAuthToken() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(getCookieName())?.value;
        if (!token) return null;
        const decoded = jwt.verify(token, getJwtSecret());
        return decoded;
    } catch (error) {
        console.error('Lỗi xác thực token:', error);
        return null;
    }
}