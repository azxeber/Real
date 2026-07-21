# Real (Front-end) — Mobil-öncə Xəbər Saytı (HTML / CSS / JS)

Qısa məlumat:
- Bu layihə yalnız ön tərəf (frontend) olaraq hazırlanıb. Backend (PHP/MySQL) yoxdur.
- Bütün məlumatlar brauzerin LocalStorageində saxlanır.
- Bütün interfeys və mətnlər Azərbaycan dilindədir.

Quraşdırma:
1. Faylları serverə və ya yerli qovluğa yükləyin.
2. `index.html` faylını açın (və ya static host-da yerləşdirin).
3. Admin panelə keçid: `admin/login.html`
   - İlk girişdə parol təyin edin.
   - Sonra `admin/dashboard.html`-dən xəbərlər əlavə/rediq et/silin.
4. Şəkil və video yükləyərkən fayllar brauzerdə base64 formatında LocalStorage-ə yazılır.

Diqqət:
- LokalStorage həcmi brauzerdən asılıdır. Çox böyük fayllar (xüsusilə uzun videolar) brauzerin limitini doldura bilər. Kiçik və orta ölçülü şəkillər tövsiyə olunur.
- Bu layihə statik hostlarda (GitHub Pages, Netlify və s.) problemsiz işləyir.

Xüsusiyyətlər:
- Mobil-öncə, responsiv, Facebook-üslubuna yaxın interfeys
- Ana səhifə (ən son xəbərlər)
- Xəbər səhifəsi (mətn, şəkil qalereyası, video)
- Kateqoriyalar
- Axtarış
- Tünd/İşıq rejimi
- Bəyənmə (LocalStorage)
- Paylaşma (navigator.share varsa, yoxdursa sosial paylaşma linkləri)
- Baxış sayğacı (LocalStorage)
- Admin panel: əlavə, redaktə, sil, kateqoriya idarəsi, fayl yükləmə
- SEO: dinamik başlıq/meta və JSON-LD strukturlaşdırılmış məlumat əlavə olunur
- Bəyənmələr və baxışlar yalnız LocalStorage/sessionStorage səviyyəsində qeyd olunur (server tərəfi yoxdur).