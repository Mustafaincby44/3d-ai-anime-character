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


## 🌟 Özellikler

- **Modüler Kod Yapısı**: Kolay bakım ve geliştirme
- **Responsive Tasarım**: Tüm cihazlarda uyumlu
- **Hata Yönetimi**: Graceful fallback sistemi
- **Performans Optimizasyonu**: Smooth animasyonlar
- **Cross-browser Uyumluluk**: Modern tarayıcılarda çalışır

## 📄 Lisans

Bu proje " All Rights Reserved " lisansı altında lisanslanmıştır.
Kaynak kodu Mustafa'nın izni olmadan kopyalanamaz, değiştirilemez veya dağıtılamaz.
Yalnızca GitHub Pages (github.io) üzerinde yayınlanan sürümü kullanılabilir.


## 📞 İletişim

- **GitHub**: [@Mustafaincby44](https://github.com/Mustafaincby44)
- **Repository**: [3d-ai-anime-character](https://github.com/Mustafaincby44/3d-ai-anime-character)

## 🙏 Teşekkürler

- [Three.js](https://threejs.org/) - 3D grafik kütüphanesi
- [Three-VRM](https://github.com/pixiv/three-vrm) - VRM model desteği
- [Google Gemini](https://ai.google.dev/) - AI ve TTS API'leri
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
