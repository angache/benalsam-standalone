# 📱 Mobile App Documentation - Benalsam

## 📋 Genel Bakış
Bu döküman, Benalsam React Native/Expo mobil uygulamasının teknik detaylarını, özelliklerini ve kullanım kılavuzunu içerir.

## 🏗️ Teknoloji Stack

### Core Technologies
- **Framework:** React Native 0.72+
- **Development Platform:** Expo SDK 49+
- **Language:** TypeScript
- **State Management:** Zustand + React Query
- **Navigation:** React Navigation 6
- **UI Library:** Native Base + Custom Components

### External Services
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Image Storage:** Supabase Storage + Unsplash API
- **Push Notifications:** Expo Notifications
- **Analytics:** Firebase Analytics
- **Maps:** React Native Maps + Google Places

## 📱 Uygulama Özellikleri

### ✅ Tamamlanan Özellikler
1. **Kullanıcı Kimlik Doğrulama**
   - Email/şifre ile giriş
   - Sosyal medya ile giriş (Google, Apple)
   - Şifre sıfırlama
   - Profil yönetimi

2. **İlan Yönetimi**
   - Çoklu ekran ilan oluşturma akışı
   - Kategori seçimi ve özellikler
   - Görsel yükleme (galeri + Unsplash)
   - Konum seçimi
   - İlan düzenleme ve silme

3. **Arama ve Filtreleme**
   - Metin tabanlı arama
   - Kategori filtreleme
   - Fiyat aralığı filtreleme
   - Konum bazlı filtreleme
   - Gelişmiş filtreler

4. **Mesajlaşma Sistemi**
   - Real-time mesajlaşma
   - Görsel ve dosya paylaşımı
   - Okundu bilgisi
   - Push notifications

5. **Kullanıcı Profili**
   - Profil düzenleme
   - İlan geçmişi
   - Favoriler
   - Değerlendirmeler

6. **Premium Özellikler**
   - Premium üyelik sistemi
   - Özel özellikler
   - Ödeme entegrasyonu

## 🗂️ Proje Yapısı

```
src/
├── components/           # Yeniden kullanılabilir bileşenler
│   ├── AdCard.tsx       # İlan kartı bileşeni
│   ├── Avatar.tsx       # Profil resmi bileşeni
│   ├── Badge.tsx        # Etiket bileşeni
│   ├── Button.tsx       # Buton bileşeni
│   ├── CategoryCard.tsx # Kategori kartı
│   ├── ChatBubble.tsx   # Mesaj balonu
│   ├── ImagePicker.tsx  # Görsel seçici
│   ├── LoadingSpinner.tsx # Yükleme animasyonu
│   ├── LocationPicker.tsx # Konum seçici
│   ├── SearchBar.tsx    # Arama çubuğu
│   └── __tests__/       # Bileşen testleri
├── screens/             # Ekran bileşenleri
│   ├── Auth/           # Kimlik doğrulama ekranları
│   ├── Home/           # Ana sayfa ekranları
│   ├── Listing/        # İlan ekranları
│   ├── Profile/        # Profil ekranları
│   ├── Chat/           # Mesajlaşma ekranları
│   └── __tests__/      # Ekran testleri
├── services/           # API servisleri
│   ├── authService.ts  # Kimlik doğrulama servisi
│   ├── listingService.ts # İlan servisi
│   ├── chatService.ts  # Mesajlaşma servisi
│   ├── imageService.ts # Görsel servisi
│   └── __tests__/      # Servis testleri
├── stores/             # State management
│   ├── authStore.ts    # Kimlik doğrulama store'u
│   ├── listingStore.ts # İlan store'u
│   └── __tests__/      # Store testleri
├── hooks/              # Custom hooks
│   ├── queries/        # React Query hooks
│   └── useAuth.ts      # Kimlik doğrulama hook'u
├── contexts/           # React contexts
│   ├── AppContext.tsx  # Uygulama context'i
│   └── AuthContext.tsx # Kimlik doğrulama context'i
├── types/              # TypeScript tipleri
│   ├── index.ts        # Ana tip tanımları
│   └── navigation.ts   # Navigasyon tipleri
├── utils/              # Yardımcı fonksiyonlar
│   ├── constants.ts    # Sabitler
│   ├── helpers.ts      # Yardımcı fonksiyonlar
│   └── validation.ts   # Doğrulama fonksiyonları
└── config/             # Konfigürasyon dosyaları
    ├── supabase.ts     # Supabase konfigürasyonu
    └── categories.ts   # Kategori verileri
```

## 🔧 Kurulum ve Geliştirme

### Gereksinimler
```bash
# Node.js 18+ ve pnpm
node --version  # v18.0.0+
pnpm --version  # v8.0.0+

# Expo CLI
npm install -g @expo/cli

# iOS Simulator (macOS)
xcode-select --install

# Android Studio (Android)
# Android Studio'yu kur ve SDK'yı yapılandır
```

