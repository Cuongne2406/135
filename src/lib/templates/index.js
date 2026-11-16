// src/lib/templates/index.js
// Portfolio Pro - Theme Engine Catalog

export const SUBJECT_CATEGORIES = [
    { id: 'robot', name: 'Robotics & STEM', icon: '🤖' },
    { id: 'math', name: 'Toán học & Tư duy', icon: '📐' },
    { id: 'english', name: 'Tiếng Anh & Kỹ năng', icon: '🌍' },
];

export const TEMPLATES = {
    // ==========================================
    // 🤖 1. ROBOTICS & STEM (5 Templates)
    // ==========================================
    'robot-mecha': {
        id: 'robot-mecha',
        name: 'Mecha Cyber',
        subject: 'robot',
        icon: '🤖',
        tagline: 'Phong cách chiến binh cơ khí, vi mạch công nghệ cao',
        previewGradient: 'linear-gradient(135deg, #0b132b 0%, #1c2541 50%, #00f0ff 100%)',
        tokens: {
            themeMode: 'dark',
            cardBg: '#0f172a',
            cardBorder: '#1e293b',
            headerBg: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            primary: '#06b6d4',
            primaryHover: '#0891b2',
            accent: '#38bdf8',
            progressBar: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
            textPrimary: '#f8fafc',
            textSecondary: '#94a3b8',
            lessonBg: '#1e293b',
            lessonHover: '#334155',
            badgeBg: 'rgba(6, 182, 212, 0.15)',
            badgeText: '#22d3ee',
            accentBorder: '#0891b2'
        }
    },
    'robot-space': {
        id: 'robot-space',
        name: 'Galactic Odyssey',
        subject: 'robot',
        icon: '🚀',
        tagline: 'Du hành vũ trụ sâu thẳm, phi thuyền & sao băng',
        previewGradient: 'linear-gradient(135deg, #1e1b4b 0%, #31104b 50%, #ec4899 100%)',
        tokens: {
            themeMode: 'dark',
            cardBg: '#18122B',
            cardBorder: '#393053',
            headerBg: 'linear-gradient(135deg, #18122B 0%, #443C68 100%)',
            primary: '#a855f7',
            primaryHover: '#9333ea',
            accent: '#f43f5e',
            progressBar: 'linear-gradient(90deg, #a855f7, #ec4899)',
            textPrimary: '#ffffff',
            textSecondary: '#c084fc',
            lessonBg: '#2a2438',
            lessonHover: '#3b324d',
            badgeBg: 'rgba(168, 85, 247, 0.2)',
            badgeText: '#e9d5ff',
            accentBorder: '#a855f7'
        }
    },
    'robot-blueprint': {
        id: 'robot-blueprint',
        name: 'Blueprint Lab',
        subject: 'robot',
        icon: '📐',
        tagline: 'Bản vẽ thiết kế kỹ thuật, lưới tọa độ kiến trúc',
        previewGradient: 'linear-gradient(135deg, #0f4c81 0%, #1e3a8a 50%, #60a5fa 100%)',
        tokens: {
            themeMode: 'dark',
            cardBg: '#0c2340',
            cardBorder: '#1d4ed8',
            headerBg: 'linear-gradient(135deg, #0c2340 0%, #1e40af 100%)',
            primary: '#60a5fa',
            primaryHover: '#3b82f6',
            accent: '#93c5fd',
            progressBar: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
            textPrimary: '#eff6ff',
            textSecondary: '#bfdbfe',
            lessonBg: '#172554',
            lessonHover: '#1e3a8a',
            badgeBg: 'rgba(96, 165, 250, 0.2)',
            badgeText: '#dbeafe',
            accentBorder: '#3b82f6'
        }
    },
    'robot-arcade': {
        id: 'robot-arcade',
        name: 'Retro Arcade',
        subject: 'robot',
        icon: '🕹️',
        tagline: 'Phong cách game 8-bit hoài niệm, pixel vui nhộn',
        previewGradient: 'linear-gradient(135deg, #261132 0%, #4a044e 50%, #f59e0b 100%)',
        tokens: {
            themeMode: 'dark',
            cardBg: '#1c1917',
            cardBorder: '#44403c',
            headerBg: 'linear-gradient(135deg, #292524 0%, #451a03 100%)',
            primary: '#f59e0b',
            primaryHover: '#d97706',
            accent: '#fbbf24',
            progressBar: 'linear-gradient(90deg, #ef4444, #f59e0b)',
            textPrimary: '#fef3c7',
            textSecondary: '#d6d3d1',
            lessonBg: '#292524',
            lessonHover: '#44403c',
            badgeBg: 'rgba(245, 158, 11, 0.2)',
            badgeText: '#fde68a',
            accentBorder: '#f59e0b'
        }
    },
    'robot-eco': {
        id: 'robot-eco',
        name: 'Eco-Tech Green',
        subject: 'robot',
        icon: '🌱',
        tagline: 'Robot công nghệ xanh và năng lượng tương lai',
        previewGradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #10b981 100%)',
        tokens: {
            themeMode: 'light',
            cardBg: '#ffffff',
            cardBorder: '#a7f3d0',
            headerBg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            primary: '#059669',
            primaryHover: '#047857',
            accent: '#10b981',
            progressBar: 'linear-gradient(90deg, #10b981, #059669)',
            textPrimary: '#064e3b',
            textSecondary: '#047857',
            lessonBg: '#f0fdf4',
            lessonHover: '#dcfce7',
            badgeBg: '#d1fae5',
            badgeText: '#065f46',
            accentBorder: '#10b981'
        }
    },

    // ==========================================
    // 📐 2. TOÁN HỌC & TƯ DUY (5 Templates)
    // ==========================================
    'math-chalkboard': {
        id: 'math-chalkboard',
        name: 'Chalkboard Genius',
        subject: 'math',
        icon: '✏️',
        tagline: 'Bảng đen phấn trắng, công thức & định lý kinh điển',
        previewGradient: 'linear-gradient(135deg, #1e392a 0%, #2d4a3e 50%, #facc15 100%)',
        tokens: {
            themeMode: 'dark',
            cardBg: '#1b3022',
            cardBorder: '#2d4e38',
            headerBg: 'linear-gradient(135deg, #16281c 0%, #264230 100%)',
            primary: '#fde047',
            primaryHover: '#eab308',
            accent: '#fef08a',
            progressBar: 'linear-gradient(90deg, #eab308, #facc15)',
            textPrimary: '#fefce8',
            textSecondary: '#dcfce7',
            lessonBg: '#233d2c',
            lessonHover: '#2d4e38',
            badgeBg: 'rgba(250, 204, 21, 0.2)',
            badgeText: '#fef08a',
            accentBorder: '#eab308'
        }
    },
    'math-geo': {
        id: 'math-geo',
        name: 'Geometric Shapes',
        subject: 'math',
        icon: '🔷',
        tagline: 'Đa giác 3D hiện đại, nghệ thuật toán học origami',
        previewGradient: 'linear-gradient(135deg, #312e81 0%, #4338ca 50%, #818cf8 100%)',
        tokens: {
            themeMode: 'light',
            cardBg: '#ffffff',
            cardBorder: '#c7d2fe',
            headerBg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
            primary: '#4f46e5',
            primaryHover: '#4338ca',
            accent: '#6366f1',
            progressBar: 'linear-gradient(90deg, #6366f1, #4f46e5)',
            textPrimary: '#1e1b4b',
            textSecondary: '#475569',
            lessonBg: '#f8fafc',
            lessonHover: '#eef2ff',
            badgeBg: '#e0e7ff',
            badgeText: '#3730a3',
            accentBorder: '#6366f1'
        }
    },
    'math-coordinate': {
        id: 'math-coordinate',
        name: 'Space Coordinate',
        subject: 'math',
        icon: '📈',
        tagline: 'Hệ trục tọa độ Descartes, biểu đồ radar lượng giác',
        previewGradient: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #2dd4bf 100%)',
        tokens: {
            themeMode: 'dark',
            cardBg: '#042f2e',
            cardBorder: '#115e59',
            headerBg: 'linear-gradient(135deg, #042f2e 0%, #134e4a 100%)',
            primary: '#2dd4bf',
            primaryHover: '#14b8a6',
            accent: '#5eead4',
            progressBar: 'linear-gradient(90deg, #0d9488, #2dd4bf)',
            textPrimary: '#f0fdfa',
            textSecondary: '#99f6e4',
            lessonBg: '#134e4a',
            lessonHover: '#115e59',
            badgeBg: 'rgba(45, 212, 191, 0.2)',
            badgeText: '#ccfbf1',
            accentBorder: '#14b8a6'
        }
    },
    'math-detective': {
        id: 'math-detective',
        name: 'Detective Mystery',
        subject: 'math',
        icon: '🔍',
        tagline: 'Phá án mật mã, giải đố logic thám tử thông minh',
        previewGradient: 'linear-gradient(135deg, #2a1b14 0%, #451a03 50%, #d97706 100%)',
        tokens: {
            themeMode: 'light',
            cardBg: '#fffbeb',
            cardBorder: '#fde68a',
            headerBg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            primary: '#b45309',
            primaryHover: '#92400e',
            accent: '#d97706',
            progressBar: 'linear-gradient(90deg, #d97706, #b45309)',
            textPrimary: '#451a03',
            textSecondary: '#78350f',
            lessonBg: '#ffffff',
            lessonHover: '#fef3c7',
            badgeBg: '#fed7aa',
            badgeText: '#9a3412',
            accentBorder: '#d97706'
        }
    },
    'math-clean': {
        id: 'math-clean',
        name: 'Clean Calculus',
        subject: 'math',
        icon: '📊',
        tagline: 'Học thuật tinh tế, tối giản & sang trọng chuẩn quốc tế',
        previewGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #94a3b8 100%)',
        tokens: {
            themeMode: 'light',
            cardBg: '#ffffff',
            cardBorder: '#e2e8f0',
            headerBg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            primary: '#0f172a',
            primaryHover: '#334155',
            accent: '#2563eb',
            progressBar: 'linear-gradient(90deg, #2563eb, #3b82f6)',
            textPrimary: '#0f172a',
            textSecondary: '#64748b',
            lessonBg: '#f8fafc',
            lessonHover: '#f1f5f9',
            badgeBg: '#e2e8f0',
            badgeText: '#0f172a',
            accentBorder: '#cbd5e1'
        }
    },

    // ==========================================
    // 🌍 3. TIẾNG ANH & KỸ NĂNG (5 Templates)
    // ==========================================
    'eng-passport': {
        id: 'eng-passport',
        name: 'Global Passport',
        subject: 'english',
        icon: '🛂',
        tagline: 'Hộ chiếu công dân toàn cầu, tem du ký các quốc gia',
        previewGradient: 'linear-gradient(135deg, #172554 0%, #1e40af 50%, #fbbf24 100%)',
        tokens: {
            themeMode: 'light',
            cardBg: '#ffffff',
            cardBorder: '#bfdbfe',
            headerBg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            primary: '#1d4ed8',
            primaryHover: '#1e40af',
            accent: '#f59e0b',
            progressBar: 'linear-gradient(90deg, #1d4ed8, #3b82f6)',
            textPrimary: '#172554',
            textSecondary: '#475569',
            lessonBg: '#f8fafc',
            lessonHover: '#eff6ff',
            badgeBg: '#fef3c7',
            badgeText: '#b45309',
            accentBorder: '#3b82f6'
        }
    },
    'eng-comic': {
        id: 'eng-comic',
        name: 'Comic Storyboard',
        subject: 'english',
        icon: '💬',
        tagline: 'Truyện tranh sinh động, hội thoại & bong bóng lời thoại',
        previewGradient: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #facc15 100%)',
        tokens: {
            themeMode: 'light',
            cardBg: '#ffffff',
            cardBorder: '#fed7aa',
            headerBg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
            primary: '#ea580c',
            primaryHover: '#c2410c',
            accent: '#f59e0b',
            progressBar: 'linear-gradient(90deg, #ea580c, #f59e0b)',
            textPrimary: '#431407',
            textSecondary: '#7c2d12',
            lessonBg: '#fffaf5',
            lessonHover: '#ffedd5',
            badgeBg: '#ffedd5',
            badgeText: '#9a3412',
            accentBorder: '#ea580c'
        }
    },
    'eng-podcast': {
        id: 'eng-podcast',
        name: 'Studio Podcast',
        subject: 'english',
        icon: '🎙️',
        tagline: 'Phòng thu radio, sóng âm thanh & sân khấu thuyết trình',
        previewGradient: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #e11d48 100%)',
        tokens: {
            themeMode: 'dark',
            cardBg: '#18181b',
            cardBorder: '#27272a',
            headerBg: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
            primary: '#f43f5e',
            primaryHover: '#e11d48',
            accent: '#fb7185',
            progressBar: 'linear-gradient(90deg, #e11d48, #f43f5e)',
            textPrimary: '#fafafa',
            textSecondary: '#a1a1aa',
            lessonBg: '#27272a',
            lessonHover: '#3f3f46',
            badgeBg: 'rgba(244, 63, 94, 0.2)',
            badgeText: '#fecdd3',
            accentBorder: '#f43f5e'
        }
    },
    'eng-safari': {
        id: 'eng-safari',
        name: 'Nature Safari',
        subject: 'english',
        icon: '🦁',
        tagline: 'Thám hiểm thế giới muôn loài, từ vựng tự nhiên kỳ thú',
        previewGradient: 'linear-gradient(135deg, #2e1065 0%, #365314 50%, #65a30d 100%)',
        tokens: {
            themeMode: 'light',
            cardBg: '#ffffff',
            cardBorder: '#d9f99d',
            headerBg: 'linear-gradient(135deg, #f7fee7 0%, #ecfccb 100%)',
            primary: '#65a30d',
            primaryHover: '#4d7c0f',
            accent: '#84cc16',
            progressBar: 'linear-gradient(90deg, #65a30d, #84cc16)',
            textPrimary: '#1a2e05',
            textSecondary: '#3f6212',
            lessonBg: '#f7fee7',
            lessonHover: '#ecfccb',
            badgeBg: '#ecfccb',
            badgeText: '#365314',
            accentBorder: '#84cc16'
        }
    },
    'eng-campus': {
        id: 'eng-campus',
        name: 'Modern Campus',
        subject: 'english',
        icon: '🏛️',
        tagline: 'Học viện quốc tế năng động, chứng chỉ & học bổng',
        previewGradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
        tokens: {
            themeMode: 'light',
            cardBg: '#ffffff',
            cardBorder: '#e0e7ff',
            headerBg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
            primary: '#3730a3',
            primaryHover: '#312e81',
            accent: '#4f46e5',
            progressBar: 'linear-gradient(90deg, #4338ca, #6366f1)',
            textPrimary: '#1e1b4b',
            textSecondary: '#4338ca',
            lessonBg: '#f8fafc',
            lessonHover: '#eef2ff',
            badgeBg: '#e0e7ff',
            badgeText: '#3730a3',
            accentBorder: '#4f46e5'
        }
    },
};

/**
 * Lấy danh sách template theo môn học hoặc trả về toàn bộ
 */
export function getTemplatesBySubject(subject) {
    if (!subject) return Object.values(TEMPLATES);
    const normalized = String(subject).toLowerCase();

    // Map các keyword thường gặp sang subject id
    let targetSubject = 'robot';
    if (normalized.includes('toán') || normalized.includes('math') || normalized.includes('logic')) {
        targetSubject = 'math';
    } else if (normalized.includes('anh') || normalized.includes('eng') || normalized.includes('skill')) {
        targetSubject = 'english';
    }

    return Object.values(TEMPLATES).filter(t => t.subject === targetSubject);
}

/**
 * Lấy cấu hình template an toàn (có fallback mặc định nếu templateId không tồn tại)
 */
export function getTemplateConfig(templateId) {
    return TEMPLATES[templateId] || TEMPLATES['robot-mecha'];
}
