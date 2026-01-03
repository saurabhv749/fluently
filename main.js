// main.js - vanilla JS word loader + Web Speech TTS
const urlInput = document.getElementById('url');
const loadBtn = document.getElementById('load');
const statusEl = document.getElementById('status');
const wordsEl = document.getElementById('words');
const voiceSelect = document.getElementById('voice');
const rateInput = document.getElementById('rate');
const pitchInput = document.getElementById('pitch');

let voices = [];

function populateVoices() {
    voices = speechSynthesis.getVoices() || [];
    voiceSelect.innerHTML = '';
    voices.forEach((v, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `${v.name} (${v.lang})${v.default ? ' — default' : ''}`;
        voiceSelect.appendChild(opt);
    });
}

if (typeof speechSynthesis !== 'undefined') {
    populateVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = populateVoices;
} else {
    statusEl.textContent = 'Speech Synthesis not supported in this browser.';
}

async function loadWords(url) {
    statusEl.textContent = 'Loading...';
    wordsEl.innerHTML = '';
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Network response not ok: ' + res.status);
        const txt = await res.text();
        const lines = txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        if (lines.length === 0) {
            statusEl.textContent = 'No words found in the file.';
            return;
        }
        statusEl.textContent = `Loaded ${lines.length} words.`;
        renderWords(lines);
    } catch (err) {
        statusEl.textContent = 'Error loading file: ' + err.message + (err.name === 'TypeError' ? ' (CORS or network?)' : '');
    }
}

function renderWords(list) {
    const frag = document.createDocumentFragment();
    list.forEach(word => {
        const b = document.createElement('button');
        b.className = 'word';
        b.type = 'button';
        b.textContent = word;
        b.tabIndex = 0;
        b.addEventListener('click', () => speak(word));
        b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); speak(word); } });
        frag.appendChild(b);
    });
    wordsEl.appendChild(frag);
}

function speak(text) {
    if (typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const idx = parseInt(voiceSelect.value, 10);
    if (!Number.isNaN(idx) && voices[idx]) u.voice = voices[idx];
    u.rate = parseFloat(rateInput.value) || 1;
    u.pitch = parseFloat(pitchInput.value) || 1;
    speechSynthesis.speak(u);
}

loadBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (!url) { statusEl.textContent = 'Please enter a URL to the words file.'; return; }
    loadWords(url);
});

// Optional: quick example URL placeholder when field is empty
// You can host common_words.txt on a server with CORS enabled, or place it in the same folder and serve via a local server.
urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') loadBtn.click(); });

// If file is located next to index.html you can use: './common_words.txt'
