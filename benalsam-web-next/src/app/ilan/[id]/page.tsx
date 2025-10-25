import { getServerUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { extractIdFromSlug } from '@/lib/slugify'
import { ListingDetailClient } from './ListingDetailClient'
import { notFound } from 'next/navigation'

export default async function ListingDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  console.log('🚀 [SSR] ListingDetailPage rendering on server')
  
  const session = await getServerSession(authOptions)
  const listingId = extractIdFromSlug(params.id)
  
  if (!listingId) {
    notFound()
  }

  // Server-side: Tek query ile her şeyi çek
  const { data: listing, error } = await supabaseAdmin
    .from('listings')
    .select(`
      *,
      profiles!listings_user_id_fkey(
        id,
        name,
        avatar_url,
        rating,
        total_ratings,
        created_at
      ),
      user_favorites!left(user_id, listing_id)
    `)
    .eq('id', listingId)
    .single()

  if (error || !listing) {
    console.error('❌ [SSR] Error fetching listing:', error)
    notFound()
  }

  // Combine main_image_url and additional_image_urls into images array
  const images = [
    listing.main_image_url,
    ...(listing.additional_image_urls || [])
  ].filter(Boolean) as string[]

  // Check if favorited
  let is_favorited = false
  if (session?.user?.id && listing.user_favorites) {
    const favorites = Array.isArray(listing.user_favorites) 
      ? listing.user_favorites 
      : [listing.user_favorites]
    
    is_favorited = favorites.some((fav: any) => 
      fav && fav.user_id === session.user.id && fav.listing_id === listingId
    )
  }

  // Format user data
  const user = listing.profiles ? {
    id: listing.profiles.id,
    name: listing.profiles.name || 'Kullanıcı',
    avatar: listing.profiles.avatar_url,
    rating: listing.profiles.rating || 0,
    listingCount: 0, // TODO: Get from another query if needed
    joinDate: listing.profiles.created_at
  } : null

  // Build final listing object
  const formattedListing = {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    category: listing.category,
    price: listing.budget || listing.price,
    location: listing.location,
    images,
    created_at: listing.created_at,
    views: listing.views_count || 0,
    isUrgent: listing.is_urgent_premium || false,
    isPremium: listing.is_featured || false,
    contact: {
      phone: listing.contact_phone,
      email: listing.contact_email,
    },
    user,
    is_favorited, // ✅ Server'da hesaplandı, ilk render'da doğru!
  }

  console.log('✅ [SSR] Listing fetched:', { 
    id: listingId, 
    is_favorited, 
    hasUser: !!user,
    imageCount: images.length 
  })

  return <ListingDetailClient listing={formattedListing} listingId={listingId} />
}
