/**
 * Cache Version Test Component
 * Development'ta cache version sistemini test etmek için
 * 
 * @author Benalsam Team
 * @date 2025-08-27
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { 
  checkCategoriesVersion, 
  getCacheStatus, 
  forceClearCache,
  clearAllCache 
} from '@/services/cacheVersionService';

const CacheVersionTest = () => {
  const [cacheStatus, setCacheStatus] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const loadCacheStatus = () => {
    const status = getCacheStatus();
    setCacheStatus(status);
  };

  useEffect(() => {
    loadCacheStatus();
  }, []);

  const handleVersionCheck = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Manual version check started...');
      const changed = await checkCategoriesVersion();
      
      if (changed) {
        toast({
          title: "Cache Güncellendi",
          description: "Kategori cache'i temizlendi ve yeniden yüklendi.",
          duration: 3000,
        });
      } else {
        toast({
          title: "Cache Güncel",
          description: "Kategori cache'i güncel durumda.",
          duration: 2000,
        });
      }
      
      loadCacheStatus();
    } catch (error) {
      console.error('Version check error:', error);
      toast({
        title: "Hata",
        description: "Version kontrolü sırasında hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceClear = (cacheKey) => {
    forceClearCache(cacheKey);
    loadCacheStatus();
    toast({
      title: "Cache Temizlendi",
      description: `${cacheKey} cache'i zorla temizlendi.`,
      duration: 2000,
    });
  };

  const handleClearAll = () => {
    clearAllCache();
    loadCacheStatus();
    toast({
      title: "Tüm Cache Temizlendi",
      description: "Tüm cache'ler temizlendi.",
      duration: 2000,
    });
  };

  const handleManualIncrement = async () => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';
      const response = await fetch(`${apiUrl}/categories/version/increment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Version Artırıldı",
          description: `Yeni version: ${result.version}`,
          duration: 3000,
        });
        loadCacheStatus();
      } else {
        throw new Error('Version artırma başarısız');
      }
    } catch (error) {
      console.error('Manual increment error:', error);
      toast({
        title: "Hata",
        description: "Version artırma sırasında hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔄 Cache Version Test
          <Badge variant="secondary">Development</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cache Status */}
        <div className="space-y-2">
          <h3 className="font-semibold">Cache Durumu:</h3>
          {Object.entries(cacheStatus).map(([key, status]) => (
            <div key={key} className="flex items-center justify-between p-2 bg-muted rounded">
              <span className="font-mono text-sm">{key}</span>
              <div className="flex items-center gap-2">
                <Badge variant={status.isStale ? "destructive" : "default"}>
                  v{status.version}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {status.lastCheck}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleVersionCheck} 
            disabled={isLoading}
            variant="default"
          >
            {isLoading ? "Kontrol Ediliyor..." : "Version Kontrol Et"}
          </Button>
          
          <Button 
            onClick={handleManualIncrement} 
            disabled={isLoading}
            variant="outline"
          >
            Version Artır (Test)
          </Button>
          
          <Button 
            onClick={() => handleForceClear('categories_version')} 
            variant="destructive"
            size="sm"
          >
            Cache Temizle
          </Button>
          
          <Button 
            onClick={handleClearAll} 
            variant="destructive"
            size="sm"
          >
            Tümünü Temizle
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Test Senaryosu:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>"Version Artır" butonuna tıkla</li>
            <li>"Version Kontrol Et" butonuna tıkla</li>
            <li>Cache'in temizlendiğini ve toast mesajını gör</li>
            <li>Kategorilerin yeniden yüklendiğini kontrol et</li>
          </ol>
          <p className="mt-2 text-xs">
            <strong>Not:</strong> Sistem artık sadece uygulama açıldığında kontrol ediyor. 
            Sayfa yenilendiğinde tekrar kontrol edilir.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CacheVersionTest;
