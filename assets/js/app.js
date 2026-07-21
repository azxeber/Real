/* Əsas SPA skripti — saytın istifadəçi hissəsi */
/* Bütün görünən mətnlər Azərbaycan dilindədir. */

(function(){
  // Başlanğıc: nümunə data və DOM referansları
  ensureSampleData();
  const app = document.getElementById('app');
  const yearSpans = document.querySelectorAll('#year, #year-admin');
  yearSpans.forEach(s => s.textContent = new Date().getFullYear());

  // Tema yüklə
  const themeToggle = document.getElementById('theme-toggle');
  if (localStorage.getItem('real_theme') === 'dark') document.body.classList.add('dark');
  themeToggle?.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('real_theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });

  // Router: hash-based
  window.addEventListener('hashchange', router);
  document.getElementById('search-form').addEventListener('submit', function(e){
    e.preventDefault();
    const q = document.getElementById('search-input').value.trim();
    location.hash = '#/axtar?q=' + encodeURIComponent(q);
  });

  // Like klikləri üçün event delegasiyası və paylaşma
  app.addEventListener('click', (e) => {
    if (e.target.matches('.like-btn')) {
      const id = e.target.dataset.id;
      toggleLike(id, e.target);
    } else if (e.target.matches('.share-btn')) {
      const url = e.target.dataset.url;
      shareUrl(url);
    } else if (e.target.matches('.card-link') || e.target.closest('.card-link')) {
      // normal link davranışı SPA ilə idarə olunacaq
    }
  });

  // Router ilk işə düşmə
  router();

  /* Router funksiyası */
  function router() {
    const hash = location.hash || '#/';
    // #/ -> əsas
    if (hash === '#/' || hash === '') {
      renderHome();
      return;
    }
    // kateqoriyalar
    if (hash.startsWith('#/kateqoriyalar')) {
      renderCategories();
      return;
    }
    // kateqoriya detayı #/kateqoriya/slug
    if (hash.startsWith('#/kateqoriya/')) {
      const slug = decodeURIComponent(hash.split('/')[2] || '');
      renderCategory(slug);
      return;
    }
    // axtarış #/axtar?q=...
    if (hash.startsWith('#/axtar')) {
      const q = (new URLSearchParams(hash.split('?')[1] || '')).get('q') || '';
      renderSearch(q);
      return;
    }
    // xəbər detayı #/xeber/slug
    if (hash.startsWith('#/xeber/')) {
      const slug = decodeURIComponent(hash.split('/')[2] || '');
      renderArticle(slug);
      return;
    }
    // bəyənilənlər
    if (hash.startsWith('#/favorit')) {
      renderFavorites();
      return;
    }
    // default 404
    renderNotFound();
  }

  /* Render: Ev səhifəsi */
  function renderHome() {
    document.title = 'Ən son xəbərlər — Real';
    const news = loadData(StorageKey.NEWS, []).slice().sort((a,b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
    const cats = loadData(StorageKey.CATEGORIES, []);
    app.innerHTML = '';
    const h = document.createElement('header');
    h.innerHTML = '<h1>Ən son xəbərlər</h1>';
    app.appendChild(h);
    const feed = document.createElement('section');
    feed.className = 'feed';
    news.forEach(item => {
      const tpl = document.getElementById('card-template');
      const el = tpl.content.cloneNode(true);
      const link = el.querySelector('.card-link');
      link.href = '#/xeber/' + encodeURIComponent(item.slug);
      const media = el.querySelector('.card-media');
      if (item.featured) {
        media.innerHTML = `<img loading="lazy" src="${item.featured}" alt="${escapeHtml(item.title)}">`;
      } else {
        media.innerHTML = `<div class="placeholder">${escapeHtml(item.title)}</div>`;
      }
      el.querySelector('.card-title').textContent = item.title;
      const cat = cats.find(c=>c.id===item.categoryId);
      el.querySelector('.card-meta').textContent = (cat?cat.title:'') + ' • ' + formatDate(item.publishedAt || item.createdAt);
      feed.appendChild(el);
    });
    app.appendChild(feed);
  }

  /* KATEQORİYALAR */
  function renderCategories() {
    document.title = 'Kateqoriyalar — Real';
    app.innerHTML = '<h1>Kateqoriyalar</h1>';
    const cats = loadData(StorageKey.CATEGORIES, []);
    const list = document.createElement('section');
    list.className = 'card-list';
    cats.forEach(c => {
      const a = document.createElement('a');
      a.className = 'card';
      a.href = '#/kateqoriya/' + encodeURIComponent(c.slug);
      a.textContent = c.title;
      list.appendChild(a);
    });
    app.appendChild(list);
  }

  function renderCategory(slug) {
    const cats = loadData(StorageKey.CATEGORIES, []);
    const cat = cats.find(c=>c.slug===slug);
    if (!cat) { renderNotFound('Kateqoriya tapılmadı.'); return; }
    document.title = cat.title + ' — Real';
    app.innerHTML = `<h1>${escapeHtml(cat.title)}</h1>`;
    const news = loadData(StorageKey.NEWS, []).filter(n=>n.categoryId===cat.id && (n.publishedAt || n.createdAt));
    const feed = document.createElement('section'); feed.className='feed';
    news.forEach(item => {
      const tpl = document.getElementById('card-template');
      const el = tpl.content.cloneNode(true);
      const link = el.querySelector('.card-link');
      link.href = '#/xeber/' + encodeURIComponent(item.slug);
      const media = el.querySelector('.card-media');
      if (item.featured) media.innerHTML = `<img loading="lazy" src="${item.featured}" alt="${escapeHtml(item.title)}">`;
      el.querySelector('.card-title').textContent = item.title;
      el.querySelector('.card-meta').textContent = formatDate(item.publishedAt || item.createdAt);
      feed.appendChild(el);
    });
    app.appendChild(feed);
  }

  /* AXTARIŞ */
  function renderSearch(q) {
    document.title = 'Axtarış: ' + q + ' — Real';
    app.innerHTML = `<h1>Axtarış: ${escapeHtml(q)}</h1>`;
    if (!q) {
      const p = document.createElement('div'); p.className='card'; p.textContent='Axtarış sözünü daxil edin.';
      app.appendChild(p); return;
    }
    const news = loadData(StorageKey.NEWS, []).filter(n => (n.title + ' ' + n.content + ' ' + (n.tags||'')).toLowerCase().includes(q.toLowerCase()));
    if (!news.length) {
      const p = document.createElement('div'); p.className='card'; p.textContent='Nəticə tapılmadı.';
      app.appendChild(p); return;
    }
    const feed = document.createElement('section'); feed.className='feed';
    news.forEach(item => {
      const tpl = document.getElementById('card-template');
      const el = tpl.content.cloneNode(true);
      const link = el.querySelector('.card-link');
      link.href = '#/xeber/' + encodeURIComponent(item.slug);
      const media = el.querySelector('.card-media');
      if (item.featured) media.innerHTML = `<img loading="lazy" src="${item.featured}" alt="${escapeHtml(item.title)}">`;
      el.querySelector('.card-title').textContent = item.title;
      el.querySelector('.card-meta').textContent = formatDate(item.publishedAt || item.createdAt);
      feed.appendChild(el);
    });
    app.appendChild(feed);
  }

  /* XƏBƏR SƏHİFƏSİ */
  function renderArticle(slug) {
    const news = loadData(StorageKey.NEWS, []);
    const item = news.find(n=>n.slug===slug);
    if (!item) { renderNotFound('Xəbər tapılmadı.'); return; }
    // Baxış sayını artır (LocalStorage VIEWS)
    const views = loadData(StorageKey.VIEWS, {});
    views[item.id] = (views[item.id] || 0) + (sessionViewed(item.id) ? 0 : 1);
    saveData(StorageKey.VIEWS, views);

    document.title = item.title + ' — Real';
    // meta description dinamik
    updateMetaDescription(item.description || item.content.slice(0,150));

    app.innerHTML = '';
    const article = document.createElement('article');
    article.className = 'article';
    const header = document.createElement('header');
    header.innerHTML = `<h1>${escapeHtml(item.title)}</h1><div class="meta">${formatDate(item.publishedAt || item.createdAt)}</div>`;
    article.appendChild(header);
    if (item.featured) {
      const img = document.createElement('img');
      img.className = 'featured';
      img.loading = 'lazy';
      img.src = item.featured;
      img.alt = item.title;
      article.appendChild(img);
    }
    const content = document.createElement('div');
    content.className = 'content';
    content.innerHTML = item.content;
    article.appendChild(content);

    // Galereya
    if (item.images && item.images.length) {
      const g = document.createElement('div'); g.className='gallery';
      item.images.forEach(src => {
        const i = document.createElement('img'); i.loading='lazy'; i.src=src; g.appendChild(i);
      });
      article.appendChild(g);
    }

    // Videolar
    if (item.videos && item.videos.length) {
      item.videos.forEach(src => {
        const v = document.createElement('video'); v.controls=true; v.src=src; article.appendChild(v);
      });
    }

    // Əməliyyatlar: bəyənmə, paylaşma, baxışlar
    const actions = document.createElement('div'); actions.className='actions';
    const likeBtn = document.createElement('button'); likeBtn.className='like-btn'; likeBtn.dataset.id = item.id;
    likeBtn.innerHTML = `Bəyən • <span class="like-count">${item.likes || 0}</span>`;
    actions.appendChild(likeBtn);
    const viewsSpan = document.createElement('span'); viewsSpan.className='views'; viewsSpan.textContent = 'Baxış: ' + (views[item.id] || 0);
    actions.appendChild(viewsSpan);
    const share = document.createElement('button'); share.className='btn ghost share-btn'; share.dataset.url = location.href; share.textContent = 'Paylaş';
    actions.appendChild(share);
    article.appendChild(actions);

    // Əlaqəli xəbərlər (eyni kateqoriya)
    const related = loadData(StorageKey.NEWS, []).filter(n=>n.categoryId===item.categoryId && n.id!==item.id).slice(0,5);
    if (related.length) {
      const aside = document.createElement('aside'); aside.className='related';
      aside.innerHTML = '<h3>Əlaqəli xəbərlər</h3>';
      const ul = document.createElement('ul');
      related.forEach(r => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#/xeber/${encodeURIComponent(r.slug)}">${escapeHtml(r.title)}</a>`;
        ul.appendChild(li);
      });
      aside.appendChild(ul);
      article.appendChild(aside);
    }

    // Structured data JSON-LD əlavə et (SEO üçün)
    addJsonLd(item);

    app.appendChild(article);

    // Mark session-viewed for this id to prevent multiple increments in same session
    markSessionViewed(item.id);
  }

  /* Bəyənmə funksiyası */
  function toggleLike(id, btnEl) {
    const likes = loadData(StorageKey.LIKES, {});
    const news = loadData(StorageKey.NEWS, []);
    const item = news.find(n=>n.id===id);
    if (!item) return;
    // Bir cihazdan bir neçə dəfə bəyənməyin qarşısı alınır
    const likedIds = loadData(StorageKey.LIKES, {});
    if (likedIds[id]) {
      // artıq bəyənilibsə, götür
      delete likedIds[id];
      item.likes = Math.max(0, (item.likes || 0) - 1);
    } else {
      likedIds[id] = true;
      item.likes = (item.likes || 0) + 1;
    }
    saveData(StorageKey.LIKES, likedIds);
    // News bazasını güncəllə
    const all = loadData(StorageKey.NEWS, []);
    const idx = all.findIndex(n=>n.id===id);
    if (idx >= 0) { all[idx] = item; saveData(StorageKey.NEWS, all); }
    // UI yenilə
    const span = btnEl.querySelector('.like-count');
    if (span) span.textContent = item.likes;
  }

  /* Paylaşma: navigator.share varsa istifadə et, yoxsa pop-up */
  function shareUrl(url) {
    if (navigator.share) {
      navigator.share({ title: document.title, url }).catch(()=>alert('Paylaşma ləğv edildi.'));
    } else {
      // sadə paylaşma pəncərəsi
      const shareWindow = window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), '_blank', 'width=600,height=400');
      if (!shareWindow) alert('Pəncərə açmaq alınmadı. Brauzer blok edə bilər.');
    }
  }

  /* Bəyənilənlər səhifəsi */
  function renderFavorites() {
    const liked = loadData(StorageKey.LIKES, {});
    const all = loadData(StorageKey.NEWS, []);
    const fav = all.filter(n=>liked[n.id]);
    document.title = 'Bəyənilənlər — Real';
    app.innerHTML = '<h1>Bəyənilənlər</h1>';
    if (!fav.length) {
      const p = document.createElement('div'); p.className='card'; p.textContent='Heç bir bəyənilən yoxdur.';
      app.appendChild(p); return;
    }
    const feed = document.createElement('section'); feed.className='feed';
    fav.forEach(item => {
      const tpl = document.getElementById('card-template');
      const el = tpl.content.cloneNode(true);
      const link = el.querySelector('.card-link');
      link.href = '#/xeber/' + encodeURIComponent(item.slug);
      const media = el.querySelector('.card-media');
      if (item.featured) media.innerHTML = `<img loading="lazy" src="${item.featured}" alt="${escapeHtml(item.title)}">`;
      el.querySelector('.card-title').textContent = item.title;
      el.querySelector('.card-meta').textContent = formatDate(item.publishedAt || item.createdAt);
      feed.appendChild(el);
    });
    app.appendChild(feed);
  }

  function renderNotFound(msg) {
    document.title = 'Səhifə tapılmadı — Real';
    app.innerHTML = `<div class="card">${msg || 'Səhifə tapılmadı.'}</div>`;
  }

  // Köməkçilər
  function escapeHtml(s) {
    return String(s).replace(/[&<>\