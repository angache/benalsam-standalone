import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('📥 [API] Creating listing with data:', body)
    console.log('📥 [API] Category:', body.category)
    console.log('📥 [API] Location:', body.location)

    // Validate required fields
    if (!body.title || body.title.length < 3) {
      return NextResponse.json(
        { error: 'Başlık en az 3 karakter olmalıdır' },
        { status: 400 }
      )
    }

    if (!body.description || body.description.length < 10) {
      return NextResponse.json(
        { error: 'Açıklama en az 10 karakter olmalıdır' },
        { status: 400 }
      )
    }

    if (!body.category) {
      return NextResponse.json(
        { error: 'Kategori seçilmelidir' },
        { status: 400 }
      )
    }

    if (!body.location) {
      return NextResponse.json(
        { error: 'Konum belirtilmelidir' },
        { status: 400 }
      )
    }

    // Process images - extract URLs from image objects
    const imageUrls = body.images?.map((img: any) => img.uri || img.url || img) || []
    const mainImageUrl = imageUrls.length > 0 ? imageUrls[body.mainImageIndex || 0] : null
    const additionalImageUrls = imageUrls.length > 1 ? imageUrls.slice(1) : []

    // Prepare listing data for database (matching schema)
    const listingData = {
      user_id: session.user.id,
      title: body.title,
      description: body.description,
      category: body.category,
      budget: parseInt(body.budget) || 0,
      location: body.location,
      urgency: body.urgency || 'medium',
      condition: body.condition || ['İkinci El'], // Default condition
      attributes: body.attributes || {},
      additional_image_urls: additionalImageUrls, // Array of additional image URLs
      main_image_url: mainImageUrl,
      status: 'pending_approval', // Correct status value
      is_featured: body.premiumFeatures?.is_featured || false,
      is_urgent_premium: body.premiumFeatures?.is_urgent_premium || false,
      is_showcase: body.premiumFeatures?.is_showcase || false,
      has_bold_border: body.premiumFeatures?.has_bold_border || false,
      geolocation: body.geolocation || null,
      contact_preference: body.contactPreference || 'site_message',
      auto_republish: body.autoRepublish || false,
      accept_terms: body.acceptTerms || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('💾 [API] Inserting listing:', listingData)

    // Insert listing into database
    console.log('💾 [API] Inserting listing data:', JSON.stringify(listingData, null, 2))
    
    const { data: listing, error } = await supabaseAdmin
      .from('listings')
      .insert([listingData])
      .select()
      .single()

    if (error) {
      console.error('❌ [API] Database error:', error)
      console.error('❌ [API] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json(
        { 
          error: 'İlan oluşturulurken bir hata oluştu',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      )
    }

    console.log('✅ [API] Listing created successfully:', listing.id)

    return NextResponse.json({
      success: true,
      listing: {
        id: listing.id,
        title: listing.title,
        status: listing.status,
        message: 'İlanınız başarıyla oluşturuldu! Yönetici onayından sonra yayınlanacaktır.'
      }
    }, { status: 201 })

  } catch (error) {
    console.error('❌ [API] Create listing error:', error)
    return NextResponse.json(
      { error: 'İlan oluşturulurken bir hata oluştu' },
      { status: 500 }
    )
  }
}
