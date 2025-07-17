# 🌙 DreamPack - Rüya Yorumlama Uygulaması

DreamPack, kullanıcıların rüyalarını kaydetmelerine, kategorilere ayırmalarına ve AI destekli yorumlar almalarına olanak sağlayan modern bir React Native uygulamasıdır.

## ✨ Özellikler

### 🔐 Kimlik Doğrulama
- Güvenli kullanıcı kaydı ve girişi
- Şifre sıfırlama özelliği
- Supabase Auth entegrasyonu

### 🌍 Çoklu Dil Desteği
- 6 farklı dil desteği:
  - 🇺🇸 English
  - 🇹🇷 Türkçe
  - 🇮🇩 Bahasa Indonesia
  - 🇯🇵 日本語 (Japonca)
  - 🇹🇭 ไทย (Tayca)
  - 🇲🇾 Bahasa Melayu
- Otomatik cihaz dili algılama
- Manuel dil değiştirme seçeneği

### 📱 Modern Kullanıcı Arayüzü
- Gradient arka planlar
- Blur efektleri
- Responsive tasarım
- Smooth animasyonlar
- Modern profil sayfası

### 🔮 Rüya Yönetimi
- Rüya ekleme ve düzenleme
- Kategori bazlı organizasyon
- Rüya geçmişi görüntüleme
- İstatistiksel analiz

### 🤖 AI Destekli Yorumlama
- OpenRouter API entegrasyonu
- Farklı rüya yorumcuları seçimi
- Akıllı rüya analizi

## 🛠️ Teknoloji Stack

### Frontend
- **React Native** - Mobil uygulama geliştirme
- **Expo** - Geliştirme ve dağıtım platformu
- **React Navigation** - Navigasyon yönetimi
- **Expo Linear Gradient** - Gradient efektleri
- **Expo Blur** - Blur efektleri
- **Expo Localization** - Çoklu dil desteği

### Backend & Veritabanı
- **Supabase** - Backend as a Service
- **PostgreSQL** - Veritabanı
- **Supabase Auth** - Kimlik doğrulama

### AI & API
- **OpenRouter API** - AI destekli rüya yorumlama

### State Management
- **React Context API** - Global state yönetimi
- **AsyncStorage** - Yerel veri saklama

## 📁 Proje Yapısı

```
dreampack22/
├── components/           # Yeniden kullanılabilir bileşenler
│   └── LanguageSelector.js
├── contexts/            # React Context providers
│   ├── AuthContext.js
│   └── LanguageContext.js
├── localization/        # Çoklu dil dosyaları
│   ├── en.js           # İngilizce
│   ├── tr.js           # Türkçe
│   ├── id.js           # Endonezce
│   ├── ja.js           # Japonca
│   ├── th.js           # Tayca
│   ├── ms.js           # Malayca
│   ├── index.js        # Dil yönetimi
│   └── languages.js    # Dil konfigürasyonu
├── screens/            # Uygulama ekranları
│   ├── HomeScreen.js
│   ├── LoginScreen.js
│   ├── SignUpScreen.js
│   ├── ForgotPasswordScreen.js
│   ├── OnboardingScreen.js
│   └── DreamInterpretationScreen.js
├── services/           # API servisleri
│   ├── authService.js
│   └── dreamService.js
├── config/             # Konfigürasyon dosyaları
│   └── supabase.js
└── assets/             # Statik dosyalar
    ├── icon.png
    ├── splash-icon.png
    └── ...
```

## 🚀 Kurulum

### Gereksinimler
- Node.js (v16 veya üzeri)
- npm veya yarn
- Expo CLI
- iOS Simulator (macOS) veya Android Emulator

### Adım 1: Projeyi Klonlayın
```bash
git clone <repository-url>
cd dreampack22
```

### Adım 2: Bağımlılıkları Yükleyin
```bash
npm install
```

### Adım 3: Supabase Konfigürasyonu
1. [Supabase](https://supabase.com) hesabı oluşturun
2. Yeni bir proje oluşturun
3. `config/supabase.js` dosyasında API URL ve Key'leri güncelleyin:

```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'
```

### Adım 4: OpenRouter API Konfigürasyonu (Opsiyonel)
1. [OpenRouter](https://openrouter.ai) hesabı oluşturun
2. API key'inizi alın
3. `services/dreamService.js` dosyasında API key'i güncelleyin

### Adım 5: Uygulamayı Başlatın
```bash
npx expo start
```

## 📱 Kullanım

### İlk Kurulum
1. Uygulamayı açın
2. Hesap oluşturun veya giriş yapın
3. Dil tercihinizi seçin (otomatik algılanır)
4. Profilinizi tamamlayın

### Rüya Ekleme
1. Ana sayfada "Yeni Rüya Ekle" butonuna tıklayın
2. Rüyanızı detaylı şekilde yazın
3. Kategori seçin
4. İsteğe bağlı olarak rüya yorumcusu seçin
5. "Rüyamı Yorumla" butonuna tıklayın

### Dil Değiştirme
1. Profil sayfasına gidin
2. "Dil" seçeneğine tıklayın
3. İstediğiniz dili seçin

## 🔧 Geliştirme

### Yeni Dil Ekleme
1. `localization/` klasöründe yeni dil dosyası oluşturun (örn: `fr.js`)
2. `localization/languages.js` dosyasına yeni dili ekleyin
3. `localization/index.js` dosyasında import edin

### Yeni Ekran Ekleme
1. `screens/` klasöründe yeni ekran dosyası oluşturun
2. `App.js` dosyasında navigasyona ekleyin
3. Gerekli çevirileri dil dosyalarına ekleyin

## 🐛 Bilinen Sorunlar

- OpenRouter API 402 hatası: Ücretli plan gerektirir
- iOS simülatörde blur efektleri yavaş olabilir

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

Proje hakkında sorularınız için:
- Email: furkan44465@gmail.com
- GitHub: [GitHub Profile]

## 🙏 Teşekkürler

- Supabase ekibine backend hizmetleri için
- OpenRouter ekibine AI API'si için
- Expo ekibine geliştirme platformu için
- React Native topluluğuna

---

**DreamPack ile rüyalarınızı keşfedin! 🌙✨**