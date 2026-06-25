/**
 * api.js — Google Gemini API Yöneticisi
 * 
 * Tüm AI isteklerini merkezi olarak yönetir.
 * Google Gemini 1.5 Flash modeli kullanır.
 * API hatasında veya kotası bittiğinde Demo Modu devreye girer.
 */

const API_CONFIG = {
  model: 'gemini-1.5-flash',
  max_tokens: 1024,
};

// API anahtarı sadece localStorage'dan okunur. Güvenlik gereği koda gömülmez.
export function getApiKey() {
  const key = localStorage.getItem('gemini_api_key');
  return key ? key.trim() : null;
}
export function hasApiKey() {
  return !!getApiKey();
}
export function saveApiKey(key) {
  localStorage.setItem('gemini_api_key', key);
}
export function clearApiKey() {
  localStorage.removeItem('gemini_api_key');
}

// ============================================================
// DEMO (MOCK) VERİLERİ — API kotası bittiğinde kullanılır
// ============================================================

const MOCK = {
  writing: {
    score: 'fair',
    corrected: 'Yesterday I went to the market and bought some vegetables.',
    errors: [
      {
        original: 'go',
        correction: 'went',
        explanation: '"go" fiilinin geçmiş zaman hali "went" olmalıdır (düzensiz fiil).',
        category: 'grammar',
      },
      {
        original: 'buyed',
        correction: 'bought',
        explanation: '"buy" fiilinin geçmiş zaman hali "bought" olmalıdır (düzensiz fiil).',
        category: 'grammar',
      },
    ],
    alternative: 'Yesterday I visited the market and picked up some fresh vegetables.',
    positive_feedback: 'Harika çalışma! Düzensiz fiillere dikkat etmek seviyeni hızla yükseltecek.',
    level_estimate: 'B1',
  },

  reading: {
    title: 'The Power of Artificial Intelligence',
    topic: 'technology',
    level: 'B1',
    word_count: 120,
    passage: 'Artificial intelligence, or AI, is changing the world. It helps doctors find diseases early and helps students learn new things. AI can translate languages and drive cars. Many companies use AI to improve their services. However, some people worry about AI taking their jobs. Experts say AI will create new types of jobs too. The most important thing is to learn how to work with AI. Students who understand technology will have better opportunities in the future. AI is a tool, and like all tools, it depends on how we use it.',
    vocabulary: [
      { word: 'artificial', definition: 'yapay, doğal olmayan', example: 'Artificial flowers never die.' },
      { word: 'intelligence', definition: 'zeka', example: 'She showed great intelligence in solving the problem.' },
      { word: 'translate', definition: 'çevirmek', example: 'Can you translate this sentence?' },
      { word: 'opportunity', definition: 'fırsat', example: 'This is a great opportunity for you.' },
    ],
    questions: [
      {
        question: 'What is the main topic of this passage?',
        options: ['A) How to learn languages', 'B) The effects of AI on society', 'C) How to drive a car', 'D) Medical treatments'],
        correct: 1,
        explanation: 'Metin yapay zekanın dünyayı nasıl değiştirdiğini anlatmaktadır.',
      },
      {
        question: 'According to the text, what do some people worry about?',
        options: ['A) AI making mistakes', 'B) AI being too expensive', 'C) AI taking their jobs', 'D) AI using too much energy'],
        correct: 2,
        explanation: 'Metin bazı insanların AI\'ın işlerini alacağından endişe ettiğini söylemektedir.',
      },
      {
        question: 'What does the text say about students?',
        options: ['A) They should avoid technology', 'B) They should only study medicine', 'C) Technology understanding brings better opportunities', 'D) They should not use AI'],
        correct: 2,
        explanation: 'Metin, teknolojiyi anlayan öğrencilerin daha iyi fırsatlara sahip olacağını belirtir.',
      },
      {
        question: 'What does the writer compare AI to?',
        options: ['A) A doctor', 'B) A tool', 'C) A student', 'D) A car'],
        correct: 1,
        explanation: 'Yazar AI\'ı bir araça benzetir: "AI is a tool".',
      },
    ],
  },

  listening: {
    title: 'A Day at the Coffee Shop',
    scenario: 'İki arkadaş bir kafede buluşuyor ve günleri hakkında konuşuyor.',
    script: 'Emma: Hi Tom! How are you today? Tom: I am great, thanks! I just finished my morning run. Emma: Wow, that is impressive! I usually have coffee first thing in the morning. Tom: Me too, actually. After running, I always stop at a coffee shop. Emma: Which one do you go to? Tom: The one near the park. They make the best cappuccino in town. Emma: I should try it someday. Tom: Yes, you should! The barista there is very friendly too.',
    questions: [
      {
        question: 'What did Tom do in the morning?',
        options: ['A) He worked at a coffee shop', 'B) He went for a run', 'C) He had breakfast', 'D) He watched TV'],
        correct: 1,
        explanation: 'Tom sabah koşu yaptığını söylüyor: "I just finished my morning run."',
      },
      {
        question: 'Where is the coffee shop Tom likes?',
        options: ['A) Near the school', 'B) Near the beach', 'C) Near the park', 'D) Near his home'],
        correct: 2,
        explanation: 'Tom "The one near the park" diyor.',
      },
      {
        question: 'What does Tom say about the barista?',
        options: ['A) The barista is rude', 'B) The barista is slow', 'C) The barista is friendly', 'D) The barista makes bad coffee'],
        correct: 2,
        explanation: 'Tom "The barista there is very friendly" diyor.',
      },
    ],
  },

  speakingPrompt: {
    prompt: 'Talk about a place you visited recently. Where did you go? Who did you go with? What did you do there? Would you recommend it to others?',
    example_points: [
      'Describe the location and when you went',
      'Talk about the activities you did',
      'Share your feelings and opinion about the place',
    ],
    time_suggestion: '1-2 dakika konuşmayı hedefleyin',
    vocabulary_hints: ['recommend', 'memorable', 'atmosphere', 'location'],
  },

  speakingAnalysis: {
    score: 'fair',
    fluency: 'Konuşmanız genel olarak anlaşılırdı ancak bazı duraklamalar vardı. Akıcılığınızı artırmak için pratik yapmaya devam edin.',
    grammar_issues: [
      'Geçmiş zaman çekim hatası: "I go" yerine "I went" kullanılmalı',
      'Bağlaç eksikliği: Cümleler "however", "also", "because" ile bağlanabilir',
    ],
    vocabulary_feedback: 'Kelime hazneniz B1 seviyesine uygun. Daha çekici ifadeler kullanmak için "amazing", "incredible", "fascinating" gibi sıfatlar eklenebilir.',
    corrected_transcript: '(Demo Mod: Konuşmanızın düzeltilmiş hali burada görünecektir.)',
    suggestions: [
      'Her gün 5-10 dakika İngilizce konuşma pratiği yapın',
      'Mirror technique: Kendinizi kaydedip dinleyin',
      'Podcastler ve TED talks ile doğal İngilizce\'ye maruz kalın',
    ],
    encouragement: 'Harika bir başlangıç! Her konuşma pratiği sizi daha ileriye taşıyor. Devam edin! 🌟',
    pronunciation_tips: [
      '"th" sesi: Dilinizi dişlerinizin arasına koyarak söyleyin',
      '"r" sesi: Türkçe "r"den farklı, dil damağa değmemeli',
    ],
  },

  webReader: {
    title: 'Simplified: Technology and Society',
    simplified_text: 'Technology is changing our lives every day. Computers and smartphones help us communicate with people around the world. The internet gives us access to information quickly. Many jobs now use computers. Some people worry that machines will replace human workers. However, technology also creates new jobs. For example, people are needed to build, repair, and improve technology. The key is to learn new skills and adapt to change.',
    original_summary: 'Orijinal metin teknolojinin toplum üzerindeki etkilerini ve gelecekteki fırsatları ele alıyordu.',
    vocabulary: [
      { word: 'communicate', definition: 'iletişim kurmak', example: 'We communicate by email every day.' },
      { word: 'access', definition: 'erişim, ulaşmak', example: 'I have access to the internet at home.' },
      { word: 'replace', definition: 'yerini almak', example: 'Robots may replace some workers.' },
      { word: 'adapt', definition: 'uyum sağlamak', example: 'We must adapt to new technology.' },
    ],
  },

  roleplay: 'Hello! Welcome to our coffee shop. I\'m your barista today. What can I get for you? We have espresso, cappuccino, latte, and many other options. We also have fresh pastries and sandwiches. Take your time! (DEMO MODE: This is a simulated response as the AI API quota has been reached.)',
};

