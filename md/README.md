# MD (Models / Data)

Bu dizin, uygulamanın **Veri Modellerini** ve **Veritabanı Erişim Katmanını** içerir.

## Amaç
Verinin şeklini (Schema) ve kalıcılığını (Persistence) yönetir.

## Örnekler
- `PeriodModel.js`: Periyot verisine erişim (CRUD).
- `StoreModel.js`: Mağaza listesini yönetme.
- `DataModel.js`: Ana PNL verisini tutan yapı.

## Prensipler
- Verinin doğruluğundan sorumlu değildir (bunu Rules yapar).
- Sadece veriyi taşır veya saklar.
