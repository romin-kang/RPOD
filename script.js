// =============================================================
//  DEINE MUSIK – hier anpassen
// =============================================================
const TRACKS = [
  {
    title:  "Pissy Pampers V2",
    artist: "romin",
    audio:  "assets/song1.mp3",
    cover:  "assets/song1.jpg"
  },
  {
    title:  "Swag Type",
    artist: "romin",
    audio:  "assets/song2.mp3",
    cover:  "assets/song2.jpg"
  },
  {
    title:  "Tenderism",
    artist: "romin",
    audio:  "assets/song3.mp3",
    cover:  "assets/song3.avif"
  },
  // Neuen Song? Einfach hier reinkopieren:
  // { title: "Name", artist: "Dein Name", audio: "assets/song4.mp3", cover: "assets/song4.jpg" },
];
// =============================================================


// ── Audio Analyser ─────────────────────────────────────────
let audioCtx, analyser, dataArray, source, audioConnected = false;

function connectAudio() {
  if (audioConnected) return;
  audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
  analyser  = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  source    = audioCtx.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  audioConnected = true;
}

function getFreqBands() {
  if (!analyser) return { bass: 0, mid: 0, high: 0 };
  analyser.getByteFrequencyData(dataArray);
  const len   = dataArray.length;
  const bass  = avg(dataArray, 0,              Math.floor(len * 0.1))  / 255;
  const mid   = avg(dataArray, Math.floor(len * 0.1), Math.floor(len * 0.5)) / 255;
  const high  = avg(dataArray, Math.floor(len * 0.5), len)             / 255;
  return { bass, mid, high };
}

function avg(arr, from, to) {
  let sum = 0;
  for (let i = from; i < to; i++) sum += arr[i];
  return sum / (to - from);
}


// ── Reactive Canvas Background ────────────────────────────
const canvas = document.getElementById('bgCanvas');
const ctx    = canvas.getContext('2d');

// Orb definitions  – türkis / hellblau / pink
const ORBS = [
  { x: 0.2, y: 0.3, r: 0.38, band: 'bass',  hue: 185, sat: 90, lit: 55, speed: 0.00018, ox: 0, oy: 0 },
  { x: 0.7, y: 0.6, r: 0.32, band: 'mid',   hue: 200, sat: 85, lit: 60, speed: 0.00024, ox: 1, oy: 1 },
  { x: 0.5, y: 0.8, r: 0.28, band: 'high',  hue: 170, sat: 80, lit: 65, speed: 0.00031, ox: 2, oy: 2 },
  { x: 0.85,y: 0.2, r: 0.22, band: 'mid',   hue: 330, sat: 70, lit: 70, speed: 0.00021, ox: 3, oy: 3 }, // pink
  { x: 0.1, y: 0.75,r: 0.20, band: 'bass',  hue: 210, sat: 80, lit: 58, speed: 0.00015, ox: 4, oy: 4 },
];

// Smooth values
const smooth = { bass: 0, mid: 0, high: 0 };
const SMOOTHING = 0.12;

// Floating particles
const PARTICLES = Array.from({ length: 80 }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: Math.random() * 1.8 + 0.4,
  vx: (Math.random() - 0.5) * 0.0002,
  vy: (Math.random() - 0.5) * 0.0002,
  alpha: Math.random() * 0.5 + 0.1,
  hue: [185, 200, 170, 330, 210][Math.floor(Math.random() * 5)]
}));

// Ripple rings triggered by bass
const RIPPLES = [];
let lastBass = 0;

function spawnRipple(w, h) {
  RIPPLES.push({
    x: Math.random() * w,
    y: Math.random() * h,
    r: 0,
    maxR: Math.min(w, h) * (0.15 + Math.random() * 0.2),
    alpha: 0.35,
    hue: Math.random() > 0.5 ? 185 : 330
  });
}