// ============================================================
// ANA API ÇAĞRI FONKSİYONU
// ============================================================

let cachedModelName = null;

export async function callAI(systemPrompt, userMessage, options = {}) {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.warn('API key bulunamadı. Demo Moduna geçiliyor.');
    return getDemoResponse(options);
  }

  try {
    let finalSystemPrompt = systemPrompt;
    let ctx = null;
    try {
      ctx = JSON.parse(localStorage.getItem('ec_learning_context'));
      if (ctx && Date.now() - ctx.timestamp > 24 * 60 * 60 * 1000) ctx = null;
    } catch (e) { ctx = null; }
    if (ctx && ctx.lastTopic) {
      finalSystemPrompt += `\n\nCROSS-FEATURE CONTEXT: The user recently learned about "${ctx.lastTopic}". `;
      if (ctx.lastVocab && ctx.lastVocab.length > 0) {
        finalSystemPrompt += `They just learned these words: ${ctx.lastVocab.join(', ')}. If appropriate for the current task, try to include this topic or these words naturally.`;
      }
    }

    let finalGeminiPrompt = `[SYSTEM INSTRUCTIONS]\n${finalSystemPrompt}\n\n[USER INPUT]\n${userMessage}`;
    if (options.expectJSON) finalGeminiPrompt += "\n\n[CRITICAL: You must return ONLY raw JSON. No conversational text. No markdown formatting.]";

    const generationConfig = {
      temperature: options.temperature ?? 0.85,
      maxOutputTokens: options.max_tokens || API_CONFIG.max_tokens,
    };

    // --- DYNAMIC MODEL AUTO-DISCOVERY ---
    // Instead of hardcoding models that might throw 404, we ask Google what models this exact API key has access to!
    if (!cachedModelName) {
      try {
        const listController = new AbortController();
        const listTimeoutId = setTimeout(() => listController.abort(), 5000); // 5 sec for discovery
        
        const listRes = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`, {
          signal: listController.signal
        });
        clearTimeout(listTimeoutId);
        
        if (listRes.ok) {
          const listData = await listRes.json();
          if (listData.models) {
            const validModels = listData.models.filter(m => 
              m.supportedGenerationMethods?.includes('generateContent') && 
              m.name.includes('gemini')
            );
            const findModel = (keyword) => validModels.find(m => m.name.includes(keyword));
            
            // Pick the best available model prioritizing speed and capability
            const best = findModel('gemini-1.5-flash') || 
                         findModel('gemini-1.5-pro') || 
                         findModel('gemini-1.0-pro') || 
                         validModels[0];
                         
            if (best) cachedModelName = best.name;
          }
        }
      } catch (err) {
        console.warn("Model auto-discovery failed, falling back to default.", err);
      }
      
      // Fallback if discovery fails or returns empty
      if (!cachedModelName) cachedModelName = 'models/gemini-1.5-flash';
    }

    const url = `https://generativelanguage.googleapis.com/v1/${cachedModelName}:generateContent?key=${apiKey}`;

    // Timeout starts here — after model discovery — so the full 15s is available for the actual request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const fetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: finalGeminiPrompt }] }],
        generationConfig: generationConfig
      })
    };

    let lastErrorStatus = null;
    let lastErrorMessage = '';
    let successData = null;

    try {
      const res = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      if (res.ok) {
        successData = await res.json();
      } else {
        let errData = {};
        try { errData = await res.json(); } catch(e) {}
        const errMsg = errData.error?.message || errData.error?.type || errData.error || res.statusText;
        lastErrorStatus = res.status;
        lastErrorMessage = typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg);
        
        // If the cached model suddenly returns 404, clear the cache so it rediscovers next time
        if (res.status === 404) {
           cachedModelName = null; 
        }
      }
    } catch (err) {
      lastErrorStatus = 0;
      lastErrorMessage = err.message;
    }

    if (!successData) {
      if (lastErrorStatus === 400 && (lastErrorMessage.includes("API key not valid") || lastErrorMessage.includes("invalid_request_error"))) {
         window.dispatchEvent(new CustomEvent('ec_invalid_key'));
         throw new Error(`GEÇERSİZ API ANAHTARI: Doğru anahtarınızı girin.`);
      }
      if (lastErrorStatus === 401 || lastErrorStatus === 403 || lastErrorMessage.includes('API key') || lastErrorMessage.includes('invalid') || lastErrorMessage.includes('unauthorized')) {
         window.dispatchEvent(new CustomEvent('ec_invalid_key'));
         throw new Error(`API Hatası (${lastErrorStatus}): Anahtarınız geçersiz veya yetkisiz.`);
      }

      console.warn(`API Error ${lastErrorStatus} from Gemini: ${lastErrorMessage}. Switching to Demo Mode.`);
      window.dispatchEvent(new CustomEvent('ec_demo_mode', { detail: `Gemini Hatası (${lastErrorStatus}): ${lastErrorMessage}. Demo Mode Aktif.` }));
      return getDemoResponse(options);
    }

    // Safely extract the text with optional chaining
    const text = successData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text || typeof text !== 'string') {
      console.warn('API returned empty or invalid text structure:', successData);
      window.dispatchEvent(new CustomEvent('ec_demo_mode', { detail: 'Yapay zeka boş yanıt döndürdü. Demo Mode Aktif.' }));
      return getDemoResponse(options);
    }

    // Robust JSON Parser Logic
    if (options.expectJSON) {
      try {
        // Attempt 1: Direct parse
        return JSON.parse(text);
      } catch (err1) {
        try {
          // Attempt 2: Extract from markdown blocks explicitly first (most reliable)
          const blockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
          if (blockMatch && blockMatch[1]) {
             return JSON.parse(blockMatch[1].trim());
          }
          
          // Attempt 3: Find first { or [ and last } or ]
          const firstBrace = text.indexOf('{');
          const lastBrace = text.lastIndexOf('}');
          const firstBracket = text.indexOf('[');
          const lastBracket = text.lastIndexOf(']');
          
          let jsonObj = null;
          let arrayObj = null;
          
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            try { jsonObj = JSON.parse(text.substring(firstBrace, lastBrace + 1)); } catch(e) {}
          }
          if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
            try { arrayObj = JSON.parse(text.substring(firstBracket, lastBracket + 1)); } catch(e) {}
          }
          
          if (jsonObj) return jsonObj;
          if (arrayObj) return arrayObj;
          
          throw new Error("No valid JSON structure found");
        } catch (err2) {
          console.warn('CRITICAL: Complete JSON parse failure. Raw text was:', text);
          window.dispatchEvent(new CustomEvent('ec_demo_mode', { detail: 'Yapay zeka geçersiz format üretti. Demo Mode Aktif.' }));
          return getDemoResponse(options);
        }
      }
    }

    return text;

  } catch (err) {
    if (err.message.includes('API_KEY_MISSING')) {
      window.dispatchEvent(new CustomEvent('ec_invalid_key'));
      throw new Error('LÜTFEN API ANAHTARINIZI GİRİN.');
    }
    if (err.message.includes('GEÇERSİZ') || err.message.includes('LÜTFEN') || err.message.includes('API Hatası')) {
      throw err;
    }
    console.warn('Network/API error, switching to Demo Mode:', err.message);
    window.dispatchEvent(new CustomEvent('ec_demo_mode', { detail: `Bağlantı Hatası: ${err.message}. Demo Mode Aktif.` }));
    return getDemoResponse(options);
  }
}

