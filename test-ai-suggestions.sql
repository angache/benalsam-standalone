-- Test AI Suggestions for Categories
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- Elektronik kategorisi için AI suggestions
INSERT INTO category_ai_suggestions (category_id, suggestion_type, suggestion_data, confidence_score, is_approved) VALUES
(618, 'keywords', '{"suggestions": ["iPhone", "Samsung", "Android", "Akıllı Telefon", "Tablet", "Laptop", "Bilgisayar", "Kulaklık", "Şarj Cihazı"]}', 0.95, true),
(618, 'title', '{"suggestions": ["Yeni iPhone 15 Pro Satılık", "Samsung Galaxy S24 Ultra", "MacBook Air M2", "iPad Pro 12.9"]}', 0.92, true),
(618, 'description', '{"suggestions": ["Mükemmel durumda, kutulu, garantili", "Az kullanılmış, orijinal", "Yeni gibi, tüm aksesuarları mevcut"]}', 0.88, true);

-- Emlak kategorisi için AI suggestions
INSERT INTO category_ai_suggestions (category_id, suggestion_type, suggestion_data, confidence_score, is_approved) VALUES
(723, 'keywords', '{"suggestions": ["Ev", "Daire", "Villa", "Müstakil", "Satılık", "Kiralık", "Yeni", "Eski", "Bahçeli"]}', 0.94, true),
(723, 'title', '{"suggestions": ["Bahçeli Müstakil Ev", "Yeni Daire Satılık", "Villa Kiralık", "Deniz Manzaralı Daire"]}', 0.91, true),
(723, 'description', '{"suggestions": ["Deniz manzaralı, yeni bina", "Bahçeli, müstakil, 3+1", "Merkezi konum, yeni yapı"]}', 0.89, true);

-- Araç kategorisi için AI suggestions
INSERT INTO category_ai_suggestions (category_id, suggestion_type, suggestion_data, confidence_score, is_approved) VALUES
(630, 'keywords', '{"suggestions": ["Araba", "Otomobil", "SUV", "Sedan", "Hatchback", "Dizel", "Benzin", "Hibrit", "Elektrik"]}', 0.93, true),
(630, 'title', '{"suggestions": ["2020 Model SUV Satılık", "Düşük Kilometreli Sedan", "Aile Arabası Kiralık", "Ekonomik Yakıt Tüketimi"]}', 0.90, true),
(630, 'description', '{"suggestions": ["Düşük kilometre, tek sahibinden", "Yeni bakım yapıldı, kaza yok", "Aile arabası, ekonomik"]}', 0.87, true);

-- Mobilya kategorisi için AI suggestions
INSERT INTO category_ai_suggestions (category_id, suggestion_type, suggestion_data, confidence_score, is_approved) VALUES
(636, 'keywords', '{"suggestions": ["Koltuk", "Masa", "Sandalye", "Dolap", "Yatak", "Mutfak", "Oturma Odası", "Yatak Odası"]}', 0.92, true),
(636, 'title', '{"suggestions": ["Oturma Odası Takımı", "Yatak Odası Mobilyası", "Mutfak Dolabı", "Çalışma Masası"]}', 0.89, true),
(636, 'description', '{"suggestions": ["Yeni, kutulu, montaj dahil", "Az kullanılmış, temiz", "Kaliteli malzeme, dayanıklı"]}', 0.86, true);

-- Spor kategorisi için AI suggestions
INSERT INTO category_ai_suggestions (category_id, suggestion_type, suggestion_data, confidence_score, is_approved) VALUES
(642, 'keywords', '{"suggestions": ["Bisiklet", "Koşu", "Fitness", "Yoga", "Yüzme", "Tenis", "Futbol", "Basketbol"]}', 0.91, true),
(642, 'title', '{"suggestions": ["Dağ Bisikleti Satılık", "Koşu Ayakkabısı", "Fitness Ekipmanları", "Yoga Matı"]}', 0.88, true),
(642, 'description', '{"suggestions": ["Profesyonel kalite, az kullanılmış", "Yeni, kutulu, garantili", "Dayanıklı malzeme"]}', 0.85, true);

-- Onaylanmamış öneriler (test için)
INSERT INTO category_ai_suggestions (category_id, suggestion_type, suggestion_data, confidence_score, is_approved) VALUES
(618, 'keywords', '{"suggestions": ["Test", "Onaylanmamış", "Düşük Skor"]}', 0.45, false),
(723, 'title', '{"suggestions": ["Test Başlık", "Onay Bekleyen"]}', 0.52, false);

-- Sonuçları kontrol et
SELECT 
    cas.id,
    c.name as category_name,
    cas.suggestion_type,
    cas.confidence_score,
    cas.is_approved,
    cas.created_at
FROM category_ai_suggestions cas
JOIN categories c ON cas.category_id = c.id
ORDER BY cas.confidence_score DESC, cas.created_at DESC;