function resizeCanvas() {
  canvas.width  = window.innerWidth  * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
  canvas.style.width  = window.innerWidth  + 'px';
  canvas.style.height = window.innerHeight + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let t = 0;

function drawBg() {
  const W = canvas.width;
  const H = canvas.height;
  const bands = getFreqBands();

  // Smooth the values
  smooth.bass += (bands.bass - smooth.bass) * SMOOTHING;
  smooth.mid  += (bands.mid  - smooth.mid)  * SMOOTHING;
  smooth.high += (bands.high - smooth.high) * SMOOTHING;

  // Bass spike → spawn ripple
  if (smooth.bass > 0.45 && smooth.bass - lastBass > 0.06) {
    spawnRipple(W, H);
  }
  lastBass = smooth.bass;

  t += 1;

  // Dark base
  ctx.fillStyle = '#020a10';
  ctx.fillRect(0, 0, W, H);

  // Draw orbs
  ORBS.forEach((o, i) => {
    const bandVal = smooth[o.band];
    const floatX  = Math.sin(t * o.speed * 1000 + o.ox * 1.3) * 0.07;
    const floatY  = Math.cos(t * o.speed * 800  + o.oy * 1.1) * 0.06;
    const cx = (o.x + floatX) * W;
    const cy = (o.y + floatY) * H;
    const radius = o.r * Math.min(W, H) * (1 + bandVal * 0.35);

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    const lit  = o.lit + bandVal * 15;
    const alpha1 = 0.18 + bandVal * 0.22;
    const alpha2 = 0.06 + bandVal * 0.08;
    grad.addColorStop(0,   `hsla(${o.hue}, ${o.sat}%, ${lit}%, ${alpha1})`);
    grad.addColorStop(0.5, `hsla(${o.hue}, ${o.sat}%, ${lit - 10}%, ${alpha1 * 0.5})`);
    grad.addColorStop(1,   `hsla(${o.hue}, ${o.sat}%, ${lit - 20}%, 0)`);

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  });

  // Draw particles
  PARTICLES.forEach(p => {
    p.x += p.vx + smooth.mid * 0.0003 * (Math.random() - 0.5);
    p.y += p.vy + smooth.bass * 0.0003 * (Math.random() - 0.5);
    if (p.x < 0) p.x = 1;
    if (p.x > 1) p.x = 0;
    if (p.y < 0) p.y = 1;
    if (p.y > 1) p.y = 0;

    const brightness = 70 + smooth.high * 30;
    const alpha = p.alpha * (0.6 + smooth.mid * 0.8);
    ctx.beginPath();
    ctx.arc(p.x * W, p.y * H, p.r * (1 + smooth.bass * 1.5), 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue}, 80%, ${brightness}%, ${alpha})`;
    ctx.fill();
  });

  // Draw ripples
  for (let i = RIPPLES.length - 1; i >= 0; i--) {
    const rp = RIPPLES[i];
    rp.r     += 2.5 + smooth.bass * 8;
    rp.alpha -= 0.008;
    if (rp.alpha <= 0 || rp.r > rp.maxR) { RIPPLES.splice(i, 1); continue; }

    ctx.beginPath();
    ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${rp.hue}, 85%, 70%, ${rp.alpha})`;
    ctx.lineWidth   = 1.5;
    ctx.stroke();
  }

  // Subtle grid lines (retro PS3 vibe)
  const gridAlpha = 0.03 + smooth.mid * 0.04;
  ctx.strokeStyle = `rgba(100, 220, 255, ${gridAlpha})`;
  ctx.lineWidth   = 0.5;
  const spacing   = 60;
  for (let x = 0; x < W; x += spacing) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += spacing) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Vignette
  const vig = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H) * 0.75);
  vig.addColorStop(0,   'rgba(0,0,0,0)');
  vig.addColorStop(1,   'rgba(0,0,0,0.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  requestAnimationFrame(drawBg);
}

drawBg();


// ── iPod State ─────────────────────────────────────────────
const state = {
  tracks: [],
  currentIndex: -1,
  isPlaying: false,
  view: 'nowplaying'
};

const audio = document.getElementById('audioPlayer');

function init() {
  TRACKS.forEach(t => {
    state.tracks.push({
      title:    t.title,
      artist:   t.artist,
      audioUrl: t.audio,
      coverUrl: t.cover || null
    });
  });
  if (state.tracks.length > 0) loadTrack(0);
  renderView();
}

