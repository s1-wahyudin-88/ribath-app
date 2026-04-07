/**
 * shared.js — Ribath Iqra Izzul Islam
 * ─────────────────────────────────────────────────────────────
 * File ini diinjek ke KETIGA halaman (home, santri, admin).
 * Mengatur:
 *   1. Auth & session management
 *   2. Navigasi antar halaman
 *   3. Floating nav buttons (muncul setelah login)
 *   4. Inisialisasi tema global
 *
 * CARA PAKAI:
 *   Letakkan <script src="shared.js"></script>
 *   sebelum </body> di ketiga file HTML.
 * ─────────────────────────────────────────────────────────────
 */

// ── KONFIGURASI ───────────────────────────────────────────────
// Sesuaikan path file jika folder berbeda
const RIBATH_CONFIG = {
  homeURL:   'ribath-iqra-home.html',
  santriURL: 'ribath-iqra-santri.html',  // + ?id=X akan ditambah otomatis
  adminURL:  'ribath-iqra-admin.html',

  // Key untuk sessionStorage
  KEY_ADMIN:  'ribath_admin_auth',
  KEY_SANTRI: 'ribath_santri_id',      // menyimpan id santri yang sedang login
  KEY_SANTRI_NAMA: 'ribath_santri_nama',
};

// ── DETEKSI HALAMAN AKTIF ─────────────────────────────────────
// Tambahkan atribut data-page="home|santri|admin" di tag <body> setiap file
// Contoh: <body data-page="admin">
const CURRENT_PAGE = document.body.getAttribute('data-page') || 'home';

// ══════════════════════════════════════════════════════════════
//  AUTH HELPERS
// ══════════════════════════════════════════════════════════════

const RibathAuth = {

  // Cek apakah admin sudah login di sesi ini
  isAdmin() {
    return sessionStorage.getItem(RIBATH_CONFIG.KEY_ADMIN) === 'true';
  },

  // Login admin — dipanggil setelah PIN 6 digit benar
  loginAdmin() {
    sessionStorage.setItem(RIBATH_CONFIG.KEY_ADMIN, 'true');
  },

  // Logout admin
  logoutAdmin() {
    sessionStorage.removeItem(RIBATH_CONFIG.KEY_ADMIN);
  },

  // Cek apakah santri sudah login di sesi ini
  isSantri() {
    return !!sessionStorage.getItem(RIBATH_CONFIG.KEY_SANTRI);
  },

  // ID santri yang sedang login
  getSantriId() {
    return sessionStorage.getItem(RIBATH_CONFIG.KEY_SANTRI);
  },

  getSantriNama() {
    return sessionStorage.getItem(RIBATH_CONFIG.KEY_SANTRI_NAMA) || '';
  },

  // Login santri — dipanggil setelah PIN 4 digit benar
  loginSantri(id, nama) {
    sessionStorage.setItem(RIBATH_CONFIG.KEY_SANTRI, String(id));
    sessionStorage.setItem(RIBATH_CONFIG.KEY_SANTRI_NAMA, nama);
  },

  // Logout santri (kembali ke home publik)
  logoutSantri() {
    sessionStorage.removeItem(RIBATH_CONFIG.KEY_SANTRI);
    sessionStorage.removeItem(RIBATH_CONFIG.KEY_SANTRI_NAMA);
  },

  // Logout total (semua sesi)
  logoutAll() {
    sessionStorage.clear();
  },
};

// ══════════════════════════════════════════════════════════════
//  NAVIGASI
// ══════════════════════════════════════════════════════════════

