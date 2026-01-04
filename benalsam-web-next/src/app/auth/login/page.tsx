'use client'

import { useState, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'

const loginSchema = z.object({
  email: z.string().email('Geçerli bir email adresi girin'),
  password: z.string().min(1, 'Şifre gereklidir'),
  remember: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

function LoginPageContent() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      remember: false,
    },
  })

  const remember = watch('remember')

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)

    try {
      console.log('🔐 [LoginPage] Attempting login...', { email: data.email })
      
      const result = await login({
        email: data.email,
        password: data.password,
        remember: data.remember,
      })

      console.log('🔐 [LoginPage] Login result:', result)

      if (result.success) {
        console.log('✅ [LoginPage] Login successful:', { requires2FA: result.requires2FA, userId: result.user?.id })
        
        // Small delay to ensure Supabase session is fully set
        await new Promise(resolve => setTimeout(resolve, 100))

        if (result.requires2FA) {
          // Store credentials temporarily in sessionStorage for 2FA verification
          // This is more secure than passing in URL
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('2fa_pending_email', email)
            sessionStorage.setItem('2fa_pending_password', password)
            sessionStorage.setItem('2fa_pending_redirect', callbackUrl)
          }
          
          // Redirect to 2FA verification with userId
          const redirectUrl = `/auth/2fa/verify?userId=${result.user?.id}`
          console.log('🔐 [LoginPage] Redirecting to 2FA:', redirectUrl)
          router.push(redirectUrl)
        } else {
          console.log('✅ [LoginPage] No 2FA, redirecting to:', callbackUrl)
          toast({
            title: 'Başarılı',
            description: 'Giriş başarılı!',
          })
          router.push(callbackUrl)
          router.refresh() // Refresh to get new session from cookies
        }
      } else {
        console.error('❌ [LoginPage] Login failed:', result.error)
        toast({
          title: 'Hata',
          description: result.error || 'Giriş yapılırken bir hata oluştu',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      console.error('❌ [LoginPage] Login error:', error)
      toast({
        title: 'Hata',
        description: error.message || 'Giriş yapılırken bir hata oluştu',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
              BenAlsam
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Hesabınıza giriş yapın
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-lg shadow-xl p-8 border border-border">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(checked) => setValue('remember', !!checked)}
                  disabled={isLoading}
                />
                <Label htmlFor="remember" className="text-sm cursor-pointer">
                  Beni Hatırla
                </Label>
              </div>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Şifremi Unuttum
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Giriş Yap
                </>
              )}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Hesabınız yok mu?{' '}
              <Link
                href="/auth/register"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
              >
                Kayıt Olun
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2025 BenAlsam. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}

