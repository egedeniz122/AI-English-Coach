/**
 * listening.js — Listening (Dinleme) Modülü
 * 
 * AI script üretir, Web Speech API ile seslendirip
 * anlama soruları ile test eder.
 * 
 * Özellikler:
 * - Gelişmiş hız kontrolü (0.7x, 0.85x, 1x, 1.15x)
 * - Transcript göster/gizle toggle
 * - Dinleme sayacı
 * - Chrome TTS bug workaround
 */

import { generateListeningContent } from './api.js';
import { showToast, setButtonLoading, incrementStat, showSkeleton, addXP } from './app.js';

const TOPICS_LISTENING = [
  { id: 'daily life', label: '🏠 Daily Life' },
  { id: 'travel', label: '✈️ Travel' },
  { id: 'shopping', label: '🛒 Shopping' },
  { id: 'work', label: '💼 Work' },
  { id: 'weather', label: '🌤 Weather' },
  { id: 'restaurant', label: '🍽 Restaurant' },
  { id: 'school', label: '🏫 School' },
];

let listeningData = null;
let listeningAnswers = [];
let listeningSubmitted = false;
let speechSynth = window.speechSynthesis;
let currentUtterance = null;
let isPlaying = false;
let listenCount = 0;
let resumeInterval = null;

// Hız seçenekleri
const SPEEDS = [
  { rate: 0.7,  label: '🐢 Çok Yavaş', short: '0.7x' },
  { rate: 0.85, label: '🐢 Yavaş', short: '0.85x' },
  { rate: 1.0,  label: '🏃 Normal', short: '1x' },
  { rate: 1.15, label: '🐇 Hızlı', short: '1.15x' },
];
let currentSpeedIndex = 1; // Varsayılan 0.85x

