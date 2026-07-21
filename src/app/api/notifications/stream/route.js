import connectDB from '@/config/connectDB'
import NotificationRecipient from '@/models/notificationRecipient'
import jwt from 'jsonwebtoken'
import { getJwtSecret, getCookieName } from '@/utils/env'

const clients = new Map()

function sendEvent(client, data) {
  client.controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
}

export async function GET(request) {
  try {
    let decoded = null

    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      decoded = jwt.verify(token, getJwtSecret())
    }

    if (!decoded) {
      const cookieHeader = request.headers.get('cookie') || ''
      const cookieName = getCookieName()
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]*)`))
      if (match) {
        try {
          decoded = jwt.verify(match[1], getJwtSecret())
        } catch (e) {
          console.error('SSE cookie auth failed:', e.message)
        }
      }
    }

    if (!decoded) {
      return new Response('Unauthorized', { status: 401 })
    }

    const userId = decoded._id || decoded.id
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const stream = new ReadableStream({
      start(controller) {
        clients.set(userId.toString(), { controller, userId: userId.toString() })
        sendEvent({ controller }, { type: 'connected', message: 'SSE connected' })
      },
      cancel() {
        clients.delete(userId.toString())
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('SSE auth error:', error)
    return new Response('Unauthorized', { status: 401 })
  }
}

export async function broadcastNotification(notificationId, type = 'new_notification') {
  await connectDB()
  const recipients = await NotificationRecipient.find({ notification: notificationId }).lean()

  for (const recipient of recipients) {
    const userId = recipient.user.toString()
    const client = clients.get(userId)
    if (client) {
      const { default: Notification } = await import('@/models/notification')
      const notification = await Notification.findById(notificationId).lean()
      sendEvent(client, { type, notification })
    }
  }
}

export async function broadcastUnreadUpdate(userId, data) {
  const client = clients.get(userId.toString())
  if (client) {
    sendEvent(client, { type: 'count_update', ...data })
  }
}
