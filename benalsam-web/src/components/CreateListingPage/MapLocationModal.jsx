import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MapLocationModal = ({ isOpen, onClose, onLocationSelect, initialPosition = [39.9334, 32.8597] }) => {
  const [selectedPosition, setSelectedPosition] = useState(initialPosition);
  const [isLoading, setIsLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Initialize Yandex Maps
  useEffect(() => {
    if (isOpen && !mapLoaded && window.ymaps) {
      console.log('🗺️ Initializing Yandex Maps...');
      
      window.ymaps.ready(() => {
        if (mapRef.current && !mapInstanceRef.current) {
          // Create map instance
          mapInstanceRef.current = new window.ymaps.Map(mapRef.current, {
            center: [initialPosition[0], initialPosition[1]], // [lat, lng]
            zoom: 13,
            controls: ['zoomControl', 'fullscreenControl']
          });

          // Add click event listener
          mapInstanceRef.current.events.add('click', (event) => {
            const coords = event.get('coords');
            const [lat, lng] = coords;
            console.log('📍 Map clicked:', { lat, lng });
            
            // Update selected position
            setSelectedPosition([lat, lng]);
            
            // Immediately update marker
            if (mapInstanceRef.current.updateMarker) {
              mapInstanceRef.current.updateMarker([lat, lng]);
            }
          });

          // Add initial marker
          const marker = new window.ymaps.Placemark([initialPosition[0], initialPosition[1]], {
            balloonContent: 'Seçilen konum'
          }, {
            preset: 'islands#redDotIcon',
            draggable: true
          });

          mapInstanceRef.current.geoObjects.add(marker);

          // Store marker reference for updates
          let currentMarker = marker;
          mapInstanceRef.current.currentMarker = currentMarker;

          // Update marker position when selectedPosition changes
          const updateMarker = (newPosition) => {
            if (mapInstanceRef.current && newPosition) {
              console.log('🔄 Updating marker to:', newPosition);
              
              // Remove old marker
              if (mapInstanceRef.current.currentMarker) {
                mapInstanceRef.current.geoObjects.remove(mapInstanceRef.current.currentMarker);
              }
              
              // Create new marker
              const newMarker = new window.ymaps.Placemark([newPosition[0], newPosition[1]], {
                balloonContent: 'Seçilen konum'
              }, {
                preset: 'islands#redDotIcon',
                draggable: true
              });
              
              // Add new marker
              mapInstanceRef.current.geoObjects.add(newMarker);
              mapInstanceRef.current.currentMarker = newMarker;
              
              // Center map on new position
              mapInstanceRef.current.setCenter([newPosition[0], newPosition[1]]);
              
              console.log('✅ Marker updated successfully');
            }
          };

          // Store update function for later use
          mapInstanceRef.current.updateMarker = updateMarker;

          setMapLoaded(true);
          console.log('✅ Yandex Maps initialized');
        }
      });
    }
  }, [isOpen, mapLoaded, initialPosition]);

  // Update marker when selectedPosition changes
  useEffect(() => {
    if (mapInstanceRef.current && mapInstanceRef.current.updateMarker && selectedPosition && mapLoaded) {
      console.log('📍 selectedPosition changed, updating marker:', selectedPosition);
      mapInstanceRef.current.updateMarker(selectedPosition);
    }
  }, [selectedPosition, mapLoaded]);

  // Cleanup map when modal closes
  useEffect(() => {
    if (!isOpen && mapInstanceRef.current) {
      mapInstanceRef.current.destroy();
      mapInstanceRef.current = null;
      setMapLoaded(false);
    }
  }, [isOpen]);

  // Handle location selection
  const handleSelectLocation = useCallback(async () => {
    if (!selectedPosition) return;

    setIsLoading(true);
    try {
        // Enhanced reverse geocoding with multiple providers
        const requests = [
          // Yandex Geocoding API (Türkiye için en iyi)
          {
            name: 'yandex',
            url: `https://geocode-maps.yandex.ru/1.x/?apikey=&geocode=${selectedPosition[1]},${selectedPosition[0]}&format=json&lang=tr_TR&results=1&kind=house`
          },
          // Nominatim as fallback
          {
            name: 'nominatim',
            url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedPosition[0]}&lon=${selectedPosition[1]}&addressdetails=1&accept-language=tr&countrycodes=tr`
          }
        ];

        let addressData = null;
        for (const request of requests) {
          try {
            console.log(`🌐 Trying ${request.name} API...`);
            const response = await fetch(request.url);
            if (!response.ok) {
              console.warn(`${request.name} API failed:`, response.status);
              continue;
            }
            
            const data = await response.json();
            console.log(`${request.name} API response:`, data);
            
            if (request.name === 'yandex') {
              // Parse Yandex response
              if (data.response && data.response.GeoObjectCollection && data.response.GeoObjectCollection.featureMember) {
                const feature = data.response.GeoObjectCollection.featureMember[0];
                if (feature && feature.GeoObject) {
                  const geoObject = feature.GeoObject;
                  const address = geoObject.metaDataProperty?.GeocoderMetaData?.Address;
                  
                  if (address) {
                    console.log('🗺️ YANDEX DEBUG:');
                    console.log('📍 Full address:', address.formatted);
                    console.log('🏢 Address components:', address.Components);
                    
                    // Extract Turkish location information from Yandex
                    let province = '';
                    let district = '';
                    let neighborhood = '';
                    
                    if (address.Components) {
                      for (const component of address.Components) {
                        if (component.kind === 'province') {
                          province = component.name;
                        } else if (component.kind === 'area') {
                          district = component.name;
                        } else if (component.kind === 'locality' || component.kind === 'street') {
                          neighborhood = component.name;
                        }
                      }
                    }
                    
                    console.log('🎯 Yandex extracted:', { province, district, neighborhood });
                    
                    addressData = {
                      province: province || '',
                      district: district || '',
                      neighborhood: neighborhood || '',
                      fullAddress: address.formatted || ''
                    };
                    
                    console.log('✅ Yandex success:', addressData);
                    break; // Success, exit loop
                  }
                }
              }
            } else if (request.name === 'nominatim') {
              // Parse Nominatim response (existing code)
              if (data && data.address) {
                const address = data.address;
                
                console.log('🗺️ NOMINATIM DEBUG:');
                console.log('📍 Full address:', data.display_name);
                console.log('🏢 Address components:', address);
                
                // Extract Turkish location information with comprehensive mapping
                const province = address.state || address.province || address.region || address.state_district;
                const district = address.city || address.town || address.municipality || address.county || address.city_district;
                const neighborhood = address.suburb || address.village || address.neighbourhood || address.quarter || address.hamlet;
              
                // Parse full address for additional information
                const fullAddress = data.display_name || '';
                
                // Try to extract province and district from full address if not found
                let extractedProvince = province;
                let extractedDistrict = district;
                
                console.log('🔍 Initial extraction:', { extractedProvince, extractedDistrict });
                
                // Special handling for Turkish addresses where province might be missing
                if (!extractedProvince || extractedProvince.includes('Bölgesi')) {
                  console.log('🔍 Province is missing or is a region, trying to infer from district...');
                  
                  // Known Turkish province-district mappings
                  const provinceDistrictMap = {
                    'Çiğli': 'İzmir',
                    'Karşıyaka': 'İzmir',
                    'Bornova': 'İzmir',
                    'Konak': 'İzmir',
                    'Buca': 'İzmir',
                    'Gaziemir': 'İzmir',
                    'Balçova': 'İzmir',
                    'Narlıdere': 'İzmir',
                    'Güzelbahçe': 'İzmir',
                    'Çankaya': 'Ankara',
                    'Keçiören': 'Ankara',
                    'Mamak': 'Ankara',
                    'Sincan': 'Ankara',
                    'Etimesgut': 'Ankara',
                    'Yenimahalle': 'Ankara',
                    'Pursaklar': 'Ankara',
                    'Gölbaşı': 'Ankara',
                    'Kadıköy': 'İstanbul',
                    'Beşiktaş': 'İstanbul',
                    'Şişli': 'İstanbul',
                    'Beyoğlu': 'İstanbul',
                    'Fatih': 'İstanbul',
                    'Üsküdar': 'İstanbul',
                    'Maltepe': 'İstanbul',
                    'Kartal': 'İstanbul',
                    'Pendik': 'İstanbul',
                    'Tuzla': 'İstanbul',
                    'Sancaktepe': 'İstanbul',
                    'Sultanbeyli': 'İstanbul',
                    'Çekmeköy': 'İstanbul',
                    'Ümraniye': 'İstanbul',
                    'Ataşehir': 'İstanbul',
                    'Bostancı': 'İstanbul',
                    'Kozyatağı': 'İstanbul'
                  };
                  
                  // Try to find province from district
                  if (extractedDistrict && provinceDistrictMap[extractedDistrict]) {
                    extractedProvince = provinceDistrictMap[extractedDistrict];
                    console.log('✅ Province inferred from district:', extractedProvince);
                  } else {
                    // Try to extract from full address using common patterns
                    const addressParts = fullAddress.split(',');
                    for (const part of addressParts) {
                      const trimmedPart = part.trim();
                      if (provinceDistrictMap[trimmedPart]) {
                        extractedProvince = provinceDistrictMap[trimmedPart];
                        console.log('✅ Province found in address parts:', extractedProvince);
                        break;
                      }
                    }
                  }
                }
                
                addressData = {
                  province: extractedProvince || '',
                  district: extractedDistrict || '',
                  neighborhood: neighborhood || '',
                  fullAddress: fullAddress
                };
                
                console.log('✅ Nominatim success:', addressData);
                break; // Success, exit loop
              }
            }
          } catch (error) {
            console.warn(`${request.name} API failed:`, error);
            continue;
          }
        }

        if (addressData) {
          const locationData = {
            latitude: selectedPosition[0].toString(),
            longitude: selectedPosition[1].toString(),
            geolocation: {
              latitude: selectedPosition[0],
              longitude: selectedPosition[1]
            },
            province: addressData.province,
            district: addressData.district,
            neighborhood: addressData.neighborhood,
            fullAddress: addressData.fullAddress
          };

          onLocationSelect(locationData);
          onClose();
        } else {
          alert('Adres bilgisi alınamadı. Lütfen tekrar deneyin.');
        }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      alert('Adres bilgisi alınamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPosition, onLocationSelect, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-background rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Haritadan Konum Seçin</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Map Container */}
          <div className="flex-1 relative">
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-b-lg">
                <div className="text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Harita yükleniyor...</p>
                </div>
              </div>
            )}
            <div
              ref={mapRef}
              style={{ height: '100%', width: '100%' }}
              className="rounded-b-lg"
            />
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <p>Haritada istediğiniz yere tıklayarak konum seçin</p>
                <p className="text-xs mt-1">
                  Koordinat: {selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  İptal
                </Button>
                <Button
                  onClick={handleSelectLocation}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Konumu Seç
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MapLocationModal;