### Proje Kurulumu
```bash
# Repository'yi clone et
git clone https://github.com/angache/benalsam-standalone.git
cd benalsam-standalone/benalsam-mobile

# Dependencies'leri yükle
pnpm install

# Environment dosyasını oluştur
cp .env.example .env

# Supabase konfigürasyonunu güncelle
nano .env
```

### Environment Variables
```bash
# .env dosyası
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=https://benalsam.com/api/v1
EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=your-unsplash-key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### Geliştirme Sunucusu
```bash
# Expo development server başlat
pnpm start

# iOS Simulator'da çalıştır
pnpm ios

# Android Emulator'da çalıştır
pnpm android

# Web'de çalıştır
pnpm web
```

## 📱 Ekran Akışları

### 1. Kimlik Doğrulama Akışı
```
Splash Screen → Welcome → Login/Register → Home
```

### 2. İlan Oluşturma Akışı
```
Home → Create Listing → Category Selection → Details → Images → Location → Review → Success
```

### 3. İlan Görüntüleme Akışı
```
Home → Search/Filter → Listing List → Listing Detail → Contact Seller
```

### 4. Mesajlaşma Akışı
```
Listing Detail → Contact → Chat List → Chat Room → Send Message
```

## 🔐 Kimlik Doğrulama

### Auth Service
```typescript
// services/authService.ts
export class AuthService {
  // Email/şifre ile giriş
  async signIn(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  }

  // Sosyal medya ile giriş
  async signInWithProvider(provider: 'google' | 'apple'): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: 'benalsam://auth/callback'
      }
    });
    
    if (error) throw error;
    return data;
  }

  // Çıkış yap
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Şifre sıfırlama
  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }
}
```

### Auth Store
```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  setUser: (user: User | null) => set({ user }),
  setSession: (session: Session | null) => set({ session }),
  setLoading: (loading: boolean) => set({ loading }),
  
  signOut: () => {
    set({ user: null, session: null });
  }
}));
```

## 📋 İlan Yönetimi

### Listing Service
```typescript
// services/listingService.ts
export class ListingService {
  // İlan oluştur
  async createListing(listingData: CreateListingData): Promise<Listing> {
    const { data, error } = await supabase
      .from('listings')
      .insert([listingData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // İlanları listele
  async getListings(filters: ListingFilters): Promise<ListingResponse> {
    let query = supabase
      .from('listings')
      .select(`
        *,
        category:categories(name, slug),
        user:users(name, avatar_url)
      `)
      .eq('status', 'active');

    // Filtreleri uygula
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    
    if (filters.priceMin) {
      query = query.gte('price', filters.priceMin);
    }
    
    if (filters.priceMax) {
      query = query.lte('price', filters.priceMax);
    }

    const { data, error, count } = await query
      .range(filters.offset, filters.offset + filters.limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return {
      listings: data || [],
      total: count || 0
    };
  }

  // İlan detayı getir
  async getListingById(id: string): Promise<Listing> {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        category:categories(*),
        user:users(*),
        images(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
}
```

### React Query Hooks
```typescript
// hooks/queries/useListings.ts
export const useListings = (filters: ListingFilters) => {
  return useQuery({
    queryKey: ['listings', filters],
    queryFn: () => listingService.getListings(filters),
    staleTime: 5 * 60 * 1000, // 5 dakika
    cacheTime: 10 * 60 * 1000, // 10 dakika
  });
};

export const useListing = (id: string) => {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingService.getListingById(id),
    enabled: !!id,
  });
};

export const useCreateListing = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: listingService.createListing,
    onSuccess: () => {
      // Cache'i güncelle
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
};
```

## 🖼️ Görsel Yönetimi

### Image Service
```typescript
// services/imageService.ts
export class ImageService {
  // Galeri'den görsel seç
  async pickFromGallery(): Promise<ImageInfo[]> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      return result.assets.map(asset => ({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: 'gallery'
      }));
    }
    
    return [];
  }

  // Kamera ile çek
  async takePhoto(): Promise<ImageInfo | null> {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: 'camera'
      };
    }
    
    return null;
  }

