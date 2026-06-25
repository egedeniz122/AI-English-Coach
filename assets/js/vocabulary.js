/**
 * vocabulary.js — Kelime Defteri ve Flashcard Modülü
 * 
 * LocalStorage'da bilmediği kelimeleri saklar. Flashcard testi yapar.
 */

import { showToast, addXP } from './app.js';

export function initVocabulary() {
  const tab = document.querySelector('.nav-tab[data-module="vocabulary"]');
  const mobileTab = document.querySelector('.mobile-nav-btn[data-module="vocabulary"]');

  if (tab) tab.addEventListener('click', renderVocabList);
  if (mobileTab) mobileTab.addEventListener('click', renderVocabList);

  const quizBtn = document.getElementById('vocab-quiz-btn');
  if (quizBtn) quizBtn.addEventListener('click', startQuiz);

  const showBtn = document.getElementById('quiz-show-btn');
  if (showBtn) showBtn.addEventListener('click', showQuizAnswer);

  const passBtn = document.getElementById('quiz-pass-btn');
  if (passBtn) passBtn.addEventListener('click', () => nextQuizWord(true));

  const failBtn = document.getElementById('quiz-fail-btn');
  if (failBtn) failBtn.addEventListener('click', () => nextQuizWord(false));

  const closeBtn = document.getElementById('quiz-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeQuiz);
}

// Kelimeler [{word: 'apple', def: 'elma', strength: 0}]
export function getVocab() {
  try {
    return JSON.parse(localStorage.getItem('ec_vocab') || '[]');
  } catch {
    return [];
  }
}

export function saveVocab(vocabList) {
  localStorage.setItem('ec_vocab', JSON.stringify(vocabList));
}

export function addWord(word, definition) {
  const vocab = getVocab();
  // Zaten varsa ekleme
  if (vocab.find(v => v.word.toLowerCase() === word.toLowerCase())) return false;
  
  vocab.push({ word, def: definition, strength: 0 });
  saveVocab(vocab);
  return true;
}

export function deleteWord(word) {
  const vocab = getVocab().filter(v => v.word !== word);
  saveVocab(vocab);
  renderVocabList();
}

function renderVocabList() {
  const container = document.getElementById('vocab-list');
  if (!container) return;

  const vocab = getVocab();

  if (vocab.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p>Henüz hiç kelime kaydetmediniz.<br>Reading yaparken metindeki kelimelere tıklayarak buraya ekleyebilirsiniz.</p>
      </div>`;
    return;
  }

  container.innerHTML = vocab.map(v => {
    let strengthColor = '#ef4444'; // Red
    if (v.strength > 2) strengthColor = '#f59e0b'; // Orange
    if (v.strength > 4) strengthColor = '#10b981'; // Green

    return `
      <div style="display:flex; justify-content:space-between; align-items:center; background:var(--surface-2); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--border);">
        <div>
          <div style="font-weight:600; font-size:1.1rem; color:var(--text-primary);">${v.word}</div>
          <div style="font-size:0.9rem; color:var(--text-secondary);">${v.def}</div>
        </div>
        <div style="display:flex; align-items:center; gap:1rem;">
          <div title="Öğrenme Seviyesi" style="width:12px; height:12px; border-radius:50%; background:${strengthColor};"></div>
          <button class="btn btn-ghost" onclick="window.ecDeleteWord('${v.word}')" style="color:#ef4444; padding:0.4rem;">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

// Global scope for onclick delete
window.ecDeleteWord = deleteWord;
window.ecAddWord = (word, definition) => {
  const added = addWord(word, definition);
  if (added) {
    showToast(`"${word}" Kelime Defterine eklendi! 🗂️`, 'success');
    addXP(5, 'Kelime Eklendi');
  } else {
    showToast(`"${word}" zaten defterinizde var.`, 'info');
  }
};

// ============================================================
// QUIZ LOGIC
// ============================================================
let quizQueue = [];
let currentQuizIndex = 0;

function startQuiz() {
  const vocab = getVocab();
  if (vocab.length === 0) {
    showToast('Önce kelime eklemelisiniz!', 'warning');
    return;
  }

  // Zayıf kelimelere öncelik vererek karıştır
  quizQueue = vocab.sort((a, b) => a.strength - b.strength).slice(0, 10);
  // Rastgele karıştır
  quizQueue.sort(() => Math.random() - 0.5);

  currentQuizIndex = 0;
  
  const modal = document.getElementById('vocab-quiz-modal');
  modal.classList.add('visible');

  loadQuizWord();
}

function loadQuizWord() {
  if (currentQuizIndex >= quizQueue.length) {
    closeQuiz();
    addXP(10, 'Flashcard Quiz');
    showToast('Quiz bitti! Harika iş çıkardınız. 🎉', 'success');
    renderVocabList();
    return;
  }

  const w = quizQueue[currentQuizIndex];
  document.getElementById('quiz-word').textContent = w.word;
  document.getElementById('quiz-definition').textContent = w.def;

  // Progress indicator
  const progressText = `${currentQuizIndex + 1} / ${quizQueue.length}`;
  const wordEl = document.getElementById('quiz-word');
  if (wordEl) wordEl.title = progressText;
  // Add or update progress display
  let progressEl = document.getElementById('quiz-progress');
  if (!progressEl) {
    progressEl = document.createElement('div');
    progressEl.id = 'quiz-progress';
    progressEl.style.cssText = 'font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem;';
    wordEl?.parentElement?.insertBefore(progressEl, wordEl);
  }
  progressEl.textContent = progressText;

  document.getElementById('quiz-show-btn').style.display = 'block';
  document.getElementById('quiz-answer').style.display = 'none';
  document.getElementById('quiz-actions').style.display = 'none';
}

function showQuizAnswer() {
  document.getElementById('quiz-show-btn').style.display = 'none';
  document.getElementById('quiz-answer').style.display = 'block';
  document.getElementById('quiz-actions').style.display = 'flex';
}

function nextQuizWord(passed) {
  const vocab = getVocab();
  const wordObj = vocab.find(v => v.word === quizQueue[currentQuizIndex].word);
  
  if (wordObj) {
    if (passed) wordObj.strength += 1;
    else wordObj.strength = Math.max(0, wordObj.strength - 1);
  }

  saveVocab(vocab);
  currentQuizIndex++;
  loadQuizWord();
}

function closeQuiz() {
  document.getElementById('vocab-quiz-modal').classList.remove('visible');
  renderVocabList();
}
