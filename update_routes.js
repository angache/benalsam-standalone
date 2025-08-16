const fs = require('fs');
const path = require('path');

const appTsxPath = path.join(__dirname, 'benalsam-admin-ui/src/App.tsx');
let content = fs.readFileSync(appTsxPath, 'utf8');

// Pattern to match routes that need ErrorBoundary
const routePattern = /<ProtectedRoute>\s*<Layout>\s*<Suspense fallback={<PageLoadingSpinner \/>}>\s*<(\w+) \/>\s*<\/Suspense>\s*<\/Layout>\s*<\/ProtectedRoute>/g;

// Replace with ErrorBoundary wrapper
const replacement = `<ProtectedRoute>
                  <ErrorBoundary>
                    <Layout>
                      <Suspense fallback={<PageLoadingSpinner />}>
                        <$1 />
                      </Suspense>
                    </Layout>
                  </ErrorBoundary>
                </ProtectedRoute>`;

content = content.replace(routePattern, replacement);

// Also handle the 2fa-verify route which doesn't have ProtectedRoute
const verifyRoutePattern = /<Suspense fallback={<PageLoadingSpinner \/>}>\s*<TwoFactorVerifyPage \/>\s*<\/Suspense>/g;
const verifyReplacement = `<ErrorBoundary>
                  <Suspense fallback={<PageLoadingSpinner />}>
                    <TwoFactorVerifyPage />
                  </Suspense>
                </ErrorBoundary>`;

content = content.replace(verifyRoutePattern, verifyReplacement);

fs.writeFileSync(appTsxPath, content);
console.log('All routes updated with ErrorBoundary!');