// options'a göre doğru demo veriyi döndür
function getDemoResponse(options) {
  if (options.expectJSON) {
    return options._demoKey
      ? MOCK[options._demoKey]
      : MOCK.writing; // default
  }
  return MOCK.roleplay;
}

// ============================================================
// WRITING MODULE
// ============================================================

export async function analyzeWriting(text) {
  const system = `You are an expert English language coach specializing in B1-B2 learners. 
Analyze the given English text and respond ONLY with a valid JSON object. No markdown, no extra text.

CRITICAL INSTRUCTIONS:
- CRITICAL: Do NOT repeat the same feedback style every time. Drastically vary your tone (formal, casual, analytical, or friendly) based on the random seed.
- Provide EXACTLY 3 entirely different alternative sentence rewrites to show variety (e.g. one formal, one idiomatic, one concise).
- Estimate the user's CEFR level (A1, A2, B1, B2, C1) based strictly on their vocabulary richness and grammatical complexity.
- Be educational, not robotic. Do NOT just say "good job". Provide highly specific, encouraging feedback in Turkish.
- Never repeat the same general advice. Always tailor it to the exact text provided.

JSON structure:
{
  "score": "good|fair|poor",
  "corrected": "The main corrected version of the text",
  "errors": [
    {
      "original": "the error part",
      "correction": "the correct form",
      "explanation": "clear, contextual explanation in Turkish",
      "category": "grammar|vocabulary|spelling|punctuation"
    }
  ],
  "detailed_analysis": {
    "grammar": "Turkish feedback focusing specifically on grammar usage",
    "vocabulary": "Turkish feedback focusing on word choice and richness",
    "fluency": "Turkish feedback on sentence flow and structure",
    "naturalness": "Turkish feedback on how native-like the text sounds"
  },
  "suggested_vocabulary": [
    { "word": "advanced_word", "definition": "Turkish definition", "example": "English example" }
  ],
  "alternatives": [
    "Alternative version 1 (e.g. more formal)",
    "Alternative version 2 (e.g. more idiomatic)",
    "Alternative version 3 (e.g. different structure)"
  ],
  "positive_feedback": "A unique, encouraging specific feedback sentence in Turkish",
  "level_estimate": "A1|A2|B1|B2|C1"
}

Rules:
- If text is completely correct, score = "good", errors = []. Still provide 3 alternatives.
- Keep explanations in Turkish for B1-B2 learners.`;

  return await callAI(system, `${text}\n\n[Make feedback highly unique. Random seed: ${Math.random()}]`, { expectJSON: true, temperature: 0.85, _demoKey: 'writing' });
}

