# Error Boundary Implementation

Bu proje kapsamlı bir Error Boundary sistemi içerir. Error Boundary'ler React uygulamalarında JavaScript hatalarını yakalayıp güzel hata sayfaları göstermek için kullanılır.

## 📁 Dosya Yapısı

```
src/
├── components/
│   ├── ErrorBoundary.tsx          # Ana Error Boundary component'i
│   ├── withErrorBoundary.tsx      # HOC wrapper
│   └── ErrorFallbacks.tsx         # Özel hata ekranları
├── utils/
│   └── errorBoundaryHelpers.tsx   # Helper functions ve configurations
└── screens/
    └── ErrorTestScreen.tsx        # Test ekranı (development only)
```

## 🚀 Özellikler

### ✅ Ana Error Boundary Bileşeni
- **Kapsamlı hata yakalama**: JavaScript hatalarını yakalar ve güzel UI gösterir
- **Hata detayları**: Stack trace ve component stack bilgisi
- **Kopyalama özelliği**: Hata detaylarını panoya kopyalayabilme
- **Tekrar deneme**: Hatalı component'i reset edebilme
- **Ana sayfaya dönüş**: Navigation reset ile ana sayfaya yönlendirme

### 🎨 Özel Hata Ekranları
- **SimpleErrorFallback**: Basit inline hatalar için
- **NetworkErrorFallback**: Ağ bağlantı hataları için
- **ServerErrorFallback**: Sunucu hataları için  
- **AuthErrorFallback**: Kimlik doğrulama hataları için
- **PermissionErrorFallback**: Yetki hataları için
- **NotFoundErrorFallback**: Bulunamayan içerik için

### 🔧 HOC ve Helper'lar
- **withErrorBoundary**: Component'leri error boundary ile sarma
- **useErrorBoundary**: Hook benzeri kullanım
- **ErrorBoundaryConfigs**: Önceden tanımlı konfigürasyonlar
- **ErrorReporter**: Hata raporlama servisi
- **Global error handlers**: Yakalanmamış promise rejection'lar için

## 📖 Kullanım

### Temel Kullanım

```tsx
import { ErrorBoundary } from '../components';

function MyApp() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### HOC ile Kullanım

```tsx
import { withErrorBoundary } from '../components';

const MyComponent = () => {
  return <div>My Component</div>;
};

export default withErrorBoundary(MyComponent);
```

### Özel Konfigürasyon

```tsx
import { withDataErrorBoundary } from '../utils/errorBoundaryHelpers';

const MyDataComponent = () => {
  // Component code
};

export default withDataErrorBoundary(MyDataComponent);
```

### Hook Benzeri Kullanım

```tsx
import { useErrorBoundary } from '../components';

const MyComponent = () => {
  const withErrorHandling = useErrorBoundary({
    onError: (error) => console.log(error),
  });

  return withErrorHandling(
    <div>My component content</div>
  );
};
```

## 🛠️ Konfigürasyon Türleri

### Critical (Kritik)
Ana uygulama akışı için:
```tsx
import { withCriticalErrorBoundary } from '../utils/errorBoundaryHelpers';
export default withCriticalErrorBoundary(MyComponent);
```

### Network (Ağ)
Network bağımlı ekranlar için:
```tsx
import { withNetworkErrorBoundary } from '../utils/errorBoundaryHelpers';
export default withNetworkErrorBoundary(MyComponent);
```

### Auth (Kimlik Doğrulama)
Kimlik doğrulama ekranları için:
```tsx
import { withAuthErrorBoundary } from '../utils/errorBoundaryHelpers';
export default withAuthErrorBoundary(MyComponent);
```

### Data (Veri)
Veri yükleme ekranları için:
```tsx
import { withDataErrorBoundary } from '../utils/errorBoundaryHelpers';
export default withDataErrorBoundary(MyComponent);
```

## 📊 Hata Raporlama

### Manuel Hata Raporlama

```tsx
import { ErrorReporter } from '../utils/errorBoundaryHelpers';

// Genel hata raporlama
ErrorReporter.reportError(error, 'Context Info', { additionalData: 'value' });

// Network hata raporlama
ErrorReporter.reportNetworkError('https://api.example.com', error, response);

// Auth hata raporlama
ErrorReporter.reportAuthError('login', error, userId);

// Data hata raporlama
ErrorReporter.reportDataError('userProfile', error, { userId: 123 });
```

### Global Hata Handler'ları

```tsx
import { setupGlobalErrorHandlers } from '../utils/errorBoundaryHelpers';

// App initialization'da çağır
setupGlobalErrorHandlers();
```

## 🧪 Test Etme

Error Boundary sistemini test etmek için `ErrorTestScreen` kullanabilirsiniz:

```tsx
// Navigation ile erişim
navigation.navigate('ErrorTest');
```

Test ekranında şu hata türlerini test edebilirsiniz:
- ✅ Network Error
- ✅ Server Error  
- ✅ Auth Error
- ✅ Generic Error
- ✅ Async Error
- ✅ Manual Error Reporting
- ✅ Network Error Reporting

## 🎯 Production Entegrasyonu

Production'da hata raporlama servisleri ile entegrasyon:

```tsx
// Sentry entegrasyonu
import * as Sentry from '@sentry/react-native';

ErrorReporter.reportError = (error, context, additionalData) => {
  Sentry.captureException(error, {
    extra: { context, ...additionalData }
  });
};

// Crashlytics entegrasyonu
import crashlytics from '@react-native-firebase/crashlytics';

ErrorReporter.reportError = (error, context, additionalData) => {
  crashlytics().recordError(error);
  crashlytics().setAttributes({ context, ...additionalData });
};
```

## 📱 App.tsx Entegrasyonu

Ana app'de iki seviyeli error boundary:

```tsx
export default function App() {
  return (
    <ErrorBoundary> {/* Global Level */}
      <SafeAreaProvider>
        <ErrorBoundary> {/* Navigation Level */}
          <NavigationContainer>
            {/* App content */}
          </NavigationContainer>
        </ErrorBoundary>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
```

## 🚀 Aktif Örnekler

Projede şu ekranlar Error Boundary ile korunmaktadır:

- ✅ **MyListingsScreen**: `withDataErrorBoundary` ile korunmuş
- ✅ **App.tsx**: Global ve Navigation seviyelerinde korunmuş
- ✅ **Global error handlers**: Yakalanmamış hatalar için setup edilmiş

## 💡 Best Practices

1. **Granular Error Boundaries**: Her önemli component için uygun error boundary kullanın
2. **Meaningful Fallbacks**: Kullanıcı için anlamlı hata mesajları gösterin
3. **Error Reporting**: Production'da mutlaka hata raporlama servisi kullanın
4. **Testing**: Error boundary'leri düzenli olarak test edin
5. **User Experience**: Kullanıcının uygulamaya devam edebilmesini sağlayın

## 🔍 Debug ve Geliştirme

Development mode'da:
- Console'da detaylı error logları
- Stack trace ve component stack bilgisi
- Error boundary tetikleme butonları (ErrorTestScreen)
- Manuel error reporting test'leri

Bu Error Boundary sistemi sayesinde uygulama daha kararlı ve kullanıcı dostu hale gelmiştir. Hatalar yakalanır, raporlanır ve kullanıcıya güzel bir deneyim sunulur. 