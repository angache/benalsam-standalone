import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Preload strategies for different routes
const preloadStrategies = {
  // Preload auth pages when user is not authenticated
  auth: () => {
    import('@/pages/AuthPage.jsx');
    import('@/pages/AuthCallbackPage.jsx');
  },
  
  // Preload listing pages when on home page
  listings: () => {
    import('@/pages/ListingDetailPage');
    import('@/pages/CreateListingPage.jsx');
    import('@/pages/EditListingPage.jsx');
  },
  
  // Preload profile pages when user is authenticated
  profile: () => {
    import('@/pages/ProfilePage.jsx');
    import('@/pages/SettingsPage/SettingsLayout.jsx');
  },
  
  // Preload messaging when user is authenticated
  messaging: () => {
    import('@/pages/ConversationPage');
    import('@/pages/ConversationsListPage.jsx');
  },
  
  // Preload offers when user is authenticated
  offers: () => {
    import('@/pages/MakeOfferPage.jsx');
    import('@/pages/SentOffersPage');
    import('@/pages/ReceivedOffersPage');
  },
  
  // Preload premium features when user is authenticated
  premium: () => {
    import('@/pages/PremiumPage.jsx');
    import('@/pages/PremiumDashboard');
    import('@/pages/DopingPage.jsx');
  }
};

export const usePreload = (currentUser) => {
  const location = useLocation();
  
  useEffect(() => {
    const pathname = location.pathname;
    
    // Preload based on current route and user state
    if (!currentUser) {
      // User not authenticated - preload auth pages
      preloadStrategies.auth();
    } else {
      // User authenticated - preload based on current page
      if (pathname === '/') {
        // On home page - preload listing details and create
        preloadStrategies.listings();
      } else if (pathname.startsWith('/ilan/')) {
        // On listing detail - preload create and edit
        preloadStrategies.listings();
      } else if (pathname.startsWith('/profil/')) {
        // On profile page - preload settings
        preloadStrategies.profile();
      } else if (pathname.startsWith('/mesajlar')) {
        // On messaging - preload conversation details
        preloadStrategies.messaging();
      } else if (pathname.includes('teklif')) {
        // On offers - preload offer details
        preloadStrategies.offers();
      } else if (pathname.includes('premium') || pathname.includes('doping')) {
        // On premium features - preload other premium features
        preloadStrategies.premium();
      }
    }
  }, [location.pathname, currentUser]);
};

// Preload specific chunks
export const preloadChunk = (chunkName) => {
  switch (chunkName) {
    case 'auth':
      preloadStrategies.auth();
      break;
    case 'listings':
      preloadStrategies.listings();
      break;
    case 'profile':
      preloadStrategies.profile();
      break;
    case 'messaging':
      preloadStrategies.messaging();
      break;
    case 'offers':
      preloadStrategies.offers();
      break;
    case 'premium':
      preloadStrategies.premium();
      break;
    default:
      console.warn(`Unknown chunk: ${chunkName}`);
  }
}; 