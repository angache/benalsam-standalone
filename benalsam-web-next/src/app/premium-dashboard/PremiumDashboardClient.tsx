'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Crown, 
  Zap, 
  TrendingUp, 
  BarChart3, 
  CreditCard, 
  Calendar,
  Check,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Sparkles,
  Shield,
  MessageSquare,
  Image as ImageIcon,
  FileText,
  Star,
  Eye,
  Users
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/use-toast'
import { 
  getUserActivePlan, 
  getUserMonthlyUsage,
  createSubscription,
  cancelSubscription,
  renewSubscription
} from '@/services/premiumService/core'
import { getPlanFeatures, getPlanBadges, getFeatureComparison } from '@/services/premiumService/ui'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { logger } from '@/utils/production-logger'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PlanData {
  plan_slug: string
  plan_name: string
  expires_at: string | null
  limits: Record<string, number>
  features: Record<string, boolean>
}

interface UsageData {
  listings_count: number
  offers_count: number
  messages_count: number
  featured_offers_count: number
  [key: string]: number
}

export default function PremiumDashboardClient() {
  const { user } = useAuth()
  const { toast } = useToast() // Use useToast hook instead of direct toast import
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<PlanData | null>(null)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [plans] = useState(getPlanFeatures())
  const [planBadges] = useState(getPlanBadges())
  const [comparison] = useState(getFeatureComparison())
  const [cancelling, setCancelling] = useState(false)
  const [renewing, setRenewing] = useState(false)
  const [showRenewDialog, setShowRenewDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    if (!user?.id) {
      logger.debug('[PremiumDashboard] No user ID, skipping data load')
      return
    }

    setLoading(true)
    logger.debug('[PremiumDashboard] Loading user data', { userId: user.id })
    
    try {
      const [planData, usageData] = await Promise.all([
        getUserActivePlan(user.id),
        getUserMonthlyUsage(user.id)
      ])

      logger.debug('[PremiumDashboard] User data loaded', {
        userId: user.id,
        hasPlan: !!planData,
        hasUsage: !!usageData,
        planData,
        usageData,
        planSlug: planData?.plan_slug,
        planName: planData?.plan_name,
        planLimits: planData?.limits,
        planFeatures: planData?.features
      })

      // RPC'den gelen veriyi doğrudan kullan, mapping'e gerek yok
      // Ancak UI'den plans objesi ile de limit bilgilerini kullanabiliriz
      setCurrentPlan(planData as PlanData | null)
      setUsage(usageData as UsageData | null)
    } catch (error) {
      logger.error('[PremiumDashboard] Error loading user data', { error, userId: user.id })
      toast({
        title: 'Hata',
        description: 'Veriler yüklenirken bir hata oluştu.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planSlug: string) => {
    if (!user?.id || upgrading) return

    setUpgrading(planSlug)

    try {
      // TODO: Payment integration
      toast({
        title: '🚧 Ödeme Sistemi Yakında!',
        description: 'Premium üyelik sistemi geliştirme aşamasında. Çok yakında sizlerle! 🚀',
        duration: 5000,
      })

      // const result = await createSubscription(user.id, planSlug)
      // if (result) {
      //   await loadUserData()
      //   toast({
      //     title: 'Başarılı! 🎉',
      //     description: `${plans[planSlug]?.name} planına başarıyla yükseltildi.`,
      //   })
      // }
    } catch (error) {
      logger.error('[PremiumDashboard] Error upgrading plan', { error })
      toast({
        title: 'Hata',
        description: 'Plan yükseltilirken bir hata oluştu.',
        variant: 'destructive',
      })
    } finally {
      setUpgrading(null)
    }
  }

  const handleCancelSubscription = async () => {
    if (!user?.id || cancelling) return
    setShowCancelDialog(true)
  }

  const confirmCancelSubscription = async () => {
    if (!user?.id || cancelling) return

    setShowCancelDialog(false)
    setCancelling(true)
    logger.debug('[PremiumDashboard] Attempting to cancel subscription', { userId: user.id })
    
    try {
      const success = await cancelSubscription(user.id)
      if (success) {
        logger.debug('[PremiumDashboard] Subscription cancelled successfully', { userId: user.id })
        toast({
          title: 'Abonelik İptal Edildi',
          description: 'Aboneliğiniz iptal edildi. Mevcut aboneliğiniz bitiş tarihine kadar devam edecek.',
          variant: 'default',
        })
        await loadUserData()
      } else {
        logger.warn('[PremiumDashboard] Subscription cancellation returned false', { userId: user.id })
        toast({
          title: 'Hata',
          description: 'Abonelik iptal edilirken bir sorun oluştu. Lütfen tekrar deneyin.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      logger.error('[PremiumDashboard] Error cancelling subscription', { error, userId: user.id })
      toast({
        title: 'Hata',
        description: 'Abonelik iptal edilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
        variant: 'destructive',
      })
    } finally {
      setCancelling(false)
    }
  }

  const handleRenewSubscription = async () => {
    if (!user?.id || renewing) return
    setShowRenewDialog(true)
  }

  const confirmRenewSubscription = async () => {
    if (!user?.id || renewing) return

    setShowRenewDialog(false)
    setRenewing(true)
    logger.debug('[PremiumDashboard] Attempting to renew subscription', { userId: user.id })
    
    try {
      const success = await renewSubscription(user.id)
      if (success) {
        logger.debug('[PremiumDashboard] Subscription renewed successfully', { userId: user.id })
        await loadUserData()
        toast({
          title: 'Başarılı! ✅',
          description: 'Aboneliğiniz başarıyla yenilendi. Yeni bitiş tarihi yukarıda görüntüleniyor.',
          variant: 'default',
        })
      } else {
        logger.warn('[PremiumDashboard] Subscription renewal returned false', { userId: user.id })
        toast({
          title: 'Hata',
          description: 'Abonelik yenilenirken bir sorun oluştu. Lütfen tekrar deneyin.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      logger.error('[PremiumDashboard] Error renewing subscription', { error, userId: user.id })
      toast({
        title: 'Hata',
        description: 'Abonelik yenilenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
        variant: 'destructive',
      })
    } finally {
      setRenewing(false)
    }
  }

  const getCurrentPlanSlug = () => {
    return currentPlan?.plan_slug || 'basic'
  }

  const isCurrentPlan = (planSlug: string) => {
    return getCurrentPlanSlug() === planSlug
  }

  const canUpgrade = (planSlug: string) => {
    const currentSlug = getCurrentPlanSlug()
    const planOrder = ['basic', 'advanced', 'corporate']
    return planOrder.indexOf(planSlug) > planOrder.indexOf(currentSlug)
  }

  const canDowngrade = (planSlug: string) => {
    const currentSlug = getCurrentPlanSlug()
    const planOrder = ['basic', 'advanced', 'corporate']
    return planOrder.indexOf(planSlug) < planOrder.indexOf(currentSlug)
  }

  // Aboneliği yenileme butonu ne zaman görünmeli?
  // Son 14 gün kala görünsün (veya abonelik bitmişse)
  const shouldShowRenewButton = () => {
    if (currentSlug === 'basic' || !currentPlan?.expires_at) {
      return false // Basic plan'da veya süresiz abonelikte gösterilmez
    }

    const expiresAt = new Date(currentPlan.expires_at)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    logger.debug('[PremiumDashboard] Renew button visibility check', {
      expiresAt: expiresAt.toISOString(),
      now: now.toISOString(),
      daysUntilExpiry,
      shouldShow: daysUntilExpiry <= 14
    })

    // Son 14 gün içindeyse veya abonelik bitmişse göster
    return daysUntilExpiry <= 14
  }

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0 // Unlimited
    if (limit === 0) return 100
    return Math.min(100, (used / limit) * 100)
  }

  const formatLimit = (limit: number) => {
    if (limit === -1) return 'Sınırsız'
    return limit.toString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const currentSlug = getCurrentPlanSlug()
  const currentPlanData = plans[currentSlug]
  const currentBadge = planBadges[currentSlug]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
              Premium Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Aboneliğinizi yönetin, kullanım istatistiklerinizi görüntüleyin ve planınızı yükseltin
            </p>
          </div>
          {currentBadge && (
            <Badge className={`${currentBadge.color} text-white text-lg px-4 py-2`}>
              <span className="mr-2">{currentBadge.icon}</span>
              {currentBadge.text}
            </Badge>
          )}
        </div>

        {/* Current Plan Card */}
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 mb-10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Crown className="w-6 h-6 text-yellow-500" />
                  Mevcut Plan: {currentPlanData?.name || 'Temel Plan'}
                </CardTitle>
                <CardDescription className="mt-2">
                  {currentPlan?.expires_at 
                    ? (() => {
                        const expiresAt = new Date(currentPlan.expires_at)
                        const now = new Date()
                        const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                        
                        if (daysUntilExpiry < 0) {
                          return `⚠️ Abonelik bitmiş (${format(expiresAt, 'dd MMMM yyyy', { locale: tr })})`
                        } else if (daysUntilExpiry <= 7) {
                          return `🔴 Abonelik bitiş tarihi: ${format(expiresAt, 'dd MMMM yyyy', { locale: tr })} (${daysUntilExpiry} gün kaldı)`
                        } else if (daysUntilExpiry <= 14) {
                          return `🟡 Abonelik bitiş tarihi: ${format(expiresAt, 'dd MMMM yyyy', { locale: tr })} (${daysUntilExpiry} gün kaldı)`
                        } else {
                          return `Abonelik bitiş tarihi: ${format(expiresAt, 'dd MMMM yyyy', { locale: tr })} (${daysUntilExpiry} gün kaldı)`
                        }
                      })()
                    : 'Süresiz abonelik'}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-700">
                  {currentPlanData?.price === 0 ? 'Ücretsiz' : `${currentPlanData?.price} ₺`}
                </div>
                <div className="text-sm text-muted-foreground">/ {currentPlanData?.period}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {currentPlanData?.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
            {currentSlug !== 'basic' && currentPlan?.expires_at && (
              <div className="flex gap-2 mt-4 pt-4 border-t">
                {shouldShowRenewButton() && (
                  <Button
                    variant="outline"
                    onClick={handleRenewSubscription}
                    disabled={renewing}
                    className="flex-1"
                  >
                    {renewing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Yenileniyor...
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4 mr-2" />
                        Aboneliği Yenile
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className={shouldShowRenewButton() ? "flex-1" : "w-full"}
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      İptal Ediliyor...
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Aboneliği İptal Et
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        {usage ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {/* Get plan limits with fallback */}
              {(() => {
                // Önce RPC'den gelen limits'i kullan, yoksa UI plans objesinden al
                const rpcLimits = currentPlan?.limits || {}
                const uiLimits = plans[currentSlug]?.limits || {}
                
                logger.debug('[PremiumDashboard] Plan limits calculation', {
                  currentSlug,
                  rpcLimits,
                  uiLimits,
                  rpcListings: rpcLimits.listings_per_month,
                  rpcOffers: rpcLimits.offers_per_month,
                  rpcMessages: rpcLimits.messages_per_month,
                  uiListings: uiLimits.listings_per_month,
                  uiOffers: uiLimits.offers_per_month,
                  uiMessages: uiLimits.messages_per_month
                })
                
                // Corporate plan için özel kontrol:
                // - listings_per_month: Database'de 50, her zaman UI'dan al (Corporate plan'da sınırsız değil!)
                // - offers_per_month: -1 ise sınırsız (Corporate plan'da sınırsız)
                // - messages_per_month: -1 ise sınırsız (Corporate plan'da sınırsız)
                const planLimits = {
                  // listings_per_month: Corporate plan'da 50, diğer planlarda database'den geliyorsa onu kullan
                  listings_per_month: currentSlug === 'corporate' 
                    ? (uiLimits.listings_per_month ?? 50) // Corporate için her zaman UI'dan al (50)
                    : (rpcLimits.listings_per_month !== undefined && rpcLimits.listings_per_month !== -1
                        ? rpcLimits.listings_per_month
                        : (uiLimits.listings_per_month ?? 5)),
                  // offers_per_month: -1 ise sınırsız, aksi halde RPC'den gelen değeri kullan
                  offers_per_month: rpcLimits.offers_per_month === -1 
                    ? -1 // Sınırsız
                    : (rpcLimits.offers_per_month !== undefined 
                        ? rpcLimits.offers_per_month 
                        : (uiLimits.offers_per_month ?? 10)),
                  // messages_per_month: -1 ise sınırsız, aksi halde RPC'den gelen değeri kullan
                  messages_per_month: rpcLimits.messages_per_month === -1
                    ? -1 // Sınırsız
                    : (rpcLimits.messages_per_month !== undefined
                        ? rpcLimits.messages_per_month
                        : (uiLimits.messages_per_month ?? 50)),
                  // featured_offers_per_day: Normal değer kullan
                  featured_offers_per_day: rpcLimits.featured_offers_per_day ?? uiLimits.featured_offers_per_day ?? 0
                }
                
                logger.debug('[PremiumDashboard] Final plan limits', { 
                  planLimits,
                  listings: planLimits.listings_per_month,
                  offers: planLimits.offers_per_month,
                  messages: planLimits.messages_per_month,
                  featured: planLimits.featured_offers_per_day
                })
              
              return (
                <>
                  {/* Listings Usage */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        İlanlar
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {usage.listings_count || 0} / {formatLimit(planLimits.listings_per_month || 5)}
                      </div>
                      <Progress 
                        value={getUsagePercentage(usage.listings_count || 0, planLimits.listings_per_month || 5)} 
                        className="mt-2"
                      />
                    </CardContent>
                  </Card>

                  {/* Offers Usage */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Teklifler
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {usage.offers_count || 0} / {formatLimit(planLimits.offers_per_month || 10)}
                      </div>
                      <Progress 
                        value={getUsagePercentage(usage.offers_count || 0, planLimits.offers_per_month || 10)} 
                        className="mt-2"
                      />
                    </CardContent>
                  </Card>

                  {/* Messages Usage */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Mesajlar
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {usage.messages_count || 0} / {formatLimit(planLimits.messages_per_month || 50)}
                      </div>
                      <Progress 
                        value={getUsagePercentage(usage.messages_count || 0, planLimits.messages_per_month || 50)} 
                        className="mt-2"
                      />
                    </CardContent>
                  </Card>

                  {/* Featured Offers Usage */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Öne Çıkanlar
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {usage.featured_offers_count || 0} / {formatLimit(planLimits.featured_offers_per_day || 0)}
                      </div>
                      <Progress 
                        value={getUsagePercentage(usage.featured_offers_count || 0, planLimits.featured_offers_per_day || 0)} 
                        className="mt-2"
                      />
                    </CardContent>
                  </Card>
                </>
              )
            })()}
          </div>
        ) : (
          <Card className="mb-10 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950">
            <CardHeader>
              <CardTitle className="text-lg text-yellow-800 dark:text-yellow-200">
                ⚠️ Kullanım istatistikleri yüklenemedi
              </CardTitle>
              <CardDescription className="text-yellow-700 dark:text-yellow-300">
                Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Plan Comparison */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="text-2xl">Plan Karşılaştırması</CardTitle>
            <CardDescription>
              Tüm planların özelliklerini karşılaştırın ve size en uygun planı seçin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(plans).map(([slug, plan]) => {
                const badge = planBadges[slug]
                const isCurrent = isCurrentPlan(slug)
                const canUpgradePlan = canUpgrade(slug)
                const canDowngradePlan = canDowngrade(slug)

                return (
                  <Card 
                    key={slug}
                    className={`relative ${plan.popular ? 'border-2 border-blue-500 ring-2 ring-blue-500/20' : ''} ${isCurrent ? 'border-2 border-green-500' : ''}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-blue-500 text-white">En Popüler</Badge>
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute -top-3 right-4">
                        <Badge className="bg-green-500 text-white">Mevcut Plan</Badge>
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          {badge && (
                            <span className="text-2xl">{badge.icon}</span>
                          )}
                          <CardTitle>{plan.name}</CardTitle>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground">₺</span>
                        <span className="text-muted-foreground">/{plan.period}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Separator />
                      <Button
                        className="w-full"
                        variant={isCurrent ? 'outline' : canUpgradePlan ? 'default' : 'secondary'}
                        onClick={() => handleUpgrade(slug)}
                        disabled={isCurrent || upgrading === slug}
                      >
                        {upgrading === slug ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : isCurrent ? (
                          'Mevcut Plan'
                        ) : canUpgradePlan ? (
                          <>
                            <ArrowUpRight className="w-4 h-4 mr-2" />
                            Yükselt
                          </>
                        ) : canDowngradePlan ? (
                          <>
                            <ArrowDownRight className="w-4 h-4 mr-2" />
                            Düşür
                          </>
                        ) : (
                          'Seç'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Feature Comparison Table */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="text-2xl">Detaylı Özellik Karşılaştırması</CardTitle>
            <CardDescription>
              Tüm planların özelliklerini detaylı olarak karşılaştırın
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Özellik</th>
                    <th className="text-center p-4">Temel</th>
                    <th className="text-center p-4">Gelişmiş</th>
                    <th className="text-center p-4">Kurumsal</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((category, categoryIndex) => (
                    <React.Fragment key={categoryIndex}>
                      <tr className="bg-muted/50">
                        <td colSpan={4} className="p-3 font-semibold">
                          {category.category}
                        </td>
                      </tr>
                      {category.features.map((feature, featureIndex) => (
                        <tr key={featureIndex} className="border-b">
                          <td className="p-4">{feature.name}</td>
                          <td className="text-center p-4">
                            {feature.basic === '❌' ? (
                              <X className="w-5 h-5 text-red-500 mx-auto" />
                            ) : (
                              <span>{feature.basic}</span>
                            )}
                          </td>
                          <td className="text-center p-4">
                            {feature.advanced === '❌' ? (
                              <X className="w-5 h-5 text-red-500 mx-auto" />
                            ) : (
                              <span>{feature.advanced}</span>
                            )}
                          </td>
                          <td className="text-center p-4">
                            {feature.corporate === '❌' ? (
                              <X className="w-5 h-5 text-red-500 mx-auto" />
                            ) : (
                              <span>{feature.corporate}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Payment History (Placeholder) */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <CreditCard className="w-6 h-6" />
              Ödeme Geçmişi
            </CardTitle>
            <CardDescription>
              Abonelik ödeme geçmişiniz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ödeme geçmişi yakında eklenecek</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Renew Subscription Confirmation Dialog */}
      <Dialog open={showRenewDialog} onOpenChange={setShowRenewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Aboneliği Yenile
            </DialogTitle>
            <DialogDescription>
              Aboneliğinizi yenilemek istediğinize emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            {currentPlan?.expires_at && (
              <>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Mevcut Bitiş Tarihi:</span>
                  <span className="text-sm">
                    {format(new Date(currentPlan.expires_at), 'dd MMMM yyyy', { locale: tr })}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <span className="text-sm font-medium">Yeni Bitiş Tarihi:</span>
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    {format(
                      new Date(new Date(currentPlan.expires_at).setMonth(new Date(currentPlan.expires_at).getMonth() + 1)),
                      'dd MMMM yyyy',
                      { locale: tr }
                    )}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Aboneliğiniz 1 ay uzatılacaktır.
                </p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRenewDialog(false)}
              disabled={renewing}
            >
              İptal
            </Button>
            <Button
              onClick={confirmRenewSubscription}
              disabled={renewing}
            >
              {renewing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Yenileniyor...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Yenile
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="w-5 h-5 text-destructive" />
              Aboneliği İptal Et
            </DialogTitle>
            <DialogDescription>
              Aboneliğinizi iptal etmek istediğinize emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Mevcut aboneliğiniz bitiş tarihine kadar devam edecek. İptal işleminden sonra aboneliğiniz otomatik olarak yenilenmeyecektir.
            </p>
            {currentPlan?.expires_at && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Bitiş Tarihi: </span>
                <span className="text-sm">
                  {format(new Date(currentPlan.expires_at), 'dd MMMM yyyy', { locale: tr })}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={cancelling}
            >
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelSubscription}
              disabled={cancelling}
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  İptal Ediliyor...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  İptal Et
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

