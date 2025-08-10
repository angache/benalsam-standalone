import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast.js';
import { Button } from '@/components/ui/button.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
import { Save, Palette, Globe, MapPin, DollarSign, ListChecks } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { ThemeContext } from '@/contexts/ThemeContext';
import { categoriesConfig } from '@/config/categories.js'; 
import { turkishProvincesAndDistricts } from '@/config/locations';

const NO_SELECTION_VALUE = "none"; // Benzersiz bir değer

const defaultPreferences = {
  default_category: null,
  default_location_province: null,
  default_location_district: null,
  currency: "TRY",
  language: "tr"
};

const PlatformSettings = () => {
  const { currentUser, setCurrentUser } = useAuthStore();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [districts, setDistricts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUser && currentUser.platform_preferences) {
      const currentPrefs = { ...defaultPreferences, ...currentUser.platform_preferences };
      setPreferences(currentPrefs);
      if (currentPrefs.default_location_province) {
        const provinceData = turkishProvincesAndDistricts.find(p => p.name === currentPrefs.default_location_province);
        setDistricts(provinceData?.districts || []);
      }
    } else if (currentUser) {
      setPreferences(defaultPreferences);
    }
    setIsLoading(false);
  }, [currentUser]);

  useEffect(() => {
    if (preferences.default_location_province) {
      const provinceData = turkishProvincesAndDistricts.find(p => p.name === preferences.default_location_province);
      setDistricts(provinceData?.districts || []);
    } else {
      setDistricts([]);
      setPreferences(prev => ({ ...prev, default_location_district: null }));
    }
  }, [preferences.default_location_province]);

  const handleSelectChange = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value === NO_SELECTION_VALUE ? null : value }));
  };

  const handleSaveChanges = async () => {
    if (!currentUser) return;

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({ platform_preferences: preferences })
      .eq('id', currentUser.id)
      .select()
      .single();

    if (error) {
      toast({ title: "Güncelleme Hatası", description: error.message, variant: "destructive" });
    } else if (updatedProfile) {
      setCurrentUser(prev => ({ ...prev, ...updatedProfile }));
      toast({ title: "Platform Tercihleri Güncellendi", description: "Değişiklikler başarıyla kaydedildi." });
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-8">
      <div className="p-6 border border-border rounded-lg glass-effect">
        <h3 className="text-lg font-medium mb-3 flex items-center"><Palette className="w-5 h-5 mr-2 text-primary" /> Tema Seçimi</h3>
        <Select value={theme} onValueChange={toggleTheme}>
          <SelectTrigger className="w-full sm:w-1/2">
            <SelectValue placeholder="Tema seçin" />
          </SelectTrigger>
          <SelectContent className="dropdown-content">
            <SelectItem value="light">Açık Mod</SelectItem>
            <SelectItem value="dark">Karanlık Mod</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="p-6 border border-border rounded-lg glass-effect">
        <h3 className="text-lg font-medium mb-3 flex items-center"><ListChecks className="w-5 h-5 mr-2 text-primary" /> Varsayılan Kategori</h3>
        <Select value={preferences.default_category || NO_SELECTION_VALUE} onValueChange={(value) => handleSelectChange('default_category', value)}>
          <SelectTrigger className="w-full sm:w-1/2">
            <SelectValue placeholder="Varsayılan kategori seçin..." />
          </SelectTrigger>
          <SelectContent className="dropdown-content max-h-60 overflow-y-auto">
            <SelectItem value={NO_SELECTION_VALUE}>Kategori Yok</SelectItem>
            {categoriesConfig.map(cat => (
              <React.Fragment key={cat.name}>
                <SelectItem value={cat.name} className="font-semibold">{cat.name}</SelectItem>
                {cat.subcategories.map(subCat => (
                  <SelectItem key={`${cat.name} > ${subCat.name}`} value={`${cat.name} > ${subCat.name}`} className="pl-8">
                    {subCat.name}
                  </SelectItem>
                ))}
              </React.Fragment>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">Yeni ilan oluştururken bu kategori otomatik seçilir.</p>
      </div>

      <div className="p-6 border border-border rounded-lg glass-effect">
        <h3 className="text-lg font-medium mb-3 flex items-center"><MapPin className="w-5 h-5 mr-2 text-primary" /> Varsayılan Konum</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select value={preferences.default_location_province || NO_SELECTION_VALUE} onValueChange={(value) => handleSelectChange('default_location_province', value)}>
            <SelectTrigger>
              <SelectValue placeholder="İl Seçin" />
            </SelectTrigger>
            <SelectContent className="dropdown-content">
              <SelectItem value={NO_SELECTION_VALUE}>İl Yok</SelectItem>
              {turkishProvincesAndDistricts.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {preferences.default_location_province && districts.length > 0 && (
            <Select value={preferences.default_location_district || NO_SELECTION_VALUE} onValueChange={(value) => handleSelectChange('default_location_district', value)}>
              <SelectTrigger>
                <SelectValue placeholder="İlçe Seçin" />
              </SelectTrigger>
              <SelectContent className="dropdown-content">
                <SelectItem value={NO_SELECTION_VALUE}>İlçe Yok</SelectItem>
                {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Yeni ilan oluştururken bu konum otomatik seçilir.</p>
      </div>
      
      <div className="p-6 border border-border rounded-lg glass-effect">
        <h3 className="text-lg font-medium mb-3 flex items-center"><DollarSign className="w-5 h-5 mr-2 text-primary" /> Para Birimi</h3>
        <Select value={preferences.currency} onValueChange={(value) => handleSelectChange('currency', value)}>
          <SelectTrigger className="w-full sm:w-1/2">
            <SelectValue placeholder="Para birimi seçin" />
          </SelectTrigger>
          <SelectContent className="dropdown-content">
            <SelectItem value="TRY">Türk Lirası (₺)</SelectItem>
            <SelectItem value="USD">ABD Doları ($)</SelectItem>
            <SelectItem value="EUR">Euro (€)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="p-6 border border-border rounded-lg glass-effect">
        <h3 className="text-lg font-medium mb-3 flex items-center"><Globe className="w-5 h-5 mr-2 text-primary" /> Dil</h3>
        <Select value={preferences.language} onValueChange={(value) => handleSelectChange('language', value)}>
          <SelectTrigger className="w-full sm:w-1/2">
            <SelectValue placeholder="Dil seçin" />
          </SelectTrigger>
          <SelectContent className="dropdown-content">
            <SelectItem value="tr">Türkçe</SelectItem>
            <SelectItem value="en" disabled>English (Yakında)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end mt-8 pt-6 border-t border-border/50">
        <Button onClick={handleSaveChanges} className="btn-primary">
          <Save className="w-4 h-4 mr-2" /> Değişiklikleri Kaydet
        </Button>
      </div>
    </div>
  );
};

export default PlatformSettings;