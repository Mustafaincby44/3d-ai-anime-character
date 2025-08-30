# 3D AI Anime Character Chatbot

Bu proje, 3D anime karakteri ile konuşabilen, Edge TTS ve Gemini AI destekli gelişmiş bir chatbot uygulamasıdır.

## ✨ Özellikler

- **3D Anime Karakter**: VRM formatında 3D anime kız modeli
- **Edge TTS**: Microsoft'un ücretsiz, sınırsız TTS servisi
- **Gemini AI**: Google'ın gelişmiş AI modeli ile akıllı konuşma
- **Çok Dilli Destek**: Türkçe, İngilizce, Japonca, Korece, Çince ve daha fazlası
- **Ağız Animasyonu**: Gerçek zamanlı ses analizi ile ağız hareketi
- **Duygu Sistemi**: Karakterin duygularını ifade etme
- **Brain System**: Gelişmiş beyin sistemi entegrasyonu
- **API Takibi**: Kullanım limitleri ve tier yönetimi

## 🎵 TTS Modelleri

### Edge TTS (Varsayılan)
- **Ücretsiz ve günlük 50(ücretsiz model 50)**
- **10 dil desteği**: Türkçe, İngilizce, Japonca, Korece, Çince, Almanca, Fransızca, İspanyolca, İtalyanca, Rusça
- **Her dil için erkek/kadın ses seçenekleri**
- **Ses hızı ayarlanabilir** (0.5x - 2.0x)

### Gemini TTS
- **Günlük 15 istek limiti(free-tier api 15)**
- **Yüksek kaliteli AI ses**
- **Çeşitli ses seçenekleri**

## 🌍 Desteklenen Diller

| Dil | Kod | Sesler |
|-----|-----|--------|
| Türkçe | `tr` | Emel (K), Ahmet (E) |
| İngilizce | `en` | Jenny (K), Guy (E), Aria (K) |
| Japonca | `ja` | Nanami (K), Keita (E) |
| Korece | `ko` | Sun-Hi (K), InJoon (E) |
| Çince | `zh` | Xiaoxiao (K), Yunyang (E) |
| Almanca | `de` | Katja (K), Conrad (E) |
| Fransızca | `fr` | Denise (K), Henri (E) |
| İspanyolca | `es` | Elvira (K), Alvaro (E) |
| İtalyanca | `it` | Isabella (K), Diego (E) |
| Rusça | `ru` | Svetlana (K), Dmitry (E) |

## ⚙️ Ayarlar

### TTS Model Seçimi
1. Ayarlar butonuna tıkla
2. "TTS Modeli" seçeneğinden Edge TTS veya Gemini TTS seç
3. Edge TTS seçilirse:
   - Dil seçimi yap
   - Ses seçimi yap
   - Ses hızını ayarla

### API Anahtarları
- **Response API Key**: Gemini AI için
- **TTS API Key**: Gemini TTS için (farklı olmalı)

## 🔧 Gelişmiş Özellikler

### Otomatik Dil Tespiti
Chatbot, kullanıcının mesajındaki karakterleri analiz ederek otomatik olarak dil tespiti yapar ve uygun sesi seçer.

### Ses Hızı Kontrolü
Edge TTS ile ses hızını 0.5x ile 2.0x arasında ayarlayabilirsiniz.

### Fallback Sistemi
TTS başarısız olursa, metin simülasyonu ile konuşma devam eder.

## 📁 Dosya Yapısı

```
AiProject/
├── app.js              # Ana JavaScript uygulaması
├── brain.js            # Beyin sistemi
├── index.html          # HTML arayüzü
├── styles.css          # CSS stilleri
├── tts_server.py       # Edge TTS Python backend
├── requirements.txt    # Python paketleri
└── README.md           # Bu dosya
```

## 📄 Lisans

Bu proje " all rights reserved " lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## 🙏 Teşekkürler

- **Microsoft Edge TTS** - Ücretsiz TTS servisi
- **Google Gemini AI** - AI modeli
- **Three.js** - 3D grafik kütüphanesi
- **VRM** - 3D model formatı

---
