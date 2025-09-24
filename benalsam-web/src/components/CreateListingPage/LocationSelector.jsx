import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { turkishProvincesAndDistricts } from '@/config/locations';

const LocationSelector = ({ 
  selectedProvince, onProvinceChange, 
  selectedDistrict, onDistrictChange, 
  neighborhood, onNeighborhoodChange,
  onLocationDetect,
  onMapLocationSelect,
  errors, 
  disabled 
}) => {
  const [districts, setDistricts] = useState([]);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (selectedProvince) {
      const provinceData = turkishProvincesAndDistricts.find(p => p.name === selectedProvince);
      setDistricts(provinceData?.districts || []);
      if (!provinceData?.districts?.includes(selectedDistrict)) {
        onDistrictChange('');
      }
    } else {
      setDistricts([]);
      onDistrictChange('');
    }
  }, [selectedProvince, selectedDistrict, onDistrictChange]);

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      toast({ title: "Hata", description: "Tarayıcınız konum servisini desteklemiyor.", variant: "destructive" });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
          if (!response.ok) throw new Error('Konum bilgisi alınamadı.');
          const data = await response.json();
          
          const address = data.address;
          const province = address.province;
          const district = address.district || address.town || address.county;
          const detectedNeighborhood = address.neighbourhood || address.suburb || address.quarter || '';

          onLocationDetect({
            latitude,
            longitude,
            province,
            district,
            neighborhood: detectedNeighborhood
          });
          toast({ title: "Başarılı", description: "Konumunuz başarıyla bulundu." });
        } catch (error) {
          toast({ title: "Hata", description: "Konum bilgisi işlenirken bir hata oluştu.", variant: "destructive" });
          onLocationDetect({ latitude, longitude, province: '', district: '', neighborhood: '' });
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        let message = "Konum alınırken bir hata oluştu.";
        if (error.code === 1) message = "Konum izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.";
        toast({ title: "Hata", description: message, variant: "destructive" });
        setIsLocating(false);
      }
    );
  };

  return (
    <div className="space-y-3">
      <Button type="button" onClick={onMapLocationSelect} disabled={disabled} className="w-full btn-secondary">
        <MapPin className="mr-2 h-4 w-4" />
        Haritadan Konumumu Bul
      </Button>
      <Select value={selectedProvince} onValueChange={onProvinceChange} disabled={disabled}>
        <SelectTrigger className={`w-full bg-input border-border text-foreground ${errors?.location && !selectedProvince ? 'border-destructive' : ''}`}>
          <SelectValue placeholder="İl Seçin *" />
        </SelectTrigger>
        <SelectContent className="dropdown-content">
          {turkishProvincesAndDistricts.map(province => <SelectItem key={province.name} value={province.name}>{province.name}</SelectItem>)}
        </SelectContent>
      </Select>
      {selectedProvince && districts.length > 0 && (
        <Select value={selectedDistrict} onValueChange={onDistrictChange} disabled={disabled}>
          <SelectTrigger className={`w-full bg-input border-border text-foreground ${errors?.location && !selectedDistrict ? 'border-destructive' : ''}`}>
            <SelectValue placeholder="İlçe Seçin *" />
          </SelectTrigger>
          <SelectContent className="dropdown-content">
            {districts.map(district => <SelectItem key={district} value={district}>{district}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      <Input
        type="text"
        value={neighborhood}
        onChange={(e) => onNeighborhoodChange(e.target.value)}
        placeholder="Mahalle / Semt (İsteğe bağlı)"
        disabled={disabled}
        className="w-full bg-input border-border text-foreground placeholder-muted-foreground"
      />
      {errors?.location && <p className="text-destructive text-xs mt-1">{errors.location}</p>}
    </div>
  );
};

export default LocationSelector;