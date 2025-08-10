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

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export const generateListingWithOpenAI = async (userDescription: string): Promise<AIListingResponse> => {
  console.log('🔍 OpenAI API Key check:', OPENAI_API_KEY ? 'Present' : 'Missing');
  console.log('🔑 API Key (first 10 chars):', OPENAI_API_KEY ? OPENAI_API_KEY.substring(0, 10) + '...' : 'None');
  
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  console.log('🚀 Starting OpenAI API call...');
  console.log('📝 User input:', userDescription);
  console.log('🌐 API URL:', OPENAI_API_URL);

  const prompt = `
Türkiye'de ikinci el eşya alımı uzmanı. Kullanıcı ihtiyacına göre alım ilanı oluştur.

Kurallar:
- Başlık 60 karakter
- Açıklama 100-150 kelime (kısa ve öz)
- Türkçe, emoji yok
- Gerçekçi fiyat
- SEO dostu
- KATEGORİ ALANI ZORUNLU - Ürünün hangi kategoride olduğunu belirt
- DURUM ALANI - Aşağıdaki seçeneklerden bir veya birden fazlasını kullanabilir: "Sıfır", "Yeni", "Az Kullanılmış", "İkinci El", "Yenilenmiş", "Hasarlı", "Parça"
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
  "condition": ["Durum1", "Durum2"] (Bir veya birden fazla durum seçin),
  "features": ["özellik1", "özellik2"],
  "tags": ["etiket1", "etiket2"]
}

ÖNEMLİ: 
- category alanı boş bırakılmamalı, mutlaka bir kategori belirtilmeli
- condition alanı yukarıdaki 7 seçenekten bir veya birden fazlasını içerebilir
- Kullanıcı ihtiyacına göre en uygun durum(lar)ı seçin
- HALÜSİNASYON YAPMA - Sadece kullanıcının verdiği bilgileri kullan
`;

  console.log('📋 Prompt:', prompt);

  try {
    const requestBody = {
      model: 'gpt-4o-mini', // En uygun fiyat/performans oranı
      messages: [
        {
          role: 'system',
          content: 'Sen Türkiye\'de ikinci el eşya alımı konusunda uzman bir pazarlama asistanısın. Sadece JSON formatında yanıt ver.'
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
      'Authorization': `Bearer ${OPENAI_API_KEY.substring(0, 10)}...`,
      'Content-Type': 'application/json'
    });

    const startTime = Date.now();
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
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
      
      // Quota exceeded veya rate limit hatası alırsak mock servise geç
      if (response.status === 429 || errorText.includes('quota') || errorText.includes('rate limit') || errorText.includes('insufficient_quota')) {
        console.log('💰 Quota exceeded detected, switching to mock service');
        throw new Error('QUOTA_EXCEEDED');
      }
      
      throw new Error(`OpenAI API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ API Response data:', JSON.stringify(data, null, 2));
    
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('❌ No content in response:', data);
      throw new Error('No response content from OpenAI');
    }

    console.log('📄 Raw content:', content);
    console.log('📄 Content length:', content.length);

    // Code block'ları temizle (```json ... ```)
    let cleanContent = content;
    if (content.includes('```json')) {
      cleanContent = content.replace(/```json\s*/, '').replace(/```\s*$/, '');
    } else if (content.includes('```')) {
      cleanContent = content.replace(/```\s*/, '').replace(/```\s*$/, '');
    }
    
    console.log('🧹 Cleaned content:', cleanContent);

    // JSON parse etmeye çalış
    try {
      const result = JSON.parse(cleanContent);
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
        condition: Array.isArray(result.condition) ? result.condition : [result.condition || 'İkinci El'],
        features: result.features || [],
        tags: result.tags || []
      };

      console.log('🎉 Final result:', JSON.stringify(finalResult, null, 2));
      return finalResult;
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('❌ Content that failed to parse:', cleanContent);
      
      // JSON parse başarısız olursa, içerikten manuel olarak veri çıkarmaya çalış
      console.log('🔄 Attempting to extract data from non-JSON response...');
      
      try {
        const extractedData = extractDataFromText(content, userDescription);
        console.log('✅ Extracted data:', JSON.stringify(extractedData, null, 2));
        return extractedData;
      } catch (extractError) {
        console.error('❌ Data extraction failed:', extractError);
        throw new Error('AI response could not be parsed');
      }
    }

  } catch (error) {
    console.error('❌ OpenAI API Error:', error);
    console.error('❌ Error stack:', (error as Error).stack);
    throw new Error('İlan oluşturulamadı. Lütfen tekrar deneyin.');
  }
};

