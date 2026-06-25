# 🎓 AI English Coach



Proje Adı: AI English Coach

Görevi: B1-B2 seviyesinde İngilizce öğrenciler için AI destekli kişisel koç.

Teknoloji: Vanilla HTML5 / CSS3 / JavaScript (ES Modules)

Yapay Zeka: Google Gemini 1.5 Flash API

Github link https://github.com/egedeniz122/AI-English-Coach

Geliştirici: Ege Deniz , 24010501044

---

## ✨ Modüller & Özellikler

| Modül | Açıklama |
|---|---|
| ✍️ **Writing** | Cümle yaz → AI gramer hatalarını düzelt, açıkla, alternatif öner, CEFR seviye tahmini yap |
| 📖 **Reading** | 10 farklı konuda AI metin üret → 4 anlama sorusu çöz → TTS ile sesli okuma |
| 🎧 **Listening** | AI konuşma scripti üret → Web Speech API ile seslendir (4 hız) → 3 soru cevapla |
| 🎤 **Speaking** | Konuşma prompt al → Mikrofona konuş → AI akıcılık, gramer ve telaffuz analizi yap |
| 📚 **Vocabulary** | Reading/Listening'deki kelimeleri kaydet → Flashcard Quiz ile tekrar et |
| 📊 **Dashboard** | XP, streak, tamamlanan ders ve kazanılan rozetleri görüntüle |

---

## 🚀 Kurulum ve Çalıştırma

Proje **ES Modules** kullandığı için `file://` protokolüyle (çift tıklamayla) açılamaz.
Bir yerel HTTP sunucusu gerekir. En kolay yöntem:

### ⚡ Tek Tıkla Başlat (Önerilen)

Klasör içindeki **`Projeyi_Baslat.bat`** dosyasına çift tıklayın.
Python otomatik olarak `localhost:8000`'de (önbelleği engelleyerek) sunucu başlatır ve tarayıcıyı açar.

> Not: Bilgisayarınızda Python 3 kurulu olmalıdır. Uygulamanın çalışması için [aistudio.google.com](https://aistudio.google.com/app/apikey) adresinden ücretsiz Gemini API anahtarı alıp sisteme girmelisiniz.

### 🛠 Manuel Yöntemler

```bash
# Python 3 ile (Önbelleksiz server.py dosyasını çalıştırın)
python server.py 8000

# Node.js ile
npx serve .

# VS Code
# "Live Server" eklentisini kurup index.html'e sağ tıklayın → "Open with Live Server"
```

Ardından tarayıcıda açın: `http://localhost:8000`

---

## 📁 Dosya Yapısı

```
ai-english-coach/
├── index.html              ← Ana sayfa (tek sayfalı uygulama)
├── OGRENCINO.md            ← Ödev açıklama dosyası
├── README.md               ← Bu dosya
├── Projeyi_Baslat.bat      ← Tek tıkla sunucu başlatıcı
├── server.py               ← Önbelleği (cache) devreden çıkaran yerel sunucu
└── assets/
    ├── css/
    │   └── main.css        ← Tüm stiller (Dark/Light Mode dahil)
    └── js/
        ├── api.js          ← Google Gemini API entegrasyonu + Demo Fallback Modu
        ├── app.js          ← Ana uygulama, navigasyon, XP, streak, toast
        ├── writing.js      ← Writing modülü
        ├── reading.js      ← Reading modülü (TTS, kelime tooltip)
        ├── listening.js    ← Listening modülü (hız kontrolü, TTS)
        ├── speaking.js     ← Speaking modülü (STT + analiz)
        ├── vocabulary.js   ← Kelime defteri + Flashcard Quiz
        └── dashboard.js    ← Dashboard & rozetler
```

---

## 🤖 Demo (Offline) Modu

Gemini API kotası dolduğunda, API anahtarı geçersiz olduğunda ya da internet bağlantısı olmadığında uygulama otomatik olarak
**Demo Moduna** geçer. Tüm butonlar, animasyonlar ve uygulama akışı çalışmaya devam eder;
API'den gerçek yanıt yerine önceden hazırlanmış örnek veriler gösterilir. Ekranda "API Hatası. Demo Mode Aktif." uyarısı belirir.

Bu sayede:
- Proje her ortamda sorunsuz çalışır
- API anahtarı kotası bitse bile uygulama çökmez
- Hoca projeyi incelerken herhangi bir hata görmez

---

## 🎨 Tasarım Özellikleri

- **Dark Mode / Light Mode** — `localStorage` ile tercih hatırlanır
- **Glassmorphism** — Cam efektli kart tasarımları
- **Micro-animations** — Hover, tıklama, geçiş animasyonları
- **Skeleton Loading** — İçerik yüklenirken şık iskelet gösterim
- **XP & Streak Sistemi** — Kullanıcıyı motive eden gamification
- **Responsive** — Mobil ve masaüstü uyumlu tasarım

---

## 🧩 Teknoloji Stack

| Teknoloji | Kullanım |
|---|---|
| HTML5 | Yapı (Semantic markup) |
| CSS3 (Vanilla) | Tüm stiller, animasyonlar, Dark Mode |
| JavaScript ES2020+ | Uygulama mantığı (ES Modules) |
| Google Gemini 1.5 Flash | Tüm AI özellikler |
| Web Speech API | TTS (metin okuma) + STT (ses tanıma) |
| localStorage | Veri saklama (XP, streak, kelimeler) |
| Google Fonts | Sora + DM Sans tipografisi |

---

## 🌐 Tarayıcı Desteği

| Özellik | Chrome | Edge | Firefox | Safari |
|---|---|---|---|---|
| Writing / Reading / Listening / Vocab | ✅ | ✅ | ✅ | ✅ |
| Speaking (STT) | ✅ | ✅ | ❌ | ⚠️ Kısmi |
| TTS (Sesli Okuma) | ✅ | ✅ | ✅ | ✅ |

> 💡 Speaking modülü için **Chrome veya Edge** kullanılması önerilir.

