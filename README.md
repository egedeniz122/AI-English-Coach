# Proje Adı: AI English Coach

**Öğrenci Adı ve Soyadı:** Ege Deniz
**Öğrenci Numarası:** 24010501044
**GitHub Bağlantısı:** [https://github.com/egedeniz122/AI-English-Coach](https://github.com/egedeniz122/AI-English-Coach)

---

## Projenin Amacı ve Kısa Açıklaması

**AI English Coach**, B1-B2 seviyesindeki İngilizce öğrenenler için özel olarak tasarlanmış, yapay zeka destekli kişiselleştirilmiş bir dil koçu uygulamasıdır. Google Gemini API gücüyle çalışan bu platform, kullanıcıların İngilizce becerilerini (Okuma, Yazma, Dinleme, Konuşma ve Kelime Dağarcığı) geliştirmelerini sağlar. Uygulama, kullanıcının yaptığı pratiklere gerçek zamanlı geri bildirimler vererek hatalarını düzeltir ve dil gelişimini oyunlaştırma (gamification) elementleriyle (günlük seri, tecrübe puanı, haftalık hedefler) destekler.

## Kullanılan Teknolojiler / Kütüphaneler

*   **Frontend (Kullanıcı Arayüzü):** HTML5, CSS3, Vanilla JavaScript
*   **Yapay Zeka Entegrasyonu:** Google Gemini API
*   **Backend / Sunucu:** Python (Yerel test ortamı için `http.server` modülü)
*   **Mimari:** Modüler yapı, Single Page Application (SPA) yaklaşımı ile sayfalar arası geçiş.

## Proje Klasör Yapısı

```text
AI English Coach/
│
├── assets/
│   ├── css/
│   │   └── main.css         # Temel stiller, temalar ve duyarlı (responsive) tasarım kuralları
│   └── js/
│       └── app.js           # Ana uygulama mantığı, API istekleri ve modül yönetimleri
│
├── screenshots/             # Uygulamadan çeşitli ekran görüntüleri
│   ├── Ekran görüntüsü 2026-06-24 224257.png
│   └── ...
│
├── index.html               # Uygulamanın ana ve tek HTML şablonu (Tüm modülleri içerir)
├── server.py                # Ön bellekleme (cache) olmadan projeyi ayağa kaldıran Python sunucu dosyası
├── Projeyi_Baslat.bat       # Windows kullanıcıları için projeyi tek tıkla başlatan script
└── README.md                # Proje dokümantasyonu (Bu dosya)
```

## Kurulum Adımları

1.  **Projeyi Bilgisayarınıza İndirin:**
    Projeyi GitHub üzerinden bilgisayarınıza klonlayın veya ZIP olarak indirip bir klasöre çıkartın.
    ```bash
    git clone https://github.com/egedeniz122/AI-English-Coach.git
    ```
2.  **Google Gemini API Anahtarı Alın:**
    Uygulamanın yapay zeka özelliklerinin çalışabilmesi için bir API anahtarına ihtiyacınız vardır.
    [Google AI Studio](https://aistudio.google.com/app/apikey) adresine giderek ücretsiz bir API anahtarı oluşturun.
    *(Not: Ücretsiz API hakkınız bittiğinde uygulama otomatik olarak demo moduna alınmaktadır.)*
3.  **Python Kurulumu (Gerekliyse):**
    Projenin yerel sunucuda çalışması için sisteminizde Python 3.x yüklü olması önerilir. Yüklü değilse [python.org](https://www.python.org/) adresinden yükleyebilirsiniz.

## Çalıştırma / Kullanım Talimatları

1.  **Sunucuyu Başlatma:**
    *   **Windows Kullanıcıları için:** Proje klasöründeki `Projeyi_Baslat.bat` dosyasına çift tıklayarak sunucuyu başlatabilirsiniz.
    *   **Alternatif (Terminal üzerinden):** Proje dizininde komut satırını açın ve aşağıdaki komutu çalıştırın:
        ```bash
        python server.py 8000
        ```
2.  **Uygulamaya Erişim:**
    Tarayıcınızı (Chrome, Firefox, vb.) açın ve adres çubuğuna `http://localhost:8000` yazarak uygulamaya giriş yapın.
3.  **API Anahtarını Girme:**
    Uygulama açıldığında sağ üst köşedeki anahtar (🔑) ikonuna tıklayın ve 2. kurulum adımında aldığınız Gemini API anahtarını girerek kaydedin.
4.  **Kullanım:**
    Artık "Writing, Reading, Listening, Speaking" veya "Vocabulary" sekmelerinden birini seçerek İngilizce pratiği yapmaya başlayabilirsiniz. Sistem sizin için seviyenize (B1-B2) uygun metinler üretecek ve yanıtlarınızı analiz edecektir.

## Ekran Görüntüleri

*Aşağıdaki ekran görüntüleri projenin genel arayüzünü ve çeşitli modülleri göstermektedir:*

![Ana Ekran / Dashboard](screenshots/Ekran%20görüntüsü%202026-06-25%20231730.png)

![Writing / Yazma Modülü](screenshots/Ekran%20görüntüsü%202026-06-25%20231807.png)

*(Not: Diğer ekran görüntüleri `screenshots` klasörü içerisinde incelenebilir.)*


## Kaynakça veya Yararlanılan Bağlantılar

*   [Google Gemini API Documentation](https://ai.google.dev/docs)
*   [MDN Web Docs (HTML, CSS, JavaScript Referansları)](https://developer.mozilla.org/)
*   [Python SimpleHTTPRequestHandler Documentation](https://docs.python.org/3/library/http.server.html)