export function initListening() {
  const generateBtn = document.getElementById('listening-generate-btn');
  if (!generateBtn) return;

  // Build topic chips
  const chipContainer = document.getElementById('listening-topics');
  if (chipContainer) {
    TOPICS_LISTENING.forEach((topic, i) => {
      const chip = document.createElement('button');
      chip.className = 'topic-chip' + (i === 0 ? ' active' : '');
      chip.dataset.topic = topic.id;
      chip.textContent = topic.label;
      chip.addEventListener('click', () => {
        chipContainer.querySelectorAll('.topic-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
      chipContainer.appendChild(chip);
    });
  }

  generateBtn.addEventListener('click', async () => {
    const activeTopic = document.querySelector('#listening-topics .topic-chip.active')?.dataset.topic || 'daily life';
    const level = document.getElementById('listening-level')?.value || 'B1';

    stopSpeech();
    setButtonLoading('listening-generate-btn', true, 'İçerik üretiliyor...');
    showSkeleton('listening-content', 5);
    listeningAnswers = [];
    listeningSubmitted = false;
    listenCount = 0;

    try {
      listeningData = await generateListeningContent(activeTopic, level);
      renderListeningContent(listeningData);
      incrementStat('listening');
    } catch (err) {
      document.getElementById('listening-content').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">😔</div>
          <p>İçerik üretilemedi. Tekrar deneyin.</p>
        </div>`;
      showToast(err.message, 'error');
      console.error('Listening generation error:', err);
    } finally {
      setButtonLoading('listening-generate-btn', false);
    }
  });
}

function stopSpeech() {
  if (speechSynth && isPlaying) {
    speechSynth.cancel();
    isPlaying = false;
    if (resumeInterval) {
      clearInterval(resumeInterval);
      resumeInterval = null;
    }
    updatePlayButton(false);
  }
}

function updatePlayButton(playing) {
  const playBtn = document.getElementById('listening-play-btn');
  const wave    = document.getElementById('listening-wave');
  if (playBtn) playBtn.textContent = playing ? '⏸' : '▶';
  if (wave) wave.classList.toggle('playing', playing);
}

function speakText(text) {
  if (!speechSynth) {
    showToast('Tarayıcınız ses sentezini desteklemiyor.', 'error');
    return;
  }

  speechSynth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = SPEEDS[currentSpeedIndex].rate;
  utterance.pitch = 1;

  // En iyi İngilizce sesi seç
  const voices = speechSynth.getVoices();
  const enVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'))
    || voices.find(v => v.lang.startsWith('en') && v.localService)
    || voices.find(v => v.lang.startsWith('en'))
    || null;
  if (enVoice) utterance.voice = enVoice;

  utterance.onstart = () => {
    isPlaying = true;
    updatePlayButton(true);
    listenCount++;
    updateListenCount();

    // Chrome long-text bug workaround
    resumeInterval = setInterval(() => {
      speechSynth.pause();
      speechSynth.resume();
    }, 10000);
  };

  utterance.onend = () => {
    isPlaying = false;
    updatePlayButton(false);
    if (resumeInterval) {
      clearInterval(resumeInterval);
      resumeInterval = null;
    }
  };

  utterance.onerror = () => {
    isPlaying = false;
    updatePlayButton(false);
    if (resumeInterval) {
      clearInterval(resumeInterval);
      resumeInterval = null;
    }
  };

  currentUtterance = utterance;
  speechSynth.speak(utterance);
}

function updateListenCount() {
  const el = document.getElementById('listen-count');
  if (el) el.textContent = `${listenCount}x dinlendi`;
}

function renderListeningContent(data) {
  const container = document.getElementById('listening-content');
  if (!container) return;

  const questionsHTML = data.questions?.map((q, qi) => {
    const letters = ['A', 'B', 'C', 'D'];
    const opts = q.options.map((opt, oi) => `
      <button class="option-btn" data-q="${qi}" data-o="${oi}">
        <span class="option-letter">${letters[oi]}</span>
        <span>${opt.replace(/^[A-D][\)\.\-:]?\s*/i, '')}</span>
      </button>`).join('');

    return `
      <div class="question-item" id="l-question-${qi}">
        <div class="question-text">${qi + 1}. ${q.question}</div>
        <div class="question-options" id="l-options-${qi}">${opts}</div>
        <div id="l-explanation-${qi}" style="display:none;margin-top:0.75rem;font-size:0.85rem;color:var(--text-secondary);padding:0.6rem 0.9rem;background:var(--surface-2);border-radius:6px"></div>
      </div>`;
  }).join('') || '';

  container.innerHTML = `
    <div class="audio-player">
      <div style="text-align:center">
        <div style="font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:0.4rem">
          Scenario
        </div>
        <p style="font-size:0.9rem;color:var(--text-secondary)">${data.scenario || ''}</p>
      </div>
      
      <div class="audio-wave" id="listening-wave">
        ${Array(7).fill('<div class="wave-bar"></div>').join('')}
      </div>

      <div class="audio-controls">
        <button class="btn btn-secondary" id="listening-replay-btn" title="Başa sar" style="font-size:0.85rem">
          ⟳ Başa Sar
        </button>
        <button class="btn-play" id="listening-play-btn" title="Dinle">▶</button>
        <button class="btn btn-secondary" id="listening-speed-btn" style="font-size:0.85rem;min-width:95px">
          ${SPEEDS[currentSpeedIndex].label}
        </button>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;width:100%;font-size:0.8rem;color:var(--text-muted)">
        <span id="listen-count">0x dinlendi</span>
        <span>Önce dinle, sonra soruları cevapla</span>
      </div>

      <!-- Transcript toggle -->
      <div class="transcript-toggle">
        <button class="transcript-toggle-btn" id="listening-transcript-toggle">
          📝 Transcript'i Göster
        </button>
        <div class="transcript-text" id="listening-transcript-text">
          ${data.script || ''}
        </div>
      </div>
    </div>

    <div class="questions-list">${questionsHTML}</div>
    
    ${questionsHTML ? `
      <div style="margin-top:1.25rem">
        <button class="btn btn-primary" id="listening-check-btn">✅ Cevapları Kontrol Et</button>
      </div>
    ` : ''}
    <div id="listening-score" style="margin-top:1rem"></div>
  `;

  container.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Play button
  document.getElementById('listening-play-btn')?.addEventListener('click', () => {
    if (isPlaying) {
      stopSpeech();
    } else {
      speakText(data.script || '');
    }
  });

  // Replay button
  document.getElementById('listening-replay-btn')?.addEventListener('click', () => {
    stopSpeech();
    setTimeout(() => speakText(data.script || ''), 300);
  });

  // Speed toggle (cycle through speeds)
  const speedBtn = document.getElementById('listening-speed-btn');
  speedBtn?.addEventListener('click', () => {
    currentSpeedIndex = (currentSpeedIndex + 1) % SPEEDS.length;
    speedBtn.textContent = SPEEDS[currentSpeedIndex].label;
    
    // Eğer o an çalıyorsa durdurup yeni hızla baştan başlat
    if (isPlaying) {
      stopSpeech();
      setTimeout(() => speakText(listeningData?.script || ''), 100);
    }
    
    showToast(`Hız: ${SPEEDS[currentSpeedIndex].short}`, 'info', 1500);
  });

  // Transcript toggle
  const transcriptToggle = document.getElementById('listening-transcript-toggle');
  const transcriptText = document.getElementById('listening-transcript-text');
  transcriptToggle?.addEventListener('click', () => {
    const isVisible = transcriptText.classList.toggle('visible');
    transcriptToggle.textContent = isVisible ? '📝 Transcript\'i Gizle' : '📝 Transcript\'i Göster';
  });

  // Option listeners
  container.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (listeningSubmitted) return;
      const qi = parseInt(btn.dataset.q, 10);
      listeningAnswers[qi] = parseInt(btn.dataset.o, 10);
      document.querySelectorAll(`#l-options-${qi} .option-btn`).forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  // Check answers
  document.getElementById('listening-check-btn')?.addEventListener('click', async () => {
    if (!data.questions?.length) return;
    if (data.questions.some((_, i) => listeningAnswers[i] === undefined)) {
      showToast('Lütfen tüm soruları cevaplayın.', 'warning');
      return;
    }

    listeningSubmitted = true;
    let correct = 0;

    data.questions.forEach((q, qi) => {
      const isCorrect = listeningAnswers[qi] === q.correct;
      if (isCorrect) correct++;

      document.querySelectorAll(`#l-options-${qi} .option-btn`).forEach((btn, oi) => {
        if (oi === q.correct) btn.classList.add('correct');
        else if (oi === listeningAnswers[qi] && !isCorrect) btn.classList.add('wrong');
      });

      const explEl = document.getElementById(`l-explanation-${qi}`);
      if (explEl && q.explanation) {
        explEl.style.display = 'block';
        explEl.textContent = `💡 ${q.explanation}`;
      }
    });

    const total = data.questions.length;
    if (correct > 0) {
      addXP(correct * 5, `${correct} Doğru Cevap (Listening)`);
    }
    
    const pct = Math.round((correct / total) * 100);
    const color = pct >= 75 ? 'var(--mint-400)' : pct >= 50 ? 'var(--amber-400)' : 'var(--coral-400)';
    const scoreEl = document.getElementById('listening-score');
    if (scoreEl) {
      scoreEl.innerHTML = `
        <div class="score-card">
          <div class="score-big" style="color:${color}">${correct}/${total}</div>
          <div class="score-bar">
            <div class="score-bar-fill" id="listening-score-fill" style="background:${color}"></div>
          </div>
          <div style="color:var(--text-secondary);font-size:0.9rem">${pct}% doğru</div>
          <div style="margin-top:0.5rem;font-size:0.8rem;color:var(--text-muted)">
            Toplam ${listenCount}x dinlendi
          </div>
        </div>`;

      setTimeout(() => {
        const fill = document.getElementById('listening-score-fill');
        if (fill) fill.style.width = `${pct}%`;
      }, 100);

      scoreEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    document.getElementById('listening-check-btn').style.display = 'none';

    // Save learning context for cross-feature intelligence
    try {
      const { saveLearningContext } = await import('./app.js');
      const vocabWords = (data.vocabulary || data.questions?.map(q => q.question) || []).slice(0, 5);
      saveLearningContext(data.title || 'listening exercise', vocabWords.map(v => typeof v === 'string' ? v : v.word || ''));
    } catch (e) { /* ignore */ }
  });

  // Auto-play after short delay
  setTimeout(() => speakText(data.script || ''), 600);
}
