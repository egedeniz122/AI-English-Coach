/**
 * speaking.js — Speaking (Konuşma) Modülü
 * 
 * Web Speech API ile mikrofon kaydı alır,
 * transkripti AI ile analiz eder ve geri bildirim verir.
 * 
 * Özellikler:
 * - Konuşma süresi zamanlayıcı
 * - Gelişmiş feedback (pronunciation tips dahil)
 * - Manual transcript fallback
 * - Prompt üretme
 */

import { analyzeSpeaking, generateSpeakingPrompt } from './api.js';
import { showToast, setButtonLoading, incrementStat, showSkeleton, addXP } from './app.js';

let recognition = null;
let isRecording = false;
let fullTranscript = '';
let currentPromptData = null;
let recordingTimer = null;
let recordingSeconds = 0;

const SPEAKING_TOPICS = [
  { id: 'daily routine', label: '🌅 Daily Routine' },
  { id: 'hobbies', label: '🎨 Hobbies' },
  { id: 'travel', label: '✈️ Travel Plans' },
  { id: 'technology', label: '💻 Technology' },
  { id: 'food', label: '🍽 Food & Cooking' },
  { id: 'future plans', label: '🎯 Future Plans' },
  { id: 'movies', label: '🎬 Movies & TV' },
];

export function initSpeaking() {
  const micBtn = document.getElementById('speaking-mic-btn');
  if (!micBtn) return;

  const generatePromptBtn = document.getElementById('speaking-get-prompt-btn');
  const analyzeBtn        = document.getElementById('speaking-analyze-btn');
  const clearBtn          = document.getElementById('speaking-clear-btn');
  const transcriptBox     = document.getElementById('speaking-transcript');

  // Build topic chips
  const chipContainer = document.getElementById('speaking-topics');
  if (chipContainer) {
    SPEAKING_TOPICS.forEach((topic, i) => {
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

  // ---- Wire up buttons FIRST (works for ALL browsers) ----

  // Clear transcript
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (isRecording) stopRecording();
      fullTranscript = '';
      if (transcriptBox) transcriptBox.innerHTML = '<span style="color:var(--text-muted)">Transkript burada görünecek...</span>';
      document.getElementById('speaking-feedback').innerHTML = '';
      recordingSeconds = 0;
      updateTimerDisplay();
    });
  }

  // Generate speaking prompt
  if (generatePromptBtn) {
    generatePromptBtn.addEventListener('click', async () => {
      const topic = document.querySelector('#speaking-topics .topic-chip.active')?.dataset.topic || 'daily routine';
      setButtonLoading('speaking-get-prompt-btn', true, 'Prompt üretiliyor...');

      try {
        currentPromptData = await generateSpeakingPrompt(topic);
        renderPrompt(currentPromptData);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setButtonLoading('speaking-get-prompt-btn', false);
      }
    });
  }

  // Analyze speaking
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', async () => {
      const text = fullTranscript.trim();
      if (!text || text.length < 10) {
        showToast('Önce bir şeyler konuşun veya transkript girin.', 'warning');
        return;
      }

      const topic = currentPromptData?.prompt || '';
      setButtonLoading('speaking-analyze-btn', true, 'Konuşma analiz ediliyor...');
      showSkeleton('speaking-feedback', 5);

      try {
        const result = await analyzeSpeaking(text, topic);
        renderSpeakingFeedback(result);
        incrementStat('speaking');
        addXP(20, 'Konuşma Analizi');
      } catch (err) {
        document.getElementById('speaking-feedback').innerHTML = '';
        showToast(err.message, 'error');
      } finally {
        setButtonLoading('speaking-analyze-btn', false);
      }
    });
  }

  // ---- SpeechRecognition setup (browser-specific) ----

  // Check browser support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    micBtn.disabled = true;
    micBtn.title = 'Tarayıcınız Speech Recognition desteklemiyor';
    const status = document.getElementById('speaking-status');
    if (status) {
      status.innerHTML = '⚠️ Bu tarayıcı ses tanımayı desteklemiyor. <strong>Chrome</strong> kullanın veya aşağıya yazın.';
    }
    
    // Manual transcript entry fallback UX
    if (transcriptBox) {
      transcriptBox.style.padding = '0';
      transcriptBox.style.border = 'none';
      transcriptBox.style.background = 'transparent';
      transcriptBox.innerHTML = `
        <div style="margin-bottom:0.5rem;font-size:0.85rem;color:var(--coral-400);">⚠️ Mikrofon desteklenmiyor. Lütfen söylemek istediklerinizi aşağıya yazın:</div>
        <textarea id="manual-transcript-input" placeholder="What would you say about the topic?" style="width:100%;height:100px;padding:1rem;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-md);color:var(--text-primary);font-family:inherit;font-size:0.95rem;resize:vertical;"></textarea>
      `;
      
      const manualInput = document.getElementById('manual-transcript-input');
      manualInput.addEventListener('input', (e) => {
        fullTranscript = e.target.value;
      });
    }
    return; // Only mic/recording features are skipped — buttons are already wired above
  }

  recognition = new SpeechRecognition();
  recognition.continuous     = true;
  recognition.interimResults = true;
  recognition.lang           = 'en-US';
  recognition.maxAlternatives = 1;

  let interimText = '';

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        fullTranscript += transcript + ' ';
      } else {
        interim = transcript;
      }
    }
    interimText = interim;
    if (transcriptBox) {
      transcriptBox.innerHTML = `${fullTranscript}<span style="color:var(--text-muted)">${interimText}</span>`;
    }
  };

  recognition.onerror = (event) => {
    console.error('Speech error:', event.error);
    if (event.error === 'not-allowed') {
      showToast('Mikrofon izni reddedildi. Tarayıcı ayarlarından izin verin.', 'error');
    } else if (event.error === 'network') {
      showToast('Ağ hatası. İnternet bağlantınızı kontrol edin.', 'error');
    } else if (event.error !== 'no-speech') {
      showToast('Ses tanıma hatası: ' + event.error, 'error');
    }
    stopRecording();
  };

  recognition.onend = () => {
    if (isRecording) {
      try {
        recognition.start(); // Chrome ~60s sonra otomatik durur, tekrar başlat
      } catch (e) {}
    }
  };

  // Mic button toggle
  micBtn.addEventListener('click', () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });
}

