'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield, Loader2, ArrowLeft, Smartphone, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

function TwoFactorVerifyPageContent() {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const maxAttempts = 5
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const userId = searchParams.get('userId')
  const [email, setEmail] = useState<string | null>(null)
  const [password, setPassword] = useState<string | null>(null)
  const [redirectTo, setRedirectTo] = useState<string>('/')

  // Load credentials from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedEmail = sessionStorage.getItem('2fa_pending_email')
      const storedPassword = sessionStorage.getItem('2fa_pending_password')
      const storedRedirect = sessionStorage.getItem('2fa_pending_redirect')
      
      if (storedEmail) setEmail(storedEmail)
      if (storedPassword) setPassword(storedPassword)
      if (storedRedirect) setRedirectTo(storedRedirect)
    }
  }, [])

  // Validate userId
  useEffect(() => {
    if (!userId) {
      setError('Geçersiz istek: Kullanıcı ID bulunamadı')
    }
  }, [userId])

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('')
      setCode(newCode)
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerify = async () => {
    const fullCode = code.join('')
    
    if (fullCode.length !== 6) {
      setError('6 haneli kodu eksiksiz girin')
      return
    }

    if (!userId) {
      setError('Geçersiz istek: Kullanıcı ID bulunamadı')
      return
    }

    if (attempts >= maxAttempts) {
      setError('Çok fazla başarısız deneme yaptınız. Lütfen daha sonra tekrar deneyin.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Verify 2FA code
      const response = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: fullCode,
          userId,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setAttempts((prev) => prev + 1)
        setError(result.error || 'Geçersiz kod')
        setCode(['', '', '', '', '', ''])
        setTimeout(() => {
          inputRefs.current[0]?.focus()
        }, 100)
        return
      }

      // Clear stored credentials
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('2fa_pending_email')
        sessionStorage.removeItem('2fa_pending_password')
        sessionStorage.removeItem('2fa_pending_redirect')
      }

      // If login credentials are provided, complete login after 2FA verification
      if (email && password) {
        const loginResult = await login({ email, password })
        
        if (!loginResult.success) {
          setError(loginResult.error || 'Giriş yapılamadı')
          return
        }
      } else {
        // If no credentials, refresh to get session from cookies
        router.refresh()
      }

      toast({
        title: 'Başarılı!',
        description: 'Doğrulama başarılı',
      })
      
      // Small delay to ensure session is set
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Redirect to intended page or home
      router.push(redirectTo)
      router.refresh()
    } catch (error: any) {
      console.error('2FA verification error:', error)
      setAttempts((prev) => prev + 1)
      setError('Doğrulama sırasında bir hata oluştu')
      setCode(['', '', '', '', '', ''])
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = () => {
    // Note: TOTP codes are generated by the authenticator app, not sent
    // This is just for UX consistency
    toast({
      title: 'Bilgi',
      description: 'TOTP kodları otomatik olarak yenilenir. Authenticator uygulamanızdan yeni kodu alın.',
    })
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Geçersiz İstek</CardTitle>
            <CardDescription>
              2FA doğrulama için gerekli bilgiler eksik.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Giriş Sayfasına Dön
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          href="/auth/login"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Giriş sayfasına dön
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            İki Faktörlü Doğrulama
          </h1>
          <p className="text-muted-foreground">
            {email ? (
              <>
                <strong>{email}</strong> hesabı için doğrulama gerekli
              </>
            ) : (
              'Authenticator uygulamanızdan 6 haneli kodu girin'
            )}
          </p>
        </div>

        {/* Verify Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Doğrulama Kodu
            </CardTitle>
            <CardDescription>
              Authenticator uygulamanızdan 6 haneli kodu girin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Attempts Warning */}
            {attempts > 0 && attempts < maxAttempts && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {maxAttempts - attempts} deneme hakkınız kaldı
                </AlertDescription>
              </Alert>
            )}

            {/* Code Input */}
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold tracking-widest"
                  disabled={isLoading || attempts >= maxAttempts}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {/* Verify Button */}
            <Button
              onClick={handleVerify}
              className="w-full"
              disabled={isLoading || code.some((d) => !d) || attempts >= maxAttempts}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Doğrulanıyor...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Doğrula
                </>
              )}
            </Button>

            {/* Backup Code Link */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center mb-2">
                Authenticator uygulamanıza erişiminiz yok mu?
              </p>
              <Link
                href={`/auth/2fa/backup?userId=${userId}`}
                className="text-sm text-primary hover:underline font-semibold block text-center"
              >
                Yedekleme kodu kullan
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              💡 <strong>İpucu:</strong> Google Authenticator, Authy veya Microsoft Authenticator
              gibi uygulamalardan kodu alabilirsiniz. Kodlar 30 saniyede bir otomatik olarak yenilenir.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function TwoFactorVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    }>
      <TwoFactorVerifyPageContent />
    </Suspense>
  )
}

