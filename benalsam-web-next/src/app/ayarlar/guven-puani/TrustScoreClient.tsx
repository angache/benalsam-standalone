'use client'

/**
 * Trust Score Client Component
 * 
 * Displays trust score with breakdown and recommendations
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { calculateTrustScore, updateTrustScore, getTrustLevelDescription, getTrustLevelColor } from '@/services/trustScoreService'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { Loader2, Award, RefreshCw, ArrowLeft, Edit, MailCheck, Phone, Package, Handshake, Star, Clock, Calendar, Link2, Crown } from 'lucide-react'
import { motion } from 'framer-motion'

const scoreCriteria = {
  profile_completeness: {
    title: 'Profil Doluluğu',
    icon: Edit,
    description: 'Profilinize isim, biyografi, avatar ve konum bilgileri ekleyerek puan kazanın.',
    maxPoints: 15,
    color: 'text-blue-500',
  },
  email_verification: {
    title: 'E-posta Doğrulaması',
    icon: MailCheck,
    description: 'E-posta adresinizi doğrulayarak güvenliğinizi artırın ve 10 puan kazanın.',
    maxPoints: 10,
    color: 'text-green-500',
  },
  phone_verification: {
    title: 'Telefon Doğrulaması',
    icon: Phone,
    description: 'Telefon numaranızı doğrulayarak hesabınızın güvenliğini artırın ve 10 puan kazanın.',
    maxPoints: 10,
    color: 'text-green-500',
  },
  listings: {
    title: 'Aktif İlanlar',
    icon: Package,
    description: 'Yayınladığınız aktif ilan sayısı arttıkça güven puanınız artar. 10\'dan fazla ilanınız varsa bu kriterden maksimum puan alırsınız.',
    maxPoints: 15,
    color: 'text-orange-500',
  },
  completed_trades: {
    title: 'Başarılı İşlemler',
    icon: Handshake,
    description: 'Tamamladığınız her başarılı işlem, güvenilirliğinizi kanıtlar. 20\'den fazla başarılı işleminiz varsa bu kriterden maksimum puan alırsınız.',
    maxPoints: 20,
    color: 'text-purple-500',
  },
  reviews: {
    title: 'Kullanıcı Yorumları',
    icon: Star,
    description: 'Olumlu kullanıcı yorumları güven puanınızı artırır. Yorum sayınız ve ortalama puanınız arttıkça bu kriterden daha fazla puan alırsınız.',
    maxPoints: 15,
    color: 'text-yellow-500',
  },
  response_time: {
    title: 'Yanıt Süresi',
    icon: Clock,
    description: 'Kullanıcılara hızlı yanıt vererek güven puanınızı artırabilirsiniz. Ortalama yanıt süreniz kısaldıkça bu kriterden daha fazla puan alırsınız.',
    maxPoints: 5,
    color: 'text-indigo-500',
  },
  account_age: {
    title: 'Hesap Yaşı',
    icon: Calendar,
    description: 'Hesabınızın yaşı arttıkça güven puanınız da artar. Uzun süredir aktif olan kullanıcılar daha güvenilir kabul edilir.',
    maxPoints: 5,
    color: 'text-gray-500',
  },
  social_links: {
    title: 'Sosyal Medya',
    icon: Link2,
    description: 'Instagram, Twitter, LinkedIn gibi sosyal medya hesaplarınızı ekleyerek şeffaflığınızı ve güven puanınızı artırabilirsiniz.',
    maxPoints: 3,
    color: 'text-pink-500',
  },
  premium_status: {
    title: 'Premium Üyelik',
    icon: Crown,
    description: 'Premium üyelik ile güven puanınız artar. Premium üyeyseniz bu kriterden maksimum puan alırsınız.',
    maxPoints: 2,
    color: 'text-amber-500',
  },
}

export default function TrustScoreClient({ userId }: { userId: string }) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { data: trustScoreData, isLoading, error, refetch } = useQuery({
    queryKey: ['trustScore', userId],
    queryFn: () => calculateTrustScore(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await updateTrustScore(userId)
      await refetch()
      toast({
        title: 'Güven puanı güncellendi',
        description: 'Güven puanınız başarıyla yenilendi.',
      })
    } catch (error: any) {
      console.error('Error refreshing trust score:', error)
      toast({
        title: 'Hata',
        description: 'Güven puanı güncellenirken bir hata oluştu.',
        variant: 'destructive',
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const getProgressColors = (score: number) => {
    if (score >= 80) return ['#10B981', '#059669'] // Green
    if (score >= 60) return ['#F59E0B', '#D97706'] // Gold
    if (score >= 40) return ['#6B7280', '#4B5563'] // Silver
    return ['#EF4444', '#DC2626'] // Red
  }

  const renderCircularProgress = () => {
    if (!trustScoreData) return null

    const score = trustScoreData.totalScore
    const progressPercentage = score / 100
    const progressColors = getProgressColors(score)
    const levelColor = getTrustLevelColor(trustScoreData.level)
    const size = 160
    const strokeWidth = 12
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - progressPercentage * circumference

    return (
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              className="text-muted"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={progressColors[0]}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold" style={{ color: progressColors[0] }}>
                {score}
              </div>
              <div className="text-sm text-muted-foreground">/100</div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col items-center">
          <Badge
            className="px-4 py-2 text-sm font-semibold mb-2"
            style={{
              backgroundColor: levelColor + '20',
              color: levelColor,
            }}
          >
            {trustScoreData.level.toUpperCase()}
          </Badge>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            {getTrustLevelDescription(trustScoreData.level)}
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !trustScoreData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-destructive mb-4">Güven puanı yüklenirken bir hata oluştu</p>
          <Button onClick={() => refetch()}>Tekrar Dene</Button>
        </CardContent>
      </Card>
    )
  }

  const breakdown = trustScoreData.breakdown

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Güncelleniyor...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Puanı Güncelle
            </>
          )}
        </Button>
      </div>

      {/* Circular Progress */}
      <Card>
        <CardContent className="p-8">
          {renderCircularProgress()}
        </CardContent>
      </Card>

      {/* Progress to Next Level */}
      {trustScoreData.level !== 'platinum' && (
        <Card>
          <CardHeader>
            <CardTitle>Bir Sonraki Seviyeye</CardTitle>
            <CardDescription>
              {trustScoreData.nextLevelScore - trustScoreData.totalScore} puan daha kazanarak{' '}
              {trustScoreData.level === 'bronze'
                ? 'Gümüş'
                : trustScoreData.level === 'silver'
                ? 'Altın'
                : 'Platin'}{' '}
              seviyeye ulaşabilirsiniz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={trustScoreData.progressToNextLevel} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2 text-center">
              %{trustScoreData.progressToNextLevel} tamamlandı
            </p>
          </CardContent>
        </Card>
      )}

      {/* Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Puan Detayları
          </CardTitle>
          <CardDescription>Her kriterden aldığınız puanları görüntüleyin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(scoreCriteria).map(([key, criterion]) => {
            const Icon = criterion.icon
            const score = breakdown[key as keyof typeof breakdown] || 0
            const weightedScore = (score * criterion.maxPoints) / 100
            const progressPercentage = score

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${criterion.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{criterion.title}</p>
                      <p className="text-sm text-muted-foreground">{criterion.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{Math.round(weightedScore)}</p>
                    <p className="text-xs text-muted-foreground">/{criterion.maxPoints} puan</p>
                  </div>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {score}% tamamlandı ({Math.round(weightedScore)}/{criterion.maxPoints} puan)
                </p>
              </motion.div>
            )
          })}
        </CardContent>
      </Card>
    </motion.div>
  )
}

