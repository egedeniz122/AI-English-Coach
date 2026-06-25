/**
 * app.js — Ana Uygulama Yöneticisi
 * 
 * - Sekme navigasyonunu yönetir (desktop + mobile)
 * - İstatistikleri localStorage'da saklar
 * - Toast bildirimleri gösterir
 * - API key modal'ını yönetir
 * - Skeleton loading, animasyonlar ve yardımcı fonksiyonlar
 */

import { saveApiKey, hasApiKey, clearApiKey } from './api.js';
import { initWriting } from './writing.js';
import { initReading } from './reading.js';
import { initListening } from './listening.js';
import { initSpeaking } from './speaking.js';
import { initDashboard } from './dashboard.js';
import { initVocabulary } from './vocabulary.js';

// ============================================================
// STATE
// ============================================================
const state = {
  activeModule: 'home',
  stats: loadStats(),
};

function loadStats() {
  try {
    return JSON.parse(localStorage.getItem('ec_stats') || '{}');
  } catch {
    return {};
  }
}

export function saveStats(module, key, value) {
  if (!state.stats[module]) state.stats[module] = {};
  state.stats[module][key] = value;
  localStorage.setItem('ec_stats', JSON.stringify(state.stats));
  updateStatBar();
}

export function incrementStat(module) {
  const key = `${module}_count`;
  const current = parseInt(localStorage.getItem(key) || '0', 10);
  localStorage.setItem(key, current + 1);
  updateStatBar();
  checkAchievements();
}

// ============================================================
// LEARNING CONTEXT MANAGER (Cross-Feature Intelligence)
// ============================================================
export function saveLearningContext(topic, vocabArray) {
  try {
    const context = {
      lastTopic: topic,
      lastVocab: vocabArray,
      timestamp: Date.now()
    };
    localStorage.setItem('ec_learning_context', JSON.stringify(context));
  } catch (e) {}
}

export function getLearningContext() {
  try {
    const ctx = JSON.parse(localStorage.getItem('ec_learning_context'));
    if (!ctx) return null;
    // Eğer 1 günden eskiyse, context'i unut
    if (Date.now() - ctx.timestamp > 24 * 60 * 60 * 1000) return null;
    return ctx;
  } catch (e) {
    return null;
  }
}

// ============================================================
// GAMIFICATION ENGINE
// ============================================================
function checkAchievements() {
  const xp = parseInt(localStorage.getItem('ec_xp') || '0', 10);
  const w = parseInt(localStorage.getItem('writing_count') || '0', 10);
  const r = parseInt(localStorage.getItem('reading_count') || '0', 10);
  const l = parseInt(localStorage.getItem('listening_count') || '0', 10);
  const s = parseInt(localStorage.getItem('speaking_count') || '0', 10);
  const total = w + r + l + s;

  let vocabCount = 0;
  try {
    const vocab = JSON.parse(localStorage.getItem('ec_vocabulary') || '[]');
    vocabCount = vocab.length;
  } catch (e) { vocabCount = 0; }

  const unlocked = JSON.parse(localStorage.getItem('ec_unlocked_achievements') || '[]');

  const checkAndUnlock = (id, condition, title, desc) => {
    if (condition && !unlocked.includes(id)) {
      unlocked.push(id);
      localStorage.setItem('ec_unlocked_achievements', JSON.stringify(unlocked));
      showToast(`🏆 Başarım Açıldı: ${title}`, 'success');
      // If dashboard is open, re-render badges
      if (typeof window.renderBadges === 'function') window.renderBadges();
    }
  };

  // Beginner
  checkAndUnlock('first_step', total >= 1, 'İlk Adım', 'İlk alıştırmanı tamamladın!');
  checkAndUnlock('first_word', vocabCount >= 1, 'İlk Kelime', 'Sözlüğüne ilk kelimeni ekledin!');
  checkAndUnlock('first_speaking', s >= 1, 'İlk Konuşma', 'İlk konuşma pratiğini yaptın!');
  checkAndUnlock('first_listening', l >= 1, 'İlk Dinleme', 'İlk dinleme pratiğini yaptın!');

  // Progress
  checkAndUnlock('progress_reading', r >= 5, 'Kitap Kurdu', '5 Okuma alıştırması tamamladın.');
  checkAndUnlock('progress_writing', w >= 10, 'Yazar Adayı', '10 Yazma alıştırması tamamladın.');
  checkAndUnlock('progress_listening', l >= 5, 'İyi Dinleyici', '5 Dinleme alıştırması tamamladın.');
  checkAndUnlock('progress_speaking', s >= 10, 'Hatip', '10 Konuşma pratiği yaptın.');
  checkAndUnlock('progress_vocab_10', vocabCount >= 10, 'Kelime Avcısı', 'Sözlüğüne 10 kelime ekledin.');
  
  // Mixed
  checkAndUnlock('versatile_learner', (w >= 1 && r >= 1 && l >= 1 && s >= 1), 'Çok Yönlü', 'Tüm modülleri (Yazma, Okuma, Dinleme, Konuşma) en az bir kez kullandın!');
  checkAndUnlock('progress_vocab_50', vocabCount >= 50, 'Sözlük Gibi', 'Sözlüğüne tam 50 kelime ekledin.');

  // Advanced / XP
  checkAndUnlock('xp_100', xp >= 100, 'Yıldız Öğrenci', '100 XP puana ulaştın!');
  checkAndUnlock('xp_250', xp >= 250, 'Çalışkan', '250 XP puana ulaştın!');
  checkAndUnlock('xp_500', xp >= 500, 'Usta Öğrenci', '500 XP puana ulaştın!');
}

