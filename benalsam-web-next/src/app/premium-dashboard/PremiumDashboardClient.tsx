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
import { toast } from '@/hooks/use-toast'
import { 
  getUserActivePlan, 
  getUserMonthlyUsage,
  getPlanFeatures,
  createSubscription,
  cancelSubscription,
  renewSubscription
} from '@/services/premiumService/core'
import { getPlanBadges, getFeatureComparison } from '@/services/premiumService/ui'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { logger } from '@/utils/production-logger'
import { Skeleton } from '@/components/ui/skeleton'

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
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<PlanData | null>(null)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [plans] = useState(getPlanFeatures())
  const [planBadges] = useState(getPlanBadges())
  const [comparison] = useState(getFeatureComparison())
  const [cancelling, setCancelling] = useState(false)
  const [renewing, setRenewing] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const [planData, usageData] = await Promise.all([
        getUserActivePlan(user.id),
        getUserMonthlyUsage(user.id)
      ])

      setCurrentPlan(planData as PlanData | null)
      setUsage(usageData as UsageData | null)
    } catch (error) {
      logger.error('[PremiumDashboard] Error loading user data', { error })
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

    if (!window.confirm('Aboneliğinizi iptal etmek istediğinize emin misiniz?\n\nMevcut aboneliğiniz bitiş tarihine kadar devam edecek.')) {
      return
    }

    setCancelling(true)
    try {
      const success = await cancelSubscription(user.id)
      if (success) {
        await loadUserData()
      }
    } catch (error) {
      logger.error('[PremiumDashboard] Error cancelling subscription', { error })
    } finally {
      setCancelling(false)
    }
  }

  const handleRenewSubscription = async () => {
    if (!user?.id || renewing) return

    setRenewing(true)
    try {
      const success = await renewSubscription(user.id)
      if (success) {
        await loadUserData()
      }
    } catch (error) {
      logger.error('[PremiumDashboard] Error renewing subscription', { error })
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
                    ? `Abonelik bitiş tarihi: ${format(new Date(currentPlan.expires_at), 'dd MMMM yyyy', { locale: tr })}`
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
                <Button
                  variant="destructive"
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="flex-1"
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
        {usage && currentPlan && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
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
                  {usage.listings_count || 0} / {formatLimit(currentPlan.limits?.listings_per_month || 5)}
                </div>
                <Progress 
                  value={getUsagePercentage(usage.listings_count || 0, currentPlan.limits?.listings_per_month || 5)} 
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
                  {usage.offers_count || 0} / {formatLimit(currentPlan.limits?.offers_per_month || 10)}
                </div>
                <Progress 
                  value={getUsagePercentage(usage.offers_count || 0, currentPlan.limits?.offers_per_month || 10)} 
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
                  {usage.messages_count || 0} / {formatLimit(currentPlan.limits?.messages_per_month || 50)}
                </div>
                <Progress 
                  value={getUsagePercentage(usage.messages_count || 0, currentPlan.limits?.messages_per_month || 50)} 
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
                  {usage.featured_offers_count || 0} / {formatLimit(currentPlan.limits?.featured_offers_per_day || 0)}
                </div>
                <Progress 
                  value={getUsagePercentage(usage.featured_offers_count || 0, currentPlan.limits?.featured_offers_per_day || 0)} 
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>
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
    </div>
  )
}

