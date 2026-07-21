/* Admin panel üçün skript — daxil olma, əlavə, redaktə, silmə */
/* Bütün xəbər mətni və bildirişlər Azərbaycan dilindədir. */

const AdminAuth = (function(){
  // Asinxron SHA-256 hash funksiyası (Web Crypto)
  async function sha256(text) {
    const enc = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  async function initLogin() {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = document.getElementById('admin-username').value.trim();
      const pass = document.getElementById('admin-password').value;
      if (!user || !pass) { alert('İstifadəçi adı və şifrə tələb olunur.'); return; }
      const admin = loadData(StorageKey.ADMIN, null);
      if (!admin) {
        // İlk yaradılma
        const hash = await sha256(pass);
        const obj = { username: user, passwordHash: hash };
        saveData(StorageKey.ADMIN, obj);
        alert('İdarəçi hesabı yaradıldı. İndi daxil ola bilərsiniz.');
        // avtomatik giriş
        sessionStorage.setItem('real_admin_session', JSON.stringify({ username: user }));
        location.href = 'dashboard.html';
        return;
      }
      // Var olan admin ilə yoxla
      if (user !== admin.username) { alert('İstifadəçi adı tapılmadı.'); return; }
      const hash = await sha256(pass);
      if (hash === admin.passwordHash) {
        sessionStorage.setItem('real_admin_session', JSON.stringify({ username: user }));
        location.href = 'dashboard.html';
      } else {
        alert('Yanlış şifrə.');
      }
    });
  }

  function protectPage() {
    const session = sessionStorage.getItem('real_admin_session');
    if (!session) {
      alert('İcazəniz yoxdur. Zəhmət olmasa admin səhifəsinə daxil olun.');
      location.href = 'login.html';
    }
  }

  function logout() {
    sessionStorage.removeItem('real_admin_session');
    location.href = 'login.html';
  }

  return { initLogin, protectPage, logout };
})();

