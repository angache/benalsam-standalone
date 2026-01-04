'use client'

/**
 * 2FA Setup Client Component
 * 
 * Multi-step 2FA setup process:
 * 1. Generate secret and QR code
 * 2. Verify with 6-digit code
 * 3. Show backup codes
 */

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import {
  Shield,
  QrCode,
  Smartphone,
  CheckCircle2,
  Copy,
  Download,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

type SetupStep = 'loading' | 'qr' | 'verify' | 'success'

interface SetupData {
  secret: string
  qrCode: string
  backupCodes: string[]
}

export default function TwoFactorSetupClient() {
  const router = useRouter()
  const { user } = useAuth()
  const [step, setStep] = useState<SetupStep>('loading')
  const [setupData, setSetupData] = useState<SetupData | null>(null)
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', ''])
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedCodes, setCopiedCodes] = useState<Set<string>>(new Set())
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Initialize setup
  useEffect(() => {
    if (!user?.id) {
      router.push('/auth/login?redirect=/auth/2fa/setup')
      return
    }

    handleSetup()
  }, [user])

  // Auto-focus first input when verification step
  useEffect(() => {
    if (step === 'verify') {
      inputRefs.current[0]?.focus()
    }
  }, [step])

  const handleSetup = async () => {
    if (!user?.id) {
      setError('Kullanıcı bilgisi bulunamadı')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || '2FA kurulumu başlatılamadı')
        setStep('loading')
        return
      }

      setSetupData(result.data)
      setStep('qr')
    } catch (error: any) {
      console.error('2FA setup error:', error)
      setError('2FA kurulumu sırasında bir hata oluştu')
      setStep('loading')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newCode = [...verificationCode]
    newCode[index] = value
    setVerificationCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()

    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('')
      setVerificationCode(newCode)
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerify = async () => {
    const fullCode = verificationCode.join('')

    if (fullCode.length !== 6) {
      setError('6 haneli kodu eksiksiz girin')
      return
    }

    if (!user?.id) {
      setError('Kullanıcı bilgisi bulunamadı')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: fullCode,
          userId: user.id,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Geçersiz kod')
        setVerificationCode(['', '', '', '', '', ''])
        setTimeout(() => {
          inputRefs.current[0]?.focus()
        }, 100)
        return
      }

      // Verification successful, move to success step
      setStep('success')
    } catch (error: any) {
      console.error('2FA verification error:', error)
      setError('Doğrulama sırasında bir hata oluştu')
      setVerificationCode(['', '', '', '', '', ''])
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopySecret = async () => {
    if (!setupData?.secret) return

    try {
      await navigator.clipboard.writeText(setupData.secret)
      toast({
        title: 'Kopyalandı',
        description: 'Secret key panoya kopyalandı',
      })
    } catch (error) {
      console.error('Copy failed:', error)
      toast({
        title: 'Hata',
        description: 'Kopyalama başarısız',
        variant: 'destructive',
      })
    }
  }

  const handleCopyBackupCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCodes((prev) => new Set(prev).add(code))
      toast({
        title: 'Kopyalandı',
        description: 'Yedekleme kodu kopyalandı',
      })
      setTimeout(() => {
        setCopiedCodes((prev) => {
          const newSet = new Set(prev)
          newSet.delete(code)
          return newSet
        })
      }, 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  const handleDownloadBackupCodes = () => {
    if (!setupData?.backupCodes) return

    const content = `BenAlsam 2FA Yedekleme Kodları\n\n` + setupData.backupCodes.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `benalsam-2fa-backup-codes-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: 'İndirildi',
      description: 'Yedekleme kodları indirildi',
    })
  }

  const handleFinish = () => {
    router.push('/ayarlar/guvenlik')
  }

  // Loading step
  if (step === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">2FA kurulumu hazırlanıyor...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // QR Code step
  if (step === 'qr' && setupData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="w-full max-w-2xl">
          {/* Back Button */}
          <Link
            href="/ayarlar/guvenlik"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Güvenlik ayarlarına dön
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">2FA Kurulumu</h1>
            <p className="text-muted-foreground">
              Authenticator uygulamanızı tarayıcınızla tarayın veya secret key'i manuel olarak girin
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* QR Code Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  QR Kod
                </CardTitle>
                <CardDescription>Authenticator uygulamanızla tarayın</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <img
                    src={setupData.qrCode}
                    alt="2FA QR Code"
                    className="w-64 h-64"
                  />
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Google Authenticator, Authy veya Microsoft Authenticator gibi bir uygulama kullanın
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Secret Key Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Secret Key
                </CardTitle>
                <CardDescription>Manuel olarak eklemek isterseniz</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg font-mono text-sm break-all">
                  {setupData.secret}
                </div>
                <Button onClick={handleCopySecret} variant="outline" className="w-full">
                  <Copy className="w-4 h-4 mr-2" />
                  Secret Key'i Kopyala
                </Button>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Bu key'i güvenli bir yerde saklayın. Cihazınızı kaybederseniz bu key ile 2FA'yı
                    yeniden kurabilirsiniz.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Next Button */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-4 text-center">
                QR kodu taradıktan veya secret key'i ekledikten sonra, Authenticator uygulamanızdan
                gelen 6 haneli kodu doğrulamak için devam edin.
              </p>
              <Button onClick={() => setStep('verify')} className="w-full" size="lg">
                Devam Et
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Verification step
  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => setStep('qr')}
            className="mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Kodu Doğrula</h1>
            <p className="text-muted-foreground">
              Authenticator uygulamanızdan 6 haneli kodu girin
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Doğrulama Kodu</CardTitle>
              <CardDescription>
                Authenticator uygulamanızdan gelen 6 haneli kodu girin
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

              {/* Code Input */}
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {verificationCode.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold tracking-widest"
                    disabled={isLoading}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {/* Verify Button */}
              <Button
                onClick={handleVerify}
                className="w-full"
                disabled={isLoading || verificationCode.some((d) => !d)}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Doğrulanıyor...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Doğrula ve Etkinleştir
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Success step
  if (step === 'success' && setupData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">2FA Başarıyla Etkinleştirildi!</h1>
            <p className="text-muted-foreground">
              Hesabınız artık iki faktörlü doğrulama ile korunuyor
            </p>
          </div>

          {/* Backup Codes Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Yedekleme Kodları
              </CardTitle>
              <CardDescription>
                Bu kodları güvenli bir yerde saklayın. Authenticator uygulamanıza erişiminiz olmadığında
                bu kodlarla giriş yapabilirsiniz.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Önemli:</strong> Bu kodları sadece bir kez görebilirsiniz. Güvenli bir yerde
                  saklayın!
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-2">
                {setupData.backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                  >
                    <code className="font-mono text-sm font-semibold">{code}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyBackupCode(code)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedCodes.has(code) ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleDownloadBackupCodes} variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Kodları İndir
                </Button>
                <Button
                  onClick={() => setShowBackupCodes(!showBackupCodes)}
                  variant="outline"
                  className="flex-1"
                >
                  {showBackupCodes ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Gizle
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Göster
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Finish Button */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <Button onClick={handleFinish} className="w-full" size="lg">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Tamamla
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Error state
  if (error && step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Hata</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={handleSetup} variant="outline" className="flex-1">
                Tekrar Dene
              </Button>
              <Link href="/ayarlar/guvenlik" className="flex-1">
                <Button variant="outline" className="w-full">
                  Geri Dön
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