// ============================================================
// RECORDING CONTROLS
// ============================================================

function startRecording() {
  if (!recognition) return;
  fullTranscript = '';
  isRecording = true;
  recordingSeconds = 0;

  const micBtn = document.getElementById('speaking-mic-btn');
  const status = document.getElementById('speaking-status');
  const timerEl = document.getElementById('speaking-timer');

  micBtn?.classList.add('recording');
  if (status) status.textContent = '🔴 Kayıt yapılıyor... Konuşmayı bitirince tekrar tıklayın.';
  if (timerEl) timerEl.classList.add('active');

  // Zamanlayıcıyı başlat
  recordingTimer = setInterval(() => {
    recordingSeconds++;
    updateTimerDisplay();
  }, 1000);

  try {
    recognition.start();
  } catch (e) {
    console.warn('Recognition already started');
  }
}

function stopRecording() {
  isRecording = false;

  const micBtn = document.getElementById('speaking-mic-btn');
  const status = document.getElementById('speaking-status');
  const timerEl = document.getElementById('speaking-timer');

  micBtn?.classList.remove('recording');
  
  if (status) {
    status.textContent = fullTranscript 
      ? '✅ Kayıt tamamlandı. "Analiz Et" butonuna tıklayın.'
      : '🎤 Başlamak için mikrofona tıklayın.';
  }

  // Zamanlayıcıyı durdur
  if (recordingTimer) {
    clearInterval(recordingTimer);
    recordingTimer = null;
  }

  try {
    recognition?.stop();
  } catch (e) {}
}

function updateTimerDisplay() {
  const timerEl = document.getElementById('speaking-timer');
  if (!timerEl) return;
  const min = Math.floor(recordingSeconds / 60).toString().padStart(2, '0');
  const sec = (recordingSeconds % 60).toString().padStart(2, '0');
  timerEl.textContent = `${min}:${sec}`;
}

// ============================================================
// RENDER PROMPT
// ============================================================

function renderPrompt(data) {
  const container = document.getElementById('speaking-prompt-card');
  if (!container || !data) return;

  container.innerHTML = `
    <div class="glass-panel" style="border-color:rgba(56,189,248,0.2);margin-bottom:1.25rem">
      <div style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:var(--sky-400);margin-bottom:0.75rem">
        Speaking Prompt
      </div>
      <p style="font-size:1.05rem;font-weight:500;color:var(--text-primary);margin-bottom:1rem;line-height:1.5">${data.prompt}</p>
      
      ${data.example_points?.length ? `
        <div style="margin-bottom:0.75rem">
          <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.4rem">Bahsedebileceğin noktalar:</p>
          <ul style="list-style:none;display:flex;flex-direction:column;gap:4px">
            ${data.example_points.map(p => `<li style="font-size:0.875rem;color:var(--text-secondary)">→ ${p}</li>`).join('')}
          </ul>
        </div>` : ''}

      ${data.preparation_tips?.length ? `
        <div style="margin-bottom:0.75rem">
          <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.4rem">Hazırlık İpuçları:</p>
          <ul style="list-style:none;display:flex;flex-direction:column;gap:4px">
            ${data.preparation_tips.map(t => `<li style="font-size:0.875rem;color:var(--text-secondary)">💡 ${t}</li>`).join('')}
          </ul>
        </div>` : ''}

      ${data.example_answers?.length ? `
        <div style="margin-bottom:0.75rem">
          <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.4rem">Örnek Başlangıç Cümleleri:</p>
          <ul style="list-style:none;display:flex;flex-direction:column;gap:4px">
            ${data.example_answers.map(a => `<li style="font-size:0.875rem;color:var(--text-secondary)">💬 "${a}"</li>`).join('')}
          </ul>
        </div>` : ''}

      ${data.vocabulary_hints?.length ? `
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:0.75rem">
          ${data.vocabulary_hints.map(w => `
            <span style="background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.2);color:var(--mint-300);padding:3px 10px;border-radius:6px;font-size:0.8rem">
              ${w}
            </span>`).join('')}
        </div>` : ''}

      ${data.time_suggestion ? `
        <p style="font-size:0.8rem;color:var(--text-muted)">⏱ ${data.time_suggestion}</p>` : ''}
    </div>
  `;
}

