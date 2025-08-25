# 3D AI Anime Karakter Projesi

Bu proje, VRM formatında 3D anime karakteri ile etkileşim kurmanızı sağlayan gelişmiş bir web uygulamasıdır.

## 🚀 Özellikler

- **3D VRM Model Desteği**: Three.js ve Three-VRM kullanarak 3D anime karakterleri
- **AI Sohbet**: Gemini 2.5 Flash-Lite ile akıllı konuşma
- **Ses Sentezi**: Gemini 2.5 Flash-Preview-TTS ile doğal ses üretimi
- **Ağız Senkronizasyonu**: Gerçek zamanlı ses analizi ile ağız hareketi
- **Duygu Sistemi**: Karakterin yüz ifadeleri ile duygu gösterimi
- **Modern UI**: Tailwind CSS ile şık ve responsive tasarım

## 🛠️ Teknolojiler

- **Frontend**: HTML5, JavaScript (ES6+)
- **3D Graphics**: Three.js, Three-VRM
- **AI Services**: Google Gemini API
- **Styling**: Tailwind CSS
- **Audio**: Web Audio API

## 📋 Gereksinimler

- Modern web tarayıcısı (Chrome, Firefox, Safari, Edge)
- Google Gemini API anahtarı
- İnternet bağlantısı

## ⚙️ Kurulum

1. Projeyi klonlayın:
```bash
git clone https://github.com/kullaniciadi/3d-ai-anime-character.git
cd 3d-ai-anime-character
```

2. `index.html` dosyasında API anahtarınızı ekleyin:
```javascript
const apiKey = "YOUR_GEMINI_API_KEY_HERE";
```

3. Dosyayı web tarayıcısında açın

## 🔧 API Kurulumu

1. [Google AI Studio](https://makersuite.google.com/app/apikey) adresinden API anahtarı alın
2. Gemini API'yi etkinleştirin
3. API anahtarınızı kodda belirtilen yere ekleyin

## 🎮 Kullanım

1. Sayfa yüklendiğinde 3D model otomatik olarak yüklenir
2. Alt kısımdaki metin kutusuna mesajınızı yazın
3. Enter tuşuna basın veya gönder butonuna tıklayın
4. Karakter düşünür, cevap verir ve konuşur
5. Ağız hareketleri ses ile senkronize olur

## 🎨 Özelleştirme

- **Model Değiştirme**: `userModelUrl` değişkenini değiştirin
- **Ses Ayarları**: `mouthAnimationSpeed` ile ağız hareket hızını ayarlayın
- **UI Renkleri**: CSS değişkenlerini düzenleyin

## 📁 Proje Yapısı

```
3d-ai-anime-character/
├── index.html          # Ana uygulama dosyası
├── README.md           # Bu dosya
└── .gitignore          # Git ignore dosyası
```

## 🐛 Bilinen Sorunlar

- Bazı tarayıcılarda Web Audio API desteği sınırlı olabilir
- VRM model yükleme süresi internet hızına bağlıdır
- API kullanım limitleri Google tarafından belirlenir

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

Proje Sahibi - [@Mustafaincby44](https://github.com/Mustafaincby44)

Proje Linki: [https://github.com/Mustafaincby44/3d-ai-anime-character](https://github.com/Mustafaincby44/3d-ai-anime-character)

## 🙏 Teşekkürler

- [Three.js](https://threejs.org/) - 3D grafik kütüphanesi
- [Three-VRM](https://github.com/pixiv/three-vrm) - VRM model desteği
- [Google Gemini](https://ai.google.dev/) - AI servisleri
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
