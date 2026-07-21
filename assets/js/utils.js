/* Köməkçi funksiyalar — Azərbaycan dilində şərhlərlə */

// Unikal ID yaratmaq üçün
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

// Slug yaratmaq üçün (SEO-friendly)
function slugify(text) {
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[0-6f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-').replace(/--+/g, '-').replace(/^-+|-+$/g, '');
}

// Tarix formatı: dd.mm.yyyy
function formatDate(ts) {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2,'0');
  const min = String(d.getMinutes()).padStart(2,'0');
  return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
}

// LocalStorage oxuma / yazma üçün
const StorageKey = {
  NEWS: 'real_news_v1',
  CATEGORIES: 'real_categories_v1',
  SETTINGS: 'real_settings_v1',
  LIKES: 'real_likes_v1',
  VIEWS: 'real_views_v1',
  ADMIN: 'real_admin_v1'
};

function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error('LocalStorage oxuma xətası', e);
    return fallback;
  }
}
function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('LocalStorage yazma xətası', e);
    alert('LocalStorage yazma xətası: yaddaş dolu ola bilər.');
  }
}

// Kiçik nümunə data əlavə et (ilk dəfə açıldıqda)
function ensureSampleData() {
  let news = loadData(StorageKey.NEWS, null);
  let cats = loadData(StorageKey.CATEGORIES, null);
  if (!cats) {
    cats = [
      { id: uid(), title: 'Siyasət', slug: 'siyaset' },
      { id: uid(), title: 'İdman', slug: 'idman' },
      { id: uid(), title: 'Mədəniyyət', slug: 'medeniyyet' }
    ];
    saveData(StorageKey.CATEGORIES, cats);
  }
  if (!news) {
    const sampleId = uid();
    news = [
      {
        id: sampleId,
        title: 'Real saytına xoş gəlmisiniz',
        slug: slugify('Real saytına xoş gəlmisiniz'),
        description: 'Sınaq xəbəri — saytın funksionallığını yoxlamaq üçün nümunə xəbərdir.',
        content: '<p>Bu, LocalStorage-də saxlanılan nümunə xəbərdir. Admin paneldən yeni xəbərlər əlavə edə bilərsiniz.</p>',
        categoryId: cats[0].id,
        tags: ['nümunə','yenilik'],
        featured: '',
        images: [],
        videos: [],
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        views: 0,
        likes: 0
      }
    ];
    saveData(StorageKey.NEWS, news);
  }
  // Mövqe: like və view siyahıları
  if (!loadData(StorageKey.LIKES, null)) saveData(StorageKey.LIKES, {});
  if (!loadData(StorageKey.VIEWS, null)) saveData(StorageKey.VIEWS, {});
}