  // Unsplash'ten görsel ara
  async searchUnsplash(query: string): Promise<UnsplashImage[]> {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${query}&per_page=20`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
        }
      }
    );
    
    const data = await response.json();
    return data.results.map((photo: any) => ({
      id: photo.id,
      url: photo.urls.regular,
      thumb: photo.urls.thumb,
      alt: photo.alt_description,
      photographer: photo.user.name
    }));
  }

  // Supabase'e yükle
  async uploadToSupabase(file: File, path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('listings')
      .upload(path, file);
    
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from('listings')
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  }
}
```

## 💬 Mesajlaşma Sistemi

### Chat Service
```typescript
// services/chatService.ts
export class ChatService {
  // Konuşma listesi getir
  async getConversations(): Promise<Conversation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        listing:listings(title, images),
        participant1:users!conversations_participant1_id_fkey(name, avatar_url),
        participant2:users!conversations_participant2_id_fkey(name, avatar_url),
        messages:messages(*)
      `)
      .or(`participant1_id.eq.${user?.id},participant2_id.eq.${user?.id}`)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Mesajları getir
  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Mesaj gönder
  async sendMessage(conversationId: string, content: string, type: MessageType = 'text'): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        content,
        message_type: type
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Real-time mesaj dinle
  subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, callback)
      .subscribe();
  }
}
```

## 📍 Konum Servisleri

### Location Service
```typescript
// services/locationService.ts
export class LocationService {
  // Mevcut konumu al
  async getCurrentLocation(): Promise<Location> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    };
  }

  // Adres ara
  async searchPlaces(query: string): Promise<Place[]> {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    const data = await response.json();
    
    return data.results.map((place: any) => ({
      id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      location: {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng
      }
    }));
  }

  // İl/ilçe listesi getir
  async getCities(): Promise<City[]> {
    // Türkiye il listesi
    return [
      { id: 1, name: 'İstanbul', districts: ['Kadıköy', 'Beşiktaş', 'Şişli'] },
      { id: 2, name: 'Ankara', districts: ['Çankaya', 'Keçiören', 'Mamak'] },
      // ... diğer iller
    ];
  }
}
```

## 🔔 Push Notifications

### Notification Service
```typescript
// services/notificationService.ts
export class NotificationService {
  // Notification izinleri iste
  async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  // Token al
  async getToken(): Promise<string | null> {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: EXPO_PROJECT_ID
    });
    
    return token.data;
  }

  // Token'ı sunucuya kaydet
  async registerToken(token: string): Promise<void> {
    const { error } = await supabase
      .from('user_notifications')
      .upsert([{ token, user_id: authStore.user?.id }]);
    
    if (error) throw error;
  }

  // Local notification gönder
  async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data
      },
      trigger: null // Hemen gönder
    });
  }
}
```

## 🧪 Testing

### Unit Tests
```typescript
// __tests__/services/authService.test.ts
import { AuthService } from '../../services/authService';

describe('AuthService', () => {
  it('should sign in with valid credentials', async () => {
    const authService = new AuthService();
    
    const result = await authService.signIn('test@example.com', 'password');
    
    expect(result.user).toBeDefined();
    expect(result.session).toBeDefined();
  });

  it('should throw error with invalid credentials', async () => {
    const authService = new AuthService();
    
    await expect(
      authService.signIn('invalid@example.com', 'wrongpassword')
    ).rejects.toThrow();
  });
});
```

### Component Tests
```typescript
// __tests__/components/AdCard.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { AdCard } from '../../components/AdCard';

describe('AdCard', () => {
  it('should render listing information correctly', () => {
    const listing = {
      id: '1',
      title: 'Test Listing',
      price: 1000,
      images: ['test.jpg']
    };

    const { getByText } = render(<AdCard listing={listing} />);
    
    expect(getByText('Test Listing')).toBeTruthy();
    expect(getByText('₺1,000')).toBeTruthy();
  });

  it('should handle press event', () => {
    const onPress = jest.fn();
    const listing = { id: '1', title: 'Test' };

    const { getByTestId } = render(
      <AdCard listing={listing} onPress={onPress} />
    );

    fireEvent.press(getByTestId('ad-card'));
    expect(onPress).toHaveBeenCalledWith(listing);
  });
});
```

## 📦 Build ve Deployment

### Expo Build
```bash
# EAS CLI kurulumu
npm install -g @expo/eas-cli

# EAS'e giriş yap
eas login

# Build konfigürasyonu
eas build:configure

# iOS build
eas build --platform ios

# Android build
eas build --platform android

# Preview build
eas build --profile preview
```

### App Store Deployment
```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

## 🔧 Performance Optimization

### Image Optimization
```typescript
// Görsel boyutlandırma
const resizeImage = async (uri: string, maxWidth: number, maxHeight: number) => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxWidth, height: maxHeight } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  
  return result.uri;
};
```

### Lazy Loading
```typescript
// FlatList optimizasyonu
<FlatList
  data={listings}
  renderItem={({ item }) => <AdCard listing={item} />}
  keyExtractor={(item) => item.id}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={10}
  removeClippedSubviews={true}
  getItemLayout={(data, index) => ({
    length: 200,
    offset: 200 * index,
    index,
  })}
/>
```

### Memory Management
```typescript
// Component unmount'ta cleanup
useEffect(() => {
  const subscription = chatService.subscribeToMessages(conversationId, handleNewMessage);
  
  return () => {
    subscription.unsubscribe();
  };
}, [conversationId]);
```

## 📊 Analytics

### Firebase Analytics
```typescript
// Analytics service
export class AnalyticsService {
  // Event tracking
  async trackEvent(eventName: string, parameters?: Record<string, any>) {
    await analytics.logEvent(eventName, parameters);
  }

  // Screen tracking
  async trackScreen(screenName: string) {
    await analytics.logEvent('screen_view', {
      screen_name: screenName
    });
  }

  // User properties
  async setUserProperties(properties: Record<string, any>) {
    await analytics.setUserProperties(properties);
  }
}
```

---

**Son Güncelleme:** 22 Temmuz 2025  
**Versiyon:** 1.0  
**Platform:** React Native + Expo  
**Status:** Production Ready ✅ 