-- Seed Periods
insert into periods (id, name, start_date, end_date, weeks, quarter, status) values
(1, 'Periyot 1', '2025-12-26', '2026-01-22', 4, 'Q1', 'active'),
(2, 'Periyot 2', '2026-01-23', '2026-02-19', 4, 'Q1', 'pending'),
(3, 'Periyot 3', '2026-02-20', '2026-03-26', 5, 'Q1', 'pending'),
(4, 'Periyot 4', '2026-03-27', '2026-04-23', 4, 'Q2', 'pending'),
(5, 'Periyot 5', '2026-04-24', '2026-05-21', 4, 'Q2', 'pending'),
(6, 'Periyot 6', '2026-05-22', '2026-06-25', 5, 'Q2', 'pending'),
(7, 'Periyot 7', '2026-06-26', '2026-07-23', 4, 'Q3', 'pending'),
(8, 'Periyot 8', '2026-07-24', '2026-08-20', 4, 'Q3', 'pending'),
(9, 'Periyot 9', '2026-08-21', '2026-09-24', 5, 'Q3', 'pending'),
(10, 'Periyot 10', '2026-09-25', '2026-10-22', 4, 'Q4', 'pending'),
(11, 'Periyot 11', '2026-10-23', '2026-11-19', 4, 'Q4', 'pending'),
(12, 'Periyot 12', '2026-11-20', '2026-12-31', 6, 'Q4', 'pending')
on conflict (id) do nothing;

-- Seed Stores (Converted from JSON)
insert into stores (code, name, opening_date, area, visible) values
('U684', 'STA KON Kivilcim Bulvar', '2019-11-01', 571, true),
('U272', 'STA Kon Kent Plaza', '2012-11-23', 322, true),
('U354', 'STA Kon Kule Site', '2015-04-29', 233, true),
('UA41', 'STA KON Konya Enntepe AVM', '2023-09-29', 343, true),
('U529', 'STA Kon Meram', '2017-03-18', 420, true),
('U744', 'STA Kon M1 Konya', '2020-07-13', 230, true),
('UA58', 'STA AKS Aksaray Akso Vega', '2023-06-30', 375, true),
('UA25', 'STA Kon Temasehir', '2023-06-20', 335, true),
('U824', 'STA Park Karaman', '2022-06-24', 302, true),
('U619', 'STA Selcuker Center', '2018-05-17', 305, true),
('U862', 'STA AKS Nora City', '2022-06-24', 345, true),
('U990', 'STA ANK Tuzgolu Ankara Yonu', '2022-11-22', 233, true),
('U947', 'STA KON Meram Cadde', '2022-10-28', 389, true),
('U627', 'STA KON Novada Konya', '2018-05-20', 250, true),
('U991', 'STA ANK Tuzgolu Nigde Yonu', '2022-11-22', 230, true)
on conflict (code) do nothing;

-- Fix Schema Cache Issue (just in case)
NOTIFY pgrst, 'reload config';
