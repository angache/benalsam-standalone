import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * POST /api/auth/logout
 * Logout the current user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı giriş yapmamış' },
        { status: 401 }
      )
    }

    // NextAuth.js handles session invalidation automatically
    // We just need to return success
    return NextResponse.json(
      { 
        success: true, 
        message: 'Başarıyla çıkış yapıldı' 
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Çıkış yapılırken bir hata oluştu' },
      { status: 500 }
    )
  }
}