const RibathNav = {

  // Admin → Home publik (langsung, tanpa PIN)
  goHome() {
    window.location.href = RIBATH_CONFIG.homeURL;
  },

  // Admin → Halaman santri tertentu (langsung, tanpa PIN)
  goSantri(id) {
    // Admin bypass PIN santri — langsung buka dengan flag
    sessionStorage.setItem('ribath_admin_preview', id);
    window.location.href = RIBATH_CONFIG.santriURL + '?id=' + id;
  },

  // Home/Santri → Admin (wajib PIN, minta dulu)
  goAdmin() {
    RibathPinPrompt.show({
      tipe: 'admin',
      judul: 'Masuk Panel Admin',
      sub: 'Masukkan PIN Admin 6 digit',
      digits: 6,
      onSuccess: () => {
        RibathAuth.loginAdmin();
        window.location.href = RIBATH_CONFIG.adminURL;
      },
    });
  },

  // Santri → Home publik (langsung, tanpa PIN)
  goHomeFromSantri() {
    RibathAuth.logoutSantri();
    window.location.href = RIBATH_CONFIG.homeURL;
  },

  // Home → Santri (minta PIN santri)
  goSantriFromHome(id, nama, correctPin) {
    RibathPinPrompt.show({
      tipe: 'santri',
      judul: nama,
      sub: 'Masukkan PIN 4 digit',
      digits: 4,
      correctPin: correctPin,
      onSuccess: () => {
        RibathAuth.loginSantri(id, nama);
        window.location.href = RIBATH_CONFIG.santriURL + '?id=' + id;
      },
    });
  },
};

// ══════════════════════════════════════════════════════════════
//  PIN PROMPT UNIVERSAL
//  Satu modal PIN yang bisa dipakai dari halaman mana saja
// ══════════════════════════════════════════════════════════════

const RibathPinPrompt = {

  _config: null,
  _input: '',

  show(config) {
    // config: { tipe, judul, sub, digits, correctPin (opsional), onSuccess }
    this._config = config;
    this._input  = '';
    this._render();
    document.getElementById('_ribathPinOverlay').classList.add('open');
  },

  hide() {
    const el = document.getElementById('_ribathPinOverlay');
    if (el) el.classList.remove('open');
    this._input = '';
  },

  _render() {
    // Buat overlay kalau belum ada
    if (!document.getElementById('_ribathPinOverlay')) {
      const div = document.createElement('div');
      div.id = '_ribathPinOverlay';
      div.innerHTML = this._template();
      document.body.appendChild(div);
    } else {
      document.getElementById('_ribathPinOverlay').innerHTML = this._template();
    }
    this._updateDots();
  },

  _template() {
    const c = this._config;
    const dots = Array.from({ length: c.digits }, (_, i) =>
      `<div class="_rpin-dot" id="_rpdot${i}"></div>`
    ).join('');

    return `
      <div id="_ribathPinOverlay" class="open" onclick="if(event.target===this)RibathPinPrompt.hide()">
        <div class="_rpin-sheet">
          <div class="_rpin-handle"></div>
          <div class="_rpin-title">${c.judul}</div>
          <div class="_rpin-sub">${c.sub}</div>
          <div class="_rpin-dots">${dots}</div>
          <div class="_rpin-error" id="_rpinError"></div>
          <div class="_rpin-numpad">
            ${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(k => {
              if (k === '') return `<button class="_rpin-key _rpin-empty"></button>`;
              if (k === '⌫') return `<button class="_rpin-key _rpin-del" onclick="RibathPinPrompt._del()">⌫</button>`;
              return `<button class="_rpin-key" onclick="RibathPinPrompt._press('${k}')">${k}</button>`;
            }).join('')}
          </div>
          <button class="_rpin-cancel" onclick="RibathPinPrompt.hide()">Batal</button>
        </div>
      </div>`;
  },

  _press(d) {
    const max = this._config.digits;
    if (this._input.length >= max) return;
    this._input += d;
    this._updateDots();
    if (this._input.length === max) setTimeout(() => this._check(), 180);
  },

  _del() {
    this._input = this._input.slice(0, -1);
    this._updateDots();
    const err = document.getElementById('_rpinError');
    if (err) err.textContent = '';
  },

  _updateDots() {
    for (let i = 0; i < this._config.digits; i++) {
      const dot = document.getElementById(`_rpdot${i}`);
      if (!dot) continue;
      dot.classList.remove('_filled', '_error');
      if (i < this._input.length) dot.classList.add('_filled');
    }
  },

  _check() {
    const c = this._config;

    // Jika admin: validasi terhadap ADMIN_PIN global (ada di admin.html)
    // Jika santri: validasi terhadap correctPin yang dikirim
    let correct = false;

    if (c.tipe === 'admin') {
      // ADMIN_PIN didefinisikan di ribath-iqra-admin.html
      // Di halaman lain, kita set via window.RIBATH_ADMIN_PIN
      const pin = window.RIBATH_ADMIN_PIN || '123456';
      correct = this._input === pin;
    } else {
      correct = this._input === String(c.correctPin);
    }

    if (correct) {
      this.hide();
      c.onSuccess();
    } else {
      // Animasi error
      for (let i = 0; i < c.digits; i++) {
        const dot = document.getElementById(`_rpdot${i}`);
        if (dot) { dot.classList.remove('_filled'); dot.classList.add('_error'); }
      }
      const err = document.getElementById('_rpinError');
      if (err) err.textContent = 'PIN salah, coba lagi';
      setTimeout(() => {
        for (let i = 0; i < c.digits; i++) {
          const dot = document.getElementById(`_rpdot${i}`);
          if (dot) dot.classList.remove('_error');
        }
        if (err) err.textContent = '';
        this._input = '';
        this._updateDots();
      }, 900);
    }
  },
};