// ============================================================
// RENDER SPEAKING FEEDBACK
// ============================================================

function renderSpeakingFeedback(data) {
  const container = document.getElementById('speaking-feedback');
  if (!container) return;

  const scoreClass = data.score === 'good' ? 'good' : data.score === 'fair' ? 'fair' : 'poor';
  const scoreLabel = { good: '✓ İyi Konuşma', fair: '~ Geliştirilmeli', poor: '✗ Pratik Gerekli' }[data.score] || '';

  const grammarHTML = data.grammar_issues?.length
    ? data.grammar_issues.map(g => `<li style="font-size:0.875rem;color:var(--text-secondary);margin-bottom:4px">• ${g}</li>`).join('')
    : '<li style="color:var(--mint-400);font-size:0.875rem">✓ Belirgin gramer hatası bulunamadı</li>';

  const suggestionsHTML = data.suggestions?.map(s => 
    `<div style="padding:0.5rem 0.75rem;background:var(--surface-2);border-radius:6px;font-size:0.875rem;color:var(--text-secondary);margin-bottom:0.4rem">→ ${s}</div>`
  ).join('') || '';

  const pronunciationHTML = data.pronunciation_tips?.length
    ? `<div class="feedback-section">
        <div class="feedback-section-label">
          <span class="label-dot" style="--dot-color:var(--violet-400)"></span>
          Telaffuz İpuçları
        </div>
        <ul style="list-style:none">
          ${data.pronunciation_tips.map(t => `<li style="font-size:0.875rem;color:var(--text-secondary);margin-bottom:4px">🗣 ${t}</li>`).join('')}
        </ul>
      </div>`
    : '';

  container.innerHTML = `
    <div class="feedback-card">
      <div class="feedback-header">
        <span class="ai-badge">🤖 AI Coach</span>
        <span class="score-badge ${scoreClass}">${scoreLabel}</span>
        ${recordingSeconds > 0 ? `<span style="margin-left:auto;font-size:0.8rem;color:var(--text-muted)">⏱ ${Math.floor(recordingSeconds / 60)}:${(recordingSeconds % 60).toString().padStart(2, '0')}</span>` : ''}
      </div>
      <div class="feedback-body">
        <div class="feedback-section">
          <div class="feedback-section-label">
            <span class="label-dot" style="--dot-color:var(--sky-400)"></span>
            Akıcılık (Fluency)
          </div>
          <div class="feedback-text">${data.fluency || ''}</div>
        </div>

        <div class="feedback-section">
          <div class="feedback-section-label">
            <span class="label-dot" style="--dot-color:var(--coral-400)"></span>
            Gramer Sorunları
          </div>
          <ul style="list-style:none">${grammarHTML}</ul>
        </div>

        <div class="feedback-section">
          <div class="feedback-section-label">
            <span class="label-dot" style="--dot-color:var(--amber-400)"></span>
            Kelime Kullanımı
          </div>
          <div class="feedback-text">${data.vocabulary_feedback || ''}</div>
        </div>

        ${pronunciationHTML}

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

        ${data.corrected_transcript ? `
          <div class="feedback-section">
            <div class="feedback-section-label">
              <span class="label-dot" style="--dot-color:var(--mint-400)"></span>
              Düzeltilmiş Versiyon
            </div>
            <div class="corrected-sentence">${data.corrected_transcript}</div>
          </div>` : ''}

        ${suggestionsHTML ? `
          <div class="feedback-section">
            <div class="feedback-section-label">
              <span class="label-dot" style="--dot-color:var(--sky-400)"></span>
              Öneriler
            </div>
            ${suggestionsHTML}
          </div>` : ''}

        ${data.encouragement ? `
          <div style="margin-top:0.75rem;padding:0.75rem 1rem;background:rgba(52,211,153,.04);border-radius:8px;font-size:0.9rem;color:var(--text-secondary)">
            💪 ${data.encouragement}
          </div>` : ''}
      </div>
    </div>`;

  container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
