// Web için basit AI servis yöneticisi
export const generateAISuggestion = async (
  title: string, 
  description: string, 
  budget: number
): Promise<string> => {
  try {
    // Basit bir AI önerisi oluştur
    const suggestions = [
      `Merhaba! ${title} ilanınızı inceledim. ${budget}₺ bütçeniz için uygun bir teklif yapmak istiyorum. Ürününüzün kalitesi ve durumu hakkında daha fazla bilgi alabilir miyim?`,
      `${title} ilanınız çok ilgimi çekti! ${description} açıklamanıza göre, bu ürün tam aradığım özelliklerde. ${budget}₺ bütçeniz için uygun bir teklif hazırladım. Detayları konuşabilir miyiz?`,
      `Bu ${title} ilanınızı gördüğümde çok heyecanlandım! ${description} özellikleri tam ihtiyacım olan şeyler. ${budget}₺ bütçeniz için adil bir teklif yapmak istiyorum. Görüşmek ister misiniz?`,
      `Merhaba! ${title} ilanınızı inceledim ve gerçekten etkileyici. ${description} detaylarına göre, bu ürünün değerini anlıyorum. ${budget}₺ bütçeniz için uygun bir teklif hazırladım. Detayları konuşabilir miyiz?`
    ];
    
    // Rastgele bir öneri seç
    const randomIndex = Math.floor(Math.random() * suggestions.length);
    return suggestions[randomIndex];
  } catch (error) {
    console.error('AI suggestion generation error:', error);
    return 'Merhaba! İlanınızı inceledim ve ilgimi çekti. Detayları konuşmak ister misiniz?';
  }
}; 