// ── Helpers ────────────────────────────────────────────────
function formatTime(secs) {
  if (isNaN(secs) || !isFinite(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function flash(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.color = '#000';
  setTimeout(() => { el.style.color = ''; }, 200);
}

// ── Render ─────────────────────────────────────────────────
function renderView() {
  const container = document.getElementById('screenContent');
  state.view === 'playlist' ? renderPlaylist(container) : renderNowPlaying(container);
}

function renderNowPlaying(container) {
  const t = state.tracks[state.currentIndex];
  container.innerHTML = `
    <div class="now-playing">
      <div class="cover-art">
        ${t && t.coverUrl
          ? `<img src="${t.coverUrl}" alt="Cover" />`
          : `<div class="cover-placeholder">♪</div>`}
      </div>
      <div class="track-info">
        <div class="track-title">
          ${t ? t.title : '–'}
          ${state.isPlaying ? '<span class="playing-dot"></span>' : ''}
        </div>
        <div class="track-artist">${t ? t.artist : ''}</div>
      </div>
      <div class="progress-bar-wrap">
        <span id="timeElapsed">0:00</span>
        <div class="progress-bar" id="progressBar">
          <div class="progress-fill" id="progressFill" style="width:0%"></div>
        </div>
        <span id="timeTotal">0:00</span>
      </div>
    </div>
  `;
  document.getElementById('progressBar').addEventListener('click', seekTo);
  updateProgress();
}

function renderPlaylist(container) {
  const items = state.tracks.map((t, i) => `
    <li class="playlist-item ${i === state.currentIndex ? 'active' : ''}" data-index="${i}">
      <div class="playlist-item-cover">
        ${t.coverUrl ? `<img src="${t.coverUrl}" alt="" />` : '♪'}
      </div>
      <div class="playlist-item-info">
        <div class="playlist-item-title">${t.title}</div>
        <div class="playlist-item-artist">${t.artist}</div>
      </div>
    </li>
  `).join('');

  container.innerHTML = `
    <div class="playlist-view">
      <div class="playlist-header">Playlist</div>
      <ul class="playlist-list">${items}</ul>
    </div>
  `;

  container.querySelectorAll('.playlist-item').forEach(el => {
    el.addEventListener('click', () => {
      loadTrack(parseInt(el.dataset.index));
      play();
      state.view = 'nowplaying';
      renderView();
    });
  });
}

// ── Playback ───────────────────────────────────────────────
function loadTrack(index) {
  if (index < 0 || index >= state.tracks.length) return;
  state.currentIndex = index;
  audio.src = state.tracks[index].audioUrl;
  audio.load();
}

function play() {
  connectAudio();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  audio.play();
  state.isPlaying = true;
  if (state.view === 'nowplaying') renderView();
}

function pause() {
  audio.pause();
  state.isPlaying = false;
  if (state.view === 'nowplaying') renderView();
}

function togglePlay() {
  state.isPlaying ? pause() : play();
}

function skipNext() {
  loadTrack((state.currentIndex + 1) % state.tracks.length);
  if (state.isPlaying) play();
  if (state.view === 'nowplaying') renderView();
}

function skipPrev() {
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  loadTrack((state.currentIndex - 1 + state.tracks.length) % state.tracks.length);
  if (state.isPlaying) play();
  if (state.view === 'nowplaying') renderView();
}

function toggleMenu() {
  state.view = state.view === 'playlist' ? 'nowplaying' : 'playlist';
  renderView();
}

// ── Progress ───────────────────────────────────────────────
function updateProgress() {
  const fill    = document.getElementById('progressFill');
  const elapsed = document.getElementById('timeElapsed');
  const total   = document.getElementById('timeTotal');
  if (!fill) return;
  const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  fill.style.width = pct + '%';
  if (elapsed) elapsed.textContent = formatTime(audio.currentTime);
  if (total)   total.textContent   = formatTime(audio.duration);
}

function seekTo(e) {
  const rect  = e.currentTarget.getBoundingClientRect();
  const ratio = (e.clientX - rect.left) / rect.width;
  audio.currentTime = ratio * audio.duration;
}

// ── Click Wheel ────────────────────────────────────────────
document.getElementById('clickWheel').addEventListener('click', function(e) {
  const rect  = this.getBoundingClientRect();
  const cx    = rect.left + rect.width  / 2;
  const cy    = rect.top  + rect.height / 2;
  const dx    = e.clientX - cx;
  const dy    = e.clientY - cy;
  const r     = Math.sqrt(dx * dx + dy * dy);
  if (r < (rect.width / 2) * 0.35) return;

  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  if      (angle > -45  && angle <= 45)  { flash('btnNext');      skipNext();   }
  else if (angle > 45   && angle <= 135) { flash('btnPlayPause'); togglePlay(); }
  else if (angle > 135  || angle <= -135){ flash('btnPrev');      skipPrev();   }
  else                                   { flash('btnMenu');      toggleMenu(); }
});

document.getElementById('btnCenter').addEventListener('click', function(e) {
  e.stopPropagation();
  togglePlay();
});

// ── Audio Events ───────────────────────────────────────────
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('ended', skipNext);
audio.addEventListener('play',  () => { state.isPlaying = true;  if (state.view === 'nowplaying') renderView(); });
audio.addEventListener('pause', () => { state.isPlaying = false; if (state.view === 'nowplaying') renderView(); });

// ── Keyboard ───────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.code === 'Space')      { e.preventDefault(); togglePlay(); }
  if (e.code === 'ArrowRight') skipNext();
  if (e.code === 'ArrowLeft')  skipPrev();
  if (e.code === 'KeyM')       toggleMenu();
});

// ── Start ──────────────────────────────────────────────────
init();
