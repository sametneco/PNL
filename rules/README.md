# Rules (Kurallar)

Bu dizin, uygulamanın **İş Mantığı (Business Logic)** ve **Validasyon Kurallarını** içerir.

## Amaç
Data'nın nasıl işleneceğine, hangi koşullarda kabul edileceğine karar veren "beyin" kısmıdır.

## Örnekler
- `PeriodRules.js`: Bir periyodun aktif/pasif olma şartları.
- `UploadRules.js`: Yüklenen dosyanın format ve boyut kontrolleri.
- `StoreRules.js`: Bir mağazanın görünürlük kuralları.

## Prensipler
- Saf fonksiyonlar veya sınıflar olmalıdır.
- Veritabanı (MD) veya Dış Servis (Skills) bağımlılığı minimumda tutulmalıdır (Data verilir, karar alınır).