// ============================================================
// NAVIGATION (Desktop tabs + Mobile bottom nav + Cards)
// ============================================================
function showModule(name) {
  // Landing sayfasını gizle/göster
  const landing = document.getElementById('landing');
  if (landing) landing.style.display = name === 'home' ? 'block' : 'none';

  // Tüm modül view'larını gizle
  document.querySelectorAll('.module-view').forEach(v => v.classList.remove('active'));

  // Aktif modülü göster
  if (name !== 'home') {
    const view = document.getElementById(`module-${name}`);
    if (view) view.classList.add('active');
  }

  // Desktop nav tab'larını güncelle
  document.querySelectorAll('.nav-tab').forEach(tab => {
    const isActive = tab.dataset.module === name;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive);
  });

  // Mobile nav tab'larını güncelle
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.module === name);
  });

  state.activeModule = name;
}

// Make showModule globally accessible for logo click and UI buttons
window.showModule = showModule;

// ============================================================
// STATS BAR (Animated count-up)
// ============================================================
function updateStatBar() {
  const counts = {
    writing: parseInt(localStorage.getItem('writing_count') || '0', 10),
    reading: parseInt(localStorage.getItem('reading_count') || '0', 10),
    listening: parseInt(localStorage.getItem('listening_count') || '0', 10),
    speaking: parseInt(localStorage.getItem('speaking_count') || '0', 10),
  };

  const animate = (el, target) => {
    if (!el) return;
    const current = parseInt(el.textContent, 10) || 0;
    if (current === target) return;
    
    // Animate count up/down
    const duration = 400;
    const start = performance.now();
    
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(current + (target - current) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    
    requestAnimationFrame(tick);
  };

  animate(document.getElementById('stat-writing'), counts.writing);
  animate(document.getElementById('stat-reading'), counts.reading);
  animate(document.getElementById('stat-listening'), counts.listening);
  animate(document.getElementById('stat-speaking'), counts.speaking);
}

// ============================================================
// GAMIFICATION (XP & Streak)
// ============================================================
function updateGamificationUI() {
  const xp = parseInt(localStorage.getItem('ec_xp') || '0', 10);
  const streakData = JSON.parse(localStorage.getItem('ec_streak') || '{"streak":0, "lastDate":null}');
  const lessonsDone = parseInt(localStorage.getItem('ec_lessons') || '0', 10);
  
  const xpEl = document.getElementById('stat-xp');
  const streakEl = document.getElementById('stat-streak');
  const lessonsEl = document.getElementById('stat-lessons');
  const goalEl = document.getElementById('stat-goal');
  const streakIcon = document.getElementById('streak-icon');
  
  if (xpEl) xpEl.textContent = xp.toLocaleString();
  if (streakEl) streakEl.textContent = streakData.streak;
  if (lessonsEl) lessonsEl.textContent = lessonsDone;
  
  // Weekly goal — track XP earned this week
  const weekStart = getWeekStart();
  const weeklyXPData = JSON.parse(localStorage.getItem('ec_weekly_xp') || '{}');
  const weeklyXP = (weeklyXPData.week === weekStart) ? (weeklyXPData.xp || 0) : 0;
  const goalPct = Math.min(Math.round((weeklyXP / 500) * 100), 100);
  if (goalEl) goalEl.textContent = `${goalPct}%`;

  if (streakIcon) {
    if (streakData.streak > 0) {
      streakIcon.style.animation = 'pulse 2s infinite';
    } else {
      streakIcon.style.animation = 'none';
      streakIcon.style.filter = 'grayscale(100%) opacity(0.5)';
    }
  }
}

export function checkStreak() {
  const today = new Date().toISOString().split('T')[0];
  let streakData = JSON.parse(localStorage.getItem('ec_streak') || '{"streak":0, "lastDate":null}');
  
  if (streakData.lastDate === today) {
    // Zaten bugün giriş yapılmış, streak aynı kalır
  } else if (streakData.lastDate) {
    const lastDateObj = new Date(streakData.lastDate);
    const todayObj = new Date(today);
    const diffTime = Math.abs(todayObj - lastDateObj);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays === 1) {
      // Ardışık gün, streak artar
      streakData.streak += 1;
      showToast(`🔥 Streak devam ediyor: ${streakData.streak} gün!`, 'success');
    } else {
      // Streak bozuldu
      streakData.streak = 1;
      showToast(`🔄 Streak sıfırlandı. Yeniden 1. gün!`, 'info');
    }
    streakData.lastDate = today;
  } else {
    // İlk giriş
    streakData.streak = 1;
    streakData.lastDate = today;
  }
  
  localStorage.setItem('ec_streak', JSON.stringify(streakData));
  updateGamificationUI();
}

