// Kategori-specific attributes tanımları
export const categoryAttributes = {
  // Elektronik > Telefon > Akıllı Telefon
  'Elektronik > Telefon > Akıllı Telefon': {
    brand: {
      type: 'select',
      label: 'Marka',
      options: [
        { value: 'apple', label: 'Apple' },
        { value: 'samsung', label: 'Samsung' },
        { value: 'huawei', label: 'Huawei' },
        { value: 'xiaomi', label: 'Xiaomi' },
        { value: 'oppo', label: 'Oppo' },
        { value: 'vivo', label: 'Vivo' },
        { value: 'oneplus', label: 'OnePlus' },
        { value: 'google', label: 'Google' },
        { value: 'sony', label: 'Sony' },
        { value: 'lg', label: 'LG' },
        { value: 'other', label: 'Diğer' }
      ]
    },
    model: {
      type: 'text',
      label: 'Model',
      placeholder: 'Örn: iPhone 14 Pro, Galaxy S23'
    },
    storage: {
      type: 'select',
      label: 'Depolama',
      options: [
        { value: '32gb', label: '32 GB' },
        { value: '64gb', label: '64 GB' },
        { value: '128gb', label: '128 GB' },
        { value: '256gb', label: '256 GB' },
        { value: '512gb', label: '512 GB' },
        { value: '1tb', label: '1 TB' }
      ]
    },
    color: {
      type: 'select',
      label: 'Renk',
      options: [
        { value: 'black', label: 'Siyah' },
        { value: 'white', label: 'Beyaz' },
        { value: 'blue', label: 'Mavi' },
        { value: 'red', label: 'Kırmızı' },
        { value: 'green', label: 'Yeşil' },
        { value: 'purple', label: 'Mor' },
        { value: 'gold', label: 'Altın' },
        { value: 'silver', label: 'Gümüş' },
        { value: 'other', label: 'Diğer' }
      ]
    },
    ram: {
      type: 'select',
      label: 'RAM',
      options: [
        { value: '2gb', label: '2 GB' },
        { value: '3gb', label: '3 GB' },
        { value: '4gb', label: '4 GB' },
        { value: '6gb', label: '6 GB' },
        { value: '8gb', label: '8 GB' },
        { value: '12gb', label: '12 GB' },
        { value: '16gb', label: '16 GB' }
      ]
    }
  },

  // Elektronik > Bilgisayar > Dizüstü Bilgisayar
  'Elektronik > Bilgisayar > Dizüstü Bilgisayar': {
    brand: {
      type: 'select',
      label: 'Marka',
      options: [
        { value: 'apple', label: 'Apple' },
        { value: 'asus', label: 'ASUS' },
        { value: 'dell', label: 'Dell' },
        { value: 'hp', label: 'HP' },
        { value: 'lenovo', label: 'Lenovo' },
        { value: 'msi', label: 'MSI' },
        { value: 'acer', label: 'Acer' },
        { value: 'samsung', label: 'Samsung' },
        { value: 'huawei', label: 'Huawei' },
        { value: 'other', label: 'Diğer' }
      ]
    },
    model: {
      type: 'text',
      label: 'Model',
      placeholder: 'Örn: MacBook Pro, ThinkPad X1'
    },
    processor: {
      type: 'select',
      label: 'İşlemci',
      options: [
        { value: 'intel_i3', label: 'Intel Core i3' },
        { value: 'intel_i5', label: 'Intel Core i5' },
        { value: 'intel_i7', label: 'Intel Core i7' },
        { value: 'intel_i9', label: 'Intel Core i9' },
        { value: 'amd_ryzen3', label: 'AMD Ryzen 3' },
        { value: 'amd_ryzen5', label: 'AMD Ryzen 5' },
        { value: 'amd_ryzen7', label: 'AMD Ryzen 7' },
        { value: 'amd_ryzen9', label: 'AMD Ryzen 9' },
        { value: 'apple_m1', label: 'Apple M1' },
        { value: 'apple_m2', label: 'Apple M2' },
        { value: 'apple_m3', label: 'Apple M3' },
        { value: 'other', label: 'Diğer' }
      ]
    },
    ram: {
      type: 'select',
      label: 'RAM',
      options: [
        { value: '4gb', label: '4 GB' },
        { value: '8gb', label: '8 GB' },
        { value: '16gb', label: '16 GB' },
        { value: '32gb', label: '32 GB' },
        { value: '64gb', label: '64 GB' }
      ]
    },
    storage: {
      type: 'select',
      label: 'Depolama',
      options: [
        { value: '128gb', label: '128 GB SSD' },
        { value: '256gb', label: '256 GB SSD' },
        { value: '512gb', label: '512 GB SSD' },
        { value: '1tb', label: '1 TB SSD' },
        { value: '2tb', label: '2 TB SSD' },
        { value: '500gb_hdd', label: '500 GB HDD' },
        { value: '1tb_hdd', label: '1 TB HDD' },
        { value: '2tb_hdd', label: '2 TB HDD' }
      ]
    },
    screenSize: {
      type: 'select',
      label: 'Ekran Boyutu',
      options: [
        { value: '11', label: '11 inç' },
        { value: '13', label: '13 inç' },
        { value: '14', label: '14 inç' },
        { value: '15', label: '15 inç' },
        { value: '16', label: '16 inç' },
        { value: '17', label: '17 inç' }
      ]
    }
  },

  // Araç & Vasıta > Otomobil
  'Araç & Vasıta > Otomobil': {
    brand: {
      type: 'select',
      label: 'Marka',
      options: [
        { value: 'audi', label: 'Audi' },
        { value: 'bmw', label: 'BMW' },
        { value: 'mercedes', label: 'Mercedes-Benz' },
        { value: 'volkswagen', label: 'Volkswagen' },
        { value: 'ford', label: 'Ford' },
        { value: 'opel', label: 'Opel' },
        { value: 'renault', label: 'Renault' },
        { value: 'peugeot', label: 'Peugeot' },
        { value: 'citroen', label: 'Citroën' },
        { value: 'fiat', label: 'Fiat' },
        { value: 'toyota', label: 'Toyota' },
        { value: 'honda', label: 'Honda' },
        { value: 'nissan', label: 'Nissan' },
        { value: 'hyundai', label: 'Hyundai' },
        { value: 'kia', label: 'Kia' },
        { value: 'skoda', label: 'Škoda' },
        { value: 'seat', label: 'SEAT' },
        { value: 'other', label: 'Diğer' }
      ]
    },
    model: {
      type: 'text',
      label: 'Model',
      placeholder: 'Örn: Golf, A3, C-Class'
    },
    year: {
      type: 'select',
      label: 'Model Yılı',
      options: Array.from({ length: 25 }, (_, i) => {
        const year = new Date().getFullYear() - i;
        return { value: year.toString(), label: year.toString() };
      })
    },
    fuelType: {
      type: 'select',
      label: 'Yakıt Türü',
      options: [
        { value: 'gasoline', label: 'Benzin' },
        { value: 'diesel', label: 'Dizel' },
        { value: 'hybrid', label: 'Hibrit' },
        { value: 'electric', label: 'Elektrikli' },
        { value: 'lpg', label: 'LPG' },
        { value: 'cng', label: 'CNG' }
      ]
    },
    transmission: {
      type: 'select',
      label: 'Vites',
      options: [
        { value: 'manual', label: 'Manuel' },
        { value: 'automatic', label: 'Otomatik' },
        { value: 'semi_automatic', label: 'Yarı Otomatik' }
      ]
    },
    engineSize: {
      type: 'select',
      label: 'Motor Hacmi',
      options: [
        { value: '1.0', label: '1.0 L' },
        { value: '1.2', label: '1.2 L' },
        { value: '1.4', label: '1.4 L' },
        { value: '1.6', label: '1.6 L' },
        { value: '1.8', label: '1.8 L' },
        { value: '2.0', label: '2.0 L' },
        { value: '2.5', label: '2.5 L' },
        { value: '3.0', label: '3.0 L' },
        { value: 'other', label: 'Diğer' }
      ]
    },
    mileage: {
      type: 'number',
      label: 'Kilometre',
      placeholder: 'Örn: 50000',
      suffix: 'km'
    }
  },

  // Emlak > Ev & Daire
  'Emlak > Ev & Daire': {
    propertyType: {
      type: 'select',
      label: 'Emlak Türü',
      options: [
        { value: 'apartment', label: 'Daire' },
        { value: 'house', label: 'Ev' },
        { value: 'villa', label: 'Villa' },
        { value: 'penthouse', label: 'Penthouse' },
        { value: 'studio', label: 'Stüdyo' },
        { value: 'loft', label: 'Loft' }
      ]
    },
    roomCount: {
      type: 'select',
      label: 'Oda Sayısı',
      options: [
        { value: '1', label: '1+0' },
        { value: '1+1', label: '1+1' },
        { value: '2+1', label: '2+1' },
        { value: '3+1', label: '3+1' },
        { value: '4+1', label: '4+1' },
        { value: '5+1', label: '5+1' },
        { value: '6+1', label: '6+1' },
        { value: '7+1', label: '7+1' }
      ]
    },
    floor: {
      type: 'select',
      label: 'Kat',
      options: [
        { value: 'basement', label: 'Bodrum' },
        { value: 'ground', label: 'Zemin' },
        { value: '1', label: '1. Kat' },
        { value: '2', label: '2. Kat' },
        { value: '3', label: '3. Kat' },
        { value: '4', label: '4. Kat' },
        { value: '5', label: '5. Kat' },
        { value: '6', label: '6. Kat' },
        { value: '7', label: '7. Kat' },
        { value: '8', label: '8. Kat' },
        { value: '9', label: '9. Kat' },
        { value: '10+', label: '10+ Kat' }
      ]
    },
    buildingAge: {
      type: 'select',
      label: 'Bina Yaşı',
      options: [
        { value: '0-5', label: '0-5 Yıl' },
        { value: '6-10', label: '6-10 Yıl' },
        { value: '11-20', label: '11-20 Yıl' },
        { value: '21-30', label: '21-30 Yıl' },
        { value: '30+', label: '30+ Yıl' }
      ]
    },
    heating: {
      type: 'select',
      label: 'Isıtma',
      options: [
        { value: 'natural_gas', label: 'Doğalgaz' },
        { value: 'coal', label: 'Kömür' },
        { value: 'electric', label: 'Elektrik' },
        { value: 'solar', label: 'Güneş Enerjisi' },
        { value: 'heat_pump', label: 'Isı Pompası' },
        { value: 'other', label: 'Diğer' }
      ]
    }
  }
};

// Kategori path'ini oluşturan helper function
export const getCategoryPath = (mainCategory, subCategory, subSubCategory) => {
  let path = mainCategory;
  if (subCategory) path += ` > ${subCategory}`;
  if (subSubCategory) path += ` > ${subSubCategory}`;
  return path;
};

// Belirli bir kategori path'i için attributes'ları getiren function
export const getAttributesForCategory = (mainCategory, subCategory, subSubCategory) => {
  const path = getCategoryPath(mainCategory, subCategory, subSubCategory);
  return categoryAttributes[path] || {};
};
