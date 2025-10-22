import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabaseAdmin } from './supabase'
import { env } from './env'
import type { User, LoginResponse } from '@/types/auth'
import axios from 'axios'

/**
 * NextAuth.js configuration
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email ve şifre gereklidir')
        }

        try {
          // Step 1: Verify user credentials with Supabase
          const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (authError || !authData.user) {
            throw new Error('Email veya şifre hatalı')
          }

          // Step 2: Get user data from database (profiles table)
          const { data: userData, error: userError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single()

          if (userError || !userData) {
            throw new Error('Kullanıcı bilgileri alınamadı')
          }

          // Step 3: Check if 2FA is enabled
          if (userData.is_2fa_enabled) {
            // Return user with 2FA flag
            // The actual 2FA verification will be handled in a separate flow
            return {
              id: userData.id,
              email: userData.email,
              name: userData.name || userData.email,
              role: userData.role || 'user',
              is_2fa_enabled: true,
              phone: userData.phone,
              avatar_url: userData.avatar_url,
              requiresTwoFactor: true, // Custom flag for 2FA flow
            } as any
          }

          // Step 4: Return user data (no 2FA required)
          return {
            id: userData.id,
            email: userData.email,
            name: userData.name || userData.email,
            role: userData.role || 'user',
            is_2fa_enabled: false,
            phone: userData.phone,
            avatar_url: userData.avatar_url,
          } as User
        } catch (error: any) {
          console.error('Login error:', error)
          throw new Error(error.message || 'Giriş yapılırken bir hata oluştu')
        }
      },
    }),
  ],

  callbacks: {
    /**
     * JWT callback - Called when JWT is created or updated
     */
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.email = user.email!
        token.name = user.name!
        token.role = (user as User).role
        token.is_2fa_enabled = (user as User).is_2fa_enabled
        token.phone = (user as User).phone
        token.avatar_url = (user as User).avatar_url
      }

      // Update session
      if (trigger === 'update' && session) {
        token = { ...token, ...session }
      }

      return token
    },

    /**
     * Session callback - Called when session is checked
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role as 'user' | 'admin' | 'moderator'
        session.user.is_2fa_enabled = token.is_2fa_enabled as boolean
        session.user.phone = token.phone as string | null
        session.user.avatar_url = token.avatar_url as string | null
        session.accessToken = token.accessToken as string
      }

      return session
    },

    /**
     * Redirect callback - Control where user is redirected after auth actions
     */
    async redirect({ url, baseUrl }) {
      // If URL is relative, use it
      if (url.startsWith('/')) return `${baseUrl}${url}`
      
      // If URL is same origin, use it
      if (new URL(url).origin === baseUrl) return url
      
      // Default to base URL
      return baseUrl
    },
  },

  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-email',
    newUser: '/onboarding', // Redirect new users here
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: env.NEXTAUTH_SECRET,

  debug: env.NEXT_PUBLIC_APP_ENV === 'development',
}

