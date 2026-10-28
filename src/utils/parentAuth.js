import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/utils/env';

export const PARENT_COOKIE_NAME = 'parent_session_token';

export function signParentToken(payload) {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: '30d' });
}

export function verifyParentToken(token) {
    try {
        if (!token) return null;
        return jwt.verify(token, getJwtSecret());
    } catch {
        return null;
    }
}

export function normalizePhone(rawPhone) {
    if (!rawPhone || typeof rawPhone !== 'string') return '';
    let digits = rawPhone.replace(/\D/g, '');
    if (digits.startsWith('84') && digits.length >= 11) {
        digits = '0' + digits.slice(2);
    }
    return digits;
}
