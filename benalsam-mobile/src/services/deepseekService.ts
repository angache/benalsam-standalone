interface AIListingRequest {
  userDescription: string;
  category?: string;
  price?: number;
}

interface AIListingResponse {
  title: string;
  description: string;
  category: string;
  suggestedPrice: number;
  condition: string[];
  features: string[];
  tags: string[];
}

const DEEPSEEK_API_KEY = process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export const generateListingWithDeepSeek = async (userDescription: string): Promise<AIListingResponse> => {
  console.log('🔍 DeepSeek API Key check:', DEEPSEEK_API_KEY ? 'Present' : 'Missing');
  console.log('🔑 API Key (first 10 chars):', DEEPSEEK_API_KEY ? DEEPSEEK_API_KEY.substring(0, 10) + '...' : 'None');
  
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key is not configured');
  }

  console.log('🚀 Starting DeepSeek API call...');
  console.log('📝 User input:', userDescription);
  console.log('🌐 API URL:', DEEPSEEK_API_URL);

  const prompt = `
Türkiye'de ikinci el eşya alımı uzmanı. Kullanıcı ihtiyacına göre alım ilanı oluştur.

Kurallar:
- Başlık 60 karakter
- Açıklama 100-150 kelime (kısa ve öz)
- Türkçe, emoji yok
- Gerçekçi fiyat
- SEO dostu
- KATEGORİ ALANI ZORUNLU - Ürünün hangi kategoride olduğunu belirt
- DURUM ALANI ZORUNLU - Aşağıdaki seçeneklerden birini kullan: "Sıfır", "Az Kullanılmış", "İkinci El", "Yenilenmiş", "Hasarlı", "Parça"
- SADECE JSON format

HALÜSİNASYON ENGELLEME KURALLARI:
- Kullanıcının belirtmediği şehir, ilçe, mahalle gibi lokasyon bilgilerini EKLEME
- Kullanıcının belirtmediği marka, model, renk gibi özel detayları EKLEME
- Kullanıcının belirtmediği fiyat aralığı, bütçe bilgisi EKLEME
- Kullanıcının belirtmediği teslimat yöntemi, buluşma noktası EKLEME
- Sadece kullanıcının açıkça belirttiği bilgileri kullan
- Eksik bilgileri varsayma veya tahmin etme

İhtiyaç: ${userDescription}

JSON format (TÜM ALANLAR ZORUNLU):
{
  "title": "Başlık",
  "description": "Açıklama",
  "category": "Kategori (Elektronik, Araç & Vasıta, Ev & Yaşam, Moda, vb.)",
  "suggestedPrice": 1000,
  "condition": "Durum (Sıfır/Az Kullanılmış/İkinci El/Yenilenmiş/Hasarlı/Parça)",
  "features": ["özellik1", "özellik2"],
  "tags": ["etiket1", "etiket2"]
}

ÖNEMLİ: 
- category alanı boş bırakılmamalı, mutlaka bir kategori belirtilmeli
- condition alanı yukarıdaki 6 seçenekten biri olmalı
- HALÜSİNASYON YAPMA - Sadece kullanıcının verdiği bilgileri kullan
`;

  console.log('📋 Prompt:', prompt);

  try {
    const requestBody = {
      model: 'deepseek-chat', // Ücretli model - daha güvenilir
      messages: [
        {
          role: 'system',
          content: 'Sen Türkiye\'de ikinci el eşya satışı konusunda uzman bir pazarlama asistanısın. Sadece JSON formatında yanıt ver.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 600
    };

    console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
    console.log('📤 Request headers:', {
      'Authorization': `Bearer ${DEEPSEEK_API_KEY.substring(0, 10)}...`,
      'Content-Type': 'application/json'
    });

    const startTime = Date.now();
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    const endTime = Date.now();

    console.log('⏱️ Request duration:', endTime - startTime, 'ms');
    console.log('📥 Response status:', response.status);
    console.log('📥 Response status text:', response.statusText);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      console.error('❌ Full error details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      
      // Bakiye yetersizse veya 402 hatası alırsak mock servise geç
      if (response.status === 402 || errorText.includes('Insufficient Balance')) {
        console.log('💰 Insufficient balance detected, switching to mock service');
        throw new Error('INSUFFICIENT_BALANCE');
      }
      
      throw new Error(`DeepSeek API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ API Response data:', JSON.stringify(data, null, 2));
    
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error('❌ No content in response:', data);
      throw new Error('No response content from DeepSeek');
    }

    console.log('📄 Raw content:', content);
    console.log('📄 Content length:', content.length);

    // JSON parse etmeye çalış
    try {
      const result = JSON.parse(content);
      console.log('✅ Parsed JSON:', JSON.stringify(result, null, 2));
      
      // Validation
      if (!result.title || !result.description) {
        console.error('❌ Invalid response format - missing required fields:', result);
        throw new Error('Invalid response format');
      }

      const finalResult = {
        title: result.title,
        description: result.description,
        category: result.category || 'Diğer',
        suggestedPrice: result.suggestedPrice || 0,
        condition: result.condition || 'İkinci El',
        features: result.features || [],
        tags: result.tags || []
      };

      console.log('🎉 Final result:', JSON.stringify(finalResult, null, 2));
      return finalResult;
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('❌ Content that failed to parse:', content);
      
      // Code block'ları temizle ve tekrar dene
      let cleanContent = content;
      if (content.includes('```json')) {
        cleanContent = content.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (content.includes('```')) {
        cleanContent = content.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      try {
        const result = JSON.parse(cleanContent);
        console.log('✅ Successfully parsed JSON from cleaned content');
        
        const finalResult = {
          title: result.title,
          description: result.description,
          category: result.category || 'Diğer',
          suggestedPrice: result.suggestedPrice || 0,
          condition: result.condition || 'İkinci El',
          features: result.features || [],
          tags: result.tags || []
        };

        console.log('🎉 Final result from cleaned content:', JSON.stringify(finalResult, null, 2));
        return finalResult;
      } catch (secondParseError) {
        console.error('❌ Second JSON Parse Error:', secondParseError);
        throw new Error('AI response could not be parsed');
      }
    }

  } catch (error) {
    console.error('❌ DeepSeek API Error:', error);
    console.error('❌ Error stack:', (error as Error).stack);
    throw new Error('İlan oluşturulamadı. Lütfen tekrar deneyin.');
  }
};

// Fallback function for when AI fails
export const generateFallbackListing = (userDescription: string): AIListingResponse => {
  return {
    title: `${userDescription} Arıyorum`,
    description: `Bu ürünü almak istiyorum. ${userDescription}. Bütçem uygun, temiz ve sağlam olması önemli.`,
    category: 'Diğer',
    suggestedPrice: 0,
    condition: 'İkinci El',
    features: [],
    tags: []
  };
};

// Mock service for testing without API key
export const generateMockListing = (userDescription: string): AIListingResponse => {
  console.log('🤖 Using mock service for:', userDescription);
  
  // Basit keyword matching
  const isPhone = userDescription.toLowerCase().includes('iphone') || 
                  userDescription.toLowerCase().includes('samsung') ||
                  userDescription.toLowerCase().includes('telefon');
  
  const isComputer = userDescription.toLowerCase().includes('macbook') ||
                     userDescription.toLowerCase().includes('laptop') ||
                     userDescription.toLowerCase().includes('bilgisayar');
  
  const isCar = userDescription.toLowerCase().includes('araba') ||
                userDescription.toLowerCase().includes('otomobil') ||
                userDescription.toLowerCase().includes('bmw') ||
                userDescription.toLowerCase().includes('mercedes');
  
  let category = 'Diğer';
  let suggestedPrice = 1000;
  
  if (isPhone) {
    category = 'Elektronik > Telefon > Akıllı Telefon';
    suggestedPrice = 15000;
  } else if (isComputer) {
    category = 'Elektronik > Bilgisayar > Laptop';
    suggestedPrice = 25000;
  } else if (isCar) {
    category = 'Vasıta > Otomobil';
    suggestedPrice = 500000;
  }
  
  return {
    title: `${userDescription.split(' ').slice(0, 3).join(' ')} Arıyorum`,
    description: `Bu ürünü almak istiyorum. ${userDescription}. Bütçem uygun, temiz ve sağlam olması önemli. Ürün durumu iyi, fiyatta pazarlık payı vardır.`,
    category: category,
    suggestedPrice: suggestedPrice,
    condition: 'İkinci El',
    features: ['Temiz', 'Sağlam', 'Orijinal'],
    tags: ['alım', 'arıyorum', 'uygun fiyat', 'temiz']
  };
};

// Safe wrapper function
export const safeGenerateListing = async (userDescription: string): Promise<AIListingResponse> => {
  try {
    // API key varsa gerçek servisi kullan
    if (DEEPSEEK_API_KEY) {
      return await generateListingWithDeepSeek(userDescription);
    } else {
      // API key yoksa mock servisi kullan
      console.log('⚠️ No API key found, using mock service');
      return generateMockListing(userDescription);
    }
  } catch (error) {
    console.error('❌ AI generation failed, using fallback:', error);
    
    // Bakiye yetersizse mock servise geç
    if (error instanceof Error && error.message === 'INSUFFICIENT_BALANCE') {
      console.log('💰 Switching to mock service due to insufficient balance');
      return generateMockListing(userDescription);
    }
    
    return generateFallbackListing(userDescription);
  }
}; 