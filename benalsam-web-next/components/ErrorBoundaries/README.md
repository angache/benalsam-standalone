# Error Boundaries

Bu klasör, React uygulamasında hata yönetimi için error boundary bileşenlerini içerir.

## Bileşenler

### 1. ErrorBoundary (Ana Bileşen)
Temel error boundary bileşeni. Diğer tüm error boundary'ler bu bileşeni kullanır.

```jsx
import { ErrorBoundary } from '@/components/ErrorBoundaries';

<ErrorBoundary fallback={<CustomFallback />}>
  <YourComponent />
</ErrorBoundary>
```

### 2. AppErrorBoundary
Uygulama seviyesinde kullanılır. Tüm uygulamayı sarar.

```jsx
import { AppErrorBoundary } from '@/components/ErrorBoundaries';

<AppErrorBoundary>
  <App />
</AppErrorBoundary>
```

### 3. PageErrorBoundary
Sayfa seviyesinde kullanılır. Her sayfa için ayrı error handling.

```jsx
import { PageErrorBoundary } from '@/components/ErrorBoundaries';

<PageErrorBoundary pageName="Ana Sayfa">
  <HomePage />
</PageErrorBoundary>
```

### 4. ComponentErrorBoundary
Bileşen seviyesinde kullanılır. Küçük bileşenler için.

```jsx
import { ComponentErrorBoundary } from '@/components/ErrorBoundaries';

<ComponentErrorBoundary componentName="UserCard">
  <UserCard user={user} />
</ComponentErrorBoundary>
```

## HOC'ler (Higher Order Components)

### withErrorBoundary
Herhangi bir bileşeni error boundary ile sarar.

```jsx
import { withErrorBoundary } from '@/components/ErrorBoundaries';

const SafeUserCard = withErrorBoundary(UserCard, 'UserCard');
```

### withPageErrorBoundary
Sayfa bileşenlerini error boundary ile sarar.

```jsx
import { withPageErrorBoundary } from '@/components/ErrorBoundaries';

const SafeHomePage = withPageErrorBoundary(HomePage, 'Ana Sayfa');
```

### withFormErrorBoundary
Form bileşenlerini error boundary ile sarar.

```jsx
import { withFormErrorBoundary } from '@/components/ErrorBoundaries';

const SafeLoginForm = withFormErrorBoundary(LoginForm, 'Giriş Formu');
```

### withListErrorBoundary
Liste bileşenlerini error boundary ile sarar.

```jsx
import { withListErrorBoundary } from '@/components/ErrorBoundaries';

const SafeUserList = withListErrorBoundary(UserList, 'Kullanıcı Listesi');
```

## Hook'lar

### useErrorBoundary
Error boundary'leri programatik olarak kullanmak için.

```jsx
import { useErrorBoundary } from '@/components/ErrorBoundaries';

const { handleError, createErrorBoundary } = useErrorBoundary();
```

### useAsyncError
Async fonksiyonlar için error handling.

```jsx
import { useAsyncError } from '@/components/ErrorBoundaries';

const { handleAsyncError } = useAsyncError();

const safeAsyncFunction = async () => {
  return await handleAsyncError(async () => {
    // async işlemler
  }, 'Async Function');
};
```

### useEventHandlerError
Event handler'lar için error handling.

```jsx
import { useEventHandlerError } from '@/components/ErrorBoundaries';

const { handleEventError } = useEventHandlerError();

const safeClickHandler = handleEventError((event) => {
  // click işlemleri
}, 'Click Handler');
```

## Kullanım Örnekleri

### 1. Route'larda Kullanım
```jsx
// AppRoutes.jsx
const withPageErrorBoundary = (Component, pageName) => (
  <PageErrorBoundary pageName={pageName}>
    <Component />
  </PageErrorBoundary>
);

<Route path="/" element={withPageErrorBoundary(HomePage, 'Ana Sayfa')} />
```

### 2. Bileşenlerde Kullanım
```jsx
// UserProfile.jsx
import { ComponentErrorBoundary } from '@/components/ErrorBoundaries';

const UserProfile = () => (
  <div>
    <ComponentErrorBoundary componentName="Avatar">
      <Avatar user={user} />
    </ComponentErrorBoundary>
    
    <ComponentErrorBoundary componentName="UserInfo">
      <UserInfo user={user} />
    </ComponentErrorBoundary>
  </div>
);
```

### 3. Form'larda Kullanım
```jsx
// CreateListingForm.jsx
import { withFormErrorBoundary } from '@/components/ErrorBoundaries';

const CreateListingForm = () => {
  // form logic
};

export default withFormErrorBoundary(CreateListingForm, 'İlan Oluşturma Formu');
```

## Test Etme

Error boundary'leri test etmek için `/test-error` route'unu kullanabilirsiniz (sadece development modunda).

```jsx
// Test bileşeni oluşturma
const BuggyComponent = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test hatası!');
  }
  return <div>Normal bileşen</div>;
};

// Error boundary ile test
<ComponentErrorBoundary componentName="Test">
  <BuggyComponent shouldThrow={true} />
</ComponentErrorBoundary>
```

## Özellikler

- ✅ Otomatik hata yakalama
- ✅ Retry mekanizması
- ✅ Reset mekanizması
- ✅ Development modunda hata detayları
- ✅ Custom fallback bileşenleri
- ✅ Hata loglama desteği
- ✅ TypeScript desteği
- ✅ Responsive tasarım
- ✅ Accessibility uyumlu

## Best Practices

1. **Hiyerarşik Kullanım**: App → Page → Component seviyesinde kullanın
2. **Granüler Yaklaşım**: Her kritik bileşeni ayrı error boundary ile sarın
3. **Anlamlı İsimler**: componentName ve pageName parametrelerini açıklayıcı yapın
4. **Fallback Tasarımı**: Kullanıcı dostu fallback bileşenleri oluşturun
5. **Hata Loglama**: Production'da hataları loglama servisine gönderin
6. **Test**: Error boundary'leri düzenli olarak test edin

## Gelecek Geliştirmeler

- [ ] Hata analitik entegrasyonu
- [ ] Otomatik hata raporlama
- [ ] Performance monitoring
- [ ] A/B testing desteği
- [ ] Internationalization desteği 