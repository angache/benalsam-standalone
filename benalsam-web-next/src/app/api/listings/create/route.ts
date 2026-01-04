import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/utils/production-logger'
import { validateBody } from '@/lib/api-validation'
import { z } from 'zod'

/**
 * Schema for creating a listing
 */
const createListingSchema = z.object({
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır').max(200, 'Başlık en fazla 200 karakter olabilir'),
  description: z.string().min(10, 'Açıklama en az 10 karakter olmalıdır').max(5000, 'Açıklama en fazla 5000 karakter olabilir'),
  category: z.union([z.string(), z.number()], { required_error: 'Kategori seçilmelidir' }),
  budget: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val
    return isNaN(num) ? 0 : Math.max(0, num)
  }).optional().default(0),
  location: z.string().min(1, 'Konum belirtilmelidir').max(200),
  urgency: z.enum(['very_urgent', 'urgent', 'normal', 'not_urgent']).optional().default('normal'),
  condition: z.array(z.string()).optional().default(['İkinci El']),
  attributes: z.record(z.unknown()).optional().default({}),
  images: z.array(z.union([
    z.object({ uri: z.string().url() }),
    z.object({ url: z.string().url() }),
    z.string().url()
  ])).optional().default([]),
  mainImageIndex: z.number().int().min(0).optional().default(0),
  premiumFeatures: z.object({
    is_featured: z.boolean().optional().default(false),
    is_urgent_premium: z.boolean().optional().default(false),
    is_showcase: z.boolean().optional().default(false),
    has_bold_border: z.boolean().optional().default(false),
  }).optional(),
  geolocation: z.object({
    lat: z.number(),
    lng: z.number(),
  }).nullable().optional(),
  contactPreference: z.enum(['site_message', 'phone', 'email']).optional().default('site_message'),
  autoRepublish: z.boolean().optional().default(false),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'Kullanım şartlarını kabul etmelisiniz',
  }),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser()

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate request body
    const validation = await validateBody(request, createListingSchema)
    if (!validation.success) {
      return validation.response
    }

    const body = validation.data
    logger.debug('[API] Creating listing', { 
      userId: user.id, 
      category: body.category, 
      location: body.location 
    })

    // Process images - extract URLs from image objects
    const imageUrls = body.images.map((img) => {
      if (typeof img === 'string') return img
      if ('uri' in img) return img.uri
      if ('url' in img) return img.url
      return null
    }).filter((url): url is string => url !== null)
    
    const mainImageUrl = imageUrls.length > 0 ? imageUrls[body.mainImageIndex] : null
    const additionalImageUrls = imageUrls.length > 1 ? imageUrls.slice(1) : []

    // Prepare listing data for database (matching schema)
    const listingData = {
      user_id: user.id,
      title: body.title,
      description: body.description,
      category: body.category,
      budget: body.budget,
      location: body.location,
      urgency: body.urgency,
      condition: body.condition,
      attributes: body.attributes,
      additional_image_urls: additionalImageUrls,
      main_image_url: mainImageUrl,
      status: 'pending_approval' as const,
      is_featured: body.premiumFeatures?.is_featured ?? false,
      is_urgent_premium: body.premiumFeatures?.is_urgent_premium ?? false,
      is_showcase: body.premiumFeatures?.is_showcase ?? false,
      has_bold_border: body.premiumFeatures?.has_bold_border ?? false,
      geolocation: body.geolocation ?? null,
      contact_preference: body.contactPreference,
      auto_republish: body.autoRepublish,
      accept_terms: body.acceptTerms,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    logger.debug('[API] Inserting listing', { userId: user.id, title: listingData.title })
    
    const { data: listing, error } = await supabaseAdmin
      .from('listings')
      .insert([listingData])
      .select()
      .single()

    if (error) {
      logger.error('[API] Database error creating listing', {
        userId: user.id,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        }
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

    logger.debug('[API] Listing created successfully', { listingId: listing.id, userId: user.id })

    return NextResponse.json({
      success: true,
      listing: {
        id: listing.id,
        title: listing.title,
        status: listing.status,
        message: 'İlanınız başarıyla oluşturuldu! Yönetici onayından sonra yayınlanacaktır.'
      }
    }, { status: 201 })

  } catch (error: unknown) {
    logger.error('[API] Create listing error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'İlan oluşturulurken bir hata oluştu' },
      { status: 500 }
    )
  }
}