// ══════════════════════════════════════════════════════════════
//  FLOATING NAV BAR
//  Muncul di sudut kanan bawah semua halaman
//  Isinya berbeda tergantung halaman & status login
// ══════════════════════════════════════════════════════════════

function _buildFloatingNav() {
  const bar = document.createElement('div');
  bar.id = '_ribathFloatNav';

  let buttons = [];

  if (CURRENT_PAGE === 'admin') {
    // Admin bisa lihat home publik dan halaman santri
    buttons = [
      { icon: '🌐', label: 'Home Publik', action: `RibathNav.goHome()` },
    ];
  }

  if (CURRENT_PAGE === 'santri') {
    buttons = [
      { icon: '🏠', label: 'Home Publik', action: `RibathNav.goHomeFromSantri()` },
    ];
  }

  if (CURRENT_PAGE === 'home') {
    // Home publik tidak punya tombol ke admin
    // Hanya tampilkan jika admin sudah login sebelumnya di sesi ini
    // (misal admin buka home dari panel untuk preview)
    if (RibathAuth.isAdmin()) {
      buttons = [
        { icon: '⚙️', label: 'Kembali ke Admin', action: `window.location.href='${RIBATH_CONFIG.adminURL}'` },
      ];
    }
  }

  if (buttons.length === 0) return; // tidak perlu floating nav

  bar.innerHTML = `
    <div class="_fnav-inner">
      ${buttons.map(b => `
        <button class="_fnav-btn" onclick="${b.action}" title="${b.label}">
          <span class="_fnav-icon">${b.icon}</span>
          <span class="_fnav-label">${b.label}</span>
        </button>`).join('')}
    </div>`;

  document.body.appendChild(bar);
}

// ══════════════════════════════════════════════════════════════
//  STYLES — injek ke <head> agar tidak perlu edit HTML
// ══════════════════════════════════════════════════════════════

