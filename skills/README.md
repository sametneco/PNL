# Skills (Yetenekler/Servisler)

Bu dizin, uygulamanın yapabildiği **Teknik İşlemleri** ve **Dış Servis Entegrasyonlarını** içerir.

## Amaç
"Nasıl?" sorusunun cevabıdır. Dosya okuma, CSV parse etme, loglama gibi altyapısal işleri yönetir.

## Örnekler
- `CsvSkill.js` (veya Service): CSV dosyasını okuyup JSON'a çeviren yapı.
- `FileSkill.js`: JSON dosyalarını okuma/yazma işlemleri (Database katmanı veya Low-level IO).
- `LoggerSkill.js`: Hata kayıt mekanizması.

## Prensipler
- İş kuralı (Rule) içermez. Sadece verilen görevi (IO, Parse, Network) yapar.
- Yeniden kullanılabilir (Reusable) olmalıdır.