const AdminPanel = (function(){
  let editingId = null;

  function init() {
    // Təhlükəsizlik: səhifəni qorumaq
    document.getElementById('logout-btn').addEventListener('click', () => {
      AdminAuth.logout();
    });
    document.getElementById('new-news-btn').addEventListener('click', openNewEditor);
    document.getElementById('cancel-news-btn').addEventListener('click', closeEditor);
    document.getElementById('save-news-btn').addEventListener('click', saveNews);
    document.getElementById('add-category-btn').addEventListener('click', addCategory);
    document.getElementById('delete-news-btn').addEventListener('click', deleteNews);
    document.getElementById('filter-input').addEventListener('input', filterList);
    // Fayl inputları
    document.getElementById('news-featured').addEventListener('change', handleFileToDataUrl);
    document.getElementById('news-images').addEventListener('change', handleFilesToDataUrls);
    document.getElementById('news-videos').addEventListener('change', handleFilesToDataUrls);
    // Başlanğıc render
    renderList();
    renderCategoryOptions();
  }

  function renderList(filter='') {
    const listEl = document.getElementById('news-list');
    listEl.innerHTML = '';
    const all = loadData(StorageKey.NEWS, []).slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    const filtered = all.filter(n => (n.title + ' ' + (n.description||'')).toLowerCase().includes(filter.toLowerCase()));
    filtered.forEach(item => {
      const div = document.createElement('div'); div.className='admin-item';
      div.innerHTML = `<div>
          <strong>${escapeHtml(item.title)}</strong>
          <div class="meta">${formatDate(item.publishedAt || item.createdAt)}</div>
        </div>
        <div>
          <button data-id="${item.id}" class="btn ghost edit-btn">Redaktə</button>
          <button data-id="${item.id}" class="btn danger del-btn">Sil</button>
        </div>`;
      listEl.appendChild(div);
    });
    // event delegation for edit/delete
    listEl.querySelectorAll('.edit-btn').forEach(b => b.addEventListener('click', (e)=> openEditorFor(e.target.dataset.id)));
    listEl.querySelectorAll('.del-btn').forEach(b => b.addEventListener('click', (e)=> {
      if (confirm('Xəbəri həqiqətən silmək istəyirsiniz?')) {
        removeNews(e.target.dataset.id);
      }
    }));
  }

  function filterList(e) {
    renderList(e.target.value);
  }

  function renderCategoryOptions() {
    const sel = document.getElementById('news-category');
    sel.innerHTML = '';
    const cats = loadData(StorageKey.CATEGORIES, []);
    cats.forEach(c => {
      const op = document.createElement('option'); op.value = c.id; op.textContent = c.title; sel.appendChild(op);
    });
  }

  function addCategory() {
    const input = document.getElementById('new-category-input');
    const text = input.value.trim();
    if (!text) { alert('Kateqoriya adı boş ola bilməz.'); return; }
    const cats = loadData(StorageKey.CATEGORIES, []);
    const obj = { id: uid(), title: text, slug: slugify(text) };
    cats.push(obj);
    saveData(StorageKey.CATEGORIES, cats);
    input.value = '';
    renderCategoryOptions();
    alert('Kateqoriya əlavə edildi.');
  }

  function openNewEditor() {
    editingId = null;
    document.getElementById('editor-title').textContent = 'Yeni xəbər';
    document.getElementById('editor-form').reset();
    document.getElementById('delete-news-btn').classList.add('hidden');
    document.getElementById('editor-section').classList.remove('hidden');
  }

  function openEditorFor(id) {
    editingId = id;
    const all = loadData(StorageKey.NEWS, []);
    const item = all.find(n=>n.id===id);
    if (!item) return alert('Xəbər tapılmadı.');
    document.getElementById('editor-title').textContent = 'Xəbəri redaktə et';
    document.getElementById('news-title').value = item.title;
    document.getElementById('news-description').value = item.description || '';
    document.getElementById('news-content').value = item.content || '';
    document.getElementById('news-tags').value = (item.tags||[]).join(', ');
    document.getElementById('news-published').value = item.publishedAt ? new Date(item.publishedAt).toISOString().slice(0,16) : '';
    renderCategoryOptions();
    document.getElementById('news-category').value = item.categoryId;
    // feature, images, videos məlumatları saxlanır formda gizli (preview göstərilə bilər)
    // Preview üçün sadə xəbərdarlıq
    document.getElementById('editor-section').classList.remove('hidden');
    document.getElementById('delete-news-btn').classList.remove('hidden');
    // Saxla preview məlumatı datasetdə
    document.getElementById('editor-form').dataset.featured = item.featured || '';
    document.getElementById('editor-form').dataset.images = JSON.stringify(item.images || []);
    document.getElementById('editor-form').dataset.videos = JSON.stringify(item.videos || []);
  }

  function closeEditor() {
    document.getElementById('editor-section').classList.add('hidden');
    editingId = null;
  }

  // Faylları base64 DataURL formatına çevirən köməkçi
  function handleFileToDataUrl(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      document.getElementById('editor-form').dataset.featured = ev.target.result;
      alert('Öne çıxan şəkil yükləndi (local). Saxladıqda LocalStorage-a yazılacaq.');
    };
    reader.readAsDataURL(file);
  }
  function handleFilesToDataUrls(e) {
    const files = Array.from(e.target.files);
    const promises = files.map(f => new Promise((res) => {
      const r = new FileReader();
      r.onload = ev => res(ev.target.result);
      r.readAsDataURL(f);
    }));
    Promise.all(promises).then(dataUrls => {
      // mövcud massivə əlavə et
      const key = e.target.id === 'news-images' ? 'images' : 'videos';
      const cur = JSON.parse(document.getElementById('editor-form').dataset[key] || '[]');
      const merged = cur.concat(dataUrls);
      document.getElementById('editor-form').dataset[key] = JSON.stringify(merged);
      alert((key === 'images' ? 'Şəkillər' : 'Videolar') + ' yükləndi (local). Saxladıqda LocalStorage-a yazılacaq.');
    });
  }

  function saveNews(e) {
    e.preventDefault();
    const title = document.getElementById('news-title').value.trim();
    const description = document.getElementById('news-description').value.trim();
    const content = document.getElementById('news-content').value.trim();
    const tags = document.getElementById('news-tags').value.split(',').map(s=>s.trim()).filter(Boolean);
    const categoryId = document.getElementById('news-category').value;
    const publishedAt = document.getElementById('news-published').value ? new Date(document.getElementById('news-published').value).toISOString() : null;
    if (!title || !content) { alert('Başlıq və məzmun tələb olunur.'); return; }
    const featured = document.getElementById('editor-form').dataset.featured || '';
    const images = JSON.parse(document.getElementById('editor-form').dataset.images || '[]');
    const videos = JSON.parse(document.getElementById('editor-form').dataset.videos || '[]');

    const all = loadData(StorageKey.NEWS, []);
    if (editingId) {
      const idx = all.findIndex(n=>n.id===editingId);
      if (idx < 0) return alert('Redaktə ediləcək xəbər tapılmadı.');
      all[idx] = Object.assign(all[idx], {
        title, description, content, tags, categoryId, publishedAt, featured, images, videos, slug: slugify(title), updatedAt: new Date().toISOString()
      });
      saveData(StorageKey.NEWS, all);
      alert('Xəbər yeniləndi.');
    } else {
      const obj = {
        id: uid(),
        title, description, content, tags, categoryId, publishedAt, featured, images, videos,
        slug: slugify(title),
        createdAt: new Date().toISOString(),
        views: 0, likes: 0
      };
      all.push(obj);
      saveData(StorageKey.NEWS, all);
      alert('Xəbər əlavə edildi.');
    }
    // yeniləmələr
    renderList();
    closeEditor();
  }

  function deleteNews() {
    if (!editingId) return;
    if (!confirm('Xəbəri həqiqətən silmək istəyirsiniz?')) return;
    removeNews(editingId);
    closeEditor();
  }

  function removeNews(id) {
    let all = loadData(StorageKey.NEWS, []);
    all = all.filter(n=>n.id!==id);
    saveData(StorageKey.NEWS, all);
    alert('Xəbər silindi.');
    renderList();
  }

  // Escape HTML
  function escapeHtml(s) {
    return String(s).replace(/[&<>\