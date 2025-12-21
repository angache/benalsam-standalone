/**
 * Description Templates
 * Category-specific templates for generating descriptions
 */

export const templates = {
  /**
   * Get description template for category
   */
  getDescriptionTemplate(category: string): string | null {
    const categoryLower = category.toLowerCase();
    
    // Find matching template - check for specific keywords first
    if (categoryLower.includes('daire') || categoryLower.includes('satılık')) {
      return categoryTemplates['emlak'] || defaultTemplate;
    }
    
    // Find matching template
    for (const [key, template] of Object.entries(categoryTemplates)) {
      if (categoryLower.includes(key.toLowerCase())) {
        return template;
      }
    }

    return defaultTemplate;
  }
};

const defaultTemplate = `
Merhaba, {category} arıyorum.

{brand ? {brand} marka tercih ediyorum. : }
{model ? Özellikle {model} modelini arıyorum. : }

{condition ? Ürünün {condition} durumda olmasını istiyorum. : }

{features ? Aradığım özellikler:\n{features} : }

{location ? Konum olarak {location} bölgesini tercih ediyorum. : }

Uygun fiyatlı ve kaliteli bir ürün arıyorum. Detaylı bilgi ve tekliflerinizi bekliyorum.
`;

const categoryTemplates: Record<string, string> = {
  // Automotive (WANTED format)
  'otomotiv': `
Merhaba, {brand ? {brand} : Araç} {model ? {model} : } arıyorum.

{year ? {year} model veya daha yeni bir araç tercih ediyorum. : }

{km ? Maksimum {km} km'de olmasını istiyorum. : }
{fuelType ? Yakıt tipi olarak {fuelType} tercih ediyorum. : }
{transmission ? {transmission} vites olmasını istiyorum. : }
{color ? Renk olarak {color} tercih ediyorum. : }
{engineSize ? Motor hacmi {engineSize} civarında olmalı. : }

{hasSunroof ? ✅ Panoramik cam tavanlı olmasını tercih ediyorum : }
{hasNavigation ? ✅ Navigasyon sistemi olmasını istiyorum : }
{hasParkingSensors ? ✅ Park sensörlü olmasını tercih ediyorum : }
{hasBluetooth ? ✅ Bluetooth bağlantısı olmasını istiyorum : }
{hasLeatherSeats ? ✅ Deri döşemeli olmasını tercih ediyorum : }

{condition ? Aracın {condition} durumda olmasını istiyorum. : }

{warranty ? Garantili olmasını tercih ediyorum. : }
{features ? Aradığım diğer özellikler:\n{features} : }

Uygun fiyatlı ve kaliteli bir araç arıyorum. Detaylı bilgi ve tekliflerinizi bekliyorum.
  `,

  // Electronics - Smartphones (WANTED format)
  'telefon': `
Merhaba, {brand ? {brand} : Akıllı} {model ? {model} : telefon} arıyorum.

{storage ? En az {storage} depolama kapasitesi olan bir model tercih ediyorum. : }
{ram ? {ram} RAM veya üzeri olmasını istiyorum. : }
{color ? Renk olarak {color} tercih ediyorum. : }
{screenSize ? Ekran boyutu {screenSize} civarında olmalı. : }

{condition ? Ürünün {condition} durumda olmasını istiyorum. : }

{hasWarranty ? ✅ Garantili olmasını tercih ediyorum : }
{hasBox ? ✅ Kutusu ve tüm aksesuarları ile birlikte olmasını istiyorum : }
{hasCharger ? ✅ Orijinal şarj aleti dahil olmasını tercih ediyorum : }
{hasEarphones ? ✅ Kulaklık dahil olmasını istiyorum : }

{batteryHealth ? Pil sağlığı en az {batteryHealth}% olmalı. : }
{year ? {year} model veya daha yeni olmasını tercih ediyorum. : }

{features ? Aradığım diğer özellikler:\n{features} : }

Uygun fiyatlı ve kaliteli bir telefon arıyorum. Detaylı bilgi ve tekliflerinizi bekliyorum.
  `,

  // Real Estate (WANTED format)
  'emlak': `
Merhaba, {roomCount ? {roomCount}+1 oda : Daire} arıyorum.

{area ? Yaklaşık {area} m² civarında bir daire tercih ediyorum. : }

{location ? Konum olarak {location} bölgesinde olmasını istiyorum. : }

{floor ? {floor}. kat veya üzeri olmasını tercih ediyorum. : }
{totalFloors ? Toplam {totalFloors} katlı bir binada olmasını istiyorum. : }
{age ? Bina yaşı {age} yıl veya daha yeni olmalı. : }

{hasBalcony ? ✅ Balkonlu olmasını tercih ediyorum : }
{hasElevator ? ✅ Asansörlü olmasını istiyorum : }
{hasParking ? ✅ Otoparkı olmasını tercih ediyorum : }
{hasFurnished ? ✅ Eşyalı olmasını istiyorum : }
{hasSecurity ? ✅ Güvenlikli bir site içinde olmasını tercih ediyorum : }

{condition ? Dairenin {condition} durumda olmasını istiyorum. : }

{features ? Aradığım diğer özellikler:\n{features} : }

Uygun fiyatlı ve güzel bir daire arıyorum. Detaylı bilgi ve tekliflerinizi bekliyorum.
  `,

  // Furniture
  'mobilya': `
Merhaba, {furnitureType ? {furnitureType} : mobilya} arıyorum.

{brand ? {brand} marka tercih ediyorum. : }
{material ? {material} malzemeden olmasını istiyorum. : }
{color ? Renk olarak {color} tercih ediyorum. : }
{dimensions ? Boyutlar {dimensions} civarında olmalı. : }

{condition ? Ürünün {condition} durumda olmasını istiyorum. : }

{features ? Aradığım özellikler:\n{features} : }

Uygun fiyatlı ve kaliteli bir ürün arıyorum. Detaylı bilgi ve tekliflerinizi bekliyorum.
  `,

  // Clothing
  'giyim': `
Merhaba, {clothingType ? {clothingType} : giyim ürünü} arıyorum.

{brand ? {brand} marka tercih ediyorum. : }
{size ? Beden olarak {size} istiyorum. : }
{color ? Renk olarak {color} tercih ediyorum. : }
{material ? {material} kumaştan olmasını istiyorum. : }

{condition ? Ürünün {condition} durumda olmasını tercih ediyorum. : }

{features ? Aradığım özellikler:\n{features} : }

Uygun fiyatlı ve kaliteli bir ürün arıyorum. Detaylı bilgi ve tekliflerinizi bekliyorum.
  `,

  // Musical Instruments
  'gitar': `
Merhaba, {brand ? {brand} : Gitar} {model ? {model} : } arıyorum.

{color ? Renk olarak {color} tercih ediyorum. : }
{condition ? Ürünün {condition} durumda olmasını istiyorum. : }

{features ? Aradığım özellikler:\n{features} : }

Uygun fiyatlı ve kaliteli bir gitar arıyorum. Detaylı bilgi ve tekliflerinizi bekliyorum.
  `,

  // Electronics - General
  'elektronik': `
Merhaba, {brand ? {brand} : Elektronik} {model ? {model} : ürün} arıyorum.

{condition ? Ürünün {condition} durumda olmasını istiyorum. : }

{features ? Aradığım özellikler:\n{features} : }
{hasWarranty ? ✅ Garantili olmasını tercih ediyorum : }
{hasBox ? ✅ Kutusu ve aksesuarları ile birlikte olmasını istiyorum : }

Uygun fiyatlı ve kaliteli bir ürün arıyorum. Detaylı bilgi ve tekliflerinizi bekliyorum.
  `,

  // Services (Hizmetler) - Special template for service categories
  'hizmet': `
Merhaba, {service_type ? {service_type} : {category}} hizmeti arıyorum.

{location ? Konum olarak {location} bölgesinde hizmet vermesini istiyorum. : }

{experience_years ? En az {experience_years} yıl deneyimli olmasını tercih ediyorum. : }
{certification ? ✅ Sertifikalı ve belgeli olmasını istiyorum. : }
{availability ? {availability} : }
{location_type ? {location_type} : }

{references ? ✅ Referansları olmasını tercih ediyorum : }
{insurance ? ✅ Sigortalı olmasını istiyorum : }
{warranty ? ✅ Hizmet garantisi vermesini tercih ediyorum : }

Profesyonel, güvenilir ve kaliteli hizmet bekliyorum. Detaylı bilgi, fiyat teklifi ve referanslarınızı bekliyorum.
  `,
  'hizmetler': `
Merhaba, {service_type ? {service_type} : {category}} hizmeti arıyorum.

{location ? Konum olarak {location} bölgesinde hizmet vermesini istiyorum. : }

{experience_years ? En az {experience_years} yıl deneyimli olmasını tercih ediyorum. : }
{certification ? ✅ Sertifikalı ve belgeli olmasını istiyorum. : }

Profesyonel, güvenilir ve kaliteli hizmet bekliyorum. Detaylı bilgi, fiyat teklifi ve referanslarınızı bekliyorum.
  `,
  'tamir': `
Merhaba, tamir hizmeti arıyorum.

{service_type ? {service_type} konusunda deneyimli bir tamirci tercih ediyorum. : }

{location ? Konum olarak {location} bölgesinde hizmet vermesini istiyorum. : }

{experience_years ? En az {experience_years} yıl deneyimli olmasını tercih ediyorum. : }
{certification ? ✅ Sertifikalı ve belgeli olmasını istiyorum. : }

Profesyonel, güvenilir ve kaliteli tamir hizmeti bekliyorum. Detaylı bilgi, fiyat teklifi ve referanslarınızı bekliyorum.
  `,
  'elektrikçi': `
Merhaba, elektrikçi arıyorum.

{location ? Konum olarak {location} bölgesinde hizmet vermesini istiyorum. : }

{experience_years ? En az {experience_years} yıl deneyimli olmasını tercih ediyorum. : }
{certification ? ✅ Sertifikalı ve belgeli olmasını istiyorum. : }
{insurance ? ✅ Sigortalı olmasını tercih ediyorum : }

Profesyonel, güvenilir ve kaliteli elektrik hizmeti bekliyorum. Detaylı bilgi, fiyat teklifi ve referanslarınızı bekliyorum.
  `,
  'tesisatçı': `
Merhaba, tesisatçı arıyorum.

{location ? Konum olarak {location} bölgesinde hizmet vermesini istiyorum. : }

{experience_years ? En az {experience_years} yıl deneyimli olmasını tercih ediyorum. : }
{certification ? ✅ Sertifikalı ve belgeli olmasını istiyorum. : }

Profesyonel, güvenilir ve kaliteli tesisat hizmeti bekliyorum. Detaylı bilgi, fiyat teklifi ve referanslarınızı bekliyorum.
  `
};

