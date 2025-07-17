import { supabase } from '../config/supabase';

// OpenRouter API konfigürasyonu
const OPENROUTER_API_KEY = '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';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

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
  async interpretDreamByFamousPerson(dreamText, famousPersonId, category = null) {
    try {
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

      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://dreampack.app',
          'X-Title': 'DreamPack - Ünlü Kişi Rüya Yorumlama'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1200,
          temperature: 0.8
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API hatası: ${response.status}`);
      }

      const result = await response.json();
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
  async interpretDream(dreamText, category = null) {
    try {
      const prompt = `Sen bir rüya yorumlama uzmanısın. Aşağıdaki rüyayı detaylı bir şekilde yorumla:

Rüya: ${dreamText}
${category ? `Kategori: ${category}` : ''}

Lütfen şu formatta yanıt ver:
1. Genel Yorum: Rüyanın genel anlamı
2. Sembolik Analiz: Rüyadaki önemli semboller ve anlamları
3. Psikolojik Boyut: Rüyanın psikolojik açıdan ne ifade ettiği
4. Öneriler: Kişisel gelişim için öneriler

Yanıtını Türkçe ver ve samimi, anlayışlı bir dil kullan.`;

      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://dreampack.app',
          'X-Title': 'DreamPack - Rüya Yorumlama'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API hatası: ${response.status}`);
      }

      const result = await response.json();
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