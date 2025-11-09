import { NextRequest, NextResponse } from 'next/server'
import { WebhookEvent, messagingApi } from '@line/bot-sdk'

const { MessagingApiClient } = messagingApi

// Initialize LINE client
const lineClient = new MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
})

/**
 * LINE Webhook Endpoint
 *
 * This endpoint receives events from LINE when users interact with the bot.
 * It helps you find User IDs and Group IDs for configuration.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const events: WebhookEvent[] = body.events || []

    console.log('=== LINE Webhook Received ===')
    console.log('Full body:', JSON.stringify(body, null, 2))

    // If no events, return success immediately
    if (!events || events.length === 0) {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Process each event
    for (const event of events) {
      console.log('Event type:', event.type)
      console.log('Source type:', event.source.type)

      // Log User ID or Group ID
      if (event.source.type === 'user') {
        const userId = event.source.userId
        console.log('👤 USER ID:', userId)
        console.log('Copy this to LINE_ADMIN_USER_ID in .env.local')
      } else if (event.source.type === 'group') {
        const groupId = event.source.groupId
        console.log('👥 GROUP ID:', groupId)
        console.log('Copy this to LINE_ADMIN_GROUP_ID in .env.local')
      }

      // Handle join events (when bot is added to group) - just log, don't send message
      if (event.type === 'join' && event.source.type === 'group') {
        const groupId = event.source.groupId
        console.log('🎉 Bot joined group! GROUP ID:', groupId)
        console.log(`Set this in .env.local: LINE_ADMIN_GROUP_ID=${groupId}`)
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('LINE Webhook Error:', error)
    // Return 200 even on error to prevent LINE from retrying
    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  }
}

/**
 * GET endpoint for webhook verification (LINE requires this)
 */
export async function GET() {
  return NextResponse.json(
    { message: 'LINE webhook endpoint is active' },
    { status: 200 }
  )
}

// Required for Next.js API routes
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