// ============================================================
// READING MODULE
// ============================================================

export async function generateReadingPassage(topic = 'technology', difficulty = 'B1') {
  const levelInstructions = difficulty === 'B1' 
    ? "B1 Level: Use simpler vocabulary, everyday situations, straightforward grammar (basic tenses, simple modals), and shorter sentences."
    : "B2 Level: Use advanced vocabulary, longer and more complex sentences, advanced grammar (conditionals, passive voice, perfect continuous tenses), and abstract or analytical topics.";

  const system = `You are an English reading material creator for ${difficulty} level learners.
Respond ONLY with valid JSON. No markdown, no extra text.

CRITICAL INSTRUCTIONS:
- VARY the text style wildly every time (e.g., story, article, dialogue, news report, diary, email).
- Choose a unique, creative angle for the given topic: "${topic}". Do NOT use generic templates.
- ${levelInstructions}
- Ensure exactly 120-150 words appropriate for ${difficulty} level.
- You MUST generate EXACTLY 4 questions: 1 factual, 1 vocabulary, 1 inference, and 1 main idea. Make the options challenging for the ${difficulty} level.

JSON structure:
{
  "title": "A creative, engaging title",
  "topic": "${topic}",
  "level": "${difficulty}",
  "text_style": "story|article|dialogue|news|diary|email",
  "word_count": 120,
  "passage": "The reading text here...",
  "vocabulary": [
    { "word": "word1", "definition": "Turkish meaning", "example": "English example sentence" },
    { "word": "word2", "definition": "Turkish meaning", "example": "English example sentence" }
  ],
  "questions": [
    {
      "type": "factual|inference|vocabulary|main_idea",
      "question": "The English question",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "correct": 0,
      "explanation": "Detailed Turkish explanation of why this is correct."
    }
  ]
}`;

  return await callAI(system, `Generate a wildly diverse and completely unique reading passage about: ${topic}. Please make it completely different from previous generations in format and content. Random seed: ${Math.random()}`, {
    expectJSON: true,
    temperature: 0.95,
    _demoKey: 'reading'
  });
}

