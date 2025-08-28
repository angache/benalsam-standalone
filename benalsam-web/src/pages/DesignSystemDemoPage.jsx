import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { Skeleton, SkeletonCard, SkeletonText } from '../components/ui/skeleton';
import { EmptyState, EmptyStateList, EmptyStateSearch, EmptyStateError } from '../components/ui/empty-state';
import { DataTable } from '../components/ui/data-table';
import { TooltipProvider, TooltipWrapper } from '../components/ui/tooltip';
import { ThemeToggle } from '../components/ui/theme-provider';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const DesignSystemDemoPage = () => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [notifications, setNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Sample data for DataTable
  const sampleData = [
    { id: 1, name: 'Ahmet Yılmaz', email: 'ahmet@example.com', status: 'active', role: 'user' },
    { id: 2, name: 'Ayşe Demir', email: 'ayse@example.com', status: 'inactive', role: 'admin' },
    { id: 3, name: 'Mehmet Kaya', email: 'mehmet@example.com', status: 'active', role: 'user' },
  ];

  const columns = [
    { key: 'id', title: 'ID', sortable: true },
    { key: 'name', title: 'İsim', sortable: true },
    { key: 'email', title: 'E-posta', sortable: true },
    { 
      key: 'status', 
      title: 'Durum', 
      sortable: true,
      render: (value) => (
        <Badge variant={value === 'active' ? 'default' : 'secondary'}>
          {value === 'active' ? 'Aktif' : 'Pasif'}
        </Badge>
      )
    },
    { key: 'role', title: 'Rol', sortable: true },
  ];

  const handleLoadingToggle = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Design System Demo</h1>
          <p className="text-muted-foreground">Modern component'lerin demo sayfası</p>
        </div>
        <ThemeToggle className="p-2 rounded-md hover:bg-muted" />
      </div>

      <Tabs defaultValue="components" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="components">Component'ler</TabsTrigger>
          <TabsTrigger value="loading">Loading States</TabsTrigger>
          <TabsTrigger value="empty">Empty States</TabsTrigger>
          <TabsTrigger value="data">Data Table</TabsTrigger>
        </TabsList>

        <TabsContent value="components" className="space-y-6">
          {/* Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>Farklı button varyantları</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">🎨</Button>
              </div>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
              <CardDescription>Durum ve etiketler için</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Form Elements */}
          <Card>
            <CardHeader>
              <CardTitle>Form Elements</CardTitle>
              <CardDescription>Input ve form elementleri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input id="email" placeholder="ornek@email.com" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
                <Label htmlFor="notifications">
                  Bildirimler {notifications ? '(Açık)' : '(Kapalı)'}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
                <Label htmlFor="darkMode">
                  Dark Mode {darkMode ? '(Açık)' : '(Kapalı)'}
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loading" className="space-y-6">
          {/* Loading Spinners */}
          <Card>
            <CardHeader>
              <CardTitle>Loading Spinners</CardTitle>
              <CardDescription>Farklı boyutlarda loading spinner'lar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <LoadingSpinner size="sm" />
                <LoadingSpinner size="default" />
                <LoadingSpinner size="lg" />
                <LoadingSpinner size="xl" />
              </div>
            </CardContent>
          </Card>

          {/* Skeleton Loading */}
          <Card>
            <CardHeader>
              <CardTitle>Skeleton Loading</CardTitle>
              <CardDescription>İçerik yüklenirken gösterilen skeleton'lar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SkeletonText lines={3} />
              <SkeletonCard />
            </CardContent>
          </Card>

          {/* Interactive Loading */}
          <Card>
            <CardHeader>
              <CardTitle>Interactive Loading</CardTitle>
              <CardDescription>Loading state'ini test edin</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleLoadingToggle} disabled={loading}>
                {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                {loading ? 'Yükleniyor...' : 'Loading Test Et'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="empty" className="space-y-6">
          {/* Empty States */}
          <Card>
            <CardHeader>
              <CardTitle>Empty States</CardTitle>
              <CardDescription>Boş durumlar için component'ler</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <EmptyStateList />
              <EmptyStateSearch query="test" />
              <EmptyStateError onRetry={() => console.log('Retry clicked')} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Data Table</CardTitle>
              <CardDescription>Gelişmiş veri tablosu</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={sampleData}
                searchable
                searchPlaceholder="Kullanıcı ara..."
                onSearch={setSearchQuery}
                pagination
                currentPage={currentPage}
                totalPages={3}
                onPageChange={setCurrentPage}
                selectable
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tooltips */}
      <TooltipProvider>
        <Card>
          <CardHeader>
            <CardTitle>Tooltips</CardTitle>
            <CardDescription>Hover ile açılan ipuçları</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <TooltipWrapper content="Bu bir tooltip örneğidir">
                <Button variant="outline">Hover Et</Button>
              </TooltipWrapper>
              <TooltipWrapper content="Başarılı işlem!" variant="success">
                <Button variant="outline">Başarı</Button>
              </TooltipWrapper>
              <TooltipWrapper content="Dikkat!" variant="warning">
                <Button variant="outline">Uyarı</Button>
              </TooltipWrapper>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    </div>
  );
};

export default DesignSystemDemoPage;
