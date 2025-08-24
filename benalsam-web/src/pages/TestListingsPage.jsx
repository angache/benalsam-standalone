import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Image, Users, Database, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const TestListingsPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [listingsCount, setListingsCount] = useState(5);
  const [includeImages, setIncludeImages] = useState(true);
  const [stats, setStats] = useState(null);

  const createTestListings = async () => {
    setIsLoading(true);
    setStats(null);

    try {
      console.log('🚀 Test ilanları oluşturuluyor...');
      console.log('📊 Ayarlar:', { count: listingsCount, includeImages });

             const response = await fetch(`${import.meta.env.VITE_API_URL}/health/test-listings/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          count: listingsCount,
          includeImages
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('✅ Backend response:', result);

      setStats(result.stats);
      
      toast({
        title: "Başarılı!",
        description: `${result.count} test ilanı oluşturuldu`,
        variant: "default"
      });

    } catch (error) {
      console.error('❌ Test ilanları oluşturulurken hata:', error);
      
      toast({
        title: "Hata",
        description: `Test ilanları oluşturulamadı: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test İlanları Oluştur</h1>
        <p className="text-muted-foreground">
          Backend üzerinden test ilanları oluşturun. Tüm işlem backend'de yapılır.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Ayarlar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Ayarlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* İlan Sayısı */}
            <div className="space-y-2">
              <label className="text-sm font-medium">İlan Sayısı: {listingsCount}</label>
              <Slider
                value={[listingsCount]}
                onValueChange={(value) => setListingsCount(value[0])}
                max={50}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>25</span>
                <span>50</span>
              </div>
            </div>

            {/* Fotoğraf Ekleme */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeImages"
                checked={includeImages}
                onChange={(e) => setIncludeImages(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="includeImages" className="text-sm font-medium flex items-center gap-2">
                <Image className="h-4 w-4" />
                Fotoğraf Ekle
              </label>
            </div>

            {/* Oluştur Butonu */}
            <Button
              onClick={createTestListings}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Test İlanı Oluştur
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* İstatistikler */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              İstatistikler
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{stats.users}</div>
                    <div className="text-sm text-muted-foreground">Kullanıcı</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{stats.categories}</div>
                    <div className="text-sm text-muted-foreground">Kategori</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.generated}</div>
                    <div className="text-sm text-muted-foreground">Oluşturulan</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.inserted}</div>
                    <div className="text-sm text-muted-foreground">Eklenen</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Henüz test ilanı oluşturulmadı</p>
                <p className="text-sm">Ayarları yapıp "Test İlanı Oluştur" butonuna tıklayın</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Kullanım Talimatları */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Nasıl Kullanılır?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Badge variant="outline">1</Badge>
            <span>İlan sayısını ayarlayın (1-50 arası)</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline">2</Badge>
            <span>Fotoğraf ekleme seçeneğini belirleyin</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline">3</Badge>
            <span>"Test İlanı Oluştur" butonuna tıklayın</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline">4</Badge>
            <span>Backend otomatik olarak kullanıcı, kategori ve ilan verilerini oluşturacak</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline">5</Badge>
            <span>İstatistikleri kontrol edin ve ana sayfada ilanları görüntüleyin</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestListingsPage;
