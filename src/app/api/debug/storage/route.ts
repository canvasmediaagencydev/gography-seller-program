import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, email')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Debug info
    const debugInfo = {
      user: {
        id: user.id,
        email: user.email,
        role: profile.role
      },
      storage: {
        bucketExists: false,
        bucketInfo: null as any,
        policies: [],
        testUploadPath: `${user.id}/debug/test-${Date.now()}.txt`,
        uploadTest: null as any
      }
    }

    // Check if seller-assets bucket exists
    try {
      const { data: buckets } = await adminClient.storage.listBuckets()
      const sellerBucket = buckets?.find(b => b.name === 'seller-assets')
      
      if (sellerBucket) {
        debugInfo.storage.bucketExists = true
        debugInfo.storage.bucketInfo = sellerBucket
      }
    } catch (bucketError: any) {
      debugInfo.storage.bucketInfo = { error: bucketError.message }
    }

    // Try a test upload to see what happens
    const testContent = `Debug test from ${user.email} at ${new Date().toISOString()}`
    const testBuffer = new TextEncoder().encode(testContent)
    
    try {
      const { data: uploadData, error: uploadError } = await adminClient.storage
        .from('seller-assets')
        .upload(debugInfo.storage.testUploadPath, testBuffer, {
          contentType: 'text/plain',
          upsert: true
        })

      if (uploadError) {
        debugInfo.storage.uploadTest = { error: uploadError.message, code: uploadError.name }
      } else {
        debugInfo.storage.uploadTest = { success: true, path: uploadData.path }
        
        // Clean up test file
        await adminClient.storage
          .from('seller-assets')
          .remove([debugInfo.storage.testUploadPath])
      }
    } catch (testError: any) {
      debugInfo.storage.uploadTest = { error: testError.message }
    }

    return NextResponse.json(debugInfo, { status: 200 })

  } catch (error: any) {
    console.error('Storage debug error:', error)
    return NextResponse.json(
      { error: error.message || 'Debug failed' },
      { status: 500 }
    )
  }
}

// Helper endpoint to create bucket if it doesn't exist
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Create bucket
    const { data, error } = await adminClient.storage.createBucket('seller-assets', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    })

    if (error) {
      return NextResponse.json({ 
        error: error.message,
        details: 'Bucket might already exist or there might be permission issues'
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      bucket: data,
      message: 'Bucket created successfully'
    })

  } catch (error: any) {
    console.error('Bucket creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}