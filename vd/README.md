# VD (View Data / ViewModel)

Bu dizin, **İstemciye (Frontend) sunulacak verinin** hazırlanmasından sorumludur.

## Amaç
Ham veriyi (MD) alır, gerekirse işler, formatlar ve API yanıtı (Response) olarak hazırlar. Ayrıca Frontend'den gelen istek (Request) nesnelerini (DTO) de tanımlayabilir.

## Örnekler
- `PeriodView.js`: API'den dönecek periyot listesinin formatı (örn: hassas verileri gizleme).
- `ApiResponse.js`: Standart başarı/hata mesaj formatları.

## Prensipler
- İş mantığı içermez.
- Sadece UI/API kontratına uygun veri üretir.
