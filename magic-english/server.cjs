#!/usr/bin/env node
/**
 * Local Static + ElevenLabs API Server for Magic English Stage 1
 * Implements the exact ElevenLabs endpoints from Funny Farming:
 * - GET  /api/assess-pronunciation -> { configured, provider: 'elevenlabs-scribe-v2' }
 * - POST /api/assess-pronunciation?word=... -> Scribe v2 STT + similarity / phrase evaluation
 * - POST /api/welcome-voice -> Fena dynamic name greeting TTS (eleven_flash_v2)
 * Never exposes ELEVENLABS_API_KEY to the browser.
 */
const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const characterVoiceApi=require('./tools/character-voice-api.cjs').createCharacterVoiceApi({getApiKey});

const PORT = Number(process.env.PORT || 8000);
const ROOT = __dirname;
const magicRewards = require('./tools/magic-english-rewards.cjs').createMagicRewards();

function getApiKey() {return (process.env.ELEVENLABS_API_KEY||'').trim();}

// Levenshtein edit distance for Section 7.3 60% similarity check
function editDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

const STOP_WORDS = new Set(['i', 'said', 'say', 'it', 'a', 'the']);

function evaluateRecognizedSpeech(rawTranscript, targetKey) {
  const cleaned = String(rawTranscript || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return {
      assessmentType: 'word-recognition',
      assessed: true,
      passed: false,
      letterMatch: 0,
      accuracy: null,
      score: null,
      phonemes: [],
      message: '목소리가 잘 들리지 않았어요. 다시 한 번 또박또박 말해 볼까요?',
    };
  }

  // Phrase targets for Stage 1 (“Excuse me.”, “Can I ask?”, “Excuse me. Can I ask?”)
  const targetNorm = String(targetKey || 'full')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');

  const hasExcuse =
    cleaned.includes('excuse me') ||
    cleaned.includes('exuse me') ||
    cleaned.includes('scuse me') ||
    cleaned.includes('excuse');
  const hasAsk =
    cleaned.includes('can i ask') ||
    cleaned.includes('may i ask') ||
    cleaned.includes('could i ask') ||
    cleaned.includes('can we ask') ||
    (cleaned.includes('can') && cleaned.includes('ask'));

  if (targetNorm === 'full' || targetNorm === 'excusemecaniask') {
    const ideal = 'excuse me can i ask';
    const sim = Math.round(
      Math.max(0, 1 - editDistance(cleaned, ideal) / Math.max(ideal.length, cleaned.length)) * 100
    );
    const passed = (hasExcuse && hasAsk) || sim >= 60;
    return {
      assessmentType: 'word-recognition',
      assessed: true,
      passed,
      letterMatch: passed ? Math.max(sim, 75) : sim,
      accuracy: null,
      score: null,
      phonemes: [],
      message: passed
        ? 'Good job! “Excuse me. Can I ask?”가 정확하게 전달되었어요!'
        : hasExcuse
        ? '앞부분 “Excuse me.”는 잘 들렸어요! 뒷부분 “Can I ask?”까지 이어 말해 볼까요?'
        : '조금 다르게 들렸어요. Listen으로 다시 들어보고 말해 볼까요?',
    };
  }

  const SIMPLE_PHRASE_TARGETS = {
    i_am_okay: { ideal: 'i am okay', keywords: ['okay', 'ok', 'fine', 'good'] },
    good_morning: { ideal: 'good morning', keywords: ['morning', 'good'] },
    i_am_gildong: { ideal: 'i am gildong', keywords: ['gildong', 'gil', 'dong', 'am', 'name'] },
    yes_please: { ideal: 'yes please', keywords: ['yes', 'please', 'sure'] },
    thank_you: { ideal: 'thank you', keywords: ['thank', 'thanks'] },
  };
  if (SIMPLE_PHRASE_TARGETS[targetKey] || SIMPLE_PHRASE_TARGETS[targetNorm]) {
    const spec = SIMPLE_PHRASE_TARGETS[targetKey] || SIMPLE_PHRASE_TARGETS[targetNorm];
    const sim = Math.round(
      Math.max(0, 1 - editDistance(cleaned, spec.ideal) / Math.max(spec.ideal.length, cleaned.length)) * 100
    );
    const hasKw = spec.keywords.some(kw => cleaned.includes(kw));
    const passed = hasKw || sim >= 55;
    return {
      assessmentType: 'word-recognition',
      assessed: true,
      passed,
      letterMatch: passed ? Math.max(sim, 75) : sim,
      accuracy: null,
      score: null,
      phonemes: [],
      message: passed ? 'Good job!' : '가이드 음성을 듣고 다시 한 번 말해 볼까요?',
    };
  }

  if (targetNorm === 'help_please' || targetNorm === 'helpplease' || targetNorm === 'myfriendhelpplease') {
    const ideal = 'my friend help please';
    const sim = Math.round(
      Math.max(0, 1 - editDistance(cleaned, ideal) / Math.max(ideal.length, cleaned.length)) * 100
    );
    const hasKeyword =
      cleaned.includes('help') || cleaned.includes('friend') || cleaned.includes('please');
    const passed = hasKeyword || sim >= 55;
    return {
      assessmentType: 'word-recognition',
      assessed: true,
      passed,
      letterMatch: passed ? Math.max(sim, 75) : sim,
      accuracy: null,
      score: null,
      phonemes: [],
      message: passed
        ? 'Good job! “My friend. Help, please!”가 정확하게 전달되었어요!'
        : '가이드를 보며 “My friend. Help, please!”라고 다시 말해 볼까요?',
    };
  }

  if (targetNorm === 'excuse_me' || targetNorm === 'excuseme') {
    const ideal = 'excuse me';
    const sim = Math.round(
      Math.max(0, 1 - editDistance(cleaned, ideal) / Math.max(ideal.length, cleaned.length)) * 100
    );
    const passed = hasExcuse || sim >= 60;
    return {
      assessmentType: 'word-recognition',
      assessed: true,
      passed,
      letterMatch: passed ? Math.max(sim, 70) : sim,
      accuracy: null,
      score: null,
      phonemes: [],
      message: passed ? 'Good job!' : '“Excuse me.”라고 다시 한 번 말해 볼까요?',
    };
  }

  if (targetNorm === 'can_i_ask' || targetNorm === 'caniask') {
    const ideal = 'can i ask';
    const sim = Math.round(
      Math.max(0, 1 - editDistance(cleaned, ideal) / Math.max(ideal.length, cleaned.length)) * 100
    );
    const passed = hasAsk || sim >= 60;
    return {
      assessmentType: 'word-recognition',
      assessed: true,
      passed,
      letterMatch: passed ? Math.max(sim, 70) : sim,
      accuracy: null,
      score: null,
      phonemes: [],
      message: passed ? 'Good job!' : '“Can I ask?”라고 다시 한 번 말해 볼까요?',
    };
  }

  // Section 7.3 single-word 60% similarity logic (e.g. airplane, apple, ask, ant, alligator)
  const words = cleaned.split(' ').filter(w => w && !STOP_WORDS.has(w));
  if (words.length !== 1) {
    return {
      assessmentType: 'word-recognition',
      assessed: true,
      passed: false,
      letterMatch: 0,
      accuracy: null,
      score: null,
      phonemes: [],
      message: '한 단어로 또렷하게 다시 말해 보세요!',
    };
  }
  const recognizedWord = words[0];
  const dist = editDistance(targetNorm, recognizedWord);
  const ratio = 1 - dist / Math.max(targetNorm.length, recognizedWord.length, 1);
  const letterMatch = Math.round(ratio * 100);
  const passed = ratio >= 0.6;

  return {
    assessmentType: 'word-recognition',
    assessed: true,
    passed,
    letterMatch,
    accuracy: null,
    score: null,
    phonemes: [],
    message: passed ? 'Good job!' : '다시 한 번 듣고 또렷하게 말해 볼까요?',
  };
}