// Helper: Get Monday of current week as ISO string (for weekly goal tracking)
function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.getFullYear(), now.getMonth(), diff).toISOString().slice(0, 10);
}

export function addXP(amount, reason = '') {
  const currentXP = parseInt(localStorage.getItem('ec_xp') || '0', 10);
  const newXP = currentXP + amount;
  localStorage.setItem('ec_xp', newXP);
  
  // Increment lessons done
  const currentLessons = parseInt(localStorage.getItem('ec_lessons') || '0', 10);
  localStorage.setItem('ec_lessons', currentLessons + 1);

  // Track weekly XP
  const weekStart = getWeekStart();
  const weeklyData = JSON.parse(localStorage.getItem('ec_weekly_xp') || '{}');
  if (weeklyData.week === weekStart) {
    weeklyData.xp = (weeklyData.xp || 0) + amount;
  } else {
    weeklyData.week = weekStart;
    weeklyData.xp = amount;
  }
  localStorage.setItem('ec_weekly_xp', JSON.stringify(weeklyData));

  updateGamificationUI();
  
  // XP Toast
  if (reason) {
    showToast(`⭐ +${amount} XP kazanıldı! (${reason})`, 'success', 2500);
  }
  
  // Evaluate achievements
  checkAchievements();
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span style="font-weight:600">${icons[type] || 'ℹ'}</span> ${message}`;

  // Set progress bar duration
  toast.style.setProperty('--toast-duration', `${duration}ms`);

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============================================================
// API KEY MODAL
// ============================================================
function openApiKeyModal() {
  const modal = document.getElementById('api-key-modal');
  if (modal) modal.classList.add('visible');
}

function closeApiKeyModal() {
  const modal = document.getElementById('api-key-modal');
  if (modal) modal.classList.remove('visible');
}

function setupApiKeyModal() {
  const modal = document.getElementById('api-key-modal');
  const input = document.getElementById('api-key-input');
  const saveBtn = document.getElementById('save-api-key');
  const cancelBtn = document.getElementById('cancel-api-key');
  const settingsBtn = document.getElementById('settings-btn');

  // Ayarlar butonuna basılınca aç
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      input.value = localStorage.getItem('gemini_api_key') || '';
      modal.classList.add('visible');
    });
  }

  if (cancelBtn) cancelBtn.addEventListener('click', closeApiKeyModal);

  // Close on overlay click
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeApiKeyModal();
    });
  }

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeApiKeyModal();
  });

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const key = input?.value?.trim();
      if (!key) {
        showToast('Lütfen geçerli bir API anahtarı girin.', 'error');
        return;
      }
      if (!(key.length > 25 && (key.startsWith('AIza') || key.startsWith('AQ.')))) {
        showToast('HATA: Geçersiz Gemini API Anahtarı. Anahtar "AIza" ile başlamalıdır.', 'error');
        return;
      }

      saveApiKey(key);
      closeApiKeyModal();
      showToast('Google Gemini API anahtarı başarıyla kaydedildi! 🎉', 'success');
    });
  }

  // Enter to save
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveBtn?.click();
    });
  }

  // İlk açılışta API key yoksa modal'ı göster
  setTimeout(() => {
    if (!hasApiKey()) openApiKeyModal();
  }, 800);
}

// ============================================================
// CHARACTER COUNTER
// ============================================================
export function setupCharCounter(textareaId, counterId, max = 500) {
  const ta = document.getElementById(textareaId);
  const counter = document.getElementById(counterId);
  if (!ta || !counter) return;

  ta.addEventListener('input', () => {
    const len = ta.value.length;
    counter.textContent = `${len} / ${max}`;
    counter.style.color = len > max * 0.9 ? 'var(--coral-400)' : 'var(--text-muted)';
  });
}

// ============================================================
// LOADING HELPER
// ============================================================
export function setButtonLoading(btnId, loading, text = '') {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.dataset.originalHtml = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span><span class="btn-text">${text || 'İşleniyor...'}</span>`;
    btn.classList.add('btn-loading');
  } else {
    btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
    btn.classList.remove('btn-loading');
  }
}

