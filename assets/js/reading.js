/**
 * reading.js — Reading (Okuma) Modülü
 * 
 * - AI ile B1-B2 seviyesinde okuma metni üretir
 * - 4 çoktan seçmeli anlama sorusu gösterir
 * - Kelime hover ile Türkçe tanım gösterimi
 * - Metni TTS ile sesli okuma
 * - Animasyonlu skor gösterimi
 */

import { generateReadingPassage } from './api.js';
import { showToast, setButtonLoading, incrementStat, showSkeleton, addXP } from './app.js';

const TOPICS = [
  { id: 'technology', label: '💻 Technology' },
  { id: 'environment', label: '🌿 Environment' },
  { id: 'health', label: '❤️ Health' },
  { id: 'travel', label: '✈️ Travel' },
  { id: 'culture', label: '🎭 Culture' },
  { id: 'science', label: '🔬 Science' },
  { id: 'education', label: '📚 Education' },
  { id: 'sports', label: '⚽ Sports' },
  { id: 'food', label: '🍕 Food' },
  { id: 'history', label: '🏛 History' },
];

let currentPassage = null;
let answers = [];
let submitted = false;

export function initReading() {
  const generateBtn = document.getElementById('reading-generate-btn');
  if (!generateBtn) return;

  // Build topic chips
  const chipContainer = document.getElementById('reading-topics');
  if (chipContainer) {
    TOPICS.forEach(topic => {
      const chip = document.createElement('button');
      chip.className = 'topic-chip' + (topic.id === 'technology' ? ' active' : '');
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
    const activeTopic = document.querySelector('#reading-topics .topic-chip.active')?.dataset.topic || 'technology';
    const level = document.getElementById('reading-level')?.value || 'B1';

    setButtonLoading('reading-generate-btn', true, 'Metin üretiliyor...');
    showSkeleton('reading-content', 6);
    submitted = false;
    answers = [];

    try {
      currentPassage = await generateReadingPassage(activeTopic, level);
      renderPassage(currentPassage);
      incrementStat('reading');
    } catch (err) {
      document.getElementById('reading-content').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">😔</div>
          <p>Metin üretilemedi. Tekrar deneyin.</p>
        </div>`;
      showToast(err.message, 'error');
      console.error('Reading generation error:', err);
    } finally {
      setButtonLoading('reading-generate-btn', false);
    }
  });
}

// Sesli okuma (TTS)
function speakPassage(text) {
  const synth = window.speechSynthesis;
  if (!synth) {
    showToast('Tarayıcınız ses sentezini desteklemiyor.', 'error');
    return;
  }

  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.85;

  const voices = synth.getVoices();
  const enVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'))
    || voices.find(v => v.lang.startsWith('en'))
    || null;
  if (enVoice) utterance.voice = enVoice;

  // Chrome long-text bug workaround
  let resumeInterval;
  utterance.onstart = () => {
    resumeInterval = setInterval(() => {
      synth.pause();
      synth.resume();
    }, 10000);
  };
  utterance.onend = () => clearInterval(resumeInterval);
  utterance.onerror = () => clearInterval(resumeInterval);

  synth.speak(utterance);
}

function renderPassage(data) {
  const container = document.getElementById('reading-content');
  if (!container) return;

  // Vocabulary — kelime tooltip'leri
  const vocabHTML = data.vocabulary?.length
    ? `<div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border)">
        <p style="font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:0.6rem">📖 Vocabulary</p>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
          ${data.vocabulary.map(v => {
            const safeW = v.word.replace(/'/g, "\\'");
            const safeD = v.definition.replace(/'/g, "\\'");
            return `
            <div style="display:inline-flex; align-items:center; background:var(--surface-2); border:1px solid var(--border); border-radius:6px; overflow:hidden; transition:all 0.2s;">
              <span title="${v.definition}${v.example ? '\n📝 ' + v.example : ''}" 
                    style="cursor:help; padding:5px 8px; font-size:0.85rem; color:var(--text-secondary); font-weight:600;">📖 ${v.word}</span>
              <button class="btn btn-ghost" title="Kelime Defterine Ekle" style="padding:5px 8px; border-left:1px solid var(--border); border-radius:0; color:var(--accent-reading); background:var(--surface-3);" onclick="window.ecAddWord('${safeW}', '${safeD}')">➕ Ekle</button>
            </div>`;
          }).join('')}
        </div>
      </div>`
    : '';

  // Sorular
  const questionsHTML = data.questions?.map((q, qi) => {
    const optionLetters = ['A', 'B', 'C', 'D'];
    const optionsHTML = q.options.map((opt, oi) => `
      <button class="option-btn" data-q="${qi}" data-o="${oi}">
        <span class="option-letter">${optionLetters[oi]}</span>
        <span>${opt.replace(/^[A-D][\)\.\-:]?\s*/i, '')}</span>
      </button>`).join('');

    return `
      <div class="question-item" id="question-${qi}">
        <div class="question-text">${qi + 1}. ${q.question}</div>
        <div class="question-options" id="options-${qi}">${optionsHTML}</div>
        <div id="explanation-${qi}" style="display:none;margin-top:0.75rem;font-size:0.85rem;color:var(--text-secondary);padding:0.6rem 0.9rem;background:var(--surface-2);border-radius:6px"></div>
      </div>`;
  }).join('') || '';

  container.innerHTML = `
    <div class="reading-meta">
      <span class="meta-tag">📚 ${data.level || 'B1'}</span>
      <span class="meta-tag">📝 ~${data.word_count || 120} words</span>
      <span class="meta-tag">🏷 ${data.topic || ''}</span>
    </div>

    <div class="reading-text-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem">
        <h3 style="font-size:1.1rem;color:var(--text-primary)">${data.title || ''}</h3>
        <button class="btn btn-ghost" id="reading-speak-btn" title="Sesli Oku" style="font-size:1.1rem;flex-shrink:0">
          🔊
        </button>
      </div>
      <p style="line-height:1.85">${data.passage || ''}</p>
      ${vocabHTML}
    </div>

    ${questionsHTML ? `
      <h3 style="font-size:1rem;font-weight:600;margin-bottom:1rem;color:var(--text-secondary)">
        Comprehension Questions
      </h3>
      <div class="questions-list">${questionsHTML}</div>
      <div style="margin-top:1.25rem">
        <button class="btn btn-primary" id="reading-check-btn">
          ✅ Cevapları Kontrol Et
        </button>
      </div>
    ` : ''}

    <div id="reading-score" style="margin-top:1rem"></div>
  `;

  container.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Sesli okuma butonu
  document.getElementById('reading-speak-btn')?.addEventListener('click', () => {
    speakPassage(data.passage || '');
    showToast('Metin okunuyor... 🔊', 'info', 2000);
  });

  // Seçenek tıklama
  container.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (submitted) return;
      const qi = parseInt(btn.dataset.q, 10);
      const oi = parseInt(btn.dataset.o, 10);
      answers[qi] = oi;

      document.querySelectorAll(`#options-${qi} .option-btn`).forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  // Cevap kontrol
  const checkBtn = document.getElementById('reading-check-btn');
  if (checkBtn) {
    checkBtn.addEventListener('click', () => {
      if (!data.questions?.length) return;

      const unanswered = data.questions.filter((_, i) => answers[i] === undefined);
      if (unanswered.length > 0) {
        showToast(`Lütfen tüm soruları cevaplayın. (${unanswered.length} eksik)`, 'warning');
        return;
      }

      submitted = true;
      let correct = 0;

      data.questions.forEach((q, qi) => {
        const userAnswer = answers[qi];
        const isCorrect = userAnswer === q.correct;
        if (isCorrect) correct++;

        document.querySelectorAll(`#options-${qi} .option-btn`).forEach((btn, oi) => {
          if (oi === q.correct) btn.classList.add('correct');
          else if (oi === userAnswer && !isCorrect) btn.classList.add('wrong');
        });

        const explEl = document.getElementById(`explanation-${qi}`);
        if (explEl && q.explanation) {
          explEl.style.display = 'block';
          explEl.textContent = `💡 ${q.explanation}`;
        }
      });

      // Skor gösterimi (animasyonlu bar ile)
      const total = data.questions.length;
      if (correct > 0) {
        addXP(correct * 5, `${correct} Doğru Cevap (Reading)`);
      }
      
      const pct = Math.round((correct / total) * 100);
      const scoreEl = document.getElementById('reading-score');
      if (scoreEl) {
        const color = pct >= 75 ? 'var(--mint-400)' : pct >= 50 ? 'var(--amber-400)' : 'var(--coral-400)';
        scoreEl.innerHTML = `
          <div class="score-card">
            <div class="score-big" style="color:${color}">${correct}/${total}</div>
            <div class="score-bar">
              <div class="score-bar-fill" id="reading-score-fill" style="background:${color}"></div>
            </div>
            <div style="color:var(--text-secondary);font-size:0.9rem">${pct}% doğru</div>
            <div style="margin-top:0.75rem;font-size:0.875rem;color:var(--text-secondary)">
              ${pct >= 75 ? '🌟 Mükemmel! Harika iş çıkardın.' : pct >= 50 ? '👍 İyi gidiyor! Biraz daha pratik yapalım.' : '📖 Metni tekrar okuyup tekrar dene.'}
            </div>
          </div>`;
        
        // Animasyonlu bar
        setTimeout(() => {
          const fill = document.getElementById('reading-score-fill');
          if (fill) fill.style.width = `${pct}%`;
        }, 100);

        // Learning Context & Action Button
        import('./app.js').then(({ saveLearningContext }) => {
          const vocabWords = data.vocabulary ? data.vocabulary.map(v => v.word) : [];
          saveLearningContext(data.topic, vocabWords);
          
          scoreEl.innerHTML += `
            <div style="margin-top: 1.5rem; text-align: center;">
              <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.75rem;">Bu kelimeleri pratiğe dök:</p>
              <button class="btn btn-primary" onclick="window.showModule('speaking'); document.getElementById('speaking-topic').value = '${data.topic || ''}';">
                🗣️ Practice Speaking
              </button>
            </div>
          `;
        });

        scoreEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      checkBtn.style.display = 'none';
    });
  }
}
