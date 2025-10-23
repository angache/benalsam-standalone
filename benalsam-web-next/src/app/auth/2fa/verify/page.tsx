'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import axios from 'axios'
import Link from 'next/link'

function TwoFactorVerifyPageContent() {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [timer, setTimer] = useState(60)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [timer])

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
      toast({
        title: 'Hata',
        description: '6 haneli kodu eksiksiz girin',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await axios.post('/api/2fa/verify', {
        code: fullCode,
        userId,
      })

      if (response.data.success) {
        toast({
          title: 'Başarılı!',
          description: 'Doğrulama başarılı',
        })
        
        router.push('/')
      }
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.response?.data?.error || 'Doğrulama başarısız',
        variant: 'destructive',
      })
      
      // Reset code
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = () => {
    toast({
      title: 'Kod gönderildi',
      description: 'Yeni doğrulama kodu telefonunuza gönderildi',
    })
    setTimer(60)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          href="/auth/login"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Giriş sayfasına dön
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            İki Faktörlü Doğrulama
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Authenticator uygulamanızdan 6 haneli kodu girin
          </p>
        </div>

        {/* Verify Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          {/* Code Input */}
          <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
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
                className="w-12 h-14 text-center text-2xl font-bold"
                disabled={isLoading}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Verify Button */}
          <Button
            onClick={handleVerify}
            className="w-full mb-4"
            disabled={isLoading || code.some((d) => !d)}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Doğrulanıyor...
              </>
            ) : (
              'Doğrula'
            )}
          </Button>

          {/* Resend Code */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Kod gelmedi mi?
            </p>
            {timer > 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Yeni kod {timer} saniye sonra gönderilebilir
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
              >
                Yeni Kod Gönder
              </button>
            )}
          </div>

          {/* Backup Code */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-2">
              Authenticator uygulamanıza erişiminiz yok mu?
            </p>
            <Link
              href="/auth/2fa/backup"
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold block text-center"
            >
              Yedekleme kodu kullan
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            💡 <strong>İpucu:</strong> Google Authenticator, Authy veya Microsoft Authenticator
            gibi uygulamalardan kodu alabilirsiniz.
          </p>
        </div>
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

