/**
 * Structured Logging Utility for SYS-AIR
 * Quản lý log có cấu trúc cho cả Server (Node.js) và Client (Trình duyệt)
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Màu sắc ANSI cho console Node.js
const COLORS = {
    reset: '\x1b[0m',
    blue: '\x1b[34m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
};

function formatTimestamp() {
    return new Date().toISOString();
}

function buildLogEntry(level, tag, message, metadata = null, error = null) {
    const entry = {
        timestamp: formatTimestamp(),
        level,
        tag: `SYS-AIR:${tag}`,
        message
    };

    if (metadata && Object.keys(metadata).length > 0) {
        entry.metadata = metadata;
    }

    if (error) {
        entry.error = {
            name: error.name || 'Error',
            message: error.message || String(error),
            stack: error.stack
        };
    }

    return entry;
}

export const logger = {
    info(tag, message, metadata = null) {
        const entry = buildLogEntry('INFO', tag, message, metadata);
        if (typeof window === 'undefined') {
            console.log(
                `${COLORS.gray}[${entry.timestamp}]${COLORS.reset} ${COLORS.green}[INFO]${COLORS.reset} ${COLORS.cyan}[${entry.tag}]${COLORS.reset}: ${message}`,
                metadata ? metadata : ''
            );
        } else {
            console.log(`%c[INFO] [${entry.tag}]`, 'color: #10b981; font-weight: bold;', message, metadata || '');
        }
    },

    warn(tag, message, metadata = null) {
        const entry = buildLogEntry('WARN', tag, message, metadata);
        if (typeof window === 'undefined') {
            console.warn(
                `${COLORS.gray}[${entry.timestamp}]${COLORS.reset} ${COLORS.yellow}[WARN]${COLORS.reset} ${COLORS.yellow}[${entry.tag}]${COLORS.reset}: ${message}`,
                metadata ? metadata : ''
            );
        } else {
            console.warn(`%c[WARN] [${entry.tag}]`, 'color: #f59e0b; font-weight: bold;', message, metadata || '');
        }
    },

    error(tag, message, error = null, metadata = null) {
        const entry = buildLogEntry('ERROR', tag, message, metadata, error);
        if (typeof window === 'undefined') {
            console.error(
                `${COLORS.gray}[${entry.timestamp}]${COLORS.reset} ${COLORS.red}[ERROR]${COLORS.reset} ${COLORS.red}[${entry.tag}]${COLORS.reset}: ${message}`,
                error?.message || '',
                metadata ? metadata : ''
            );
            if (error?.stack && !IS_PRODUCTION) {
                console.error(COLORS.gray + error.stack + COLORS.reset);
            }
        } else {
            console.error(`%c[ERROR] [${entry.tag}]`, 'color: #ef4444; font-weight: bold;', message, error, metadata || '');
        }
    },

    debug(tag, message, metadata = null) {
        if (IS_PRODUCTION) return;
        const entry = buildLogEntry('DEBUG', tag, message, metadata);
        console.debug(`[DEBUG] [${entry.tag}]:`, message, metadata || '');
    }
};

export default logger;
