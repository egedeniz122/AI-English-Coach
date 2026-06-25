/**
 * writing.js — Writing (Yazma) Modülü
 * 
 * - Kullanıcının yazdığı İngilizce metni analiz eder
 * - Gramer hatalarını, açıklamaları ve alternatifleri gösterir
 * - Yazma geçmişini localStorage'da saklar
 * - Skeleton loading animasyonu
 */

import { analyzeWriting } from './api.js';
import { showToast, setButtonLoading, renderFeedbackCard, setupCharCounter, incrementStat, showSkeleton, addXP } from './app.js';

const EXAMPLE_SENTENCES = [
  "Yesterday I go to the market and buyed some vegetables.",
  "She don't likes to eat fast foods because it is unhealthy.",
  "I am studying English since three years.",
  "He telled me that he will coming tomorrow.",
  "We was very happy when we heard the good newses.",
  "If I would have more money, I will buy a new car.",
  "The children was playing in the garden when it start raining.",
  "She has went to the store already.",
];

// Yazma geçmişi
function getWritingHistory() {
  try {
    return JSON.parse(localStorage.getItem('ec_writing_history') || '[]');
  } catch { return []; }
}

function saveToHistory(text, result) {
  const history = getWritingHistory();
  history.unshift({
    text,
    result,
    date: new Date().toISOString(),
  });
  // Son 10 kaydı tut
  if (history.length > 10) history.length = 10;
  localStorage.setItem('ec_writing_history', JSON.stringify(history));
}

export function initWriting() {
  const analyzeBtn = document.getElementById('writing-analyze-btn');
  const textarea   = document.getElementById('writing-input');
  const exampleBtn = document.getElementById('writing-example-btn');
  const clearBtn   = document.getElementById('writing-clear-btn');

  if (!analyzeBtn) return;

  setupCharCounter('writing-input', 'writing-char-count', 500);

  // Example sentence loader (shuffle)
  let exampleIndex = 0;
  if (exampleBtn) {
    exampleBtn.addEventListener('click', () => {
      textarea.value = EXAMPLE_SENTENCES[exampleIndex % EXAMPLE_SENTENCES.length];
      exampleIndex++;
      textarea.dispatchEvent(new Event('input'));
      // Focus textarea
      textarea.focus();
    });
  }

  // Clear button
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      textarea.value = '';
      textarea.dispatchEvent(new Event('input'));
      document.getElementById('writing-feedback').innerHTML = '';
    });
  }

  // Main analyze
  analyzeBtn.addEventListener('click', async () => {
    const text = textarea.value.trim();

    if (!text) {
      showToast('Lütfen analiz edilecek bir metin girin.', 'warning');
      return;
    }
    if (text.length < 5) {
      showToast('Metin çok kısa. En az birkaç kelime girin.', 'warning');
      return;
    }
    if (text.length > 500) {
      showToast('Metin 500 karakteri geçmemeli.', 'error');
      return;
    }

    setButtonLoading('writing-analyze-btn', true, 'Analiz ediliyor...');
    showSkeleton('writing-feedback', 5);

    try {
      const result = await analyzeWriting(text);
      renderFeedbackCard(result, 'writing-feedback');
      incrementStat('writing');
      addXP(15, 'Yazı Analizi');
      saveToHistory(text, result);

      // Smooth scroll to feedback
      document.getElementById('writing-feedback')?.scrollIntoView({
        behavior: 'smooth', block: 'nearest'
      });

    } catch (err) {
      document.getElementById('writing-feedback').innerHTML = '';
      showToast(err.message, 'error');
      console.error('Writing analysis error:', err);
    } finally {
      setButtonLoading('writing-analyze-btn', false);
    }
  });

  // Enter key (Ctrl+Enter) shortcut
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      analyzeBtn.click();
    }
  });
}
