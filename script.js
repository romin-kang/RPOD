// =============================================================
//  audio: Pfad zur MP3  →  assets/songX.mp3
//  cover: Pfad zum Bild →  assets/songX.jpg  (oder null)
//  title: Anzeigename des Songs
//  artist: Dein Kuenstlername
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
  // Neuen Song hinzufügen? Einfach hier reinkopieren:
  // {
  //   title:  "Song Name X",
  //   artist: "kuenstler name",
  //   audio:  "assets/songX.mp3",
  //   cover:  "assets/songX.jpg"
  // },
];
// =============================================================


// ── State ──────────────────────────────────────────────────
const state = {
  tracks: [],
  currentIndex: -1,
  isPlaying: false,
  view: 'nowplaying' // 'nowplaying' | 'playlist'
};

const audio = document.getElementById('audioPlayer');

// ── Boot ───────────────────────────────────────────────────
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
  const cx    = rect.left + rect.width / 2;
  const cy    = rect.top  + rect.height / 2;
  const dx    = e.clientX - cx;
  const dy    = e.clientY - cy;
  const r     = Math.sqrt(dx * dx + dy * dy);
  if (r < (rect.width / 2) * 0.35) return; // center button zone

  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  if (angle > -45 && angle <= 45)        { flash('btnNext');      skipNext();   }
  else if (angle > 45 && angle <= 135)   { flash('btnPlayPause'); togglePlay(); }
  else if (angle > 135 || angle <= -135) { flash('btnPrev');      skipPrev();   }
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