const rateBuckets = new Map();
function checkRateLimit(ip, key, limit, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const bucketKey = `${ip}:${key}`;
  const list = (rateBuckets.get(bucketKey) || []).filter(t => now - t < windowMs);
  if (list.length >= limit) return false;
  list.push(now);
  rateBuckets.set(bucketKey, list);
  return true;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (await characterVoiceApi(req,res,url)) return;
  if (await magicRewards.handle(req,res,url)) return;
  if (await magicRewards.blockApi(req,res,url)) return;
  const ip = req.socket.remoteAddress || '127.0.0.1';

  // 1. GET /api/assess-pronunciation
  if (req.method === 'GET' && url.pathname === '/api/assess-pronunciation') {
    const apiKey = getApiKey();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        configured: Boolean(apiKey),
        provider: 'elevenlabs-scribe-v2',
      })
    );
    return;
  }

  // 2. POST /api/assess-pronunciation?word=...
  if (req.method === 'POST' && url.pathname === '/api/assess-pronunciation') {
    if (!checkRateLimit(ip, 'stt', 30)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '요청이 너무 많아요. 잠시 후 다시 시도하거나 함께 말하기를 이용해 주세요.' }));
      return;
    }

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const wavBuffer = Buffer.concat(chunks);

    if (wavBuffer.length < 1000 || wavBuffer.length > 350000 || wavBuffer.toString('ascii', 0, 4) !== 'RIFF') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '유효한 WAV 오디오 형식이 아니거나 길이가 너무 짧아요.' }));
      return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '서버에 ElevenLabs API 키가 설정되어 있지 않아요.' }));
      return;
    }

    const targetWord = url.searchParams.get('word') || url.searchParams.get('target') || 'full';

    try {
      const form = new FormData();
      form.append('file', new Blob([wavBuffer], { type: 'audio/wav' }), 'word.wav');
      form.append('model_id', 'scribe_v2');
      form.append('language_code', 'eng');
      form.append('tag_audio_events', 'false');
      form.append('diarize', 'false');
      if(process.env.MAGIC_ENGLISH_STT_KEYTERMS!=='false')for(const term of ['Airplane','Apple','Ask','Bus','Bag','Big'])form.append('keyterms',term);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45000);
      const sttRes = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: form,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!sttRes.ok) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '음성 인식 서비스 응답 오류가 발생했어요. 다시 시도하거나 함께 말하기를 눌러 주세요.' }));
        return;
      }

      const data = await sttRes.json();
      const {assessLearningSpeech} = await import('./magic-english-learning.js');
      const result = magicRewards.assessment(assessLearningSpeech(data.text || '', targetWord), url.searchParams.get('userId') || 'demo', url.searchParams.get('attemptId') || crypto.randomUUID());
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '음성 인식 요청 중 오류가 발생했어요.' }));
    }
    return;
  }

  // 3. POST /api/welcome-voice (Section 5 dynamic greeting with Fena)
  if (req.method === 'POST' && url.pathname === '/api/welcome-voice') {
    if (!checkRateLimit(ip, 'welcome', 15)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Too many requests' }));
      return;
    }

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    let body = {};
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      // ignore
    }
    const name = String(body.name || '').trim();
    if (!/^[A-Za-z]{1,12}$/.test(name)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid English name (1-12 letters)' }));
      return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API key not configured' }));
      return;
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      const ttsRes = await fetch(
        'https://api.elevenlabs.io/v1/text-to-speech/BlgEcC0TfWpBak7FmvHW?output_format=mp3_44100_128',
        {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: `Great, ${name}! It's nice to meet you!`,
            model_id: 'eleven_flash_v2',
            voice_settings: {
              speed: 0.8,
              stability: 0.75,
              similarity_boost: 0.75,
            },
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timer);
      if (!ttsRes.ok) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'TTS failed' }));
        return;
      }
      const mp3Buf = Buffer.from(await ttsRes.arrayBuffer());
      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      });
      res.end(mp3Buf);
    } catch {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'TTS error' }));
    }
    return;
  }

  // Static files
  let relPath = decodeURIComponent(url.pathname);
  if (relPath === '/') relPath = '/index.html';
  if (relPath.endsWith('/')) relPath += 'index.html';
  if (relPath.split('/').some(part=>part.startsWith('.'))) {res.writeHead(403);res.end('Forbidden');return;}
  const filePath = path.normalize(path.join(ROOT, relPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Magic English Stage 1 Server listening on http://localhost:${PORT}`);
});