// ============================================================
// LISTENING MODULE
// ============================================================

export async function generateListeningContent(topic = 'daily life', difficulty = 'B1') {
  const levelInstructions = difficulty === 'B1'
    ? "B1 Level: Use simple vocabulary, slower-paced conversational flow, everyday situations, and clear literal meanings. Avoid complex idioms."
    : "B2 Level: Use advanced vocabulary, idioms, phrasal verbs, complex sentences, and abstract or professional scenarios. Include implied meanings.";

  const system = `You are an English listening exercise creator for ${difficulty} level learners.
Respond ONLY with valid JSON. No markdown, no extra text.

CRITICAL INSTRUCTIONS:
- Randomly select a format: conversation, interview, announcement, podcast, storytelling, or news report.
- Vary the tone (formal, informal, dramatic, humorous, neutral) wildly.
- ${levelInstructions}
- Generate EXACTLY 3 questions with different difficulty levels (e.g., detail, inference, tone).

JSON structure:
{
  "title": "A creative title",
  "format": "conversation|announcement|interview|story|podcast|news",
  "scenario": "brief scenario description in Turkish",
  "script": "The spoken text. 80-120 words. Natural language appropriate for ${difficulty}.",
  "questions": [
    {
      "question": "Listening comprehension question?",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "correct": 0,
      "explanation": "Detailed explanation in Turkish"
    }
  ]
}`;

  return await callAI(system, `Generate a highly unique and varied listening exercise about: ${topic}. Make it completely different from any previous exercise. Focus heavily on ${difficulty} level nuances. Random seed: ${Math.random()}`, {
    expectJSON: true,
    temperature: 0.95,
    _demoKey: 'listening',
  });
}