// ============================================================
// SKELETON LOADING
// ============================================================
export function showSkeleton(containerId, lines = 4) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let html = '<div class="skeleton-loading" style="padding:1.25rem">';
  html += '<div class="skeleton skeleton-title"></div>';
  for (let i = 0; i < lines; i++) {
    html += `<div class="skeleton skeleton-line" style="width:${85 - i * 10}%"></div>`;
  }
  html += '<div class="skeleton skeleton-block" style="margin-top:1rem"></div>';
  html += '</div>';

  container.innerHTML = html;
}

// ============================================================
// RENDER FEEDBACK CARD (Writing & Speaking ortak)
// ============================================================
export function renderFeedbackCard(data, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const scoreClass = data.score === 'good' ? 'good' : data.score === 'fair' ? 'fair' : 'poor';
  const scoreLabel = { good: '✓ Harika!', fair: '~ Geliştirilmeli', poor: '✗ Hatalar Var' }[data.score] || '';

  const errorsHTML = data.errors?.length
    ? data.errors.map(e => `
        <div class="error-highlight" style="margin-bottom:0.5rem">
          <strong style="color:var(--coral-400)">"${e.original}"</strong>
          → <strong style="color:var(--mint-400)">"${e.correction}"</strong>
          ${e.category ? `<span style="display:inline-block;margin-left:0.5rem;font-size:0.7rem;padding:2px 8px;background:var(--surface-3);border-radius:100px;color:var(--text-muted)">${e.category}</span>` : ''}
          <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:4px">${e.explanation}</div>
        </div>`).join('')
    : '<p style="color:var(--mint-400);font-size:0.9rem">🎉 Hata bulunamadı!</p>';

  container.innerHTML = `
    <div class="feedback-card">
      <div class="feedback-header">
        <span class="ai-badge">🤖 AI Coach</span>
        <span class="score-badge ${scoreClass}">${scoreLabel}</span>
        ${data.level_estimate ? `<span class="level-badge">📊 ${data.level_estimate}</span>` : ''}
      </div>
      <div class="feedback-body">
        ${data.corrected ? `
          <div class="feedback-section">
            <div class="feedback-section-label">
              <span class="label-dot" style="--dot-color:var(--mint-400)"></span>
              Düzeltilmiş Cümle
            </div>
            <div class="corrected-sentence">${data.corrected}</div>
          </div>` : ''}
        
        <div class="feedback-section">
          <div class="feedback-section-label">
            <span class="label-dot" style="--dot-color:var(--coral-400)"></span>
            Hatalar & Açıklamalar
          </div>
          ${errorsHTML}
        </div>

        ${data.detailed_analysis ? `
          <div class="feedback-section">
            <div class="feedback-section-label">
              <span class="label-dot" style="--dot-color:var(--violet-400)"></span>
              Detaylı Analiz
            </div>
            <div style="display:flex;flex-direction:column;gap:0.75rem;margin-top:0.5rem;">
              ${data.detailed_analysis.grammar ? `<div style="font-size:0.85rem;color:var(--text-secondary)"><strong>Gramer:</strong> ${data.detailed_analysis.grammar}</div>` : ''}
              ${data.detailed_analysis.vocabulary ? `<div style="font-size:0.85rem;color:var(--text-secondary)"><strong>Kelime:</strong> ${data.detailed_analysis.vocabulary}</div>` : ''}
              ${data.detailed_analysis.fluency ? `<div style="font-size:0.85rem;color:var(--text-secondary)"><strong>Akıcılık:</strong> ${data.detailed_analysis.fluency}</div>` : ''}
              ${data.detailed_analysis.naturalness ? `<div style="font-size:0.85rem;color:var(--text-secondary)"><strong>Doğallık:</strong> ${data.detailed_analysis.naturalness}</div>` : ''}
            </div>
          </div>` : ''}

        ${data.suggested_vocabulary && data.suggested_vocabulary.length ? `
          <div class="feedback-section">
            <div class="feedback-section-label">
              <span class="label-dot" style="--dot-color:var(--accent-reading)"></span>
              Kelime Önerileri (Bunu da Öğren)
            </div>
            <div style="display:flex;flex-direction:column;gap:0.5rem;margin-top:0.5rem;">
              ${data.suggested_vocabulary.map(v => {
                const safeW = v.word.replace(/'/g, "\\'");
                const safeD = v.definition.replace(/'/g, "\\'");
                return `
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--surface-2); padding:0.5rem 0.75rem; border-radius:var(--radius-md); font-size:0.85rem;">
                  <div>
                    <strong style="color:var(--text-primary)">${v.word}</strong>: <span style="color:var(--text-secondary)">${v.definition}</span>
                  </div>
                  <button class="btn btn-ghost" title="Kelime Defterine Ekle" style="padding:4px 8px; font-size:0.8rem; background:var(--surface-3); border-radius:6px; color:var(--accent-reading);" onclick="window.ecAddWord('${safeW}', '${safeD}')">➕ Ekle</button>
                </div>
                `;
              }).join('')}
            </div>
          </div>` : ''}

        ${data.alternatives && data.alternatives.length ? `
          <div class="feedback-section">
            <div class="feedback-section-label">
              <span class="label-dot" style="--dot-color:var(--sky-400)"></span>
              Alternatif Kullanımlar
            </div>
            ${data.alternatives.map((alt, i) => `<div class="alternative-sentence" style="margin-bottom:0.4rem">${i + 1}. ${alt}</div>`).join('')}
          </div>` : data.alternative ? `
          <div class="feedback-section">
            <div class="feedback-section-label">
              <span class="label-dot" style="--dot-color:var(--sky-400)"></span>
              Daha Doğal Alternatif
            </div>
            <div class="alternative-sentence">${data.alternative}</div>
          </div>` : ''}

        ${data.positive_feedback ? `
          <div style="margin-top:1rem;padding:0.75rem 1rem;background:rgba(52,211,153,0.04);border-radius:8px;font-size:0.9rem;color:var(--text-secondary)">
            💡 ${data.positive_feedback}
          </div>` : ''}
      </div>
    </div>`;
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

function setupThemeToggle() {
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (!themeBtn) return;

  // Kaydedilmiş temayı uygula
  let savedTheme = localStorage.getItem('ec_theme');
  if (!savedTheme) {
    savedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  applyTheme(savedTheme);
  themeBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
  themeBtn.title = savedTheme === 'dark' ? 'Açık Moda Geç' : 'Karanlık Moda Geç';

  themeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('ec_theme', newTheme);
    themeBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    themeBtn.title = newTheme === 'dark' ? 'Açık Moda Geç' : 'Karanlık Moda Geç';
  });
}

// ============================================================
// BOOTSTRAP
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  setupThemeToggle();
  
  // Listen for Demo Mode fallback events from api.js
  window.addEventListener('ec_demo_mode', (e) => {
    showToast(e.detail || 'Demo Mode Aktif (API Hatası)', 'warning', 5000);
  });

  // Listen for Invalid/Missing API Key
  window.addEventListener('ec_invalid_key', () => {
    openApiKeyModal();
    showToast('Lütfen geçerli bir Gemini API anahtarı girin.', 'error', 4000);
  });

  // Logo click → home
  document.getElementById('logo-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    showModule('home');
  });

  // Desktop nav tab click events
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => showModule(tab.dataset.module));
  });

  // Mobile bottom nav click events
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => showModule(btn.dataset.module));
  });

  // Landing module card clicks
  document.querySelectorAll('.module-card').forEach(card => {
    const handler = () => showModule(card.dataset.module);
    card.addEventListener('click', handler);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handler();
      }
    });
  });

  // Ripple effect on buttons
  document.addEventListener('mousedown', (e) => {
    const btn = e.target.closest('.btn');
    if (btn) {
      const rect = btn.getBoundingClientRect();
      btn.style.setProperty('--ripple-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
      btn.style.setProperty('--ripple-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
    }
  });

  // Setup
  setupApiKeyModal();
  updateStatBar();
  checkStreak();
  updateGamificationUI();

  // Initialize all modules
  initWriting();
  initReading();
  initListening();
  initSpeaking();
  initDashboard();
  initVocabulary();

  // Show home
  showModule('home');
});
