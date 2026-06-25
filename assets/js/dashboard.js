/**
 * dashboard.js — İstatistik ve Başarımlar Modülü
 * 
 * LocalStorage'dan ders tamamlama verilerini okur ve 
 * görsel çubuk grafikler ile başarımları (rozetleri) ekrana çizer.
 */

export function initDashboard() {
  const tab = document.querySelector('.nav-tab[data-module="dashboard"]');
  const mobileTab = document.querySelector('.mobile-nav-btn[data-module="dashboard"]');

  const updateDashboard = () => {
    renderCharts();
    renderBadges();
  };

  if (tab) tab.addEventListener('click', updateDashboard);
  if (mobileTab) mobileTab.addEventListener('click', updateDashboard);
}

function getStat(key) {
  return parseInt(localStorage.getItem(key) || '0', 10);
}

function renderCharts() {
  const container = document.getElementById('dashboard-charts');
  if (!container) return;

  const stats = [
    { label: 'Writing Practice', count: getStat('writing_count'), color: 'var(--accent-writing, #3b82f6)', max: 20 },
    { label: 'Reading Practice', count: getStat('reading_count'), color: 'var(--accent-reading, #10b981)', max: 20 },
    { label: 'Listening Practice', count: getStat('listening_count'), color: 'var(--accent-listening, #f59e0b)', max: 20 },
    { label: 'Speaking Practice', count: getStat('speaking_count'), color: 'var(--accent-speaking, #ef4444)', max: 20 }
  ];

  // En yüksek olanı bulup ölçeklendir
  const highest = Math.max(...stats.map(s => s.count), 5); // min scale 5

  container.innerHTML = stats.map(stat => {
    const percentage = Math.min((stat.count / highest) * 100, 100);
    return `
      <div class="chart-row" style="display:flex; flex-direction:column; gap:0.5rem;">
        <div style="display:flex; justify-content:space-between; font-size:0.9rem; color:var(--text-secondary); font-weight:600;">
          <span>${stat.label}</span>
          <span>${stat.count} tamamlandı</span>
        </div>
        <div style="width:100%; height:12px; background:var(--surface-3); border-radius:6px; overflow:hidden;">
          <div style="width:${percentage}%; height:100%; background:${stat.color}; border-radius:6px; transition:width 1s ease;"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderBadges() {
  const container = document.getElementById('dashboard-badges');
  if (!container) return;

  const unlocked = JSON.parse(localStorage.getItem('ec_unlocked_achievements') || '[]');

  const BADGES = [
    { id: 'first_step', icon: '🐣', title: 'İlk Adım', desc: 'İlk İngilizce dersini tamamla.' },
    { id: 'first_word', icon: '📝', title: 'İlk Kelime', desc: 'Sözlüğüne ilk kelimeni ekle.' },
    { id: 'first_speaking', icon: '🎤', title: 'İlk Konuşma', desc: 'İlk konuşma pratiğini yap.' },
    { id: 'first_listening', icon: '🎧', title: 'İlk Dinleme', desc: 'İlk dinleme pratiğini yap.' },
    { id: 'progress_reading', icon: '📚', title: 'Kitap Kurdu', desc: '5 Okuma alıştırması tamamla.' },
    { id: 'progress_writing', icon: '✍️', title: 'Yazar Adayı', desc: '10 Yazma alıştırması tamamla.' },
    { id: 'progress_listening', icon: '👂', title: 'İyi Dinleyici', desc: '5 Dinleme alıştırması tamamla.' },
    { id: 'progress_speaking', icon: '🗣️', title: 'Hatip', desc: '10 Konuşma pratiği yap.' },
    { id: 'progress_vocab_10', icon: '🔎', title: 'Kelime Avcısı', desc: 'Sözlüğüne 10 kelime ekle.' },
    { id: 'progress_vocab_50', icon: '🗂️', title: 'Sözlük Gibi', desc: 'Sözlüğüne 50 kelime ekle.' },
    { id: 'versatile_learner', icon: '🔄', title: 'Çok Yönlü', desc: 'Tüm becerileri (Yazma, Okuma, Dinleme, Konuşma) kullan.' },
    { id: 'xp_100', icon: '⭐', title: 'Yıldız Öğrenci', desc: '100 XP puana ulaş.' },
    { id: 'xp_250', icon: '🎯', title: 'Çalışkan', desc: '250 XP puana ulaş.' },
    { id: 'xp_500', icon: '🏆', title: 'Usta Öğrenci', desc: '500 XP puana ulaş.' },
  ];

  container.innerHTML = BADGES.map(badge => {
    const isUnlocked = unlocked.includes(badge.id);
    return `
    <div class="module-card" style="opacity: ${isUnlocked ? '1' : '0.5'}; filter: ${isUnlocked ? 'none' : 'grayscale(1)'}; cursor:default; transform:none;">
      <div class="module-card-header">
        <div class="card-icon-box" style="background:var(--surface-2); font-size:2rem;">${badge.icon}</div>
        ${isUnlocked ? '<span class="xp-badge" style="background:#10b981; color:#fff;">Açıldı</span>' : '<span class="xp-badge" style="background:var(--surface-3); color:var(--text-muted);">Kilitli</span>'}
      </div>
      <div class="card-title">${badge.title}</div>
      <div class="card-desc" style="font-size:0.85rem;">${badge.desc}</div>
    </div>
  `}).join('');
}
window.renderBadges = renderBadges;