// ============================================================
// SPEAKING MODULE
// ============================================================

export async function analyzeSpeaking(transcript, topic = '') {
  const system = `You are an expert English speaking coach for B1-B2 level learners.
Analyze the spoken English transcript and respond ONLY with valid JSON.

CRITICAL INSTRUCTIONS:
- Adapt feedback tone drastically based on the user's transcript. Be dynamic (not robotic).
- Provide highly specific, actionable feedback. NEVER just say "good job". Mention exactly what they did well (e.g., "Great use of the present perfect 'I have been'").
- Correct pronunciation issues implicitly or explicitly by pointing out likely difficult words in their transcript.
- Identify specific grammar errors and explain them simply in Turkish.

JSON structure:
{
  "score": "good|fair|poor",
  "fluency": "Highly specific fluency assessment in Turkish",
  "grammar_issues": ["Specific grammar issue 1 in Turkish", "Issue 2..."],
  "vocabulary_feedback": "Specific vocabulary feedback in Turkish (e.g., suggesting better idioms for words they used)",
  "suggested_vocabulary": [
    { "word": "useful_word", "definition": "Turkish definition", "example": "English example" }
  ],
  "corrected_transcript": "The corrected, more natural version of what they said",
  "suggestions": ["Actionable speaking practice suggestion 1 in Turkish"],
  "encouragement": "Unique, non-repetitive motivational message in Turkish",
  "pronunciation_tips": ["Specific pronunciation tip for a word they used in Turkish"]
}`;

  const message = topic
    ? `Topic was: "${topic}"\nTranscript: "${transcript}"\nRandom seed: ${Math.random()}`
    : `Transcript: "${transcript}"\nRandom seed: ${Math.random()}`;

  return await callAI(system, message, { expectJSON: true, temperature: 0.85, _demoKey: 'speakingAnalysis' });
}

