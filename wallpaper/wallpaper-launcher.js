/* ============================================================================
   WALLPAPER ENGINE & LINUX OPTICAL GLASS LAUNCHER MODULE (v3)
   - CEF-safe custom application picker (no native <select>/confirm/time popups)
   - Win32 Physical Keyboard IME Bridge + Mouse Wheel SSE Stream
   - 2-Column Wide News Reader & Real Windows Application/File Icons
   - On-Screen Wallpaper & Liquid Glass Quality/FPS/Pixel-Density Settings Widget
   ============================================================================ */

const BRIDGE_BASE_URL = 'http://127.0.0.1:47831';
const DESKTOP_DOCK_KEY = 'diorama_desktop_dock_v1';
const WE_SETTINGS_STORAGE_KEY = 'diorama_we_settings_v1';
const WE_PROP_SNAPSHOT_KEY = 'diorama_we_prop_snapshot_v1';

// Initialize UI language early so every desktop widget boots in the user's chosen language
let __bootLang = 'tr';
try {
  const __savedWeCfg = lsGet(WE_SETTINGS_STORAGE_KEY, null);
  if (__savedWeCfg && __savedWeCfg.language === 'en') __bootLang = 'en';
} catch {}
window.__weLang = __bootLang;
const isEn = () => window.__weLang === 'en';
const L = (tr, en) => (isEn() ? en : tr);

// Prevent native Win32 modal dialogs (confirm/alert/prompt) from crashing Wallpaper Engine CEF
window.confirm = () => true;
window.alert = (msg) => {
  if (typeof showDesktopToast === 'function') showDesktopToast(String(msg || ''));
};

const DESKTOP_ICONS = {
  pc: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  app: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>`,
  folder: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>`,
  download: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  file: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  code: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  terminal: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
  music: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  chat: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`,
  game: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="4"/></svg>`,
  settings: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
  cpu: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>`,
  globe: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>`,
  media: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  archive: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,
  desktop: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
};

const FALLBACK_LOCAL_ITEMS = [
  { id: 'fb-explorer', name: 'Dosya Gezgini', nameEn: 'File Explorer', kind: 'app', category: 'Sistem', target: 'explorer.exe', subtitle: 'Windows Dosya Gezgini', subtitleEn: 'Windows File Explorer', icon: 'folder' },
  { id: 'fb-downloads', name: 'İndirilenler Klasörü', nameEn: 'Downloads Folder', kind: 'folder', category: 'Klasör', target: 'shell:Downloads', subtitle: 'İndirilen dosyalar', subtitleEn: 'Downloaded files', icon: 'download' },
  { id: 'fb-documents', name: 'Belgeler Klasörü', nameEn: 'Documents Folder', kind: 'folder', category: 'Klasör', target: 'shell:Personal', subtitle: 'Kişisel belgeler', subtitleEn: 'Personal documents', icon: 'file' },
  { id: 'fb-desktop', name: 'Masaüstü Klasörü', nameEn: 'Desktop Folder', kind: 'folder', category: 'Klasör', target: 'shell:Desktop', subtitle: 'Masaüstü dizini', subtitleEn: 'Desktop directory', icon: 'desktop' },
  { id: 'fb-vscode', name: 'Visual Studio Code', nameEn: 'Visual Studio Code', kind: 'app', category: 'Geliştirici', target: 'app:Visual Studio Code', subtitle: 'Kod düzenleyici', subtitleEn: 'Code editor', icon: 'code' },
  { id: 'fb-terminal', name: 'Windows Terminal / PowerShell', nameEn: 'Windows Terminal / PowerShell', kind: 'app', category: 'Geliştirici', target: 'powershell.exe', subtitle: 'Komut satırı', subtitleEn: 'Command line', icon: 'terminal' },
  { id: 'fb-settings', name: 'Windows Ayarları', nameEn: 'Windows Settings', kind: 'app', category: 'Sistem', target: 'ms-settings:', subtitle: 'Sistem ayarları', subtitleEn: 'System settings', icon: 'settings' },
  { id: 'fb-taskmgr', name: 'Görev Yöneticisi', nameEn: 'Task Manager', kind: 'app', category: 'Sistem', target: 'taskmgr.exe', subtitle: 'Performans izleyici', subtitleEn: 'Performance monitor', icon: 'cpu' },
  { id: 'fb-spotify', name: 'Spotify', nameEn: 'Spotify', kind: 'app', category: 'Medya', target: 'app:Spotify', subtitle: 'Müzik çalar', subtitleEn: 'Music player', icon: 'music' },
  { id: 'fb-discord', name: 'Discord', nameEn: 'Discord', kind: 'app', category: 'İletişim', target: 'app:Discord', subtitle: 'Sohbet ve topluluk', subtitleEn: 'Chat & community', icon: 'chat' },
  { id: 'fb-steam', name: 'Steam', nameEn: 'Steam', kind: 'app', category: 'Oyun', target: 'steam://open/main', subtitle: 'Oyun kütüphanesi', subtitleEn: 'Game library', icon: 'game' },
  { id: 'fb-calc', name: 'Hesap Makinesi', nameEn: 'Calculator', kind: 'app', category: 'Araç', target: 'calc.exe', subtitle: 'Hesap makinesi', subtitleEn: 'Calculator', icon: 'app' },
];

const DEFAULT_DESKTOP_DOCK = [
  { name: 'Gezgin', url: 'explorer.exe', iconKey: 'folder' },
  { name: 'İndirilenler', url: 'shell:Downloads', iconKey: 'download' },
  { name: 'Belgeler', url: 'shell:Personal', iconKey: 'file' },
  { name: 'Tarayıcı', url: 'https://www.google.com', iconKey: 'globe' },
  { name: 'VS Code', url: 'app:Visual Studio Code', iconKey: 'code' },
  { name: 'Terminal', url: 'powershell.exe', iconKey: 'terminal' },
  { name: 'Spotify', url: 'app:Spotify', iconKey: 'music' },
  { name: 'Discord', url: 'app:Discord', iconKey: 'chat' },
  { name: 'Steam', url: 'steam://open/main', iconKey: 'game' },
];

function repaintGlassNow() {
  window.__weGlassRectsDirty = true;
  refreshGlassCardCache();
  if (typeof updateOpticalLiquidGlass === 'function') {
    updateOpticalLiquidGlass();
  }
}

// ============================================================================
// 1. ASSIGN SEMANTIC WRAPPER IDS FOR WALLPAPER ENGINE WIDGET TOGGLES
// ============================================================================
if (heroClock && heroClock.parentElement) heroClock.parentElement.id = 'heroClockContainer';
if (greetingLabel && greetingLabel.parentElement) greetingLabel.parentElement.id = 'heroGreetingHeading';
['newsBtn', 'weatherBtn', 'focusBtn', 'calendarBtn', 'notesBtn', 'dataManagerBtn'].forEach((btnId) => {
  const el = document.getElementById(btnId);
  if (el && el.parentElement) el.parentElement.id = `${btnId}Wrapper`;
});

// Auto-format safe text input for #calendarEventTime (converted from type="time" to prevent CEF native popup crash)
const calendarTimeInput = document.getElementById('calendarEventTime');
if (calendarTimeInput) {
  calendarTimeInput.addEventListener('input', () => {
    let digits = calendarTimeInput.value.replace(/[^\d:]/g, '');
    if (/^\d{3,4}$/.test(digits)) {
      digits = `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
    }
    calendarTimeInput.value = digits.slice(0, 5);
  });
}

// Top-bar hover detector for 'autohide' mode (with smooth 500ms hide grace period)
let topbarHideTimer = null;
function setTopbarHoverState(show) {
  if (topbarHideTimer) {
    clearTimeout(topbarHideTimer);
    topbarHideTimer = null;
  }
  if (show) {
    if (!document.body.classList.contains('we-topbar-hover')) {
      document.body.classList.add('we-topbar-hover');
      window.__weGlassRectsDirty = true;
      if (typeof window.__weTrackGlassTransition === 'function') window.__weTrackGlassTransition(300);
    }
  } else {
    topbarHideTimer = setTimeout(() => {
      if (!document.querySelector('.popover-panel.open')) {
        if (document.body.classList.contains('we-topbar-hover')) {
          document.body.classList.remove('we-topbar-hover');
          window.__weGlassRectsDirty = true;
          if (typeof window.__weTrackGlassTransition === 'function') window.__weTrackGlassTransition(300);
        }
      }
      topbarHideTimer = null;
    }, 520);
  }
}

document.addEventListener('pointermove', (e) => {
  if (!document.body.classList.contains('we-topbar-autohide')) return;
  const openPopover = document.querySelector('.popover-panel.open');
  const overHeader = e.target instanceof Element && Boolean(e.target.closest('.main-header'));
  if (e.clientY <= 115 || overHeader || openPopover) {
    setTopbarHoverState(true);
  } else if (e.clientY > 155) {
    setTopbarHoverState(false);
  }
}, { passive: true });

// ============================================================================
// 2. TOAST NOTIFICATION & DESKTOP BRIDGE LAUNCHER
// ============================================================================
let toastTimeout = null;
function showDesktopToast(message, durationMs = 3400) {
  let toast = document.getElementById('desktopLauncherToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'desktopLauncherToast';
    toast.className = 'desktop-launcher-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(8px)';
  }, durationMs);
}

let bridgeOnline = false;
let bridgeIndexedCount = 0;
let cachedBridgeApps = [];

async function checkDesktopBridge() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1800);
    const res = await fetch(`${BRIDGE_BASE_URL}/api/desktop/status`, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timer);
    if (!res.ok) throw new Error('status error');
    const data = await res.json();
    bridgeOnline = Boolean(data.ok);
    bridgeIndexedCount = Number(data.indexedCount) || 0;
    updateBridgeStatusBadge();
    return true;
  } catch {
    bridgeOnline = false;
    updateBridgeStatusBadge();
    return false;
  }
}

async function launchOnDesktop(target, label = '') {
  const cleanTarget = String(target || '').trim();
  if (!cleanTarget) return;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${BRIDGE_BASE_URL}/api/desktop/launch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: cleanTarget }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await res.json();
    if (res.ok && data.status === 'ok') {
      bridgeOnline = true;
      updateBridgeStatusBadge();
      showDesktopToast(L(`🚀 Başlatılıyor: ${label || cleanTarget}`, `Launching: ${label || cleanTarget}`));
      closeDesktopDrawer();
      return;
    }
    throw new Error(data.message || L('Başlatılamadı', 'Could not launch'));
  } catch {
    bridgeOnline = false;
    updateBridgeStatusBadge();
    if (/^https?:\/\//i.test(cleanTarget) && typeof window.wallpaperPropertyListener === 'undefined') {
      window.open(cleanTarget, '_blank', 'noopener,noreferrer');
      closeDesktopDrawer();
      return;
    }
    showDesktopToast(
      L(
        '🟠 Yerel uygulama açmak için proje klasöründeki install-startup-bridge.bat dosyasını çalıştırın.',
        'Run start-desktop-bridge.bat in the project folder to launch local apps.',
      ),
      4500,
    );
  }
}

// Intercept external link clicks so Wallpaper Engine never navigates away from the wallpaper
document.addEventListener('click', (e) => {
  const link = e.target instanceof Element ? e.target.closest('a[href]') : null;
  if (!link) return;
  const href = link.getAttribute('href') || '';
  if (!href || href.startsWith('#') || href.startsWith('blob:')) return;
  e.preventDefault();
  e.stopPropagation();
  launchOnDesktop(link.href || href, link.textContent?.trim().slice(0, 48) || 'Bağlantı');
}, true);

// ============================================================================
// 3. PHYSICAL KEYBOARD IME BRIDGE FOR WALLPAPER ENGINE DESKTOP INPUTS
//    Windows Desktop (SysListView32) steals physical keyboard focus from CEF.
//    When the user clicks any <input>, <textarea>, or [contenteditable], we
//    notify the local Win32 hook (/api/desktop/ime) which streams physical
//    Turkish Unicode keystrokes back to the active input element!
// ============================================================================
let activeDesktopInput = null;
let lastNativeKeydownAt = 0;

function isTextEditableElement(el) {
  if (!(el instanceof Element)) return false;
  if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') return true;
  if (el.tagName === 'TEXTAREA') return !el.disabled && !el.readOnly;
  if (el.tagName === 'INPUT') {
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    return ['text', 'search', 'url', 'number', 'tel', 'email', 'password'].includes(type) && !el.disabled && !el.readOnly;
  }
  return false;
}

function notifyBridgeImeState(focused) {
  fetch(`${BRIDGE_BASE_URL}/api/desktop/ime`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ focused: Boolean(focused) }),
  }).catch(() => {});
}

function setActiveDesktopInput(el) {
  if (activeDesktopInput === el) {
    if (el) notifyBridgeImeState(true);
    return;
  }
  if (activeDesktopInput) {
    activeDesktopInput.classList.remove('is-we-input-active');
  }
  activeDesktopInput = el && isTextEditableElement(el) ? el : null;
  if (activeDesktopInput) {
    activeDesktopInput.classList.add('is-we-input-active');
    try { activeDesktopInput.focus(); } catch {}
    notifyBridgeImeState(true);
  } else {
    notifyBridgeImeState(false);
  }
}

document.addEventListener('pointerdown', (e) => {
  const target = e.target instanceof Element ? e.target : null;
  const editable = target ? target.closest('input, textarea, [contenteditable="true"]') : null;
  if (editable && isTextEditableElement(editable)) {
    setActiveDesktopInput(editable);
  } else if (activeDesktopInput && (!target || !target.closest('.desktop-search-action-btn'))) {
    setActiveDesktopInput(null);
  }
}, true);

document.addEventListener('keydown', () => {
  lastNativeKeydownAt = performance.now();
}, true);

function handleBridgeKeyboardEvent(msg) {
  // If CEF already received the native keystroke directly, skip duplicate
  if (performance.now() - lastNativeKeydownAt < 55) return;
  if (!activeDesktopInput || !activeDesktopInput.isConnected) {
    setActiveDesktopInput(null);
    return;
  }

  const el = activeDesktopInput;
  const key = msg.key;
  const text = String(msg.text || '');

  if (key === 'Escape') {
    if (el === searchInput && !launcherDrawer.hidden) {
      closeDesktopDrawer();
    }
    setActiveDesktopInput(null);
    return;
  }

  if (key === 'ArrowDown' || key === 'ArrowUp') {
    if (el === searchInput && !launcherDrawer.hidden && currentLauncherResults.length > 0) {
      const step = key === 'ArrowDown' ? 1 : -1;
      highlightedResultIdx = (highlightedResultIdx + step + currentLauncherResults.length) % currentLauncherResults.length;
      const rows = resultsListEl.querySelectorAll('.desktop-result-row');
      rows.forEach((r, i) => r.classList.toggle('is-highlighted', i === highlightedResultIdx));
      rows[highlightedResultIdx]?.scrollIntoView({ block: 'nearest' });
    }
    return;
  }

  if (key === 'Enter') {
    if (el.tagName === 'TEXTAREA') {
      insertTextIntoInput(el, '\n');
      return;
    }
    if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
      el.dispatchEvent(new Event('input', { bubbles: true }));
      setActiveDesktopInput(null);
      return;
    }
    if (el.id === 'focusCustomMinutes') {
      document.getElementById('focusApplyCustomBtn')?.click();
      return;
    }
    if (el.form) {
      el.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
    return;
  }

  if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
    const current = el.textContent || '';
    if (key === 'Backspace') {
      el.textContent = current.slice(0, -1);
    } else if (key === 'SelectAll') {
      el.textContent = '';
    } else if (key === 'Char' && text) {
      el.textContent = (current + text).slice(0, 60);
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }

  if (key === 'SelectAll') {
    try { el.select(); } catch {}
    return;
  }

  if (key === 'Paste') {
    if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
      navigator.clipboard.readText().then((clip) => {
        if (clip) insertTextIntoInput(el, clip);
      }).catch(() => {});
    }
    return;
  }

  if (key === 'Backspace') {
    const val = String(el.value || '');
    const hasSelection = typeof el.selectionStart === 'number' && typeof el.selectionEnd === 'number' && el.selectionStart !== el.selectionEnd;
    if (hasSelection) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      el.value = val.slice(0, start) + val.slice(end);
      try { el.setSelectionRange(start, start); } catch {}
    } else if (typeof el.selectionStart === 'number' && el.selectionStart > 0) {
      const pos = el.selectionStart;
      el.value = val.slice(0, pos - 1) + val.slice(pos);
      try { el.setSelectionRange(pos - 1, pos - 1); } catch {}
    } else {
      el.value = val.slice(0, -1);
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }

  if (key === 'Delete') {
    const val = String(el.value || '');
    if (typeof el.selectionStart === 'number') {
      const start = el.selectionStart;
      const end = el.selectionEnd > start ? el.selectionEnd : start + 1;
      el.value = val.slice(0, start) + val.slice(end);
      try { el.setSelectionRange(start, start); } catch {}
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return;
  }

  if (key === 'Char' && text) {
    insertTextIntoInput(el, text);
  }
}

function insertTextIntoInput(el, text) {
  const val = String(el.value || '');
  const maxLen = el.maxLength > 0 ? el.maxLength : 2048;
  const start = typeof el.selectionStart === 'number' ? el.selectionStart : val.length;
  const end = typeof el.selectionEnd === 'number' ? el.selectionEnd : val.length;
  const nextVal = (val.slice(0, start) + text + val.slice(end)).slice(0, maxLen);
  el.value = nextVal;
  const nextPos = Math.min(nextVal.length, start + text.length);
  try { el.setSelectionRange(nextPos, nextPos); } catch {}
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

// ============================================================================
// 4. LINUX-STYLE HYBRID OPTICAL LIQUID GLASS LAUNCHER (PC APPS + FILES + WEB)
// ============================================================================
ENGINES.local = {
  svg: DESKTOP_ICONS.pc,
  placeholder: "Bilgisayarda uygulama, dosya, klasör ara veya web'de başlat...",
  url: (q) => q,
};

let activeLocalCategory = 'all';
let currentLauncherResults = [];
let highlightedResultIdx = 0;
let searchDebounceTimer = null;

// Wrap #searchForm in a position:relative anchor so the drawer floats as an overlay without pushing layout!
const searchWidgetAnchor = document.createElement('div');
searchWidgetAnchor.id = 'searchWidgetAnchor';
searchWidgetAnchor.className = 'search-widget-anchor';
if (searchForm.parentElement) {
  searchForm.parentElement.insertBefore(searchWidgetAnchor, searchForm);
  searchWidgetAnchor.appendChild(searchForm);
}

// Inject '💻 PC Arama' chip as the first engine button in #searchForm
const engineGroup = searchForm.querySelector('[role="group"]');
const localEngineChip = document.createElement('button');
localEngineChip.type = 'button';
localEngineChip.dataset.engine = 'local';
localEngineChip.setAttribute('aria-pressed', 'true');
localEngineChip.className = 'engine-chip px-2.5 py-1 rounded-xl text-xs font-pixel tracking-wide bg-white/25 text-white border border-white/30 transition';
localEngineChip.textContent = '💻 PC / Yerel';
if (engineGroup) {
  engineGroup.prepend(localEngineChip);
}

// Add Paste & Drawer Toggle buttons right next to the search submit button
const searchInputRow = searchInput.parentElement;
const pasteSearchBtn = document.createElement('button');
pasteSearchBtn.type = 'button';
pasteSearchBtn.title = 'Panodan Yapıştır veya Uygulama Çekmecesini Aç';
pasteSearchBtn.setAttribute('aria-label', 'Panodan yapıştır');
pasteSearchBtn.className = 'desktop-search-action-btn';
pasteSearchBtn.innerHTML = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2"/></svg>`;

const toggleDrawerBtn = document.createElement('button');
toggleDrawerBtn.type = 'button';
toggleDrawerBtn.title = 'Uygulama ve Dosya Listesini Aç / Kapat';
toggleDrawerBtn.setAttribute('aria-label', 'Uygulama çekmecesini aç veya kapat');
toggleDrawerBtn.className = 'desktop-search-action-btn';
toggleDrawerBtn.innerHTML = DESKTOP_ICONS.app;

if (searchInputRow) {
  const submitBtn = searchInputRow.querySelector('button[type="submit"]');
  if (submitBtn) {
    searchInputRow.insertBefore(pasteSearchBtn, submitBtn);
    searchInputRow.insertBefore(toggleDrawerBtn, submitBtn);
  }
}

// Create the Optical Liquid Glass Results Drawer inside #searchWidgetAnchor
const launcherDrawer = document.createElement('section');
launcherDrawer.id = 'desktopLauncherDrawer';
launcherDrawer.className = 'desktop-launcher-drawer optical-glass rounded-3xl';
launcherDrawer.setAttribute('aria-label', 'Yerel uygulama ve dosya sonuçları');
launcherDrawer.hidden = true;

const drawerLens = document.createElement('canvas');
drawerLens.className = 'glass-lens';
drawerLens.setAttribute('aria-hidden', 'true');

const drawerHeader = document.createElement('div');
drawerHeader.className = 'desktop-launcher-header';

const categoryPillsWrap = document.createElement('div');
categoryPillsWrap.className = 'desktop-category-pills';
const CATEGORIES = [
  { id: 'all', label: 'Tümü', labelEn: 'All' },
  { id: 'apps', label: 'Uygulamalar', labelEn: 'Apps' },
  { id: 'folders', label: 'Klasörler', labelEn: 'Folders' },
  { id: 'files', label: 'Dosyalar', labelEn: 'Files' },
  { id: 'downloads', label: 'İndirilenler', labelEn: 'Downloads' },
];

CATEGORIES.forEach((cat) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.dataset.cat = cat.id;
  btn.className = `desktop-cat-pill${cat.id === activeLocalCategory ? ' is-active' : ''}`;
  btn.textContent = L(cat.label, cat.labelEn);
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    activeLocalCategory = cat.id;
    categoryPillsWrap.querySelectorAll('.desktop-cat-pill').forEach((p) => {
      p.classList.toggle('is-active', p.dataset.cat === activeLocalCategory);
    });
    performDesktopSearch(searchInput.value);
  });
  categoryPillsWrap.appendChild(btn);
});

const bridgeBadge = document.createElement('div');
bridgeBadge.className = 'desktop-bridge-badge';
const bridgeDot = document.createElement('span');
bridgeDot.className = 'desktop-bridge-dot';
const bridgeText = document.createElement('span');
bridgeText.textContent = L('PC Köprüsü', 'PC Bridge');
bridgeBadge.append(bridgeDot, bridgeText);

drawerHeader.append(categoryPillsWrap, bridgeBadge);

const resultsListEl = document.createElement('div');
resultsListEl.className = 'desktop-results-list';
resultsListEl.setAttribute('role', 'listbox');

const webFallbackBar = document.createElement('div');
webFallbackBar.className = 'desktop-web-fallback';

launcherDrawer.append(drawerLens, drawerHeader, resultsListEl, webFallbackBar);
searchWidgetAnchor.appendChild(launcherDrawer);

function updateBridgeStatusBadge() {
  bridgeDot.classList.toggle('is-online', bridgeOnline);
  bridgeText.textContent = bridgeOnline
    ? L(`PC Aktif (${bridgeIndexedCount || 'Hazır'})`, `PC Ready (${bridgeIndexedCount || 'OK'})`)
    : L('Köprü Bekleniyor', 'Bridge Offline');
}

function selectAllEngineChips(eng) {
  if (!ENGINES[eng]) eng = 'local';
  activeEngine = eng;
  lsPut('diorama_engine', eng);
  activeEngineBadge.innerHTML = ENGINES[eng].svg;
  searchInput.placeholder = ENGINES[eng].placeholder;
  document.querySelectorAll('.engine-chip').forEach((chip) => {
    const selected = chip.dataset.engine === eng;
    chip.setAttribute('aria-pressed', selected ? 'true' : 'false');
    chip.className = selected
      ? 'engine-chip px-2.5 py-1 rounded-xl text-xs font-pixel tracking-wide bg-white/25 text-white border border-white/30 transition'
      : 'engine-chip px-2.5 py-1 rounded-xl text-xs font-pixel tracking-wide text-white/70 hover:text-white border border-transparent transition';
  });
}

document.querySelectorAll('.engine-chip').forEach((chip) => {
  chip.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllPopovers(false);
    selectAllEngineChips(chip.dataset.engine);
    if (chip.dataset.engine === 'local') {
      openDesktopDrawer();
      performDesktopSearch(searchInput.value);
    } else {
      closeDesktopDrawer();
    }
    setActiveDesktopInput(searchInput);
  });
});

selectAllEngineChips('local');

function openDesktopDrawer() {
  closeAllPopovers(false);
  if (!launcherDrawer.hidden) return;
  launcherDrawer.hidden = false;
  repaintGlassNow();
}

function closeDesktopDrawer() {
  if (launcherDrawer.hidden) return;
  launcherDrawer.hidden = true;
  repaintGlassNow();
}

function renderWebFallbackRow(query) {
  webFallbackBar.replaceChildren();
  const clean = String(query || '').trim();
  const label = document.createElement('span');
  label.className = 'desktop-web-fallback-label';
  label.textContent = clean
    ? L(`🌐 "${clean.slice(0, 28)}" için Web'de Ara:`, `Search Web for "${clean.slice(0, 24)}":`)
    : L('🌐 Web Arama Motoru:', 'Web Search:');

  const btns = document.createElement('div');
  btns.className = 'desktop-web-fallback-btns';
  [
    ['google', 'Google'],
    ['youtube', 'YouTube'],
    ['perplexity', 'Perplexity'],
    ['duckduckgo', 'DuckDuckGo'],
    ['github', 'GitHub'],
  ].forEach(([engKey, engLabel]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'desktop-web-btn';
    b.textContent = engLabel;
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const q = searchInput.value.trim();
      if (q) {
        launchOnDesktop(ENGINES[engKey].url(encodeURIComponent(q)), `${engLabel}: ${q}`);
      } else {
        selectAllEngineChips(engKey);
        closeDesktopDrawer();
      }
    });
    btns.appendChild(b);
  });

  webFallbackBar.append(label, btns);
}

function renderDesktopResults(items, query = '') {
  currentLauncherResults = items;
  highlightedResultIdx = 0;
  resultsListEl.replaceChildren();

  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'text-xs text-white/70 py-3 text-center font-pixel';
    empty.textContent = query
      ? L(
        `"${query}" için yerel uygulama veya dosya bulunamadı. Aşağıdan Web'de arayabilirsin.`,
        `No local app or file found for "${query}". Try searching the web below.`,
      )
      : L('Henüz öğe bulunamadı.', 'No items found yet.');
    resultsListEl.appendChild(empty);
  } else {
    items.forEach((item, idx) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.dataset.kind = item.kind || 'app';
      row.className = `desktop-result-row${idx === highlightedResultIdx ? ' is-highlighted' : ''}`;

      const iconWrap = document.createElement('div');
      iconWrap.className = 'desktop-result-icon';
      const fallbackSvg = DESKTOP_ICONS[item.icon] || DESKTOP_ICONS[item.kind] || DESKTOP_ICONS.app;
      const canHaveNativeIcon = bridgeOnline && item.target && !/^(https?:|ms-settings:|steam:)/i.test(item.target);
      if (canHaveNativeIcon) {
        const img = document.createElement('img');
        img.className = 'desktop-real-icon';
        img.alt = '';
        img.loading = 'lazy';
        img.src = `${BRIDGE_BASE_URL}/api/desktop/icon?target=${encodeURIComponent(item.target)}`;
        img.addEventListener('error', () => {
          iconWrap.innerHTML = fallbackSvg;
        }, { once: true });
        iconWrap.appendChild(img);
      } else {
        iconWrap.innerHTML = fallbackSvg;
      }

      const main = document.createElement('div');
      main.className = 'desktop-result-main';
      const title = document.createElement('div');
      title.className = 'desktop-result-title';
      title.textContent = isEn() ? (item.nameEn || item.name) : item.name;
      const sub = document.createElement('div');
      sub.className = 'desktop-result-sub';
      sub.textContent = isEn() ? (item.subtitleEn || item.subtitle || item.target) : (item.subtitle || item.target);
      main.append(title, sub);

      const badge = document.createElement('span');
      badge.className = 'desktop-result-badge';
      badge.textContent = item.kind === 'app'
        ? L('Uygulama', 'App')
        : item.kind === 'folder'
          ? L('Klasör', 'Folder')
          : L('Dosya', 'File');

      row.append(iconWrap, main, badge);
      row.addEventListener('mouseenter', () => {
        highlightedResultIdx = idx;
        resultsListEl.querySelectorAll('.desktop-result-row').forEach((r, i) => {
          r.classList.toggle('is-highlighted', i === highlightedResultIdx);
        });
      });
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        launchOnDesktop(item.target, item.name);
      });
      resultsListEl.appendChild(row);
    });
  }

  renderWebFallbackRow(query);
  repaintGlassNow();
}

async function performDesktopSearch(rawQuery = '') {
  const query = String(rawQuery || '').trim();
  openDesktopDrawer();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2200);
    const params = new URLSearchParams({
      q: query,
      category: activeLocalCategory,
    });
    const res = await fetch(`${BRIDGE_BASE_URL}/api/desktop/search?${params}`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error('Search request failed');
    const data = await res.json();
    bridgeOnline = true;
    bridgeIndexedCount = Number(data.totalIndexed) || bridgeIndexedCount;
    updateBridgeStatusBadge();
    if (!query && activeLocalCategory === 'all') {
      cachedBridgeApps = (data.results || []).filter((i) => i.kind === 'app');
      renderCustomAppPickerList();
    }
    renderDesktopResults(data.results || [], query);
  } catch {
    bridgeOnline = false;
    updateBridgeStatusBadge();
    const qLower = query.toLowerCase();
    const filtered = FALLBACK_LOCAL_ITEMS.filter((item) => {
      if (activeLocalCategory === 'apps' && item.kind !== 'app') return false;
      if (activeLocalCategory === 'folders' && item.kind !== 'folder') return false;
      if (activeLocalCategory === 'files' && item.kind !== 'file') return false;
      if (!qLower) return true;
      return item.name.toLowerCase().includes(qLower) || item.subtitle.toLowerCase().includes(qLower);
    });
    renderDesktopResults(filtered, query);
  }
}

searchInput.addEventListener('focus', () => {
  closeAllPopovers(false);
  setActiveDesktopInput(searchInput);
  if (activeEngine === 'local') {
    openDesktopDrawer();
    performDesktopSearch(searchInput.value);
  }
});

searchInput.addEventListener('click', (e) => {
  e.stopPropagation();
  closeAllPopovers(false);
  setActiveDesktopInput(searchInput);
  if (activeEngine === 'local') {
    openDesktopDrawer();
    performDesktopSearch(searchInput.value);
  }
});

searchInput.addEventListener('input', () => {
  if (activeEngine !== 'local') selectAllEngineChips('local');
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    performDesktopSearch(searchInput.value);
  }, 80);
});

searchInput.addEventListener('keydown', (e) => {
  if (!launcherDrawer.hidden && currentLauncherResults.length > 0) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopImmediatePropagation();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      highlightedResultIdx = (highlightedResultIdx + step + currentLauncherResults.length) % currentLauncherResults.length;
      const rows = resultsListEl.querySelectorAll('.desktop-result-row');
      rows.forEach((r, i) => r.classList.toggle('is-highlighted', i === highlightedResultIdx));
      rows[highlightedResultIdx]?.scrollIntoView({ block: 'nearest' });
      return;
    }
  }
  if (e.key === 'Escape' && !launcherDrawer.hidden) {
    e.preventDefault();
    e.stopImmediatePropagation();
    closeDesktopDrawer();
  }
}, true);

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  e.stopImmediatePropagation();
  const val = searchInput.value.trim();

  if (activeEngine === 'local') {
    if (!launcherDrawer.hidden && currentLauncherResults[highlightedResultIdx]) {
      const chosen = currentLauncherResults[highlightedResultIdx];
      launchOnDesktop(chosen.target, chosen.name);
      return;
    }
    if (!val) {
      openDesktopDrawer();
      performDesktopSearch('');
      return;
    }
    if (/^[a-z]:[\\/]/i.test(val) || /^shell:/i.test(val)) {
      launchOnDesktop(val, val);
      return;
    }
    launchOnDesktop(ENGINES.google.url(encodeURIComponent(val)), `Google: ${val}`);
    return;
  }

  if (!val) return;
  if (/^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(:\d+)?([/?#]\S*)?$/i.test(val) && !val.includes(' ')) {
    const destination = normalizeWebUrl(val);
    if (destination) {
      launchOnDesktop(destination, val);
      return;
    }
  }
  const engineObj = ENGINES[activeEngine] || ENGINES.google;
  launchOnDesktop(engineObj.url(encodeURIComponent(val)), `${activeEngine}: ${val}`);
}, true);

toggleDrawerBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  closeAllPopovers(false);
  if (launcherDrawer.hidden) {
    selectAllEngineChips('local');
    openDesktopDrawer();
    performDesktopSearch(searchInput.value);
    setActiveDesktopInput(searchInput);
  } else {
    closeDesktopDrawer();
  }
});

pasteSearchBtn.addEventListener('click', async (e) => {
  e.stopPropagation();
  closeAllPopovers(false);
  selectAllEngineChips('local');
  openDesktopDrawer();
  setActiveDesktopInput(searchInput);
  try {
    if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
      const clip = (await navigator.clipboard.readText()).trim().slice(0, 120);
      if (clip) {
        searchInput.value = clip;
        performDesktopSearch(clip);
        showDesktopToast(`📋 Panodan arandı: "${clip}"`);
        return;
      }
    }
  } catch {}
  performDesktopSearch(searchInput.value);
});

launcherDrawer.addEventListener('click', (e) => {
  e.stopPropagation();
  closeAllPopovers(false);
});
searchForm.addEventListener('click', (e) => {
  e.stopPropagation();
  closeAllPopovers(false);
});
document.addEventListener('click', () => closeDesktopDrawer());

// ============================================================================
// 5. FREQUENT DESKTOP APPLICATIONS GLASS DOCK & CEF-SAFE APP PICKER MODAL
// ============================================================================
function loadDesktopDockItems() {
  const saved = lsGet(DESKTOP_DOCK_KEY, null);
  if (Array.isArray(saved) && saved.length > 0) {
    return saved
      .filter((item) => item && typeof item.name === 'string' && typeof item.url === 'string')
      .map((item) => ({
        name: item.name.trim().slice(0, 60),
        url: item.url.trim().slice(0, 2048),
        iconKey: item.iconKey || 'app',
      }));
  }
  return [...DEFAULT_DESKTOP_DOCK];
}

let desktopDockItems = loadDesktopDockItems();
let editingDockIdx = null;

function inferDockIcon(name, target) {
  const lower = `${name} ${target}`.toLowerCase();
  if (lower.includes('gezgin') || lower.includes('explorer') || lower.includes('klasör')) return 'folder';
  if (lower.includes('indir') || lower.includes('download')) return 'download';
  if (lower.includes('belge') || lower.includes('document') || lower.includes('not')) return 'file';
  if (lower.includes('code') || lower.includes('studio') || lower.includes('git') || lower.includes('cursor')) return 'code';
  if (lower.includes('terminal') || lower.includes('powershell') || lower.includes('cmd')) return 'terminal';
  if (lower.includes('spotify') || lower.includes('müzik') || lower.includes('music')) return 'music';
  if (lower.includes('discord') || lower.includes('whatsapp') || lower.includes('telegram')) return 'chat';
  if (lower.includes('steam') || lower.includes('game') || lower.includes('oyun')) return 'game';
  if (lower.includes('ayar') || lower.includes('setting')) return 'settings';
  if (/^https?:\/\//i.test(target) || lower.includes('tarayıcı') || lower.includes('chrome')) return 'globe';
  return 'app';
}

const DOCK_DEFAULT_NAME_EN = {
  Gezgin: 'Explorer',
  'İndirilenler': 'Downloads',
  Belgeler: 'Documents',
  'Tarayıcı': 'Browser',
};

function renderDesktopDock() {
  shortcutsGrid.replaceChildren();
  desktopDockItems.forEach((item, index) => {
    const displayName = isEn() && DOCK_DEFAULT_NAME_EN[item.name] ? DOCK_DEFAULT_NAME_EN[item.name] : item.name;
    const card = document.createElement('div');
    card.className = 'shortcut-card optical-glass rounded-2xl group relative';

    const lens = document.createElement('canvas');
    lens.className = 'glass-lens';
    lens.setAttribute('aria-hidden', 'true');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'desktop-dock-link';
    btn.title = `${displayName} → ${item.url} (${L('Düzenlemek için sağ tıkla', 'Right-click to edit')})`;
    btn.setAttribute('aria-label', L(`${displayName} uygulamasını başlat`, `Launch ${displayName}`));

    const iconSpan = document.createElement('span');
    iconSpan.className = 'desktop-dock-icon';
    const fallbackSvg = DESKTOP_ICONS[item.iconKey] || DESKTOP_ICONS[inferDockIcon(item.name, item.url)] || DESKTOP_ICONS.app;
    const canHaveNativeIcon = bridgeOnline && item.url && !/^(https?:|ms-settings:|steam:)/i.test(item.url);
    if (canHaveNativeIcon) {
      const img = document.createElement('img');
      img.className = 'desktop-dock-real-icon';
      img.alt = '';
      img.loading = 'lazy';
      img.src = `${BRIDGE_BASE_URL}/api/desktop/icon?target=${encodeURIComponent(item.url)}`;
      img.addEventListener('error', () => {
        iconSpan.innerHTML = fallbackSvg;
      }, { once: true });
      iconSpan.appendChild(img);
    } else {
      iconSpan.innerHTML = fallbackSvg;
    }

    const label = document.createElement('span');
    label.className = 'font-pixel text-xs sm:text-[13px] font-medium text-white/95 group-hover:text-amber-200 tracking-wide truncate max-w-[120px] transition';
    label.textContent = displayName;

    btn.append(iconSpan, label);
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      launchOnDesktop(item.url, displayName);
    });
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openDesktopDockModal(index);
    });

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.setAttribute('aria-label', L(`${displayName} kısayolunu kaldır`, `Remove ${displayName} shortcut`));
    remove.className = 'del-shortcut-btn absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black/75 text-[9px] text-white/75 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition';
    remove.textContent = '✕';
    remove.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      desktopDockItems.splice(index, 1);
      lsSet(DESKTOP_DOCK_KEY, desktopDockItems);
      renderDesktopDock();
      if (typeof window.__weScheduleUserStateSync === 'function') window.__weScheduleUserStateSync();
    });

    card.append(lens, btn, remove);
    shortcutsGrid.appendChild(card);
  });

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'shortcut-card optical-glass rounded-2xl px-3.5 py-2 flex items-center justify-center text-white/75 hover:text-white';
  const addLens = document.createElement('canvas');
  addLens.className = 'glass-lens';
  addLens.setAttribute('aria-hidden', 'true');
  const addLabel = document.createElement('span');
  addLabel.className = 'font-pixel text-xs tracking-wide';
  addLabel.textContent = L('+ Uygulama', '+ Add App');
  addBtn.append(addLens, addLabel);
  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openDesktopDockModal(null);
  });
  shortcutsGrid.appendChild(addBtn);
  repaintGlassNow();
}

// Enhance #shortcutModal with a 100% CEF-safe custom HTML application grid (NO native <select>!)
const shortcutNameInput = document.getElementById('shortcutNameInput');
const shortcutUrlInput = document.getElementById('shortcutUrlInput');
const shortcutModalTitle = document.getElementById('shortcutModalTitle');
const shortcutModalDesc = document.getElementById('shortcutModalDescription');

const appPickerWrapper = document.createElement('div');
const appPickerLabel = document.createElement('div');
appPickerLabel.className = 'text-xs text-white/65 block mb-1.5 font-pixel';
appPickerLabel.textContent = 'Bilgisayardaki Uygulamalardan Hızlı Seç (Tıkla):';
const customAppListEl = document.createElement('div');
customAppListEl.id = 'desktopCustomAppList';
customAppListEl.className = 'desktop-custom-app-list';
appPickerWrapper.append(appPickerLabel, customAppListEl);
shortcutForm.prepend(appPickerWrapper);

function renderCustomAppPickerList() {
  if (!customAppListEl) return;
  const sourceList = cachedBridgeApps.length ? cachedBridgeApps : FALLBACK_LOCAL_ITEMS;
  customAppListEl.replaceChildren();

  sourceList.slice(0, 60).forEach((app) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'desktop-app-pick-btn';
    btn.title = app.target;

    const iconBox = document.createElement('span');
    iconBox.className = 'desktop-dock-icon';
    const fallbackSvg = DESKTOP_ICONS[app.icon] || DESKTOP_ICONS.app;
    if (bridgeOnline && app.target && !/^(https?:|ms-settings:|steam:)/i.test(app.target)) {
      const img = document.createElement('img');
      img.className = 'desktop-dock-real-icon';
      img.alt = '';
      img.loading = 'lazy';
      img.src = `${BRIDGE_BASE_URL}/api/desktop/icon?target=${encodeURIComponent(app.target)}`;
      img.addEventListener('error', () => {
        iconBox.innerHTML = fallbackSvg;
      }, { once: true });
      iconBox.appendChild(img);
    } else {
      iconBox.innerHTML = fallbackSvg;
    }

    const nameSpan = document.createElement('span');
    nameSpan.className = 'desktop-app-pick-name';
    const appDisplayName = isEn() ? (app.nameEn || app.name) : app.name;
    nameSpan.textContent = appDisplayName;

    btn.append(iconBox, nameSpan);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      shortcutNameInput.value = appDisplayName;
      shortcutUrlInput.value = app.target;
      customAppListEl.querySelectorAll('.desktop-app-pick-btn').forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
    });
    customAppListEl.appendChild(btn);
  });
}
renderCustomAppPickerList();

function openDesktopDockModal(editIdx = null) {
  closeDesktopDrawer();
  closeAllPopovers(false);
  editingDockIdx = Number.isInteger(editIdx) && editIdx >= 0 && editIdx < desktopDockItems.length ? editIdx : null;
  if (shortcutModalTitle) {
    shortcutModalTitle.textContent = editingDockIdx !== null
      ? L('Uygulama Kısayolunu Düzenle', 'Edit App Shortcut')
      : L('Yeni Uygulama / Kısayol Ekle', 'Add App or Shortcut');
  }
  if (shortcutModalDesc) {
    shortcutModalDesc.textContent = L(
      'Listeden bir uygulama seç veya klasör yolu (C:\\...) / web adresi yaz',
      'Pick an installed app below or enter a folder path / URL',
    );
  }
  if (appPickerLabel) {
    appPickerLabel.textContent = L(
      'Bilgisayardaki Uygulamalardan Hızlı Seç (Tıkla):',
      'Quick-pick from installed apps (Click):',
    );
  }
  shortcutUrlInput.placeholder = L(
    'Örn: explorer.exe, C:\\Oyunlar, steam:// veya https://...',
    'e.g. explorer.exe, C:\\Games, steam:// or https://...',
  );
  customAppListEl.querySelectorAll('.desktop-app-pick-btn').forEach((b) => b.classList.remove('is-selected'));

  if (editingDockIdx !== null) {
    shortcutNameInput.value = desktopDockItems[editingDockIdx].name;
    shortcutUrlInput.value = desktopDockItems[editingDockIdx].url;
  } else {
    shortcutNameInput.value = '';
    shortcutUrlInput.value = '';
  }

  shortcutUrlInput.setCustomValidity('');
  shortcutModal.classList.remove('hidden');
  shortcutModal.classList.add('flex');
  shortcutModal.setAttribute('aria-hidden', 'false');
  shortcutModal.inert = false;
  setActiveDesktopInput(shortcutNameInput);
}

shortcutForm.addEventListener('submit', (e) => {
  e.preventDefault();
  e.stopImmediatePropagation();
  const name = shortcutNameInput.value.trim().slice(0, 60);
  const target = shortcutUrlInput.value.trim().slice(0, 2048);
  if (!name || !target) return;

  const entry = {
    name,
    url: target,
    iconKey: inferDockIcon(name, target),
  };

  if (editingDockIdx !== null && editingDockIdx >= 0 && editingDockIdx < desktopDockItems.length) {
    desktopDockItems[editingDockIdx] = entry;
  } else {
    desktopDockItems.push(entry);
  }
  lsSet(DESKTOP_DOCK_KEY, desktopDockItems);
  renderDesktopDock();
  if (typeof window.__weScheduleUserStateSync === 'function') window.__weScheduleUserStateSync();
  setActiveDesktopInput(null);
  closeShortcutModal(false);
}, true);

renderDesktopDock();

// ============================================================================
// 6. ON-SCREEN WALLPAPER & LIQUID GLASS SETTINGS WIDGET (#weSettingsPopover)
//    Allows controlling Scene FPS, Pixel Density (2x/3x/4x), Liquid Glass FPS,
//    Glass Super-Sampling Quality, Blur/Opacity, Taskbar Offset, and Widgets
//    directly from the desktop top bar!
// ============================================================================
const WE_PERF_PROFILES = {
  eco: { sceneFps: 24, detailTier: 1, glassFps: 15, glassQuality: 0.75 },
  balanced: { sceneFps: 30, detailTier: 1, glassFps: 20, glassQuality: 0.75 },
  high: { sceneFps: 60, detailTier: 2, glassFps: 30, glassQuality: 1 },
};

const DEFAULT_WE_SETTINGS = {
  language: 'tr',
  perfProfile: 'balanced',
  sceneFps: 30,
  detailTier: 1,
  creatureSpeed: 1.0,
  glassFps: 20,
  glassQuality: 0.75,
  glassBlur: 2.2,
  glassOpacity: 90,
  perfMigratedV2: true,
  taskbarMigratedV3: true,
  userModified: false,
  updatedAt: 0,
  taskbarHeight: 48,
  centerOffsetY: 0,
  autoCycleMins: 0,
  topbarMode: 'always',
  pixelFont: 'departure',
  arcticChristmas: true,
  clockSeconds: false,
  showClock: true,
  showGreeting: true,
  showSearch: true,
  showDock: true,
  showHeadline: true,
  showMusic: true,
  musicCompact: false,
  showSystem: true,
  systemCompact: false,
  showHabitatPill: true,
  showNewsBtn: true,
  showWeatherBtn: true,
  showAirBtn: true,
  showFocusBtn: true,
  showCalendarBtn: true,
  showNotesBtn: true,
  showDataBtn: false,
};

const rawSavedWeSettings = lsGet(WE_SETTINGS_STORAGE_KEY, null);
let weSettings = { ...DEFAULT_WE_SETTINGS, ...(rawSavedWeSettings || {}) };
if (
  rawSavedWeSettings &&
  !rawSavedWeSettings.perfMigratedV2 &&
  Number(rawSavedWeSettings.sceneFps) === 60 &&
  Number(rawSavedWeSettings.detailTier) === 2 &&
  Number(rawSavedWeSettings.glassFps) === 30 &&
  Number(rawSavedWeSettings.glassQuality) === 1
) {
  weSettings = {
    ...weSettings,
    ...WE_PERF_PROFILES.balanced,
    perfProfile: 'balanced',
    perfMigratedV2: true,
  };
  lsSet(WE_SETTINGS_STORAGE_KEY, weSettings);
}
if (rawSavedWeSettings && !rawSavedWeSettings.taskbarMigratedV3) {
  if (!rawSavedWeSettings.userModified && Number(rawSavedWeSettings.taskbarHeight) === 54) {
    weSettings.taskbarHeight = 48;
  }
  weSettings.taskbarMigratedV3 = true;
  lsSet(WE_SETTINGS_STORAGE_KEY, weSettings);
}

const rawPropSnapshot = lsGet(WE_PROP_SNAPSHOT_KEY, null);
let wePropSnapshot = (rawPropSnapshot && typeof rawPropSnapshot === 'object' && !Array.isArray(rawPropSnapshot))
  ? { ...rawPropSnapshot }
  : {};
let hasReceivedInitialWeProps = false;

function markInAppSettingsModified() {
  weSettings.userModified = true;
  weSettings.taskbarMigratedV3 = true;
  weSettings.updatedAt = Date.now();
}

let weWallpaperPaused = false;
window.__wePaused = false;
let autoCycleIntervalId = null;
let clockSecondsIntervalId = null;
let showClockSeconds = Boolean(weSettings.clockSeconds);
window.__weClockSeconds = showClockSeconds;
let lastRenderedClockStr = '';

function renderHeroClockText(formatted) {
  if (!heroClock || formatted === lastRenderedClockStr) return;
  lastRenderedClockStr = formatted;
  if (typeof HTMLElement !== 'undefined' && heroClock instanceof HTMLElement) {
    heroClock.innerHTML = Array.from(formatted)
      .map((ch) => (ch === ':'
        ? '<span class="we-clock-sep">:</span>'
        : `<span class="we-clock-char">${ch}</span>`))
      .join('');
  } else {
    heroClock.textContent = formatted;
  }
}
window.__weSetHeroClock = renderHeroClockText;

function updateDesktopClockWithSeconds() {
  if (!window.__weClockSeconds || !heroClock || document.hidden || weWallpaperPaused) return;
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  renderHeroClockText(`${h}:${m}:${s}`);
}

function syncClockSecondsInterval() {
  if (showClockSeconds && !clockSecondsIntervalId) {
    clockSecondsIntervalId = setInterval(updateDesktopClockWithSeconds, 500);
  } else if (!showClockSeconds && clockSecondsIntervalId) {
    clearInterval(clockSecondsIntervalId);
    clockSecondsIntervalId = null;
  }
}

function configureHabitatAutoCycle(minutes) {
  if (autoCycleIntervalId) {
    clearInterval(autoCycleIntervalId);
    autoCycleIntervalId = null;
  }
  const mins = Number(minutes) || 0;
  if (mins > 0) {
    autoCycleIntervalId = setInterval(() => {
      if (!document.hidden && !weWallpaperPaused) {
        initHabitat(currentHabitatIdx + 1);
        renderHabitatMenu();
      }
    }, mins * 60 * 1000);
  }
}

function applyAllWeSettings(persist = true) {
  weSettings.language = weSettings.language === 'en' ? 'en' : 'tr';
  const langChanged = window.__weLang !== weSettings.language;
  window.__weLang = weSettings.language;

  // Determine matching preset profile or mark custom
  const matchedProfile = Object.entries(WE_PERF_PROFILES).find(([, p]) =>
    p.sceneFps === Number(weSettings.sceneFps) &&
    p.detailTier === Number(weSettings.detailTier) &&
    p.glassFps === Number(weSettings.glassFps) &&
    p.glassQuality === Number(weSettings.glassQuality)
  );
  weSettings.perfProfile = matchedProfile ? matchedProfile[0] : 'custom';
  weSettings.perfMigratedV2 = true;

  if (persist) {
    lsSet(WE_SETTINGS_STORAGE_KEY, weSettings);
    if (typeof window.__weScheduleUserStateSync === 'function') window.__weScheduleUserStateSync();
  }

  // 1. Scene FPS, Creature Speed & Multi-Tier HD Visual Detail (1x Standart, 2x Yüksek HD, 3x Ultra)
  window.__weSceneFps = Number(weSettings.sceneFps) || 30;
  window.__weCreatureSpeed = Math.max(0.4, Math.min(2.5, Number(weSettings.creatureSpeed) || 1.0));
  const desiredTier = [1, 2, 3].includes(Number(weSettings.detailTier)) ? Number(weSettings.detailTier) : 1;
  const tierChanged = window.__weDetailTier !== desiredTier;
  window.__weDetailTier = desiredTier;

  // 2. Liquid Glass Quality, FPS, Blur & Opacity
  window.__weGlassFps = Number(weSettings.glassFps) || 20;
  const nextGlassQ = Number(weSettings.glassQuality) || 0.75;
  if (window.__weGlassQualityScale !== nextGlassQ) {
    window.__weGlassQualityScale = nextGlassQ;
    cachedGlassCards.forEach((c) => {
      if (c && c.lens) { c.lens.width = 1; c.lens.height = 1; }
    });
  }
  const blurPx = Math.max(0, Math.min(8, Number(weSettings.glassBlur) ?? 2.2));
  const opacityPct = Math.max(25, Math.min(100, Number(weSettings.glassOpacity) || 90));
  document.documentElement.style.setProperty('--we-glass-blur', `${blurPx.toFixed(1)}px`);
  document.documentElement.style.setProperty('--we-glass-opacity', (opacityPct / 100).toFixed(2));

  // 3. Taskbar Height & Center Offset
  const tbPx = Math.max(0, Math.min(140, Number(weSettings.taskbarHeight) ?? 48));
  window.__weTaskbarHeightPx = tbPx;
  document.documentElement.style.setProperty('--we-taskbar-height', `${tbPx}px`);
  if (typeof resizePixelCanvas === 'function') resizePixelCanvas(tierChanged);
  if (tierChanged && typeof initHabitat === 'function') {
    initHabitat(currentHabitatIdx);
  }

  // Match body background behind Windows Taskbar to active habitat bottom tone
  const activeHab = HABITATS[currentHabitatIdx];
  if (activeHab) {
    document.body.style.backgroundColor = isLightMode ? activeHab.lightBot : activeHab.skyBot;
  }

  const offset = Math.max(-35, Math.min(35, Number(weSettings.centerOffsetY) || 0));
  document.documentElement.style.setProperty('--we-center-offset-y', `${offset}vh`);

  // 4. Auto-cycle, Topbar Mode & Pixel-Art Typography Family
  configureHabitatAutoCycle(weSettings.autoCycleMins);
  const validPixelFonts = ['departure', 'jersey20', 'jersey15', 'pixelify'];
  const activePixelFont = validPixelFonts.includes(String(weSettings.pixelFont || ''))
    ? String(weSettings.pixelFont)
    : 'departure';
  weSettings.pixelFont = activePixelFont;
  document.body.dataset.pixelFont = activePixelFont;
  const tbMode = String(weSettings.topbarMode || 'always');
  document.body.classList.toggle('we-topbar-autohide', tbMode === 'autohide');
  document.body.classList.toggle('we-topbar-hidden', tbMode === 'hidden');
  if (tbMode === 'autohide') {
    if (document.querySelector('.popover-panel.open')) {
      document.body.classList.add('we-topbar-hover');
    }
  } else {
    document.body.classList.remove('we-topbar-hover');
  }

  // 5. Clock seconds, Arctic Christmas Theme & Widget Visibility Toggles
  window.__weArcticChristmas = weSettings.arcticChristmas !== false;
  showClockSeconds = Boolean(weSettings.clockSeconds);
  window.__weClockSeconds = showClockSeconds;
  syncClockSecondsInterval();
  if (showClockSeconds) updateDesktopClockWithSeconds();
  else updateClockAndGreeting();

  const visibilityMap = [
    ['showClock', 'we-hide-clock'],
    ['showGreeting', 'we-hide-greeting'],
    ['showSearch', 'we-hide-search'],
    ['showDock', 'we-hide-dock'],
    ['showHeadline', 'we-hide-headline'],
    ['showMusic', 'we-hide-music'],
    ['showSystem', 'we-hide-system'],
    ['showHabitatPill', 'we-hide-habitat-pill'],
    ['showNewsBtn', 'we-hide-news-btn'],
    ['showWeatherBtn', 'we-hide-weather-btn'],
    ['showAirBtn', 'we-hide-air-btn'],
    ['showFocusBtn', 'we-hide-focus-btn'],
    ['showCalendarBtn', 'we-hide-calendar-btn'],
    ['showNotesBtn', 'we-hide-notes-btn'],
    ['showDataBtn', 'we-hide-data-btn'],
  ];
  for (const [key, cls] of visibilityMap) {
    document.body.classList.toggle(cls, !weSettings[key]);
  }

  repaintGlassNow();
  syncSettingsWidgetUI();
  if (langChanged && typeof window.__weApplyLanguage === 'function') {
    window.__weApplyLanguage(weSettings.language, { reloadNews: true, refreshSports: true });
  }
}

// Build the On-Screen Settings Widget in the Top Right Toolbar
const headerRight = document.querySelector('.header-controls-right');
const weSettingsWrapper = document.createElement('div');
weSettingsWrapper.id = 'weSettingsBtnWrapper';
weSettingsWrapper.className = 'relative';

const weSettingsBtn = document.createElement('button');
weSettingsBtn.id = 'weSettingsBtn';
weSettingsBtn.type = 'button';
weSettingsBtn.title = 'Duvar Kağıdı, Liquid Glass Kalite ve Widget Ayarları';
weSettingsBtn.setAttribute('aria-label', 'Duvar kağıdı ayarları');
weSettingsBtn.setAttribute('aria-haspopup', 'true');
weSettingsBtn.setAttribute('aria-controls', 'weSettingsPopover');
weSettingsBtn.setAttribute('aria-expanded', 'false');
weSettingsBtn.className = 'optical-pill rounded-full px-3 py-2 flex items-center gap-2 text-xs font-medium text-white/95';
weSettingsBtn.innerHTML = `${DESKTOP_ICONS.settings}<span class="hidden sm:inline font-pixel tracking-wide">Ayarlar</span>`;

const weSettingsPopover = document.createElement('div');
weSettingsPopover.id = 'weSettingsPopover';
weSettingsPopover.setAttribute('role', 'region');
weSettingsPopover.setAttribute('aria-label', 'Duvar kağıdı ve Liquid Glass ayarları');
weSettingsPopover.setAttribute('aria-hidden', 'true');
weSettingsPopover.inert = true;
weSettingsPopover.className = 'popover-panel editorial-modal rounded-3xl we-settings-popover absolute right-0 mt-2.5 z-50';

weSettingsPopover.innerHTML = `
  <div class="flex items-center justify-between pb-3 border-b border-white/10">
    <div>
      <p id="weSetEyebrow" class="text-[11px] text-sky-300 font-pixel tracking-wide uppercase">Diorama · Masaüstü Motoru</p>
      <h3 id="weSetTitle" class="text-sm font-semibold text-white font-pixel mt-0.5">Duvar Kağıdı & Liquid Glass Ayarları</h3>
    </div>
    <button id="weResetDefaultsBtn" type="button" class="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white/80 font-pixel transition">Sıfırla</button>
  </div>

  <!-- LANGUAGE SWITCHER -->
  <div class="we-settings-section">
    <div id="weSetLangTitle" class="we-settings-section-title">Dil / Language</div>
    <div id="weLanguageGroup" class="we-segmented-grid" style="grid-template-columns:repeat(2,minmax(0,1fr));">
      <button type="button" data-val="tr" class="we-seg-btn">Türkçe</button>
      <button type="button" data-val="en" class="we-seg-btn">English</button>
    </div>
  </div>

  <!-- SECTION 1: SCENE FPS & VISUAL DETAIL -->
  <div class="we-settings-section">
    <div id="weSetSec1Title" class="we-settings-section-title">1. Sahne Performansı & Görsel Detay Seviyesi</div>
    <div id="weSetPerfProfileLabel" class="text-xs text-white/75 mb-1.5 font-pixel">Performans Profili (Tek Tıkla Seç)</div>
    <div id="wePerfProfileGroup" class="we-segmented-grid we-segmented-3 mb-3">
      <button type="button" data-val="eco" class="we-seg-btn">Sessiz (Laptop)</button>
      <button type="button" data-val="balanced" class="we-seg-btn">Dengeli</button>
      <button type="button" data-val="high" class="we-seg-btn">Yüksek HD</button>
    </div>
    <div id="weSetFpsLabel" class="text-xs text-white/75 mb-1.5 font-pixel">Sahne Kare Hızı (FPS Sınırı — Hız Sabit Kalır)</div>
    <div id="weSceneFpsGroup" class="we-segmented-grid mb-3">
      <button type="button" data-val="24" class="we-seg-btn">24 FPS</button>
      <button type="button" data-val="30" class="we-seg-btn">30 FPS</button>
      <button type="button" data-val="60" class="we-seg-btn">60 FPS</button>
      <button type="button" data-val="144" class="we-seg-btn">Sınırsız</button>
    </div>
    <div id="weSetDetailLabel" class="text-xs text-white/75 mb-1.5 font-pixel">Sahne Çizim Kalitesi & Detay Yoğunluğu</div>
    <div id="weDetailTierGroup" class="we-segmented-grid we-segmented-3 mb-2">
      <button type="button" data-val="1" class="we-seg-btn">1x Standart</button>
      <button type="button" data-val="2" class="we-seg-btn">2x Yüksek HD</button>
      <button type="button" data-val="3" class="we-seg-btn">3x Ultra Zengin</button>
    </div>
    <div class="we-slider-row">
      <span id="weSetSpeedLabel" class="font-pixel">Canlı Hareket Hızı</span>
      <input id="weCreatureSpeedSlider" type="range" min="0.5" max="2.0" step="0.1" value="1.0">
      <span id="weCreatureSpeedVal" class="we-slider-val">1.0x</span>
    </div>
  </div>

  <!-- SECTION 2: LIQUID GLASS QUALITY & FPS -->
  <div class="we-settings-section">
    <div id="weSetSec2Title" class="we-settings-section-title">2. Optical Liquid Glass (Sıvı Cam) Kalitesi</div>
    <div id="weSetGlassFpsLabel" class="text-xs text-white/75 mb-1.5 font-pixel">Cam Kırılma Yenileme Hızı (Glass FPS)</div>
    <div id="weGlassFpsGroup" class="we-segmented-grid mb-3">
      <button type="button" data-val="15" class="we-seg-btn">15 FPS</button>
      <button type="button" data-val="20" class="we-seg-btn">20 FPS</button>
      <button type="button" data-val="30" class="we-seg-btn">30 FPS</button>
      <button type="button" data-val="60" class="we-seg-btn">60 FPS</button>
    </div>
    <div id="weSetGlassQLabel" class="text-xs text-white/75 mb-1.5 font-pixel">Mercek Çözünürlük Kalitesi (Süper Örnekleme)</div>
    <div id="weGlassQualityGroup" class="we-segmented-grid mb-2">
      <button type="button" data-val="0.75" class="we-seg-btn">0.75x Hafif</button>
      <button type="button" data-val="1" class="we-seg-btn">1x Birebir</button>
      <button type="button" data-val="1.5" class="we-seg-btn">1.5x Yüksek</button>
      <button type="button" data-val="2" class="we-seg-btn">2.0x Ultra</button>
    </div>
    <div class="we-slider-row">
      <span id="weSetBlurLabel" class="font-pixel">Cam Bulanıklığı (Blur)</span>
      <input id="weGlassBlurSlider" type="range" min="0" max="6" step="0.2" value="2.2">
      <span id="weGlassBlurVal" class="we-slider-val">2.2px</span>
    </div>
    <div class="we-slider-row">
      <span id="weSetOpLabel" class="font-pixel">Cam Kırılma Yoğunluğu</span>
      <input id="weGlassOpacitySlider" type="range" min="30" max="100" step="5" value="90">
      <span id="weGlassOpacityVal" class="we-slider-val">90%</span>
    </div>
  </div>

  <!-- SECTION 3: TASKBAR, POSITION & AUTOMATION -->
  <div class="we-settings-section">
    <div id="weSetSec3Title" class="we-settings-section-title">3. Masaüstü Hizalama & Habitat Otomasyonu</div>
    <div class="we-slider-row">
      <span id="weSetTaskbarLabel" class="font-pixel">Görev Çubuğu Boşluğu (Zemin)</span>
      <input id="weTaskbarSlider" type="range" min="0" max="120" step="2" value="48">
      <span id="weTaskbarVal" class="we-slider-val">48px</span>
    </div>
    <div class="we-slider-row mb-3">
      <span id="weSetOffsetLabel" class="font-pixel">Orta Alan Dikey Konumu</span>
      <input id="weCenterOffsetSlider" type="range" min="-35" max="35" step="1" value="0">
      <span id="weCenterOffsetVal" class="we-slider-val">0%</span>
    </div>
    <div id="weSetAutoCycleLabel" class="text-xs text-white/75 mb-1.5 font-pixel">Otomatik Habitat Değiştirme</div>
    <div id="weAutoCycleGroup" class="we-segmented-grid mb-3">
      <button type="button" data-val="0" class="we-seg-btn">Kapalı</button>
      <button type="button" data-val="1" class="we-seg-btn">1 DK</button>
      <button type="button" data-val="5" class="we-seg-btn">5 DK</button>
      <button type="button" data-val="15" class="we-seg-btn">15 DK</button>
    </div>
    <div id="weSetTopbarLabel" class="text-xs text-white/75 mb-1.5 font-pixel">Üst Araç Çubuğu Görünümü</div>
    <div id="weTopbarModeGroup" class="we-segmented-grid we-segmented-3 mb-3">
      <button type="button" data-val="always" class="we-seg-btn">Her Zaman Açık</button>
      <button type="button" data-val="autohide" class="we-seg-btn">Fare Yaklaşınca</button>
      <button type="button" data-val="hidden" class="we-seg-btn">Sadece Ayarlar</button>
    </div>
    <div id="weSetFontLabel" class="text-xs text-white/75 mb-1.5 font-pixel">Pixel Art Yazı Tipi (Saat & Arayüz)</div>
    <div id="wePixelFontGroup" class="we-segmented-grid">
      <button type="button" data-val="departure" class="we-seg-btn" title="Departure Mono — Keskin & ultra okunaklı modern piksel">Departure</button>
      <button type="button" data-val="jersey20" class="we-seg-btn" title="Jersey 20 — 20px yüksek çözünürlüklü yumuşak piksel">Jersey 20</button>
      <button type="button" data-val="jersey15" class="we-seg-btn" title="Jersey 15 — 15px sıcak retro oyun pikseli">Jersey 15</button>
      <button type="button" data-val="pixelify" class="we-seg-btn" title="Pixelify Sans — Klasik varsayılan">Pixelify</button>
    </div>
    <div id="weSetChristmasLabel" class="text-xs text-white/75 mb-1.5 mt-3 font-pixel">Kutup Noel Teması (Noel Baba, Elfler &amp; Hediyeler)</div>
    <div id="weArcticChristmasGroup" class="we-segmented-grid" style="grid-template-columns:repeat(2,minmax(0,1fr));">
      <button type="button" data-val="false" class="we-seg-btn">Kapalı</button>
      <button type="button" data-val="true" class="we-seg-btn">Açık</button>
    </div>
  </div>

  <!-- SECTION 4: WIDGET TOGGLES -->
  <div class="we-settings-section">
    <div id="weSetSec4Title" class="we-settings-section-title">4. Aktif Widget'lar (Tıkla Aç / Kapat)</div>
    <div id="weWidgetTogglesGrid" class="we-toggles-grid"></div>
  </div>
`;

weSettingsWrapper.append(weSettingsBtn, weSettingsPopover);
if (headerRight) {
  headerRight.appendChild(weSettingsWrapper);
}

// Register #weSettingsPopover in the shared popovers array
const weSettingsEntry = { btn: weSettingsBtn, panel: weSettingsPopover };
popovers.push(weSettingsEntry);
weSettingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  closeDesktopDrawer();
  const shouldOpen = !weSettingsPopover.classList.contains('open');
  popovers.forEach((p) => setPopoverOpen(p, false));
  if (shouldOpen) {
    syncSettingsWidgetUI();
    setPopoverOpen(weSettingsEntry, true);
  }
});
weSettingsPopover.addEventListener('click', (e) => e.stopPropagation());

// Close launcher drawer whenever any top-bar popover button or background canvas is clicked
popovers.forEach((entry) => {
  entry.btn?.addEventListener('click', () => {
    closeDesktopDrawer();
    requestAnimationFrame(repaintGlassNow);
  });
});
canvas?.addEventListener('pointerdown', () => {
  closeDesktopDrawer();
  closeAllPopovers(false);
  if (document.body.classList.contains('we-topbar-autohide')) {
    setTopbarHoverState(false);
  }
});

const WIDGET_TOGGLE_ITEMS = [
  ['showClock', 'Saat ve Tarih', 'Clock & Date'],
  ['clockSeconds', 'Saatte Saniye (SS:DD:sn)', 'Show Seconds (HH:MM:SS)'],
  ['showGreeting', 'Selamlama ve İsim', 'Greeting & Name'],
  ['showSearch', 'Linux Arama Çubuğu', 'Desktop Search Bar'],
  ['showDock', 'Uygulamalar Dock', 'App Shortcuts Dock'],
  ['showHeadline', 'Alt Gündem Bandı', 'Bottom News Ticker'],
  ['showMusic', 'Alt Sol: Piksel Plak Çalar', 'Bottom Left: Vinyl Player'],
  ['showSystem', 'Alt Sağ: Sistem & Diorama', 'Bottom Right: System Stats'],
  ['showHabitatPill', 'Üst Sol: Habitat Seçici', 'Top Left: Habitat Picker'],
  ['showNewsBtn', 'Üst Sağ: Gündem / Haber', 'Top Right: News Center'],
  ['showWeatherBtn', 'Üst Sağ: Hava Durumu', 'Top Right: Weather'],
  ['showAirBtn', 'Üst Sağ: Xiaomi Oda İklimi', 'Top Right: Room Climate'],
  ['showFocusBtn', 'Üst Sağ: Odak & Ses', 'Top Right: Focus & Audio'],
  ['showCalendarBtn', 'Üst Sağ: Takvim', 'Top Right: Calendar'],
  ['showNotesBtn', 'Üst Sağ: Kişisel Defter', 'Top Right: Notes & Tasks'],
  ['showDataBtn', 'Üst Sağ: Veri Yönetimi', 'Top Right: Data Backup'],
];

const weWidgetTogglesGrid = document.getElementById('weWidgetTogglesGrid');

function renderWidgetToggleChips() {
  if (!weWidgetTogglesGrid) return;
  weWidgetTogglesGrid.replaceChildren();
  WIDGET_TOGGLE_ITEMS.forEach(([key, labelTr, labelEn]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.key = key;
    const isOn = Boolean(weSettings[key]);
    btn.className = `we-toggle-chip${isOn ? ' is-on' : ''}`;
    btn.innerHTML = `<span class="truncate font-pixel">${isEn() ? labelEn : labelTr}</span><span class="we-toggle-dot"></span>`;
    btn.addEventListener('click', () => {
      weSettings[key] = !weSettings[key];
      markInAppSettingsModified();
      applyAllWeSettings(true);
      if (typeof window.__weFlushUserStateSync === 'function') window.__weFlushUserStateSync();
    });
    weWidgetTogglesGrid.appendChild(btn);
  });
}

function bindSegmentedGroup(groupId, settingKey, isNumeric = true) {
  const group = document.getElementById(groupId);
  if (!group) return;
  group.querySelectorAll('.we-seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      weSettings[settingKey] = isNumeric ? Number(btn.dataset.val) : btn.dataset.val;
      markInAppSettingsModified();
      applyAllWeSettings(true);
      if (typeof window.__weFlushUserStateSync === 'function') window.__weFlushUserStateSync();
    });
  });
}

bindSegmentedGroup('weLanguageGroup', 'language', false);
document.getElementById('wePerfProfileGroup')?.querySelectorAll('.we-seg-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.val;
    if (WE_PERF_PROFILES[key]) {
      weSettings.perfProfile = key;
      Object.assign(weSettings, WE_PERF_PROFILES[key]);
      markInAppSettingsModified();
      applyAllWeSettings(true);
      if (typeof window.__weFlushUserStateSync === 'function') window.__weFlushUserStateSync();
    }
  });
});
bindSegmentedGroup('weSceneFpsGroup', 'sceneFps', true);
bindSegmentedGroup('weDetailTierGroup', 'detailTier', true);
bindSegmentedGroup('weGlassFpsGroup', 'glassFps', true);
bindSegmentedGroup('weGlassQualityGroup', 'glassQuality', true);
bindSegmentedGroup('weAutoCycleGroup', 'autoCycleMins', true);
bindSegmentedGroup('weTopbarModeGroup', 'topbarMode', false);
bindSegmentedGroup('wePixelFontGroup', 'pixelFont', false);
document.getElementById('weArcticChristmasGroup')?.querySelectorAll('.we-seg-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    weSettings.arcticChristmas = btn.dataset.val === 'true';
    markInAppSettingsModified();
    applyAllWeSettings(true);
    if (typeof window.__weFlushUserStateSync === 'function') window.__weFlushUserStateSync();
  });
});

for (const [sliderId, settingKey] of [
  ['weCreatureSpeedSlider', 'creatureSpeed'],
  ['weGlassBlurSlider', 'glassBlur'],
  ['weGlassOpacitySlider', 'glassOpacity'],
  ['weTaskbarSlider', 'taskbarHeight'],
  ['weCenterOffsetSlider', 'centerOffsetY'],
]) {
  const el = document.getElementById(sliderId);
  if (!el) continue;
  const applySliderVal = (e, flushBridge = false) => {
    weSettings[settingKey] = Number(e.target.value);
    markInAppSettingsModified();
    applyAllWeSettings(true);
    if (flushBridge && typeof window.__weFlushUserStateSync === 'function') {
      window.__weFlushUserStateSync();
    }
  };
  el.addEventListener('input', (e) => applySliderVal(e, false));
  el.addEventListener('change', (e) => applySliderVal(e, true));
}
document.getElementById('weResetDefaultsBtn')?.addEventListener('click', () => {
  const keepLang = weSettings.language;
  weSettings = { ...DEFAULT_WE_SETTINGS, language: keepLang };
  markInAppSettingsModified();
  applyAllWeSettings(true);
  if (typeof window.__weFlushUserStateSync === 'function') window.__weFlushUserStateSync();
  showDesktopToast(L('⚙️ Ayarlar varsayılan değerlere sıfırlandı.', 'Settings reset to defaults.'));
});

function syncSettingsWidgetUI() {
  const markGroup = (id, val) => {
    document.getElementById(id)?.querySelectorAll('.we-seg-btn').forEach((b) => {
      b.classList.toggle('is-active', String(b.dataset.val) === String(val));
    });
  };
  markGroup('weLanguageGroup', weSettings.language);
  markGroup('wePerfProfileGroup', weSettings.perfProfile);
  markGroup('weSceneFpsGroup', weSettings.sceneFps);
  markGroup('weDetailTierGroup', weSettings.detailTier);
  markGroup('weGlassFpsGroup', weSettings.glassFps);
  markGroup('weGlassQualityGroup', weSettings.glassQuality);
  markGroup('weAutoCycleGroup', weSettings.autoCycleMins);
  markGroup('weTopbarModeGroup', weSettings.topbarMode);
  markGroup('wePixelFontGroup', weSettings.pixelFont);
  markGroup('weArcticChristmasGroup', String(weSettings.arcticChristmas !== false));

  const spdSlider = document.getElementById('weCreatureSpeedSlider');
  const spdVal = document.getElementById('weCreatureSpeedVal');
  if (spdSlider) spdSlider.value = String(weSettings.creatureSpeed ?? 1.0);
  if (spdVal) spdVal.textContent = `${Number(weSettings.creatureSpeed ?? 1.0).toFixed(1)}x`;

  const blurSlider = document.getElementById('weGlassBlurSlider');
  const blurVal = document.getElementById('weGlassBlurVal');
  if (blurSlider) blurSlider.value = String(weSettings.glassBlur);
  if (blurVal) blurVal.textContent = `${Number(weSettings.glassBlur).toFixed(1)}px`;

  const opSlider = document.getElementById('weGlassOpacitySlider');
  const opVal = document.getElementById('weGlassOpacityVal');
  if (opSlider) opSlider.value = String(weSettings.glassOpacity);
  if (opVal) opVal.textContent = `${weSettings.glassOpacity}%`;

  const tbSlider = document.getElementById('weTaskbarSlider');
  const tbVal = document.getElementById('weTaskbarVal');
  if (tbSlider) tbSlider.value = String(weSettings.taskbarHeight);
  if (tbVal) tbVal.textContent = `${weSettings.taskbarHeight}px`;

  const coSlider = document.getElementById('weCenterOffsetSlider');
  const coVal = document.getElementById('weCenterOffsetVal');
  if (coSlider) coSlider.value = String(weSettings.centerOffsetY);
  if (coVal) coVal.textContent = `${weSettings.centerOffsetY}%`;

  renderWidgetToggleChips();
}

applyAllWeSettings(false);

// ============================================================================
// 7. WALLPAPER ENGINE SETTINGS BRIDGE (window.wallpaperPropertyListener)
// ============================================================================
function setAmbientVolumeFromProperty(pctValue) {
  const pct = Math.min(100, Math.max(5, Number(pctValue) || 40));
  ambientVolume = pct / 100;
  if (ambientVolumeSlider) ambientVolumeSlider.value = String(pct);
  if (ambientVolumeValue) ambientVolumeValue.textContent = `${pct}%`;
  try { localStorage.setItem('diorama_ambient_volume', String(pct)); } catch {}
  if (activeSoundSource?._gain && audioCtx) {
    const g = activeSoundSource._gain.gain;
    const now = audioCtx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(ambientVolume, now + 0.12);
  }
}

export function applyWallpaperEngineProperties(properties) {
  if (!properties || typeof properties !== 'object') return;
  const propEntries = Object.entries(properties).filter(([, v]) => v && typeof v === 'object' && 'value' in v);
  if (!propEntries.length) return;

  const isInitialBulkDump = !hasReceivedInitialWeProps && propEntries.length >= 6;
  hasReceivedInitialWeProps = true;

  let snapshotDirty = false;
  const shouldApplyWeProp = (propKey, rawVal) => {
    let valKey;
    try {
      valKey = JSON.stringify(rawVal);
    } catch {
      valKey = String(rawVal);
    }
    const hadSnapshotKey = Object.prototype.hasOwnProperty.call(wePropSnapshot, propKey);
    const snapshotChanged = !hadSnapshotKey || wePropSnapshot[propKey] !== valKey;
    if (snapshotChanged) {
      wePropSnapshot[propKey] = valKey;
      snapshotDirty = true;
    }
    if (!isInitialBulkDump) return true;
    // Do not let Wallpaper Engine's unchanged startup defaults overwrite in-app customizations
    if (weSettings.userModified && !hadSnapshotKey) return false;
    if (hadSnapshotKey && !snapshotChanged) return false;
    return true;
  };

  let anyWeSettingChanged = false;
  let anyOtherPropApplied = false;

  if (properties.we_habitat && shouldApplyWeProp('we_habitat', properties.we_habitat.value)) {
    const habId = String(properties.we_habitat.value || 'random');
    if (habId === 'random') {
      setPinnedHabitatId(null);
    } else {
      const idx = HABITATS.findIndex((h) => h.id === habId);
      if (idx !== -1) {
        setPinnedHabitatId(habId);
        if (currentHabitatIdx !== idx) {
          initHabitat(idx);
          renderHabitatMenu();
        }
      }
    }
    anyOtherPropApplied = true;
  }

  if (properties.we_perf_profile && shouldApplyWeProp('we_perf_profile', properties.we_perf_profile.value)) {
    const profKey = String(properties.we_perf_profile.value || 'balanced');
    if (WE_PERF_PROFILES[profKey]) {
      weSettings.perfProfile = profKey;
      Object.assign(weSettings, WE_PERF_PROFILES[profKey]);
      anyWeSettingChanged = true;
    }
  }
  if (properties.we_autocycle_mins && shouldApplyWeProp('we_autocycle_mins', properties.we_autocycle_mins.value)) {
    weSettings.autoCycleMins = Number(properties.we_autocycle_mins.value) || 0;
    anyWeSettingChanged = true;
  }
  if (properties.we_topbar_mode && shouldApplyWeProp('we_topbar_mode', properties.we_topbar_mode.value)) {
    weSettings.topbarMode = String(properties.we_topbar_mode.value || 'always');
    anyWeSettingChanged = true;
  }
  if (properties.we_pixel_font && shouldApplyWeProp('we_pixel_font', properties.we_pixel_font.value)) {
    weSettings.pixelFont = String(properties.we_pixel_font.value || 'departure');
    anyWeSettingChanged = true;
  }
  if (properties.we_language && shouldApplyWeProp('we_language', properties.we_language.value)) {
    weSettings.language = String(properties.we_language.value || 'tr') === 'en' ? 'en' : 'tr';
    anyWeSettingChanged = true;
  }
  if (properties.we_taskbar_height !== undefined && shouldApplyWeProp('we_taskbar_height', properties.we_taskbar_height.value)) {
    const n = Number(properties.we_taskbar_height.value);
    weSettings.taskbarHeight = Number.isFinite(n) ? n : 48;
    anyWeSettingChanged = true;
  }
  if (properties.we_center_offset_y !== undefined && shouldApplyWeProp('we_center_offset_y', properties.we_center_offset_y.value)) {
    weSettings.centerOffsetY = Number(properties.we_center_offset_y.value) || 0;
    anyWeSettingChanged = true;
  }
  if (properties.we_clock_seconds !== undefined && shouldApplyWeProp('we_clock_seconds', properties.we_clock_seconds.value)) {
    weSettings.clockSeconds = Boolean(properties.we_clock_seconds.value);
    anyWeSettingChanged = true;
  }

  const propToSetting = [
    ['we_show_clock', 'showClock'],
    ['we_show_greeting', 'showGreeting'],
    ['we_show_search', 'showSearch'],
    ['we_show_dock', 'showDock'],
    ['we_show_headline', 'showHeadline'],
    ['we_show_music', 'showMusic'],
    ['we_show_system', 'showSystem'],
    ['we_show_habitat_pill', 'showHabitatPill'],
    ['we_show_news_btn', 'showNewsBtn'],
    ['we_show_weather_btn', 'showWeatherBtn'],
    ['we_show_air_btn', 'showAirBtn'],
    ['we_show_focus_btn', 'showFocusBtn'],
    ['we_show_calendar_btn', 'showCalendarBtn'],
    ['we_show_notes_btn', 'showNotesBtn'],
    ['we_show_data_btn', 'showDataBtn'],
    ['we_arctic_christmas', 'arcticChristmas'],
  ];
  for (const [propKey, settingKey] of propToSetting) {
    if (properties[propKey] !== undefined && shouldApplyWeProp(propKey, properties[propKey].value)) {
      weSettings[settingKey] = Boolean(properties[propKey].value);
      anyWeSettingChanged = true;
    }
  }

  if (properties.we_theme_mode && shouldApplyWeProp('we_theme_mode', properties.we_theme_mode.value)) {
    const mode = String(properties.we_theme_mode.value || 'dark');
    const atBox = document.getElementById('wxAutoTheme');
    if (mode === 'auto') {
      wxAutoTheme = true;
      if (atBox) atBox.checked = true;
      lsPut('diorama_wx_autotheme', 'on');
      if (WX.data) applyWeather();
    } else {
      wxAutoTheme = false;
      if (atBox) atBox.checked = false;
      lsPut('diorama_wx_autotheme', 'off');
      const wantLight = mode === 'light';
      setLightMode(wantLight);
      lsPut('diorama_theme', wantLight ? 'light' : 'dark');
      renderWxPreviewButtons();
    }
    anyOtherPropApplied = true;
  }

  if (properties.we_weather_fx && shouldApplyWeProp('we_weather_fx', properties.we_weather_fx.value)) {
    wxFxEnabled = Boolean(properties.we_weather_fx.value);
    const fxBox = document.getElementById('wxFxToggle');
    if (fxBox) fxBox.checked = wxFxEnabled;
    lsPut('diorama_wxfx', wxFxEnabled ? 'on' : 'off');
    anyOtherPropApplied = true;
  }

  if (properties.we_username !== undefined && shouldApplyWeProp('we_username', properties.we_username.value)) {
    const newName = String(properties.we_username.value || '').trim() || 'Gezgin';
    if (editableUserName && editableUserName.textContent !== newName) {
      editableUserName.textContent = newName;
      lsPut('diorama_username', newName);
    }
    anyOtherPropApplied = true;
  }

  if (properties.we_city !== undefined && shouldApplyWeProp('we_city', properties.we_city.value)) {
    const newCity = String(properties.we_city.value || '').trim();
    if (newCity && newCity.toLowerCase() !== String(userCity || '').toLowerCase()) {
      fetchWeather(newCity, { silent: true });
    }
    anyOtherPropApplied = true;
  }

  if (properties.we_ambient_volume !== undefined && shouldApplyWeProp('we_ambient_volume', properties.we_ambient_volume.value)) {
    setAmbientVolumeFromProperty(properties.we_ambient_volume.value);
    anyOtherPropApplied = true;
  }
  if (properties.we_biome_creature_sounds !== undefined && shouldApplyWeProp('we_biome_creature_sounds', properties.we_biome_creature_sounds.value)) {
    if (typeof window.__weSetBiomeCreatureSounds === 'function') {
      window.__weSetBiomeCreatureSounds(Boolean(properties.we_biome_creature_sounds.value));
    }
    anyOtherPropApplied = true;
  }
  if (properties.we_ambient_sound !== undefined && shouldApplyWeProp('we_ambient_sound', properties.we_ambient_sound.value)) {
    const sound = String(properties.we_ambient_sound.value || 'off');
    if (sound === 'off') {
      if (typeof window.__weSetBiomeAutoAudio === 'function') window.__weSetBiomeAutoAudio(false);
      if (activeSoundType) stopAmbientSound();
    } else if (sound === 'biome_auto') {
      if (typeof window.__weSetBiomeAutoAudio === 'function') window.__weSetBiomeAutoAudio(true);
    } else if (['rain', 'fire', 'forest', 'water', 'wind', 'night', 'zen', 'vinyl'].includes(sound)) {
      if (typeof window.__weSetBiomeAutoAudio === 'function') window.__weSetBiomeAutoAudio(false);
      if (activeSoundType !== sound) toggleAmbientSound(sound);
    }
    anyOtherPropApplied = true;
  }

  if (snapshotDirty) {
    lsSet(WE_PROP_SNAPSHOT_KEY, wePropSnapshot);
  }
  if (anyWeSettingChanged) {
    applyAllWeSettings(true);
  } else if (anyOtherPropApplied) {
    applyAllWeSettings(false);
  }
}

window.wallpaperPropertyListener = {
  applyUserProperties: applyWallpaperEngineProperties,
  setPaused: (isPaused) => {
    weWallpaperPaused = Boolean(isPaused);
    if (typeof window.__weSetScenePaused === 'function') {
      window.__weSetScenePaused(weWallpaperPaused);
    } else {
      window.__wePaused = weWallpaperPaused;
    }
    if (!weWallpaperPaused) {
      if (showClockSeconds) updateDesktopClockWithSeconds();
      else if (typeof updateClockAndGreeting === 'function') updateClockAndGreeting();
      if (bridgeOnline && typeof window.__wePollSystemStats === 'function' && weSettings.showSystem && !document.body.classList.contains('zen-active')) {
        window.__wePollSystemStats();
      }
    }
  },
};

// ============================================================================
// 8. SSE STREAM (MOUSE WHEEL + PHYSICAL KEYBOARD IME) & BRIDGE HEALTH CHECK
// ============================================================================
let bridgeEventSource = null;
let lastPointerX = window.innerWidth / 2;
let lastPointerY = window.innerHeight / 2;

document.addEventListener('pointermove', (e) => {
  lastPointerX = e.clientX;
  lastPointerY = e.clientY;
}, { passive: true });

let smoothWheelVelocityY = 0;
let smoothWheelVelocityX = 0;
let smoothWheelRaf = null;
let activeWheelChain = null;

function stepSmoothWheel() {
  if (!activeWheelChain) {
    smoothWheelRaf = null;
    return;
  }
  let moved = false;
  if (activeWheelChain.horizontal && Math.abs(smoothWheelVelocityX) > 0.4) {
    const stepX = smoothWheelVelocityX * 0.28;
    smoothWheelVelocityX -= stepX;
    activeWheelChain.horizontal.scrollLeft += stepX;
    moved = true;
  } else {
    smoothWheelVelocityX = 0;
  }

  if (activeWheelChain.vertical?.length && Math.abs(smoothWheelVelocityY) > 0.4) {
    const stepY = smoothWheelVelocityY * 0.28;
    smoothWheelVelocityY -= stepY;
    applyVerticalDelta(activeWheelChain.vertical, stepY);
    moved = true;
  } else {
    smoothWheelVelocityY = 0;
  }

  if (moved && (Math.abs(smoothWheelVelocityY) > 0.4 || Math.abs(smoothWheelVelocityX) > 0.4)) {
    smoothWheelRaf = requestAnimationFrame(stepSmoothWheel);
  } else {
    smoothWheelVelocityY = 0;
    smoothWheelVelocityX = 0;
    smoothWheelRaf = null;
  }
}

function handleBridgeWheelEvent(msg) {
  const rawDelta = Number(msg.delta) || 0;
  if (!rawDelta) return;

  const targetAtCursor = typeof document.elementFromPoint === 'function'
    ? document.elementFromPoint(lastPointerX, lastPointerY)
    : null;

  let chain = targetAtCursor ? findScrollChain(targetAtCursor) : { vertical: [], horizontal: null };

  if (!chain.vertical.length && !chain.horizontal) {
    if (!launcherDrawer.hidden && isElementVerticallyScrollable(resultsListEl)) {
      chain = { vertical: [resultsListEl], horizontal: null };
    } else {
      const openPop = document.querySelector('.popover-panel.open');
      const activeContainer = resolveActiveScrollContainer(openPop);
      if (activeContainer && isElementVerticallyScrollable(activeContainer)) {
        chain = { vertical: [activeContainer], horizontal: null };
      }
    }
  }

  if (!chain.vertical.length && !chain.horizontal) return;

  stopScrollMomentum();
  activeWheelChain = chain;
  const pixelStep = -(rawDelta / 120) * 92;

  if (msg.axis === 'x' || (chain.horizontal && (!chain.vertical.length || targetAtCursor?.closest('#wxHourly')))) {
    smoothWheelVelocityX += pixelStep;
  } else {
    smoothWheelVelocityY += pixelStep;
  }

  if (smoothWheelRaf === null) {
    smoothWheelRaf = requestAnimationFrame(stepSmoothWheel);
  }
}

function connectBridgeEventStream() {
  if (bridgeEventSource || typeof EventSource === 'undefined') return;
  try {
    const es = new EventSource(`${BRIDGE_BASE_URL}/api/desktop/events`);
    bridgeEventSource = es;
    es.onmessage = (event) => {
      if (!event.data) return;
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'wheel') handleBridgeWheelEvent(msg);
        else if (msg.type === 'key') handleBridgeKeyboardEvent(msg);
        else if (msg.type === 'blur') setActiveDesktopInput(null);
        else if (msg.type === 'media' && typeof window.__weOnBridgeMediaEvent === 'function') {
          window.__weOnBridgeMediaEvent(msg.media);
        }
      } catch {}
    };
    es.onerror = () => {
      es.close();
      bridgeEventSource = null;
    };
  } catch {
    bridgeEventSource = null;
  }
}

async function pollDesktopBridge() {
  const wasOnline = bridgeOnline;
  const online = await checkDesktopBridge();
  if (online) {
    connectBridgeEventStream();
  }
  if (online && !wasOnline) {
    if (typeof window.__weHydrateUserState === 'function') {
      window.__weHydrateUserState();
    }
    if (typeof window.__wePollBridgeMediaStatus === 'function') {
      window.__wePollBridgeMediaStatus();
    }
    if (typeof window.__weRefreshCalendarFixtures === 'function') {
      window.__weRefreshCalendarFixtures(false);
    }
    if (typeof window.__wePollSystemStats === 'function') {
      window.__wePollSystemStats();
    }
    renderDesktopDock();
    if (!launcherDrawer.hidden) {
      performDesktopSearch(searchInput.value);
    }
    if (typeof loadNewsCategory === 'function' && (!currentNewsItems || !currentNewsItems.length)) {
      loadNewsCategory(activeNewsCat);
    }
    fetch(`${BRIDGE_BASE_URL}/api/desktop/search?category=apps`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.results)) {
          cachedBridgeApps = d.results;
          renderCustomAppPickerList();
        }
      })
      .catch(() => {});
  }
}
async function scheduleBridgePollLoop() {
  if (!document.hidden && !weWallpaperPaused) {
    await pollDesktopBridge();
  }
  const healthySse = Boolean(bridgeOnline && bridgeEventSource && bridgeEventSource.readyState === 1);
  setTimeout(scheduleBridgePollLoop, healthySse ? 30000 : 5000);
}
pollDesktopBridge();
setTimeout(scheduleBridgePollLoop, 5000);

// ============================================================================
// 9. UNIVERSAL DESKTOP SCROLL ENGINE (KINETIC DRAG + ▲/▼ HOLD BUTTONS + WHEEL)
// ============================================================================
const SCROLLABLE_SELECTORS = [
  '.desktop-results-list',
  '.desktop-custom-app-list',
  '.we-cal-team-list-grid',
  '#newsSourceManagerList',
  '#calendarEventList',
  '#tasksListContainer',
  '#stickyNotesGrid',
  '#wxHourly',
  '#newsPopover',
  '#weatherPopover',
  '#airPurifierPopover',
  '#focusPopover',
  '#calendarPopover',
  '#notesPopover',
  '#dataManagerPopover',
  '#habitatPopover',
  '#weSettingsPopover',
].join(', ');

function isElementVerticallyScrollable(el) {
  return Boolean(el && el.scrollHeight > el.clientHeight + 3);
}

function isElementHorizontallyScrollable(el) {
  return Boolean(el && el.scrollWidth > el.clientWidth + 3);
}

function findScrollChain(startNode) {
  const vertical = [];
  let horizontal = null;
  let curr = startNode instanceof Element ? startNode : null;
  while (curr && curr !== document.body && curr !== document.documentElement) {
    if (!horizontal && (curr.id === 'wxHourly' || curr.classList?.contains('wx-hourly')) && isElementHorizontallyScrollable(curr)) {
      horizontal = curr;
    }
    if (curr.matches?.(SCROLLABLE_SELECTORS) && isElementVerticallyScrollable(curr)) {
      vertical.push(curr);
    }
    curr = curr.parentElement;
  }
  return { vertical, horizontal };
}

let dragScrollState = null;
let momentumFrameId = null;
let suppressClickUntil = 0;

function stopScrollMomentum() {
  if (momentumFrameId !== null) {
    cancelAnimationFrame(momentumFrameId);
    momentumFrameId = null;
  }
}

function applyVerticalDelta(chain, deltaY) {
  for (let i = 0; i < chain.length; i++) {
    const el = chain[i];
    const prev = el.scrollTop;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) continue;
    const canGoDown = deltaY > 0 && prev < maxScroll - 0.5;
    const canGoUp = deltaY < 0 && prev > 0.5;
    if (canGoDown || canGoUp || i === chain.length - 1) {
      el.scrollTop = Math.max(0, Math.min(maxScroll, prev + deltaY));
      if (el.scrollTop !== prev) return el;
    }
  }
  return chain[0] || null;
}

document.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 && e.button !== 1) return;
  const target = e.target instanceof Element ? e.target : null;
  if (!target) return;
  if (target.closest('input[type="range"], .we-scroll-assist')) return;

  const chain = findScrollChain(target);
  if (!chain.vertical.length && !chain.horizontal) return;

  stopScrollMomentum();
  dragScrollState = {
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    lastX: e.clientX,
    lastY: e.clientY,
    lastTime: performance.now(),
    vx: 0,
    vy: 0,
    active: false,
    chain,
  };
}, true);

document.addEventListener('pointermove', (e) => {
  if (!dragScrollState) return;
  const dxFromStart = e.clientX - dragScrollState.startX;
  const dyFromStart = e.clientY - dragScrollState.startY;

  if (!dragScrollState.active) {
    if (Math.hypot(dxFromStart, dyFromStart) < 6) return;
    dragScrollState.active = true;
    document.body.classList.add('we-drag-scrolling');
  }

  const now = performance.now();
  const dt = Math.max(4, now - dragScrollState.lastTime);
  const stepX = e.clientX - dragScrollState.lastX;
  const stepY = e.clientY - dragScrollState.lastY;
  dragScrollState.lastX = e.clientX;
  dragScrollState.lastY = e.clientY;
  dragScrollState.lastTime = now;

  if (dragScrollState.chain.horizontal && Math.abs(dxFromStart) > Math.abs(dyFromStart)) {
    dragScrollState.chain.horizontal.scrollLeft -= stepX;
    dragScrollState.vx = (-stepX / dt) * 16;
  } else if (dragScrollState.chain.vertical.length) {
    applyVerticalDelta(dragScrollState.chain.vertical, -stepY);
    dragScrollState.vy = (-stepY / dt) * 16;
  }
}, true);

function finishDragScroll() {
  if (!dragScrollState) return;
  const state = dragScrollState;
  dragScrollState = null;
  document.body.classList.remove('we-drag-scrolling');

  if (!state.active) return;
  suppressClickUntil = performance.now() + 220;

  let vx = state.vx;
  let vy = state.vy;
  const hEl = state.chain.horizontal;
  const vChain = state.chain.vertical;

  function stepMomentum() {
    vx *= 0.91;
    vy *= 0.91;
    let moved = false;
    if (hEl && Math.abs(vx) > 0.45) {
      const prev = hEl.scrollLeft;
      hEl.scrollLeft += vx;
      if (hEl.scrollLeft !== prev) moved = true;
    }
    if (vChain.length && Math.abs(vy) > 0.45) {
      const used = applyVerticalDelta(vChain, vy);
      if (used) moved = true;
    }
    if (moved && (Math.abs(vx) > 0.45 || Math.abs(vy) > 0.45)) {
      momentumFrameId = requestAnimationFrame(stepMomentum);
    } else {
      momentumFrameId = null;
    }
  }

  if (Math.abs(vx) > 1.2 || Math.abs(vy) > 1.2) {
    momentumFrameId = requestAnimationFrame(stepMomentum);
  }
}

document.addEventListener('pointerup', finishDragScroll, true);
document.addEventListener('pointercancel', finishDragScroll, true);

window.addEventListener('click', (e) => {
  if (performance.now() < suppressClickUntil) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
}, true);

document.addEventListener('wheel', (e) => {
  const target = e.target instanceof Element ? e.target : null;
  if (!target) return;
  const chain = findScrollChain(target);
  if (chain.horizontal && (Math.abs(e.deltaX) > Math.abs(e.deltaY) || !chain.vertical.length || target.closest('#wxHourly'))) {
    e.preventDefault();
    chain.horizontal.scrollLeft += (e.deltaX || e.deltaY);
    return;
  }
  if (chain.vertical.length) {
    e.preventDefault();
    applyVerticalDelta(chain.vertical, e.deltaY);
  }
}, { passive: false, capture: true });

function resolveActiveScrollContainer(panel) {
  if (!panel) return null;
  if (panel.id === 'desktopLauncherDrawer') return resultsListEl;
  if (panel.id === 'notesPopover') {
    const notesView = document.getElementById('notesTabView');
    const inner = notesView && !notesView.classList.contains('hidden')
      ? document.getElementById('stickyNotesGrid')
      : document.getElementById('tasksListContainer');
    if (inner && isElementVerticallyScrollable(inner)) return inner;
  }
  if (panel.id === 'calendarPopover') {
    const evList = document.getElementById('calendarEventList');
    if (evList && isElementVerticallyScrollable(evList) && !isElementVerticallyScrollable(panel)) return evList;
  }
  if (panel.id === 'newsPopover') {
    const srcPanel = document.getElementById('newsSettingsPanel');
    const srcList = document.getElementById('newsSourceManagerList');
    if (srcPanel && !srcPanel.hidden && srcList && isElementVerticallyScrollable(srcList) && !isElementVerticallyScrollable(panel)) {
      return srcList;
    }
  }
  return panel;
}

function attachScrollAssistBar(panel) {
  if (!panel || panel.querySelector('.we-scroll-assist')) return;
  const bar = document.createElement('div');
  bar.className = 'we-scroll-assist';

  const hint = document.createElement('span');
  hint.className = 'we-scroll-assist-hint';
  hint.textContent = L('Tekerlek / Sürükle', 'Wheel / Drag');

  const upBtn = document.createElement('button');
  upBtn.type = 'button';
  upBtn.className = 'we-scroll-btn';
  upBtn.title = 'Yukarı Kaydır (Basılı Tut)';
  upBtn.setAttribute('aria-label', 'Yukarı kaydır');
  upBtn.textContent = '▲';

  const downBtn = document.createElement('button');
  downBtn.type = 'button';
  downBtn.className = 'we-scroll-btn';
  downBtn.title = 'Aşağı Kaydır (Basılı Tut)';
  downBtn.setAttribute('aria-label', 'Aşağı kaydır');
  downBtn.textContent = '▼';

  let holdRaf = null;
  function startHold(dir) {
    stopHold();
    const target = resolveActiveScrollContainer(panel);
    if (!target) return;
    target.scrollTop += dir * 36;
    function tick() {
      const currentTarget = resolveActiveScrollContainer(panel);
      if (currentTarget) currentTarget.scrollTop += dir * 9;
      holdRaf = requestAnimationFrame(tick);
    }
    holdRaf = requestAnimationFrame(tick);
  }
  function stopHold() {
    if (holdRaf !== null) {
      cancelAnimationFrame(holdRaf);
      holdRaf = null;
    }
  }

  upBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); startHold(-1); });
  downBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); startHold(1); });
  window.addEventListener('pointerup', stopHold);
  window.addEventListener('pointercancel', stopHold);

  bar.append(hint, upBtn, downBtn);
  if (panel.id === 'desktopLauncherDrawer') {
    panel.insertBefore(bar, webFallbackBar);
  } else {
    panel.appendChild(bar);
  }
}

[
  launcherDrawer,
  document.getElementById('newsPopover'),
  document.getElementById('weatherPopover'),
  document.getElementById('focusPopover'),
  document.getElementById('calendarPopover'),
  document.getElementById('notesPopover'),
  document.getElementById('dataManagerPopover'),
  weSettingsPopover,
].forEach(attachScrollAssistBar);

// ============================================================================
// 10. DIORAMA NEWS READER — HARMONIZED 2-COLUMN CARDS & 60 FPS FLIP ACCORDION
//     Matches the quiet frosted glass aesthetic of Weather, Xiaomi, Focus, and
//     Calendar while keeping CSS Grid 0fr->1fr accordion drawers and smooth
//     60 FPS FLIP sibling push animations when a card expands or collapses.
// ============================================================================
const NEWS_CHEVRON_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>';
const NEWS_COPY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const NEWS_CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

function parseEditorialHeadline(rawTitle = '', index = 0) {
  let cleanTitle = String(rawTitle || '').trim();
  const breakingRe = /^(?:son\s+dak[iİ]ka(?:\s+haber[iİ])?|flaş(?:\s+haber)?|breaking(?:\s+news)?|live\s+updates?)\s*[:\-–—|]\s*/i;
  let isBreaking = false;
  if (breakingRe.test(cleanTitle)) {
    isBreaking = true;
    cleanTitle = cleanTitle.replace(breakingRe, '').trim() || cleanTitle;
  } else if (/\bson\s+dak[iİ]ka\b|\bbreaking\s+news\b/i.test(cleanTitle)) {
    isBreaking = true;
  }
  const isLead = !isBreaking && index === 0 && !searchQuery && activeFilter === 'all';
  return {
    cleanTitle,
    badgeType: isBreaking ? 'breaking' : isLead ? 'lead' : null,
    badgeText: isBreaking ? L('Son Dakika', 'Breaking') : isLead ? L('Manşet', 'Top Story') : '',
  };
}

function syncEditorialCardState(card, isExpanded, isRead) {
  if (!card) return;
  card.classList.toggle('is-expanded', isExpanded);
  card.classList.toggle('is-read', isRead);
  const bodyBtn = card.querySelector('.we-news-body-btn');
  if (bodyBtn) {
    bodyBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
  }
  const statusPill = card.querySelector('.we-news-status-pill');
  if (statusPill) {
    statusPill.textContent = isRead ? L('Okundu', 'Read') : L('Yeni', 'New');
  }
  const expandLabel = card.querySelector('.we-news-expand-label');
  if (expandLabel) {
    expandLabel.textContent = isExpanded ? L('Özeti gizle', 'Hide summary') : L('Özeti gör', 'Read summary');
  }
  const drawer = card.querySelector('.we-news-drawer');
  if (drawer) {
    drawer.inert = !isExpanded;
    drawer.setAttribute('aria-hidden', isExpanded ? 'false' : 'true');
  }
}

function toggleNewsCardWithFlip(clickedCard, itemId) {
  if (!newsListContainer || !clickedCard) return;
  const allCards = Array.from(newsListContainer.querySelectorAll('.news-card.we-editorial-card'));

  // 1. FIRST: Capture exact current visual bounding boxes of all cards
  const firstRects = new Map();
  allCards.forEach((c) => {
    firstRects.set(c, c.getBoundingClientRect());
  });

  // Clear any in-flight inline FLIP transforms before mutating grid layout
  allCards.forEach((c) => {
    c.style.transition = 'none';
    c.style.transform = '';
  });

  // 2. MUTATE LAYOUT STATE IN-PLACE (No replaceChildren!)
  const willExpand = !expandedNewsIds.has(itemId);

  if (willExpand) {
    // Collapse any other expanded card so the 2-column grid flows cleanly
    allCards.forEach((c) => {
      const otherId = c.dataset.itemId;
      if (otherId && otherId !== itemId && expandedNewsIds.has(otherId)) {
        expandedNewsIds.delete(otherId);
        syncEditorialCardState(c, false, readIds.has(otherId));
      }
    });
    expandedNewsIds.add(itemId);
    if (expandedNewsIds.size > 80) {
      expandedNewsIds.delete(expandedNewsIds.values().next().value);
    }
    readIds.delete(itemId);
    readIds.add(itemId);
    persistIdSet(READ_IDS_KEY, readIds);
  } else {
    expandedNewsIds.delete(itemId);
  }

  syncEditorialCardState(clickedCard, willExpand, readIds.has(itemId));

  // 3. LAST & INVERT: Measure new grid positions and animate displaced siblings
  const lastRects = new Map();
  allCards.forEach((c) => {
    lastRects.set(c, c.getBoundingClientRect());
  });

  allCards.forEach((c) => {
    const first = firstRects.get(c);
    const last = lastRects.get(c);
    if (!first || !last) return;

    const dx = first.left - last.left;
    const dy = first.top - last.top;

    if (c === clickedCard) {
      const startScale = willExpand ? 0.985 : 1.008;
      c.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${startScale})`;
    } else if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      c.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
    }
  });

  // Force layout flush so initial inverted transforms are committed
  void newsListContainer.offsetHeight;

  // 4. PLAY: Release all cards smoothly to their new grid coordinates at 60 FPS
  const flipEasing = 'cubic-bezier(0.22, 1, 0.36, 1)';
  allCards.forEach((c) => {
    if (!c.style.transform) return;
    c.style.transition = `transform 0.42s ${flipEasing}, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease`;
    c.style.transform = 'translate3d(0, 0, 0) scale(1)';
    const clearFlip = (ev) => {
      if (ev.propertyName !== 'transform') return;
      c.style.transition = '';
      c.style.transform = '';
      c.removeEventListener('transitionend', clearFlip);
    };
    c.addEventListener('transitionend', clearFlip);
  });

  // 5. Gently scroll #newsPopover if the newly expanded drawer extends below view
  if (willExpand) {
    setTimeout(() => {
      const pop = document.getElementById('newsPopover');
      if (!pop || !clickedCard.isConnected) return;
      const popRect = pop.getBoundingClientRect();
      const cardRect = clickedCard.getBoundingClientRect();
      const overflowBottom = cardRect.bottom - (popRect.bottom - 28);
      if (overflowBottom > 16) {
        pop.scrollBy({ top: Math.min(overflowBottom + 24, 260), behavior: 'smooth' });
      }
    }, 190);
  }
}

const enNewsClientCache = new Map();
let enNewsSourceCounts = { ok: 4, total: 4 };

function formatNewsDateLocalized(publishedAt) {
  if (!publishedAt) return '';
  if (!isEn()) return formatNewsDate(publishedAt);
  try {
    const dt = new Date(publishedAt);
    if (!Number.isFinite(dt.getTime())) return '';
    return new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(dt);
  } catch {
    return '';
  }
}

window.__weLoadEnglishNewsCategory = async function loadEnglishNewsCategory(categoryId, { force = false } = {}) {
  const cat = ['gundem', 'teknoloji', 'bilim'].includes(categoryId) ? categoryId : 'gundem';
  activeNewsCat = cat;
  document.querySelectorAll('.news-cat-btn').forEach((btn) => {
    btn.setAttribute('aria-pressed', btn.dataset.cat === cat ? 'true' : 'false');
  });

  const cached = enNewsClientCache.get(cat);
  if (!force && cached && (Date.now() - cached.savedAt) < 5 * 60 * 1000 && cached.items.length) {
    currentNewsItems = cached.items;
    enNewsSourceCounts = { ok: cached.okCount, total: cached.totalCount };
    if (newsSourceSub) newsSourceSub.textContent = cached.summary;
    window.__weCustomRenderNewsCards();
    return;
  }

  if (newsSourceSub) newsSourceSub.textContent = 'Loading global news feeds…';
  if (newsListMeta) newsListMeta.textContent = 'Fetching latest headlines…';

  try {
    const res = await fetch(`${BRIDGE_BASE_URL}/api/desktop/news-en?cat=${encodeURIComponent(cat)}${force ? '&refresh=1' : ''}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Bridge HTTP error');
    const data = await res.json();
    if (window.__weLang !== 'en' || activeNewsCat !== cat) return;
    const rawItems = Array.isArray(data.items) ? data.items : [];
    const mapped = rawItems.map((it) => ({
      ...it,
      itemId: createArticleId(it),
      time: formatNewsDateLocalized(it.publishedAt),
    }));
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const okCount = Number(data.okCount) || 0;
    const totalCount = Number(data.totalCount) || 4;
    const summary = okCount > 0
      ? `${okCount} sources · live · ${nowTime}`
      : 'Waiting for global feeds';
    enNewsSourceCounts = { ok: okCount, total: totalCount };
    currentNewsItems = mapped;
    enNewsClientCache.set(cat, { savedAt: Date.now(), items: mapped, okCount, totalCount, summary });
    if (newsSourceSub) newsSourceSub.textContent = summary;
    window.__weCustomRenderNewsCards(mapped.length ? '' : 'No stories available right now. Click refresh to try again.');
  } catch {
    if (window.__weLang !== 'en') return;
    currentNewsItems = [];
    if (newsSourceSub) newsSourceSub.textContent = 'Desktop bridge offline';
    window.__weCustomRenderNewsCards('Start the local desktop bridge (start-desktop-bridge.bat) to load live English global news.');
  }
};

window.__weCustomRenderNewsCards = function renderPixelEditorialNewsCards(emptyMessage = '') {
  if (!newsListContainer) return;
  newsListContainer.replaceChildren();

  const filtered = filterNewsArticles(currentNewsItems, {
    query: searchQuery,
    filter: activeFilter,
    readIds,
    savedIds,
  });

  const enabledCount = isEn() ? enNewsSourceCounts.ok : getEnabledSources(activeNewsCat).length;
  const totalCount = isEn() ? enNewsSourceCounts.total : getAllSources(activeNewsCat).length;
  if (newsListMeta) {
    newsListMeta.textContent = isEn()
      ? `${filtered.length} stories · ${enabledCount}/${totalCount} sources live`
      : `${filtered.length} haber · ${enabledCount}/${totalCount} kaynak kullanılabilir`;
  }
  updateFilterButtons();

  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'news-empty-state';
    empty.textContent = emptyMessage || (searchQuery
      ? L('Aramanla eşleşen haber bulunamadı.', 'No stories match your search.')
      : activeFilter === 'saved'
        ? L('Henüz kaydettiğin haber yok. Kart üzerindeki yer imi simgesini kullanabilirsin.', 'No saved stories yet. Click the bookmark icon on any card.')
        : activeFilter === 'unread'
          ? L('Okunmamış haber kalmadı. Yeni haberler için akışı yenileyebilirsin.', 'All caught up! Refresh to check for new stories.')
          : L('Bu kategoride şu anda gösterilebilecek haber yok.', 'No stories available in this category right now.'));
    newsListContainer.appendChild(empty);
    updateHeadlineTicker();
    if (isEn() && !currentNewsItems.length && headlineTickerLink) {
      headlineTickerLink.textContent = 'Waiting for global headlines…';
    }
    return;
  }

  const fragment = document.createDocumentFragment();
  filtered.forEach((item, index) => {
    const itemId = item.itemId || createArticleId(item);
    const isRead = readIds.has(itemId);
    const isSaved = savedIds.has(itemId);
    const isExpanded = expandedNewsIds.has(itemId);
    const source = getAllSources(activeNewsCat).find((entry) => entry.id === item.sourceId);
    const sourceUrl = safeExternalUrl(item.link, source?.homepage);
    const publisherName = item.source || source?.publisher || L('Haber Kaynağı', 'News Source');
    const { cleanTitle, badgeType, badgeText } = parseEditorialHeadline(item.title, index);

    const card = document.createElement('article');
    card.className = `news-card we-editorial-card${isRead ? ' is-read' : ''}${isExpanded ? ' is-expanded' : ''}`;
    card.dataset.itemId = itemId;

    // Top Header Bar: Publisher + Subtle Badge + Timestamp + Read Status + Bookmark
    const topBar = document.createElement('div');
    topBar.className = 'we-news-card-top';

    const pubGroup = document.createElement('div');
    pubGroup.className = 'we-news-pub-group';

    const pubTag = document.createElement('span');
    pubTag.className = 'we-news-pub-tag';
    const pubLabel = document.createElement('span');
    pubLabel.className = 'truncate';
    pubLabel.textContent = publisherName;
    pubTag.appendChild(pubLabel);
    pubGroup.appendChild(pubTag);

    if (badgeType) {
      const badge = document.createElement('span');
      badge.className = badgeType === 'breaking' ? 'we-news-breaking-badge' : 'we-news-lead-badge';
      badge.textContent = badgeText;
      pubGroup.appendChild(badge);
    }

    const metaRight = document.createElement('div');
    metaRight.className = 'we-news-meta-right';

    const dateEl = document.createElement('time');
    dateEl.className = 'we-news-time';
    dateEl.textContent = item.publishedAt ? formatNewsDateLocalized(item.publishedAt) : (item.time || '');
    if (item.publishedAt) dateEl.dateTime = item.publishedAt;

    const statusPill = document.createElement('span');
    statusPill.className = 'we-news-status-pill';
    statusPill.textContent = isRead ? L('Okundu', 'Read') : L('Yeni', 'New');

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = `we-news-bookmark-btn news-save-btn${isSaved ? ' is-saved' : ''}`;
    saveBtn.setAttribute('aria-label', isSaved ? L('Haberi kayıtlardan çıkar', 'Remove bookmark') : L('Haberi kaydet', 'Bookmark story'));
    saveBtn.setAttribute('aria-pressed', isSaved ? 'true' : 'false');
    saveBtn.title = isSaved ? L('Kaydedilenlerden çıkar', 'Remove from saved') : L('Haberi kaydet', 'Save story');
    saveBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.8L6 21V4.75Z"/></svg>';
    saveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const nowSaved = !savedIds.has(itemId);
      if (nowSaved) {
        savedIds.delete(itemId);
        savedIds.add(itemId);
      } else {
        savedIds.delete(itemId);
      }
      persistIdSet(SAVED_IDS_KEY, savedIds);
      if (activeFilter === 'saved') {
        renderPixelEditorialNewsCards();
        return;
      }
      saveBtn.classList.toggle('is-saved', nowSaved);
      saveBtn.setAttribute('aria-pressed', nowSaved ? 'true' : 'false');
      saveBtn.setAttribute('aria-label', nowSaved ? L('Haberi kayıtlardan çıkar', 'Remove bookmark') : L('Haberi kaydet', 'Bookmark story'));
      saveBtn.title = nowSaved ? L('Kaydedilenlerden çıkar', 'Remove from saved') : L('Haberi kaydet', 'Save story');
      showDesktopToast(nowSaved ? L('Haber kaydedilenlere eklendi.', 'Story saved.') : L('Haber kaydedilenlerden çıkarıldı.', 'Removed from saved.'), 2200);
    });

    metaRight.append(dateEl, statusPill, saveBtn);
    topBar.append(pubGroup, metaRight);

    // Main Clickable Body: Headline + Quiet Expand Hint
    const bodyBtn = document.createElement('button');
    bodyBtn.type = 'button';
    bodyBtn.className = 'we-news-body-btn news-card-expand';
    bodyBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    bodyBtn.setAttribute('aria-label', isExpanded ? L('Haber detayını daralt', 'Collapse summary') : `${L('Haber detayını göster', 'Show summary')}: ${cleanTitle}`);

    const headline = document.createElement('h4');
    headline.className = 'we-news-headline news-card-title';
    headline.textContent = cleanTitle;

    const footerBar = document.createElement('div');
    footerBar.className = 'we-news-footer-bar';

    const expandPill = document.createElement('span');
    expandPill.className = 'we-news-expand-pill';
    const chevron = document.createElement('span');
    chevron.className = 'we-news-chevron';
    chevron.innerHTML = NEWS_CHEVRON_SVG;
    const expandLabel = document.createElement('span');
    expandLabel.className = 'we-news-expand-label';
    expandLabel.textContent = isExpanded ? L('Özeti gizle', 'Hide summary') : L('Özeti gör', 'Read summary');
    expandPill.append(chevron, expandLabel);

    footerBar.appendChild(expandPill);
    bodyBtn.append(headline, footerBar);

    // Smooth CSS Grid Accordion Drawer (Permanently Mounted for 0fr -> 1fr Animation)
    const drawer = document.createElement('div');
    drawer.className = 'we-news-drawer';
    drawer.inert = !isExpanded;
    drawer.setAttribute('aria-hidden', isExpanded ? 'false' : 'true');

    const drawerInner = document.createElement('div');
    drawerInner.className = 'we-news-drawer-inner';

    const readingWell = document.createElement('div');
    readingWell.className = 'we-news-reading-well';

    const summaryText = document.createElement('p');
    summaryText.className = 'we-news-summary-text';
    const rawDesc = String(item.description || '').trim();
    summaryText.textContent = rawDesc && rawDesc !== cleanTitle
      ? rawDesc
      : L(
        `${publisherName} kaynağından gelen bu haberin tüm detaylarını okumak için aşağıdaki bağlantıyı kullanabilirsin.`,
        `Open the full article on ${publisherName} using the link below.`,
      );

    const drawerActions = document.createElement('div');
    drawerActions.className = 'we-news-drawer-actions';

    const openLink = document.createElement('a');
    openLink.className = 'we-news-read-full-btn news-open-source';
    openLink.href = sourceUrl;
    openLink.target = '_blank';
    openLink.rel = 'noopener noreferrer';
    openLink.referrerPolicy = 'no-referrer';
    openLink.textContent = L('Haberi kaynağında aç ↗', 'Open full article ↗');
    openLink.addEventListener('click', () => {
      readIds.delete(itemId);
      readIds.add(itemId);
      persistIdSet(READ_IDS_KEY, readIds);
      syncEditorialCardState(card, true, true);
    });

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'we-news-copy-btn';
    copyBtn.innerHTML = `${NEWS_COPY_SVG}<span>${L('Linki kopyala', 'Copy link')}</span>`;
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(sourceUrl).catch(() => {});
      }
      copyBtn.innerHTML = `${NEWS_CHECK_SVG}<span>${L('Kopyalandı', 'Copied')}</span>`;
      showDesktopToast(L('Haber bağlantısı panoya kopyalandı.', 'Article link copied to clipboard.'), 2200);
      setTimeout(() => {
        copyBtn.innerHTML = `${NEWS_COPY_SVG}<span>${L('Linki kopyala', 'Copy link')}</span>`;
      }, 1800);
    });

    drawerActions.append(openLink, copyBtn);
    readingWell.append(summaryText, drawerActions);
    drawerInner.appendChild(readingWell);
    drawer.appendChild(drawerInner);

    bodyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleNewsCardWithFlip(card, itemId);
    });

    card.append(topBar, bodyBtn, drawer);
    fragment.appendChild(card);
  });

  newsListContainer.appendChild(fragment);
  updateHeadlineTicker();
};

// Upgrade any initially cached news cards to the new Pixel-Art Editorial Gazette layout
if (typeof window.__weCustomRenderNewsCards === 'function') {
  window.__weCustomRenderNewsCards();
}

// ============================================================================
// 11. XIAOMI SMART AIR PURIFIER 4 — EDITORIAL PIXEL-ART ROOM CLIMATE WIDGET
//     Styled directly after #weatherPopover (crispEdges pixel SVG, .wx-air-card,
//     .wx-stats, .wx-uv-card, .focus-duration-grid) and persisted both in
//     localStorage AND %USERPROFILE%\.diorama-local-state.json across updates!
// ============================================================================
const XIAOMI_CONFIG_KEY = 'diorama_xiaomi_air4_config_v1';
const XIAOMI_TELEMETRY_CACHE_KEY = 'diorama_xiaomi_air4_telemetry_v1';

let xiaomiConfig = {
  ip: '',
  token: '',
  ...(lsGet(XIAOMI_CONFIG_KEY, {}) || {}),
};

let xiaomiTelemetry = {
  connected: false,
  source: 'demo',
  model: '',
  power: true,
  mode: 0, // 0: Otomatik, 1: Gece, 2: Manuel
  pm25: 9,
  pm10: null,
  temperature: 23.4,
  humidity: 47,
  motorSpeed: null,
  filterLife: 88,
  filterLeftDays: 146,
  filterHoursUsed: null,
  updatedAt: new Date().toISOString(),
  ...(lsGet(XIAOMI_TELEMETRY_CACHE_KEY, {}) || {}),
};

function pxPurifierIcon(tone = 'good', powered = true, size = 20) {
  const accentMap = {
    good: '#34d399',
    fair: '#a3e635',
    moderate: '#facc15',
    poor: '#fb923c',
    'very-poor': '#f43f5e',
    off: '#64748b',
  };
  const pal = {
    L: '#f8fafc', // crisp highlight edge
    W: '#e2e8f0', // matte purifier shell
    D: '#cbd5e1', // shaded shell side
    G: '#94a3b8', // top fan bezel
    K: '#0f172a', // OLED circular dial
    V: '#475569', // intake grille slots
    A: powered ? (accentMap[tone] || '#34d399') : '#334155',
    I: powered ? '#f0fdf4' : '#475569',
    M: powered ? 'rgba(186,230,253,0.75)' : '.',
  };

  const rows = [
    '................',
    '.....M....M.....',
    '....GGGGGGGG....',
    '...GVVVVVVVVG...',
    '...LWWWWWWWWD...',
    '...LWWKKKKWWD...',
    '...LWKAAAAKWD...',
    '...LWKAIIAKWD...',
    '...LWKAAAAKWD...',
    '...LWWWWWWWWD...',
    '...LWVVVVVVWD...',
    '...LWVVVVVVWD...',
    '...LWVVVVVVWD...',
    '...LWVVVVVVWD...',
    '...LDDDDDDDDD...',
    '....GGGGGGGG....',
  ];

  let rects = '';
  rows.forEach((row, y) => {
    let x = 0;
    while (x < 16) {
      const ch = row[x];
      if (!ch || ch === '.' || !pal[ch] || pal[ch] === '.') {
        x++;
        continue;
      }
      let end = x;
      while (end < 16 && row[end] === ch) end++;
      rects += `<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${pal[ch]}"/>`;
      x = end;
    }
  });

  return `<svg class="we-air-pixel-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${size}" height="${size}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

function getAirQualityProfile(pm25, powered = true) {
  if (!powered) {
    return {
      label: L('Beklemede', 'Standby'),
      tone: 'off',
      note: L('Cihaz şu anda kapalı · Sensörler beklemede', 'Device is off · Sensors on standby'),
    };
  }
  const val = Number(pm25);
  if (!Number.isFinite(val)) {
    return {
      label: L('Veri bekleniyor', 'Waiting'),
      tone: 'fair',
      note: L('Partikül ölçümü bekleniyor', 'Waiting for PM2.5 reading'),
    };
  }
  if (val <= 15) {
    return {
      label: L('Mükemmel', 'Excellent'),
      tone: 'good',
      note: L('Oda havası temiz ve taze', 'Indoor air is clean and fresh'),
    };
  }
  if (val <= 35) {
    return {
      label: L('İyi', 'Good'),
      tone: 'fair',
      note: L('Hava koşulları elverişli ve dengeli', 'Air quality is comfortable and balanced'),
    };
  }
  if (val <= 75) {
    return {
      label: L('Orta', 'Moderate'),
      tone: 'moderate',
      note: L('Partikül yoğunluğu yükseldi · Otomatik önerilir', 'Elevated particles · Auto mode recommended'),
    };
  }
  return {
    label: L('Kötü', 'Poor'),
    tone: 'very-poor',
    note: L('Yüksek partikül seviyesi · Filtreleme gerekli', 'High particulate level · Filtering needed'),
  };
}

function computeDewPoint(tempC, relHum) {
  if (!Number.isFinite(tempC) || !Number.isFinite(relHum) || relHum <= 0) return null;
  const a = 17.27;
  const b = 237.7;
  const gamma = ((a * tempC) / (b + tempC)) + Math.log(Math.max(1, relHum) / 100);
  return ((b * gamma) / (a - gamma));
}

const airPurifierWrapper = document.createElement('div');
airPurifierWrapper.id = 'airPurifierBtnWrapper';
airPurifierWrapper.className = 'relative';

const airPurifierBtn = document.createElement('button');
airPurifierBtn.id = 'airPurifierBtn';
airPurifierBtn.type = 'button';
airPurifierBtn.title = 'Oda İklimi (Xiaomi Smart Air Purifier 4)';
airPurifierBtn.setAttribute('aria-label', 'Xiaomi Oda İklimi ve Hava Kalitesi');
airPurifierBtn.setAttribute('aria-haspopup', 'true');
airPurifierBtn.setAttribute('aria-controls', 'airPurifierPopover');
airPurifierBtn.setAttribute('aria-expanded', 'false');
airPurifierBtn.className = 'optical-pill rounded-full px-3.5 py-2 flex items-center gap-2 text-xs font-medium text-white/95';
airPurifierBtn.innerHTML = `
  <span id="weAirSvgContainer" class="w-5 h-5 flex items-center justify-center shrink-0"></span>
  <span id="weAirPillTemp" class="font-mono font-medium">--°C</span>
  <span id="weAirPillMeta" class="text-white/75 hidden sm:inline font-pixel">%--</span>
`;

const airPurifierPopover = document.createElement('div');
airPurifierPopover.id = 'airPurifierPopover';
airPurifierPopover.setAttribute('role', 'region');
airPurifierPopover.setAttribute('aria-label', 'Xiaomi Smart Air Purifier 4 Oda İklimi');
airPurifierPopover.setAttribute('aria-hidden', 'true');
airPurifierPopover.inert = true;
airPurifierPopover.className = 'popover-panel editorial-modal rounded-3xl we-air-popover absolute right-0 mt-2.5 z-50';

airPurifierPopover.innerHTML = `
  <!-- HERO HEADER (Matches #weatherPopover exact layout) -->
  <div class="flex items-start justify-between gap-3">
    <div class="flex items-center gap-4 min-w-0">
      <div id="weAirBigIcon" class="shrink-0 w-16 h-16 flex items-center justify-center"></div>
      <div class="min-w-0">
        <div class="flex items-baseline gap-2">
          <span id="weAirBigTemp" class="font-pixel text-4xl text-white leading-none">--°</span>
          <span id="weAirCondition" class="text-sm text-white/85 truncate">Oda İklimi</span>
        </div>
        <p id="weAirDetailText" class="text-xs text-white/60 mt-1.5 truncate">Sensör verisi bekleniyor…</p>
        <p id="weAirUpdatedText" class="text-[10px] text-white/45 mt-1" aria-live="polite">Xiaomi Air Purifier 4</p>
      </div>
    </div>
    <div class="flex items-center gap-1.5 shrink-0">
      <button id="weAirConfigToggleBtn" type="button" title="Wi-Fi / Token Bağlantı Ayarları" aria-label="Xiaomi bağlantı ayarları" class="we-air-icon-btn">
        ${DESKTOP_ICONS.settings}
      </button>
      <button id="weAirRefreshBtn" type="button" title="Sensör Verilerini Yenile" aria-label="Sensör verilerini yenile" class="we-air-icon-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
      </button>
    </div>
  </div>

  <!-- AIR QUALITY CARD (Uses exact .wx-air-card grammar from css/widgets.css) -->
  <div id="weAirQualityBox" class="mt-4"></div>

  <!-- SENSOR STATS GRID (Uses exact .wx-stats / .wx-stat-card grammar) -->
  <div id="weAirStatsGrid" class="wx-stats mt-3"></div>

  <!-- FILTER LIFE & DEVICE STATUS GRID (Uses exact .wx-celestial-grid / .wx-uv-card / .wx-moon-card) -->
  <div id="weAirFilterAndMeta" class="wx-celestial-grid"></div>

  <!-- DEVICE CONTROL STRIP (Uses exact .focus-duration-grid / .focus-preset-btn grammar) -->
  <div class="mt-4">
    <p class="wx-section-label mb-2">CİHAZ KONTROLÜ</p>
    <div class="focus-duration-grid" role="group" aria-label="Hava temizleyici kontrolü">
      <button type="button" data-air-cmd="power" aria-pressed="false" class="focus-preset-btn font-pixel">Açık</button>
      <button type="button" data-air-mode="0" aria-pressed="false" class="focus-preset-btn font-pixel">Otomatik</button>
      <button type="button" data-air-mode="1" aria-pressed="false" class="focus-preset-btn font-pixel">Gece</button>
      <button type="button" data-air-mode="2" aria-pressed="false" class="focus-preset-btn font-pixel">Manuel</button>
    </div>
  </div>

  <!-- COLLAPSIBLE XIAOMI LAN MiIO / TOKEN CONFIGURATION PANEL -->
  <div id="weAirConfigPanel" class="we-air-config-box" hidden>
    <div class="flex items-center justify-between gap-2 mb-2">
      <span class="text-xs font-medium text-white/90 font-pixel">Yerel Wi-Fi Bağlantısı (UDP 54321)</span>
      <button id="weAirDiscoverBtn" type="button" class="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] text-sky-200 font-pixel transition">Ağda Bul</button>
    </div>
    <p id="weAirDiscoverStatus" class="text-[11px] text-white/55 mb-2.5 leading-snug">
      Ayarların proje dosyalarına değil, bilgisayarındaki yerel kullanıcı verilerine (~/.diorama-local-state.json) kaydedilir.
    </p>
    <div class="space-y-2">
      <label class="block text-[11px] text-white/70 font-pixel">
        Cihaz IP Adresi
        <input id="weAirIpInput" type="text" maxlength="45" placeholder="192.168.1.45" class="we-air-input">
      </label>
      <label class="block text-[11px] text-white/70 font-pixel">
        32 Haneli MiIO Token (Hex)
        <input id="weAirTokenInput" type="text" maxlength="64" placeholder="32 karakterlik hex token" class="we-air-input">
      </label>
      <div class="flex items-center justify-between gap-2 pt-1.5">
        <div class="flex items-center gap-3">
          <a href="https://github.com/PiotrMachowski/Xiaomi-cloud-tokens-extractor" target="_blank" rel="noopener noreferrer" class="text-[10px] text-sky-300 underline underline-offset-2 hover:text-sky-200">Token rehberi ↗</a>
          <button id="weAirForgetBtn" type="button" class="text-[10px] text-white/45 hover:text-rose-300 transition">Bağlantıyı unut</button>
        </div>
        <button id="weAirSaveConfigBtn" type="button" class="px-3 py-1.5 rounded-xl bg-sky-400/20 hover:bg-sky-400/30 border border-sky-300/35 text-xs text-white font-pixel transition">Kaydet ve Bağlan</button>
      </div>
    </div>
  </div>
`;

airPurifierWrapper.append(airPurifierBtn, airPurifierPopover);
const weatherWrapperEl = document.getElementById('weatherBtnWrapper');
if (weatherWrapperEl && weatherWrapperEl.parentElement) {
  weatherWrapperEl.insertAdjacentElement('afterend', airPurifierWrapper);
} else if (headerRight) {
  headerRight.prepend(airPurifierWrapper);
}

const airPurifierEntry = { btn: airPurifierBtn, panel: airPurifierPopover };
popovers.push(airPurifierEntry);
attachScrollAssistBar(airPurifierPopover);

airPurifierBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  closeDesktopDrawer();
  const shouldOpen = !airPurifierPopover.classList.contains('open');
  popovers.forEach((p) => setPopoverOpen(p, false));
  if (shouldOpen) {
    renderXiaomiAirWidget();
    setPopoverOpen(airPurifierEntry, true);
    refreshXiaomiAirTelemetry(true);
  }
});
airPurifierPopover.addEventListener('click', (e) => e.stopPropagation());

function renderXiaomiAirWidget() {
  const isRealConnected = Boolean(xiaomiTelemetry.connected && xiaomiConfig.ip);
  const hasSavedConfig = Boolean(xiaomiConfig.ip && /^[0-9a-f]{32}$/i.test(xiaomiConfig.token || ''));
  const powered = xiaomiTelemetry.power !== false;

  const tempNum = Number.isFinite(Number(xiaomiTelemetry.temperature)) ? Number(xiaomiTelemetry.temperature) : null;
  const humNum = Number.isFinite(Number(xiaomiTelemetry.humidity)) ? Math.round(Number(xiaomiTelemetry.humidity)) : null;
  const pm25Num = Number.isFinite(Number(xiaomiTelemetry.pm25)) ? Math.round(Number(xiaomiTelemetry.pm25)) : null;
  const profile = getAirQualityProfile(pm25Num, powered);

  const svgSlot = document.getElementById('weAirSvgContainer');
  const bigSvgSlot = document.getElementById('weAirBigIcon');
  if (svgSlot) svgSlot.innerHTML = pxPurifierIcon(profile.tone, powered, 20);
  if (bigSvgSlot) bigSvgSlot.innerHTML = pxPurifierIcon(profile.tone, powered, 64);

  const tempPillStr = tempNum !== null ? `${tempNum.toFixed(1)}°C` : '--°C';
  const tempBigStr = tempNum !== null ? `${tempNum.toFixed(1)}°` : '--°';
  const humStr = humNum !== null ? (isEn() ? `${humNum}%` : `%${humNum}`) : '--';
  const pmStr = pm25Num !== null ? `${pm25Num} µg` : '--';

  const pillTemp = document.getElementById('weAirPillTemp');
  const pillMeta = document.getElementById('weAirPillMeta');
  if (pillTemp) pillTemp.textContent = tempPillStr;
  if (pillMeta) pillMeta.textContent = humNum !== null ? `${humStr} · ${pmStr}` : L('Oda', 'Room');

  const bigTemp = document.getElementById('weAirBigTemp');
  const condEl = document.getElementById('weAirCondition');
  const detailEl = document.getElementById('weAirDetailText');
  const updatedEl = document.getElementById('weAirUpdatedText');

  const modeNames = isEn()
    ? { 0: 'Auto mode', 1: 'Sleep mode', 2: 'Manual mode', 3: 'Fixed speed' }
    : { 0: 'Otomatik mod', 1: 'Gece modu', 2: 'Manuel mod', 3: 'Sabit kademe' };
  const modeLabel = modeNames[xiaomiTelemetry.mode] || modeNames[0];

  if (bigTemp) bigTemp.textContent = tempBigStr;
  if (condEl) {
    if (!powered) condEl.textContent = L('Beklemede', 'Standby');
    else if (humNum !== null && humNum < 35) condEl.textContent = L('Kuru Oda Havası', 'Dry Indoor Air');
    else if (humNum !== null && humNum > 62) condEl.textContent = L('Nemli Oda Havası', 'Humid Indoor Air');
    else condEl.textContent = L('Konforlu Oda İklimi', 'Comfortable Air');
  }
  if (detailEl) {
    detailEl.textContent = `${L('Bağıl nem', 'Humidity')} ${humStr} • ${modeLabel}${xiaomiTelemetry.motorSpeed ? ` • ${xiaomiTelemetry.motorSpeed} RPM` : ''}`;
  }
  if (updatedEl) {
    let timePart = '';
    if (xiaomiTelemetry.updatedAt) {
      try {
        timePart = new Date(xiaomiTelemetry.updatedAt).toLocaleTimeString(isEn() ? 'en-US' : 'tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false });
      } catch {}
    }
    if (isRealConnected) {
      updatedEl.textContent = `${L('Bağlı', 'Connected')} · ${xiaomiConfig.ip}${timePart ? ` · ${timePart}` : ''}`;
      updatedEl.className = 'text-[10px] text-emerald-200/80 mt-1';
    } else if (hasSavedConfig) {
      updatedEl.textContent = isEn()
        ? `Connecting (${xiaomiConfig.ip}) · last cached data`
        : `Cihaza bağlanılıyor (${xiaomiConfig.ip}) · son kayıtlı veri`;
      updatedEl.className = 'text-[10px] text-amber-200/85 mt-1';
    } else {
      updatedEl.textContent = L(
        'Önizleme verisi · Dişli simgesinden Xiaomi Air Purifier 4 bağla',
        'Preview data · Click gear to link Xiaomi Air Purifier 4',
      );
      updatedEl.className = 'text-[10px] text-white/45 mt-1';
    }
  }

  // 1. Air Quality Card (Exact .wx-air-card structure)
  const aqBox = document.getElementById('weAirQualityBox');
  if (aqBox) {
    const toneClass = powered ? `is-${profile.tone}` : 'wx-air-unavailable';
    const secondMetricLabel = Number.isFinite(xiaomiTelemetry.pm10)
      ? `PM10 <strong>${xiaomiTelemetry.pm10} <small>µg/m³</small></strong>`
      : Number.isFinite(xiaomiTelemetry.motorSpeed)
        ? `${L('Motor', 'Fan')} <strong>${xiaomiTelemetry.motorSpeed} <small>RPM</small></strong>`
        : `${L('Durum', 'Status')} <strong>${powered ? L('Çalışıyor', 'Running') : L('Beklemede', 'Standby')}</strong>`;

    aqBox.innerHTML = `
      <section class="wx-air-card ${toneClass}">
        <div class="wx-air-main">
          <div class="wx-air-symbol" aria-hidden="true">✺</div>
          <div class="wx-air-copy">
            <span>${L('ODA HAVA KALİTESİ · PM2.5', 'INDOOR AIR QUALITY · PM2.5')}</span>
            <strong>${esc(profile.label)}</strong>
            <small>${esc(profile.note)}</small>
          </div>
          <div class="wx-air-score"><strong>${pm25Num !== null ? pm25Num : '--'}</strong><small>µg/m³</small></div>
        </div>
        <div class="wx-air-pollutants">
          <span>${L('Çalışma modu', 'Mode')} <strong>${esc(modeLabel)}</strong></span>
          <span>${secondMetricLabel}</span>
        </div>
        <p class="wx-air-disclaimer">${isRealConnected ? L('Xiaomi Air Purifier 4 · Canlı yerel sensör', 'Xiaomi Air Purifier 4 · Live local sensor') : L('Cihaz henüz eşleşmedi · örnek oda verisi gösteriliyor', 'Not paired yet · showing sample indoor telemetry')}</p>
      </section>
    `;
  }

  // 2. 4-Column Stat Grid (Exact .wx-stats / .wx-stat-card structure)
  const statsGrid = document.getElementById('weAirStatsGrid');
  if (statsGrid) {
    const dewPt = computeDewPoint(tempNum, humNum);
    const dewStr = dewPt !== null ? `${dewPt.toFixed(1)}°` : '--';
    const outdoorHum = Number(WX?.data?.current?.relative_humidity_2m);
    const outdoorTemp = Number(WX?.data?.current?.temperature_2m);
    const compareLabel = Number.isFinite(outdoorHum) ? L('Dış hava', 'Outside') : L('Hava', 'Air');
    const compareValue = Number.isFinite(outdoorTemp) && Number.isFinite(outdoorHum)
      ? `${Math.round(outdoorTemp)}° · ${isEn() ? `${Math.round(outdoorHum)}%` : `%${Math.round(outdoorHum)}`}`
      : profile.label;

    const statCard = (label, value, icon) => `
      <div class="wx-stat-card">
        <span class="wx-stat-icon" aria-hidden="true">${icon}</span>
        <span class="wx-stat-label">${label}</span>
        <strong class="wx-stat-value">${esc(value)}</strong>
      </div>`;

    statsGrid.innerHTML = [
      statCard(L('Sıcaklık', 'Temp'), tempPillStr, '°'),
      statCard(L('Nem', 'Humidity'), humStr, '◌'),
      statCard(L('Çiğ nok.', 'Dew Pt.'), dewStr, '⌁'),
      statCard(compareLabel, compareValue, '☁'),
    ].join('');
  }

  // 3. 2-Column Filter & Device Meta Cards (Exact .wx-celestial-grid / .wx-uv-card / .wx-moon-card)
  const filterMetaGrid = document.getElementById('weAirFilterAndMeta');
  if (filterMetaGrid) {
    const fPct = Number.isFinite(Number(xiaomiTelemetry.filterLife)) ? Math.max(0, Math.min(100, Math.round(Number(xiaomiTelemetry.filterLife)))) : null;
    const fDays = Number.isFinite(Number(xiaomiTelemetry.filterLeftDays)) ? Math.round(Number(xiaomiTelemetry.filterLeftDays)) : null;
    const fHours = Number.isFinite(Number(xiaomiTelemetry.filterHoursUsed)) ? Math.round(Number(xiaomiTelemetry.filterHoursUsed)) : null;

    const filterQualityText = fPct === null
      ? L('Bilinmiyor', 'Unknown')
      : fPct >= 50
        ? L('Sağlıklı', 'Healthy')
        : fPct >= 20
          ? L('Azalıyor', 'Low')
          : L('Değiştir', 'Replace');
    const filterSubText = fDays !== null
      ? (isEn() ? `~${fDays} days remaining` : `Yaklaşık ${fDays} gün kalan ömür`)
      : fHours !== null
        ? (isEn() ? `${fHours} hours used` : `Toplam ${fHours} saat kullanım`)
        : L('HEPA kombine filtre durumu', 'HEPA combined filter status');

    const powerLabel = powered ? L('Aktif', 'Active') : L('Kapalı', 'Off');
    const powerSub = isRealConnected
      ? L('Air Purifier 4 · Yerel Wi-Fi', 'Air Purifier 4 · Local Wi-Fi')
      : L('Eşleşme için sağ üstteki dişliye bas', 'Click the gear icon to pair');

    filterMetaGrid.innerHTML = `
      <section class="wx-uv-card">
        <div class="wx-mini-heading"><span>${L('HEPA FİLTRE', 'HEPA FILTER')}</span><span>◈</span></div>
        <div class="wx-mini-value"><strong>${fPct !== null ? (isEn() ? `${fPct}%` : `%${fPct}`) : '--'}</strong><span>${esc(filterQualityText)}</span></div>
        <div class="we-air-filter-track ${fPct !== null && fPct < 20 ? 'is-low' : ''}"><span style="width:${fPct ?? 0}%"></span></div>
        <small>${esc(filterSubText)}</small>
      </section>
      <section class="wx-moon-card">
        <div class="wx-mini-heading"><span>${L('CİHAZ DURUMU', 'DEVICE STATUS')}</span><span>${isRealConnected ? 'LAN' : L('YEREL', 'LOCAL')}</span></div>
        <div class="wx-mini-value"><strong>${esc(powerLabel)}</strong></div>
        <small>${esc(powerSub)}</small>
      </section>
    `;
  }

  // 4. Sync Quick Control Strip (.focus-preset-btn states)
  const ctrlHeading = airPurifierPopover.querySelector('.wx-section-label');
  if (ctrlHeading) ctrlHeading.textContent = L('CİHAZ KONTROLÜ', 'DEVICE CONTROLS');
  const powerBtn = airPurifierPopover.querySelector('[data-air-cmd="power"]');
  if (powerBtn) {
    powerBtn.textContent = powered ? L('Açık', 'On') : L('Kapalı', 'Off');
    powerBtn.classList.toggle('is-selected', powered);
    powerBtn.setAttribute('aria-pressed', powered ? 'true' : 'false');
  }
  const modeBtnLabels = isEn() ? { 0: 'Auto', 1: 'Sleep', 2: 'Manual' } : { 0: 'Otomatik', 1: 'Gece', 2: 'Manuel' };
  airPurifierPopover.querySelectorAll('[data-air-mode]').forEach((btn) => {
    const m = Number(btn.getAttribute('data-air-mode'));
    const active = powered && Number(xiaomiTelemetry.mode) === m;
    if (modeBtnLabels[m]) btn.textContent = modeBtnLabels[m];
    btn.classList.toggle('is-selected', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

async function refreshXiaomiAirTelemetry(silent = true) {
  if (xiaomiConfig.ip && /^[0-9a-f]{32}$/i.test(xiaomiConfig.token || '')) {
    try {
      const res = await fetch(`${BRIDGE_BASE_URL}/api/desktop/xiaomi/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: xiaomiConfig.ip, token: xiaomiConfig.token }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'ok' && data.telemetry) {
        xiaomiTelemetry = { ...xiaomiTelemetry, ...data.telemetry, connected: true };
        lsSet(XIAOMI_TELEMETRY_CACHE_KEY, xiaomiTelemetry);
        renderXiaomiAirWidget();
        if (!silent) showDesktopToast('Xiaomi Air Purifier 4 verileri güncellendi.');
        return;
      }
      throw new Error(data.message || 'Cihaz yanıt vermedi');
    } catch (err) {
      xiaomiTelemetry.connected = false;
      renderXiaomiAirWidget();
      if (!silent) showDesktopToast(`Xiaomi bağlantı uyarısı: ${err.message}`, 4000);
      return;
    }
  }

  // Unpaired preview mode: mirror local outdoor humidity trend softly and mark clearly as preview
  const outdoorTemp = Number(WX?.data?.current?.temperature_2m);
  const outdoorHum = Number(WX?.data?.current?.relative_humidity_2m);
  const baseTemp = Number.isFinite(outdoorTemp)
    ? Math.max(20.5, Math.min(26.2, 21.8 + (outdoorTemp - 15) * 0.14))
    : 23.4;
  const baseHum = Number.isFinite(outdoorHum)
    ? Math.max(36, Math.min(62, Math.round(outdoorHum * 0.72 + 10)))
    : 47;
  const jitterT = Math.sin(Date.now() / 180000) * 0.2;
  const jitterPm = Math.round(8 + Math.abs(Math.sin(Date.now() / 240000)) * 5);

  xiaomiTelemetry = {
    ...xiaomiTelemetry,
    connected: false,
    source: 'demo',
    temperature: Number((baseTemp + jitterT).toFixed(1)),
    humidity: baseHum,
    pm25: xiaomiTelemetry.power ? jitterPm : jitterPm + 9,
    updatedAt: new Date().toISOString(),
  };
  renderXiaomiAirWidget();
}

async function sendXiaomiAirControl(action) {
  if (xiaomiConfig.ip && /^[0-9a-f]{32}$/i.test(xiaomiConfig.token || '')) {
    try {
      const res = await fetch(`${BRIDGE_BASE_URL}/api/desktop/xiaomi/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: xiaomiConfig.ip, token: xiaomiConfig.token, action }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'ok' && data.telemetry) {
        xiaomiTelemetry = { ...xiaomiTelemetry, ...data.telemetry, connected: true };
        lsSet(XIAOMI_TELEMETRY_CACHE_KEY, xiaomiTelemetry);
        renderXiaomiAirWidget();
        showDesktopToast('Xiaomi Air Purifier 4 komutu uygulandı.');
        return;
      }
      throw new Error(data.message || 'Komut gönderilemedi');
    } catch (err) {
      showDesktopToast(`Cihaz kontrol hatası: ${err.message}`, 3800);
      return;
    }
  }

  if (typeof action.power === 'boolean') xiaomiTelemetry.power = action.power;
  if (Number.isInteger(action.mode)) {
    xiaomiTelemetry.mode = action.mode;
    xiaomiTelemetry.power = true;
  }
  xiaomiTelemetry.updatedAt = new Date().toISOString();
  lsSet(XIAOMI_TELEMETRY_CACHE_KEY, xiaomiTelemetry);
  renderXiaomiAirWidget();
}

document.getElementById('weAirConfigToggleBtn')?.addEventListener('click', () => {
  const panel = document.getElementById('weAirConfigPanel');
  const toggleBtn = document.getElementById('weAirConfigToggleBtn');
  if (!panel) return;
  panel.hidden = !panel.hidden;
  toggleBtn?.classList.toggle('is-active', !panel.hidden);
  const ipIn = document.getElementById('weAirIpInput');
  const tokIn = document.getElementById('weAirTokenInput');
  if (ipIn) ipIn.value = xiaomiConfig.ip || '';
  if (tokIn) tokIn.value = xiaomiConfig.token || '';
});

document.getElementById('weAirRefreshBtn')?.addEventListener('click', () => {
  refreshXiaomiAirTelemetry(false);
});

document.getElementById('weAirDiscoverBtn')?.addEventListener('click', async () => {
  const statusEl = document.getElementById('weAirDiscoverStatus');
  if (statusEl) statusEl.textContent = 'Yerel Wi-Fi ağında Xiaomi cihazları taranıyor (UDP 54321)…';
  try {
    const res = await fetch(`${BRIDGE_BASE_URL}/api/desktop/xiaomi/discover`);
    const data = await res.json();
    const list = Array.isArray(data.devices) ? data.devices : [];
    if (list.length > 0) {
      const first = list[0];
      const ipIn = document.getElementById('weAirIpInput');
      if (ipIn) ipIn.value = first.ip;
      if (statusEl) {
        statusEl.textContent = `Cihaz bulundu: ${first.ip} (ID: ${first.deviceIdHex}). Token'ı girip Kaydet ve Bağlan'a bas.`;
      }
      showDesktopToast(`Xiaomi cihazı bulundu: ${first.ip}`);
    } else if (statusEl) {
      statusEl.textContent = 'Ağda yanıt veren cihaz bulunamadı. Aynı Wi-Fi ağında olduğundan emin ol veya IP gir.';
    }
  } catch {
    if (statusEl) {
      statusEl.textContent = 'Tarama için yerel masaüstü köprüsünün çalışıyor olması gerekir.';
    }
  }
});

document.getElementById('weAirSaveConfigBtn')?.addEventListener('click', () => {
  const ipIn = document.getElementById('weAirIpInput');
  const tokIn = document.getElementById('weAirTokenInput');
  xiaomiConfig = {
    ip: String(ipIn?.value || '').trim(),
    token: String(tokIn?.value || '').trim().toLowerCase(),
  };
  lsSet(XIAOMI_CONFIG_KEY, xiaomiConfig);
  if (typeof window.__weScheduleUserStateSync === 'function') window.__weScheduleUserStateSync();
  const cfgPanel = document.getElementById('weAirConfigPanel');
  if (cfgPanel) cfgPanel.hidden = true;
  document.getElementById('weAirConfigToggleBtn')?.classList.remove('is-active');
  setActiveDesktopInput(null);
  refreshXiaomiAirTelemetry(false);
});

document.getElementById('weAirForgetBtn')?.addEventListener('click', () => {
  xiaomiConfig = { ip: '', token: '' };
  xiaomiTelemetry.connected = false;
  lsSet(XIAOMI_CONFIG_KEY, xiaomiConfig);
  try { localStorage.removeItem(XIAOMI_TELEMETRY_CACHE_KEY); } catch {}
  fetch(`${BRIDGE_BASE_URL}/api/desktop/user-state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ xiaomi: null }),
  }).catch(() => {});
  const ipIn = document.getElementById('weAirIpInput');
  const tokIn = document.getElementById('weAirTokenInput');
  if (ipIn) ipIn.value = '';
  if (tokIn) tokIn.value = '';
  refreshXiaomiAirTelemetry(true);
  showDesktopToast('Kayıtlı Xiaomi bağlantısı temizlendi.');
});

airPurifierPopover.querySelector('[data-air-cmd="power"]')?.addEventListener('click', () => {
  sendXiaomiAirControl({ power: xiaomiTelemetry.power === false });
});
airPurifierPopover.querySelectorAll('[data-air-mode]').forEach((btn) => {
  btn.addEventListener('click', () => {
    sendXiaomiAirControl({ mode: Number(btn.getAttribute('data-air-mode')) });
  });
});

renderXiaomiAirWidget();
refreshXiaomiAirTelemetry(true);
setInterval(() => {
  if (!bridgeOnline || document.hidden || weWallpaperPaused || !weSettings.showAirBtn || !xiaomiConfig.ip || !xiaomiConfig.token) {
    return;
  }
  refreshXiaomiAirTelemetry(true);
}, 45000);

// ============================================================================
// 12. 8-CHANNEL MULTI-LAYER ORGANIC ACOUSTIC SOUNDSCAPE & BIOME CREATURE AUDIO
//     Replaces basic single-filter brown noise with 8 rich multi-layered nature
//     soundscapes, automatic biome-to-soundscape synchronization, and authentic
//     periodic creature vocalizations for all 8 habitats!
// ============================================================================
const BIOME_AUDIO_PREFS_KEY = 'diorama_biome_audio_prefs_v1';
let biomeAudioPrefs = {
  autoSyncBiome: false,
  creatureVoices: true,
  ...(lsGet(BIOME_AUDIO_PREFS_KEY, {}) || {}),
};

function saveBiomeAudioPrefs() {
  lsSet(BIOME_AUDIO_PREFS_KEY, biomeAudioPrefs);
  if (typeof window.__weScheduleUserStateSync === 'function') window.__weScheduleUserStateSync();
}

const HABITAT_DEFAULT_SOUNDSCAPE = {
  bees: 'forest',
  betta: 'water',
  dragonfly: 'night',
  butterfly: 'forest',
  jellyfish: 'water',
  koi: 'zen',
  rainforest: 'rain',
  'arctic-aurora': 'wind',
};

const SOUNDSCAPE_SVG = {
  rain: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 16.2A4.5 4.5 0 0017.5 8h-1.8A7 7 0 104 14.9"></path><path d="M16 14v5M8 14v5M12 16v5" stroke-linecap="round"></path></svg>',
  fire: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 2c.5 4.5-3.5 6.5-3.5 10a5.5 5.5 0 0011 0c0-3.2-2.2-5.4-3.5-7-.5 2-2 2.8-2.5 2.5C12.5 6 12.5 3.8 12 2z" stroke-linejoin="round"/></svg>',
  forest: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3l-5 7h3l-4 6h12l-4-6h3l-5-7z" stroke-linejoin="round"/><path d="M12 16v5" stroke-linecap="round"/></svg>',
  water: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 12c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0" stroke-linecap="round"/><path d="M2 17c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0" stroke-linecap="round"/></svg>',
  wind: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2" stroke-linecap="round"/></svg>',
  night: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 14.5A8.5 8.5 0 019.5 4 7 7 0 1020 14.5z" stroke-linejoin="round"/><circle cx="17" cy="6" r="0.8" fill="currentColor"/></svg>',
  zen: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="14" r="3"/><path d="M5 17c2.2 1.8 4.6 2.5 7 2.5s4.8-.7 7-2.5" stroke-linecap="round"/><path d="M12 3v5" stroke-linecap="round"/></svg>',
  vinyl: '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.2"/><path d="M16.5 7.5a6.5 6.5 0 010 9" stroke-linecap="round"/></svg>',
};

const SOUNDSCAPE_CATALOG = [
  { id: 'rain', label: 'Yağmur', fullLabel: 'Yağmur & Gök Gürültüsü', labelEn: 'Rain', fullLabelEn: 'Rain & Thunder' },
  { id: 'fire', label: 'Şömine', fullLabel: 'Kamp Ateşi Çıtırtısı', labelEn: 'Fire', fullLabelEn: 'Campfire Crackles' },
  { id: 'forest', label: 'Orman', fullLabel: 'Orman Rüzgarı & Kuşlar', labelEn: 'Forest', fullLabelEn: 'Forest Breeze & Birds' },
  { id: 'water', label: 'Su Altı', fullLabel: 'Derin Su & Kabarcık', labelEn: 'Stream', fullLabelEn: 'Deep Water & Bubbles' },
  { id: 'wind', label: 'Rüzgar', fullLabel: 'Kuzey Rüzgarı & Esinti', labelEn: 'Wind', fullLabelEn: 'Northern Wind' },
  { id: 'night', label: 'Gece', fullLabel: 'Yaz Gecesi & Cırcır', labelEn: 'Night', fullLabelEn: 'Summer Night & Crickets' },
  { id: 'zen', label: 'Zen', fullLabel: 'Zen Göleti & Bambu Su', labelEn: 'Zen', fullLabelEn: 'Zen Pond & Bamboo' },
  { id: 'vinyl', label: 'Plak', fullLabel: 'Sıcak Plak & Lo-Fi', labelEn: 'Vinyl', fullLabelEn: 'Warm Vinyl & Lo-Fi' },
];

const CREATURE_VOICE_LABELS = {
  bees: 'Bal arısı kanat vızıltısı',
  betta: 'Betta su kabarcığı',
  dragonfly: 'Sazlık yusufçuk ve cırcır',
  butterfly: 'Bahçe bülbülü ötüşü',
  jellyfish: 'Derin lagün akustiği',
  koi: 'Koi su şıpırtısı',
  rainforest: 'Tropikal papağan çağrısı',
  'arctic-aurora': 'Kutup tilkisi yankısı',
};

const CREATURE_VOICE_LABELS_EN = {
  bees: 'Honeybee wing buzz',
  betta: 'Betta water bubbles',
  dragonfly: 'Marsh dragonfly & crickets',
  butterfly: 'Garden songbird melody',
  jellyfish: 'Deep lagoon chime',
  koi: 'Koi pond water ripple',
  rainforest: 'Tropical macaw call',
  'arctic-aurora': 'Arctic fox valley echo',
};

function getCreatureVoiceLabel(habId, fallback = '') {
  return (isEn() ? CREATURE_VOICE_LABELS_EN[habId] : CREATURE_VOICE_LABELS[habId]) || fallback || L('Canlı sesi', 'Wildlife call');
}

function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Create seamless pink/brown organic noise buffer with micro-droplet texture
function createOrganicNoiseBuffer(ctx, mode = 'pink', seconds = 5) {
  const bufferSize = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    let lastBrown = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (mode === 'brown') {
        lastBrown = (lastBrown + 0.02 * white) / 1.02;
        data[i] = lastBrown * 0.22;
      } else {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.018;
        b6 = white * 0.115926;
      }
    }
    // Seamless crossfade loop boundary
    const fade = 3200;
    for (let i = 0; i < fade; i++) {
      const k = i / fade;
      data[bufferSize - fade + i] = data[bufferSize - fade + i] * (1 - k) + data[i] * k;
    }
  }
  return buffer;
}

let activeSoundNodes = [];
let activeSoundTimers = [];

function cleanupActiveSoundNodes() {
  activeSoundTimers.forEach((id) => clearTimeout(id));
  activeSoundTimers = [];
  activeSoundNodes.forEach((node) => {
    try {
      if (typeof node.stop === 'function') node.stop();
      if (typeof node.disconnect === 'function') node.disconnect();
    } catch {}
  });
  activeSoundNodes = [];
}

function scheduleProceduralTimer(fn, minMs, maxMs) {
  const delay = minMs + Math.random() * (maxMs - minMs);
  const id = setTimeout(() => {
    if (!activeSoundType) return;
    fn();
    scheduleProceduralTimer(fn, minMs, maxMs);
  }, delay);
  activeSoundTimers.push(id);
}

// Procedural micro-transients (Fire crackles, Rain thunder, Water bubbles, Forest birds, Zen bamboo)
function triggerFireCrackle(ctx, masterGain) {
  const now = ctx.currentTime;
  const burstCount = 1 + Math.floor(Math.random() * 3);
  for (let b = 0; b < burstCount; b++) {
    const t = now + b * (0.018 + Math.random() * 0.045);
    const dur = 0.012 + Math.random() * 0.022;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.28));
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1600 + Math.random() * 2800;
    bp.Q.value = 2.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.18 + Math.random() * 0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(bp);
    bp.connect(g);
    g.connect(masterGain);
    src.start(t);
  }
}

function triggerWaterBubbleCluster(ctx, masterGain) {
  const now = ctx.currentTime;
  const count = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const t = now + i * (0.07 + Math.random() * 0.09);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const baseF = 340 + Math.random() * 380;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseF, t);
    osc.frequency.exponentialRampToValueAtTime(baseF * 2.15, t + 0.085);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.075, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, t + 0.09);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.095);
  }
}

function triggerDistantThunder(ctx, masterGain) {
  const now = ctx.currentTime;
  const dur = 3.2;
  const buf = createOrganicNoiseBuffer(ctx, 'brown', 4);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(145, now);
  lp.frequency.exponentialRampToValueAtTime(52, now + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.001, now);
  g.gain.linearRampToValueAtTime(0.42, now + 0.45);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  src.connect(lp);
  lp.connect(g);
  g.connect(masterGain);
  src.start(now);
  src.stop(now + dur + 0.1);
}

function triggerZenBambooAndBell(ctx, masterGain) {
  const now = ctx.currentTime;
  // Hollow bamboo shishi-odoshi knock + soft singing bowl shimmer
  [310, 625].forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = idx === 0 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.92, now + 0.11);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(idx === 0 ? 0.14 : 0.07, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0008, now + 0.16);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.18);
  });
  if (Math.random() < 0.55) {
    const bell = ctx.createOscillator();
    const bg = ctx.createGain();
    bell.type = 'sine';
    bell.frequency.setValueAtTime(528, now + 0.35);
    bg.gain.setValueAtTime(0.0001, now + 0.35);
    bg.gain.linearRampToValueAtTime(0.045, now + 0.45);
    bg.gain.exponentialRampToValueAtTime(0.0005, now + 3.4);
    bell.connect(bg);
    bg.connect(masterGain);
    bell.start(now + 0.35);
    bell.stop(now + 3.5);
  }
}

// ============================================================================
// BIOME CREATURE VOCALIZATION SYNTHESIZER (ALL 8 HABITATS)
// ============================================================================
function playBiomeCreatureSound(forceHabitatId = null, isPreview = false) {
  if (!isPreview && !biomeAudioPrefs.creatureVoices) return;
  try {
    const ctx = ensureAudioContext();
    const habId = forceHabitatId || HABITATS[currentHabitatIdx]?.id || 'bees';
    const now = ctx.currentTime;
    const outGain = ctx.createGain();
    const vol = Math.max(0.18, Math.min(0.95, ambientVolume * (isPreview ? 1.25 : 0.95)));
    outGain.gain.setValueAtTime(vol, now);
    outGain.connect(ctx.destination);

    if (habId === 'bees') {
      // Honeybee warm stereo wing buzz fly-by (196 Hz + 392 Hz + vibrato)
      const dur = 1.45;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const vib = ctx.createOscillator();
      const vibGain = ctx.createGain();
      const lp = ctx.createBiquadFilter();
      const env = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(196, now);
      osc2.frequency.setValueAtTime(392, now);
      vib.frequency.setValueAtTime(6.5, now);
      vibGain.gain.setValueAtTime(11, now);
      vib.connect(vibGain);
      vibGain.connect(osc1.frequency);

      lp.type = 'bandpass';
      lp.frequency.setValueAtTime(420, now);
      lp.Q.setValueAtTime(1.8, now);

      env.gain.setValueAtTime(0.001, now);
      env.gain.linearRampToValueAtTime(0.085, now + 0.45);
      env.gain.linearRampToValueAtTime(0.095, now + 0.85);
      env.gain.exponentialRampToValueAtTime(0.0008, now + dur);

      osc1.connect(lp);
      osc2.connect(lp);
      lp.connect(env);
      env.connect(outGain);
      vib.start(now);
      osc1.start(now);
      osc2.start(now);
      vib.stop(now + dur);
      osc1.stop(now + dur);
      osc2.stop(now + dur);
    } else if (habId === 'betta' || habId === 'koi') {
      // Aquarium / Koi pond water splash & ascending bubble stream
      const notes = habId === 'koi' ? [380, 540, 760, 980] : [460, 680, 920, 1240];
      notes.forEach((f, idx) => {
        const t = now + idx * 0.085;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 1.95, t + 0.075);
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.11, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(g);
        g.connect(outGain);
        osc.start(t);
        osc.stop(t + 0.085);
      });
    } else if (habId === 'dragonfly') {
      // Reed cricket double-stridulation + dragonfly wing flutter
      for (let pulse = 0; pulse < 5; pulse++) {
        const t = now + pulse * 0.045;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(4120, t);
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.065, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.032);
        osc.connect(g);
        g.connect(outGain);
        osc.start(t);
        osc.stop(t + 0.036);
      }
    } else if (habId === 'butterfly') {
      // Botanical garden songbird 4-note melodic syrinx warble
      const melody = [
        [2550, 3250, 0.0, 0.13],
        [3300, 2750, 0.15, 0.12],
        [2950, 3850, 0.30, 0.16],
        [3600, 3100, 0.49, 0.18],
      ];
      melody.forEach(([f1, f2, offset, dur]) => {
        const t = now + offset;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f1, t);
        osc.frequency.exponentialRampToValueAtTime(f2, t + dur);
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.085, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
        osc.connect(g);
        g.connect(outGain);
        osc.start(t);
        osc.stop(t + dur + 0.01);
      });
    } else if (habId === 'jellyfish') {
      // Deep coral lagoon bioluminescent harmonic chime & aquatic swell
      [220, 440, 1320].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.06);
        osc.frequency.exponentialRampToValueAtTime(f * 0.88, now + 1.4);
        g.gain.setValueAtTime(0.001, now + idx * 0.06);
        g.gain.linearRampToValueAtTime(idx === 2 ? 0.045 : 0.08, now + idx * 0.06 + 0.08);
        g.gain.exponentialRampToValueAtTime(0.0008, now + 1.45);
        osc.connect(g);
        g.connect(outGain);
        osc.start(now + idx * 0.06);
        osc.stop(now + 1.5);
      });
    } else if (habId === 'rainforest') {
      // Tropical Macaw / Toucan two-part canopy call + tree-frog coqui
      const calls = [
        [1080, 1680, 920, 0.0, 0.22],
        [1180, 1840, 960, 0.28, 0.24],
      ];
      calls.forEach(([fStart, fPeak, fEnd, offset, dur]) => {
        const t = now + offset;
        const osc = ctx.createOscillator();
        const bp = ctx.createBiquadFilter();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(fStart, t);
        osc.frequency.exponentialRampToValueAtTime(fPeak, t + dur * 0.45);
        osc.frequency.exponentialRampToValueAtTime(fEnd, t + dur);
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(1450, t);
        bp.Q.setValueAtTime(2.4, t);
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.09, t + 0.025);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(bp);
        bp.connect(g);
        g.connect(outGain);
        osc.start(t);
        osc.stop(t + dur + 0.02);
      });
    } else if (habId === 'arctic-aurora') {
      // Playful Arctic Fox double yip/bark with snowy valley echo
      [0, 0.24].forEach((offset, idx) => {
        const t = now + offset;
        const amp = idx === 0 ? 0.11 : 0.045; // Second is the valley echo!
        const osc = ctx.createOscillator();
        const bp = ctx.createBiquadFilter();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(680, t);
        osc.frequency.exponentialRampToValueAtTime(1380, t + 0.065);
        osc.frequency.exponentialRampToValueAtTime(540, t + 0.17);
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(1050, t);
        bp.Q.setValueAtTime(1.9, t);
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(amp, t + 0.018);
        g.gain.exponentialRampToValueAtTime(0.0008, t + 0.18);
        osc.connect(bp);
        bp.connect(g);
        g.connect(outGain);
        osc.start(t);
        osc.stop(t + 0.19);
      });
    }
  } catch {}
}

// Periodic Biome Creature Voice Scheduler (fires every 15-28 seconds when enabled)
let creatureVoiceTimerId = null;
function scheduleNextBiomeCreatureVoice() {
  if (creatureVoiceTimerId) {
    clearTimeout(creatureVoiceTimerId);
    creatureVoiceTimerId = null;
  }
  if (!biomeAudioPrefs.creatureVoices) return;
  const nextDelayMs = 15000 + Math.random() * 14000;
  creatureVoiceTimerId = setTimeout(() => {
    if (!document.hidden && biomeAudioPrefs.creatureVoices && (activeSoundType || audioCtx)) {
      playBiomeCreatureSound(null, false);
    }
    scheduleNextBiomeCreatureVoice();
  }, nextDelayMs);
}

window.__weCustomStopAmbientSound = function stopMultiLayerAmbientSound() {
  cleanupActiveSoundNodes();
  if (activeSoundSource) {
    try {
      const g = activeSoundSource._gain?.gain;
      if (g && audioCtx) {
        const n = audioCtx.currentTime;
        g.cancelScheduledValues(n);
        g.setValueAtTime(g.value, n);
        g.linearRampToValueAtTime(0.0001, n + 0.25);
      }
      if (typeof activeSoundSource.stop === 'function') {
        activeSoundSource.stop(audioCtx ? audioCtx.currentTime + 0.3 : 0);
      }
    } catch {}
    activeSoundSource = null;
  }
  activeSoundType = null;
  soundActiveDot?.classList.add('hidden');
  const statusEl = document.getElementById('ambientStatusText');
  if (statusEl) statusEl.textContent = L('Sessiz', 'Muted');
  document.querySelectorAll('.sound-btn').forEach((b) => {
    b.setAttribute('aria-pressed', 'false');
    b.className = 'sound-btn py-2 px-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.10] border border-white/10 flex flex-col items-center gap-1 text-xs text-white/70 transition';
  });
};

window.__weCustomToggleAmbientSound = function toggleMultiLayerAmbientSound(type, forcePlay = false) {
  if (!type) return;
  if (!forcePlay && activeSoundType === type) {
    window.__weCustomStopAmbientSound();
    return;
  }
  window.__weCustomStopAmbientSound();

  const ctx = ensureAudioContext();
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(ambientVolume, ctx.currentTime + 0.75);
  masterGain.connect(ctx.destination);

  // Layer 1: Base Organic Noise Stream
  const baseMode = ['water', 'fire', 'vinyl'].includes(type) ? 'brown' : 'pink';
  const baseBuffer = createOrganicNoiseBuffer(ctx, baseMode, 5);
  const baseSource = ctx.createBufferSource();
  baseSource.buffer = baseBuffer;
  baseSource.loop = true;

  const filter1 = ctx.createBiquadFilter();
  if (type === 'rain') {
    filter1.type = 'bandpass';
    filter1.frequency.value = 820;
    filter1.Q.value = 0.6;
  } else if (type === 'fire') {
    filter1.type = 'lowpass';
    filter1.frequency.value = 185;
  } else if (type === 'forest') {
    filter1.type = 'bandpass';
    filter1.frequency.value = 540;
    filter1.Q.value = 0.85;
  } else if (type === 'water') {
    filter1.type = 'lowpass';
    filter1.frequency.value = 215;
  } else if (type === 'wind') {
    filter1.type = 'bandpass';
    filter1.frequency.value = 340;
    filter1.Q.value = 2.4;
    // Slow wind gust LFO
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.value = 0.11;
    lfoG.gain.value = 145;
    lfo.connect(lfoG);
    lfoG.connect(filter1.frequency);
    lfo.start();
    activeSoundNodes.push(lfo);
  } else if (type === 'night') {
    filter1.type = 'bandpass';
    filter1.frequency.value = 420;
    filter1.Q.value = 1.1;
  } else if (type === 'zen') {
    filter1.type = 'bandpass';
    filter1.frequency.value = 640;
    filter1.Q.value = 0.9;
  } else if (type === 'vinyl') {
    filter1.type = 'lowpass';
    filter1.frequency.value = 290;
  }

  baseSource.connect(filter1);
  filter1.connect(masterGain);
  baseSource.start();
  baseSource._gain = masterGain;
  activeSoundNodes.push(baseSource);

  // Layer 2: Rich Multi-Channel Acoustic Detail & Procedural Events
  if (type === 'rain') {
    // High-frequency rain patter + periodic distant rolling thunder
    const patterBuf = createOrganicNoiseBuffer(ctx, 'pink', 4);
    const patterSrc = ctx.createBufferSource();
    patterSrc.buffer = patterBuf;
    patterSrc.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.value = 2650;
    hp.Q.value = 1.1;
    const pg = ctx.createGain();
    pg.gain.value = 0.35;
    patterSrc.connect(hp);
    hp.connect(pg);
    pg.connect(masterGain);
    patterSrc.start();
    activeSoundNodes.push(patterSrc);
    scheduleProceduralTimer(() => triggerDistantThunder(ctx, masterGain), 14000, 28000);
  } else if (type === 'fire') {
    scheduleProceduralTimer(() => triggerFireCrackle(ctx, masterGain), 140, 520);
  } else if (type === 'forest') {
    scheduleProceduralTimer(() => playBiomeCreatureSound('butterfly', true), 4500, 9500);
  } else if (type === 'water') {
    scheduleProceduralTimer(() => triggerWaterBubbleCluster(ctx, masterGain), 1800, 4200);
  } else if (type === 'night') {
    scheduleProceduralTimer(() => playBiomeCreatureSound('dragonfly', true), 1400, 2900);
  } else if (type === 'zen') {
    scheduleProceduralTimer(() => triggerWaterBubbleCluster(ctx, masterGain), 2800, 5500);
    scheduleProceduralTimer(() => triggerZenBambooAndBell(ctx, masterGain), 7000, 14000);
  } else if (type === 'vinyl') {
    // Warm Lo-Fi analog chord pad (Fmaj7 warm low-passed drone) + soft vinyl crackle
    [174.61, 220.0, 261.63, 329.63].forEach((freq) => {
      const osc = ctx.createOscillator();
      const lp = ctx.createBiquadFilter();
      const cg = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      lp.type = 'lowpass';
      lp.frequency.value = 340;
      cg.gain.value = 0.025;
      osc.connect(lp);
      lp.connect(cg);
      cg.connect(masterGain);
      osc.start();
      activeSoundNodes.push(osc);
    });
    scheduleProceduralTimer(() => triggerFireCrackle(ctx, masterGain), 380, 1100);
  }

  activeSoundSource = baseSource;
  activeSoundType = type;
  soundActiveDot?.classList.remove('hidden');

  const found = SOUNDSCAPE_CATALOG.find((s) => s.id === type);
  const statusEl = document.getElementById('ambientStatusText');
  if (statusEl) statusEl.textContent = found ? (isEn() ? found.fullLabelEn : found.fullLabel) : type;

  document.querySelectorAll('.sound-btn').forEach((b) => {
    const selected = b.dataset.sound === type;
    b.setAttribute('aria-pressed', selected ? 'true' : 'false');
    b.className = selected
      ? 'sound-btn py-2 px-2 rounded-xl bg-white/15 border border-white/35 flex flex-col items-center gap-1 text-xs text-white transition shadow-sm'
      : 'sound-btn py-2 px-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.10] border border-white/10 flex flex-col items-center gap-1 text-xs text-white/70 transition';
  });
};

// Upgrade #focusPopover soundscape section UI with 8 soundscapes + Biome Auto-Sync + Creature Voice toggles
function upgradeFocusSoundscapeStudioUI() {
  const focusPop = document.getElementById('focusPopover');
  if (!focusPop) return;
  const oldGrid = focusPop.querySelector('.sound-btn')?.parentElement;
  if (!oldGrid || !oldGrid.parentElement) return;

  // Insert Biome Auto-Sync & Creature Voice Controls matching #weatherPopover checkbox style
  const biomeBox = document.createElement('div');
  biomeBox.className = 'we-biome-audio-toggles';
  biomeBox.innerHTML = `
    <label class="we-biome-toggle-label">
      <span class="font-pixel">Biyoma göre doğa sesini otomatik seç</span>
      <input id="weBiomeAutoCheckbox" type="checkbox" aria-label="Biyom değişince doğa sesini otomatik aç" class="accent-sky-300 w-4 h-4">
    </label>
    <label class="we-biome-toggle-label">
      <span class="font-pixel">Biyomdaki canlıların sesi arada çıksın</span>
      <input id="weCreatureVoiceCheckbox" type="checkbox" aria-label="Biyomdaki hayvanların sesini etkinleştir" class="accent-sky-300 w-4 h-4">
    </label>
    <div class="we-biome-creature-footer">
      <span id="weActiveCreatureVoiceLabel" class="text-[11px] text-white/60 truncate font-pixel">Aktif biyom sesi</span>
      <button id="wePreviewCreatureVoiceBtn" type="button" title="Aktif habitattaki canlının sesini dinle" class="we-creature-preview-btn">Sesi Dene</button>
    </div>
  `;

  oldGrid.parentElement.insertBefore(biomeBox, oldGrid);

  // Replace 3-button sound grid with 8-button Monochrome SVG Soundscape Studio
  oldGrid.className = 'we-soundscape-grid-8';
  oldGrid.replaceChildren();
  SOUNDSCAPE_CATALOG.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.sound = item.id;
    btn.setAttribute('aria-pressed', activeSoundType === item.id ? 'true' : 'false');
    btn.className = 'sound-btn py-2 px-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.10] border border-white/10 flex flex-col items-center gap-1 text-xs text-white/70 transition';
    btn.innerHTML = `${SOUNDSCAPE_SVG[item.id] || ''}<span class="font-pixel text-[11px] leading-tight">${item.label}</span>`;
    btn.addEventListener('click', () => {
      window.__weCustomToggleAmbientSound(item.id, false);
    });
    oldGrid.appendChild(btn);
  });

  const syncBiomeAudioUI = () => {
    const autoBox = document.getElementById('weBiomeAutoCheckbox');
    const crBox = document.getElementById('weCreatureVoiceCheckbox');
    const crLabel = document.getElementById('weActiveCreatureVoiceLabel');
    if (autoBox) autoBox.checked = Boolean(biomeAudioPrefs.autoSyncBiome);
    if (crBox) crBox.checked = Boolean(biomeAudioPrefs.creatureVoices);
    const currentHab = HABITATS[currentHabitatIdx];
    if (crLabel && currentHab) {
      crLabel.textContent = getCreatureVoiceLabel(currentHab.id, currentHab.name);
    }
    const statusEl = document.getElementById('ambientStatusText');
    if (statusEl) {
      if (!activeSoundType) statusEl.textContent = L('Sessiz', 'Muted');
      else {
        const found = SOUNDSCAPE_CATALOG.find((s) => s.id === activeSoundType);
        if (found) statusEl.textContent = isEn() ? found.fullLabelEn : found.fullLabel;
      }
    }
    document.querySelectorAll('.sound-btn').forEach((btn) => {
      const s = SOUNDSCAPE_CATALOG.find((item) => item.id === btn.dataset.sound);
      const lbl = btn.querySelector('span');
      if (s && lbl) lbl.textContent = isEn() ? s.labelEn : s.label;
    });
  };
  window.__weSyncBiomeAudioUI = syncBiomeAudioUI;

  window.__weSetBiomeAutoAudio = (enabled) => {
    biomeAudioPrefs.autoSyncBiome = Boolean(enabled);
    saveBiomeAudioPrefs();
    syncBiomeAudioUI();
    if (biomeAudioPrefs.autoSyncBiome) {
      const hab = HABITATS[currentHabitatIdx];
      const targetSound = HABITAT_DEFAULT_SOUNDSCAPE[hab?.id] || 'forest';
      window.__weCustomToggleAmbientSound(targetSound, true);
    }
  };

  window.__weSetBiomeCreatureSounds = (enabled) => {
    biomeAudioPrefs.creatureVoices = Boolean(enabled);
    saveBiomeAudioPrefs();
    syncBiomeAudioUI();
    scheduleNextBiomeCreatureVoice();
  };

  document.getElementById('weBiomeAutoCheckbox')?.addEventListener('change', (e) => {
    window.__weSetBiomeAutoAudio(Boolean(e.target.checked));
  });

  document.getElementById('weCreatureVoiceCheckbox')?.addEventListener('change', (e) => {
    window.__weSetBiomeCreatureSounds(Boolean(e.target.checked));
  });

  document.getElementById('wePreviewCreatureVoiceBtn')?.addEventListener('click', () => {
    const hab = HABITATS[currentHabitatIdx];
    playBiomeCreatureSound(hab?.id, true);
    showDesktopToast(getCreatureVoiceLabel(hab?.id));
  });

  window.__weOnHabitatChanged = (hab) => {
    syncBiomeAudioUI();
    if (biomeAudioPrefs.autoSyncBiome && hab) {
      const targetSound = HABITAT_DEFAULT_SOUNDSCAPE[hab.id] || 'forest';
      if (activeSoundType !== targetSound) {
        window.__weCustomToggleAmbientSound(targetSound, true);
      }
    }
    if (biomeAudioPrefs.creatureVoices && (activeSoundType || biomeAudioPrefs.autoSyncBiome)) {
      setTimeout(() => playBiomeCreatureSound(hab?.id, false), 650);
    }
  };

  syncBiomeAudioUI();
  scheduleNextBiomeCreatureVoice();
}

upgradeFocusSoundscapeStudioUI();

// ============================================================================
// 13. EXTERNAL USER-LOCAL STATE SYNC (%USERPROFILE%\.diorama-local-state.json)
//     Keeps Xiaomi Air Purifier 4 IP/token, pinned apps, Wallpaper settings,
//     biome audio preferences, and workspace personal data synced automatically
//     outside project files so wallpaper reloads and updates never lose data.
// ============================================================================
const PERSISTED_LOCAL_KEYS = [
  'diorama_theme',
  'diorama_username',
  'diorama_city',
  'diorama_wxfx',
  'diorama_wx_autotheme',
  'diorama_pinned_habitat',
  'diorama_ambient_volume',
  'diorama_tasks',
  'diorama_notes',
  'diorama_calendar_events_v1',
  'diorama_calendar_routines_v1',
  'diorama_calendar_smart_cfg_v1',
  'diorama_news_source_preferences_v1',
  'diorama_news_custom_sources_v1',
  'diorama_news_read_ids_v1',
  'diorama_news_saved_ids_v1',
];

function collectCoreAppStorageSnapshot() {
  const out = {};
  for (const key of PERSISTED_LOCAL_KEYS) {
    try {
      const v = localStorage.getItem(key);
      if (v !== null) out[key] = v;
    } catch {}
  }
  return out;
}

let userStateSyncTimer = null;
let userStateDirty = false;
let isHydratingFromBridge = false;

function buildUserStatePayload() {
  const payload = {
    weSettings,
    wePropSnapshot,
    desktopDockItems,
    biomeAudioPrefs,
    appStorage: collectCoreAppStorageSnapshot(),
  };
  if (xiaomiConfig && (xiaomiConfig.ip || xiaomiConfig.token)) {
    payload.xiaomi = { ip: xiaomiConfig.ip, token: xiaomiConfig.token };
  }
  return payload;
}

function sendUserStateSyncNow(useKeepalive = false) {
  if (userStateSyncTimer) {
    clearTimeout(userStateSyncTimer);
    userStateSyncTimer = null;
  }
  userStateDirty = false;
  if (isHydratingFromBridge || !bridgeOnline) return;
  try {
    fetch(`${BRIDGE_BASE_URL}/api/desktop/user-state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildUserStatePayload()),
      keepalive: useKeepalive,
    }).catch(() => {});
  } catch {}
}

window.__weFlushUserStateSync = function flushUserStateSyncNow(useKeepalive = false) {
  sendUserStateSyncNow(useKeepalive);
};

window.__weScheduleUserStateSync = function scheduleUserStateSync() {
  if (isHydratingFromBridge || !bridgeOnline) return;
  userStateDirty = true;
  if (userStateSyncTimer) clearTimeout(userStateSyncTimer);
  userStateSyncTimer = setTimeout(() => sendUserStateSyncNow(false), 550);
};

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('pagehide', () => {
    if (userStateDirty || userStateSyncTimer) sendUserStateSyncNow(true);
  });
  window.addEventListener('beforeunload', () => {
    if (userStateDirty || userStateSyncTimer) sendUserStateSyncNow(true);
  });
}

// Mirror core localStorage writes (tasks, notes, calendar, city, theme, username) automatically
try {
  const origSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function patchedSetItem(key, value) {
    origSetItem.call(this, key, value);
    if (!isHydratingFromBridge && typeof key === 'string' && PERSISTED_LOCAL_KEYS.includes(key)) {
      window.__weScheduleUserStateSync();
    }
  };
} catch {}

window.__weHydrateUserState = async function hydrateUserStateFromBridge() {
  try {
    const res = await fetch(`${BRIDGE_BASE_URL}/api/desktop/user-state`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const state = data?.state;
    if (!state || typeof state !== 'object') return;

    isHydratingFromBridge = true;
    let shouldSyncBackToDisk = false;
    let restoredXiaomi = false;
    let restoredAppKeys = false;

    // 1. Restore Xiaomi IP/Token if localStorage lost it after cache clear or origin change
    if (state.xiaomi && state.xiaomi.ip && state.xiaomi.token) {
      if (!xiaomiConfig.ip || !xiaomiConfig.token) {
        xiaomiConfig = {
          ip: String(state.xiaomi.ip).trim(),
          token: String(state.xiaomi.token).trim().toLowerCase(),
        };
        lsSet(XIAOMI_CONFIG_KEY, xiaomiConfig);
        if (state.xiaomi.lastTelemetry && typeof state.xiaomi.lastTelemetry === 'object') {
          xiaomiTelemetry = { ...xiaomiTelemetry, ...state.xiaomi.lastTelemetry };
          lsSet(XIAOMI_TELEMETRY_CACHE_KEY, xiaomiTelemetry);
        }
        restoredXiaomi = true;
      }
    } else if (xiaomiConfig.ip && xiaomiConfig.token) {
      shouldSyncBackToDisk = true;
    }

    // 2. Restore Pinned Desktop Apps Dock if localStorage didn't have it
    if (Array.isArray(state.desktopDockItems) && state.desktopDockItems.length > 0 && lsRaw(DESKTOP_DOCK_KEY) === null) {
      desktopDockItems = state.desktopDockItems;
      lsSet(DESKTOP_DOCK_KEY, desktopDockItems);
      renderDesktopDock();
    } else if (lsRaw(DESKTOP_DOCK_KEY) !== null && !state.desktopDockItems) {
      shouldSyncBackToDisk = true;
    }

    // 3. Restore Wallpaper Engine property snapshot & user-modified settings (even if reload wiped localStorage)
    if (state.wePropSnapshot && typeof state.wePropSnapshot === 'object' && Object.keys(wePropSnapshot).length === 0) {
      wePropSnapshot = { ...state.wePropSnapshot };
      lsSet(WE_PROP_SNAPSHOT_KEY, wePropSnapshot);
    } else if (Object.keys(wePropSnapshot).length > 0 && !state.wePropSnapshot) {
      shouldSyncBackToDisk = true;
    }

    const diskWeSettings = state.weSettings && typeof state.weSettings === 'object' ? state.weSettings : null;
    const diskIsModified = Boolean(diskWeSettings?.userModified);
    const diskUpdatedAt = Number(diskWeSettings?.updatedAt) || 0;
    const localUpdatedAt = Number(weSettings.updatedAt) || 0;
    const shouldRestoreWeSettings = Boolean(
      diskWeSettings && (
        lsRaw(WE_SETTINGS_STORAGE_KEY) === null ||
        (diskIsModified && (!weSettings.userModified || diskUpdatedAt > localUpdatedAt))
      )
    );
    if (shouldRestoreWeSettings) {
      weSettings = { ...DEFAULT_WE_SETTINGS, ...diskWeSettings };
      lsSet(WE_SETTINGS_STORAGE_KEY, weSettings);
      applyAllWeSettings(false);
    } else if (lsRaw(WE_SETTINGS_STORAGE_KEY) !== null && !diskWeSettings) {
      shouldSyncBackToDisk = true;
    }

    // 4. Restore Biome Audio preferences if missing in localStorage
    if (state.biomeAudioPrefs && typeof state.biomeAudioPrefs === 'object' && lsRaw(BIOME_AUDIO_PREFS_KEY) === null) {
      biomeAudioPrefs = { ...biomeAudioPrefs, ...state.biomeAudioPrefs };
      lsSet(BIOME_AUDIO_PREFS_KEY, biomeAudioPrefs);
      if (typeof window.__weSyncBiomeAudioUI === 'function') window.__weSyncBiomeAudioUI();
    } else if (lsRaw(BIOME_AUDIO_PREFS_KEY) !== null && !state.biomeAudioPrefs) {
      shouldSyncBackToDisk = true;
    }

    // 5. Restore core personal app data keys if missing in localStorage
    if (state.appStorage && typeof state.appStorage === 'object') {
      for (const [key, val] of Object.entries(state.appStorage)) {
        if (PERSISTED_LOCAL_KEYS.includes(key) && typeof val === 'string' && lsRaw(key) === null) {
          lsPut(key, val);
          restoredAppKeys = true;
        }
      }
    }

    isHydratingFromBridge = false;
    if (restoredAppKeys && typeof window.__weRefreshSmartCalendarFromStorage === 'function') {
      window.__weRefreshSmartCalendarFromStorage();
    }

    if (restoredXiaomi) {
      renderXiaomiAirWidget();
      refreshXiaomiAirTelemetry(true);
    }
    if (restoredAppKeys) {
      try {
        const storedTasks = normalizeTaskList(lsGet('diorama_tasks', null), tasks);
        const storedNotes = normalizeNoteList(lsGet('diorama_notes', null), notes);
        if (typeof setTasks === 'function') setTasks(storedTasks);
        if (typeof renderTasks === 'function') renderTasks();
        if (typeof setNotes === 'function') setNotes(storedNotes);
        if (typeof renderNotes === 'function') renderNotes();
        const savedTheme = lsRaw('diorama_theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
          const wantLight = savedTheme === 'light';
          if (typeof setLightMode === 'function' && isLightMode !== wantLight) setLightMode(wantLight);
        }
        if (typeof normalizeEvents === 'function' && typeof renderCalendar === 'function') {
          events = normalizeEvents(lsGet('diorama_calendar_events_v1', []));
          renderCalendar();
          if (typeof renderSelectedDay === 'function') renderSelectedDay();
        }
        const savedUser = lsRaw('diorama_username');
        if (savedUser && editableUserName) editableUserName.textContent = savedUser;
        const savedCity = lsRaw('diorama_city');
        if (savedCity && typeof fetchWeather === 'function' && savedCity !== userCity) {
          userCity = savedCity;
          fetchWeather(savedCity, { silent: true });
        }
      } catch {}
    }

    if (shouldSyncBackToDisk || !state.appStorage) {
      window.__weScheduleUserStateSync();
    }
  } catch {
    isHydratingFromBridge = false;
  }
};

// ============================================================================
// 14. MINECRAFT PIXEL DISC MUSIC PLAYER — FLOATING OPTICAL GLASS TURNTABLE
//     Combines Wallpaper Engine's native Media Integration API with Windows
//     GSMTC (/api/desktop/media/*) for live track info, pixelated spinning
//     album cover inside a 48x48 stepped Minecraft vinyl disc, pivoting pixel
//     tonearm, Minecraft Jukebox pixel note particles, and real transport control.
// ============================================================================
const MUSIC_SVGS = {
  prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20" fill="currentColor"/><line x1="5" y1="19" x2="5" y2="5"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4" fill="currentColor"/><line x1="19" y1="5" x2="19" y2="19"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="7 4 20 12 7 20 7 4"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
  minimize: '<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  expand: '<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
};

const PIXEL_TONEARM_SVG = `
<svg class="we-music-tonearm" viewBox="0 0 15 22" width="30" height="44" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="9" y="1" width="5" height="5" fill="#1e293b"/>
  <rect x="10" y="2" width="3" height="3" fill="#94a3b8"/>
  <rect x="11" y="3" width="1" height="1" fill="#f8fafc"/>
  <rect x="11" y="6" width="2" height="4" fill="#cbd5e1"/>
  <rect x="10" y="10" width="2" height="3" fill="#cbd5e1"/>
  <rect x="9" y="13" width="2" height="3" fill="#94a3b8"/>
  <rect x="7" y="15" width="3" height="2" fill="#e2e8f0"/>
  <rect x="5" y="16" width="3" height="3" fill="#334155"/>
  <rect x="5" y="18" width="2" height="2" fill="#f43f5e"/>
</svg>`;

const PIXEL_DISC_GLINT_SVG = `
<svg class="we-music-disc-glint" viewBox="0 0 32 32" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="7" y="5" width="2" height="1" fill="#ffffff"/>
  <rect x="6" y="6" width="2" height="1" fill="#ffffff"/>
  <rect x="5" y="7" width="1" height="2" fill="#ffffff"/>
  <rect x="23" y="26" width="2" height="1" fill="#ffffff"/>
  <rect x="24" y="25" width="2" height="1" fill="#ffffff"/>
  <rect x="26" y="23" width="1" height="2" fill="#ffffff"/>
</svg>`;

const musicState = {
  active: false,
  playing: false,
  title: '',
  artist: '',
  album: '',
  sourceApp: '',
  position: 0,
  duration: 0,
  lastPositionTickMs: Date.now(),
  accentHex: '#4ade80',
  accentRgb: [74, 222, 128],
  coverKey: '',
  coverImg: null,
  weMediaActive: false,
  bridgeThumbRev: -1,
};

function formatFriendlyMediaSource(rawApp = '') {
  const s = String(rawApp || '').toLowerCase();
  if (!s) return L('MÜZİK ÇALAR', 'MUSIC PLAYER');
  if (s.includes('spotify')) return 'SPOTIFY';
  if (s.includes('chrome')) return 'CHROME';
  if (s.includes('msedge') || s.includes('edge')) return 'EDGE';
  if (s.includes('brave')) return 'BRAVE';
  if (s.includes('opera')) return 'OPERA';
  if (s.includes('firefox')) return 'FIREFOX';
  if (s.includes('apple') || s.includes('itunes')) return 'APPLE MUSIC';
  if (s.includes('vlc')) return 'VLC';
  if (s.includes('tidal')) return 'TIDAL';
  if (s.includes('youtube')) return 'YOUTUBE';
  if (s.includes('zune') || s.includes('mediaplayer')) return L('MEDYA OYNATICI', 'MEDIA PLAYER');
  return s.replace(/\.exe$/i, '').split(/[\\!._]/).filter(Boolean)[0]?.toUpperCase().slice(0, 14) || L('MEDYA', 'MEDIA');
}

function formatTrackTime(totalSec) {
  const safe = Math.max(0, Math.floor(Number(totalSec) || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function parseHexToRgb(hex) {
  const clean = String(hex || '').replace('#', '').trim();
  if (/^[0-9a-f]{6}$/i.test(clean)) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ];
  }
  return null;
}

function rgbToHex(r, g, b) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function brightenRgb([r, g, b], delta) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v + delta)));
  return `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`;
}

// Create Floating Optical Glass Minecraft Pixel Disc Turntable DOM
const musicWidgetEl = document.createElement('aside');
musicWidgetEl.id = 'weMusicWidget';
musicWidgetEl.setAttribute('role', 'region');
musicWidgetEl.setAttribute('aria-label', 'Minecraft Piksel Plak Müzik Çalar');
musicWidgetEl.className = `optical-glass zen-fade zen-hide${weSettings.musicCompact ? ' is-compact' : ''}`;
musicWidgetEl.innerHTML = `
  <canvas class="glass-lens" aria-hidden="true"></canvas>
  <button id="weMusicCompactExpandBtn" type="button" title="Müzik Çaları Genişlet" aria-label="Müzik çaları genişlet" class="we-music-compact-expand">
    ${MUSIC_SVGS.expand}
  </button>
  <div class="we-music-shell">
    <div id="weMusicPlatterBtn" class="we-music-platter" title="Oynat / Duraklat">
      <div id="weMusicNotesLayer" class="we-music-notes-layer" aria-hidden="true"></div>
      <div class="we-music-platter-well">
        <canvas id="weMusicDiscCanvas" width="48" height="48" aria-hidden="true"></canvas>
        ${PIXEL_DISC_GLINT_SVG}
      </div>
      ${PIXEL_TONEARM_SVG}
    </div>
    <div class="we-music-info">
      <div class="we-music-head-row">
        <span class="we-music-source">
          <span class="we-music-led" aria-hidden="true"></span>
          <span id="weMusicSourceText">MÜZİK ÇALAR · HAZIR</span>
        </span>
        <button id="weMusicCompactToggleBtn" type="button" title="Sadece Piksel Plak Modu" aria-label="Küçük plak moduna geç" class="we-music-mini-btn">
          ${MUSIC_SVGS.minimize}
        </button>
      </div>
      <div id="weMusicTitle" class="we-music-title">Şarkı bekleniyor</div>
      <div id="weMusicArtist" class="we-music-artist">Spotify veya tarayıcıda müzik aç</div>
      <div class="we-music-progress-row">
        <div class="we-music-pixel-track" aria-hidden="true"><span id="weMusicProgressFill"></span></div>
        <span id="weMusicTimeText" class="we-music-time">00:00</span>
      </div>
      <div class="we-music-controls">
        <button id="weMusicPrevBtn" type="button" title="Önceki Şarkı" aria-label="Önceki şarkı" class="we-music-ctrl-btn">${MUSIC_SVGS.prev}</button>
        <button id="weMusicPlayBtn" type="button" title="Oynat / Duraklat" aria-label="Oynat veya duraklat" class="we-music-ctrl-btn is-primary">${MUSIC_SVGS.play}</button>
        <button id="weMusicNextBtn" type="button" title="Sonraki Şarkı" aria-label="Sonraki şarkı" class="we-music-ctrl-btn">${MUSIC_SVGS.next}</button>
      </div>
    </div>
  </div>
`;
document.body.appendChild(musicWidgetEl);
repaintGlassNow();

const discCanvasEl = document.getElementById('weMusicDiscCanvas');
const notesLayerEl = document.getElementById('weMusicNotesLayer');

// Render 48x48 Stepped Minecraft-Style Pixel Music Disc with Spinning Pixelated Album Cover!
function drawMinecraftPixelDisc(coverImg = null, accentRgb = [74, 222, 128]) {
  if (!discCanvasEl) return;
  const ctx2d = discCanvasEl.getContext('2d');
  if (!ctx2d || typeof ctx2d.fillRect !== 'function') return;

  const SIZE = 48;
  const HALF = 23.5;
  ctx2d.clearRect(0, 0, SIZE, SIZE);

  // Sample cover art down to a crisp 24x24 pixel-art grid for the spinning center label
  const COVER_RES = 24;
  let coverData = null;
  let extractedRgb = null;

  if (coverImg && coverImg.complete && (coverImg.naturalWidth > 0 || coverImg.width > 0)) {
    try {
      const off = document.createElement('canvas');
      off.width = COVER_RES;
      off.height = COVER_RES;
      const octx = off.getContext('2d');
      if (octx && typeof octx.drawImage === 'function') {
        const iw = coverImg.naturalWidth || coverImg.width;
        const ih = coverImg.naturalHeight || coverImg.height;
        const side = Math.min(iw, ih);
        const sx = Math.floor((iw - side) / 2);
        const sy = Math.floor((ih - side) / 2);
        octx.imageSmoothingEnabled = true;
        octx.drawImage(coverImg, sx, sy, side, side, 0, 0, COVER_RES, COVER_RES);
        const raw = octx.getImageData?.(0, 0, COVER_RES, COVER_RES);
        if (raw && raw.data && raw.data.length === COVER_RES * COVER_RES * 4) {
          coverData = raw.data;
          // Extract vibrant dominant accent hue from album cover
          let sumR = 0, sumG = 0, sumB = 0, weightSum = 0;
          for (let i = 0; i < coverData.length; i += 4) {
            const r = coverData[i], g = coverData[i + 1], b = coverData[i + 2];
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            const sat = max > 0 ? (max - min) / max : 0;
            const lum = (r + g + b) / 3;
            if (lum > 34 && lum < 232) {
              const w = 0.25 + sat * 2.2;
              sumR += r * w;
              sumG += g * w;
              sumB += b * w;
              weightSum += w;
            }
          }
          if (weightSum > 0) {
            const ar = Math.min(245, Math.max(60, Math.round(sumR / weightSum + 18)));
            const ag = Math.min(245, Math.max(60, Math.round(sumG / weightSum + 18)));
            const ab = Math.min(245, Math.max(60, Math.round(sumB / weightSum + 18)));
            extractedRgb = [ar, ag, ab];
          }
        }
      }
    } catch {}
  }

  const activeRgb = extractedRgb || accentRgb || [74, 222, 128];
  musicState.accentRgb = activeRgb;
  musicState.accentHex = rgbToHex(activeRgb[0], activeRgb[1], activeRgb[2]);
  musicWidgetEl.style.setProperty('--disc-accent', musicState.accentHex);

  const rimLight = brightenRgb(activeRgb, 36);
  const rimBase = brightenRgb(activeRgb, 0);
  const rimDark = brightenRgb(activeRgb, -48);
  const labelAlt = brightenRgb(activeRgb, -24);

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = x - HALF;
      const dy = y - HALF;
      const r = Math.hypot(dx, dy);

      // 1. Stepped Minecraft outer vinyl silhouette
      if (r > 23.2) continue;

      let color = '#141923';

      if (r > 21.7) {
        // Outer 1-2px obsidian border (signature Minecraft item outline)
        color = '#090c12';
      } else if (r > 13.8) {
        // Obsidian vinyl grooves + stepped Minecraft diagonal highlight gleam
        const ring = Math.floor(r);
        const angle = Math.atan2(dy, dx);
        const isDiagHighlight = (angle > -2.55 && angle < -1.95) || (angle > 0.58 && angle < 1.18);
        const isSoftHighlight = (angle > -2.75 && angle < -1.75) || (angle > 0.38 && angle < 1.38);

        if (isDiagHighlight && ring % 2 === 0) {
          color = '#4d5d7a';
        } else if (isDiagHighlight) {
          color = '#38455d';
        } else if (isSoftHighlight && ring % 2 === 1) {
          color = '#283144';
        } else if (ring % 2 === 0) {
          color = '#1a202d';
        } else {
          color = '#12161f';
        }
      } else if (r > 12.4) {
        // Colored inner Minecraft Disc Ring (matches song album cover accent)
        color = (dx + dy < 0) ? rimLight : (dx + dy > 8 ? rimDark : rimBase);
      } else if (r > 2.7) {
        // Center Spinning Album Cover Art (pixelated 24x24) OR Classic Minecraft Disc Label
        if (coverData) {
          const cx = Math.max(0, Math.min(COVER_RES - 1, Math.floor(((dx + 12.4) / 24.8) * COVER_RES)));
          const cy = Math.max(0, Math.min(COVER_RES - 1, Math.floor(((dy + 12.4) / 24.8) * COVER_RES)));
          const idx = (cy * COVER_RES + cx) * 4;
          color = `rgb(${coverData[idx]},${coverData[idx + 1]},${coverData[idx + 2]})`;
        } else {
          // Classic Minecraft "Cat / Diorama" two-tone pixel label when no song art is loaded
          if (dx < -2 && dy < -2 && r > 6 && r < 10) {
            color = rimLight;
          } else if (Math.floor(r) % 3 === 0) {
            color = labelAlt;
          } else {
            color = rimBase;
          }
        }
      } else if (r > 1.65) {
        // Spindle hole dark pixel bevel
        color = '#0b0e14';
      } else if (r > 0.8) {
        // Hollow turntable center hole
        color = '#06080d';
      } else {
        // Metallic turntable center spindle pin
        color = '#cbd5e1';
      }

      ctx2d.fillStyle = color;
      ctx2d.fillRect(x, y, 1, 1);
    }
  }
}

// Spawn 16-bit Minecraft Jukebox floating musical note pixel particle while playing
function spawnJukeboxPixelNote() {
  if (!notesLayerEl || !musicState.playing || document.hidden || weWallpaperPaused || document.body.classList.contains('we-hide-music')) return;
  const noteColors = [musicState.accentHex, '#38bdf8', '#facc15', '#f472b6', '#4ade80'];
  const pickColor = noteColors[Math.floor(Math.random() * noteColors.length)];
  const isDouble = Math.random() < 0.45;
  const xPct = 18 + Math.random() * 64;

  const spriteSvg = isDouble
    ? `<svg viewBox="0 0 9 9" width="14" height="14" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="1" width="6" height="2" fill="${pickColor}"/><rect x="3" y="3" width="1" height="4" fill="${pickColor}"/><rect x="8" y="3" width="1" height="4" fill="${pickColor}"/><rect x="1" y="6" width="3" height="2" fill="${pickColor}"/><rect x="6" y="6" width="3" height="2" fill="${pickColor}"/></svg>`
    : `<svg viewBox="0 0 7 9" width="12" height="14" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="1" width="1" height="6" fill="${pickColor}"/><rect x="4" y="1" width="2" height="2" fill="${pickColor}"/><rect x="5" y="3" width="1" height="1" fill="${pickColor}"/><rect x="1" y="6" width="3" height="2" fill="${pickColor}"/></svg>`;

  const el = document.createElement('span');
  el.className = 'we-music-note-particle';
  el.style.left = `${xPct.toFixed(1)}%`;
  el.innerHTML = spriteSvg;
  notesLayerEl.appendChild(el);
  setTimeout(() => el.remove(), 2450);
}
setInterval(spawnJukeboxPixelNote, 1850);

function loadMusicCoverArt(src, key, fallbackAccentHex = null) {
  if (!src) {
    musicState.coverKey = '';
    musicState.coverImg = null;
    drawMinecraftPixelDisc(null, parseHexToRgb(fallbackAccentHex) || [74, 222, 128]);
    return;
  }
  if (key && key === musicState.coverKey && musicState.coverImg) return;
  musicState.coverKey = key || src.slice(0, 64);

  if (typeof Image === 'undefined') {
    drawMinecraftPixelDisc(null, parseHexToRgb(fallbackAccentHex) || [74, 222, 128]);
    return;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    musicState.coverImg = img;
    const hintRgb = parseHexToRgb(fallbackAccentHex);
    drawMinecraftPixelDisc(img, hintRgb || musicState.accentRgb);
  };
  img.onerror = () => {
    musicState.coverImg = null;
    drawMinecraftPixelDisc(null, parseHexToRgb(fallbackAccentHex) || [74, 222, 128]);
  };
  img.src = src;
}

function renderMusicPlayerUI() {
  musicWidgetEl.classList.toggle('is-playing', Boolean(musicState.playing));
  musicWidgetEl.classList.toggle('is-compact', Boolean(weSettings.musicCompact));

  const sourceEl = document.getElementById('weMusicSourceText');
  const titleEl = document.getElementById('weMusicTitle');
  const artistEl = document.getElementById('weMusicArtist');
  const playBtn = document.getElementById('weMusicPlayBtn');

  const appLabel = formatFriendlyMediaSource(musicState.sourceApp);
  if (sourceEl) {
    if (musicState.active && musicState.title) {
      sourceEl.textContent = `${appLabel} · ${musicState.playing ? L('ÇALIYOR', 'PLAYING') : L('DURAKLATILDI', 'PAUSED')}`;
    } else {
      sourceEl.textContent = L('MÜZİK ÇALAR · HAZIR', 'MUSIC PLAYER · IDLE');
    }
  }

  if (titleEl) {
    titleEl.textContent = musicState.title || L('Şarkı bekleniyor', 'Nothing playing');
    titleEl.title = musicState.title || '';
  }
  if (artistEl) {
    const sub = musicState.artist || musicState.album || (musicState.active ? appLabel : L('Spotify veya tarayıcıda müzik aç', 'Play music in Spotify or browser'));
    artistEl.textContent = sub;
    artistEl.title = sub;
  }
  if (playBtn) {
    playBtn.innerHTML = musicState.playing ? MUSIC_SVGS.pause : MUSIC_SVGS.play;
    playBtn.setAttribute('aria-label', musicState.playing ? L('Duraklat', 'Pause') : L('Oynat', 'Play'));
  }

  renderMusicTimelineUI();
}

function renderMusicTimelineUI() {
  const fillEl = document.getElementById('weMusicProgressFill');
  const timeEl = document.getElementById('weMusicTimeText');
  let pos = Number(musicState.position) || 0;
  const dur = Number(musicState.duration) || 0;
  if (musicState.playing && dur > 0) {
    const elapsedSec = (Date.now() - musicState.lastPositionTickMs) / 1000;
    if (elapsedSec > 0 && elapsedSec < 3600) {
      pos = Math.min(dur, pos + elapsedSec);
    }
  }
  const pct = dur > 0 ? Math.max(0, Math.min(100, (pos / dur) * 100)) : 0;
  if (fillEl) fillEl.style.width = `${pct.toFixed(1)}%`;
  if (timeEl) {
    timeEl.textContent = dur > 0 ? `${formatTrackTime(pos)} / ${formatTrackTime(dur)}` : formatTrackTime(pos);
  }
}
setInterval(() => {
  if (!weWallpaperPaused && !document.hidden && weSettings.showMusic && musicState.playing && musicState.duration > 0) renderMusicTimelineUI();
}, 1000);

async function sendDesktopMediaControl(action) {
  try {
    if (action === 'playpause') {
      musicState.playing = !musicState.playing;
      musicState.lastPositionTickMs = Date.now();
      renderMusicPlayerUI();
    }
    await fetch(`${BRIDGE_BASE_URL}/api/desktop/media/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
  } catch {
    showDesktopToast('Müzik kontrolü için yerel masaüstü köprüsünün çalışması gerekir.');
  }
}

document.getElementById('weMusicPlayBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  sendDesktopMediaControl('playpause');
});
document.getElementById('weMusicPrevBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  sendDesktopMediaControl('prev');
});
document.getElementById('weMusicNextBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  sendDesktopMediaControl('next');
});
document.getElementById('weMusicPlatterBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  sendDesktopMediaControl('playpause');
});

function setMusicCompactMode(compact) {
  weSettings.musicCompact = Boolean(compact);
  markInAppSettingsModified();
  lsSet(WE_SETTINGS_STORAGE_KEY, weSettings);
  if (typeof window.__weFlushUserStateSync === 'function') window.__weFlushUserStateSync();
  renderMusicPlayerUI();
  window.__weGlassRectsDirty = true;
  if (typeof window.__weTrackGlassTransition === 'function') window.__weTrackGlassTransition(380);
  repaintGlassNow();
}

musicWidgetEl.addEventListener('transitionend', (e) => {
  if (e.target === musicWidgetEl && (e.propertyName === 'width' || e.propertyName === 'padding')) {
    repaintGlassNow();
  }
});

document.getElementById('weMusicCompactToggleBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  setMusicCompactMode(true);
});
document.getElementById('weMusicCompactExpandBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  setMusicCompactMode(false);
});

// Source 1: Local Desktop Bridge Windows GSMTC Media Events (Works for Spotify, Chrome, Edge, VLC, etc.)
window.__weOnBridgeMediaEvent = function handleBridgeMediaUpdate(media) {
  if (!media || typeof media !== 'object') return;
  musicState.active = Boolean(media.active);
  musicState.playing = Boolean(media.playing);
  if (typeof media.title === 'string') musicState.title = media.title;
  if (typeof media.artist === 'string') musicState.artist = media.artist;
  if (typeof media.album === 'string') musicState.album = media.album;
  if (typeof media.sourceApp === 'string') musicState.sourceApp = media.sourceApp;
  if (Number.isFinite(Number(media.position))) {
    musicState.position = Number(media.position);
    musicState.lastPositionTickMs = Date.now();
  }
  if (Number.isFinite(Number(media.duration))) {
    musicState.duration = Number(media.duration);
  }

  if (media.hasThumbnail) {
    const rev = Number(media.thumbnailRev) || 0;
    if (rev !== musicState.bridgeThumbRev) {
      musicState.bridgeThumbRev = rev;
      loadMusicCoverArt(`${BRIDGE_BASE_URL}/api/desktop/media/thumbnail?rev=${rev}`, `bridge-${rev}`);
    }
  } else if (!musicState.weMediaActive && !media.hasThumbnail) {
    musicState.bridgeThumbRev = -1;
    loadMusicCoverArt(null, '');
  }

  renderMusicPlayerUI();
};

window.__wePollBridgeMediaStatus = async function pollBridgeMediaStatus() {
  try {
    const res = await fetch(`${BRIDGE_BASE_URL}/api/desktop/media/status`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (data?.status === 'ok' && data.media) {
      window.__weOnBridgeMediaEvent(data.media);
    }
  } catch {}
};

// Source 2: Official Wallpaper Engine Media Integration API (instant push + album colors)
if (typeof window.wallpaperRegisterMediaStatusListener === 'function') {
  try {
    window.wallpaperRegisterMediaStatusListener((event) => {
      musicState.weMediaActive = Boolean(event?.enabled);
    });
  } catch {}
}
if (typeof window.wallpaperRegisterMediaPropertiesListener === 'function') {
  try {
    window.wallpaperRegisterMediaPropertiesListener((event) => {
      if (!event) return;
      musicState.weMediaActive = true;
      musicState.active = Boolean(event.title || event.artist);
      musicState.title = String(event.title || '');
      musicState.artist = String(event.artist || '');
      musicState.album = String(event.albumTitle || event.album || '');
      if (Number.isFinite(Number(event.duration)) && Number(event.duration) > 0) {
        musicState.duration = Number(event.duration);
      }
      renderMusicPlayerUI();
    });
  } catch {}
}
if (typeof window.wallpaperRegisterMediaThumbnailListener === 'function') {
  try {
    window.wallpaperRegisterMediaThumbnailListener((event) => {
      if (!event) return;
      const thumb = String(event.thumbnail || '');
      const primaryColor = String(event.primaryColor || '');
      if (thumb) {
        loadMusicCoverArt(thumb, `we-${thumb.slice(0, 48)}-${thumb.length}`, primaryColor);
      } else {
        loadMusicCoverArt(null, '', primaryColor);
      }
    });
  } catch {}
}
if (typeof window.wallpaperRegisterMediaPlaybackListener === 'function') {
  try {
    window.wallpaperRegisterMediaPlaybackListener((event) => {
      if (!event) return;
      const playingVal = typeof window.wallpaperMediaIntegration?.PLAYBACK_PLAYING === 'number'
        ? window.wallpaperMediaIntegration.PLAYBACK_PLAYING
        : 1;
      musicState.playing = Number(event.state) === playingVal;
      musicState.lastPositionTickMs = Date.now();
      renderMusicPlayerUI();
    });
  } catch {}
}
if (typeof window.wallpaperRegisterMediaTimelineListener === 'function') {
  try {
    window.wallpaperRegisterMediaTimelineListener((event) => {
      if (!event) return;
      if (Number.isFinite(Number(event.position))) {
        musicState.position = Number(event.position);
        musicState.lastPositionTickMs = Date.now();
      }
      if (Number.isFinite(Number(event.duration))) {
        musicState.duration = Number(event.duration);
      }
      renderMusicTimelineUI();
    });
  } catch {}
}

// Initial draw of classic Minecraft Pixel Disc & UI state
drawMinecraftPixelDisc(null, [74, 222, 128]);
renderMusicPlayerUI();
if (bridgeOnline) window.__wePollBridgeMediaStatus();

// ============================================================================
// 15. TRUE OPTICAL LIQUID GLASS TOP-BAR PILLS, OPENED POPOVER GLASS PLATE &
//     FRAMELESS 16-BIT PIXEL-ART HABITAT SPRITES
//     - Upgrades top-bar widget buttons AND opened widget popover menus to true
//       1:1 refracting Optical Liquid Glass (<canvas class="glass-lens">) with
//       a calibrated smoked readability scrim.
//     - Renders bold, unmistakable, frameless 16x16 pixel-art sprites for all
//       8 living habitats in both the Habitat Picker and the top-left pill!
// ============================================================================
function upgradeTopBarToLiquidGlass() {
  const headerPills = document.querySelectorAll('.main-header .optical-pill');
  headerPills.forEach((pill) => {
    if (!pill || pill.classList.contains('we-liquid-pill')) return;
    pill.classList.add('optical-glass', 'we-liquid-pill');
    if (!pill.querySelector('canvas.glass-lens')) {
      const lens = document.createElement('canvas');
      lens.className = 'glass-lens';
      lens.setAttribute('aria-hidden', 'true');
      pill.prepend(lens);
    }
  });
}
upgradeTopBarToLiquidGlass();

// Fixed 1:1 Optical Liquid Glass plate positioned directly behind any open .popover-panel
const wePopoverGlassPlate = document.createElement('div');
wePopoverGlassPlate.id = 'wePopoverGlassPlate';
wePopoverGlassPlate.className = 'optical-glass we-popover-glass-plate';
wePopoverGlassPlate.setAttribute('aria-hidden', 'true');
const wePopoverGlassLens = document.createElement('canvas');
wePopoverGlassLens.className = 'glass-lens';
wePopoverGlassLens.setAttribute('aria-hidden', 'true');
wePopoverGlassPlate.appendChild(wePopoverGlassLens);
document.body.appendChild(wePopoverGlassPlate);

let popoverGlassHideTimer = null;
let popoverGlassTrackRaf = null;
let popoverGlassTrackEnd = 0;
let lastPopoverPlateRectKey = '';

function syncPopoverGlassPlateNow() {
  const openPanel = document.querySelector('.popover-panel.open');
  if (!openPanel || document.body.classList.contains('zen-active')) {
    if (wePopoverGlassPlate.classList.contains('is-visible')) {
      wePopoverGlassPlate.classList.remove('is-visible');
      wePopoverGlassPlate.style.setProperty('--mouse-x', '-200px');
      wePopoverGlassPlate.style.setProperty('--mouse-y', '-200px');
      window.__weGlassRectsDirty = true;
      if (popoverGlassHideTimer) clearTimeout(popoverGlassHideTimer);
      popoverGlassHideTimer = setTimeout(() => {
        if (!document.querySelector('.popover-panel.open')) {
          wePopoverGlassPlate.style.width = '0px';
          wePopoverGlassPlate.style.height = '0px';
          lastPopoverPlateRectKey = '';
          window.__weGlassRectsDirty = true;
        }
      }, 230);
    }
    return;
  }

  if (popoverGlassHideTimer) {
    clearTimeout(popoverGlassHideTimer);
    popoverGlassHideTimer = null;
  }

  const rect = openPanel.getBoundingClientRect();
  if (rect.width < 8 || rect.height < 8) return;

  const key = `${rect.left.toFixed(1)}|${rect.top.toFixed(1)}|${rect.width.toFixed(1)}|${rect.height.toFixed(1)}`;
  if (key !== lastPopoverPlateRectKey) {
    lastPopoverPlateRectKey = key;
    wePopoverGlassPlate.style.left = `${rect.left.toFixed(1)}px`;
    wePopoverGlassPlate.style.top = `${rect.top.toFixed(1)}px`;
    wePopoverGlassPlate.style.width = `${rect.width.toFixed(1)}px`;
    wePopoverGlassPlate.style.height = `${rect.height.toFixed(1)}px`;
    window.__weGlassRectsDirty = true;
  }
  if (!wePopoverGlassPlate.classList.contains('is-visible')) {
    wePopoverGlassPlate.classList.add('is-visible');
    window.__weGlassRectsDirty = true;
  }
}
window.__weSyncPopoverGlassPlate = syncPopoverGlassPlateNow;

function startPopoverGlassTransitionTrack(durationMs = 300) {
  popoverGlassTrackEnd = performance.now() + durationMs;
  if (popoverGlassTrackRaf) return;
  const tick = () => {
    syncPopoverGlassPlateNow();
    if (typeof updateOpticalLiquidGlass === 'function') updateOpticalLiquidGlass();
    if (performance.now() < popoverGlassTrackEnd) {
      popoverGlassTrackRaf = requestAnimationFrame(tick);
    } else {
      popoverGlassTrackRaf = null;
    }
  };
  popoverGlassTrackRaf = requestAnimationFrame(tick);
}

// Track open/close class changes on every popover so the Liquid Glass plate glides smoothly with it
if (typeof MutationObserver === 'function') {
  const popoverClassObserver = new MutationObserver(() => {
    syncPopoverGlassPlateNow();
    startPopoverGlassTransitionTrack(300);
  });
  document.querySelectorAll('.popover-panel').forEach((panel) => {
    popoverClassObserver.observe(panel, { attributes: true, attributeFilter: ['class'] });
  });
}

// Forward pointer sheen coordinates into #wePopoverGlassPlate while hovering an open menu
document.addEventListener('pointermove', (e) => {
  if (!wePopoverGlassPlate.classList.contains('is-visible')) return;
  const target = e.target instanceof Element ? e.target.closest('.popover-panel.open') : null;
  if (!target) {
    wePopoverGlassPlate.style.setProperty('--mouse-x', '-200px');
    wePopoverGlassPlate.style.setProperty('--mouse-y', '-200px');
    return;
  }
  const rect = wePopoverGlassPlate.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return;
  wePopoverGlassPlate.style.setProperty('--mouse-x', `${(e.clientX - rect.left).toFixed(1)}px`);
  wePopoverGlassPlate.style.setProperty('--mouse-y', `${(e.clientY - rect.top).toFixed(1)}px`);
}, { passive: true });

window.addEventListener('resize', syncPopoverGlassPlateNow, { passive: true });
repaintGlassNow();

const HABITAT_PIXEL_SPRITES = {
  // 1. Çayır & Bal Arıları — Iconic plump striped honeybee with crisp dark outline & twin sky-white wings
  bees: {
    pal: { W: '#f0f9ff', B: '#bae6fd', Y: '#fde047', O: '#f59e0b', K: '#18181b' },
    grid: [
      '................',
      '................',
      '..K..WW..WW.....',
      '...KWBBWWBBW....',
      '....WBBWWBBW....',
      '...KKKKKKKKKK...',
      '..KYYYYKKYYKKK..',
      '.KYKWYYKKYYKKYK.',
      '.KYKKYYKKYYKKYKK',
      '.KYYYYOKKYYKKYK.',
      '..KOOOOKKOOKKK..',
      '...KKKKKKKKKK...',
      '.....K....K.....',
      '................',
      '................',
      '................',
    ],
  },
  // 2. Halfmoon Betta Akvaryumu — Classic cyan Betta fish facing left with waist notch & wide violet-pink halfmoon tail
  betta: {
    pal: { C: '#38bdf8', L: '#bae6fd', D: '#0284c7', V: '#a855f7', P: '#f0abfc', K: '#0f172a', W: '#ffffff' },
    grid: [
      '................',
      '.....PPP........',
      '....PVVVP...PPP.',
      '....PVVVPP.PVVPP',
      '...CCCVVP.PVVVPP',
      '..CCLLCCCPVVVVVP',
      '.CCKWLLCCCVVVVVP',
      'CCCCCLLCCCVVVVVP',
      '.CCCCDDCCCVVVVVP',
      '..CCDDDDCPVVVVVP',
      '....DDVVP.PVVVPP',
      '.....PVVPP.PVVPP',
      '......PPP...PPP.',
      '................',
      '................',
      '................',
    ],
  },
  // 3. Sazlık & İmparator Yusufçuk — Unmistakable top-down emerald dragonfly with 4 wide translucent wings & slender tail
  dragonfly: {
    pal: { W: '#f0f9ff', B: '#a7f3d0', E: '#34d399', T: '#0d9488', C: '#67e8f9', K: '#064e3b' },
    grid: [
      '................',
      '......C..C......',
      '......CEEC......',
      '.WWWWW.EE.WWWWW.',
      'WBBBBBWEEWBBBBBW',
      '.WWWWW.TT.WWWWW.',
      '..WWWW.EE.WWWW..',
      '.WBBBBWTTWBBBBW.',
      '..WWWW.EE.WWWW..',
      '.......TT.......',
      '.......EE.......',
      '.......TT.......',
      '.......EE.......',
      '.......TT.......',
      '.......KK.......',
      '................',
    ],
  },
  // 4. Botanik Bahçesi & Kelebekler — Bold symmetric violet & rose butterfly with white spots & antennae
  butterfly: {
    pal: { K: '#3b0764', B: '#1e1b4b', V: '#c084fc', M: '#f472b6', P: '#a855f7', L: '#ffffff' },
    grid: [
      '................',
      '....K......K....',
      '.KKK.K....K.KKK.',
      'KVVVK.K..K.KVVVK',
      'KVLMVK.BB.KVMLVK',
      'KVMMMVKBBKVMMMVK',
      'KVVMMVKBBKVMMVVK',
      '.KPPPVKBBKVPPPK.',
      '..KKKKKBBKKKKK..',
      '.KPPPPKBBKPPPPK.',
      '.KVVLMKBBKMLVVK.',
      '.KVVVVKBBKVVVVK.',
      '..KKKK.BB.KKKK..',
      '.......BB.......',
      '................',
      '................',
    ],
  },
  // 5. Mercan Lagünü & Denizanaları — Glowing magenta-pink dome bell with glass highlight & 4 wavy tentacles
  jellyfish: {
    pal: { W: '#ffffff', L: '#f5d0fe', M: '#e879f9', D: '#a21caf', P: '#c084fc', C: '#38bdf8' },
    grid: [
      '................',
      '.....MMMMMM.....',
      '...MMLLLLLLMM...',
      '..MLLWWLLLLLLM..',
      '..MLWLLLLLLLLM..',
      '.MLLLLLLLLLLLLM.',
      '.MMMMMMMMMMMMMM.',
      '..DDPPDDDDPPDD..',
      '...P..C..C..P...',
      '..P....CC....P..',
      '...P..C..C..P...',
      '....P.C..C.P....',
      '...P...CC...P...',
      '..P...C..C...P..',
      '......C..C......',
      '................',
    ],
  },
  // 6. Kyoto Zen Bahçesi & Koi Göleti — Graceful S-curved snow-white Kohaku Koi with vermilion spots & wide side fins
  koi: {
    pal: { W: '#ffffff', S: '#cbd5e1', R: '#ef4444', O: '#fb923c', K: '#0f172a' },
    grid: [
      '................',
      '.....WWW........',
      '....WWRWW.......',
      '...WKWRWKW......',
      '...WWWWWWW......',
      '.SSWWRORWWSS....',
      '.SSWWRRRWWWSS...',
      '....WWWWWWW.....',
      '.....WWWORWW....',
      '......WWRRWW....',
      '.......WWWWW....',
      '........WWWW....',
      '........WWSWW...',
      '.......WWS..WW..',
      '.......WW...WW..',
      '................',
    ],
  },
  // 7. Yağmur Ormanı & Renkli Papağanlar — Scarlet Macaw profile with hooked ivory beak, white cheek & gold-blue wing
  rainforest: {
    pal: { R: '#ef4444', Y: '#facc15', B: '#3b82f6', C: '#fef3c7', W: '#ffffff', K: '#0f172a' },
    grid: [
      '................',
      '.....RRRRR......',
      '....RRRRRRR.....',
      '..CCRWWWRRRR....',
      '.CCCRWKWRRRR....',
      '.CKK.WWWRRRRR...',
      '..K..RRRRRRRR...',
      '.....RRRYYYYR...',
      '.....RRRYYYYBB..',
      '......RRRBBBB...',
      '......RRRBBBB...',
      '.......RRBBBBB..',
      '.......RR..BBBB.',
      '........R...BBB.',
      '.............BB.',
      '................',
    ],
  },
  // 8. Kuzey Işıkları & Kutup Tilkisi — Iconic snow-white Arctic Fox face with pointed rosy ears, frosty cheeks & button nose
  'arctic-aurora': {
    pal: { W: '#ffffff', C: '#bae6fd', P: '#f9a8d4', K: '#0f172a' },
    grid: [
      '................',
      '..W..........W..',
      '..WW........WW..',
      '..WPW......WPW..',
      '..WPPW....WPPW..',
      '..WWWWWWWWWWWW..',
      '.WWWWWWWWWWWWWW.',
      'CWWWKWWWWWWKWWWC',
      'CWWKKWWWWWWKKWWC',
      '.CWWWWWWWWWWWWC.',
      '..CCWWWWWWWWCC..',
      '....CWWKKWWC....',
      '.....CWKKWC.....',
      '......CCCC......',
      '................',
      '................',
    ],
  },
};

function pxHabitatIcon(habitatId, size = 26) {
  const spec = HABITAT_PIXEL_SPRITES[habitatId] || HABITAT_PIXEL_SPRITES.bees;
  const { pal, grid } = spec;
  let rects = '';
  grid.forEach((row, y) => {
    let x = 0;
    while (x < 16) {
      const ch = row[x];
      if (!ch || ch === '.' || !pal[ch]) {
        x++;
        continue;
      }
      let end = x;
      while (end < 16 && row[end] === ch) end++;
      rects += `<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${pal[ch]}"/>`;
      x = end;
    }
  });
  return `<svg class="we-hab-pixel-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${size}" height="${size}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

const HABITAT_EN_TEXT = {
  bees: { name: 'Meadow & Honeybees', hint: 'Click: Nectar & Pollen' },
  betta: { name: 'Halfmoon Betta Tank', hint: 'Click: Bloodworms' },
  dragonfly: { name: 'Marsh & Emperor Dragonfly', hint: 'Click: Water Fly' },
  butterfly: { name: 'Botanical Garden & Butterflies', hint: 'Click: Floating Blossom' },
  jellyfish: { name: 'Coral Lagoon & Jellyfish', hint: 'Click: Bioluminescent Plankton' },
  koi: { name: 'Kyoto Zen & Koi Pond', hint: 'Click: Floating Koi Pellet' },
  rainforest: { name: 'Rainforest & Macaws', hint: 'Click: Tropical Fruit' },
  'arctic-aurora': { name: 'Northern Lights & Arctic Fox', hint: 'Click: Golden Cloudberries' },
};

function getHabitatDisplay(hab) {
  if (!hab) return { name: '', hint: '' };
  if (isEn() && HABITAT_EN_TEXT[hab.id]) return HABITAT_EN_TEXT[hab.id];
  return { name: hab.name || '', hint: hab.hint || '' };
}

function syncTopBarHabitatPixelIcon(hab) {
  const dot = document.getElementById('habitatDot');
  if (dot && hab) {
    dot.classList.add('we-hab-pill-icon');
    dot.style.backgroundColor = 'transparent';
    dot.innerHTML = pxHabitatIcon(hab.id, 20);
  }
  if (hab) {
    const disp = getHabitatDisplay(hab);
    const nameEl = document.getElementById('habitatNameLabel');
    const hintEl = document.getElementById('habitatFeedHint');
    if (nameEl) nameEl.textContent = disp.name;
    if (hintEl) hintEl.textContent = disp.hint;
  }
}

window.__weCustomRenderHabitatMenu = function renderPixelArtHabitatMenu() {
  if (!habitatListContainer) return;
  habitatListContainer.innerHTML = '';
  const isPinned = Boolean(pinnedHabitatId);
  if (pinHabitatText) pinHabitatText.textContent = isPinned ? L('Sabitlendi', 'Pinned') : L('Rastgele', 'Random');
  if (pinHabitatBtn) {
    pinHabitatBtn.className = isPinned
      ? 'px-2.5 py-1 rounded-xl text-[11px] font-medium bg-amber-400/20 border border-amber-300/40 text-amber-200 flex items-center gap-1.5 transition'
      : 'px-2.5 py-1 rounded-xl text-[11px] font-medium bg-white/[0.06] hover:bg-white/15 border border-white/12 text-white/75 flex items-center gap-1.5 transition';
  }

  HABITATS.forEach((h, idx) => {
    const active = idx === currentHabitatIdx;
    const disp = getHabitatDisplay(h);
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `w-full px-2.5 py-2 rounded-2xl flex items-center justify-between text-left transition ${active ? 'we-hab-row-active bg-white/15 border border-white/25 text-white' : 'hover:bg-white/[0.07] border border-transparent text-white/80 hover:text-white'}`;
    if (Array.isArray(h.rgb)) {
      row.style.setProperty('--hab-rgb', h.rgb.join(', '));
    }
    row.setAttribute('aria-pressed', active ? 'true' : 'false');
    if (active) row.setAttribute('aria-current', 'true');
    else row.removeAttribute('aria-current');
    row.innerHTML = `
      <div class="flex items-center gap-3 min-w-0">
        <span class="we-hab-icon-slot">${pxHabitatIcon(h.id, 28)}</span>
        <div class="truncate">
          <div class="text-xs font-medium truncate">${esc(disp.name)}</div>
          <div class="text-[11px] text-white/55 truncate">${esc(disp.hint)}</div>
        </div>
      </div>
      ${active ? `<span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-white/95 shrink-0">${L('Aktif', 'Active')}</span>` : ''}
    `;
    row.addEventListener('click', () => {
      initHabitat(idx);
      if (pinnedHabitatId) {
        setPinnedHabitatId(HABITATS[currentHabitatIdx].id);
        lsPut('diorama_pinned_habitat', pinnedHabitatId);
      }
      window.__weCustomRenderHabitatMenu();
    });
    habitatListContainer.appendChild(row);
  });

  syncTopBarHabitatPixelIcon(HABITATS[currentHabitatIdx]);
};

// Chain habitat change hook so both Biome Audio and the Top-Left Pixel Habitat Icon stay in sync
const prevOnHabitatChanged = window.__weOnHabitatChanged;
window.__weOnHabitatChanged = (hab) => {
  syncTopBarHabitatPixelIcon(hab);
  if (typeof prevOnHabitatChanged === 'function') prevOnHabitatChanged(hab);
};

// Immediately upgrade initial habitat menu & top-left pill icon
window.__weCustomRenderHabitatMenu();
syncTopBarHabitatPixelIcon(HABITATS[currentHabitatIdx]);

// ============================================================================
// 16. DIORAMA SMART CALENDAR — GLOBAL HOLIDAYS (TR/US/UK/DE), IMPORTANT DAYS,
//     INTERACTIVE GLOBAL TEAM PICKER (UP TO 3 CLUBS + 1 NATIONAL TEAM),
//     ACADEMIC/WORK TIMETABLE WITH AUTOMATIC HOLIDAY SKIPPING & FREE-TIME MAP
// ============================================================================
const CAL_SMART_CFG_KEY = 'diorama_calendar_smart_cfg_v1';
const CAL_ROUTINES_KEY = 'diorama_calendar_routines_v1';
const CAL_FIXTURES_CACHE_KEY = 'diorama_calendar_fixtures_cache_v1';

const GLOBAL_LEAGUES_LIST = [
  {
    slug: 'tur.1',
    countryTr: 'Türkiye',
    countryEn: 'Türkiye',
    league: 'Süper Lig',
    fallbackClubs: [
      { id: '432', name: 'Galatasaray', short: 'GS' },
      { id: '436', name: 'Fenerbahçe', short: 'FB' },
      { id: '1895', name: 'Beşiktaş', short: 'BJK' },
      { id: '997', name: 'Trabzonspor', short: 'TS' },
      { id: '7913', name: 'Başakşehir', short: 'IBFK' },
      { id: '439', name: 'Samsunspor', short: 'SAM' },
      { id: '6258', name: 'Göztepe', short: 'GOZ' },
      { id: '3695', name: 'Konyaspor', short: 'KON' },
    ],
  },
  {
    slug: 'eng.1',
    countryTr: 'İngiltere',
    countryEn: 'England',
    league: 'Premier League',
    fallbackClubs: [
      { id: '359', name: 'Arsenal', short: 'ARS' },
      { id: '363', name: 'Chelsea', short: 'CHE' },
      { id: '364', name: 'Liverpool', short: 'LIV' },
      { id: '382', name: 'Manchester City', short: 'MCI' },
      { id: '360', name: 'Manchester United', short: 'MUN' },
      { id: '367', name: 'Tottenham', short: 'TOT' },
      { id: '361', name: 'Newcastle United', short: 'NEW' },
      { id: '362', name: 'Aston Villa', short: 'AVL' },
    ],
  },
  {
    slug: 'esp.1',
    countryTr: 'İspanya',
    countryEn: 'Spain',
    league: 'LaLiga',
    fallbackClubs: [
      { id: '86', name: 'Real Madrid', short: 'RMA' },
      { id: '83', name: 'Barcelona', short: 'BAR' },
      { id: '1068', name: 'Atlético Madrid', short: 'ATM' },
      { id: '93', name: 'Athletic Club', short: 'ATH' },
      { id: '243', name: 'Sevilla', short: 'SEV' },
      { id: '89', name: 'Real Sociedad', short: 'RSO' },
      { id: '102', name: 'Villarreal', short: 'VIL' },
      { id: '244', name: 'Real Betis', short: 'BET' },
    ],
  },
  {
    slug: 'ger.1',
    countryTr: 'Almanya',
    countryEn: 'Germany',
    league: 'Bundesliga',
    fallbackClubs: [
      { id: '132', name: 'Bayern Munich', short: 'BAY' },
      { id: '124', name: 'Borussia Dortmund', short: 'BVB' },
      { id: '131', name: 'Bayer Leverkusen', short: 'B04' },
      { id: '11420', name: 'RB Leipzig', short: 'RBL' },
      { id: '125', name: 'Eintracht Frankfurt', short: 'SGE' },
      { id: '134', name: 'VfB Stuttgart', short: 'VFB' },
    ],
  },
  {
    slug: 'ita.1',
    countryTr: 'İtalya',
    countryEn: 'Italy',
    league: 'Serie A',
    fallbackClubs: [
      { id: '110', name: 'Inter Milan', short: 'INT' },
      { id: '103', name: 'AC Milan', short: 'MIL' },
      { id: '111', name: 'Juventus', short: 'JUV' },
      { id: '114', name: 'Napoli', short: 'NAP' },
      { id: '104', name: 'AS Roma', short: 'ROM' },
      { id: '112', name: 'Lazio', short: 'LAZ' },
      { id: '105', name: 'Atalanta', short: 'ATA' },
    ],
  },
  {
    slug: 'fra.1',
    countryTr: 'Fransa',
    countryEn: 'France',
    league: 'Ligue 1',
    fallbackClubs: [
      { id: '160', name: 'Paris Saint-Germain', short: 'PSG' },
      { id: '176', name: 'Marseille', short: 'OM' },
      { id: '174', name: 'Monaco', short: 'ASM' },
      { id: '167', name: 'Lyon', short: 'OL' },
      { id: '166', name: 'Lille', short: 'LOSC' },
    ],
  },
  {
    slug: 'ned.1',
    countryTr: 'Hollanda',
    countryEn: 'Netherlands',
    league: 'Eredivisie',
    fallbackClubs: [
      { id: '139', name: 'Ajax', short: 'AJA' },
      { id: '148', name: 'PSV Eindhoven', short: 'PSV' },
      { id: '142', name: 'Feyenoord', short: 'FEY' },
      { id: '140', name: 'AZ Alkmaar', short: 'AZ' },
    ],
  },
  {
    slug: 'por.1',
    countryTr: 'Portekiz',
    countryEn: 'Portugal',
    league: 'Primeira Liga',
    fallbackClubs: [
      { id: '1929', name: 'Benfica', short: 'SLB' },
      { id: '437', name: 'FC Porto', short: 'FCP' },
      { id: '2250', name: 'Sporting CP', short: 'SCP' },
      { id: '2994', name: 'Braga', short: 'SCB' },
    ],
  },
  {
    slug: 'usa.1',
    countryTr: 'ABD',
    countryEn: 'USA',
    league: 'MLS',
    fallbackClubs: [
      { id: '20232', name: 'Inter Miami CF', short: 'MIA' },
      { id: '18966', name: 'LAFC', short: 'LAFC' },
      { id: '187', name: 'LA Galaxy', short: 'LA' },
      { id: '17606', name: 'New York City FC', short: 'NYC' },
      { id: '9726', name: 'Seattle Sounders', short: 'SEA' },
    ],
  },
  {
    slug: 'ksa.1',
    countryTr: 'Suudi Arabistan',
    countryEn: 'Saudi Arabia',
    league: 'Pro League',
    fallbackClubs: [
      { id: '929', name: 'Al Hilal', short: 'HIL' },
      { id: '817', name: 'Al Nassr', short: 'NAS' },
      { id: '830', name: 'Al Ittihad', short: 'ITT' },
      { id: '813', name: 'Al Ahli', short: 'AHL' },
    ],
  },
];

const GLOBAL_NATIONAL_TEAMS_LIST = [
  { id: '465', code: 'TR', nameTr: 'Türkiye', nameEn: 'Türkiye' },
  { id: '448', code: 'ENG', nameTr: 'İngiltere', nameEn: 'England' },
  { id: '481', code: 'GER', nameTr: 'Almanya', nameEn: 'Germany' },
  { id: '164', code: 'ESP', nameTr: 'İspanya', nameEn: 'Spain' },
  { id: '478', code: 'FRA', nameTr: 'Fransa', nameEn: 'France' },
  { id: '162', code: 'ITA', nameTr: 'İtalya', nameEn: 'Italy' },
  { id: '449', code: 'NED', nameTr: 'Hollanda', nameEn: 'Netherlands' },
  { id: '482', code: 'POR', nameTr: 'Portekiz', nameEn: 'Portugal' },
  { id: '205', code: 'BRA', nameTr: 'Brezilya', nameEn: 'Brazil' },
  { id: '202', code: 'ARG', nameTr: 'Arjantin', nameEn: 'Argentina' },
  { id: '660', code: 'USA', nameTr: 'ABD', nameEn: 'United States' },
  { id: '627', code: 'JPN', nameTr: 'Japonya', nameEn: 'Japan' },
  { id: '451', code: 'KOR', nameTr: 'Güney Kore', nameEn: 'South Korea' },
  { id: '477', code: 'CRO', nameTr: 'Hırvatistan', nameEn: 'Croatia' },
  { id: '459', code: 'BEL', nameTr: 'Belçika', nameEn: 'Belgium' },
  { id: '2869', code: 'MAR', nameTr: 'Fas', nameEn: 'Morocco' },
  { id: '203', code: 'MEX', nameTr: 'Meksika', nameEn: 'Mexico' },
  { id: '206', code: 'CAN', nameTr: 'Kanada', nameEn: 'Canada' },
  { id: '471', code: 'POL', nameTr: 'Polonya', nameEn: 'Poland' },
  { id: '475', code: 'SUI', nameTr: 'İsviçre', nameEn: 'Switzerland' },
  { id: '474', code: 'AUT', nameTr: 'Avusturya', nameEn: 'Austria' },
  { id: '479', code: 'DEN', nameTr: 'Danimarka', nameEn: 'Denmark' },
  { id: '466', code: 'SWE', nameTr: 'İsveç', nameEn: 'Sweden' },
  { id: '464', code: 'NOR', nameTr: 'Norveç', nameEn: 'Norway' },
];

const LEGACY_CLUB_MAP = {
  gs: { id: '432', name: 'Galatasaray', short: 'GS', league: 'Süper Lig', leagueSlug: 'tur.1' },
  fb: { id: '436', name: 'Fenerbahçe', short: 'FB', league: 'Süper Lig', leagueSlug: 'tur.1' },
  bjk: { id: '1895', name: 'Beşiktaş', short: 'BJK', league: 'Süper Lig', leagueSlug: 'tur.1' },
  ts: { id: '997', name: 'Trabzonspor', short: 'TS', league: 'Süper Lig', leagueSlug: 'tur.1' },
};

const DEFAULT_CAL_SMART_CFG = {
  holidayCountry: 'TR', // 'TR' | 'US' | 'UK' | 'DE' | 'none'
  showHolidays: true,
  showSpecialDays: true,
  nationalTeam: { id: '465', code: 'TR', nameTr: 'Türkiye', nameEn: 'Türkiye' },
  clubs: [], // Up to 3 clubs
};

const ISO_DAY_SHORT_TR = { 1: 'Pzt', 2: 'Sal', 3: 'Çar', 4: 'Per', 5: 'Cum', 6: 'Cmt', 7: 'Paz' };
const ISO_DAY_SHORT_EN = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun' };
const getIsoDayShort = (d) => (isEn() ? ISO_DAY_SHORT_EN[d] : ISO_DAY_SHORT_TR[d]) || '';

// Official Fixed Turkish Holidays (skip school/work)
const TR_FIXED_HOLIDAYS = {
  '01-01': ['Yılbaşı', "New Year's Day"],
  '04-23': ['23 Nisan Ulusal Egemenlik ve Çocuk Bayramı', "National Sovereignty & Children's Day"],
  '05-01': ['1 Mayıs Emek ve Dayanışma Günü', 'Labor & Solidarity Day'],
  '05-19': ["19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı", 'Youth & Sports Day'],
  '07-15': ['15 Temmuz Demokrasi ve Millî Birlik Günü', 'Democracy & National Unity Day'],
  '08-30': ['30 Ağustos Zafer Bayramı', 'Victory Day'],
  '10-29': ['29 Ekim Cumhuriyet Bayramı', 'Republic Day'],
};

// Official Diyanet Religious Holidays (2025–2030, full official holiday days skip school/work)
const TR_RELIGIOUS_HOLIDAYS = {
  '2025-03-30': ['Ramazan Bayramı 1. Gün', 'Eid al-Fitr (Day 1)'],
  '2025-03-31': ['Ramazan Bayramı 2. Gün', 'Eid al-Fitr (Day 2)'],
  '2025-04-01': ['Ramazan Bayramı 3. Gün', 'Eid al-Fitr (Day 3)'],
  '2025-06-06': ['Kurban Bayramı 1. Gün', 'Eid al-Adha (Day 1)'],
  '2025-06-07': ['Kurban Bayramı 2. Gün', 'Eid al-Adha (Day 2)'],
  '2025-06-08': ['Kurban Bayramı 3. Gün', 'Eid al-Adha (Day 3)'],
  '2025-06-09': ['Kurban Bayramı 4. Gün', 'Eid al-Adha (Day 4)'],
  '2026-03-20': ['Ramazan Bayramı 1. Gün', 'Eid al-Fitr (Day 1)'],
  '2026-03-21': ['Ramazan Bayramı 2. Gün', 'Eid al-Fitr (Day 2)'],
  '2026-03-22': ['Ramazan Bayramı 3. Gün', 'Eid al-Fitr (Day 3)'],
  '2026-05-27': ['Kurban Bayramı 1. Gün', 'Eid al-Adha (Day 1)'],
  '2026-05-28': ['Kurban Bayramı 2. Gün', 'Eid al-Adha (Day 2)'],
  '2026-05-29': ['Kurban Bayramı 3. Gün', 'Eid al-Adha (Day 3)'],
  '2026-05-30': ['Kurban Bayramı 4. Gün', 'Eid al-Adha (Day 4)'],
  '2027-03-09': ['Ramazan Bayramı 1. Gün', 'Eid al-Fitr (Day 1)'],
  '2027-03-10': ['Ramazan Bayramı 2. Gün', 'Eid al-Fitr (Day 2)'],
  '2027-03-11': ['Ramazan Bayramı 3. Gün', 'Eid al-Fitr (Day 3)'],
  '2027-05-16': ['Kurban Bayramı 1. Gün', 'Eid al-Adha (Day 1)'],
  '2027-05-17': ['Kurban Bayramı 2. Gün', 'Eid al-Adha (Day 2)'],
  '2027-05-18': ['Kurban Bayramı 3. Gün', 'Eid al-Adha (Day 3)'],
  '2027-05-19': ['Kurban Bayramı 4. Gün', 'Eid al-Adha (Day 4)'],
  '2028-02-26': ['Ramazan Bayramı 1. Gün', 'Eid al-Fitr (Day 1)'],
  '2028-02-27': ['Ramazan Bayramı 2. Gün', 'Eid al-Fitr (Day 2)'],
  '2028-02-28': ['Ramazan Bayramı 3. Gün', 'Eid al-Fitr (Day 3)'],
  '2028-05-05': ['Kurban Bayramı 1. Gün', 'Eid al-Adha (Day 1)'],
  '2028-05-06': ['Kurban Bayramı 2. Gün', 'Eid al-Adha (Day 2)'],
  '2028-05-07': ['Kurban Bayramı 3. Gün', 'Eid al-Adha (Day 3)'],
  '2028-05-08': ['Kurban Bayramı 4. Gün', 'Eid al-Adha (Day 4)'],
  '2029-02-14': ['Ramazan Bayramı 1. Gün', 'Eid al-Fitr (Day 1)'],
  '2029-02-15': ['Ramazan Bayramı 2. Gün', 'Eid al-Fitr (Day 2)'],
  '2029-02-16': ['Ramazan Bayramı 3. Gün', 'Eid al-Fitr (Day 3)'],
  '2029-04-24': ['Kurban Bayramı 1. Gün', 'Eid al-Adha (Day 1)'],
  '2029-04-25': ['Kurban Bayramı 2. Gün', 'Eid al-Adha (Day 2)'],
  '2029-04-26': ['Kurban Bayramı 3. Gün', 'Eid al-Adha (Day 3)'],
  '2029-04-27': ['Kurban Bayramı 4. Gün', 'Eid al-Adha (Day 4)'],
  '2030-02-04': ['Ramazan Bayramı 1. Gün', 'Eid al-Fitr (Day 1)'],
  '2030-02-05': ['Ramazan Bayramı 2. Gün', 'Eid al-Fitr (Day 2)'],
  '2030-02-06': ['Ramazan Bayramı 3. Gün', 'Eid al-Fitr (Day 3)'],
  '2030-04-13': ['Kurban Bayramı 1. Gün', 'Eid al-Adha (Day 1)'],
  '2030-04-14': ['Kurban Bayramı 2. Gün', 'Eid al-Adha (Day 2)'],
  '2030-04-15': ['Kurban Bayramı 3. Gün', 'Eid al-Adha (Day 3)'],
  '2030-04-16': ['Kurban Bayramı 4. Gün', 'Eid al-Adha (Day 4)'],
};

const TR_ARIFE_DAYS = {
  '2025-03-29': ['Ramazan Bayramı Arifesi (Yarım Gün)', 'Eid al-Fitr Eve (Half Day)'],
  '2025-06-05': ['Kurban Bayramı Arifesi (Yarım Gün)', 'Eid al-Adha Eve (Half Day)'],
  '2026-03-19': ['Ramazan Bayramı Arifesi (Yarım Gün)', 'Eid al-Fitr Eve (Half Day)'],
  '2026-05-26': ['Kurban Bayramı Arifesi (Yarım Gün)', 'Eid al-Adha Eve (Half Day)'],
  '2027-03-08': ['Ramazan Bayramı Arifesi (Yarım Gün)', 'Eid al-Fitr Eve (Half Day)'],
  '2027-05-15': ['Kurban Bayramı Arifesi (Yarım Gün)', 'Eid al-Adha Eve (Half Day)'],
  '2028-02-25': ['Ramazan Bayramı Arifesi (Yarım Gün)', 'Eid al-Fitr Eve (Half Day)'],
  '2028-05-04': ['Kurban Bayramı Arifesi (Yarım Gün)', 'Eid al-Adha Eve (Half Day)'],
  '2029-02-13': ['Ramazan Bayramı Arifesi (Yarım Gün)', 'Eid al-Fitr Eve (Half Day)'],
  '2030-02-03': ['Ramazan Bayramı Arifesi (Yarım Gün)', 'Eid al-Fitr Eve (Half Day)'],
  '2030-04-12': ['Kurban Bayramı Arifesi (Yarım Gün)', 'Eid al-Adha Eve (Half Day)'],
};

const TR_SPECIAL_FIXED = {
  '03-08': ['8 Mart Dünya Kadınlar Günü', "International Women's Day"],
  '03-18': ['18 Mart Çanakkale Zaferi ve Şehitleri Anma Günü', 'Çanakkale Victory & Martyrs Day'],
  '10-28': ['Cumhuriyet Bayramı Arifesi (Yarım Gün)', 'Republic Day Eve (Half Day)'],
  '11-10': ["10 Kasım Atatürk'ü Anma Günü", 'Atatürk Memorial Day'],
  '11-24': ['24 Kasım Öğretmenler Günü', "Teachers' Day"],
};

function fmtYmd(year, month1, day) {
  return `${year}-${String(month1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addDaysToYmd(year, month1, day, offsetDays) {
  const dt = new Date(Date.UTC(year, month1 - 1, day + offsetDays));
  return fmtYmd(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

function getNthWeekdayOfMonthKey(year, month1, weekday0Sun, nth) {
  const first = new Date(year, month1 - 1, 1);
  const diff = (weekday0Sun - first.getDay() + 7) % 7;
  const day = 1 + diff + (nth - 1) * 7;
  return fmtYmd(year, month1, day);
}

function getLastWeekdayOfMonthKey(year, month1, weekday0Sun) {
  const last = new Date(year, month1, 0);
  const diff = (last.getDay() - weekday0Sun + 7) % 7;
  return fmtYmd(year, month1, last.getDate() - diff);
}

// Meeus/Jones/Butcher Gregorian Easter algorithm (accurate for all modern years)
function getGregorianEasterYmd(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { year, month, day };
}

function getPublicObservances(dateKeyStr, country = 'TR', lang = window.__weLang) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKeyStr) || country === 'none') {
    return { holidays: [], specials: [] };
  }
  const en = lang === 'en';
  const pick = (pair) => (en ? pair[1] : pair[0]);
  const year = Number(dateKeyStr.slice(0, 4));
  const mmdd = dateKeyStr.slice(5);
  const holidays = [];
  const specials = [];

  if (country === 'TR') {
    if (TR_FIXED_HOLIDAYS[mmdd]) holidays.push(pick(TR_FIXED_HOLIDAYS[mmdd]));
    if (TR_RELIGIOUS_HOLIDAYS[dateKeyStr]) holidays.push(pick(TR_RELIGIOUS_HOLIDAYS[dateKeyStr]));
    if (TR_ARIFE_DAYS[dateKeyStr]) specials.push(pick(TR_ARIFE_DAYS[dateKeyStr]));
    if (TR_SPECIAL_FIXED[mmdd]) specials.push(pick(TR_SPECIAL_FIXED[mmdd]));
    if (dateKeyStr === getNthWeekdayOfMonthKey(year, 5, 0, 2)) specials.push(en ? "Mother's Day" : 'Anneler Günü');
    if (dateKeyStr === getNthWeekdayOfMonthKey(year, 6, 0, 3)) specials.push(en ? "Father's Day" : 'Babalar Günü');
    return { holidays, specials };
  }

  if (country === 'US') {
    if (mmdd === '01-01') holidays.push(en ? "New Year's Day" : 'Yılbaşı');
    if (dateKeyStr === getNthWeekdayOfMonthKey(year, 1, 1, 3)) holidays.push(en ? 'Martin Luther King Jr. Day' : 'Martin Luther King Jr. Günü');
    if (dateKeyStr === getNthWeekdayOfMonthKey(year, 2, 1, 3)) holidays.push(en ? "Presidents' Day" : 'Başkanlar Günü');
    if (dateKeyStr === getLastWeekdayOfMonthKey(year, 5, 1)) holidays.push(en ? 'Memorial Day' : 'Anma Günü (ABD)');
    if (mmdd === '06-19') holidays.push(en ? 'Juneteenth' : 'Juneteenth');
    if (mmdd === '07-04') holidays.push(en ? 'Independence Day' : 'Bağımsızlık Günü (ABD)');
    if (dateKeyStr === getNthWeekdayOfMonthKey(year, 9, 1, 1)) holidays.push(en ? 'Labor Day' : 'İşçi Bayramı (ABD)');
    if (dateKeyStr === getNthWeekdayOfMonthKey(year, 10, 1, 2)) holidays.push(en ? 'Indigenous Peoples / Columbus Day' : 'Kolomb Günü');
    if (mmdd === '11-11') holidays.push(en ? 'Veterans Day' : 'Gaziler Günü');
    if (dateKeyStr === getNthWeekdayOfMonthKey(year, 11, 4, 4)) holidays.push(en ? 'Thanksgiving Day' : 'Şükran Günü');
    if (mmdd === '12-25') holidays.push(en ? 'Christmas Day' : 'Noel');

    if (mmdd === '02-14') specials.push(en ? "Valentine's Day" : 'Sevgililer Günü');
    if (dateKeyStr === getNthWeekdayOfMonthKey(year, 5, 0, 2)) specials.push(en ? "Mother's Day" : 'Anneler Günü');
    if (dateKeyStr === getNthWeekdayOfMonthKey(year, 6, 0, 3)) specials.push(en ? "Father's Day" : 'Babalar Günü');
    if (mmdd === '10-31') specials.push(en ? 'Halloween' : 'Cadılar Bayramı');
    return { holidays, specials };
  }

  if (country === 'UK') {
    const easter = getGregorianEasterYmd(year);
    const goodFri = addDaysToYmd(easter.year, easter.month, easter.day, -2);
    const easterMon = addDaysToYmd(easter.year, easter.month, easter.day, 1);
    if (mmdd === '01-01') holidays.push(en ? "New Year's Day" : 'Yılbaşı');
    if (dateKeyStr === goodFri) holidays.push(en ? 'Good Friday' : 'Kutsal Cuma');
    if (dateKeyStr === easterMon) holidays.push(en ? 'Easter Monday' : 'Paskalya Pazartesisi');
    if (dateKeyStr === getNthWeekdayOfMonthKey(year, 5, 1, 1)) holidays.push(en ? 'Early May Bank Holiday' : 'Mayıs Resmi Tatili (BK)');
    if (dateKeyStr === getLastWeekdayOfMonthKey(year, 5, 1)) holidays.push(en ? 'Spring Bank Holiday' : 'Bahar Tatili (BK)');
    if (dateKeyStr === getLastWeekdayOfMonthKey(year, 8, 1)) holidays.push(en ? 'Summer Bank Holiday' : 'Yaz Tatili (BK)');
    if (mmdd === '12-25') holidays.push(en ? 'Christmas Day' : 'Noel');
    if (mmdd === '12-26') holidays.push(en ? 'Boxing Day' : 'Boxing Day');

    if (mmdd === '02-14') specials.push(en ? "Valentine's Day" : 'Sevgililer Günü');
    if (mmdd === '11-05') specials.push(en ? 'Guy Fawkes Night' : 'Guy Fawkes Gecesi');
    return { holidays, specials };
  }

  if (country === 'DE') {
    const easter = getGregorianEasterYmd(year);
    const goodFri = addDaysToYmd(easter.year, easter.month, easter.day, -2);
    const easterMon = addDaysToYmd(easter.year, easter.month, easter.day, 1);
    const ascension = addDaysToYmd(easter.year, easter.month, easter.day, 39);
    const whitMon = addDaysToYmd(easter.year, easter.month, easter.day, 50);
    if (mmdd === '01-01') holidays.push(en ? "New Year's Day (Neujahr)" : 'Yılbaşı (Neujahr)');
    if (dateKeyStr === goodFri) holidays.push(en ? 'Good Friday (Karfreitag)' : 'Karfreitag');
    if (dateKeyStr === easterMon) holidays.push(en ? 'Easter Monday (Ostermontag)' : 'Ostermontag');
    if (mmdd === '05-01') holidays.push(en ? 'Labour Day (Tag der Arbeit)' : 'İşçi Bayramı (Almanya)');
    if (dateKeyStr === ascension) holidays.push(en ? 'Ascension Day (Christi Himmelfahrt)' : 'Christi Himmelfahrt');
    if (dateKeyStr === whitMon) holidays.push(en ? 'Whit Monday (Pfingstmontag)' : 'Pfingstmontag');
    if (mmdd === '10-03') holidays.push(en ? 'German Unity Day' : 'Alman Birliği Günü');
    if (mmdd === '12-25') holidays.push(en ? 'Christmas Day (1. Weihnachtstag)' : 'Noel 1. Gün');
    if (mmdd === '12-26') holidays.push(en ? 'St. Stephen\'s Day (2. Weihnachtstag)' : 'Noel 2. Gün');
    if (mmdd === '03-08') specials.push(en ? "International Women's Day" : 'Dünya Kadınlar Günü');
    return { holidays, specials };
  }

  return { holidays, specials };
}

function getTurkishObservances(dateKeyStr) {
  return getPublicObservances(dateKeyStr, 'TR', window.__weLang);
}

function parseTimeToMins(timeStr) {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(timeStr || '').trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function formatMinsToTime(totalMins) {
  const clamped = Math.max(0, Math.min(24 * 60, Math.round(totalMins)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatDurationLocalized(totalMins) {
  const mins = Math.max(0, Math.round(totalMins));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (isEn()) {
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  }
  if (h > 0 && m > 0) return `${h}s ${m}dk`;
  if (h > 0) return `${h} saat`;
  return `${m} dk`;
}

function parseFlexibleDateInput(raw) {
  const s = String(raw || '').trim();
  let y; let mo; let d;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  const tr = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(s);
  if (iso) {
    y = Number(iso[1]); mo = Number(iso[2]); d = Number(iso[3]);
  } else if (tr) {
    d = Number(tr[1]); mo = Number(tr[2]); y = Number(tr[3]);
  } else {
    return null;
  }
  const dt = new Date(y, mo - 1, d);
  if (!Number.isFinite(dt.getTime()) || dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    return null;
  }
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function formatIsoToDisplayDate(isoKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(isoKey || ''))) return '';
  if (isEn()) return isoKey;
  return `${isoKey.slice(8, 10)}.${isoKey.slice(5, 7)}.${isoKey.slice(0, 4)}`;
}

function getIsoWeekdayFromKey(dateKeyStr) {
  const dt = new Date(`${dateKeyStr}T12:00:00`);
  const day = dt.getDay();
  return day === 0 ? 7 : day; // 1=Mon .. 7=Sun
}

function getLocalTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Istanbul';
  } catch {
    return 'Europe/Istanbul';
  }
}

function getMatchTzBadge() {
  const tz = getLocalTimeZone();
  if (!isEn() && tz === 'Europe/Istanbul') return 'TSİ';
  return '';
}

function normalizeSmartCalConfig(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const validCountries = ['TR', 'US', 'UK', 'DE', 'none'];
  const holidayCountry = validCountries.includes(String(src.holidayCountry || ''))
    ? String(src.holidayCountry)
    : 'TR';

  // Normalize National Team (1 slot or null; supports seamless migration from legacy showNationalTeam)
  let nationalTeam = null;
  if (src.nationalTeam && typeof src.nationalTeam === 'object' && src.nationalTeam.id) {
    const cleanId = String(src.nationalTeam.id).replace(/[^\d]/g, '');
    const found = GLOBAL_NATIONAL_TEAMS_LIST.find((n) => n.id === cleanId);
    if (found) {
      nationalTeam = { ...found };
    } else if (cleanId) {
      nationalTeam = {
        id: cleanId,
        code: String(src.nationalTeam.code || 'NAT').slice(0, 4).toUpperCase(),
        nameTr: String(src.nationalTeam.nameTr || src.nationalTeam.nameEn || 'Milli Takım').slice(0, 40),
        nameEn: String(src.nationalTeam.nameEn || src.nationalTeam.nameTr || 'National Team').slice(0, 40),
      };
    }
  } else if (src.nationalTeam === null || src.showNationalTeam === false) {
    nationalTeam = null;
  } else {
    nationalTeam = { ...DEFAULT_CAL_SMART_CFG.nationalTeam };
  }

  // Normalize Clubs (up to 3 clubs; supports seamless migration from legacy clubTeam)
  const clubs = [];
  const seenIds = new Set();
  if (Array.isArray(src.clubs)) {
    for (const c of src.clubs) {
      if (!c || typeof c !== 'object') continue;
      const cid = String(c.id || '').replace(/[^\d]/g, '');
      const name = String(c.name || '').trim().slice(0, 48);
      if (!cid || !name || seenIds.has(cid)) continue;
      seenIds.add(cid);
      clubs.push({
        id: cid,
        name,
        short: String(c.short || name.slice(0, 3)).slice(0, 4).toUpperCase(),
        league: String(c.league || '').slice(0, 32),
        leagueSlug: String(c.leagueSlug || ''),
      });
      if (clubs.length >= 3) break;
    }
  } else if (src.clubTeam && LEGACY_CLUB_MAP[String(src.clubTeam)]) {
    clubs.push({ ...LEGACY_CLUB_MAP[String(src.clubTeam)] });
  }

  return {
    holidayCountry,
    showHolidays: src.showHolidays !== false,
    showSpecialDays: src.showSpecialDays !== false,
    nationalTeam,
    clubs,
  };
}

function normalizeCalendarRoutines(raw) {
  if (!Array.isArray(raw)) return [];
  const validCats = ['school', 'work', 'routine'];
  const out = [];
  const seen = new Set();
  for (const item of raw.slice(0, 120)) {
    if (!item || typeof item !== 'object') continue;
    const id = typeof item.id === 'string' && item.id.length >= 4 ? item.id : `rt-${Date.now().toString(36)}-${out.length}`;
    if (seen.has(id)) continue;
    const title = String(item.title || '').trim().slice(0, 80);
    const category = validCats.includes(item.category) ? item.category : 'school';
    const days = Array.isArray(item.days)
      ? [...new Set(item.days.map(Number).filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))].sort((a, b) => a - b)
      : [];
    const startMin = parseTimeToMins(item.startTime);
    const endMin = parseTimeToMins(item.endTime);
    const mode = item.mode === 'permanent' ? 'permanent' : 'range';
    const startDate = mode === 'range' ? parseFlexibleDateInput(item.startDate) : null;
    const endDate = mode === 'range' ? parseFlexibleDateInput(item.endDate) : null;
    if (!title || !days.length || startMin === null || endMin === null || endMin <= startMin) continue;
    if (mode === 'range' && (!startDate || !endDate || endDate < startDate)) continue;
    seen.add(id);
    out.push({
      id,
      title,
      category,
      days,
      startTime: formatMinsToTime(startMin),
      endTime: formatMinsToTime(endMin),
      mode,
      startDate: startDate || '',
      endDate: endDate || '',
      skipHolidays: item.skipHolidays !== false,
    });
  }
  return out;
}

let smartCalConfig = normalizeSmartCalConfig(lsGet(CAL_SMART_CFG_KEY, DEFAULT_CAL_SMART_CFG));
let smartCalRoutines = normalizeCalendarRoutines(lsGet(CAL_ROUTINES_KEY, []));
let smartCalFixtures = (() => {
  const cached = lsGet(CAL_FIXTURES_CACHE_KEY, null);
  return Array.isArray(cached?.fixtures) ? cached.fixtures : [];
})();
let smartCalFixturesFetchedAt = lsGet(CAL_FIXTURES_CACHE_KEY, null)?.fetchedAt || '';
let smartCalActiveTab = 'month'; // 'month' | 'schedule' | 'sports'
let smartCalFixturesLoading = false;

// Interactive Team Picker Drawer State (CEF-safe, zero native <select>)
let activePickerMode = null; // null | 'club' | 'national'
let activePickerLeagueSlug = isEn() ? 'eng.1' : 'tur.1';
let activePickerSearch = '';
const leagueTeamsClientCache = new Map();
let leagueTeamsLoading = false;

function persistSmartCalConfig() {
  smartCalConfig = normalizeSmartCalConfig(smartCalConfig);
  lsSet(CAL_SMART_CFG_KEY, smartCalConfig);
  if (typeof window.__weScheduleUserStateSync === 'function') window.__weScheduleUserStateSync();
}

function persistSmartCalRoutines() {
  smartCalRoutines = normalizeCalendarRoutines(smartCalRoutines);
  lsSet(CAL_ROUTINES_KEY, smartCalRoutines);
  if (typeof window.__weScheduleUserStateSync === 'function') window.__weScheduleUserStateSync();
}

function computeFreeTimeWindows(busyIntervals, dayStart = 8 * 60, dayEnd = 23 * 60) {
  const clipped = [];
  for (const iv of busyIntervals) {
    const s = Math.max(dayStart, Math.min(dayEnd, iv.start));
    const e = Math.max(dayStart, Math.min(dayEnd, iv.end));
    if (e > s) clipped.push({ start: s, end: e });
  }
  clipped.sort((a, b) => a.start - b.start || a.end - b.end);
  const merged = [];
  for (const iv of clipped) {
    const last = merged[merged.length - 1];
    if (last && iv.start <= last.end) {
      last.end = Math.max(last.end, iv.end);
    } else {
      merged.push({ start: iv.start, end: iv.end });
    }
  }
  const free = [];
  let cursor = dayStart;
  for (const iv of merged) {
    if (iv.start - cursor >= 15) {
      free.push({
        start: cursor,
        end: iv.start,
        mins: iv.start - cursor,
        label: `${formatMinsToTime(cursor)}–${formatMinsToTime(iv.start)}`,
      });
    }
    cursor = Math.max(cursor, iv.end);
  }
  if (dayEnd - cursor >= 15) {
    free.push({
      start: cursor,
      end: dayEnd,
      mins: dayEnd - cursor,
      label: `${formatMinsToTime(cursor)}–${formatMinsToTime(dayEnd)}`,
    });
  }
  const totalFreeMins = free.reduce((sum, x) => sum + x.mins, 0);
  return { free, totalFreeMins, mergedBusy: merged };
}

function fixtureMatchesConfig(fx, normalizedCfg) {
  if (!fx) return false;
  if (fx.isNational) {
    if (!normalizedCfg.nationalTeam) return false;
    if (fx.teamId && String(fx.teamId) !== String(normalizedCfg.nationalTeam.id)) return false;
    return true;
  }
  if (!normalizedCfg.clubs.length) return false;
  const clubIds = new Set(normalizedCfg.clubs.map((c) => String(c.id)));
  if (fx.teamId && clubIds.has(String(fx.teamId))) return true;
  if (fx.teamKey && clubIds.has(String(fx.teamKey))) return true;
  const legacyObj = fx.teamKey ? LEGACY_CLUB_MAP[String(fx.teamKey)] : null;
  if (legacyObj && clubIds.has(legacyObj.id)) return true;
  return false;
}

function getSmartDayData(dateKeyStr, manualEventsList = null, routinesList = smartCalRoutines, rawCfg = smartCalConfig, fixturesList = smartCalFixtures) {
  const cfg = normalizeSmartCalConfig(rawCfg);
  const obs = getPublicObservances(dateKeyStr, cfg.holidayCountry, window.__weLang);
  const isOfficialHoliday = cfg.holidayCountry !== 'none' && obs.holidays.length > 0;
  const isoDay = getIsoWeekdayFromKey(dateKeyStr);
  const items = [];
  const busy = [];
  let skippedByHolidayCount = 0;

  // 1. Official Holidays
  if (cfg.showHolidays && obs.holidays.length) {
    obs.holidays.forEach((name, idx) => {
      items.push({
        id: `hol-${dateKeyStr}-${idx}`,
        kind: 'holiday',
        badge: L('Resmi Tatil', 'Holiday'),
        timeText: L('Gün boyu', 'All day'),
        sortMin: -20,
        title: name,
        subtitle: L('Resmi tatil günü', 'Public holiday'),
      });
    });
  }

  // 2. Important Commemorations / Special Days
  if (cfg.showSpecialDays && obs.specials.length) {
    obs.specials.forEach((name, idx) => {
      items.push({
        id: `spc-${dateKeyStr}-${idx}`,
        kind: 'special',
        badge: L('Önemli Gün', 'Special'),
        timeText: L('Gün boyu', 'All day'),
        sortMin: -10,
        title: name,
        subtitle: '',
      });
    });
  }

  // 3. Weekly Recurring School / Work / Routine Rules (automatically skipped on Public Holidays if skipHolidays=true!)
  for (const rule of routinesList) {
    if (!rule.days.includes(isoDay)) continue;
    if (rule.mode === 'range' && (dateKeyStr < rule.startDate || dateKeyStr > rule.endDate)) continue;
    if (isOfficialHoliday && rule.skipHolidays) {
      skippedByHolidayCount += 1;
      continue;
    }
    const startMin = parseTimeToMins(rule.startTime);
    const endMin = parseTimeToMins(rule.endTime);
    const catBadge = rule.category === 'school'
      ? L('Ders', 'Class')
      : rule.category === 'work'
        ? L('İş', 'Work')
        : L('Rutin', 'Routine');
    const subText = rule.mode === 'permanent'
      ? L('Kalıcı haftalık program', 'Permanent weekly schedule')
      : `${formatIsoToDisplayDate(rule.startDate)} – ${formatIsoToDisplayDate(rule.endDate)}`;
    items.push({
      id: `occ-${rule.id}-${dateKeyStr}`,
      ruleId: rule.id,
      kind: rule.category,
      badge: catBadge,
      timeText: `${rule.startTime}–${rule.endTime}`,
      sortMin: startMin ?? 540,
      startMin,
      endMin,
      title: rule.title,
      subtitle: subText,
    });
    if (startMin !== null && endMin !== null) {
      busy.push({ start: startMin, end: endMin, kind: rule.category });
    }
  }

  // 4. Live National Team & Chosen Global Club Matches (Up to 3 clubs + 1 national team)
  const tzBadge = getMatchTzBadge();
  for (const fx of fixturesList) {
    if (!fx || fx.date !== dateKeyStr) continue;
    if (!fixtureMatchesConfig(fx, cfg)) continue;
    const startMin = parseTimeToMins(fx.time);
    const scorePart = fx.score ? ` (${fx.score})` : '';
    const leagueName = fx.league || L('Futbol', 'Football');
    items.push({
      id: fx.id || `fx-${dateKeyStr}-${fx.title}`,
      kind: 'match',
      badge: fx.isNational ? L('Milli Maç', 'National') : L('Maç', 'Match'),
      timeText: fx.time || L('Saat TBA', 'TBD'),
      sortMin: startMin ?? 1140,
      startMin,
      endMin: startMin !== null ? Math.min(24 * 60, startMin + 120) : null,
      title: `${fx.title}${scorePart}`,
      subtitle: tzBadge ? `${leagueName} · ${tzBadge}` : leagueName,
    });
    if (startMin !== null) {
      busy.push({ start: startMin, end: Math.min(24 * 60, startMin + 120), kind: 'match' });
    }
  }

  // 5. Manual Personal Single-Day Events (from js/11-calendar.js)
  const manualList = Array.isArray(manualEventsList)
    ? manualEventsList
    : (window.__weCalendarBridge ? window.__weCalendarBridge.getEvents() : []);
  for (const ev of manualList) {
    if (!ev || ev.date !== dateKeyStr) continue;
    const startMin = parseTimeToMins(ev.time);
    items.push({
      id: ev.id,
      manualId: ev.id,
      kind: 'event',
      badge: L('Etkinlik', 'Event'),
      timeText: ev.time || L('Gün boyu', 'All day'),
      sortMin: startMin ?? 9999,
      startMin,
      endMin: startMin !== null ? Math.min(24 * 60, startMin + 60) : null,
      title: ev.title,
      subtitle: '',
    });
    if (startMin !== null) {
      busy.push({ start: startMin, end: Math.min(24 * 60, startMin + 60), kind: 'event' });
    }
  }

  items.sort((a, b) => a.sortMin - b.sortMin || a.title.localeCompare(b.title, isEn() ? 'en' : 'tr'));
  const freeStats = computeFreeTimeWindows(busy, 8 * 60, 23 * 60);

  return {
    dateKey: dateKeyStr,
    isOfficialHoliday,
    holidays: obs.holidays,
    specials: obs.specials,
    skippedByHolidayCount,
    items,
    busy,
    free: freeStats.free,
    totalFreeMins: freeStats.totalFreeMins,
    hasHoliday: cfg.showHolidays && obs.holidays.length > 0,
    hasSpecial: cfg.showSpecialDays && obs.specials.length > 0,
    hasMatch: items.some((i) => i.kind === 'match'),
    hasRoutine: items.some((i) => i.kind === 'school' || i.kind === 'work' || i.kind === 'routine'),
    hasManual: items.some((i) => i.kind === 'event'),
  };
}

// Expose pure helpers for automated testing & diagnostics
window.__weCalendarHelpers = {
  getTurkishObservances,
  getPublicObservances,
  getSmartDayData,
  computeFreeTimeWindows,
  parseFlexibleDateInput,
  normalizeCalendarRoutines,
  normalizeSmartCalConfig,
};

// Fetch live match fixtures for up to 3 global clubs + 1 national team in user's local timezone
window.__weRefreshCalendarFixtures = async function refreshCalendarFixtures(forceRefresh = false) {
  if (smartCalFixturesLoading) return;
  const clubIds = smartCalConfig.clubs.map((c) => c.id);
  const natId = smartCalConfig.nationalTeam ? smartCalConfig.nationalTeam.id : '';

  if (!clubIds.length && !natId) {
    smartCalFixtures = [];
    if (window.__weCalendarBridge) window.__weCalendarBridge.renderAll();
    renderSmartCalendarTabsUI();
    return;
  }

  smartCalFixturesLoading = true;
  renderSmartCalendarSportsTab();

  try {
    const tz = getLocalTimeZone();
    const params = new URLSearchParams({
      clubs: clubIds.join(','),
      nationalId: natId || 'none',
      tz,
      lang: window.__weLang || 'tr',
    });
    if (forceRefresh) params.set('refresh', '1');

    let fixtures = null;
    let fetchedAt = new Date().toISOString();

    if (bridgeOnline) {
      const res = await fetch(`${BRIDGE_BASE_URL}/api/desktop/sports/fixtures?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok' && Array.isArray(data.fixtures)) {
          fixtures = data.fixtures;
          fetchedAt = data.fetchedAt || fetchedAt;
        }
      }
    }

    if (fixtures) {
      smartCalFixtures = fixtures;
      smartCalFixturesFetchedAt = fetchedAt;
      lsSet(CAL_FIXTURES_CACHE_KEY, {
        clubIds,
        nationalId: natId,
        tz,
        lang: window.__weLang || 'tr',
        fetchedAt,
        fixtures,
      });
    }
  } catch {} finally {
    smartCalFixturesLoading = false;
    if (window.__weCalendarBridge) window.__weCalendarBridge.renderAll();
    renderSmartCalendarTabsUI();
  }
};

async function loadLeagueTeamsForPicker(leagueSlug) {
  const cacheKey = `${leagueSlug}|${window.__weLang}`;
  if (leagueTeamsClientCache.has(cacheKey)) {
    return leagueTeamsClientCache.get(cacheKey);
  }
  const leagueMeta = GLOBAL_LEAGUES_LIST.find((l) => l.slug === leagueSlug) || GLOBAL_LEAGUES_LIST[0];
  const fallback = leagueMeta.fallbackClubs.map((c) => ({ ...c, league: leagueMeta.league, leagueSlug: leagueMeta.slug }));
  if (!bridgeOnline) return fallback;

  leagueTeamsLoading = true;
  renderTeamPickerDrawer();
  try {
    const res = await fetch(`${BRIDGE_BASE_URL}/api/desktop/sports/teams?league=${encodeURIComponent(leagueSlug)}&lang=${window.__weLang}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok' && Array.isArray(data.teams) && data.teams.length) {
        leagueTeamsClientCache.set(cacheKey, data.teams);
        return data.teams;
      }
    }
  } catch {} finally {
    leagueTeamsLoading = false;
  }
  return fallback;
}

// Inject the 3-Tab Smart Calendar Architecture cleanly inside #calendarPopover
const calPopoverEl = document.getElementById('calendarPopover');
const calHeaderEl = calPopoverEl?.querySelector('.calendar-header');
const calWeekdaysEl = calPopoverEl?.querySelector('.calendar-weekdays');
const calGridEl = document.getElementById('calendarGrid');
const calDayPanelEl = calPopoverEl?.querySelector('.calendar-day-panel');
const calFootnoteEl = calPopoverEl?.querySelector('.calendar-footnote');
const calSubtitleEl = calPopoverEl?.querySelector('.calendar-subtitle');

let calMonthPane = null;
let calSchedulePane = null;
let calSportsPane = null;
let calTabsBar = null;
let calFreeSummarySlot = null;
let calHolidayBannerSlot = null;

function mountSmartCalendarUI() {
  if (!calPopoverEl || !calHeaderEl || !calWeekdaysEl || !calGridEl || !calDayPanelEl) return;
  if (document.getElementById('weCalTabsBar')) return;

  // 1. Tabs bar directly under calendar header
  calTabsBar = document.createElement('div');
  calTabsBar.id = 'weCalTabsBar';
  calTabsBar.className = 'we-cal-tabs';
  calTabsBar.setAttribute('role', 'tablist');
  calTabsBar.innerHTML = `
    <button type="button" data-cal-tab="month" class="we-cal-tab-btn is-active" role="tab" aria-selected="true">Takvim</button>
    <button type="button" data-cal-tab="schedule" class="we-cal-tab-btn" role="tab" aria-selected="false">Program &amp; Boş</button>
    <button type="button" data-cal-tab="sports" class="we-cal-tab-btn" role="tab" aria-selected="false">Tatil &amp; Maç</button>
  `;
  calHeaderEl.insertAdjacentElement('afterend', calTabsBar);

  // 2. Wrap original month grid + selected day panel into Pane 1
  calMonthPane = document.createElement('div');
  calMonthPane.id = 'weCalPaneMonth';
  calTabsBar.insertAdjacentElement('afterend', calMonthPane);
  calMonthPane.append(calWeekdaysEl, calGridEl);

  const legend = document.createElement('div');
  legend.id = 'weCalLegend';
  legend.className = 'we-cal-legend';
  legend.innerHTML = `
    <span><i style="background:#fb7185"></i><b class="font-normal">Resmi Tatil</b></span>
    <span><i style="background:#fbbf24"></i><b class="font-normal">Maç</b></span>
    <span><i style="background:#34d399"></i><b class="font-normal">Ders / İş</b></span>
    <span><i style="background:#7dd3fc"></i><b class="font-normal">Etkinlik</b></span>
  `;
  calMonthPane.appendChild(legend);
  calMonthPane.appendChild(calDayPanelEl);

  // Add Holiday Banner slot & Free-Time Window slot inside .calendar-day-panel
  const evListEl = document.getElementById('calendarEventList');
  if (evListEl) {
    calHolidayBannerSlot = document.createElement('div');
    calHolidayBannerSlot.id = 'weCalHolidayBanner';
    evListEl.insertAdjacentElement('beforebegin', calHolidayBannerSlot);

    calFreeSummarySlot = document.createElement('div');
    calFreeSummarySlot.id = 'weCalDayFreeSlot';
    evListEl.insertAdjacentElement('afterend', calFreeSummarySlot);
  }

  // 3. Pane 2: Weekly Schedule & Free-Time Timeline + Recurring Class/Work Builder
  calSchedulePane = document.createElement('div');
  calSchedulePane.id = 'weCalPaneSchedule';
  calSchedulePane.hidden = true;
  calSchedulePane.innerHTML = `
    <section class="we-cal-section-card">
      <div class="we-cal-section-head">
        <div>
          <h4 id="weCalWeekMapTitle" class="we-cal-section-title font-pixel">Haftalık Boş Zaman Haritası (08:00 – 23:00)</h4>
          <p id="weCalWeekRangeLabel" class="we-cal-section-sub">Seçili hafta</p>
        </div>
        <span id="weCalWeekTotalFree" class="we-cal-week-free-sum">--</span>
      </div>
      <div id="weCalWeekList" class="we-cal-week-list"></div>
    </section>

    <section class="we-cal-section-card">
      <div class="we-cal-section-head">
        <div>
          <h4 id="weCalAddRuleTitle" class="we-cal-section-title font-pixel">Ders Programı / Kalıcı İş Rutini Ekle</h4>
          <p id="weCalAddRuleSub" class="we-cal-section-sub">Tarih aralığı vererek tüm döneme veya kalıcı olarak işle</p>
        </div>
      </div>
      <form id="weCalRoutineForm" class="we-cal-form-grid">
        <div id="weCalRoutineCatGroup" class="we-segmented-grid we-segmented-3">
          <button type="button" data-val="school" class="we-seg-btn is-active">Ders / Okul</button>
          <button type="button" data-val="work" class="we-seg-btn">İş / Mesai</button>
          <button type="button" data-val="routine" class="we-seg-btn">Kişisel Rutin</button>
        </div>

        <div>
          <label id="weCalRoutineTitleLbl" class="we-cal-field-label font-pixel" for="weCalRoutineTitle">Ders veya İş Adı</label>
          <input id="weCalRoutineTitle" type="text" maxlength="80" required placeholder="Örn: Veri Yapıları / Ofis Mesaisi" class="we-cal-input">
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <span id="weCalRoutineDaysLbl" class="we-cal-field-label font-pixel mb-0">Hangi Günler?</span>
            <button type="button" id="weCalPresetWeekdaysBtn" class="we-cal-mini-chip">Hafta İçi (Pzt–Cum)</button>
          </div>
          <div id="weCalRoutineDays" class="we-cal-day-pills" role="group" aria-label="Haftanın günleri">
            <button type="button" data-day="1" class="we-cal-day-pill is-active">Pzt</button>
            <button type="button" data-day="2" class="we-cal-day-pill">Sal</button>
            <button type="button" data-day="3" class="we-cal-day-pill">Çar</button>
            <button type="button" data-day="4" class="we-cal-day-pill">Per</button>
            <button type="button" data-day="5" class="we-cal-day-pill">Cum</button>
            <button type="button" data-day="6" class="we-cal-day-pill">Cmt</button>
            <button type="button" data-day="7" class="we-cal-day-pill">Paz</button>
          </div>
        </div>

        <div class="we-cal-row-2">
          <div>
            <label id="weCalRoutineStartLbl" class="we-cal-field-label font-pixel" for="weCalRoutineStart">Başlangıç Saati</label>
            <input id="weCalRoutineStart" type="text" maxlength="5" value="09:00" placeholder="09:00" class="we-cal-input font-mono">
          </div>
          <div>
            <label id="weCalRoutineEndLbl" class="we-cal-field-label font-pixel" for="weCalRoutineEnd">Bitiş Saati</label>
            <input id="weCalRoutineEnd" type="text" maxlength="5" value="11:00" placeholder="11:00" class="we-cal-input font-mono">
          </div>
        </div>

        <div>
          <span id="weCalRoutineModeLbl" class="we-cal-field-label font-pixel">Geçerlilik Süresi</span>
          <div id="weCalRoutineModeGroup" class="we-segmented-grid" style="grid-template-columns:repeat(2,minmax(0,1fr));">
            <button type="button" data-val="range" class="we-seg-btn is-active">Tarih Aralığı (Dönem)</button>
            <button type="button" data-val="permanent" class="we-seg-btn">Kalıcı (Sürekli)</button>
          </div>
        </div>

        <div id="weCalDateRangeBox">
          <div class="we-cal-row-2">
            <div>
              <label id="weCalRangeStartLbl" class="we-cal-field-label font-pixel" for="weCalRangeStart">Başlangıç Tarihi</label>
              <input id="weCalRangeStart" type="text" maxlength="10" placeholder="GG.AA.YYYY" class="we-cal-input font-mono">
            </div>
            <div>
              <label id="weCalRangeEndLbl" class="we-cal-field-label font-pixel" for="weCalRangeEnd">Bitiş Tarihi</label>
              <input id="weCalRangeEnd" type="text" maxlength="10" placeholder="GG.AA.YYYY" class="we-cal-input font-mono">
            </div>
          </div>
          <div class="we-cal-quick-presets">
            <button type="button" data-range-weeks="14" id="weCalPresetTermBtn" class="we-cal-mini-chip">+14 Hafta (Dönem)</button>
            <button type="button" data-range-weeks="4" id="weCalPresetMonthBtn" class="we-cal-mini-chip">+1 Ay</button>
            <button type="button" data-range-year-end="1" id="weCalPresetYearBtn" class="we-cal-mini-chip">Yıl Sonuna Kadar</button>
          </div>
        </div>

        <label class="we-cal-check-row">
          <input id="weCalSkipHolidays" type="checkbox" checked>
          <span id="weCalSkipHolidaysLbl">Resmi tatil günlerinde bu programı otomatik atla</span>
        </label>

        <button id="weCalSubmitRuleBtn" type="submit" class="we-cal-primary-btn font-pixel">Programa Ekle ve Takvime İşle</button>
      </form>
    </section>

    <section class="we-cal-section-card">
      <div class="we-cal-section-head">
        <h4 id="weCalSavedRulesTitle" class="we-cal-section-title font-pixel">Kayıtlı Haftalık Kurallar</h4>
        <span id="weCalRulesCount" class="we-cal-section-sub">0 kural</span>
      </div>
      <div id="weCalRulesList" class="we-cal-rules-list"></div>
    </section>
  `;
  calMonthPane.insertAdjacentElement('afterend', calSchedulePane);

  // 4. Pane 3: Global Public Holidays + Interactive 3 Clubs & 1 National Team Picker
  calSportsPane = document.createElement('div');
  calSportsPane.id = 'weCalPaneSports';
  calSportsPane.hidden = true;
  calSportsPane.innerHTML = `
    <section class="we-cal-section-card">
      <div class="we-cal-section-head">
        <div>
          <h4 id="weCalHolCardTitle" class="we-cal-section-title font-pixel">Resmi Tatiller &amp; Önemli Günler</h4>
          <p id="weCalHolCardSub" class="we-cal-section-sub">Ülke seç · Ders ve iş kuralları tatillerde otomatik atlanır</p>
        </div>
      </div>
      <div id="weCalHolidayCountryGroup" class="we-cal-holiday-country-grid" role="group" aria-label="Tatil ülkesi">
        <button type="button" data-country="TR" class="we-seg-btn">TR</button>
        <button type="button" data-country="US" class="we-seg-btn">US</button>
        <button type="button" data-country="UK" class="we-seg-btn">UK</button>
        <button type="button" data-country="DE" class="we-seg-btn">DE</button>
        <button type="button" data-country="none" class="we-seg-btn" id="weCalCountryOffBtn">Kapalı</button>
      </div>
      <div class="space-y-2">
        <label class="we-cal-check-row">
          <input id="weCalToggleHolidays" type="checkbox" checked>
          <span id="weCalToggleHolidaysLbl">Resmi tatilleri göster (okul/iş programını otomatik atlar)</span>
        </label>
        <label class="we-cal-check-row">
          <input id="weCalToggleSpecials" type="checkbox" checked>
          <span id="weCalToggleSpecialsLbl">Önemli günleri ve anma günlerini göster</span>
        </label>
      </div>
    </section>

    <section class="we-cal-section-card">
      <div class="we-cal-section-head">
        <div>
          <h4 id="weCalSportsCardTitle" class="we-cal-section-title font-pixel">Maç Takvimi (Canlı Fikstür)</h4>
          <p id="weCalSportsStatus" class="we-cal-section-sub">Yerel saatle otomatik işlenir</p>
        </div>
        <button id="weCalRefreshFixturesBtn" type="button" class="we-cal-mini-chip font-pixel">Yenile</button>
      </div>

      <!-- 1 National Team Slot -->
      <span id="weCalNationalSlotLbl" class="we-cal-field-label font-pixel">Milli Takım (1 Slot)</span>
      <div id="weCalNationalSlotRow" class="we-cal-slot-row"></div>

      <!-- Up to 3 Global Club Slots -->
      <span id="weCalClubSlotLbl" class="we-cal-field-label font-pixel">Takip Ettiğin Kulüpler (0/3)</span>
      <div id="weCalClubSlotRow" class="we-cal-slot-row"></div>

      <!-- CEF-Safe Inline Interactive Picker Drawer (Country / League / Search / Pick) -->
      <div id="weCalTeamPickerDrawer" class="we-cal-picker-drawer" hidden></div>

      <div class="we-cal-section-head mt-2">
        <span id="weCalUpcomingLbl" class="we-cal-field-label font-pixel mb-0">Yaklaşan Maçlar (Tıkla → Güne Git)</span>
        <span id="weCalUpcomingCount" class="we-cal-section-sub">0 maç</span>
      </div>
      <div id="weCalUpcomingMatchesList" class="we-cal-match-list"></div>
    </section>
  `;
  calSchedulePane.insertAdjacentElement('afterend', calSportsPane);

  if (calFootnoteEl) {
    calFootnoteEl.textContent = L(
      'Takvim, ders/iş programların ve takım tercihlerin yerel kullanıcı verilerine kaydedilir.',
      'Your calendar, recurring schedule, and team picks are saved locally.',
    );
  }

  // Tab switching
  calTabsBar.querySelectorAll('.we-cal-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      smartCalActiveTab = btn.dataset.calTab || 'month';
      syncSmartCalendarActiveTab();
    });
  });

  // Auto-format HH:MM time inputs
  ['weCalRoutineStart', 'weCalRoutineEnd'].forEach((id) => {
    const inp = document.getElementById(id);
    if (!inp) return;
    inp.addEventListener('input', () => {
      let v = inp.value.replace(/[^\d:]/g, '');
      if (/^\d{3,4}$/.test(v)) v = `${v.slice(0, 2)}:${v.slice(2, 4)}`;
      inp.value = v.slice(0, 5);
    });
  });

  // Pre-fill default academic date range (selected date → +14 weeks)
  const setDefaultDateRange = (weeks = 14) => {
    const base = window.__weCalendarBridge ? window.__weCalendarBridge.getSelectedDate() : new Date();
    const end = new Date(base.getFullYear(), base.getMonth(), base.getDate() + weeks * 7);
    const rs = document.getElementById('weCalRangeStart');
    const re = document.getElementById('weCalRangeEnd');
    if (rs && window.__weCalendarBridge) rs.value = formatIsoToDisplayDate(window.__weCalendarBridge.dateKey(base));
    if (re && window.__weCalendarBridge) re.value = formatIsoToDisplayDate(window.__weCalendarBridge.dateKey(end));
  };
  setDefaultDateRange(14);

  // Category & Mode segmented selectors inside Routine Form
  let formCat = 'school';
  let formMode = 'range';

  document.getElementById('weCalRoutineCatGroup')?.querySelectorAll('.we-seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      formCat = btn.dataset.val || 'school';
      document.getElementById('weCalRoutineCatGroup')?.querySelectorAll('.we-seg-btn')
        .forEach((b) => b.classList.toggle('is-active', b.dataset.val === formCat));
      if (formCat === 'work') {
        formMode = 'permanent';
        syncRoutineModeUI();
      } else if (formCat === 'school') {
        formMode = 'range';
        syncRoutineModeUI();
      }
    });
  });

  function syncRoutineModeUI() {
    document.getElementById('weCalRoutineModeGroup')?.querySelectorAll('.we-seg-btn')
      .forEach((b) => b.classList.toggle('is-active', b.dataset.val === formMode));
    const rangeBox = document.getElementById('weCalDateRangeBox');
    if (rangeBox) rangeBox.hidden = formMode === 'permanent';
  }

  document.getElementById('weCalRoutineModeGroup')?.querySelectorAll('.we-seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      formMode = btn.dataset.val === 'permanent' ? 'permanent' : 'range';
      syncRoutineModeUI();
    });
  });

  document.getElementById('weCalRoutineDays')?.querySelectorAll('.we-cal-day-pill').forEach((btn) => {
    btn.addEventListener('click', () => btn.classList.toggle('is-active'));
  });

  document.getElementById('weCalPresetWeekdaysBtn')?.addEventListener('click', () => {
    document.getElementById('weCalRoutineDays')?.querySelectorAll('.we-cal-day-pill').forEach((btn) => {
      const d = Number(btn.dataset.day);
      btn.classList.toggle('is-active', d >= 1 && d <= 5);
    });
  });

  calSchedulePane.querySelectorAll('[data-range-weeks]').forEach((btn) => {
    btn.addEventListener('click', () => setDefaultDateRange(Number(btn.dataset.rangeWeeks) || 14));
  });
  calSchedulePane.querySelector('[data-range-year-end]')?.addEventListener('click', () => {
    const base = window.__weCalendarBridge ? window.__weCalendarBridge.getSelectedDate() : new Date();
    const rs = document.getElementById('weCalRangeStart');
    const re = document.getElementById('weCalRangeEnd');
    if (rs && window.__weCalendarBridge) rs.value = formatIsoToDisplayDate(window.__weCalendarBridge.dateKey(base));
    if (re) re.value = formatIsoToDisplayDate(`${base.getFullYear()}-12-31`);
  });

  // Submit new Recurring School / Work / Routine Rule
  document.getElementById('weCalRoutineForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const titleEl = document.getElementById('weCalRoutineTitle');
    const startEl = document.getElementById('weCalRoutineStart');
    const endEl = document.getElementById('weCalRoutineEnd');
    const rangeStartEl = document.getElementById('weCalRangeStart');
    const rangeEndEl = document.getElementById('weCalRangeEnd');
    const skipEl = document.getElementById('weCalSkipHolidays');

    const title = String(titleEl?.value || '').trim().slice(0, 80);
    const days = Array.from(document.querySelectorAll('#weCalRoutineDays .we-cal-day-pill.is-active'))
      .map((b) => Number(b.dataset.day))
      .filter((d) => d >= 1 && d <= 7);
    const startMin = parseTimeToMins(startEl?.value);
    const endMin = parseTimeToMins(endEl?.value);

    if (!title) {
      showDesktopToast(L('Lütfen ders veya iş adını gir.', 'Please enter a class or work title.'), 2600);
      return;
    }
    if (!days.length) {
      showDesktopToast(L('En az bir gün seçmelisin (Pzt–Paz).', 'Select at least one weekday (Mon–Sun).'), 2600);
      return;
    }
    if (startMin === null || endMin === null || endMin <= startMin) {
      showDesktopToast(L('Saat aralığını SS:DD biçiminde gir (bitiş başlangıçtan sonra olmalı).', 'Enter time as HH:MM (end must be after start).'), 3200);
      return;
    }

    let startDate = '';
    let endDate = '';
    if (formMode === 'range') {
      startDate = parseFlexibleDateInput(rangeStartEl?.value) || '';
      endDate = parseFlexibleDateInput(rangeEndEl?.value) || '';
      if (!startDate || !endDate || endDate < startDate) {
        showDesktopToast(L('Geçerli bir tarih aralığı gir (GG.AA.YYYY).', 'Enter a valid date range (YYYY-MM-DD).'), 3200);
        return;
      }
    }

    smartCalRoutines.push({
      id: `rt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      category: formCat,
      days,
      startTime: formatMinsToTime(startMin),
      endTime: formatMinsToTime(endMin),
      mode: formMode,
      startDate,
      endDate,
      skipHolidays: Boolean(skipEl?.checked),
    });
    persistSmartCalRoutines();
    if (titleEl) titleEl.value = '';
    if (window.__weCalendarBridge) window.__weCalendarBridge.renderAll();
    renderSmartCalendarTabsUI();
    showDesktopToast(
      formMode === 'permanent'
        ? L(`"${title}" kalıcı olarak takvime işlendi.`, `"${title}" added permanently to your calendar.`)
        : L(`"${title}" seçilen tarih aralığındaki tüm haftalara eklendi.`, `"${title}" added across the selected date range.`),
      2800,
    );
  });

  // Tab 3 bindings: Holiday Country & toggles
  document.getElementById('weCalHolidayCountryGroup')?.querySelectorAll('.we-seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      smartCalConfig.holidayCountry = btn.dataset.country || 'TR';
      persistSmartCalConfig();
      if (window.__weCalendarBridge) window.__weCalendarBridge.renderAll();
      renderSmartCalendarTabsUI();
    });
  });

  document.getElementById('weCalToggleHolidays')?.addEventListener('change', (e) => {
    smartCalConfig.showHolidays = Boolean(e.target.checked);
    persistSmartCalConfig();
    if (window.__weCalendarBridge) window.__weCalendarBridge.renderAll();
    renderSmartCalendarTabsUI();
  });

  document.getElementById('weCalToggleSpecials')?.addEventListener('change', (e) => {
    smartCalConfig.showSpecialDays = Boolean(e.target.checked);
    persistSmartCalConfig();
    if (window.__weCalendarBridge) window.__weCalendarBridge.renderAll();
    renderSmartCalendarTabsUI();
  });

  document.getElementById('weCalRefreshFixturesBtn')?.addEventListener('click', () => {
    window.__weRefreshCalendarFixtures(true);
  });
}

function renderTeamPickerDrawer() {
  const drawer = document.getElementById('weCalTeamPickerDrawer');
  if (!drawer) return;
  if (!activePickerMode) {
    drawer.hidden = true;
    drawer.replaceChildren();
    if (typeof window.__weSyncPopoverGlassPlate === 'function') {
      requestAnimationFrame(() => window.__weSyncPopoverGlassPlate());
    }
    return;
  }

  drawer.hidden = false;
  drawer.replaceChildren();

  const head = document.createElement('div');
  head.className = 'we-cal-picker-head';
  const heading = document.createElement('span');
  heading.className = 'text-xs font-pixel text-sky-200';
  heading.textContent = activePickerMode === 'national'
    ? L('Milli Takım Seç (24 Ülke)', 'Choose National Team (24 Nations)')
    : L(`Kulüp Takımı Seç (${smartCalConfig.clubs.length}/3)`, `Choose Club Team (${smartCalConfig.clubs.length}/3)`);
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'we-cal-mini-chip';
  closeBtn.textContent = L('Kapat', 'Close');
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    activePickerMode = null;
    activePickerSearch = '';
    setActiveDesktopInput(null);
    renderTeamPickerDrawer();
  });
  head.append(heading, closeBtn);
  drawer.appendChild(head);

  if (activePickerMode === 'club') {
    // Step 1: Country / League Selector Pills
    const leaguesWrap = document.createElement('div');
    leaguesWrap.className = 'we-cal-league-pills';
    GLOBAL_LEAGUES_LIST.forEach((lg) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `we-cal-league-btn${lg.slug === activePickerLeagueSlug ? ' is-active' : ''}`;
      b.innerHTML = `<span>${esc(lg.league)}</span><small>${esc(isEn() ? lg.countryEn : lg.countryTr)}</small>`;
      b.addEventListener('click', async (e) => {
        e.stopPropagation();
        activePickerLeagueSlug = lg.slug;
        activePickerSearch = '';
        renderTeamPickerDrawer();
        await loadLeagueTeamsForPicker(lg.slug);
        renderTeamPickerDrawer();
      });
      leaguesWrap.appendChild(b);
    });
    drawer.appendChild(leaguesWrap);
  }

  // Step 2: Live Filter Search Input
  const searchInp = document.createElement('input');
  searchInp.type = 'text';
  searchInp.className = 'we-cal-input';
  searchInp.maxLength = 40;
  searchInp.value = activePickerSearch;
  searchInp.placeholder = activePickerMode === 'national'
    ? L('Ülke ara… (Örn: Türkiye, İngiltere)', 'Search country… (e.g. England, Brazil)')
    : L('Takım ara… (Örn: Galatasaray, Arsenal)', 'Search club… (e.g. Arsenal, Real Madrid)');

  const grid = document.createElement('div');
  grid.className = 'we-cal-team-list-grid';

  const populateGrid = () => {
    grid.replaceChildren();
    const q = activePickerSearch.trim().toLowerCase();

    if (activePickerMode === 'national') {
      const selectedId = smartCalConfig.nationalTeam?.id || '';
      const filtered = GLOBAL_NATIONAL_TEAMS_LIST.filter((n) => (
        !q || n.nameTr.toLowerCase().includes(q) || n.nameEn.toLowerCase().includes(q) || n.code.toLowerCase().includes(q)
      ));
      if (!filtered.length) {
        const empty = document.createElement('p');
        empty.className = 'calendar-empty col-span-2';
        empty.textContent = L('Eşleşen milli takım bulunamadı.', 'No matching national team found.');
        grid.appendChild(empty);
        return;
      }
      filtered.forEach((nat) => {
        const picked = nat.id === selectedId;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `we-cal-team-pick-btn${picked ? ' is-selected' : ''}`;
        btn.innerHTML = `<span>${esc(isEn() ? nat.nameEn : nat.nameTr)}</span><small class="font-mono text-[10px] opacity-65">${picked ? '✓' : esc(nat.code)}</small>`;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          smartCalConfig.nationalTeam = { ...nat };
          persistSmartCalConfig();
          activePickerMode = null;
          activePickerSearch = '';
          setActiveDesktopInput(null);
          renderSmartCalendarSportsTab();
          window.__weRefreshCalendarFixtures(true);
        });
        grid.appendChild(btn);
      });
      return;
    }

    // Club mode
    const cacheKey = `${activePickerLeagueSlug}|${window.__weLang}`;
    const lgMeta = GLOBAL_LEAGUES_LIST.find((l) => l.slug === activePickerLeagueSlug) || GLOBAL_LEAGUES_LIST[0];
    const teams = leagueTeamsClientCache.get(cacheKey)
      || lgMeta.fallbackClubs.map((c) => ({ ...c, league: lgMeta.league, leagueSlug: lgMeta.slug }));

    if (leagueTeamsLoading && !leagueTeamsClientCache.has(cacheKey)) {
      const loadingEl = document.createElement('p');
      loadingEl.className = 'calendar-empty col-span-2';
      loadingEl.textContent = L('Lig takımları yükleniyor…', 'Loading league clubs…');
      grid.appendChild(loadingEl);
      return;
    }

    const pickedIds = new Set(smartCalConfig.clubs.map((c) => String(c.id)));
    const filtered = teams.filter((t) => !q || t.name.toLowerCase().includes(q) || (t.short || '').toLowerCase().includes(q));
    if (!filtered.length) {
      const empty = document.createElement('p');
      empty.className = 'calendar-empty col-span-2';
      empty.textContent = L('Bu ligde eşleşen takım bulunamadı.', 'No matching club in this league.');
      grid.appendChild(empty);
      return;
    }

    filtered.forEach((team) => {
      const isPicked = pickedIds.has(String(team.id));
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `we-cal-team-pick-btn${isPicked ? ' is-selected' : ''}`;
      btn.innerHTML = `<span>${esc(team.name)}</span><small class="font-mono text-[10px] opacity-70">${isPicked ? '✓' : '+'}</small>`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isPicked) {
          smartCalConfig.clubs = smartCalConfig.clubs.filter((c) => String(c.id) !== String(team.id));
        } else {
          if (smartCalConfig.clubs.length >= 3) {
            showDesktopToast(L('En fazla 3 kulüp takımı seçebilirsin.', 'You can follow up to 3 club teams.'), 2600);
            return;
          }
          smartCalConfig.clubs.push({
            id: String(team.id),
            name: team.name,
            short: String(team.short || team.name.slice(0, 3)).slice(0, 4).toUpperCase(),
            league: team.league || lgMeta.league,
            leagueSlug: team.leagueSlug || lgMeta.slug,
          });
        }
        persistSmartCalConfig();
        if (smartCalConfig.clubs.length >= 3) {
          activePickerMode = null;
          activePickerSearch = '';
          setActiveDesktopInput(null);
        }
        renderSmartCalendarSportsTab();
        window.__weRefreshCalendarFixtures(true);
      });
      grid.appendChild(btn);
    });
  };

  searchInp.addEventListener('input', () => {
    activePickerSearch = searchInp.value;
    populateGrid();
  });

  drawer.append(searchInp, grid);
  populateGrid();

  if (typeof window.__weSyncPopoverGlassPlate === 'function') {
    requestAnimationFrame(() => window.__weSyncPopoverGlassPlate());
  }
}

function syncSmartCalendarActiveTab() {
  if (!calTabsBar) return;
  calTabsBar.querySelectorAll('.we-cal-tab-btn').forEach((btn) => {
    const active = btn.dataset.calTab === smartCalActiveTab;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  if (calMonthPane) calMonthPane.hidden = smartCalActiveTab !== 'month';
  if (calSchedulePane) calSchedulePane.hidden = smartCalActiveTab !== 'schedule';
  if (calSportsPane) calSportsPane.hidden = smartCalActiveTab !== 'sports';
  renderSmartCalendarTabsUI();
  if (typeof window.__weSyncPopoverGlassPlate === 'function') {
    requestAnimationFrame(() => window.__weSyncPopoverGlassPlate());
  }
}

function updateSmartCalendarSubtitle() {
  if (!calSubtitleEl) return;
  const parts = [];
  if (smartCalConfig.showHolidays && smartCalConfig.holidayCountry !== 'none') {
    parts.push(`${smartCalConfig.holidayCountry} ${L('tatiller', 'holidays')}`);
  }
  const teamNames = [];
  if (smartCalConfig.nationalTeam) {
    teamNames.push(isEn() ? smartCalConfig.nationalTeam.nameEn : smartCalConfig.nationalTeam.nameTr);
  }
  smartCalConfig.clubs.forEach((c) => teamNames.push(c.short || c.name));
  if (teamNames.length) parts.push(teamNames.join(' · '));
  if (smartCalRoutines.length) {
    parts.push(isEn() ? `${smartCalRoutines.length} rules` : `${smartCalRoutines.length} program`);
  }
  calSubtitleEl.textContent = parts.length ? parts.join(' · ') : L('Küçük planlar, güzel günler.', 'Small plans, brighter days.');
}

function renderSmartCalendarScheduleTab() {
  const weekList = document.getElementById('weCalWeekList');
  const weekRangeLabel = document.getElementById('weCalWeekRangeLabel');
  const weekTotalFreeEl = document.getElementById('weCalWeekTotalFree');
  const rulesList = document.getElementById('weCalRulesList');
  const rulesCountEl = document.getElementById('weCalRulesCount');
  if (!weekList || !window.__weCalendarBridge) return;

  const sel = window.__weCalendarBridge.getSelectedDate();
  const mondayOffset = (sel.getDay() + 6) % 7;
  const monday = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate() - mondayOffset);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  const todayKey = window.__weCalendarBridge.dateKey(new Date());

  if (weekRangeLabel) {
    weekRangeLabel.textContent = `${window.__weCalendarBridge.formatDate(monday, { day: 'numeric', month: 'short' })} – ${window.__weCalendarBridge.formatDate(sunday, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }

  weekList.replaceChildren();
  let weekFreeSum = 0;
  const DAY_START = 8 * 60;
  const DAY_SPAN = 15 * 60; // 08:00 -> 23:00

  for (let i = 0; i < 7; i++) {
    const dt = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const key = window.__weCalendarBridge.dateKey(dt);
    const info = getSmartDayData(key);
    weekFreeSum += info.totalFreeMins;

    const row = document.createElement('div');
    row.className = `we-cal-week-row${key === todayKey ? ' is-today' : ''}${info.hasHoliday ? ' is-holiday' : ''}`;

    const dayName = `${getIsoDayShort(i + 1)} ${window.__weCalendarBridge.formatDate(dt, { day: 'numeric', month: 'short' })}`;
    const segmentsHtml = info.busy.map((b) => {
      const s = Math.max(DAY_START, Math.min(DAY_START + DAY_SPAN, b.start));
      const e = Math.max(DAY_START, Math.min(DAY_START + DAY_SPAN, b.end));
      if (e <= s) return '';
      const leftPct = ((s - DAY_START) / DAY_SPAN) * 100;
      const widthPct = Math.max(1.5, ((e - s) / DAY_SPAN) * 100);
      return `<span class="we-cal-timeline-seg is-${b.kind}" style="left:${leftPct.toFixed(1)}%;width:${widthPct.toFixed(1)}%"></span>`;
    }).join('');

    const freeSummaryText = info.hasHoliday && !info.busy.length
      ? `${L('Resmi Tatil', 'Holiday')} (${info.holidays[0]}) · ${L('Tüm gün serbest', 'All day free')}`
      : info.free.length
        ? `${L('Boş', 'Free')}: ${info.free.map((f) => f.label).join(' · ')}`
        : L('08:00–23:00 arası tamamen dolu', 'Fully booked from 08:00 to 23:00');

    row.innerHTML = `
      <div class="we-cal-week-top">
        <span class="we-cal-week-day">${esc(dayName)}${info.hasHoliday ? ` · ${L('Tatil', 'Holiday')}` : ''}</span>
        <span class="we-cal-week-free-sum">${formatDurationLocalized(info.totalFreeMins)} ${L('boş', 'free')}</span>
      </div>
      <div class="we-cal-timeline-track" aria-hidden="true">${segmentsHtml}</div>
      <div class="we-cal-week-slots">${esc(freeSummaryText)}</div>
    `;
    row.addEventListener('click', () => {
      window.__weCalendarBridge.setSelectedDate(dt);
      window.__weCalendarBridge.setVisibleMonth(dt);
      smartCalActiveTab = 'month';
      window.__weCalendarBridge.renderAll();
      syncSmartCalendarActiveTab();
    });
    weekList.appendChild(row);
  }

  if (weekTotalFreeEl) {
    weekTotalFreeEl.textContent = isEn()
      ? `${formatDurationLocalized(weekFreeSum)} free / wk`
      : `Haftalık ${formatDurationLocalized(weekFreeSum)} boş`;
  }

  if (rulesCountEl) {
    rulesCountEl.textContent = isEn() ? `${smartCalRoutines.length} rules` : `${smartCalRoutines.length} kural`;
  }
  if (rulesList) {
    rulesList.replaceChildren();
    if (!smartCalRoutines.length) {
      const empty = document.createElement('p');
      empty.className = 'calendar-empty';
      empty.textContent = L(
        'Henüz haftalık ders veya iş programı eklemedin. Yukarıdaki formdan kolayca ekleyebilirsin.',
        'No recurring classes or work schedules yet. Use the form above to add one.',
      );
      rulesList.appendChild(empty);
    } else {
      smartCalRoutines.forEach((rule) => {
        const card = document.createElement('div');
        card.className = 'we-cal-rule-item';
        const daysLabel = rule.days.map((d) => getIsoDayShort(d)).join(', ');
        const periodLabel = rule.mode === 'permanent'
          ? L('Kalıcı', 'Permanent')
          : `${formatIsoToDisplayDate(rule.startDate)} – ${formatIsoToDisplayDate(rule.endDate)}`;
        const catLabel = rule.category === 'school'
          ? L('Ders', 'Class')
          : rule.category === 'work'
            ? L('İş', 'Work')
            : L('Rutin', 'Routine');
        card.innerHTML = `
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="we-cal-badge is-${rule.category}">${catLabel}</span>
              <strong class="we-cal-agenda-title truncate">${esc(rule.title)}</strong>
            </div>
            <div class="we-cal-rule-meta">${esc(daysLabel)} · ${esc(rule.startTime)}–${esc(rule.endTime)} · ${esc(periodLabel)}${rule.skipHolidays ? L(' · Tatilde atla', ' · Skip holidays') : ''}</div>
          </div>
          <button type="button" class="calendar-event-remove" title="${L('Program kuralını sil', 'Delete rule')}" aria-label="${L('Kuralı sil', 'Delete rule')}: ${esc(rule.title)}">×</button>
        `;
        card.querySelector('.calendar-event-remove')?.addEventListener('click', () => {
          smartCalRoutines = smartCalRoutines.filter((r) => r.id !== rule.id);
          persistSmartCalRoutines();
          if (window.__weCalendarBridge) window.__weCalendarBridge.renderAll();
          renderSmartCalendarTabsUI();
        });
        rulesList.appendChild(card);
      });
    }
  }
}

function renderSmartCalendarSportsTab() {
  const holChk = document.getElementById('weCalToggleHolidays');
  const spcChk = document.getElementById('weCalToggleSpecials');
  const natSlotRow = document.getElementById('weCalNationalSlotRow');
  const clubSlotRow = document.getElementById('weCalClubSlotRow');
  const clubSlotLbl = document.getElementById('weCalClubSlotLbl');
  const statusEl = document.getElementById('weCalSportsStatus');
  const listEl = document.getElementById('weCalUpcomingMatchesList');
  const countEl = document.getElementById('weCalUpcomingCount');

  if (holChk) holChk.checked = Boolean(smartCalConfig.showHolidays);
  if (spcChk) spcChk.checked = Boolean(smartCalConfig.showSpecialDays);

  document.getElementById('weCalHolidayCountryGroup')?.querySelectorAll('.we-seg-btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.country === smartCalConfig.holidayCountry);
  });

  // Render 1 National Team Slot
  if (natSlotRow) {
    natSlotRow.replaceChildren();
    if (smartCalConfig.nationalTeam) {
      const nat = smartCalConfig.nationalTeam;
      const chip = document.createElement('span');
      chip.className = 'we-cal-team-chip is-national';
      chip.innerHTML = `<span>${esc(isEn() ? nat.nameEn : nat.nameTr)}</span><small>${esc(nat.code || 'NAT')}</small><button type="button" title="${L('Kaldır', 'Remove')}" aria-label="${L('Milli takımı kaldır', 'Remove national team')}">×</button>`;
      chip.querySelector('button')?.addEventListener('click', (e) => {
        e.stopPropagation();
        smartCalConfig.nationalTeam = null;
        persistSmartCalConfig();
        renderSmartCalendarSportsTab();
        window.__weRefreshCalendarFixtures(true);
      });
      natSlotRow.appendChild(chip);

      const changeBtn = document.createElement('button');
      changeBtn.type = 'button';
      changeBtn.className = 'we-cal-add-slot-btn font-pixel';
      changeBtn.textContent = L('Değiştir', 'Change');
      changeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        activePickerMode = activePickerMode === 'national' ? null : 'national';
        activePickerSearch = '';
        renderTeamPickerDrawer();
      });
      natSlotRow.appendChild(changeBtn);
    } else {
      const pickBtn = document.createElement('button');
      pickBtn.type = 'button';
      pickBtn.className = 'we-cal-add-slot-btn font-pixel';
      pickBtn.textContent = L('+ Milli Takım Seç', '+ Pick National Team');
      pickBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        activePickerMode = activePickerMode === 'national' ? null : 'national';
        activePickerSearch = '';
        renderTeamPickerDrawer();
      });
      natSlotRow.appendChild(pickBtn);
    }
  }

  // Render Up to 3 Global Club Slots
  if (clubSlotLbl) {
    clubSlotLbl.textContent = isEn()
      ? `Followed Clubs (${smartCalConfig.clubs.length}/3)`
      : `Takip Ettiğin Kulüpler (${smartCalConfig.clubs.length}/3)`;
  }
  if (clubSlotRow) {
    clubSlotRow.replaceChildren();
    smartCalConfig.clubs.forEach((club) => {
      const chip = document.createElement('span');
      chip.className = 'we-cal-team-chip';
      chip.innerHTML = `<span>${esc(club.name)}</span>${club.league ? `<small>${esc(club.league)}</small>` : ''}<button type="button" title="${L('Kaldır', 'Remove')}" aria-label="${L('Takımı kaldır', 'Remove club')}: ${esc(club.name)}">×</button>`;
      chip.querySelector('button')?.addEventListener('click', (e) => {
        e.stopPropagation();
        smartCalConfig.clubs = smartCalConfig.clubs.filter((c) => String(c.id) !== String(club.id));
        persistSmartCalConfig();
        renderSmartCalendarSportsTab();
        window.__weRefreshCalendarFixtures(true);
      });
      clubSlotRow.appendChild(chip);
    });

    if (smartCalConfig.clubs.length < 3) {
      const addClubBtn = document.createElement('button');
      addClubBtn.type = 'button';
      addClubBtn.className = 'we-cal-add-slot-btn font-pixel';
      addClubBtn.textContent = L('+ Kulüp Ekle', '+ Add Club');
      addClubBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const opening = activePickerMode !== 'club';
        activePickerMode = opening ? 'club' : null;
        activePickerSearch = '';
        if (opening) {
          if (!activePickerLeagueSlug) activePickerLeagueSlug = isEn() ? 'eng.1' : 'tur.1';
          renderTeamPickerDrawer();
          await loadLeagueTeamsForPicker(activePickerLeagueSlug);
          if (activePickerMode === 'club') renderTeamPickerDrawer();
        } else {
          renderTeamPickerDrawer();
        }
      });
      clubSlotRow.appendChild(addClubBtn);
    }
  }

  if (activePickerMode) renderTeamPickerDrawer();

  const activeMatches = smartCalFixtures.filter((fx) => fixtureMatchesConfig(fx, smartCalConfig));
  const todayKey = window.__weCalendarBridge ? window.__weCalendarBridge.dateKey(new Date()) : '';
  const upcoming = activeMatches.filter((fx) => !fx.completed && fx.date >= todayKey);
  const recent = activeMatches.filter((fx) => fx.completed || fx.date < todayKey).slice(-4).reverse();

  if (statusEl) {
    if (smartCalFixturesLoading) {
      statusEl.textContent = L('Canlı fikstür güncelleniyor…', 'Updating live fixtures…');
    } else if (!smartCalConfig.nationalTeam && !smartCalConfig.clubs.length) {
      statusEl.textContent = L('Maç takibi kapalı · Yukarıdan takım seçebilirsin', 'No teams selected · Pick clubs or a national team above');
    } else if (activeMatches.length) {
      statusEl.textContent = isEn()
        ? `${upcoming.length} upcoming · ${activeMatches.length} matches synced`
        : `${upcoming.length} yaklaşan, ${activeMatches.length} toplam maç takvime işlendi`;
    } else {
      statusEl.textContent = bridgeOnline
        ? L('Fikstür bulunamadı · Yenile ile tekrar dene', 'No fixtures found · Try Refresh')
        : L('Canlı fikstür için masaüstü köprüsü bekleniyor', 'Waiting for desktop bridge for live fixtures');
    }
  }

  if (countEl) {
    countEl.textContent = isEn() ? `${upcoming.length} upcoming` : `${upcoming.length} yaklaşan`;
  }

  const tzBadge = getMatchTzBadge();
  if (listEl) {
    listEl.replaceChildren();
    const displayList = upcoming.length ? upcoming.slice(0, 10) : recent.slice(0, 6);
    if (!displayList.length) {
      const empty = document.createElement('p');
      empty.className = 'calendar-empty';
      empty.textContent = smartCalFixturesLoading
        ? L('Maç programı alınıyor…', 'Fetching match schedule…')
        : L(
          'Gösterilecek maç yok. Yukarıdan 3 kulübe kadar ve 1 milli takım seçebilirsin.',
          'No matches to display. Pick up to 3 clubs and 1 national team above.',
        );
      listEl.appendChild(empty);
    } else {
      displayList.forEach((fx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'we-cal-match-card';
        const dt = new Date(`${fx.date}T12:00:00`);
        const shortDate = window.__weCalendarBridge
          ? window.__weCalendarBridge.formatDate(dt, { day: 'numeric', month: 'short' })
          : fx.date;
        const scorePart = fx.score ? ` (${fx.score})` : '';
        const matchedClub = smartCalConfig.clubs.find((c) => String(c.id) === String(fx.teamId || fx.teamKey));
        const badgeTxt = fx.isNational
          ? (smartCalConfig.nationalTeam?.code || L('Milli', 'NAT'))
          : (matchedClub?.short || L('Maç', 'Match'));
        const subLeague = fx.league || L('Futbol', 'Football');
        btn.innerHTML = `
          <span class="we-cal-agenda-time">${esc(shortDate)}<br>${esc(fx.time || '--:--')}</span>
          <span class="we-cal-agenda-body">
            <strong class="we-cal-agenda-title">${esc(fx.title)}${esc(scorePart)}</strong>
            <span class="we-cal-agenda-sub">${esc(tzBadge ? `${subLeague} · ${tzBadge}` : subLeague)}</span>
          </span>
          <span class="we-cal-badge is-match">${esc(badgeTxt)}</span>
        `;
        btn.addEventListener('click', () => {
          if (!window.__weCalendarBridge) return;
          window.__weCalendarBridge.setSelectedDate(dt);
          window.__weCalendarBridge.setVisibleMonth(dt);
          smartCalActiveTab = 'month';
          window.__weCalendarBridge.renderAll();
          syncSmartCalendarActiveTab();
        });
        listEl.appendChild(btn);
      });
    }
  }
}

function applySmartCalendarLanguage() {
  if (calTabsBar) {
    const tabMap = {
      month: L('Takvim', 'Calendar'),
      schedule: L('Program & Boş', 'Schedule'),
      sports: L('Tatil & Maç', 'Sports & Days'),
    };
    calTabsBar.querySelectorAll('.we-cal-tab-btn').forEach((b) => {
      if (tabMap[b.dataset.calTab]) b.textContent = tabMap[b.dataset.calTab];
    });
  }
  const legendSpans = document.querySelectorAll('#weCalLegend b');
  const legendTexts = [L('Resmi Tatil', 'Holiday'), L('Maç', 'Match'), L('Ders / İş', 'Schedule'), L('Etkinlik', 'Event')];
  legendSpans.forEach((el, idx) => {
    if (legendTexts[idx]) el.textContent = legendTexts[idx];
  });

  // Schedule pane labels
  const setTxt = (id, tr, en) => { const el = document.getElementById(id); if (el) el.textContent = L(tr, en); };
  setTxt('weCalWeekMapTitle', 'Haftalık Boş Zaman Haritası (08:00 – 23:00)', 'Weekly Free-Time Map (08:00 – 23:00)');
  setTxt('weCalAddRuleTitle', 'Ders Programı / Kalıcı İş Rutini Ekle', 'Add Class Schedule or Work Routine');
  setTxt('weCalAddRuleSub', 'Tarih aralığı vererek tüm döneme veya kalıcı olarak işle', 'Apply across a term date range or permanently every week');
  setTxt('weCalRoutineTitleLbl', 'Ders veya İş Adı', 'Class, Work, or Routine Title');
  setTxt('weCalRoutineDaysLbl', 'Hangi Günler?', 'Which Days?');
  setTxt('weCalPresetWeekdaysBtn', 'Hafta İçi (Pzt–Cum)', 'Weekdays (Mon–Fri)');
  setTxt('weCalRoutineStartLbl', 'Başlangıç Saati', 'Start Time');
  setTxt('weCalRoutineEndLbl', 'Bitiş Saati', 'End Time');
  setTxt('weCalRoutineModeLbl', 'Geçerlilik Süresi', 'Duration Mode');
  setTxt('weCalRangeStartLbl', 'Başlangıç Tarihi', 'Start Date');
  setTxt('weCalRangeEndLbl', 'Bitiş Tarihi', 'End Date');
  setTxt('weCalPresetTermBtn', '+14 Hafta (Dönem)', '+14 Weeks (Term)');
  setTxt('weCalPresetMonthBtn', '+1 Ay', '+1 Month');
  setTxt('weCalPresetYearBtn', 'Yıl Sonuna Kadar', 'Until Year End');
  setTxt('weCalSkipHolidaysLbl', 'Resmi tatil günlerinde bu programı otomatik atla', 'Automatically skip on public holidays');
  setTxt('weCalSubmitRuleBtn', 'Programa Ekle ve Takvime İşle', 'Add to Weekly Schedule');
  setTxt('weCalSavedRulesTitle', 'Kayıtlı Haftalık Kurallar', 'Saved Weekly Rules');

  const rtTitle = document.getElementById('weCalRoutineTitle');
  if (rtTitle) rtTitle.placeholder = L('Örn: Veri Yapıları / Ofis Mesaisi', 'e.g. Data Structures / Office Shift');
  const rsInp = document.getElementById('weCalRangeStart');
  const reInp = document.getElementById('weCalRangeEnd');
  if (rsInp) rsInp.placeholder = L('GG.AA.YYYY', 'YYYY-MM-DD');
  if (reInp) reInp.placeholder = L('GG.AA.YYYY', 'YYYY-MM-DD');

  const catLabels = { school: L('Ders / Okul', 'Class / School'), work: L('İş / Mesai', 'Work / Shift'), routine: L('Kişisel Rutin', 'Routine') };
  document.getElementById('weCalRoutineCatGroup')?.querySelectorAll('.we-seg-btn').forEach((b) => {
    if (catLabels[b.dataset.val]) b.textContent = catLabels[b.dataset.val];
  });
  const modeLabels = { range: L('Tarih Aralığı (Dönem)', 'Date Range (Term)'), permanent: L('Kalıcı (Sürekli)', 'Permanent') };
  document.getElementById('weCalRoutineModeGroup')?.querySelectorAll('.we-seg-btn').forEach((b) => {
    if (modeLabels[b.dataset.val]) b.textContent = modeLabels[b.dataset.val];
  });
  document.getElementById('weCalRoutineDays')?.querySelectorAll('.we-cal-day-pill').forEach((b) => {
    b.textContent = getIsoDayShort(Number(b.dataset.day));
  });

  // Sports & Holidays pane labels
  setTxt('weCalHolCardTitle', 'Resmi Tatiller & Önemli Günler', 'Public Holidays & Special Days');
  setTxt('weCalHolCardSub', 'Ülke seç · Ders ve iş kuralları tatillerde otomatik atlanır', 'Choose country · Classes & work auto-skip on holidays');
  setTxt('weCalCountryOffBtn', 'Kapalı', 'Off');
  setTxt('weCalToggleHolidaysLbl', 'Resmi tatilleri göster (okul/iş programını otomatik atlar)', 'Show public holidays (auto-skips recurring schedules)');
  setTxt('weCalToggleSpecialsLbl', 'Önemli günleri ve anma günlerini göster', 'Show observances & special days');
  setTxt('weCalSportsCardTitle', 'Maç Takvimi (Canlı Fikstür)', 'Match Fixtures (Live Schedule)');
  setTxt('weCalRefreshFixturesBtn', 'Yenile', 'Refresh');
  setTxt('weCalNationalSlotLbl', 'Milli Takım (1 Slot)', 'National Team (1 Slot)');
  setTxt('weCalUpcomingLbl', 'Yaklaşan Maçlar (Tıkla → Güne Git)', 'Upcoming Matches (Click → Jump to Day)');

  if (calFootnoteEl) {
    calFootnoteEl.textContent = L(
      'Takvim, ders/iş programların ve takım tercihlerin yerel kullanıcı verilerine kaydedilir.',
      'Your calendar, recurring schedule, and team picks are saved locally.',
    );
  }
}

function renderSmartCalendarTabsUI() {
  updateSmartCalendarSubtitle();
  renderSmartCalendarScheduleTab();
  renderSmartCalendarSportsTab();
}

window.__weCustomRenderCalendar = function renderSmartMonthGrid() {
  const bridge = window.__weCalendarBridge;
  if (!bridge || !calGridEl) return;
  const monthLabelEl = document.getElementById('calendarMonthLabel');
  const visibleMonth = bridge.getVisibleMonth();
  const selectedDate = bridge.getSelectedDate();

  if (monthLabelEl) {
    monthLabelEl.textContent = bridge.formatDate(visibleMonth, { month: 'long', year: 'numeric' });
  }
  calGridEl.replaceChildren();

  const firstOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), 1 - mondayOffset);
  const todayKey = bridge.dateKey(new Date());
  const selectedKey = bridge.dateKey(selectedDate);

  for (let index = 0; index < 42; index += 1) {
    const dt = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
    const key = bridge.dateKey(dt);
    const inMonth = dt.getMonth() === visibleMonth.getMonth();
    const info = getSmartDayData(key);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'calendar-day';
    button.classList.toggle('is-outside', !inMonth);
    button.classList.toggle('is-today', key === todayKey);
    button.classList.toggle('is-selected', key === selectedKey);
    button.classList.toggle('is-holiday', info.hasHoliday);
    button.classList.toggle('has-match', info.hasMatch);
    button.setAttribute('role', 'gridcell');
    button.setAttribute('aria-pressed', key === selectedKey ? 'true' : 'false');
    button.setAttribute('aria-label', `${bridge.formatDate(dt, { weekday: 'long', day: 'numeric', month: 'long' })}, ${info.items.length} ${L('kayıt', 'items')}`);

    const number = document.createElement('span');
    number.className = 'calendar-day-number';
    number.textContent = String(dt.getDate());
    button.appendChild(number);

    const dotClasses = [];
    if (info.hasHoliday) dotClasses.push('dot-holiday');
    if (info.hasMatch) dotClasses.push('dot-match');
    if (info.hasRoutine) dotClasses.push('dot-routine');
    if (info.hasManual) dotClasses.push('dot-event');
    else if (info.hasSpecial && dotClasses.length < 3) dotClasses.push('dot-special');

    if (dotClasses.length) {
      const dots = document.createElement('span');
      dots.className = 'calendar-day-dots';
      dots.setAttribute('aria-hidden', 'true');
      dotClasses.slice(0, 4).forEach((cls) => {
        const marker = document.createElement('i');
        marker.className = cls;
        dots.appendChild(marker);
      });
      button.appendChild(dots);
    }

    button.addEventListener('click', () => {
      bridge.setSelectedDate(dt);
      bridge.renderAll();
      renderSmartCalendarTabsUI();
    });
    calGridEl.appendChild(button);
  }
  updateSmartCalendarSubtitle();
};

window.__weCustomRenderSelectedDay = function renderSmartSelectedDayPanel() {
  const bridge = window.__weCalendarBridge;
  if (!bridge) return;
  const sel = bridge.getSelectedDate();
  const key = bridge.dateKey(sel);
  const info = getSmartDayData(key);

  const selectedDateLabelEl = document.getElementById('calendarSelectedDate');
  const eventCountLabelEl = document.getElementById('calendarEventCount');
  const eventListEl = document.getElementById('calendarEventList');

  if (selectedDateLabelEl) {
    selectedDateLabelEl.textContent = bridge.formatDate(sel, { weekday: 'long', day: 'numeric', month: 'long' });
  }
  if (eventCountLabelEl) {
    eventCountLabelEl.textContent = isEn() ? `${info.items.length} items` : `${info.items.length} kayıt`;
  }

  if (calHolidayBannerSlot) {
    if (info.hasHoliday) {
      const skipMsg = info.skippedByHolidayCount > 0
        ? (isEn()
          ? `${info.skippedByHolidayCount} recurring schedule(s) automatically skipped for this holiday.`
          : `Resmi tatil nedeniyle bu güne ait ${info.skippedByHolidayCount} ders/iş programı otomatik atlandı.`)
        : L('Resmi tatil günü — okul ve iş programları bu güne yazılmaz.', 'Public holiday — recurring school & work schedules are skipped.');
      calHolidayBannerSlot.innerHTML = `
        <div class="we-cal-holiday-banner">
          <strong>${esc(info.holidays.join(' · '))}</strong>
          <small>${esc(skipMsg)}</small>
        </div>
      `;
    } else {
      calHolidayBannerSlot.innerHTML = '';
    }
  }

  if (eventListEl) {
    eventListEl.replaceChildren();
    if (!info.items.length) {
      const empty = document.createElement('p');
      empty.className = 'calendar-empty';
      empty.textContent = L(
        'Bu gün için kayıtlı etkinlik, maç veya ders programı yok.',
        'No events, matches, or classes scheduled for this day.',
      );
      eventListEl.appendChild(empty);
    } else {
      info.items.forEach((item) => {
        const row = document.createElement('article');
        row.className = `we-cal-agenda-row is-${item.kind}`;

        const timeEl = document.createElement('span');
        timeEl.className = 'we-cal-agenda-time';
        timeEl.textContent = item.timeText;

        const bodyEl = document.createElement('div');
        bodyEl.className = 'we-cal-agenda-body';
        const titleEl = document.createElement('span');
        titleEl.className = 'we-cal-agenda-title';
        titleEl.textContent = item.title;
        bodyEl.appendChild(titleEl);
        if (item.subtitle) {
          const subEl = document.createElement('span');
          subEl.className = 'we-cal-agenda-sub';
          subEl.textContent = item.subtitle;
          bodyEl.appendChild(subEl);
        }

        const rightSlot = document.createElement('div');
        rightSlot.className = 'flex items-center gap-1.5';
        const badgeEl = document.createElement('span');
        badgeEl.className = `we-cal-badge is-${item.kind}`;
        badgeEl.textContent = item.badge;
        rightSlot.appendChild(badgeEl);

        if (item.manualId) {
          const delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.className = 'calendar-event-remove';
          delBtn.textContent = '×';
          delBtn.title = L('Etkinliği sil', 'Delete event');
          delBtn.setAttribute('aria-label', `${L('Etkinliği sil', 'Delete event')}: ${item.title}`);
          delBtn.addEventListener('click', () => {
            bridge.removeEvent(item.manualId);
            bridge.renderAll();
            renderSmartCalendarTabsUI();
          });
          rightSlot.appendChild(delBtn);
        }

        row.append(timeEl, bodyEl, rightSlot);
        eventListEl.appendChild(row);
      });
    }
  }

  if (calFreeSummarySlot) {
    const chipsHtml = info.free.length
      ? info.free.map((slot) => `<span class="we-cal-free-chip">${esc(slot.label)}</span>`).join('')
      : `<span class="we-cal-free-chip">${L('Serbest aralık yok', 'No free slots')}</span>`;
    calFreeSummarySlot.innerHTML = `
      <div class="we-cal-free-box">
        <div class="we-cal-free-head">
          <span class="we-cal-free-label font-pixel">${L('BOŞ ZAMANLAR (08:00–23:00)', 'FREE TIME (08:00–23:00)')}</span>
          <span class="we-cal-free-total">${formatDurationLocalized(info.totalFreeMins)} ${L('boş', 'free')}</span>
        </div>
        <div class="we-cal-free-chips">${chipsHtml}</div>
      </div>
    `;
  }
  if (smartCalActiveTab === 'schedule') renderSmartCalendarScheduleTab();
};

window.__weRefreshSmartCalendarFromStorage = function refreshSmartCalendarFromStorage() {
  smartCalConfig = normalizeSmartCalConfig(lsGet(CAL_SMART_CFG_KEY, DEFAULT_CAL_SMART_CFG));
  smartCalRoutines = normalizeCalendarRoutines(lsGet(CAL_ROUTINES_KEY, []));
  if (window.__weCalendarBridge) {
    window.__weCalendarBridge.reloadEvents();
    window.__weCalendarBridge.renderAll();
  }
  renderSmartCalendarTabsUI();
  window.__weRefreshCalendarFixtures(false);
};

// Boot Smart Calendar UI & fetch initial live fixtures
mountSmartCalendarUI();
applySmartCalendarLanguage();
if (window.__weCalendarBridge) {
  window.__weCalendarBridge.renderAll();
}
renderSmartCalendarTabsUI();
if (bridgeOnline) {
  window.__weRefreshCalendarFixtures(false);
}

// ============================================================================
// 17. PIXEL-ART SYSTEM & DIORAMA TELEMETRY MONITOR (#weSystemWidget)
//     Bottom-right Optical Liquid Glass twin of #weMusicWidget displaying live
//     CPU, RAM, GPU, temperatures, VRAM, and Diorama's own CPU/RAM/GPU/FPS load.
// ============================================================================
const SYS_PIXEL_ICONS = {
  cpu: `<svg class="we-sys-px-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="14" height="14" shape-rendering="crispEdges" aria-hidden="true">
    <rect x="3" y="0" width="1" height="2" fill="#94a3b8"/><rect x="5" y="0" width="2" height="2" fill="#94a3b8"/><rect x="8" y="0" width="1" height="2" fill="#94a3b8"/>
    <rect x="3" y="10" width="1" height="2" fill="#94a3b8"/><rect x="5" y="10" width="2" height="2" fill="#94a3b8"/><rect x="8" y="10" width="1" height="2" fill="#94a3b8"/>
    <rect x="0" y="3" width="2" height="1" fill="#94a3b8"/><rect x="0" y="5" width="2" height="2" fill="#94a3b8"/><rect x="0" y="8" width="2" height="1" fill="#94a3b8"/>
    <rect x="10" y="3" width="2" height="1" fill="#94a3b8"/><rect x="10" y="5" width="2" height="2" fill="#94a3b8"/><rect x="10" y="8" width="2" height="1" fill="#94a3b8"/>
    <rect x="2" y="2" width="8" height="8" fill="#1e293b"/><rect x="3" y="3" width="6" height="6" fill="#0f172a"/>
    <rect x="4" y="4" width="4" height="4" fill="#38bdf8"/><rect x="5" y="5" width="2" height="2" fill="#e0f2fe"/>
  </svg>`,
  ram: `<svg class="we-sys-px-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="14" height="14" shape-rendering="crispEdges" aria-hidden="true">
    <rect x="1" y="3" width="10" height="6" fill="#10b981"/><rect x="1" y="3" width="10" height="1" fill="#34d399"/>
    <rect x="2" y="4" width="2" height="3" fill="#0f172a"/><rect x="5" y="4" width="2" height="3" fill="#0f172a"/><rect x="8" y="4" width="2" height="3" fill="#0f172a"/>
    <rect x="2" y="9" width="1" height="1" fill="#facc15"/><rect x="4" y="9" width="1" height="1" fill="#facc15"/><rect x="6" y="9" width="1" height="1" fill="#facc15"/><rect x="8" y="9" width="1" height="1" fill="#facc15"/><rect x="10" y="9" width="1" height="1" fill="#facc15"/>
  </svg>`,
  gpu: `<svg class="we-sys-px-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="14" height="14" shape-rendering="crispEdges" aria-hidden="true">
    <rect x="0" y="2" width="1" height="8" fill="#cbd5e1"/>
    <rect x="1" y="3" width="10" height="6" fill="#334155"/><rect x="1" y="3" width="10" height="1" fill="#64748b"/>
    <rect x="3" y="4" width="4" height="4" fill="#0f172a"/>
    <rect x="4" y="4" width="2" height="1" fill="#fbbf24"/><rect x="4" y="7" width="2" height="1" fill="#fbbf24"/>
    <rect x="3" y="5" width="1" height="2" fill="#f59e0b"/><rect x="6" y="5" width="1" height="2" fill="#f59e0b"/>
    <rect x="4" y="5" width="2" height="2" fill="#fef08a"/>
    <rect x="8" y="5" width="2" height="2" fill="#38bdf8"/>
    <rect x="3" y="9" width="5" height="1" fill="#facc15"/>
  </svg>`,
  diorama: `<svg class="we-sys-px-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12" shape-rendering="crispEdges" aria-hidden="true">
    <rect x="5" y="1" width="2" height="2" fill="#bae6fd"/>
    <rect x="3" y="3" width="6" height="2" fill="#38bdf8"/>
    <rect x="2" y="5" width="8" height="2" fill="#0ea5e9"/>
    <rect x="4" y="4" width="2" height="2" fill="#f0f9ff"/>
    <rect x="3" y="7" width="6" height="2" fill="#38bdf8"/>
    <rect x="5" y="9" width="2" height="2" fill="#7dd3fc"/>
  </svg>`,
};

function getLoadBarColor(pct) {
  const v = Number(pct);
  if (!Number.isFinite(v)) return '#7dd3fc';
  if (v >= 85) return '#fb7185';
  if (v >= 65) return '#fbbf24';
  return '#7dd3fc';
}

function getTempToneClass(tempC) {
  const t = Number(tempC);
  if (!Number.isFinite(t)) return '';
  if (t >= 82) return 'is-hot';
  if (t >= 68) return 'is-warm';
  return '';
}

function formatTempShort(tempC) {
  return Number.isFinite(Number(tempC)) ? `${Math.round(Number(tempC))}°C` : '—';
}

function formatMbOrGb(mb) {
  const n = Number(mb);
  if (!Number.isFinite(n)) return '--';
  if (n >= 1024) return `${(n / 1024).toFixed(1)}G`;
  return `${Math.round(n)}M`;
}

const SYS_TOGGLE_SVGS = {
  collapse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
};

const sysWidgetEl = document.createElement('aside');
sysWidgetEl.id = 'weSystemWidget';
sysWidgetEl.setAttribute('role', 'region');
sysWidgetEl.setAttribute('aria-label', 'Sistem ve Diorama Performans Monitörü');
sysWidgetEl.className = `optical-glass zen-fade zen-hide${weSettings.systemCompact ? ' is-compact' : ''}`;
sysWidgetEl.innerHTML = `
  <canvas class="glass-lens" aria-hidden="true"></canvas>
  <div class="we-sys-head">
    <div class="we-sys-head-left">
      <span id="weSysLiveDot" class="we-sys-live-dot"></span>
      <span id="weSysKickerLabel" class="we-sys-kicker">${weSettings.systemCompact ? 'SİSTEM' : 'SİSTEM · CANLI'}</span>
    </div>
    <div class="we-sys-head-right">
      <button id="weSysCompactToggleBtn" type="button" title="Kompakt / Geniş Görünüm" aria-label="Sistem monitörünü küçült veya genişlet" class="we-music-mini-btn">
        ${weSettings.systemCompact ? SYS_TOGGLE_SVGS.expand : SYS_TOGGLE_SVGS.collapse}
      </button>
    </div>
  </div>

  <div class="we-sys-metrics">
    <div class="we-sys-row">
      ${SYS_PIXEL_ICONS.cpu}
      <span class="we-sys-label">CPU</span>
      <div class="we-sys-pixel-track"><span id="weSysCpuBar"></span></div>
      <span id="weSysCpuPct" class="we-sys-val">--%</span>
      <span id="weSysCpuTemp" class="we-sys-sec">—</span>
    </div>
    <div class="we-sys-row">
      ${SYS_PIXEL_ICONS.ram}
      <span class="we-sys-label">RAM</span>
      <div class="we-sys-pixel-track"><span id="weSysRamBar"></span></div>
      <span id="weSysRamPct" class="we-sys-val">--%</span>
      <span id="weSysRamGb" class="we-sys-sec">--G</span>
    </div>
    <div class="we-sys-row">
      ${SYS_PIXEL_ICONS.gpu}
      <span class="we-sys-label">GPU</span>
      <div class="we-sys-pixel-track"><span id="weSysGpuBar"></span></div>
      <span id="weSysGpuPct" class="we-sys-val">--%</span>
      <span id="weSysGpuTemp" class="we-sys-sec">—</span>
    </div>
  </div>

  <div class="we-sys-gpu-sub">
    <span id="weSysGpuName">GPU algılanıyor…</span>
    <span id="weSysVramText">—</span>
  </div>

  <div id="weSysDioramaWell" class="we-sys-diorama-well" title="Diorama duvar kağıdı ve köprü servisinin canlı kaynak kullanımı">
    <div class="we-sys-diorama-head">
      <div class="we-sys-diorama-head-left">
        ${SYS_PIXEL_ICONS.diorama}
        <span class="we-sys-diorama-title">BU PROJE (DİORAMA)</span>
      </div>
      <span id="weSysDioramaTier" class="we-sys-diorama-tier">1x Std</span>
    </div>
    <div id="weSysDioramaGrid" class="we-sys-diorama-grid">
      <div class="we-sys-diorama-cell">
        <small>RAM</small>
        <strong id="weSysDioRam">-- MB</strong>
      </div>
    </div>
  </div>

  <div class="we-sys-compact-grid">
    <div class="we-sys-compact-pill"><small>CPU</small><strong id="weSysMiniCpu">--%</strong></div>
    <div class="we-sys-compact-pill"><small>RAM</small><strong id="weSysMiniRam">--%</strong></div>
    <div class="we-sys-compact-pill"><small>GPU</small><strong id="weSysMiniGpu">--%</strong></div>
    <div class="we-sys-compact-pill"><small>PRJ</small><strong id="weSysMiniDio">--M</strong></div>
  </div>
`;
document.body.appendChild(sysWidgetEl);
repaintGlassNow();

let sysStatsState = null;

function setSystemCompactMode(compact) {
  weSettings.systemCompact = Boolean(compact);
  sysWidgetEl.classList.toggle('is-compact', weSettings.systemCompact);
  const toggleBtn = document.getElementById('weSysCompactToggleBtn');
  if (toggleBtn) {
    toggleBtn.innerHTML = weSettings.systemCompact ? SYS_TOGGLE_SVGS.expand : SYS_TOGGLE_SVGS.collapse;
  }
  const kickerEl = document.getElementById('weSysKickerLabel');
  if (kickerEl) {
    kickerEl.textContent = weSettings.systemCompact ? L('SİSTEM', 'SYSTEM') : L('SİSTEM · CANLI', 'SYSTEM · LIVE');
  }
  markInAppSettingsModified();
  lsSet(WE_SETTINGS_STORAGE_KEY, weSettings);
  if (typeof window.__weFlushUserStateSync === 'function') window.__weFlushUserStateSync();
  window.__weGlassRectsDirty = true;
  if (typeof window.__weTrackGlassTransition === 'function') window.__weTrackGlassTransition(380);
  repaintGlassNow();
}

sysWidgetEl.addEventListener('transitionend', (e) => {
  if (e.target === sysWidgetEl && (e.propertyName === 'width' || e.propertyName === 'padding')) {
    repaintGlassNow();
  }
});

document.getElementById('weSysCompactToggleBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  setSystemCompactMode(!weSettings.systemCompact);
});

function renderSystemMonitorUI() {
  const dotEl = document.getElementById('weSysLiveDot');
  const tierEl = document.getElementById('weSysDioramaTier');
  const kickerEl = document.getElementById('weSysKickerLabel');
  const dioTitleEl = sysWidgetEl.querySelector('.we-sys-diorama-title');
  const tierVal = Number(window.__weDetailTier) || 1;
  const tierLabel = tierVal === 3 ? '3x Ultra' : tierVal === 2 ? '2x HD' : '1x Std';

  if (kickerEl) kickerEl.textContent = weSettings.systemCompact ? L('SİSTEM', 'SYSTEM') : L('SİSTEM · CANLI', 'SYSTEM · LIVE');
  if (dioTitleEl) dioTitleEl.textContent = L('BU PROJE (DİORAMA)', 'THIS PROJECT (DIORAMA)');
  if (tierEl) tierEl.textContent = tierLabel;
  if (dotEl) dotEl.classList.toggle('is-offline', !bridgeOnline || !sysStatsState);

  const jsHeapMb = (performance && performance.memory && Number.isFinite(performance.memory.usedJSHeapSize))
    ? Math.round(performance.memory.usedJSHeapSize / (1024 * 1024))
    : null;

  if (!sysStatsState) {
    const gpuNameInit = document.getElementById('weSysGpuName');
    if (gpuNameInit) gpuNameInit.textContent = L('GPU algılanıyor…', 'Detecting GPU…');
    const dioRamEl = document.getElementById('weSysDioRam');
    const miniDioEl = document.getElementById('weSysMiniDio');
    if (dioRamEl && jsHeapMb !== null) dioRamEl.textContent = `${jsHeapMb} MB`;
    if (miniDioEl && jsHeapMb !== null) miniDioEl.textContent = `${jsHeapMb}M`;
    return;
  }

  const cpu = sysStatsState.cpu || {};
  const ram = sysStatsState.ram || {};
  const gpu = sysStatsState.gpu || {};
  const dio = sysStatsState.diorama || {};

  // CPU Row
  const cpuPct = Number.isFinite(cpu.pct) ? Math.round(cpu.pct) : null;
  const cpuBar = document.getElementById('weSysCpuBar');
  const cpuPctEl = document.getElementById('weSysCpuPct');
  const cpuTempEl = document.getElementById('weSysCpuTemp');
  if (cpuBar && cpuPct !== null) {
    cpuBar.style.width = `${Math.max(4, Math.min(100, cpuPct))}%`;
    cpuBar.style.setProperty('--sys-bar-color', getLoadBarColor(cpuPct));
  }
  if (cpuPctEl) cpuPctEl.textContent = cpuPct !== null ? `${cpuPct}%` : '--%';
  const hasRealCpuTemp = Number.isFinite(cpu.tempC);
  if (cpuTempEl) {
    cpuTempEl.textContent = hasRealCpuTemp ? formatTempShort(cpu.tempC) : '—';
    cpuTempEl.className = `we-sys-sec ${hasRealCpuTemp ? getTempToneClass(cpu.tempC) : 'is-muted'}`.trim();
    cpuTempEl.title = hasRealCpuTemp
      ? `${L('İşlemci sıcaklığı', 'CPU temperature')}: ${cpu.tempC}°C`
      : L(
        'Gerçek işlemci sıcaklığı için HWiNFO64 / MSI Afterburner / Core Temp / LibreHardwareMonitor gerekir',
        'Live CPU temperature requires HWiNFO64 / MSI Afterburner / Core Temp / LibreHardwareMonitor',
      );
  }

  // RAM Row
  const ramPct = Number.isFinite(ram.pct) ? Math.round(ram.pct) : null;
  const ramBar = document.getElementById('weSysRamBar');
  const ramPctEl = document.getElementById('weSysRamPct');
  const ramGbEl = document.getElementById('weSysRamGb');
  if (ramBar && ramPct !== null) {
    ramBar.style.width = `${Math.max(4, Math.min(100, ramPct))}%`;
    ramBar.style.setProperty('--sys-bar-color', getLoadBarColor(ramPct));
  }
  if (ramPctEl) ramPctEl.textContent = ramPct !== null ? `${ramPct}%` : '--%';
  if (ramGbEl) {
    ramGbEl.textContent = Number.isFinite(ram.usedGb) ? `${ram.usedGb.toFixed(1)}G` : '--G';
    if (Number.isFinite(ram.usedGb) && Number.isFinite(ram.totalGb)) {
      ramGbEl.title = `${ram.usedGb.toFixed(1)} GB / ${ram.totalGb.toFixed(0)} GB RAM`;
    }
  }

  // GPU Row
  const gpuPct = Number.isFinite(gpu.pct) ? Math.round(gpu.pct) : null;
  const gpuBar = document.getElementById('weSysGpuBar');
  const gpuPctEl = document.getElementById('weSysGpuPct');
  const gpuTempEl = document.getElementById('weSysGpuTemp');
  if (gpuBar && gpuPct !== null) {
    gpuBar.style.width = `${Math.max(3, Math.min(100, gpuPct))}%`;
    gpuBar.style.setProperty('--sys-bar-color', getLoadBarColor(gpuPct));
  }
  if (gpuPctEl) gpuPctEl.textContent = gpuPct !== null ? `${gpuPct}%` : '--%';
  const hasGpuTemp = Number.isFinite(gpu.tempC);
  if (gpuTempEl) {
    gpuTempEl.textContent = hasGpuTemp ? formatTempShort(gpu.tempC) : '—';
    gpuTempEl.className = `we-sys-sec ${hasGpuTemp ? getTempToneClass(gpu.tempC) : 'is-muted'}`.trim();
  }

  // Honest Hybrid GPU Subline (distinguishes Intel/AMD iGPU vs active NVIDIA dGPU cleanly!)
  const gpuNameEl = document.getElementById('weSysGpuName');
  const vramEl = document.getElementById('weSysVramText');
  if (gpu.mode === 'igpu') {
    const cleanName = gpu.name === 'Dahili GPU' ? L('Dahili GPU', 'Integrated GPU') : (gpu.name || L('Dahili GPU', 'Integrated GPU'));
    if (gpuNameEl) gpuNameEl.textContent = `${cleanName} (${L('Aktif', 'Active')})`;
    if (vramEl) {
      const dgpuShort = (gpu.dgpuName || '').replace(/\s+Laptop$/i, '');
      vramEl.textContent = dgpuShort
        ? `${dgpuShort} ${L('Boşta', 'Idle')}`
        : (Number.isFinite(ram.usedGb) && Number.isFinite(ram.totalGb) ? `RAM ${ram.usedGb.toFixed(1)}/${ram.totalGb.toFixed(0)}G` : L('Güç tasarrufu', 'Power saver'));
    }
  } else {
    if (gpuNameEl) {
      const pwrPart = Number.isFinite(gpu.powerW) ? ` · ${Math.round(gpu.powerW)}W` : '';
      gpuNameEl.textContent = `${gpu.name || 'GPU'}${pwrPart}`;
    }
    if (vramEl) {
      if (Number.isFinite(gpu.vramUsedMb) && Number.isFinite(gpu.vramTotalMb)) {
        vramEl.textContent = `VRAM ${formatMbOrGb(gpu.vramUsedMb)}/${formatMbOrGb(gpu.vramTotalMb)}`;
      } else {
        vramEl.textContent = L('Aktif', 'Active');
      }
    }
  }

  // Dynamic Diorama Project Footprint Strip — ONLY shows active/non-zero metrics (never useless 0.0% boxes!)
  const dioGrid = document.getElementById('weSysDioramaGrid');
  const dioWell = document.getElementById('weSysDioramaWell');
  const dioRamNum = Number.isFinite(dio.ramMb) && dio.ramMb > 0 ? Math.round(dio.ramMb) : jsHeapMb;
  const dioCells = [];

  if (Number.isFinite(dio.cpuPct) && dio.cpuPct >= 0.1) {
    dioCells.push({ label: 'CPU', value: `${dio.cpuPct.toFixed(1)}%` });
  }
  dioCells.push({ label: 'RAM', value: dioRamNum !== null ? `${dioRamNum} MB` : '-- MB' });
  const hasDioGpuPct = Number.isFinite(dio.gpuPct) && dio.gpuPct >= 0.1;
  const hasDioVram = Number.isFinite(dio.vramMb) && dio.vramMb >= 1;
  if (hasDioGpuPct || hasDioVram) {
    const gpuStr = hasDioGpuPct && hasDioVram
      ? `${dio.gpuPct.toFixed(1)}%·${Math.round(dio.vramMb)}M`
      : hasDioGpuPct
        ? `${dio.gpuPct.toFixed(1)}%`
        : `${Math.round(dio.vramMb)} MB`;
    dioCells.push({ label: 'GPU', value: gpuStr });
  }

  if (dioGrid) {
    dioGrid.style.gridTemplateColumns = `repeat(${dioCells.length}, minmax(0, 1fr))`;
    dioGrid.innerHTML = dioCells
      .map((cell) => `<div class="we-sys-diorama-cell"><small>${cell.label}</small><strong>${esc(cell.value)}</strong></div>`)
      .join('');
  }

  if (dioWell) {
    const parts = [];
    if (Number.isFinite(dio.wallpaperRamMb) && dio.wallpaperRamMb > 0) parts.push(`${L('Duvar Kağıdı', 'Wallpaper')}: ${Math.round(dio.wallpaperRamMb)} MB`);
    if (Number.isFinite(dio.bridgeRamMb) && dio.bridgeRamMb > 0) parts.push(`${L('Köprü', 'Bridge')}: ${Math.round(dio.bridgeRamMb)} MB`);
    if (jsHeapMb !== null) parts.push(`JS Heap: ${jsHeapMb} MB`);
    if (hasDioVram) parts.push(`${L('GPU Bellek', 'GPU Memory')}: ${Math.round(dio.vramMb)} MB`);
    if (parts.length) dioWell.title = parts.join(' · ');
  }

  // Compact Mini Grid
  const miniCpu = document.getElementById('weSysMiniCpu');
  const miniRam = document.getElementById('weSysMiniRam');
  const miniGpu = document.getElementById('weSysMiniGpu');
  const miniDio = document.getElementById('weSysMiniDio');
  if (miniCpu) miniCpu.textContent = `${cpuPct !== null ? `${cpuPct}%` : '--'}${hasRealCpuTemp ? ` ${Math.round(cpu.tempC)}°` : ''}`;
  if (miniRam) miniRam.textContent = ramPct !== null ? `${ramPct}%` : '--%';
  if (miniGpu) miniGpu.textContent = `${gpuPct !== null ? `${gpuPct}%` : '--'}${hasGpuTemp ? ` ${Math.round(gpu.tempC)}°` : ''}`;
  if (miniDio) miniDio.textContent = dioRamNum !== null ? `${dioRamNum}M` : '--M';
}

window.__wePollSystemStats = async function pollSystemStats() {
  if (!bridgeOnline || document.hidden || weWallpaperPaused || !weSettings.showSystem || document.body.classList.contains('zen-active')) {
    renderSystemMonitorUI();
    return;
  }
  try {
    const res = await fetch(`${BRIDGE_BASE_URL}/api/desktop/system/stats`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.status === 'ok') {
      sysStatsState = data;
      renderSystemMonitorUI();
    }
  } catch {}
};

renderSystemMonitorUI();
if (bridgeOnline) window.__wePollSystemStats();
setInterval(() => {
  if (weWallpaperPaused || document.hidden || !weSettings.showSystem) return;
  if (bridgeOnline) window.__wePollSystemStats();
  else renderSystemMonitorUI();
}, 3500);

// ============================================================================
// 18. FULL BILINGUAL ENGINE (TURKISH <-> IDIOMATIC ENGLISH)
//     Translates all desktop chrome, popovers, weather telemetry, focus HUD,
//     journal, data manager, news feeds, and settings cleanly with zero text
//     overflow and zero mutation of native Turkish strings when TR is active.
// ============================================================================
const WX_EN = {
  0: 'Clear sky', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Rime fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
  56: 'Freezing drizzle', 57: 'Freezing drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  66: 'Freezing rain', 67: 'Freezing rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Light showers', 81: 'Showers', 82: 'Heavy showers',
  85: 'Light snow showers', 86: 'Snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm w/ hail', 99: 'Severe thunderstorm',
};

const DIRS_EN = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const MOON_EN = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
const WX_PREVIEW_EN = ['Clear', 'Partly cloudy', 'Overcast', 'Rain', 'Storm', 'Snow', 'Fog'];

function uvNameEn(u) {
  return u < 3 ? 'Low' : u < 6 ? 'Moderate' : u < 8 ? 'High' : u < 11 ? 'Very High' : 'Extreme';
}

function airQualityDescriptorEn(value) {
  if (value <= 20) return { label: 'Good', tone: 'good', note: 'Clean air for outdoor activity' };
  if (value <= 40) return { label: 'Fair', tone: 'fair', note: 'Acceptable for most people' };
  if (value <= 60) return { label: 'Moderate', tone: 'moderate', note: 'Sensitive groups take care' };
  if (value <= 80) return { label: 'Poor', tone: 'poor', note: 'Consider reducing outdoor exertion' };
  if (value <= 100) return { label: 'Very Poor', tone: 'very-poor', note: 'Avoid prolonged time outdoors' };
  return { label: 'Extreme', tone: 'extreme', note: 'Limit outdoor exposure' };
}

window.__weTranslateWeatherPreviews = function translateWeatherPreviews() {
  const box = document.getElementById('wxPreview');
  if (!box) return;
  const btns = box.querySelectorAll('.wx-preview-button');
  btns.forEach((b, i) => {
    const label = isEn() ? (WX_PREVIEW_EN[i] || '') : (WX_PREVIEWS[i]?.[1] || '');
    if (label) {
      b.title = label;
      b.setAttribute('aria-label', isEn() ? `Preview ${label}` : `${label} önizlemesi`);
    }
  });
};

window.__weTranslateWeatherPanel = function translateWeatherPanel(data) {
  if (!data || !data.current || !data.daily || !data.hourly) return;
  if (!isEn()) {
    // Tighten 4-column Turkish weather stat labels so they never truncate inside 4-up cards
    document.querySelectorAll('#wxStats .wx-stat-label').forEach((lbl) => {
      if (lbl.textContent === 'Yağış olasılığı') lbl.textContent = 'Yağış';
      else if (lbl.textContent === 'Bulut örtüsü') lbl.textContent = 'Bulut';
    });
    return;
  }
  const c = data.current;
  const dy = data.daily;
  const hr = data.hourly;
  const isDay = Boolean(c.is_day);

  const condEl = document.getElementById('wxCondition');
  if (condEl) condEl.textContent = WX_EN[c.weather_code] || 'Unknown';
  const detailEl = document.getElementById('weatherDetailText');
  if (detailEl) {
    detailEl.textContent = `Feels like ${Math.round(c.apparent_temperature)}° • High ${Math.round(dy.temperature_2m_max[0])}°, Low ${Math.round(dy.temperature_2m_min[0])}°`;
  }

  const statsEl = document.getElementById('wxStats');
  if (statsEl) {
    const stat = (label, value, icon) => `
      <div class="wx-stat-card">
        <span class="wx-stat-icon" aria-hidden="true">${icon}</span>
        <span class="wx-stat-label">${label}</span>
        <strong class="wx-stat-value">${esc(value)}</strong>
      </div>`;
    statsEl.innerHTML = [
      stat('Humidity', `${Math.round(c.relative_humidity_2m)}%`, '◌'),
      stat('Wind', `${Math.round(c.wind_speed_10m)} km/h ${DIRS_EN[Math.round(c.wind_direction_10m / 45) % 8]}`, '↗'),
      stat('Rain', `${dy.precipitation_probability_max[0] ?? 0}%`, '⌁'),
      stat('Clouds', `${Math.round(c.cloud_cover)}%`, '☁'),
    ].join('');
  }

  const astralEl = document.getElementById('wxAstral');
  if (astralEl) {
    const uv = Math.max(0, Number(dy.uv_index_max[0]) || 0);
    const uvPct = Math.min(100, (uv / 11) * 100);
    const phase = Math.round(moonPhaseNow() * 8) % 8;
    const live = WX.live;
    const skyPct = live ? Math.round(clamp01(live.isDay ? live.sunP : live.moonP) * 100) : 0;
    const dayState = isDay ? 'Sun above horizon' : 'Night sky';
    astralEl.innerHTML = `
      <section class="wx-solar-card">
        <div class="wx-solar-heading">
          <span>DAYLIGHT</span>
          <strong>${dayState}</strong>
        </div>
        <div class="wx-solar-track ${isDay ? 'is-day' : 'is-night'}" role="img" aria-label="Sunrise ${hhmm(dy.sunrise[0])}, sunset ${hhmm(dy.sunset[0])}">
          <span class="wx-solar-glow" style="width:${skyPct}%"></span>
          <span class="wx-solar-marker" style="left:${skyPct}%">${isDay ? '☀' : '☾'}</span>
        </div>
        <div class="wx-solar-times">
          <span><i>↗</i><small>SUNRISE</small><strong>${hhmm(dy.sunrise[0])}</strong></span>
          <span><i>↘</i><small>SUNSET</small><strong>${hhmm(dy.sunset[0])}</strong></span>
        </div>
      </section>
      <div class="wx-celestial-grid">
        <section class="wx-uv-card">
          <div class="wx-mini-heading"><span>UV INDEX</span><span>☀</span></div>
          <div class="wx-mini-value"><strong>${Math.round(uv)}</strong><span>${uvNameEn(uv)}</span></div>
          <div class="wx-uv-track"><span style="width:${uvPct}%"></span></div>
          <small>Daily peak UV</small>
        </section>
        <section class="wx-moon-card">
          <div class="wx-mini-heading"><span>MOON PHASE</span><span>SKY</span></div>
          <div class="wx-moon-display"><span class="wx-moon-art">${pixelMoonMarkup(phase)}</span><strong>${MOON_EN[phase]}</strong></div>
          <small>Current lunar cycle</small>
        </section>
      </div>`;
  }

  const airBox = document.getElementById('wxAirQuality');
  if (airBox) {
    const aq = WX.airQuality;
    if (validAirQualityCurrent(aq)) {
      const q = airQualityDescriptorEn(aq.european_aqi);
      airBox.innerHTML = `
        <section class="wx-air-card is-${q.tone}">
          <div class="wx-air-main">
            <div class="wx-air-symbol" aria-hidden="true">✺</div>
            <div class="wx-air-copy">
              <span>AIR QUALITY · EUROPEAN AQI</span>
              <strong>${q.label}</strong>
              <small>${q.note}</small>
            </div>
            <div class="wx-air-score"><strong>${Math.round(aq.european_aqi)}</strong><small>AQI</small></div>
          </div>
          <div class="wx-air-pollutants">
            <span>PM2.5 <strong>${aq.pm2_5.toFixed(1)} <small>µg/m³</small></strong></span>
            <span>PM10 <strong>${aq.pm10.toFixed(1)} <small>µg/m³</small></strong></span>
          </div>
          <p class="wx-air-disclaimer">CAMS forecast · ~11–45 km regional grid resolution</p>
        </section>`;
    } else {
      airBox.innerHTML = `
        <section class="wx-air-card wx-air-unavailable">
          <div class="wx-air-main">
            <div class="wx-air-symbol" aria-hidden="true">✺</div>
            <div class="wx-air-copy">
              <span>AIR QUALITY</span>
              <strong>Waiting for data</strong>
              <small>Weather forecast remains active.</small>
            </div>
          </div>
        </section>`;
    }
  }

  const hourlyBox = document.getElementById('wxHourly');
  if (hourlyBox) {
    const firstLbl = hourlyBox.querySelector('.wx-hour-card .wx-hour-label');
    if (firstLbl && firstLbl.textContent === 'Şimdi') firstLbl.textContent = 'Now';
    hourlyBox.querySelectorAll('.wx-hour-rain').forEach((el) => {
      if (el.textContent.startsWith('%')) el.textContent = `${el.textContent.slice(1)}%`;
    });
  }

  const dailyBox = document.getElementById('wxDaily');
  if (dailyBox && Array.isArray(dy.time)) {
    const rows = dailyBox.querySelectorAll('.wx-daily-row');
    rows.forEach((row, index) => {
      const nameEl = row.querySelector('.wx-daily-name');
      if (nameEl && dy.time[index]) {
        nameEl.textContent = index === 0
          ? 'Today'
          : index === 1
            ? 'Tomorrow'
            : new Date(`${dy.time[index]}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
      }
      const rainEl = row.querySelector('.wx-daily-rain');
      if (rainEl && rainEl.textContent.startsWith('%')) {
        rainEl.textContent = `${rainEl.textContent.slice(1)}%`;
      }
    });
  }
};

window.__weTranslateFocusUI = function translateFocusUI(sessionObj, totalSecVal) {
  const en = isEn();
  const sess = sessionObj || (typeof focusSession !== 'undefined' ? focusSession : null);
  const tot = Number.isFinite(totalSecVal) ? totalSecVal : (typeof focusTotalSec !== 'undefined' ? focusTotalSec : 1500);
  const mins = Math.round(tot / 60);
  const status = sess?.status || 'idle';
  const running = status === 'running';

  const badge = document.getElementById('focusSessionBadge');
  const stageDur = document.getElementById('focusStageDuration');
  const toggleBtn = document.getElementById('focusTogglePlay');
  const stageToggle = document.getElementById('focusStageToggle');
  const statusSub = document.getElementById('focusStatusSub');
  const stageStatus = document.getElementById('focusStageStatus');
  const stageTask = document.getElementById('focusStageTask');

  if (badge) badge.textContent = en ? `${mins}m` : `${mins} DK`;
  if (stageDur) stageDur.textContent = en ? `${mins}m` : `${mins} DK`;
  if (toggleBtn) {
    toggleBtn.textContent = en
      ? (running ? 'Pause' : status === 'completed' ? 'Restart' : status === 'paused' ? 'Resume' : 'Start')
      : (running ? 'Duraklat' : status === 'completed' ? 'Tekrar Başla' : status === 'paused' ? 'Devam Et' : 'Başlat');
  }
  if (stageToggle) {
    stageToggle.textContent = en
      ? (running ? 'PAUSE' : status === 'completed' ? 'RESTART' : 'RESUME')
      : (running ? 'Duraklat' : status === 'completed' ? 'Tekrar Başla' : 'Devam Et');
  }
  if (statusSub) {
    statusSub.textContent = en
      ? (status === 'running' ? 'Focus session active' : status === 'paused' ? 'Paused' : status === 'completed' ? 'Session complete' : 'Timer ready')
      : (status === 'running' ? 'Odak oturumu aktif' : status === 'paused' ? 'Duraklatıldı' : status === 'completed' ? 'Oturum tamamlandı' : 'Zamanlayıcı hazır');
  }
  if (stageStatus) {
    stageStatus.textContent = en
      ? (status === 'running' ? 'FOCUSING IN YOUR HABITAT' : status === 'paused' ? 'SESSION PAUSED' : 'SESSION COMPLETE')
      : (status === 'running' ? 'HABİTATINDA ODAKLANIYORSUN' : status === 'paused' ? 'OTURUM DURAKLATILDI' : 'OTURUM TAMAMLANDI');
  }
  if (stageTask) {
    stageTask.textContent = sess?.task
      ? `${en ? 'GOAL' : 'HEDEF'}: ${sess.task}`
      : (en ? 'MOVE AT YOUR OWN PACE' : 'KENDİ RİTMİNDE İLERLE');
  }
};

function applySettingsPopoverLanguage() {
  const setTxt = (id, tr, en) => { const el = document.getElementById(id); if (el) el.textContent = L(tr, en); };
  setTxt('weSetEyebrow', 'Diorama · Masaüstü Motoru', 'Diorama · Desktop Engine');
  setTxt('weSetTitle', 'Duvar Kağıdı & Liquid Glass Ayarları', 'Wallpaper & Liquid Glass Settings');
  setTxt('weResetDefaultsBtn', 'Sıfırla', 'Reset');
  setTxt('weSetLangTitle', 'Dil / Language', 'Language / Dil');

  setTxt('weSetSec1Title', '1. Sahne Performansı & Görsel Detay Seviyesi', '1. Scene Performance & Visual Detail');
  setTxt('weSetPerfProfileLabel', 'Performans Profili (Tek Tıkla Seç)', 'Performance Profile (1-Click Preset)');
  setTxt('weSetFpsLabel', 'Sahne Kare Hızı (FPS Sınırı — Hız Sabit Kalır)', 'Scene Frame Rate (Speed Stays Constant)');
  setTxt('weSetDetailLabel', 'Sahne Çizim Kalitesi & Detay Yoğunluğu', 'Scene Render Quality & Detail Density');
  setTxt('weSetSpeedLabel', 'Canlı Hareket Hızı', 'Creature Motion Speed');

  setTxt('weSetSec2Title', '2. Optical Liquid Glass (Sıvı Cam) Kalitesi', '2. Optical Liquid Glass Quality');
  setTxt('weSetGlassFpsLabel', 'Cam Kırılma Yenileme Hızı (Glass FPS)', 'Glass Refraction Refresh Rate (FPS)');
  setTxt('weSetGlassQLabel', 'Mercek Çözünürlük Kalitesi (Süper Örnekleme)', 'Lens Resolution Scale (Supersampling)');
  setTxt('weSetBlurLabel', 'Cam Bulanıklığı (Blur)', 'Glass Blur Radius');
  setTxt('weSetOpLabel', 'Cam Kırılma Yoğunluğu', 'Glass Refraction Opacity');

  setTxt('weSetSec3Title', '3. Masaüstü Hizalama & Habitat Otomasyonu', '3. Desktop Layout & Automation');
  setTxt('weSetTaskbarLabel', 'Görev Çubuğu Boşluğu (Zemin)', 'Taskbar Bottom Clearance');
  setTxt('weSetOffsetLabel', 'Orta Alan Dikey Konumu', 'Center Vertical Offset');
  setTxt('weSetAutoCycleLabel', 'Otomatik Habitat Değiştirme', 'Auto-Cycle Habitats');
  setTxt('weSetTopbarLabel', 'Üst Araç Çubuğu Görünümü', 'Top Toolbar Visibility');
  setTxt('weSetFontLabel', 'Pixel Art Yazı Tipi (Saat & Arayüz)', 'Pixel-Art Typography (Clock & UI)');
  setTxt('weSetChristmasLabel', 'Kutup Noel Teması (Noel Baba, Elfler & Hediyeler)', 'Arctic Christmas Theme (Santa, Elves & Gifts)');

  setTxt('weSetSec4Title', "4. Aktif Widget'lar (Tıkla Aç / Kapat)", '4. Active Widgets (Click to Toggle)');

  const mapGroup = (id, pairs) => {
    document.getElementById(id)?.querySelectorAll('.we-seg-btn').forEach((btn) => {
      const p = pairs[btn.dataset.val];
      if (p) btn.textContent = L(p[0], p[1]);
    });
  };
  mapGroup('weArcticChristmasGroup', {
    false: ['Kapalı', 'Off'],
    true: ['Açık', 'On'],
  });
  mapGroup('wePerfProfileGroup', {
    eco: ['Sessiz (Laptop)', 'Silent (Laptop)'],
    balanced: ['Dengeli', 'Balanced'],
    high: ['Yüksek HD', 'High HD'],
  });
  mapGroup('weSceneFpsGroup', { 144: ['Sınırsız', 'Unlimited'] });
  mapGroup('weDetailTierGroup', {
    1: ['1x Standart', '1x Standard'],
    2: ['2x Yüksek HD', '2x High HD'],
    3: ['3x Ultra Zengin', '3x Ultra'],
  });
  mapGroup('weGlassQualityGroup', {
    0.75: ['0.75x Hafif', '0.75x Lite'],
    1: ['1x Birebir', '1.0x Native'],
    1.5: ['1.5x Yüksek', '1.5x High'],
    2: ['2.0x Ultra', '2.0x Ultra'],
  });
  mapGroup('weAutoCycleGroup', {
    0: ['Kapalı', 'Off'],
    1: ['1 DK', '1 min'],
    5: ['5 DK', '5 min'],
    15: ['15 DK', '15 min'],
  });
  mapGroup('weTopbarModeGroup', {
    always: ['Her Zaman Açık', 'Always On'],
    autohide: ['Fare Yaklaşınca', 'On Hover'],
    hidden: ['Sadece Ayarlar', 'Settings Only'],
  });

  renderWidgetToggleChips();
}

window.__weApplyLanguage = function applyWallpaperLanguage(lang = 'tr', opts = {}) {
  const nextLang = lang === 'en' ? 'en' : 'tr';
  window.__weLang = nextLang;
  const en = nextLang === 'en';
  if (document.documentElement) document.documentElement.lang = nextLang;
  document.title = en
    ? 'Living Pixel Diorama — Interactive Desktop & Launcher'
    : 'Living Pixel Diorama — Yaşayan Piksel Habitatı';

  // 1. Top Bar Pills & Habitat Popover
  const setQ = (sel, tr, enTxt) => { const el = document.querySelector(sel); if (el) el.textContent = en ? enTxt : tr; };
  setQ('#habitatPopover h3', 'Yaşayan Habitatlar', 'Living Habitats');
  setQ('#habitatPopover p', 'Sahne seç veya açılış için sabitle', 'Pick a scene or pin one on startup');
  setQ('#newsBtn span', 'Gündem', 'News');
  setQ('#calendarBtn span', 'Takvim', 'Calendar');
  setQ('#notesBtn span:not(#taskCountBadge)', 'Defter', 'Notes');
  setQ('#dataManagerBtn span', 'Veri', 'Data');
  setQ('#weSettingsBtn span', 'Ayarlar', 'Settings');
  const themeLbl = document.getElementById('themeModeLabel');
  if (themeLbl) themeLbl.textContent = en ? (isLightMode ? 'Day' : 'Night') : (isLightMode ? 'Gündüz' : 'Gece');
  const zenBtn = document.getElementById('zenModeBtn');
  if (zenBtn) zenBtn.title = L('İzleme Modu (Arayüzü Gizle / Göster - Alt+Z)', 'Zen Mode (Hide / Show UI — Alt+Z)');
  const weatherBtnEl = document.getElementById('weatherBtn');
  if (weatherBtnEl) weatherBtnEl.title = L('Konumu Değiştir', 'Weather & Location');
  if (airPurifierBtn) airPurifierBtn.title = L('Oda İklimi (Xiaomi Smart Air Purifier 4)', 'Room Climate (Xiaomi Air Purifier 4)');
  if (weSettingsBtn) weSettingsBtn.title = L('Duvar Kağıdı, Liquid Glass Kalite ve Widget Ayarları', 'Wallpaper, Liquid Glass & Widget Settings');

  if (typeof window.__weCustomRenderHabitatMenu === 'function') window.__weCustomRenderHabitatMenu();

  // 2. Hero Clock, Date, Greeting, Default Username & Search Bar
  if (typeof updateClockAndGreeting === 'function') updateClockAndGreeting();
  if (editableUserName) {
    const curName = editableUserName.textContent.trim();
    if (en && curName === 'Gezgin') editableUserName.textContent = 'Traveler';
    else if (!en && curName === 'Traveler') editableUserName.textContent = 'Gezgin';
    editableUserName.title = L('İsmi düzenlemek için tıkla', 'Click to edit your name');
  }

  // Search Engine Placeholders & Launcher Drawer
  if (typeof ENGINES !== 'undefined') {
    if (ENGINES.local) ENGINES.local.placeholder = L("Bilgisayarda uygulama, dosya, klasör ara veya web'de başlat...", 'Search local apps, files, folders or the web...');
    if (ENGINES.google) ENGINES.google.placeholder = L("Google'da ara veya bir adres yaz...", 'Search Google or enter a URL...');
    if (ENGINES.duckduckgo) ENGINES.duckduckgo.placeholder = L("DuckDuckGo'da gizli ara...", 'Search privately on DuckDuckGo...');
    if (ENGINES.youtube) ENGINES.youtube.placeholder = L("YouTube'da video ara...", 'Search videos on YouTube...');
    if (ENGINES.perplexity) ENGINES.perplexity.placeholder = L("Perplexity AI'a sor...", 'Ask Perplexity AI...');
    if (ENGINES.github) ENGINES.github.placeholder = L("GitHub'da repo veya kod ara...", 'Search repos or code on GitHub...');
    if (searchInput && ENGINES[activeEngine]) searchInput.placeholder = ENGINES[activeEngine].placeholder;
  }
  if (localEngineChip) localEngineChip.textContent = L('💻 PC / Yerel', 'PC / Local');
  const motorHint = searchForm?.querySelector('.font-mono');
  if (motorHint) motorHint.textContent = L('↑ ↓ motor', '↑ ↓ engine');
  categoryPillsWrap.querySelectorAll('.desktop-cat-pill').forEach((btn) => {
    const cat = CATEGORIES.find((c) => c.id === btn.dataset.cat);
    if (cat) btn.textContent = L(cat.label, cat.labelEn);
  });
  updateBridgeStatusBadge();
  renderWebFallbackRow(searchInput?.value || '');
  renderDesktopDock();
  renderCustomAppPickerList();
  setQ('#headlineBar > span', 'Gündem', 'News');

  // Shortcut Modal Static Labels
  const scNameLbl = document.querySelector('label[for="shortcutNameInput"]');
  const scUrlLbl = document.querySelector('label[for="shortcutUrlInput"]');
  const scCancel = document.getElementById('closeShortcutModalBtn');
  const scSubmit = shortcutForm?.querySelector('button[type="submit"]');
  if (scNameLbl) scNameLbl.textContent = L('Başlık', 'Title');
  if (scUrlLbl) scUrlLbl.textContent = L('Adres (URL)', 'Path or URL');
  if (scCancel) scCancel.textContent = L('Vazgeç', 'Cancel');
  if (scSubmit) scSubmit.textContent = L('Ekle', 'Save');
  if (appPickerLabel) appPickerLabel.textContent = L('Bilgisayardaki Uygulamalardan Hızlı Seç (Tıkla):', 'Quick-pick from installed apps (Click):');

  // 3. News Center
  setQ('#newsPopover .news-eyebrow', 'Diorama · Güncel', 'Diorama · Live');
  setQ('#newsPopover .news-title', 'Haber Merkezi', 'News Center');
  setQ('#newsPopover .news-section-heading span:first-child', 'Akışa göz at', 'Browse feeds');
  setQ('#newsPopover .news-provider-note', 'Haber akışı: Diorama RSS API · Haberlerin telif ve yayın hakları kaynak yayıncılara aittir.', 'News feeds via Diorama RSS · All copyrights belong to their respective publishers.');
  if (newsSearchInput) newsSearchInput.placeholder = L('Haber veya yayıncı ara…', 'Search headlines or publisher…');
  const catNames = {
    gundem: ['Türkiye & Dünya', 'World News'],
    teknoloji: ['Teknoloji', 'Technology'],
    bilim: ['Bilim & Kültür', 'Science & Culture'],
  };
  document.querySelectorAll('.news-cat-btn').forEach((b) => {
    const p = catNames[b.dataset.cat];
    if (p) b.textContent = en ? p[1] : p[0];
  });
  const filterNames = { all: ['Tümü', 'All'], unread: ['Okunmadı', 'Unread'], saved: ['Kaydedilen', 'Saved'] };
  document.querySelectorAll('.news-filter-btn').forEach((b) => {
    const p = filterNames[b.dataset.filter];
    if (p) b.textContent = en ? p[1] : p[0];
  });
  setQ('#newsSettingsPanel .news-settings-heading h4', 'Kaynak tercihleri', 'Source Preferences');
  setQ('#newsSettingsPanel .news-settings-heading p', 'Bu kategoride hangi yayıncıları takip edeceğini seç.', 'Choose which publishers appear in this category.');
  setQ('#addNewsSourceForm .news-add-heading h4', 'Kendi RSS kaynağını ekle', 'Add Custom RSS Feed');
  setQ('#addNewsSourceForm .news-add-heading p', 'Herkese açık HTTPS RSS veya Atom akışı.', 'Any public HTTPS RSS or Atom feed URL.');
  setQ('#addNewsSourceForm .news-add-source-btn', 'Kaynağı ekle', 'Add Source');

  if (opts.reloadNews && typeof loadNewsCategory === 'function') {
    loadNewsCategory(activeNewsCat, { force: false });
  } else if (typeof window.__weCustomRenderNewsCards === 'function') {
    window.__weCustomRenderNewsCards();
  }

  // 4. Weather Popover
  const wxSecLabels = document.querySelectorAll('#weatherPopover .wx-section-label');
  const wxSecTexts = [
    ['ÖNÜMÜZDEKİ SAATLER', 'NEXT HOURS'],
    ['5 GÜNLÜK TAHMİN', '5-DAY FORECAST'],
    ['SAHNEDE DENE', 'TRY IN SCENE'],
  ];
  wxSecLabels.forEach((el, idx) => {
    if (wxSecTexts[idx]) el.textContent = en ? wxSecTexts[idx][1] : wxSecTexts[idx][0];
  });
  const wxFxSpan = document.getElementById('wxFxToggle')?.previousElementSibling;
  const wxAutoSpan = document.getElementById('wxAutoTheme')?.previousElementSibling;
  if (wxFxSpan) wxFxSpan.textContent = L('Sahnede hava efektleri', 'Live weather effects in scene');
  if (wxAutoSpan) wxAutoSpan.textContent = L('Gündüz/gece temasını güneşe göre ayarla', 'Auto day/night theme by sunrise & sunset');
  const cityInp = document.getElementById('cityInput');
  if (cityInp) cityInp.placeholder = L('Şehir (Örn: İstanbul)', 'City (e.g. Istanbul, London)');
  const wxSaveBtn = document.querySelector('#weatherForm button[type="submit"]');
  if (wxSaveBtn) wxSaveBtn.textContent = L('Kaydet', 'Save');
  if (typeof renderWeatherPanel === 'function' && WX?.data) {
    renderWeatherPanel();
  }
  if (typeof window.__weTranslateWeatherPreviews === 'function') {
    window.__weTranslateWeatherPreviews();
  }

  // 5. Xiaomi Room Climate Popover
  const airCfgTitle = document.querySelector('#weAirConfigPanel span.font-pixel');
  if (airCfgTitle) airCfgTitle.textContent = L('Yerel Wi-Fi Bağlantısı (UDP 54321)', 'Local Wi-Fi Link (UDP 54321)');
  setQ('#weAirDiscoverBtn', 'Ağda Bul', 'Scan LAN');
  setQ('#weAirSaveConfigBtn', 'Kaydet ve Bağlan', 'Save & Connect');
  setQ('#weAirForgetBtn', 'Bağlantıyı unut', 'Forget device');
  const airDisc = document.getElementById('weAirDiscoverStatus');
  if (airDisc && !airDisc.textContent.includes('UDP')) {
    airDisc.textContent = L(
      'Ayarların proje dosyalarına değil, bilgisayarındaki yerel kullanıcı verilerine (~/.diorama-local-state.json) kaydedilir.',
      'Your credentials are stored only in your local user profile (~/.diorama-local-state.json), never inside project files.',
    );
  }
  renderXiaomiAirWidget();

  // 6. Focus Studio & Soundscapes + Fullscreen Focus HUD
  setQ('#focusPopover h3', 'Odak & Ambiyans', 'Focus & Ambience');
  const focusHeadSpans = document.querySelectorAll('#focusPopover .focus-clock-machine-head span');
  if (focusHeadSpans[1]) focusHeadSpans[1].textContent = L('HABİTAT SAYACI', 'HABITAT TIMER');
  if (focusHeadSpans[2]) focusHeadSpans[2].textContent = L('CANLI', 'LIVE');
  setQ('#focusPopover .focus-duration-label', 'SÜRE SEÇ', 'DURATION');
  document.querySelectorAll('#focusPopover .focus-preset-btn[data-mins]').forEach((b) => {
    const m = b.dataset.mins;
    b.textContent = en ? `${m}m` : `${m} DK`;
  });
  setQ('label[for="focusCustomMinutes"]', 'ÖZEL SÜRE', 'CUSTOM');
  const customMinInp = document.getElementById('focusCustomMinutes');
  if (customMinInp) customMinInp.placeholder = L('1–180 dk', '1–180 min');
  setQ('#focusApplyCustomBtn', 'UYGULA', 'APPLY');
  setQ('label[for="focusTaskInput"]', 'BU OTURUMUN HEDEFİ', 'SESSION GOAL');
  const focusTaskInp = document.getElementById('focusTaskInput');
  if (focusTaskInp) focusTaskInp.placeholder = L('Ne üzerinde çalışacaksın?', 'What are you focusing on?');
  const ambTitle = document.getElementById('ambientStatusText')?.previousElementSibling;
  if (ambTitle) ambTitle.textContent = L('Üretken Doğa Ambiyansı', 'Generative Nature Ambience');
  setQ('label[for="ambientVolumeSlider"]', 'SES SEVİYESİ', 'VOLUME');
  const autoBioSpan = document.getElementById('weBiomeAutoCheckbox')?.previousElementSibling;
  const crVoiceSpan = document.getElementById('weCreatureVoiceCheckbox')?.previousElementSibling;
  if (autoBioSpan) autoBioSpan.textContent = L('Biyoma göre doğa sesini otomatik seç', 'Auto-match ambient sound to active habitat');
  if (crVoiceSpan) crVoiceSpan.textContent = L('Biyomdaki canlıların sesi arada çıksın', 'Play periodic habitat creature sounds');
  setQ('#wePreviewCreatureVoiceBtn', 'Sesi Dene', 'Test Sound');
  setQ('#focusStageReset', 'BITIR', 'END');
  if (typeof window.__weSyncBiomeAudioUI === 'function') window.__weSyncBiomeAudioUI();
  if (typeof window.__weTranslateFocusUI === 'function') window.__weTranslateFocusUI();

  // 7. Smart Calendar
  setQ('#calendarPopover .calendar-header .calendar-eyebrow', 'Diorama · Planlama', 'Diorama · Planner');
  setQ('#calendarTodayBtn', 'Bugün', 'Today');
  const calWds = document.querySelectorAll('#calendarPopover .calendar-weekdays span');
  const wdList = en ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  calWds.forEach((s, i) => { if (wdList[i]) s.textContent = wdList[i]; });
  setQ('#calendarPopover .calendar-day-heading .calendar-eyebrow', 'SEÇİLİ GÜN', 'SELECTED DAY');
  setQ('label[for="calendarEventTitle"]', 'Yeni etkinlik', 'New event');
  const calEvInp = document.getElementById('calendarEventTitle');
  if (calEvInp) calEvInp.placeholder = L('Örn. Proje üzerinde çalış', 'e.g. Work on project');
  setQ('#calendarEventForm button[type="submit"]', 'Etkinliği ekle', 'Add event');
  applySmartCalendarLanguage();
  if (window.__weCalendarBridge) window.__weCalendarBridge.renderAll();
  renderSmartCalendarTabsUI();
  if (opts.refreshSports && typeof window.__weRefreshCalendarFixtures === 'function') {
    window.__weRefreshCalendarFixtures(false);
  }

  // 8. Notes / Personal Journal
  setQ('#notesPopover h3', 'Kişisel Defter', 'Personal Journal');
  setQ('#taskProgressText', 'Günlük akış ve hızlı notlar', 'Daily flow & quick notes');
  setQ('#tasksTab', 'Görevler', 'Tasks');
  setQ('#notesTab', 'Notlar', 'Notes');
  const newTaskInp = document.getElementById('newTaskInput');
  if (newTaskInp) newTaskInp.placeholder = L('Yeni bir satır ekle...', 'Add a new task...');
  setQ('#addTaskForm button[type="submit"]', 'Ekle', 'Add');
  setQ('#clearDoneTasksBtn', 'Tamamlananları Sil', 'Clear Done');
  const noteTInp = document.getElementById('noteTitleInput');
  const noteBInp = document.getElementById('noteBodyInput');
  if (noteTInp) noteTInp.placeholder = L('Başlık (isteğe bağlı)...', 'Title (optional)...');
  if (noteBInp) noteBInp.placeholder = L('Düşünce, alıntı veya bağlantı kaydet...', 'Write a thought, quote, or link...');
  setQ('#addNoteCardForm button[type="submit"]', 'Deftere Kaydet', 'Save Note');
  if (typeof renderTasks === 'function') renderTasks();

  // 9. Data Manager Popover
  setQ('#dataManagerPopover h3', 'Veri Yönetimi', 'Data Manager');
  setQ('#dataManagerPopover h3 + p', 'Notlarını, görevlerini ve kısayollarını güvenceye al', 'Back up your notes, tasks, and shortcuts');
  const dataGridLabels = document.querySelectorAll('#dataManagerPopover .grid.grid-cols-3.gap-2 .font-pixel');
  const dataLabelTexts = [L('Görev', 'Tasks'), L('Not', 'Notes'), L('Kısayol', 'Links')];
  dataGridLabels.forEach((el, idx) => { if (dataLabelTexts[idx]) el.textContent = dataLabelTexts[idx]; });
  setQ('#exportAllDataBtn', '↓ Tüm verileri yedekle (.json)', '↓ Backup all data (.json)');
  const expBtns = document.querySelectorAll('#dataManagerPopover .data-export-scope');
  const expTexts = [L('Görevleri indir', 'Export tasks'), L('Notları indir', 'Export notes'), L('Kısayolları indir', 'Export links')];
  expBtns.forEach((b, idx) => { if (expTexts[idx]) b.textContent = expTexts[idx]; });
  setQ('#clearTasksDataBtn', 'Görevleri sil', 'Clear tasks');
  setQ('#clearNotesDataBtn', 'Notları sil', 'Clear notes');
  setQ('#resetShortcutsDataBtn', 'Kısayolları sıfırla', 'Reset links');
  setQ('#clearAllAppDataBtn', 'Tüm uygulama verilerini sil…', 'Erase all local app data…');

  // 10. Music Player, System Monitor, Scroll Assist & Settings Popover
  renderMusicPlayerUI();
  renderSystemMonitorUI();
  document.querySelectorAll('.we-scroll-assist-hint').forEach((el) => {
    el.textContent = L('Tekerlek / Sürükle', 'Wheel / Drag');
  });
  applySettingsPopoverLanguage();
  syncSettingsWidgetUI();
  repaintGlassNow();
};

// Apply initial language immediately if user booted with English enabled
if (weSettings.language === 'en') {
  window.__weApplyLanguage('en', { reloadNews: true, refreshSports: false });
} else {
  applySettingsPopoverLanguage();
}
