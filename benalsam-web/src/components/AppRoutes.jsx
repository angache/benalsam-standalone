
import React, { Suspense, lazy, useCallback } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores';
import PageErrorBoundary from '@/components/ErrorBoundaries/PageErrorBoundary';

// Lazy loaded components for code splitting
const HomePage = lazy(() => import('@/pages/HomePage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const InventoryPage = lazy(() => import('@/pages/InventoryPage'));
const MyListingsPage = lazy(() => import('@/pages/MyListingsPage'));
const ListingDetailPage = lazy(() => import('@/pages/ListingDetailPage'));
const SentOffersPage = lazy(() => import('@/pages/SentOffersPage'));
const ReceivedOffersPage = lazy(() => import('@/pages/ReceivedOffersPage'));
const ConversationPage = lazy(() => import('@/pages/ConversationPage'));
const ConversationsListPage = lazy(() => import('@/pages/ConversationsListPage'));
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage'));
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage')); 
const FollowingPage = lazy(() => import('@/pages/FollowingPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const AdBanner = lazy(() => import('@/components/AdBanner'));
const SearchResultsPage = lazy(() => import('@/pages/SearchResultsPage'));

const CreateListingPage = lazy(() => import('@/pages/CreateListingPage'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const TwoFactorAuthPage = lazy(() => import('@/pages/TwoFactorAuthPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const MakeOfferPage = lazy(() => import('@/pages/MakeOfferPage'));
const ReportListingPage = lazy(() => import('@/pages/ReportListingPage'));
const LeaveReviewPage = lazy(() => import('@/pages/LeaveReviewPage'));
const InventoryFormPage = lazy(() => import('@/pages/InventoryFormPage'));
const EditListingPage = lazy(() => import('@/pages/EditListingPage'));
const StockImageSearchPage = lazy(() => import('@/pages/StockImageSearchPage'));
const FollowCategoryPage = lazy(() => import('@/pages/FollowCategoryPage'));
const ListingRulesPage = lazy(() => import('@/pages/ListingRulesPage'));
const DopingPage = lazy(() => import('@/pages/DopingPage'));
const PremiumPage = lazy(() => import('@/pages/PremiumPage'));
const TrustScorePage = lazy(() => import('@/pages/TrustScorePage'));
const UnpublishListingPage = lazy(() => import('@/pages/UnpublishListingPage'));
const ErrorTestComponent = lazy(() => import('@/components/ErrorBoundaries/ErrorTestComponent'));
const PerformanceTestPage = lazy(() => import('@/pages/PerformanceTestPage'));

const SettingsLayout = lazy(() => import('@/pages/SettingsPage/SettingsLayout'));
import SettingsPage from '@/pages/SettingsPage/SettingsPage';

const PlaceholderSettings = lazy(() => import('@/pages/SettingsPage/PlaceholderSettings'));
const PremiumSettings = lazy(() => import('@/pages/SettingsPage/PremiumSettings'));
const PremiumDashboard = lazy(() => import('@/pages/PremiumDashboard/index'));

import LanguagePage from '@/pages/SettingsPage/LanguagePage';
import CurrencyPage from '@/pages/SettingsPage/CurrencyPage';
import LocationPage from '@/pages/SettingsPage/LocationPage';
import EditProfilePage from '@/pages/SettingsPage/ProfilePage';
import SettingsTrustScorePage from '@/pages/SettingsPage/TrustScorePage';
import SecurityPage from '@/pages/SettingsPage/SecurityPage';
import TwoFactorSetupPage from '@/pages/SettingsPage/TwoFactorSetupPage';
import NotificationPage from '@/pages/SettingsPage/NotificationPage';
import PrivacyPage from '@/pages/SettingsPage/PrivacyPage';
import BlockedUsersPage from '@/pages/SettingsPage/BlockedUsersPage';
import ChatSettingsPage from '@/pages/SettingsPage/ChatSettingsPage';
import ThemePage from '@/pages/SettingsPage/ThemePage';
import CategoryPage from '@/pages/SettingsPage/CategoryPage';
import HelpPage from '@/pages/SettingsPage/HelpPage';
import ContactPage from '@/pages/SettingsPage/ContactPage';
import FeedbackPage from '@/pages/SettingsPage/FeedbackPage';
import AboutPage from '@/pages/SettingsPage/AboutPage';

// Loading component for Suspense fallback
const PageLoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
      <p className="text-muted-foreground">Sayfa yükleniyor...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading: loadingAuth, initialized } = useAuthStore();
  const location = useLocation();

  // Show loading spinner while auth is initializing
  if (loadingAuth || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // Only redirect to login if auth is initialized and user is not authenticated
  if (!currentUser) {
    return <Navigate to="/auth?action=login" state={{ from: location }} replace />;
  }

  return children;
};

const MainContent = ({ children }) => {
  return (
    <div className="flex-grow flex">
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
};

// Helper function to wrap components with PageErrorBoundary and Suspense
const withPageErrorBoundary = (Component, pageName) => {
  // If Component is already a function, call it directly
  const ComponentToRender = typeof Component === 'function' ? Component : () => <Component />;
  
  return (
    <PageErrorBoundary pageName={pageName}>
      <Suspense fallback={<PageLoadingSpinner />}>
        <ComponentToRender />
      </Suspense>
    </PageErrorBoundary>
  );
};


const AppRoutes = ({ currentUser }) => {
  const location = useLocation();

  // Stabilize HomePage component with memoized props
  const MemoizedHomePage = useCallback(() => {
    const handleToggleFavorite = (listingId, isFavorited) => {
      // TODO: Implement toggle favorite logic
    };
    
    return <HomePage currentUser={currentUser} onToggleFavorite={handleToggleFavorite} />;
  }, [currentUser]);

  // Stabilize MakeOfferPage component
  const MemoizedMakeOfferPage = useCallback(() => {
    return <MakeOfferPage currentUser={currentUser} />;
  }, [currentUser]);

  // Stabilize other critical pages
  const MemoizedSearchResultsPage = useCallback(() => {
    const handleToggleFavorite = (listingId, isFavorited) => {
      // TODO: Implement toggle favorite logic
    };
    return <SearchResultsPage onToggleFavorite={handleToggleFavorite} />;
  }, []);

  const MemoizedListingDetailPage = useCallback(() => {
    const handleToggleFavorite = (listingId, isFavorited) => {
      // TODO: Implement toggle favorite logic
    };
    return <ListingDetailPage setListings={() => {}} onToggleFavorite={handleToggleFavorite} />;
  }, []);

  const MemoizedProfilePage = useCallback(() => {
    return <ProfilePage />;
  }, []);

  const MemoizedCreateListingPage = useCallback(() => {
    return <CreateListingPage />;
  }, []);

  const MemoizedConversationPage = useCallback(() => {
    return <ConversationPage />;
  }, []);

  const MemoizedInventoryPage = useCallback(() => {
    return <InventoryPage />;
  }, []);

  const MemoizedMyListingsPage = useCallback(() => {
    return <MyListingsPage />;
  }, []);

  const MemoizedConversationsListPage = useCallback(() => {
    return <ConversationsListPage />;
  }, []);

  const MemoizedFavoritesPage = useCallback(() => {
    const handleToggleFavorite = (listingId, isFavorited) => {
      // TODO: Implement toggle favorite logic
    };
    return <FavoritesPage onToggleFavorite={handleToggleFavorite} />;
  }, []);

  const MemoizedFollowingPage = useCallback(() => {
    const handleToggleFavorite = (listingId, isFavorited) => {
      // TODO: Implement toggle favorite logic
    };
    return <FollowingPage onToggleFavorite={handleToggleFavorite} />;
  }, []);

  const MemoizedSentOffersPage = useCallback(() => {
    return <SentOffersPage />;
  }, []);

  const MemoizedReceivedOffersPage = useCallback(() => {
    return <ReceivedOffersPage />;
  }, []);

  const MemoizedPremiumPage = useCallback(() => {
    return <PremiumPage />;
  }, []);

  const MemoizedPremiumDashboard = useCallback(() => {
    return <PremiumDashboard />;
  }, []);

  const MemoizedPremiumSettings = useCallback(() => {
    return <PremiumSettings />;
  }, []);

  return (
    <MainContent>
      <Routes location={location}>
        <Route 
          path="/" 
          element={withPageErrorBoundary(MemoizedHomePage, 'Ana Sayfa')}
        />
        <Route path="/auth" element={withPageErrorBoundary(AuthPage, 'Giriş/Kayıt')} />
        <Route path="/auth/reset-password" element={withPageErrorBoundary(ResetPasswordPage, 'Şifre Sıfırlama')} />
        <Route path="/arama" element={withPageErrorBoundary(MemoizedSearchResultsPage, 'Arama Sonuçları')} />

        <Route path="/ilan-olustur" element={<ProtectedRoute>{withPageErrorBoundary(MemoizedCreateListingPage, 'İlan Oluştur')}</ProtectedRoute>} />
        <Route path="/teklif-yap/:listingId" element={<ProtectedRoute>{withPageErrorBoundary(MemoizedMakeOfferPage, 'Teklif Yap')}</ProtectedRoute>} />
        <Route path="/sikayet-et/:listingId" element={<ProtectedRoute>{withPageErrorBoundary(ReportListingPage, 'Şikayet Et')}</ProtectedRoute>} />
        <Route path="/degerlendirme/:offerId" element={<ProtectedRoute>{withPageErrorBoundary(LeaveReviewPage, 'Değerlendirme')}</ProtectedRoute>} />
        <Route path="/ilan-duzenle/:listingId" element={<ProtectedRoute>{withPageErrorBoundary(EditListingPage, 'İlan Düzenle')}</ProtectedRoute>} />
        <Route path="/stok-gorsel-ara" element={<ProtectedRoute>{withPageErrorBoundary(StockImageSearchPage, 'Stok Görsel Ara')}</ProtectedRoute>} />
        <Route path="/kategori-takip-et" element={<ProtectedRoute>{withPageErrorBoundary(FollowCategoryPage, 'Kategori Takip Et')}</ProtectedRoute>} />
        <Route path="/ilan-kurallari" element={withPageErrorBoundary(ListingRulesPage, 'İlan Kuralları')} />
        <Route path="/doping/:listingId" element={<ProtectedRoute>{withPageErrorBoundary(DopingPage, 'Doping')}</ProtectedRoute>} />
        <Route path="/premium" element={<ProtectedRoute>{withPageErrorBoundary(MemoizedPremiumPage, 'Premium')}</ProtectedRoute>} />
        <Route path="/guven-puani/:userId" element={withPageErrorBoundary(TrustScorePage, 'Güven Puanı')} />
        <Route path="/ilan-kaldir/:listingId" element={<ProtectedRoute>{withPageErrorBoundary(UnpublishListingPage, 'İlan Kaldır')}</ProtectedRoute>} />
        
        <Route 
          path="/profil/:userId" 
          element={withPageErrorBoundary(MemoizedProfilePage, 'Profil')}
        />
        <Route 
          path="/envanterim" 
          element={
            <ProtectedRoute>
              {withPageErrorBoundary(MemoizedInventoryPage, 'Envanterim')}
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ilanlarim" 
          element={
            <ProtectedRoute>
              {withPageErrorBoundary(MemoizedMyListingsPage, 'İlanlarım')}
            </ProtectedRoute>
          } 
        />
        <Route path="/envanter/yeni" element={<ProtectedRoute>{withPageErrorBoundary(InventoryFormPage, 'Yeni Envanter')}</ProtectedRoute>} />
        <Route path="/envanter/duzenle/:itemId" element={<ProtectedRoute>{withPageErrorBoundary(InventoryFormPage, 'Envanter Düzenle')}</ProtectedRoute>} />

        <Route 
          path="/ilan/:listingId" 
          element={withPageErrorBoundary(MemoizedListingDetailPage, 'İlan Detayı')}
        />
        <Route 
          path="/gonderdigim-teklifler" 
          element={<ProtectedRoute>{withPageErrorBoundary(MemoizedSentOffersPage, 'Gönderdiğim Teklifler')}</ProtectedRoute>} 
        />
        <Route 
          path="/aldigim-teklifler" 
          element={<ProtectedRoute>{withPageErrorBoundary(MemoizedReceivedOffersPage, 'Aldığım Teklifler')}</ProtectedRoute>} 
        />
        <Route path="/mesajlarim" element={<ProtectedRoute>{withPageErrorBoundary(MemoizedConversationsListPage, 'Mesajlarım')}</ProtectedRoute>} />
        <Route 
          path="/mesajlar/:conversationId" 
          element={<ProtectedRoute>{withPageErrorBoundary(MemoizedConversationPage, 'Mesajlaşma')}</ProtectedRoute>} 
        />
         <Route 
          path="/favorilerim" 
          element={<ProtectedRoute>{withPageErrorBoundary(MemoizedFavoritesPage, 'Favorilerim')}</ProtectedRoute>} 
        />
        <Route 
          path="/takip-edilenler/:userId" 
          element={<ProtectedRoute>{withPageErrorBoundary(MemoizedFollowingPage, 'Takip Edilenler')}</ProtectedRoute>} 
        />
        <Route 
          path="/takip-edilenler" 
          element={<ProtectedRoute>{withPageErrorBoundary(MemoizedFollowingPage, 'Takip Edilenler')}</ProtectedRoute>} 
        />
        <Route path="/auth/callback" element={withPageErrorBoundary(AuthCallbackPage, 'Auth Callback')} />
        <Route path="/2fa" element={withPageErrorBoundary(TwoFactorAuthPage, '2FA Doğrulama')} />
        
        <Route 
          path="/premium-dashboard" 
          element={<ProtectedRoute>{withPageErrorBoundary(MemoizedPremiumDashboard, 'Premium Dashboard')}</ProtectedRoute>} 
        />
        
        {/* Test routes - sadece development modunda */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <Route path="/test-error" element={withPageErrorBoundary(ErrorTestComponent, 'Error Test')} />
            <Route path="/performance-test" element={withPageErrorBoundary(PerformanceTestPage, 'Performance Test')} />
          </>
        )}
        
        {/* Ana ayarlar sayfası - Responsive tasarım */}
        <Route path="/ayarlar" element={
          <ProtectedRoute>
            <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div></div>}>
              <SettingsLayout>
                <SettingsPage />
              </SettingsLayout>
            </Suspense>
          </ProtectedRoute>
        } />
        
        <Route path="/ayarlar/dil" element={
          <ProtectedRoute>
            <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div></div>}>
              <SettingsLayout>
                <LanguagePage />
              </SettingsLayout>
            </Suspense>
          </ProtectedRoute>
        } />
        
        <Route path="/ayarlar/para-birimi" element={
          <ProtectedRoute>
            <SettingsLayout>
              <CurrencyPage />
            </SettingsLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/ayarlar/konum" element={
          <ProtectedRoute>
            <SettingsLayout>
              <LocationPage />
            </SettingsLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/ayarlar/profil" element={
          <ProtectedRoute>
            <SettingsLayout>
              <EditProfilePage />
            </SettingsLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/ayarlar/guven-puani" element={
          <ProtectedRoute>
            <SettingsLayout>
              <SettingsTrustScorePage />
            </SettingsLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/ayarlar/guvenlik" element={
          <ProtectedRoute>
            <SettingsLayout>
              <SecurityPage />
            </SettingsLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/ayarlar/guvenlik/2fa-setup" element={
          <ProtectedRoute>
            <SettingsLayout>
              <TwoFactorSetupPage />
            </SettingsLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/ayarlar/bildirimler" element={
          <ProtectedRoute>
            <SettingsLayout>
              <NotificationPage />
            </SettingsLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/ayarlar/gizlilik" element={
          <ProtectedRoute>
            <SettingsLayout>
              <PrivacyPage />
            </SettingsLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/ayarlar/engellenen-kullanicilar" element={
          <ProtectedRoute>
            <SettingsLayout>
              <BlockedUsersPage />
            </SettingsLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/ayarlar/sohbet-ayarlari" element={
          <ProtectedRoute>
            <SettingsLayout>
              <ChatSettingsPage />
            </SettingsLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/ayarlar/tema" element={
          <ProtectedRoute>
            <SettingsLayout>
              <ThemePage />
            </SettingsLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/ayarlar/kategori" element={
          <ProtectedRoute>
            <SettingsLayout>
              <CategoryPage />
            </SettingsLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/ayarlar/yardim" element={
          <ProtectedRoute>
            <SettingsLayout>
              <HelpPage />
            </SettingsLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/ayarlar/iletisim" element={
          <ProtectedRoute>
            <SettingsLayout>
              <ContactPage />
            </SettingsLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/ayarlar/geri-bildirim" element={
          <ProtectedRoute>
            <SettingsLayout>
              <FeedbackPage />
            </SettingsLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/ayarlar/hakkinda" element={
          <ProtectedRoute>
            <SettingsLayout>
              <AboutPage />
            </SettingsLayout>
          </ProtectedRoute>
        } />
        


        <Route path="*" element={withPageErrorBoundary(NotFoundPage, '404')} />
      </Routes>
    </MainContent>
  );
};

export default AppRoutes;
