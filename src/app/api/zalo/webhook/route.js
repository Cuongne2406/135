import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import PostStudent from '@/models/student';

/**
 * Webhook tiếp nhận tin nhắn từ Zalo Bot Platform (Bot 135Tiet)
 * Endpoint: POST /api/zalo/webhook
 */
export async function POST(req) {
    try {
        const body = await req.json().catch(() => null);
        if (!body || !body.message) {
            return NextResponse.json({ ok: true });
        }

        const message = body.message;
        const chatId = message.chat?.id;
        const text = (message.text || '').trim();
        const senderName = message.from?.display_name || 'Quý phụ huynh';

        if (!chatId) {
            return NextResponse.json({ ok: true });
        }

        const botToken = process.env.ZALO_BOT_TOKEN;
        const sendBotReply = async (replyText) => {
            if (!botToken) return;
            try {
                await fetch(`https://bot-api.zaloplatforms.com/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: String(chatId),
                        text: replyText
                    })
                });
            } catch (err) {
                console.error('[ZALO_BOT_REPLY_ERROR]', err);
            }
        };

        await connectDB();

        // 1. Phụ huynh gửi SĐT hoặc Mã học sinh để liên kết
        const cleanText = text.replace(/[\s\.\-]/g, '');
        const student = await PostStudent.findOne({
            $or: [
                { Phone: cleanText },
                { Phone: text },
                { ID: text.toUpperCase() }
            ]
        });

        if (student) {
            // Cập nhật zaloChatId cho học sinh này
            await PostStudent.updateMany(
                { Phone: student.Phone },
                { $set: { zaloChatId: String(chatId) } }
            );

            const allLinked = await PostStudent.find({ Phone: student.Phone }).select('Name ID').lean();
            const names = allLinked.map(s => `${s.Name} (${s.ID})`).join(', ');

            await sendBotReply(
                `🎉 Chào mừng Ba/Mẹ ${senderName}!\n\nĐã kết nối thành công Zalo nhận thông báo Sổ liên lạc cho bé: ${names}.\n\nTừ bây giờ, thông báo điểm danh, nhắc lịch học và nhận xét buổi học của con sẽ được gửi tự động trực tiếp tới tin nhắn Zalo này!`
            );
            return NextResponse.json({ ok: true, linked: true, student: student.ID });
        }

        // 2. Nếu người dùng gửi /start hoặc tin nhắn chào hỏi
        await sendBotReply(
            `👋 Xin chào Ba/Mẹ ${senderName}!\n\nĐây là Bot 135Tiet - Sổ Liên Lạc Điện Tử SYS-AIR Robotic.\n\nĐể kích hoạt nhận thông báo tự động cho bé, Ba/Mẹ vui lòng gửi Số điện thoại đã đăng ký (ví dụ: 0923409668) hoặc Mã học sinh (ví dụ: HS-2026-001) vào đây nhé!`
        );

        return NextResponse.json({ ok: true, linked: false });
    } catch (error) {
        console.error('[ZALO_WEBHOOK_ERROR]', error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        ok: true,
        message: 'Zalo Bot Webhook Endpoint is active',
        bot: process.env.ZALO_BOT_NAME || 'Bot 135Tiet'
    });
}