function _injectSharedStyles() {
  const style = document.createElement('style');
  style.textContent = `

    /* ── PIN Overlay Universal ── */
    #_ribathPinOverlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(6px);
      z-index: 9000;
      display: none;
      align-items: flex-end;
      justify-content: center;
    }

    #_ribathPinOverlay.open { display: flex; }

    ._rpin-sheet {
      background: var(--rpin-bg, #1A2A1C);
      border: 1px solid var(--rpin-border, rgba(255,255,255,0.08));
      border-radius: 22px 22px 0 0;
      width: 100%;
      max-width: 380px;
      padding: 12px 24px 40px;
      animation: _rpinUp 0.32s cubic-bezier(0.34, 1.2, 0.64, 1);
    }

    @keyframes _rpinUp {
      from { transform: translateY(100%); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }

    ._rpin-handle {
      width: 36px; height: 4px;
      background: var(--rpin-handle, rgba(255,255,255,0.15));
      border-radius: 99px;
      margin: 0 auto 20px;
    }

    ._rpin-title {
      font-family: var(--font-display, 'Lora', serif);
      font-size: 20px;
      font-weight: 600;
      color: var(--rpin-text, #F0EDE8);
      text-align: center;
      margin-bottom: 4px;
    }

    ._rpin-sub {
      font-size: 13px;
      color: var(--rpin-sub, #A09880);
      text-align: center;
      margin-bottom: 22px;
    }

    ._rpin-dots {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-bottom: 8px;
    }

    ._rpin-dot {
      width: 16px; height: 16px;
      border-radius: 50%;
      border: 2px solid var(--rpin-dot-border, rgba(255,255,255,0.2));
      background: transparent;
      transition: all 0.18s;
    }

    ._rpin-dot._filled {
      background: var(--gold, #C49A3A);
      border-color: var(--gold, #C49A3A);
      transform: scale(1.15);
    }

    ._rpin-dot._error {
      background: #E05555;
      border-color: #E05555;
      animation: _rpinShake 0.4s ease;
    }

    @keyframes _rpinShake {
      0%,100% { transform: translateX(0); }
      25%      { transform: translateX(-5px); }
      75%      { transform: translateX(5px); }
    }

    ._rpin-error {
      text-align: center;
      font-size: 12px;
      color: #E05555;
      font-weight: 600;
      height: 18px;
      margin-bottom: 16px;
    }

    ._rpin-numpad {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 9px;
      max-width: 280px;
      margin: 0 auto 14px;
    }

    ._rpin-key {
      height: 54px;
      border-radius: 11px;
      border: 1px solid var(--rpin-key-border, rgba(255,255,255,0.08));
      background: var(--rpin-key-bg, rgba(255,255,255,0.05));
      color: var(--rpin-text, #F0EDE8);
      font-family: 'Lora', serif;
      font-size: 20px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.12s;
    }

    ._rpin-key:hover  { background: var(--gold-pale, rgba(196,154,58,0.15)); border-color: var(--gold, #C49A3A); }
    ._rpin-key:active { transform: scale(0.93); }

    ._rpin-del {
      font-size: 16px !important;
      color: #E05555 !important;
      background: rgba(224,85,85,0.08) !important;
      border-color: transparent !important;
    }

    ._rpin-empty { opacity: 0; pointer-events: none; }

    ._rpin-cancel {
      display: block;
      margin: 0 auto;
      background: none;
      border: none;
      color: var(--rpin-sub, #A09880);
      font-size: 13px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      cursor: pointer;
      padding: 8px 20px;
      border-radius: 20px;
      transition: color 0.15s;
    }

    ._rpin-cancel:hover { color: var(--rpin-text, #F0EDE8); }

    /* ── Floating Nav ── */
    #_ribathFloatNav {
      position: fixed;
      bottom: 24px;
      right: 20px;
      z-index: 8000;
    }

    ._fnav-inner {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
    }

    ._fnav-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--brown-dark, #3D2B14);
      border: 1px solid rgba(196,154,58,0.3);
      color: var(--gold-light, #E2B94A);
      padding: 10px 16px;
      border-radius: 99px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.35);
      transition: all 0.2s;
      white-space: nowrap;
    }

    ._fnav-btn:hover {
      background: var(--gold, #C49A3A);
      color: #fff;
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(196,154,58,0.35);
    }

    ._fnav-icon { font-size: 16px; }
  `;
  document.head.appendChild(style);
}

// ══════════════════════════════════════════════════════════════
//  INIT — dipanggil otomatis saat shared.js dimuat
// ══════════════════════════════════════════════════════════════

(function init() {
  _injectSharedStyles();

  // Tunggu DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _buildFloatingNav);
  } else {
    _buildFloatingNav();
  }
})();
