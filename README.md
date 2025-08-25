# 3D AI Anime Character

3D anime karakteri ile etkileşimli AI sohbet uygulaması. Karakter, Gemini 2.5 Flash API kullanarak yanıt üretir ve Gemini 2.5 Flash TTS ile konuşur.

## 🚀 Özellikler

- **3D VRM Model**: Three.js ve Three-VRM ile 3D anime karakteri
- **AI Sohbet**: Gemini 2.5 Flash ile akıllı yanıtlar
- **Ses Sentezi**: Gemini 2.5 Flash TTS ile doğal konuşma
- **Ağız Senkronizasyonu**: Ses analizi ile gerçek zamanlı ağız animasyonu
- **Duygu Sistemi**: Karakterin yüz ifadeleri (mutlu/üzgün)
- **Responsive UI**: Modern ve kullanıcı dostu arayüz

## 📁 Proje Yapısı

```
├── index.html          # Ana HTML dosyası
├── styles.css          # CSS stilleri
├── app.js             # JavaScript uygulama kodu
└── README.md          # Bu dosya
```

## 🛠️ Teknolojiler

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **3D Graphics**: Three.js, Three-VRM
- **AI**: Google Gemini 2.5 Flash API
- **TTS**: Google Gemini 2.5 Flash TTS
- **Styling**: Tailwind CSS
- **Audio**: Web Audio API

## ⚙️ Kurulum

1. **Repository'yi klonlayın**:
   ```bash
   git clone https://github.com/Mustafaincby44/3d-ai-anime-character.git
   cd 3d-ai-anime-character
   ```

2. **API Key ayarlayın**:
   - `app.js` dosyasında `API_KEY` değişkenini güncelleyin
   - Google AI Studio'dan API key alın

3. **Web sunucusu başlatın**:
   ```bash
   # Python ile
   python -m http.server 8000
   
   # Node.js ile
   npx serve .
   
   # VS Code Live Server eklentisi ile
   ```

4. **Tarayıcıda açın**:
   ```
   http://localhost:8000
   ```

## 🔑 API Key Kurulumu

1. [Google AI Studio](https://aistudio.google.com/)'ya gidin
2. Yeni bir API key oluşturun
3. `app.js` dosyasında `API_KEY` değişkenini güncelleyin:

```javascript
const API_KEY = "YOUR_API_KEY_HERE";
```

## 🎮 Kullanım

1. Sayfa yüklendiğinde 3D karakter otomatik olarak yüklenir
2. Alt kısımdaki input alanına mesajınızı yazın
3. Enter tuşuna basın veya gönder butonuna tıklayın
4. Karakter düşünür, AI yanıt üretir ve konuşur
5. Ağız animasyonu ses ile senkronize olur

## 🎯 Ağız Senkronizasyonu

- **Gerçek Ses**: Web Audio API ile ses analizi
- **Fallback**: TTS hatası durumunda simüle edilmiş ağız hareketi
- **Durum Kontrolü**: Sadece konuşurken ağız açılır

## 🐛 Sorun Giderme

### Ağız Düşünürken Açılıyor
- `app.js` dosyasında `updateMouthAnimation()` fonksiyonunu kontrol edin
- `isThinking` ve `isSpeaking` flag'lerinin doğru ayarlandığından emin olun

### Ses Çıkmıyor
- Tarayıcı konsolunda hata mesajlarını kontrol edin
- API key'in doğru olduğundan emin olun
- Web Audio API desteğini kontrol edin

### Model Yüklenmiyor
- İnternet bağlantınızı kontrol edin
- Fallback model otomatik olarak yüklenir

## 📝 Geliştirme

### CSS Değişiklikleri
- `styles.css` dosyasını düzenleyin
- CSS değişkenleri `:root` içinde tanımlanmıştır

### JavaScript Değişiklikleri
- `app.js` dosyasını düzenleyin
- Modüler yapı sayesinde kolay geliştirme

### Yeni Özellikler Ekleme
1. `app.js` dosyasında yeni fonksiyonlar ekleyin
2. `styles.css` dosyasında gerekli stilleri tanımlayın
3. `index.html` dosyasında UI elementlerini ekleyin

## 🌟 Özellikler

- **Modüler Kod Yapısı**: Kolay bakım ve geliştirme
- **Responsive Tasarım**: Tüm cihazlarda uyumlu
- **Hata Yönetimi**: Graceful fallback sistemi
- **Performans Optimizasyonu**: Smooth animasyonlar
- **Cross-browser Uyumluluk**: Modern tarayıcılarda çalışır

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 İletişim

- **GitHub**: [@Mustafaincby44](https://github.com/Mustafaincby44)
- **Repository**: [3d-ai-anime-character](https://github.com/Mustafaincby44/3d-ai-anime-character)

## 🙏 Teşekkürler

- [Three.js](https://threejs.org/) - 3D grafik kütüphanesi
- [Three-VRM](https://github.com/pixiv/three-vrm) - VRM model desteği
- [Google Gemini](https://ai.google.dev/) - AI ve TTS API'leri
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
