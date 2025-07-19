import { supabase } from '../config/supabase';
import subscriptionService from './subscriptionService';

// OpenRouter API konfigürasyonu
const OPENROUTER_API_KEY = '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';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// API bağlantısını test et
const testAPIConnection = async () => {
  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/models`, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return response.ok;
  } catch (error) {
    console.log('API bağlantı testi başarısız:', error);
    return false;
  }
};

export const dreamService = {
  // Rüya kaydet
  async saveDream(dreamData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'Kullanıcı oturumu bulunamadı' };
      }

      const { data, error } = await supabase
        .from('dreams')
        .insert({
          user_id: user.id,
          title: dreamData.title,
          content: dreamData.content,
          category: dreamData.category,
          interpretation: dreamData.interpretation || null,
          interpreted_by: dreamData.interpreted_by || null
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Rüya sil
  async deleteDream(dreamId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'Kullanıcı oturumu bulunamadı' };
      }

      const { error } = await supabase
        .from('dreams')
        .delete()
        .eq('id', dreamId)
        .eq('user_id', user.id); // Güvenlik için kullanıcı kontrolü

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Rüya güncelle
  async updateDream(dreamId, updateData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'Kullanıcı oturumu bulunamadı' };
      }

      const { data, error } = await supabase
        .from('dreams')
        .update(updateData)
        .eq('id', dreamId)
        .eq('user_id', user.id) // Güvenlik için kullanıcı kontrolü
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Kullanıcının rüyalarını getir
  async getUserDreams(limit = 10) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'Kullanıcı oturumu bulunamadı' };
      }

      const { data, error } = await supabase
        .from('dreams')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Rüya kategorilerini getir
  async getDreamCategories() {
    try {
      const { data, error } = await supabase
        .from('dream_categories')
        .select('*')
        .order('name');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Ünlü rüya yorumlayıcıları listesi
  getFamousPeople() {
    return [
      {
        id: 'freud',
        name: 'Sigmund Freud',
        description: 'Psikanaliz kurucusu, rüya yorumlamanın babası',
        specialty: 'Bilinçaltı ve cinsel sembolizm',
        icon: '🧠',
        color: '#8B4513'
      },
      {
        id: 'jung',
        name: 'Carl Gustav Jung',
        description: 'Analitik psikoloji kurucusu',
        specialty: 'Kolektif bilinçdışı ve arketipler',
        icon: '🌟',
        color: '#4169E1'
      },
      {
        id: 'ibn_sirin',
        name: 'İbn Sirin',
        description: 'İslami rüya yorumcusu ve alim',
        specialty: 'Dini ve manevi yorumlar',
        icon: '🕌',
        color: '#228B22'
      },
      {
        id: 'edgar_cayce',
        name: 'Edgar Cayce',
        description: 'Amerikalı mistik ve rüya yorumcusu',
        specialty: 'Mistik ve şifalı rüyalar',
        icon: '🔮',
        color: '#9932CC'
      },
      {
        id: 'patricia_garfield',
        name: 'Patricia Garfield',
        description: 'Modern rüya araştırmacısı',
        specialty: 'Yaratıcı rüya teknikleri',
        icon: '🎨',
        color: '#FF69B4'
      },
      {
        id: 'stephen_laberge',
        name: 'Stephen LaBerge',
        description: 'Lucid rüya uzmanı',
        specialty: 'Bilinçli rüya görme',
        icon: '💫',
        color: '#00CED1'
      },
      {
        id: 'calvin_hall',
        name: 'Calvin Hall',
        description: 'Rüya içerik analizi uzmanı',
        specialty: 'Bilimsel rüya analizi',
        icon: '📊',
        color: '#DC143C'
      },
      {
        id: 'ann_faraday',
        name: 'Ann Faraday',
        description: 'Rüya terapisti ve yazar',
        specialty: 'Terapötik rüya yorumu',
        icon: '🌙',
        color: '#6A5ACD'
      }
    ];
  },

  // Ünlü kişinin perspektifinden rüya yorumla
  async interpretDreamByFamousPerson(dreamText, famousPersonId, category = null, userId = null) {
    try {
      // Premium özellik kontrolü
      if (userId) {
        const featureCheck = await subscriptionService.canUseFeature(userId, 'famous_person_interpretations');
        if (!featureCheck.success) {
          throw new Error('Özellik kontrolü başarısız');
        }
        
        if (!featureCheck.data.canUse) {
          return {
            success: false,
            error: 'premium_required',
            message: 'Ünlü kişi yorumları premium özelliğidir. Lütfen premium abonelik satın alın.'
          };
        }
      }
      
      // Rate limit için başlangıç bekleme
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Önce API bağlantısını test et
      const isAPIAvailable = await testAPIConnection();
      if (!isAPIAvailable) {
        console.log('API kullanılamıyor, fallback yoruma geçiliyor');
        throw new Error('API bağlantısı başarısız');
      }

      const famousPeople = this.getFamousPeople();
      const person = famousPeople.find(p => p.id === famousPersonId);
      
      if (!person) {
        throw new Error('Seçilen ünlü kişi bulunamadı');
      }

      const prompt = `Sen ${person.name}sın. ${person.description} olarak, aşağıdaki rüyayı kendi perspektifin ve uzmanlık alanın olan "${person.specialty}" açısından yorumla:

Rüya: ${dreamText}
${category ? `Kategori: ${category}` : ''}

${person.name} olarak, kendi tarzında ve yaklaşımında şu formatta yanıt ver:
1. ${person.name}'in Bakış Açısı: Bu rüyayı nasıl değerlendirirsin?
2. Uzmanlık Alanından Analiz: "${person.specialty}" perspektifinden ne anlam çıkarırsın?
3. Kişisel Öneriler: ${person.name} olarak ne tavsiye edersin?
4. Özel Mesaj: Bu kişiye özel bir mesajın var mı?

Yanıtını Türkçe ver ve ${person.name}'in karakteristik üslubunu kullan. Samimi ve bilge bir ton benimse.`;

      let response;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          // Rate limit için bekleme
          if (retryCount > 0) {
            console.log(`Rate limit nedeniyle ${5000 * retryCount}ms bekleniyor...`);
            await new Promise(resolve => setTimeout(resolve, 5000 * retryCount));
          }
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 saniye timeout

          response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://dreampack.app',
              'X-Title': 'DreamPack - Ünlü Kişi Rüya Yorumlama'
            },
            body: JSON.stringify({
              model: 'google/gemma-2-9b-it:free',
              messages: [
                {
                  role: 'user',
                  content: prompt
                }
              ],
              max_tokens: 1200,
              temperature: 0.8
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          break; // Başarılı olursa döngüden çık
        } catch (networkError) {
          retryCount++;
          console.log(`Network hatası, deneme ${retryCount}/${maxRetries}:`, networkError.message);
          
          if (retryCount >= maxRetries) {
            throw networkError; // Son deneme de başarısızsa hatayı fırlat
          }
          
          // Retry öncesi daha uzun bekleme (rate limit için)
          await new Promise(resolve => setTimeout(resolve, 5000 * retryCount));
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Hatası:', response.status, errorText);
        throw new Error(`OpenRouter API hatası: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.choices || !result.choices[0] || !result.choices[0].message) {
        throw new Error('API yanıtı beklenmeyen formatta');
      }

      const interpretation = result.choices[0].message.content;

      // Yorumu parse et ve yapılandır
      const structuredInterpretation = {
        interpretation: interpretation,
        interpreter: person,
        confidence: 0.9,
        keywords: this.extractKeywords(interpretation),
        suggestions: this.extractSuggestions(interpretation),
        timestamp: new Date().toISOString(),
        type: 'famous_person'
      };

      // Başarılı yorumlama sonrası kullanım kaydı ekle
      if (userId) {
        await subscriptionService.addUsageRecord(userId, 'famous_person_interpretation', {
          famousPersonId,
          category,
          dreamLength: dreamText.length
        });
      }
      
      // Başarılı yorumlama sonrası kullanım kaydı ekle
      if (userId) {
        await subscriptionService.addUsageRecord(userId, 'dream_interpretation', {
          category,
          dreamLength: dreamText.length
        });
      }
      
      return { success: true, data: structuredInterpretation };
    } catch (error) {
      console.error('Ünlü kişi rüya yorumlama hatası:', error);
      
      // Hata durumunda fallback yanıt
      const famousPeople = this.getFamousPeople();
      const person = famousPeople.find(p => p.id === famousPersonId) || famousPeople[0];
      
      const fallbackInterpretation = {
        interpretation: `${person.name} olarak size şunu söyleyebilirim: Rüyalarınız bilinçaltınızın derin mesajlarıdır. "${dreamText.substring(0, 50)}..." şeklindeki bu rüya, ${person.specialty} açısından önemli ipuçları barındırıyor. Her rüya, kişisel gelişiminiz için değerli bir fırsattır.`,
        interpreter: person,
        confidence: 0.5,
        keywords: ['bilinçaltı', 'mesaj', 'kişisel gelişim'],
        suggestions: [
          `${person.name}'in öğretilerini araştırın`,
          'Bu rüyayı günlüğünüze kaydedin',
          'Benzer rüyalar görürseniz kalıpları inceleyin'
        ],
        error: 'AI yorumlama servisi geçici olarak kullanılamıyor',
        type: 'famous_person'
      };

      return { success: true, data: fallbackInterpretation };
    }
  },

  // OpenRouter ile rüya yorumla (genel)
  async interpretDream(dreamText, category = null, userId = null) {
    try {
      // Kullanım limiti kontrolü
      if (userId) {
        const usageCheck = await subscriptionService.checkDailyUsageLimit(userId);
        if (!usageCheck.success) {
          throw new Error('Kullanım limiti kontrolü başarısız');
        }
        
        if (!usageCheck.data.canUse) {
          return {
            success: false,
            error: 'usage_limit_exceeded',
            message: `Günlük rüya yorumlama limitiniz dolmuştur (${usageCheck.data.usedCount}/${usageCheck.data.limit}). ${usageCheck.data.isPremium ? 'Lütfen yarın tekrar deneyin.' : 'Premium abonelik ile sınırsız yorumlama yapabilirsiniz.'}`,
            data: usageCheck.data
          };
        }
      }
      
      // Rate limit için başlangıç bekleme
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Önce API bağlantısını test et
      const isAPIAvailable = await testAPIConnection();
      if (!isAPIAvailable) {
        console.log('API kullanılamıyor, fallback yoruma geçiliyor');
        throw new Error('API bağlantısı başarısız');
      }

      const prompt = `Sen bir rüya yorumlama uzmanısın. Aşağıdaki rüyayı detaylı bir şekilde yorumla:

Rüya: ${dreamText}
${category ? `Kategori: ${category}` : ''}

Lütfen şu formatta yanıt ver:
1. Genel Yorum: Rüyanın genel anlamı
2. Sembolik Analiz: Rüyadaki önemli semboller ve anlamları
3. Psikolojik Boyut: Rüyanın psikolojik açıdan ne ifade ettiği
4. Öneriler: Kişisel gelişim için öneriler

Yanıtını Türkçe ver ve samimi, anlayışlı bir dil kullan.`;

      let response;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
         try {
           // Rate limit için bekleme
           if (retryCount > 0) {
             console.log(`Rate limit nedeniyle ${5000 * retryCount}ms bekleniyor...`);
             await new Promise(resolve => setTimeout(resolve, 5000 * retryCount));
           }
           
           const controller = new AbortController();
           const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 saniye timeout

          response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://dreampack.app',
              'X-Title': 'DreamPack - Rüya Yorumlama'
            },
            body: JSON.stringify({
              model: 'google/gemma-2-9b-it:free',
              messages: [
                {
                  role: 'user',
                  content: prompt
                }
              ],
              max_tokens: 1000,
              temperature: 0.7
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          break; // Başarılı olursa döngüden çık
        } catch (networkError) {
          retryCount++;
          console.log(`Network hatası, deneme ${retryCount}/${maxRetries}:`, networkError.message);
          
          if (retryCount >= maxRetries) {
            throw networkError; // Son deneme de başarısızsa hatayı fırlat
          }
          
          // Retry öncesi daha uzun bekleme (rate limit için)
           await new Promise(resolve => setTimeout(resolve, 5000 * retryCount));
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Hatası:', response.status, errorText);
        throw new Error(`OpenRouter API hatası: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.choices || !result.choices[0] || !result.choices[0].message) {
        throw new Error('API yanıtı beklenmeyen formatta');
      }

      const interpretation = result.choices[0].message.content;

      // Yorumu parse et ve yapılandır
      const structuredInterpretation = {
        interpretation: interpretation,
        confidence: 0.9,
        keywords: this.extractKeywords(interpretation),
        suggestions: this.extractSuggestions(interpretation),
        timestamp: new Date().toISOString()
      };

      return { success: true, data: structuredInterpretation };
    } catch (error) {
      console.error('Rüya yorumlama hatası:', error);
      
      // Hata durumunda fallback yanıt
      const fallbackInterpretation = {
        interpretation: `Rüyanız analiz edilirken bir hata oluştu. Ancak genel olarak, \"${dreamText.substring(0, 50)}...\" şeklindeki rüyalar genellikle bilinçaltınızın size önemli mesajlar vermeye çalıştığını gösterir. ${category ? `\"${category}\" kategorisindeki rüyalar özellikle kişisel gelişim ve iç dünyayla ilgili mesajlar taşır.` : ''}`,
        confidence: 0.5,
        keywords: ['bilinçaltı', 'mesaj', 'kişisel gelişim'],
        suggestions: [
          'Bu rüyayı günlüğünüze kaydedin',
          'Benzer rüyalar görürseniz kalıpları inceleyin',
          'Rüyadaki duygularınızı analiz edin'
        ],
        error: 'AI yorumlama servisi geçici olarak kullanılamıyor'
      };

      return { success: true, data: fallbackInterpretation };
    }
  },

  // Anahtar kelimeleri çıkar
  extractKeywords(text) {
    const commonKeywords = [
      'bilinçaltı', 'korku', 'umut', 'gelecek', 'geçmiş', 'aile', 'aşk', 'kariyer',
      'değişim', 'büyüme', 'kişisel gelişim', 'duygular', 'stres', 'mutluluk',
      'kaygı', 'özgüven', 'ilişkiler', 'hedefler', 'başarı', 'başarısızlık'
    ];
    
    return commonKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    ).slice(0, 5);
  },

  // Önerileri çıkar
  extractSuggestions(text) {
    const defaultSuggestions = [
      'Bu rüyayı günlüğünüze kaydedin',
      'Rüyadaki duygularınızı analiz edin',
      'Benzer rüyalar görürseniz kalıpları inceleyin',
      'Rüyanızla ilgili meditasyon yapın',
      'Uzman bir rüya yorumcusuyla konuşmayı düşünün'
    ];

    // Metinden önerileri çıkarmaya çalış
    if (text.includes('Öneriler:') || text.includes('öner')) {
      const suggestionSection = text.split(/öneriler?:/i)[1];
      if (suggestionSection) {
        const suggestions = suggestionSection
          .split(/\\d+\\.|\n-|\\n\\*|•/)
          .filter(s => s.trim().length > 10)
          .map(s => s.trim())
          .slice(0, 3);
        
        if (suggestions.length > 0) {
          return suggestions;
        }
      }
    }

    return defaultSuggestions.slice(0, 3);
  }
};