// Extract data from non-JSON text response
const extractDataFromText = (content: string, userDescription: string): AIListingResponse => {
  console.log('🔍 Extracting data from text:', content);
  
  // JSON parse başarısız olursa regex ile çıkarma
  const titleMatch = content.match(/["']?title["']?\s*:\s*["']([^"']+)["']/i) ||
                    content.match(/başlık[:\s]*([^\n\r]+)/i) ||
                    content.match(/title[:\s]*([^\n\r]+)/i);
  
  const descriptionMatch = content.match(/["']?description["']?\s*:\s*["']([^"']+)["']/i) ||
                          content.match(/açıklama[:\s]*([^\n\r]+)/i) ||
                          content.match(/description[:\s]*([^\n\r]+)/i);
  
  const categoryMatch = content.match(/["']?category["']?\s*:\s*["']([^"']+)["']/i) ||
                       content.match(/kategori[:\s]*([^\n\r]+)/i) ||
                       content.match(/category[:\s]*([^\n\r]+)/i);
  
  const priceMatch = content.match(/["']?suggestedPrice["']?\s*:\s*(\d+)/i) ||
                    content.match(/fiyat[:\s]*(\d+)/i) ||
                    content.match(/price[:\s]*(\d+)/i) ||
                    content.match(/bütçe[:\s]*(\d+)/i);
  
  const conditionMatch = content.match(/["']?condition["']?\s*:\s*["']([^"']+)["']/i) ||
                        content.match(/durum[:\s]*([^\n\r]+)/i) ||
                        content.match(/condition[:\s]*([^\n\r]+)/i);
  
  // Features ve tags için array extraction
  const featuresMatch = content.match(/["']?features["']?\s*:\s*\[([^\]]+)\]/i) ||
                       content.match(/özellikler[:\s]*\[([^\]]+)\]/i);
  
  const tagsMatch = content.match(/["']?tags["']?\s*:\s*\[([^\]]+)\]/i) ||
                   content.match(/etiketler[:\s]*\[([^\]]+)\]/i);
  
  // Extracted data
  const title = titleMatch?.[1]?.trim() || `${userDescription.split(' ').slice(0, 3).join(' ')} Arıyorum`;
  const description = descriptionMatch?.[1]?.trim() || `Bu ürünü almak istiyorum. ${userDescription}. Bütçem uygun, temiz ve sağlam olması önemli.`;
  const category = categoryMatch?.[1]?.trim() || 'Diğer';
  const suggestedPrice = priceMatch?.[1] ? parseInt(priceMatch[1]) : 1000;
  const condition = conditionMatch?.[1]?.trim() || 'İkinci El';
  
  // Features ve tags parsing
  const features = featuresMatch?.[1] 
    ? featuresMatch[1].split(',').map(f => f.trim().replace(/["']/g, ''))
    : ['Temiz', 'Sağlam', 'Orijinal'];
  
  const tags = tagsMatch?.[1]
    ? tagsMatch[1].split(',').map(t => t.trim().replace(/["']/g, ''))
    : ['alım', 'arıyorum', 'uygun fiyat'];
  
  const result = {
    title,
    description,
    category,
    suggestedPrice,
    condition: Array.isArray(condition) ? condition : [condition],
    features,
    tags
  };
  
  console.log('✅ Extracted result:', result);
  return result;
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
    if (OPENAI_API_KEY) {
      return await generateListingWithOpenAI(userDescription);
    } else {
      // API key yoksa mock servisi kullan
      console.log('⚠️ No API key found, using mock service');
      return generateMockListing(userDescription);
    }
  } catch (error) {
    console.error('❌ AI generation failed, using fallback:', error);
    
    // Quota exceeded ise mock servise geç
    if (error instanceof Error && error.message === 'QUOTA_EXCEEDED') {
      console.log('💰 Switching to mock service due to quota exceeded');
      return generateMockListing(userDescription);
    }
    
    return generateFallbackListing(userDescription);
  }
}; 