export async function generateSpeakingPrompt(topic = '') {
  const system = `You are an English speaking coach. Generate a highly creative and diverse speaking prompt for a B1-B2 level learner.
Respond ONLY with JSON. No markdown.

CRITICAL INSTRUCTIONS:
- Vary the roleplay scenario heavily. Examples: job interview, ordering food, travel problem, casual chat, debate, complaining to a manager, describing a dream.
- Adapt the prompt based on the chosen topic, but add an unexpected twist.
- Provide practical preparation tips and a sample starting sentence.

JSON structure:
{
  "prompt": "The detailed speaking scenario prompt in English.",
  "preparation_tips": ["Tip 1 in Turkish", "Tip 2 in Turkish"],
  "example_answers": ["Example starting sentence 1", "Example starting sentence 2"],
  "example_points": ["Point 1 to talk about", "Point 2", "Point 3"],
  "time_suggestion": "1-2 minutes",
  "vocabulary_hints": ["word1", "idiom1", "phrase1", "word2"]
}`;

  const userMsg = topic ? `Topic: ${topic}. Make it highly creative with a twist. Random seed: ${Math.random()}` : `Generate a random highly creative speaking scenario. Random seed: ${Math.random()}`;
  return await callAI(system, userMsg, { expectJSON: true, temperature: 0.95, _demoKey: 'speakingPrompt' });
}

// ============================================================
// WEB READER MODULE
// ============================================================

export async function analyzeWebText(text, targetLevel = 'B1') {
  const system = `You are an expert English language simplifier and reading coach.
The user provided a real-world text. Your task is to analyze it, simplify it to a strict ${targetLevel} CEFR level, and generate reading practice materials.
Respond ONLY with valid JSON.

CRITICAL INSTRUCTIONS:
- DO NOT repeat the same analysis format every time. Adapt based on the content type (news, academic, informal).
- Extract 4-6 key vocabulary words that are crucial for understanding the text at the ${targetLevel} level.
- Generate EXACTLY 3 comprehension questions: 1 factual, 1 inference, 1 vocabulary meaning.

JSON structure:
{
  "title": "A generated fitting title for the simplified text",
  "simplified_text": "The text rewritten strictly at the ${targetLevel} level. Avoid overly complex grammar if A2/B1.",
  "original_summary": "A 1-2 sentence summary of the original text in Turkish.",
  "vocabulary": [
    { "word": "word1", "definition": "Turkish definition", "example": "English example from simplified text" }
  ],
  "questions": [
    {
      "type": "factual|inference|vocabulary",
      "question": "English question?",
      "options": ["A) opt1", "B) opt2", "C) opt3", "D) opt4"],
      "correct": 0,
      "explanation": "Turkish explanation"
    }
  ]
}`;

  return await callAI(system, text, { expectJSON: true, temperature: 0.85, max_tokens: 2000, _demoKey: 'webReader' });
}

// (API key yönetim fonksiyonları dosya başında tanımlı — bkz. satır 16-27)
