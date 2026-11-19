import http from 'node:http';
import dgram from 'node:dgram';
import crypto from 'node:crypto';
import os from 'node:os';
import readline from 'node:readline';
import { readdir, stat, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createNewsHandler } from '../server/news-handler.mjs';
import { createCustomNewsHandler } from '../server/custom-news-handler.mjs';
import { fetchAndParseFeedCloudflare } from '../cloudflare/rss-fetch.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const wallpaperDist = resolve(root, 'dist-wallpaper');
const helperScriptPath = resolve(root, 'wallpaper/desktop-wheel-hook.ps1');
const mediaHelperScriptPath = resolve(root, 'wallpaper/desktop-media-helper.ps1');
const sysmonHelperScriptPath = resolve(root, 'wallpaper/desktop-sysmon-helper.ps1');
const PORT = Number(process.env.DIORAMA_BRIDGE_PORT) || 47831;
const HOST = '127.0.0.1';

const handleNews = createNewsHandler({
  fetchFeed: (source) => fetchAndParseFeedCloudflare(source.rss),
});

const handleCustomNews = createCustomNewsHandler({
  fetchFeed: (url) => fetchAndParseFeedCloudflare(url),
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SYSTEM_ITEMS = [
  { id: 'sys-explorer', name: 'Dosya Gezgini', nameEn: 'File Explorer', kind: 'app', category: 'Sistem', categoryEn: 'System', isSystemTool: true, target: 'explorer.exe', subtitle: 'Windows Dosya Gezgini', subtitleEn: 'Windows File Explorer', icon: 'folder' },
  { id: 'sys-downloads', name: 'İndirilenler', nameEn: 'Downloads', kind: 'folder', category: 'Klasör', categoryEn: 'Folder', target: join(os.homedir(), 'Downloads'), subtitle: 'İndirilen dosyalar klasörü', subtitleEn: 'Downloaded files folder', icon: 'download' },
  { id: 'sys-documents', name: 'Belgeler', nameEn: 'Documents', kind: 'folder', category: 'Klasör', categoryEn: 'Folder', target: join(os.homedir(), 'Documents'), subtitle: 'Kişisel belgeler klasörü', subtitleEn: 'Personal documents folder', icon: 'file' },
  { id: 'sys-desktop', name: 'Masaüstü Klasörü', nameEn: 'Desktop Folder', kind: 'folder', category: 'Klasör', categoryEn: 'Folder', target: join(os.homedir(), 'Desktop'), subtitle: 'Masaüstü dizini', subtitleEn: 'Desktop directory', icon: 'desktop' },
  { id: 'sys-terminal', name: 'Windows Terminal / PowerShell', nameEn: 'Windows Terminal / PowerShell', kind: 'app', category: 'Geliştirici', categoryEn: 'Developer', isSystemTool: true, target: 'powershell.exe', subtitle: 'Komut satırı ve kabuk', subtitleEn: 'Command line & shell', icon: 'terminal' },
  { id: 'sys-settings', name: 'Windows Ayarları', nameEn: 'Windows Settings', kind: 'app', category: 'Sistem', categoryEn: 'System', isSystemTool: true, target: 'ms-settings:', subtitle: 'Sistem ve cihaz ayarları', subtitleEn: 'System & device settings', icon: 'settings' },
  { id: 'sys-taskmgr', name: 'Görev Yöneticisi', nameEn: 'Task Manager', kind: 'app', category: 'Sistem', categoryEn: 'System', isSystemTool: true, target: 'taskmgr.exe', subtitle: 'Performans ve çalışan işlemler', subtitleEn: 'Performance & processes', icon: 'cpu' },
  { id: 'sys-calc', name: 'Hesap Makinesi', nameEn: 'Calculator', kind: 'app', category: 'Araç', categoryEn: 'Utility', isSystemTool: true, target: 'calc.exe', subtitle: 'Windows Hesap Makinesi', subtitleEn: 'Windows Calculator', icon: 'app' },
  { id: 'sys-snip', name: 'Ekran Alıntısı Aracı', nameEn: 'Snipping Tool', kind: 'app', category: 'Araç', categoryEn: 'Utility', isSystemTool: true, target: 'snippingtool.exe', subtitle: 'Ekran görüntüsü yakala', subtitleEn: 'Capture screen snips', icon: 'app' },
  { id: 'sys-control', name: 'Denetim Masası', nameEn: 'Control Panel', kind: 'app', category: 'Sistem', categoryEn: 'System', isSystemTool: true, target: 'control.exe', subtitle: 'Klasik sistem denetimi', subtitleEn: 'Classic system settings', icon: 'settings' },
];

const IGNORED_APP_PATTERNS = /uninstall|kaldır|yardım|help|readme|benioku|website|web sitesi|documentation|manual|license|lisans|release notes|changelog|what's new|updater|repair|application verifier|developer command|x64 native|x86 native|cross tools/i;
const WINDOWS_ADMIN_PATTERNS = /windows administrative tools|windows accessories|windows system|windows powershell|accessibility|erişim kolaylığı|yönetimsel araçlar|donatılar|character map|component services|computer management|odbc data|iscsi|event viewer|performance monitor|resource monitor|registry editor|\bservices\b|system configuration|system information|memory diagnostic|defragment|disk cleanup|steps recorder|fax and scan|quick assist|narrator|magnifier|speech recognition|on-screen keyboard|wordpad|command prompt|remote desktop|powershell|hyper-v|recovery drive|print management|local security|windows defender firewall/i;
const WINDOWS_TR_NAME_MAP = Object.freeze({
  'command prompt': 'Komut İstemi (CMD)',
  'computer management': 'Bilgisayar Yönetimi',
  'character map': 'Karakter Eşlem',
  'component services': 'Bileşen Hizmetleri',
  'control panel': 'Denetim Masası',
  'task manager': 'Görev Yöneticisi',
  'registry editor': 'Kayıt Defteri Düzenleyicisi',
  'notepad': 'Not Defteri',
  'paint': 'Paint',
  'snipping tool': 'Ekran Alıntısı Aracı',
  'file explorer': 'Dosya Gezgini',
  'remote desktop connection': 'Uzak Masaüstü Bağlantısı',
  'event viewer': 'Olay Görüntüleyici',
  'resource monitor': 'Kaynak İzleyici',
  'performance monitor': 'Performans İzleyici',
  'disk cleanup': 'Disk Temizleme',
  'defragment and optimize drives': 'Sürücüleri Birleştir ve İyileştir',
  'system information': 'Sistem Bilgisi',
  'system configuration': 'Sistem Yapılandırması',
  'services': 'Windows Hizmetleri',
  'magnifier': 'Büyüteç',
  'narrator': 'Ekran Okuyucusu',
  'on-screen keyboard': 'Ekran Klavyesi',
  'steps recorder': 'Adım Kaydedicisi',
  'quick assist': 'Hızlı Yardım',
  'windows security': 'Windows Güvenliği',
  'windows media player': 'Windows Medya Oynatıcı',
  'windows media player legacy': 'Windows Medya Oynatıcı (Klasik)',
  'windows memory diagnostic': 'Windows Bellek Tanılama',
  'wordpad': 'WordPad',
  'odbc data sources (32-bit)': 'ODBC Veri Kaynakları (32-bit)',
  'odbc data sources (64-bit)': 'ODBC Veri Kaynakları (64-bit)',
  'iscsi initiator': 'iSCSI Başlatıcısı',
  'recovery drive': 'Kurtarma Sürücüsü',
  'run': 'Çalıştır',
});
const APP_EXTENSIONS = new Set(['.lnk', '.appref-ms', '.exe', '.url']);

let cachedIndex = [];
let lastIndexedAt = 0;
const INDEX_TTL_MS = 5 * 60 * 1000;

function detectIconKey(name, kind, ext = '') {
  const lower = `${name} ${ext}`.toLowerCase();
  if (lower.includes('code') || lower.includes('studio') || lower.includes('git') || lower.includes('cursor')) return 'code';
  if (lower.includes('terminal') || lower.includes('powershell') || lower.includes('cmd') || lower.includes('bash')) return 'terminal';
  if (lower.includes('chrome') || lower.includes('edge') || lower.includes('firefox') || lower.includes('brave') || lower.includes('opera') || lower.includes('tarayıcı')) return 'globe';
  if (lower.includes('spotify') || lower.includes('music') || lower.includes('müzik') || lower.includes('vlc') || lower.includes('media')) return 'music';
  if (lower.includes('discord') || lower.includes('whatsapp') || lower.includes('telegram') || lower.includes('slack') || lower.includes('teams')) return 'chat';
  if (lower.includes('steam') || lower.includes('epic') || lower.includes('game') || lower.includes('riot') || lower.includes('xbox')) return 'game';
  if (kind === 'folder') return 'folder';
  if (['.pdf', '.doc', '.docx', '.txt', '.md', '.xls', '.xlsx', '.ppt', '.pptx'].includes(ext)) return 'file';
  if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.mp4', '.mkv'].includes(ext)) return 'media';
  if (['.js', '.mjs', '.ts', '.py', '.json', '.html', '.css', '.cpp', '.cs', '.rs'].includes(ext)) return 'code';
  if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) return 'archive';
  return kind === 'app' ? 'app' : 'file';
}

async function walkStartMenu(dir, depth = 0, maxDepth = 3, out = []) {
  if (depth > maxDepth || !existsSync(dir)) return out;
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkStartMenu(fullPath, depth + 1, maxDepth, out);
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (!APP_EXTENSIONS.has(ext)) continue;
      const cleanName = basename(entry.name, ext).trim();
      if (!cleanName || IGNORED_APP_PATTERNS.test(cleanName)) continue;
      const isSystemTool = WINDOWS_ADMIN_PATTERNS.test(fullPath) || WINDOWS_ADMIN_PATTERNS.test(cleanName);
      const trName = WINDOWS_TR_NAME_MAP[cleanName.toLowerCase()] || cleanName;
      const parentFolder = basename(dir);
      const isGenericFolder = /^(programs|taskbar)$/i.test(parentFolder);
      const subtitle = isSystemTool
        ? 'Windows Sistem Aracı'
        : (!isGenericFolder ? `Uygulama · ${parentFolder}` : 'Yüklü Uygulama');
      const subtitleEn = isSystemTool
        ? 'Windows System Tool'
        : (!isGenericFolder ? `App · ${parentFolder}` : 'Installed App');
      out.push({
        id: `app-${cleanName.toLowerCase().replace(/[^a-z0-9ğüşıöç]+/gi, '-')}-${out.length}`,
        name: trName,
        nameEn: cleanName,
        kind: 'app',
        category: isSystemTool ? 'Sistem' : 'Uygulama',
        categoryEn: isSystemTool ? 'System' : 'Application',
        isSystemTool,
        target: fullPath,
        subtitle,
        subtitleEn,
        ext,
        icon: detectIconKey(`${cleanName} ${trName}`, 'app', ext),
      });
    }
  }
  return out;
}

async function scanUserDirectory(dir, label, labelEn, tag, maxDepth = 1, depth = 0, out = []) {
  if (depth > maxDepth || !existsSync(dir) || out.length >= 260) return out;
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (out.length >= 260) break;
    if (entry.name.startsWith('.') || entry.name === 'desktop.ini' || entry.name === 'node_modules') continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push({
        id: `dir-${tag}-${out.length}`,
        name: entry.name,
        nameEn: entry.name,
        kind: 'folder',
        category: label,
        categoryEn: labelEn,
        sourceTag: tag,
        target: fullPath,
        subtitle: `Klasör · ${label}`,
        subtitleEn: `Folder · ${labelEn}`,
        ext: '',
        icon: 'folder',
      });
      if (depth < maxDepth) {
        await scanUserDirectory(fullPath, `${label} / ${entry.name}`, `${labelEn} / ${entry.name}`, tag, maxDepth, depth + 1, out);
      }
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      const isShortcut = ext === '.lnk' || ext === '.appref-ms' || ext === '.url';
      const displayName = isShortcut ? basename(entry.name, ext) : entry.name;
      if (isShortcut && IGNORED_APP_PATTERNS.test(displayName)) continue;
      out.push({
        id: `file-${tag}-${out.length}`,
        name: displayName,
        nameEn: displayName,
        kind: isShortcut ? 'app' : 'file',
        category: isShortcut ? 'Uygulama' : label,
        categoryEn: isShortcut ? 'Application' : labelEn,
        isSystemTool: false,
        sourceTag: tag,
        target: fullPath,
        subtitle: isShortcut ? `Kısayol · ${label}` : `Dosya (${ext || 'dosya'}) · ${label}`,
        subtitleEn: isShortcut ? `Shortcut · ${labelEn}` : `File (${ext || 'file'}) · ${labelEn}`,
        ext,
        icon: detectIconKey(displayName, isShortcut ? 'app' : 'file', ext),
      });
    }
  }
  return out;
}

function normalizeAppDedupeKey(rawName) {
  return String(rawName || '')
    .toLowerCase()
    .replace(/\s*\((x64|x86|wow|64-bit|32-bit)\)\s*$/i, '')
    .trim();
}

async function getDesktopIndex(force = false) {
  if (!force && cachedIndex.length > 0 && Date.now() - lastIndexedAt < INDEX_TTL_MS) {
    return cachedIndex;
  }

  const home = os.homedir();
  const appData = process.env.APPDATA || join(home, 'AppData', 'Roaming');
  const programData = process.env.ProgramData || 'C:\\ProgramData';
  const oneDrive = process.env.OneDrive || join(home, 'OneDrive');

  const startMenuDirs = [
    join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
    join(programData, 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
    join(appData, 'Microsoft', 'Internet Explorer', 'Quick Launch', 'User Pinned', 'TaskBar'),
  ];

  const rawApps = [];
  for (const dir of startMenuDirs) {
    await walkStartMenu(dir, 0, 3, rawApps);
  }

  const seenAppNames = new Set();
  const uniqueApps = [];
  for (const app of rawApps) {
    const key = normalizeAppDedupeKey(app.nameEn || app.name);
    if (!key || seenAppNames.has(key)) continue;
    seenAppNames.add(key);
    uniqueApps.push(app);
  }

  const userDirs = [
    [join(home, 'Desktop'), 'Masaüstü', 'Desktop', 'desktop', 1],
    [join(oneDrive, 'Desktop'), 'Masaüstü', 'Desktop', 'desktop', 1],
    [join(oneDrive, 'Masaüstü'), 'Masaüstü', 'Desktop', 'desktop', 1],
    [join(home, 'Documents'), 'Belgeler', 'Documents', 'documents', 1],
    [join(oneDrive, 'Documents'), 'Belgeler', 'Documents', 'documents', 1],
    [join(oneDrive, 'Belgeler'), 'Belgeler', 'Documents', 'documents', 1],
    [join(home, 'Downloads'), 'İndirilenler', 'Downloads', 'downloads', 0],
  ];

  const scannedFiles = [];
  const seenPaths = new Set();
  for (const [dirPath, label, labelEn, tag, depth] of userDirs) {
    if (!existsSync(dirPath) || seenPaths.has(dirPath.toLowerCase())) continue;
    seenPaths.add(dirPath.toLowerCase());
    await scanUserDirectory(dirPath, label, labelEn, tag, depth, 0, scannedFiles);
  }

  const deduplicatedFiles = [];
  for (const item of scannedFiles) {
    const pKey = item.target.toLowerCase();
    if (seenPaths.has(pKey)) continue;
    seenPaths.add(pKey);
    const appKey = normalizeAppDedupeKey(item.name);
    if (item.kind === 'app' && (!appKey || seenAppNames.has(appKey))) continue;
    if (item.kind === 'app') seenAppNames.add(appKey);
    deduplicatedFiles.push(item);
  }

  cachedIndex = [...SYSTEM_ITEMS, ...uniqueApps, ...deduplicatedFiles];
  lastIndexedAt = Date.now();
  return cachedIndex;
}

function scoreItem(item, queryTokens, fullQuery) {
  if (!fullQuery) {
    if (item.kind === 'app' && !item.isSystemTool && !item.id.startsWith('sys-')) return 96;
    if (item.id.startsWith('sys-')) return 82;
    if (item.kind === 'folder') return 70;
    if (item.isSystemTool) return 48;
    return 35;
  }
  const nameLower = String(item.name || '').toLowerCase();
  const nameEnLower = String(item.nameEn || '').toLowerCase();
  const subLower = String(item.subtitle || '').toLowerCase();
  const subEnLower = String(item.subtitleEn || '').toLowerCase();
  const targetLower = String(item.target || '').toLowerCase();

  let score = 0;
  if (nameLower === fullQuery || (nameEnLower && nameEnLower === fullQuery)) score += 200;
  else if (nameLower.startsWith(fullQuery) || (nameEnLower && nameEnLower.startsWith(fullQuery))) score += 140;
  else if (nameLower.includes(fullQuery) || (nameEnLower && nameEnLower.includes(fullQuery))) score += 95;

  for (const token of queryTokens) {
    if (nameLower.startsWith(token) || (nameEnLower && nameEnLower.startsWith(token))) score += 45;
    else if (nameLower.includes(token) || (nameEnLower && nameEnLower.includes(token))) score += 30;
    else if (subLower.includes(token) || (subEnLower && subEnLower.includes(token))) score += 15;
    else if (targetLower.includes(token)) score += 10;
    else return -1;
  }

  if (item.kind === 'app' && !item.isSystemTool) score += 22;
  else if (item.kind === 'app') score += 14;
  else if (item.kind === 'folder') score += 8;
  return score;
}

async function searchDesktopItems({ query = '', category = 'all', limit = 28 } = {}) {
  const index = await getDesktopIndex();
  const cleanQuery = String(query || '').trim().toLowerCase().slice(0, 120);
  const tokens = cleanQuery.split(/\s+/).filter(Boolean);
  const safeLimit = Math.max(1, Math.min(500, Number(limit) || 28));

  const filtered = [];
  for (const item of index) {
    if (category === 'apps' && item.kind !== 'app') continue;
    if (category === 'user_apps' && (item.kind !== 'app' || item.isSystemTool)) continue;
    if (category === 'system' && !item.isSystemTool && item.category !== 'Sistem') continue;
    if (category === 'folders' && item.kind !== 'folder') continue;
    if (category === 'files' && item.kind !== 'file') continue;
    if (category === 'downloads' && item.sourceTag !== 'downloads' && item.id !== 'sys-downloads') continue;

    const score = scoreItem(item, tokens, cleanQuery);
    if (score >= 0) filtered.push({ item, score });
  }

  filtered.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name, 'tr'));
  return {
    totalIndexed: index.length,
    results: filtered.slice(0, safeLimit).map(({ item }) => item),
  };
}

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'steam:', 'spotify:', 'discord:', 'vscode:', 'ms-settings:']);
const SHELL_FOLDERS = {
  'shell:downloads': () => join(os.homedir(), 'Downloads'),
  'shell:personal': () => join(os.homedir(), 'Documents'),
  'shell:desktop': () => join(os.homedir(), 'Desktop'),
};

const SYSTEM_BINARY_PATHS = {
  'explorer.exe': 'C:\\Windows\\explorer.exe',
  'powershell.exe': 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
  'taskmgr.exe': 'C:\\Windows\\System32\\Taskmgr.exe',
  'calc.exe': 'C:\\Windows\\System32\\calc.exe',
  'snippingtool.exe': 'C:\\Windows\\System32\\SnippingTool.exe',
  'control.exe': 'C:\\Windows\\System32\\control.exe',
};

async function resolveDiskPathForIcon(rawTarget) {
  const target = String(rawTarget || '').trim();
  if (!target) return null;
  const lower = target.toLowerCase();

  if (SHELL_FOLDERS[lower]) return SHELL_FOLDERS[lower]();
  if (SYSTEM_BINARY_PATHS[lower] && existsSync(SYSTEM_BINARY_PATHS[lower])) {
    return SYSTEM_BINARY_PATHS[lower];
  }
  if (lower.startsWith('app:')) {
    const appQuery = target.slice(4).trim().toLowerCase();
    const index = await getDesktopIndex();
    const matched = index.find((item) => item.kind === 'app' && item.name.toLowerCase().includes(appQuery));
    if (matched && existsSync(matched.target)) return matched.target;
    return null;
  }
  if (/^[a-z]:[\\/]/i.test(target) && existsSync(target)) {
    return target;
  }
  return null;
}

async function resolveAndLaunchTarget(rawTarget) {
  const target = String(rawTarget || '').trim();
  if (!target || target.length > 2048) throw new Error('Geçersiz hedef.');

  const lower = target.toLowerCase();
  let resolvedTarget = target;

  if (SHELL_FOLDERS[lower]) {
    resolvedTarget = SHELL_FOLDERS[lower]();
  } else if (lower.startsWith('app:')) {
    const appQuery = target.slice(4).trim().toLowerCase();
    const index = await getDesktopIndex();
    const matched = index.find((item) => item.kind === 'app' && item.name.toLowerCase().includes(appQuery));
    if (matched) resolvedTarget = matched.target;
    else throw new Error(`"${target.slice(4)}" uygulaması bulunamadı.`);
  } else if (/^[a-z][a-z0-9+.-]*:/i.test(target) && !/^[a-z]:[\\/]/i.test(target)) {
    let parsed;
    try { parsed = new URL(target); } catch { parsed = null; }
    if (!parsed || !SAFE_PROTOCOLS.has(parsed.protocol.toLowerCase())) {
      throw new Error('Desteklenmeyen protokol.');
    }
    resolvedTarget = parsed.href;
  }

  return new Promise((resolvePromise, rejectPromise) => {
    const escaped = resolvedTarget.replace(/'/g, "''");
    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', `Start-Process -FilePath '${escaped}'`],
      { windowsHide: true, stdio: 'ignore' },
    );
    child.on('error', (err) => rejectPromise(err));
    child.on('close', (code) => {
      if (code === 0) resolvePromise({ ok: true, target: resolvedTarget });
      else rejectPromise(new Error(`Başlatılamadı (kod ${code}): ${resolvedTarget}`));
    });
  });
}

// ============================================================================
// NATIVE WIN32 HELPER (DESKTOP MOUSE WHEEL HOOK + REAL WINDOWS ICON EXTRACTOR)
// ============================================================================
const sseClients = new Set();
const iconBufferCache = new Map();
const pendingIconRequests = new Map();
let iconReqCounter = 0;
let nativeHelperProc = null;
let nativeHelperReady = false;

function startNativeHelper() {
  if (nativeHelperProc || !existsSync(helperScriptPath)) return;
  try {
    nativeHelperProc = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', helperScriptPath],
      { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] },
    );
    syncSysmonTrackedPids();

    const rl = readline.createInterface({ input: nativeHelperProc.stdout });
    rl.on('line', (line) => {
      if (!line || !line.startsWith('{')) return;
      let msg;
      try { msg = JSON.parse(line); } catch { return; }

      if (msg.type === 'ready') {
        nativeHelperReady = true;
      } else if (msg.type === 'wheel' || msg.type === 'key' || msg.type === 'blur') {
        const payload = `data: ${JSON.stringify(msg)}\n\n`;
        for (const client of sseClients) {
          try { client.write(payload); } catch { sseClients.delete(client); }
        }
      } else if (msg.type === 'icon' && msg.id) {
        const pending = pendingIconRequests.get(msg.id);
        if (pending) {
          clearTimeout(pending.timer);
          pendingIconRequests.delete(msg.id);
          const buf = msg.png ? Buffer.from(msg.png, 'base64') : null;
          if (buf && buf.length > 0) iconBufferCache.set(pending.cacheKey, buf);
          pending.resolve(buf);
        }
      }
    });

    nativeHelperProc.on('exit', () => {
      nativeHelperProc = null;
      nativeHelperReady = false;
      setTimeout(startNativeHelper, 3000);
    });
  } catch {
    nativeHelperProc = null;
  }
}

async function extractWindowsIconPng(rawTarget) {
  const diskPath = await resolveDiskPathForIcon(rawTarget);
  if (!diskPath) return null;
  const cacheKey = diskPath.toLowerCase();
  if (iconBufferCache.has(cacheKey)) return iconBufferCache.get(cacheKey);
  if (!nativeHelperProc || !nativeHelperProc.stdin.writable) return null;

  const reqId = `ic_${++iconReqCounter}`;
  return new Promise((resolvePromise) => {
    const timer = setTimeout(() => {
      pendingIconRequests.delete(reqId);
      resolvePromise(null);
    }, 2800);
    pendingIconRequests.set(reqId, { resolve: resolvePromise, timer, cacheKey });
    try {
      nativeHelperProc.stdin.write(`ICON|${reqId}|${diskPath}\n`);
    } catch {
      clearTimeout(timer);
      pendingIconRequests.delete(reqId);
      resolvePromise(null);
    }
  });
}

function broadcastSseEvent(obj) {
  const payload = `data: ${JSON.stringify(obj)}\n\n`;
  for (const client of sseClients) {
    try { client.write(payload); } catch { sseClients.delete(client); }
  }
}

// ============================================================================
// WINDOWS MEDIA GSMTC HELPER (NOW PLAYING TRACK, COVER ART & TRANSPORT CONTROL)
// ============================================================================
let mediaHelperProc = null;
let mediaHelperReady = false;
let latestMediaThumbBuffer = null;
let latestMediaThumbMime = 'image/jpeg';
let latestMediaThumbRev = 0;
let latestMediaState = {
  active: false,
  playing: false,
  title: '',
  artist: '',
  album: '',
  sourceApp: '',
  position: 0,
  duration: 0,
  hasThumbnail: false,
  thumbnailRev: 0,
  updatedAt: Date.now(),
};

function startMediaHelper() {
  if (mediaHelperProc || !existsSync(mediaHelperScriptPath)) return;
  try {
      mediaHelperProc = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', mediaHelperScriptPath],
      { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] },
    );
    syncSysmonTrackedPids();

    const rl = readline.createInterface({ input: mediaHelperProc.stdout });
    rl.on('line', (line) => {
      if (!line || !line.startsWith('{')) return;
      let msg;
      try { msg = JSON.parse(line); } catch { return; }

      if (msg.type === 'media_ready') {
        mediaHelperReady = true;
      } else if (msg.type === 'media') {
        if (msg.thumbB64 && typeof msg.thumbB64 === 'string') {
          try {
            const buf = Buffer.from(msg.thumbB64, 'base64');
            if (buf.length > 32) {
              latestMediaThumbBuffer = buf;
              latestMediaThumbMime = typeof msg.thumbMime === 'string' && msg.thumbMime.startsWith('image/')
                ? msg.thumbMime
                : 'image/jpeg';
              latestMediaThumbRev += 1;
            }
          } catch {}
        } else if (!msg.hasThumbnail) {
          latestMediaThumbBuffer = null;
        }

        latestMediaState = {
          active: Boolean(msg.active),
          playing: Boolean(msg.playing),
          title: String(msg.title || '').slice(0, 180),
          artist: String(msg.artist || '').slice(0, 140),
          album: String(msg.album || '').slice(0, 140),
          sourceApp: String(msg.sourceApp || '').slice(0, 100),
          position: Math.max(0, Number(msg.position) || 0),
          duration: Math.max(0, Number(msg.duration) || 0),
          hasThumbnail: Boolean(msg.hasThumbnail && latestMediaThumbBuffer),
          thumbnailRev: latestMediaThumbRev,
          updatedAt: Date.now(),
        };

        broadcastSseEvent({ type: 'media', media: latestMediaState });
      }
    });

    mediaHelperProc.on('exit', () => {
      mediaHelperProc = null;
      mediaHelperReady = false;
      setTimeout(startMediaHelper, 4000);
    });
  } catch {
    mediaHelperProc = null;
  }
}

function sendMediaControlCommand(action) {
  const clean = String(action || '').trim().toLowerCase();
  if (!['playpause', 'next', 'prev'].includes(clean)) {
    throw new Error('Geçersiz medya komutu.');
  }
  if (mediaHelperProc && mediaHelperProc.stdin.writable) {
    mediaHelperProc.stdin.write(`CMD|${clean}\n`);
    return { ok: true, action: clean, via: 'gsmtc-helper' };
  }
  // Fallback direct media key via PowerShell if helper is restarting
  const vkMap = { playpause: '0xB3', next: '0xB0', prev: '0xB1' };
  spawn(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command',
      `Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class MK { [DllImport("user32.dll")] public static extern void keybd_event(byte v, byte s, uint f, UIntPtr e); }'; [MK]::keybd_event(${vkMap[clean]},0,1,[UIntPtr]::Zero); [MK]::keybd_event(${vkMap[clean]},0,3,[UIntPtr]::Zero)`],
    { windowsHide: true, stdio: 'ignore' },
  );
  return { ok: true, action: clean, via: 'vk-fallback' };
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...CORS_HEADERS,
  });
  res.end(JSON.stringify(payload));
}

// ============================================================================
// XIAOMI SMART AIR PURIFIER 4 — LOCAL LAN MiIO / MiOT UDP PROTOCOL (PORT 54321)
// Supports zero-dependency LAN UDP broadcast discovery, AES-128-CBC encrypted
// MiOT get_properties (Temperature, Humidity, PM2.5, Filter Life, Power, Mode),
// and set_properties (Power On/Off & Mode switching).
// ============================================================================
const MIIO_PORT = 54321;
const MIIO_HELLO_PACKET = Buffer.from('21310020ffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex');
let miioRpcId = 100;

// Persistent user-local state stored in OS user home directory (OUTSIDE project/git folder)
const USER_LOCAL_STATE_PATH = join(os.homedir(), '.diorama-local-state.json');

async function readUserLocalState() {
  try {
    if (!existsSync(USER_LOCAL_STATE_PATH)) return {};
    const raw = await readFile(USER_LOCAL_STATE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeUserLocalState(patch = {}) {
  try {
    const current = await readUserLocalState();
    const merged = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    if (Object.prototype.hasOwnProperty.call(patch, 'xiaomi')) {
      merged.xiaomi = patch.xiaomi === null
        ? null
        : {
            ...(current.xiaomi && typeof current.xiaomi === 'object' ? current.xiaomi : {}),
            ...(patch.xiaomi && typeof patch.xiaomi === 'object' ? patch.xiaomi : {}),
          };
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'appStorage')) {
      merged.appStorage = {
        ...(current.appStorage && typeof current.appStorage === 'object' ? current.appStorage : {}),
        ...(patch.appStorage && typeof patch.appStorage === 'object' ? patch.appStorage : {}),
      };
    }
    await writeFile(USER_LOCAL_STATE_PATH, JSON.stringify(merged, null, 2), 'utf8');
    return merged;
  } catch {
    return {};
  }
}

function isPrivateLanIp(ip) {
  return /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})$/.test(String(ip || '').trim());
}

function getLocalBroadcastAddresses() {
  const addrs = new Set(['255.255.255.255']);
  const nets = os.networkInterfaces();
  for (const list of Object.values(nets)) {
    if (!Array.isArray(list)) continue;
    for (const iface of list) {
      if (iface && iface.family === 'IPv4' && !iface.internal && iface.address) {
        const parts = iface.address.split('.');
        if (parts.length === 4) {
          addrs.add(`${parts[0]}.${parts[1]}.${parts[2]}.255`);
        }
      }
    }
  }
  return [...addrs];
}

async function discoverXiaomiDevicesOnLan(timeoutMs = 1500) {
  return new Promise((resolvePromise) => {
    const found = new Map();
    const socket = dgram.createSocket('udp4');

    const finish = () => {
      try { socket.close(); } catch {}
      resolvePromise([...found.values()]);
    };

    const timer = setTimeout(finish, timeoutMs);

    socket.on('error', () => {
      clearTimeout(timer);
      finish();
    });

    socket.on('message', (msg, rinfo) => {
      if (!msg || msg.length < 32 || msg[0] !== 0x21 || msg[1] !== 0x31) return;
      const deviceId = msg.readUInt32BE(8);
      const deviceIdHex = msg.subarray(8, 12).toString('hex');
      const stamp = msg.readUInt32BE(12);
      if (deviceId === 0xffffffff || deviceId === 0) return;
      found.set(rinfo.address, {
        ip: rinfo.address,
        deviceId,
        deviceIdHex,
        stamp,
      });
    });

    socket.bind(0, () => {
      try {
        socket.setBroadcast(true);
        for (const bcast of getLocalBroadcastAddresses()) {
          socket.send(MIIO_HELLO_PACKET, 0, MIIO_HELLO_PACKET.length, MIIO_PORT, bcast);
        }
      } catch {
        clearTimeout(timer);
        finish();
      }
    });
  });
}

function deriveMiioKeyIv(tokenBuf) {
  const key = crypto.createHash('md5').update(tokenBuf).digest();
  const iv = crypto.createHash('md5').update(Buffer.concat([key, tokenBuf])).digest();
  return { key, iv };
}

async function sendMiioCommand(ip, tokenHex, method, params = [], timeoutMs = 2600) {
  const cleanIp = String(ip || '').trim();
  const cleanToken = String(tokenHex || '').trim().toLowerCase();
  if (!isPrivateLanIp(cleanIp)) {
    throw new Error('Geçerli bir yerel ağ IP adresi girin (Örn: 192.168.1.45).');
  }
  if (!/^[0-9a-f]{32}$/.test(cleanToken)) {
    throw new Error('Geçerli bir 32 haneli Xiaomi MiIO Token (hex) girin.');
  }

  const tokenBuf = Buffer.from(cleanToken, 'hex');
  const { key, iv } = deriveMiioKeyIv(tokenBuf);

  return new Promise((resolvePromise, rejectPromise) => {
    const socket = dgram.createSocket('udp4');
    let phase = 'hello';
    let settled = false;

    const cleanup = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { socket.close(); } catch {}
    };

    const timer = setTimeout(() => {
      cleanup();
      rejectPromise(new Error(`Xiaomi cihazı (${cleanIp}:54321) yanıt vermedi. Cihazın açık ve aynı Wi-Fi ağında olduğundan emin olun.`));
    }, timeoutMs);

    socket.on('error', (err) => {
      cleanup();
      rejectPromise(err);
    });

    socket.on('message', (msg) => {
      if (!msg || msg.length < 32 || msg[0] !== 0x21 || msg[1] !== 0x31) return;

      if (phase === 'hello') {
        phase = 'rpc';
        const deviceId = msg.readUInt32BE(8);
        const stamp = msg.readUInt32BE(12) + 1;
        miioRpcId = (miioRpcId % 9000) + 100;

        const payloadStr = JSON.stringify({
          id: miioRpcId,
          method,
          params,
        }) + '\x00';

        const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
        const encrypted = Buffer.concat([cipher.update(Buffer.from(payloadStr, 'utf8')), cipher.final()]);

        const totalLen = 32 + encrypted.length;
        const header = Buffer.alloc(32);
        header[0] = 0x21;
        header[1] = 0x31;
        header.writeUInt16BE(totalLen, 2);
        header.writeUInt32BE(0, 4);
        header.writeUInt32BE(deviceId, 8);
        header.writeUInt32BE(stamp, 12);

        const md5 = crypto.createHash('md5')
          .update(header.subarray(0, 16))
          .update(tokenBuf)
          .update(encrypted)
          .digest();
        md5.copy(header, 16);

        const packet = Buffer.concat([header, encrypted]);
        socket.send(packet, 0, packet.length, MIIO_PORT, cleanIp);
        return;
      }

      if (phase === 'rpc') {
        try {
          const encPayload = msg.subarray(32);
          if (!encPayload.length) throw new Error('Boş MiIO yanıtı (Token hatalı olabilir).');
          const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
          const decrypted = Buffer.concat([decipher.update(encPayload), decipher.final()]);
          const jsonText = decrypted.toString('utf8').replace(/\x00+$/g, '').trim();
          const parsed = JSON.parse(jsonText);
          cleanup();
          resolvePromise(parsed);
        } catch (err) {
          cleanup();
          rejectPromise(new Error(`MiIO şifresi çözülemedi — 32 haneli Token doğru mu? (${err.message})`));
        }
      }
    });

    socket.send(MIIO_HELLO_PACKET, 0, MIIO_HELLO_PACKET.length, MIIO_PORT, cleanIp);
  });
}

const deviceMetaCache = new Map();

async function resolveXiaomiCredentials(ip, token) {
  let cleanIp = String(ip || '').trim();
  let cleanToken = String(token || '').trim().toLowerCase();
  if (!cleanIp || !cleanToken) {
    const saved = await readUserLocalState();
    if (!cleanIp && saved?.xiaomi?.ip) cleanIp = String(saved.xiaomi.ip).trim();
    if (!cleanToken && saved?.xiaomi?.token) cleanToken = String(saved.xiaomi.token).trim().toLowerCase();
  }
  return { ip: cleanIp, token: cleanToken };
}

async function getXiaomiDeviceModel(ip, token) {
  if (deviceMetaCache.has(ip) && deviceMetaCache.get(ip).model) {
    return deviceMetaCache.get(ip).model;
  }
  try {
    const info = await sendMiioCommand(ip, token, 'miIO.info', [], 1800);
    const model = String(info?.result?.model || '').trim();
    if (model) {
      deviceMetaCache.set(ip, { ...(deviceMetaCache.get(ip) || {}), model });
    }
    return model;
  } catch {
    return '';
  }
}

function parseXiaomiMiotTelemetry(entries, { ip = '', model = '' } = {}) {
  const byDid = {};
  for (const entry of (Array.isArray(entries) ? entries : [])) {
    if (entry && entry.did && entry.code === 0 && entry.value !== undefined && entry.value !== null) {
      byDid[entry.did] = entry.value;
    }
  }

  // Disambiguate Purifier 4 (mb5/va2/vb4: 3.1=Humidity, 3.7=Temp) vs Legacy 3H/RMB1 (3.7=Humidity, 3.8=Temp)
  const isLegacyEnvSchema = /airpurifier\.(mb3|ma4|va1|za1)|airp\.rmb1/i.test(model)
    || (byDid.hum_p1 === undefined && Number.isFinite(Number(byDid.env_p8)) && Number(byDid.env_p8) < 50);

  let humidity = null;
  let temperature = null;
  let pm10 = null;

  if (!isLegacyEnvSchema) {
    if (Number.isFinite(Number(byDid.hum_p1))) {
      humidity = Math.max(0, Math.min(100, Math.round(Number(byDid.hum_p1))));
    }
    if (Number.isFinite(Number(byDid.temp_p7))) {
      temperature = Number(Number(byDid.temp_p7).toFixed(1));
    }
    if (/vb4/i.test(model) && Number.isFinite(Number(byDid.env_p8))) {
      pm10 = Math.max(0, Math.round(Number(byDid.env_p8)));
    }
  } else {
    if (Number.isFinite(Number(byDid.temp_p7))) {
      humidity = Math.max(0, Math.min(100, Math.round(Number(byDid.temp_p7))));
    }
    if (Number.isFinite(Number(byDid.env_p8))) {
      temperature = Number(Number(byDid.env_p8).toFixed(1));
    }
  }

  const rawPm25 = Number.isFinite(Number(byDid.pm25_p4))
    ? Number(byDid.pm25_p4)
    : Number.isFinite(Number(byDid.pm25_p6))
      ? Number(byDid.pm25_p6)
      : null;
  const pm25 = rawPm25 !== null ? Math.max(0, Math.round(rawPm25)) : null;

  // Mode piid detection: va2/mb5 use siid 2 piid 4; mb3 uses siid 2 piid 5
  const useModeP5 = /airpurifier\.(mb3|ma4|za1)/i.test(model) || (byDid.mode_p4 === undefined && byDid.mode_p5 !== undefined);
  const modeVal = useModeP5 ? byDid.mode_p5 : byDid.mode_p4;

  // Filter life & days/hours disambiguation
  let filterLife = null;
  let filterLeftDays = null;
  let filterHoursUsed = null;

  const fp1 = Number(byDid.f_p1);
  const fp2 = Number(byDid.f_p2);
  const fp3 = Number(byDid.f_p3);
  const fp4 = Number(byDid.f_p4);
  const fp5 = Number(byDid.f_p5);

  if (Number.isFinite(fp3) && fp3 >= 0 && fp3 <= 100 && (!Number.isFinite(fp1) || fp1 <= 5 || Number.isFinite(fp4))) {
    // mb5 / mb3 Filter spec: piid 3 = life (%), piid 4 = remaining days, piid 5 = hours used
    filterLife = Math.round(fp3);
    if (Number.isFinite(fp4) && fp4 >= 0) {
      filterLeftDays = fp4 > 365 ? Math.round(fp4 / 24) : Math.round(fp4);
    }
    if (Number.isFinite(fp5) && fp5 >= 0) {
      filterHoursUsed = Math.round(fp5);
    }
  } else if (Number.isFinite(fp1) && fp1 >= 0 && fp1 <= 100) {
    // _MAPPING_VA2 spec: piid 1 = life (%), piid 3 = hours used
    filterLife = Math.round(fp1);
    if (Number.isFinite(fp3) && fp3 >= 0) filterHoursUsed = Math.round(fp3);
    if (Number.isFinite(fp2) && fp2 >= 0) {
      filterLeftDays = fp2 > 365 ? Math.round(fp2 / 24) : Math.round(fp2);
    }
  }

  const motorSpeed = Number.isFinite(Number(byDid.motor_p1)) && Number(byDid.motor_p1) >= 0
    ? Math.round(Number(byDid.motor_p1))
    : null;

  return {
    telemetry: {
      connected: true,
      source: 'miio-lan',
      ip,
      model: model || 'zhimi.airp.mb5',
      power: typeof byDid.power === 'boolean' ? byDid.power : null,
      mode: Number.isInteger(modeVal) ? modeVal : 0,
      pm25,
      pm10,
      humidity,
      temperature,
      motorSpeed,
      filterLife,
      filterLeftDays,
      filterHoursUsed,
      updatedAt: new Date().toISOString(),
    },
    modePiid: useModeP5 ? 5 : 4,
  };
}

async function queryXiaomiAirPurifier4(rawIp, rawToken) {
  const { ip, token } = await resolveXiaomiCredentials(rawIp, rawToken);
  const model = await getXiaomiDeviceModel(ip, token);

  // Split MiOT get_properties into 2 compact packets (max 7 properties per packet)
  // so no Xiaomi Air Purifier 4 / 4 Lite / 4 Pro / 3H firmware rejects packet length.
  const batch1 = [
    { did: 'power', siid: 2, piid: 1 },
    { did: 'mode_p4', siid: 2, piid: 4 },
    { did: 'mode_p5', siid: 2, piid: 5 },
    { did: 'hum_p1', siid: 3, piid: 1 },   // Standard Purifier 4 (va2/mb5/vb4): Humidity (%)
    { did: 'pm25_p4', siid: 3, piid: 4 },  // Standard Purifier 4: PM2.5 (µg/m³)
    { did: 'temp_p7', siid: 3, piid: 7 },  // Standard Purifier 4: Temperature (°C)
    { did: 'motor_p1', siid: 9, piid: 1 }, // Motor RPM on va2/mb5
  ];

  const batch2 = [
    { did: 'f_p1', siid: 4, piid: 1 },
    { did: 'f_p2', siid: 4, piid: 2 },
    { did: 'f_p3', siid: 4, piid: 3 },
    { did: 'f_p4', siid: 4, piid: 4 },
    { did: 'f_p5', siid: 4, piid: 5 },
    { did: 'env_p8', siid: 3, piid: 8 },   // PM10 (vb4 4 Pro) or Temp (legacy 3H mb3/rmb1)
    { did: 'pm25_p6', siid: 3, piid: 6 },  // PM2.5 fallback for legacy 3H (mb3)
  ];

  const [res1, res2] = await Promise.all([
    sendMiioCommand(ip, token, 'get_properties', batch1),
    sendMiioCommand(ip, token, 'get_properties', batch2).catch(() => ({ result: [] })),
  ]);

  if (res1?.error) {
    throw new Error(res1.error.message || 'MiOT get_properties hatası');
  }

  const combined = [...(Array.isArray(res1?.result) ? res1.result : []), ...(Array.isArray(res2?.result) ? res2.result : [])];
  const { telemetry, modePiid } = parseXiaomiMiotTelemetry(combined, { ip, model });

  deviceMetaCache.set(ip, {
    ...(deviceMetaCache.get(ip) || {}),
    model: telemetry.model,
    modePiid,
  });

  await writeUserLocalState({
    xiaomi: { ip, token, model: telemetry.model, lastTelemetry: telemetry },
  });

  return telemetry;
}

async function controlXiaomiAirPurifier4(rawIp, rawToken, action = {}) {
  const { ip, token } = await resolveXiaomiCredentials(rawIp, rawToken);
  const cachedMeta = deviceMetaCache.get(ip) || {};
  const modePiid = cachedMeta.modePiid || 4;
  const setter = [];
  if (typeof action.power === 'boolean') {
    setter.push({ did: 'power', siid: 2, piid: 1, value: action.power });
  }
  if (Number.isInteger(action.mode) && [0, 1, 2, 3].includes(action.mode)) {
    setter.push({ did: 'mode', siid: 2, piid: modePiid, value: action.mode });
  }
  if (!setter.length) throw new Error('Geçersiz kontrol komutu.');
  const response = await sendMiioCommand(ip, token, 'set_properties', setter);
  if (response?.error) {
    throw new Error(response.error.message || 'MiOT set_properties hatası');
  }
  return queryXiaomiAirPurifier4(ip, token);
}

// ============================================================================
// GLOBAL SOCCER LEAGUES, NATIONAL TEAMS & LIVE FIXTURES (ESPN Public JSON API)
// Supports up to 3 club teams (from 10 global leagues) + 1 national team (24 nations).
// Zero API key required; cached in-memory (24h teams, 2h fixtures).
// ============================================================================
const SPORTS_TEAMS = {
  gs: { id: '432', name: 'Galatasaray', short: 'GS' },
  fb: { id: '436', name: 'Fenerbahçe', short: 'FB' },
  bjk: { id: '1895', name: 'Beşiktaş', short: 'BJK' },
  ts: { id: '997', name: 'Trabzonspor', short: 'TS' },
  tr: { id: '465', name: 'Türkiye', short: 'TR' },
};

const GLOBAL_SOCCER_LEAGUES = {
  'tur.1': { countryTr: 'Türkiye', countryEn: 'Türkiye', league: 'Süper Lig' },
  'eng.1': { countryTr: 'İngiltere', countryEn: 'England', league: 'Premier League' },
  'esp.1': { countryTr: 'İspanya', countryEn: 'Spain', league: 'LaLiga' },
  'ger.1': { countryTr: 'Almanya', countryEn: 'Germany', league: 'Bundesliga' },
  'ita.1': { countryTr: 'İtalya', countryEn: 'Italy', league: 'Serie A' },
  'fra.1': { countryTr: 'Fransa', countryEn: 'France', league: 'Ligue 1' },
  'ned.1': { countryTr: 'Hollanda', countryEn: 'Netherlands', league: 'Eredivisie' },
  'por.1': { countryTr: 'Portekiz', countryEn: 'Portugal', league: 'Primeira Liga' },
  'usa.1': { countryTr: 'ABD', countryEn: 'USA', league: 'MLS' },
  'ksa.1': { countryTr: 'S. Arabistan', countryEn: 'Saudi Arabia', league: 'Pro League' },
};

const NATIONAL_CONFED_BY_ID = {
  '465': 'uefa', '448': 'uefa', '481': 'uefa', '164': 'uefa', '478': 'uefa',
  '162': 'uefa', '449': 'uefa', '482': 'uefa', '477': 'uefa', '459': 'uefa',
  '471': 'uefa', '475': 'uefa', '474': 'uefa', '479': 'uefa', '466': 'uefa', '464': 'uefa',
  '205': 'conmebol', '202': 'conmebol',
  '660': 'concacaf', '203': 'concacaf', '206': 'concacaf',
  '627': 'afc', '451': 'afc',
  '2869': 'caf',
};

const CONFED_COMPETITIONS = {
  uefa: [
    ['uefa.nations', 'UEFA Nations League'],
    ['fifa.worldq.uefa', 'World Cup Qualifiers'],
    ['uefa.euroq', 'EURO Qualifiers'],
    ['fifa.world', 'FIFA World Cup'],
    ['fifa.friendly', 'International Friendly'],
  ],
  conmebol: [
    ['fifa.worldq.conmebol', 'World Cup Qualifiers'],
    ['conmebol.america', 'Copa América'],
    ['fifa.world', 'FIFA World Cup'],
    ['fifa.friendly', 'International Friendly'],
  ],
  concacaf: [
    ['concacaf.nations.league', 'CONCACAF Nations League'],
    ['fifa.worldq.concacaf', 'World Cup Qualifiers'],
    ['fifa.world', 'FIFA World Cup'],
    ['fifa.friendly', 'International Friendly'],
  ],
  afc: [
    ['fifa.worldq.afc', 'World Cup Qualifiers'],
    ['afc.cup', 'AFC Asian Cup'],
    ['fifa.world', 'FIFA World Cup'],
    ['fifa.friendly', 'International Friendly'],
  ],
  caf: [
    ['caf.nations', 'Africa Cup of Nations'],
    ['fifa.worldq.caf', 'World Cup Qualifiers'],
    ['fifa.world', 'FIFA World Cup'],
    ['fifa.friendly', 'International Friendly'],
  ],
};

const TEAM_NAME_TR_MAP = [
  [/^Besiktas$/i, 'Beşiktaş'],
  [/^Fenerbahce$/i, 'Fenerbahçe'],
  [/^Turkey$/i, 'Türkiye'],
  [/^Istanbul Basaksehir$|^Basaksehir$/i, 'Başakşehir'],
  [/^Kasimpasa$/i, 'Kasımpaşa'],
  [/^Goztepe$/i, 'Göztepe'],
  [/^Eyupspor$/i, 'Eyüpspor'],
  [/^Fatih Karagumruk$/i, 'Karagümrük'],
  [/^Genclerbirligi$/i, 'Gençlerbirliği'],
  [/^Caykur Rizespor$/i, 'Rizespor'],
  [/^Gaziantep FK$/i, 'Gaziantep FK'],
  [/^France$/i, 'Fransa'],
  [/^Belgium$/i, 'Belçika'],
  [/^Germany$/i, 'Almanya'],
  [/^Spain$/i, 'İspanya'],
  [/^Italy$/i, 'İtalya'],
  [/^England$/i, 'İngiltere'],
  [/^Netherlands$/i, 'Hollanda'],
  [/^Portugal$/i, 'Portekiz'],
  [/^Croatia$/i, 'Hırvatistan'],
  [/^Romania$/i, 'Romanya'],
  [/^Kosovo$/i, 'Kosova'],
  [/^Iceland$/i, 'İzlanda'],
  [/^Wales$/i, 'Galler'],
  [/^Austria$/i, 'Avusturya'],
  [/^Switzerland$/i, 'İsviçre'],
  [/^Sweden$/i, 'İsveç'],
  [/^Norway$/i, 'Norveç'],
  [/^Denmark$/i, 'Danimarka'],
  [/^Greece$/i, 'Yunanistan'],
  [/^Hungary$/i, 'Macaristan'],
  [/^Poland$/i, 'Polonya'],
  [/^Czechia$|^Czech Republic$/i, 'Çekya'],
  [/^Georgia$/i, 'Gürcistan'],
  [/^Scotland$/i, 'İskoçya'],
  [/^Serbia$/i, 'Sırbistan'],
  [/^Ukraine$/i, 'Ukrayna'],
  [/^Brazil$/i, 'Brezilya'],
  [/^Argentina$/i, 'Arjantin'],
  [/^United States$|^USA$/i, 'ABD'],
  [/^Japan$/i, 'Japonya'],
  [/^South Korea$/i, 'Güney Kore'],
  [/^Morocco$/i, 'Fas'],
  [/^Mexico$/i, 'Meksika'],
  [/^Canada$/i, 'Kanada'],
];

function localizeTeamName(raw = '', lang = 'tr') {
  const clean = String(raw || '').trim();
  if (lang === 'en') {
    if (/^Besiktas$/i.test(clean)) return 'Beşiktaş';
    if (/^Fenerbahce$/i.test(clean)) return 'Fenerbahçe';
    if (/^Turkey$/i.test(clean)) return 'Türkiye';
    return clean;
  }
  for (const [pattern, trName] of TEAM_NAME_TR_MAP) {
    if (pattern.test(clean)) return trName;
  }
  return clean;
}

function localizeLeagueName(raw = '', lang = 'tr') {
  const s = String(raw || '').trim();
  if (lang === 'en') {
    if (/super lig|süper lig/i.test(s)) return 'Süper Lig';
    if (/premier league/i.test(s)) return 'Premier League';
    if (/la\s?liga|primera div/i.test(s)) return 'LaLiga';
    if (/bundesliga/i.test(s)) return 'Bundesliga';
    if (/serie a/i.test(s)) return 'Serie A';
    if (/ligue 1/i.test(s)) return 'Ligue 1';
    if (/eredivisie/i.test(s)) return 'Eredivisie';
    if (/primeira liga/i.test(s)) return 'Primeira Liga';
    if (/champions league/i.test(s)) return 'Champions League';
    if (/conference league/i.test(s)) return 'Conference League';
    if (/europa league/i.test(s)) return 'Europa League';
    if (/nations league/i.test(s)) return 'Nations League';
    if (/world cup.*qual/i.test(s)) return 'World Cup Qualifiers';
    if (/world cup/i.test(s)) return 'FIFA World Cup';
    if (/euro.*qual/i.test(s)) return 'EURO Qualifiers';
    if (/friendly|friendlies/i.test(s)) return 'Friendly';
    return s || 'Match';
  }
  if (/super lig|süper lig/i.test(s)) return 'Süper Lig';
  if (/premier league/i.test(s)) return 'Premier Lig';
  if (/la\s?liga|primera div/i.test(s)) return 'LaLiga';
  if (/bundesliga/i.test(s)) return 'Bundesliga';
  if (/serie a/i.test(s)) return 'Serie A';
  if (/ligue 1/i.test(s)) return 'Ligue 1';
  if (/champions league/i.test(s)) return 'Şampiyonlar Ligi';
  if (/europa conference|conference league/i.test(s)) return 'Konferans Ligi';
  if (/europa league/i.test(s)) return 'Avrupa Ligi';
  if (/nations league/i.test(s)) return 'UEFA Uluslar Ligi';
  if (/world cup qualifying|world cup.*qual/i.test(s)) return 'Dünya Kupası Elemeleri';
  if (/world cup/i.test(s)) return 'Dünya Kupası';
  if (/european.*qual|euro.*qual/i.test(s)) return 'EURO Elemeleri';
  if (/euro/i.test(s)) return 'Avrupa Şampiyonası';
  if (/friendly|friendlies/i.test(s)) return 'Hazırlık Maçı';
  if (/turkish cup|türkiye kupası/i.test(s)) return 'Türkiye Kupası';
  return s || 'Maç';
}

function formatZonedDateTime(isoString, timeZone = 'Europe/Istanbul') {
  const dt = new Date(isoString);
  if (!Number.isFinite(dt.getTime())) return null;
  const safeTz = typeof timeZone === 'string' && /^[A-Za-z0-9_+-]+\/[A-Za-z0-9_+-]+(?:\/[A-Za-z0-9_+-]+)?$/.test(timeZone)
    ? timeZone
    : 'Europe/Istanbul';
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: safeTz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(dt);
    const get = (t) => parts.find((p) => p.type === t)?.value || '00';
    const hour = get('hour') === '24' ? '00' : get('hour');
    return {
      date: `${get('year')}-${get('month')}-${get('day')}`,
      time: `${hour}:${get('minute')}`,
      ts: dt.getTime(),
    };
  } catch {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    const h = String(dt.getHours()).padStart(2, '0');
    const min = String(dt.getMinutes()).padStart(2, '0');
    return { date: `${y}-${m}-${d}`, time: `${h}:${min}`, ts: dt.getTime() };
  }
}

function parseEspnScheduleEvents(events, { teamKey, teamId, teamLabel = '', isNational = false, fallbackLeague = '', tz = 'Europe/Istanbul', lang = 'tr' } = {}) {
  if (!Array.isArray(events)) return [];
  const results = [];
  for (const ev of events) {
    if (!ev || !ev.date) continue;
    const localDt = formatZonedDateTime(ev.date, tz);
    if (!localDt) continue;
    const comp = Array.isArray(ev.competitions) ? ev.competitions[0] : null;
    const competitors = Array.isArray(comp?.competitors) ? comp.competitors : [];
    const home = competitors.find((c) => c.homeAway === 'home') || competitors[0];
    const away = competitors.find((c) => c.homeAway === 'away') || competitors[1];
    const homeName = localizeTeamName(home?.team?.shortDisplayName || home?.team?.displayName || '', lang);
    const awayName = localizeTeamName(away?.team?.shortDisplayName || away?.team?.displayName || '', lang);
    const matchTitle = homeName && awayName
      ? `${homeName} - ${awayName}`
      : String(ev.name || (lang === 'en' ? 'Match' : 'Maç'));

    const statusType = comp?.status?.type || {};
    const completed = Boolean(statusType.completed);
    const homeScore = home?.score?.displayValue ?? (typeof home?.score === 'string' || typeof home?.score === 'number' ? String(home.score) : '');
    const awayScore = away?.score?.displayValue ?? (typeof away?.score === 'string' || typeof away?.score === 'number' ? String(away.score) : '');
    const scoreText = completed && homeScore !== '' && awayScore !== '' ? `${homeScore}-${awayScore}` : '';

    const rawLeague = ev.league?.shortName || ev.league?.name || ev.seasonType?.name || fallbackLeague;
    const league = localizeLeagueName(rawLeague, lang);
    const isHome = String(home?.team?.id || '') === String(teamId || '');

    results.push({
      id: `match-${teamId || teamKey || 'nat'}-${ev.id || `${localDt.date}-${localDt.time}`}`,
      eventId: String(ev.id || ''),
      teamId: String(teamId || ''),
      teamKey: String(teamKey || teamId || (isNational ? 'nat' : 'club')),
      teamLabel: teamLabel || (isHome ? homeName : awayName),
      isNational: Boolean(isNational),
      date: localDt.date,
      time: localDt.time,
      timestamp: localDt.ts,
      title: matchTitle,
      homeTeam: homeName,
      awayTeam: awayName,
      isHome,
      league,
      completed,
      score: scoreText,
    });
  }
  return results;
}

const sportsFixturesCache = new Map();
const sportsLeagueTeamsCache = new Map();
const SPORTS_CACHE_TTL_MS = 2 * 60 * 60 * 1000;
const LEAGUE_TEAMS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function fetchJsonSafe(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'DioramaDesktop/1.0' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchLeagueTeams(leagueSlug = 'tur.1', lang = 'tr') {
  const slug = Object.prototype.hasOwnProperty.call(GLOBAL_SOCCER_LEAGUES, leagueSlug) ? leagueSlug : 'tur.1';
  const cacheKey = `${slug}|${lang}`;
  const cached = sportsLeagueTeamsCache.get(cacheKey);
  if (cached && (Date.now() - cached.fetchedAt) < LEAGUE_TEAMS_CACHE_TTL_MS) {
    return cached.teams;
  }
  const meta = GLOBAL_SOCCER_LEAGUES[slug];
  const data = await fetchJsonSafe(`https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/teams`, 9000);
  const rawTeams = data?.sports?.[0]?.leagues?.[0]?.teams || [];
  const teams = rawTeams
    .map((entry) => entry?.team)
    .filter((t) => t && t.id && (t.shortDisplayName || t.displayName))
    .map((t) => ({
      id: String(t.id),
      name: localizeTeamName(t.shortDisplayName || t.displayName, lang),
      short: String(t.abbreviation || t.shortDisplayName || '').slice(0, 4).toUpperCase(),
      league: meta.league,
      leagueSlug: slug,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, lang === 'en' ? 'en' : 'tr'));

  if (teams.length) {
    sportsLeagueTeamsCache.set(cacheKey, { fetchedAt: Date.now(), teams });
  }
  return teams;
}

async function fetchSportsFixtures({ clubIds = [], nationalId = '', team = 'none', includeNational = true, tz = 'Europe/Istanbul', lang = 'tr', forceRefresh = false } = {}) {
  // Support both new multi-club IDs (up to 3) + nationalId AND legacy ?team=gs|fb|bjk|ts
  const resolvedClubs = [];
  if (Array.isArray(clubIds) && clubIds.length) {
    for (const rawId of clubIds) {
      const cleanId = String(rawId || '').replace(/[^\d]/g, '');
      if (cleanId && !resolvedClubs.includes(cleanId) && resolvedClubs.length < 3) {
        resolvedClubs.push(cleanId);
      }
    }
  } else if (team && team !== 'none' && SPORTS_TEAMS[String(team).toLowerCase()]) {
    resolvedClubs.push(SPORTS_TEAMS[String(team).toLowerCase()].id);
  }

  let resolvedNatId = String(nationalId || '').replace(/[^\d]/g, '');
  if (!resolvedNatId && nationalId !== 'none' && includeNational) {
    resolvedNatId = SPORTS_TEAMS.tr.id;
  }
  if (nationalId === 'none' || !includeNational) {
    resolvedNatId = '';
  }

  const safeLang = lang === 'en' ? 'en' : 'tr';
  const cacheKey = `${resolvedClubs.join(',')}|${resolvedNatId}|${tz}|${safeLang}`;
  const cached = sportsFixturesCache.get(cacheKey);
  if (!forceRefresh && cached && (Date.now() - cached.fetchedAt) < SPORTS_CACHE_TTL_MS) {
    return cached.data;
  }

  const jobs = [];
  for (const cid of resolvedClubs) {
    jobs.push(
      fetchJsonSafe(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams/${cid}/schedule?fixture=true`)
        .then((d) => parseEspnScheduleEvents(d?.events, { teamKey: cid, teamId: cid, isNational: false, tz, lang: safeLang })),
      fetchJsonSafe(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams/${cid}/schedule`)
        .then((d) => parseEspnScheduleEvents(d?.events, { teamKey: cid, teamId: cid, isNational: false, tz, lang: safeLang })),
    );
  }

  if (resolvedNatId) {
    const confed = NATIONAL_CONFED_BY_ID[resolvedNatId] || 'uefa';
    const natComps = CONFED_COMPETITIONS[confed] || CONFED_COMPETITIONS.uefa;
    for (const [slug, fallbackLeague] of natComps) {
      jobs.push(
        fetchJsonSafe(`https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/teams/${resolvedNatId}/schedule?fixture=true`)
          .then((d) => parseEspnScheduleEvents(d?.events, { teamKey: `nat-${resolvedNatId}`, teamId: resolvedNatId, isNational: true, fallbackLeague, tz, lang: safeLang })),
        fetchJsonSafe(`https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/teams/${resolvedNatId}/schedule`)
          .then((d) => parseEspnScheduleEvents(d?.events, { teamKey: `nat-${resolvedNatId}`, teamId: resolvedNatId, isNational: true, fallbackLeague, tz, lang: safeLang })),
      );
    }
  }

  const settled = await Promise.all(jobs);
  const byKey = new Map();
  for (const list of settled) {
    for (const item of list) {
      const dedupeKey = item.eventId ? `${item.eventId}` : `${item.date}:${item.title}`;
      const prev = byKey.get(dedupeKey);
      if (!prev || (!prev.completed && item.completed) || ((prev.league === 'Maç' || prev.league === 'Match') && item.league !== prev.league)) {
        byKey.set(dedupeKey, item);
      }
    }
  }

  const fixtures = Array.from(byKey.values()).sort((a, b) => a.timestamp - b.timestamp);
  const payload = {
    clubIds: resolvedClubs,
    nationalId: resolvedNatId,
    tz,
    lang: safeLang,
    fetchedAt: new Date().toISOString(),
    fixtures,
  };
  sportsFixturesCache.set(cacheKey, { fetchedAt: Date.now(), data: payload });
  return payload;
}

// ============================================================================
// ENGLISH GLOBAL NEWS RSS FEED AGGREGATOR (Active when UI Language = English)
// ============================================================================
const EN_NEWS_FEEDS = {
  gundem: [
    { id: 'bbc-world', publisher: 'BBC World', rss: 'https://feeds.bbci.co.uk/news/world/rss.xml', homepage: 'https://www.bbc.com/news/world' },
    { id: 'npr-news', publisher: 'NPR News', rss: 'https://feeds.npr.org/1001/rss.xml', homepage: 'https://www.npr.org/sections/news/' },
    { id: 'guardian-world', publisher: 'The Guardian', rss: 'https://www.theguardian.com/world/rss', homepage: 'https://www.theguardian.com/world' },
    { id: 'dw-world', publisher: 'DW World', rss: 'https://rss.dw.com/xml/rss-en-world', homepage: 'https://www.dw.com/en/' },
  ],
  teknoloji: [
    { id: 'bbc-tech', publisher: 'BBC Tech', rss: 'https://feeds.bbci.co.uk/news/technology/rss.xml', homepage: 'https://www.bbc.com/news/technology' },
    { id: 'the-verge', publisher: 'The Verge', rss: 'https://www.theverge.com/rss/index.xml', homepage: 'https://www.theverge.com' },
    { id: 'ars-tech', publisher: 'Ars Technica', rss: 'https://feeds.arstechnica.com/arstechnica/index', homepage: 'https://arstechnica.com' },
    { id: 'techcrunch', publisher: 'TechCrunch', rss: 'https://techcrunch.com/feed/', homepage: 'https://techcrunch.com' },
  ],
  bilim: [
    { id: 'bbc-sci', publisher: 'BBC Science', rss: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', homepage: 'https://www.bbc.com/news/science_and_environment' },
    { id: 'nasa-news', publisher: 'NASA', rss: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', homepage: 'https://www.nasa.gov' },
    { id: 'sciencedaily', publisher: 'ScienceDaily', rss: 'https://www.sciencedaily.com/rss/top/science.xml', homepage: 'https://www.sciencedaily.com' },
    { id: 'guardian-sci', publisher: 'The Guardian', rss: 'https://www.theguardian.com/science/rss', homepage: 'https://www.theguardian.com/science' },
  ],
};

const enNewsCache = new Map();
const EN_NEWS_TTL_MS = 10 * 60 * 1000;

async function fetchEnglishNews(cat = 'gundem', forceRefresh = false) {
  const safeCat = Object.prototype.hasOwnProperty.call(EN_NEWS_FEEDS, cat) ? cat : 'gundem';
  const cached = enNewsCache.get(safeCat);
  if (!forceRefresh && cached && (Date.now() - cached.fetchedAt) < EN_NEWS_TTL_MS) {
    return cached.data;
  }
  const sources = EN_NEWS_FEEDS[safeCat];
  const results = await Promise.allSettled(
    sources.map(async (src) => {
      const parsed = await fetchAndParseFeedCloudflare(src.rss);
      const rawItems = Array.isArray(parsed) ? parsed : (parsed?.items || []);
      return { src, items: rawItems.slice(0, 10) };
    }),
  );

  const items = [];
  const sourceStatus = [];
  let okCount = 0;
  for (let i = 0; i < sources.length; i++) {
    const src = sources[i];
    const r = results[i];
    if (r.status === 'fulfilled' && r.value.items.length > 0) {
      okCount += 1;
      sourceStatus.push({ id: src.id, publisher: src.publisher, homepage: src.homepage, ok: true, count: r.value.items.length });
      for (const it of r.value.items) {
        const pubIso = it.pubDate || it.publishedAt || '';
        const ts = pubIso ? Date.parse(pubIso) : 0;
        items.push({
          title: String(it.title || '').trim(),
          link: it.link || src.homepage,
          description: String(it.description || '').trim(),
          pubDate: pubIso,
          publishedAt: Number.isFinite(ts) && ts > 0 ? new Date(ts).toISOString() : '',
          source: src.publisher,
          sourceId: src.id,
          _ts: Number.isFinite(ts) ? ts : 0,
        });
      }
    } else {
      sourceStatus.push({ id: src.id, publisher: src.publisher, homepage: src.homepage, ok: false, count: 0 });
    }
  }

  items.sort((a, b) => (b._ts || 0) - (a._ts || 0));
  const cleaned = items.slice(0, 32).map(({ _ts, ...rest }) => rest);
  const payload = {
    status: okCount > 0 ? 'ok' : 'error',
    category: safeCat,
    items: cleaned,
    sources: sourceStatus,
    okCount,
    totalCount: sources.length,
    fetchedAt: new Date().toISOString(),
  };
  if (okCount > 0) {
    enNewsCache.set(safeCat, { fetchedAt: Date.now(), data: payload });
  }
  return payload;
}

// ============================================================================
// REAL-TIME SYSTEM HARDWARE MONITOR (CPU, RAM, GPU, TEMPS) & DIORAMA FOOTPRINT
// Combines zero-overhead Node os.cpus()/mem + nvidia-smi + persistent Win32
// PDH/WMI sysmon helper (CPU temp, iGPU/dGPU %, exact Wallpaper+Bridge load).
// ============================================================================
let prevOsCpuTotals = null;
let lastCpuPct = 0;

function readOsCpuTotals() {
  const cpus = os.cpus() || [];
  let idle = 0;
  let total = 0;
  for (const c of cpus) {
    const t = c.times || {};
    const sum = (t.user || 0) + (t.nice || 0) + (t.sys || 0) + (t.idle || 0) + (t.irq || 0);
    idle += t.idle || 0;
    total += sum;
  }
  return { idle, total, cores: cpus.length || 1, model: cpus[0]?.model || '' };
}

function sampleOsCpuPercent() {
  const cur = readOsCpuTotals();
  if (prevOsCpuTotals && cur.total > prevOsCpuTotals.total) {
    const dTotal = cur.total - prevOsCpuTotals.total;
    const dIdle = cur.idle - prevOsCpuTotals.idle;
    lastCpuPct = Number(Math.max(0, Math.min(100, ((dTotal - dIdle) / dTotal) * 100)).toFixed(1));
  }
  prevOsCpuTotals = cur;
  return { pct: lastCpuPct, cores: cur.cores, model: cur.model };
}

function shortenGpuName(raw = '') {
  return String(raw || '')
    .replace(/NVIDIA\s+GeForce\s+/i, '')
    .replace(/AMD\s+Radeon\s*\(TM\)\s*/i, 'Radeon ')
    .replace(/Intel\s*\(R\)\s*/i, 'Intel ')
    .replace(/\s+Laptop\s+GPU/i, ' Laptop')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseNvidiaSmiCsv(rawText = '') {
  const firstLine = String(rawText || '').split(/\r?\n/).map((l) => l.trim()).find(Boolean);
  if (!firstLine) return null;
  const cols = firstLine.split(',').map((c) => c.trim());
  if (cols.length < 5) return null;
  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  return {
    name: shortenGpuName(cols[0]),
    rawName: cols[0],
    utilPct: num(cols[1]),
    vramUsedMb: num(cols[2]),
    vramTotalMb: num(cols[3]),
    tempC: num(cols[4]),
    powerW: num(cols[5]),
  };
}

let nvidiaSmiCache = { fetchedAt: 0, data: null, unavailable: false };
let nvidiaStaticMeta = { probed: false, name: '', rawName: '', vramTotalMb: null };
let nvidiaSmiInFlight = null;

function queryNvidiaSmi({ forceProbe = false } = {}) {
  if (nvidiaSmiCache.unavailable) return Promise.resolve(null);
  if (!forceProbe && Date.now() - nvidiaSmiCache.fetchedAt < 4000) {
    return Promise.resolve(nvidiaSmiCache.data);
  }
  if (nvidiaSmiInFlight) return nvidiaSmiInFlight;

  nvidiaSmiInFlight = new Promise((resolvePromise) => {
    let stdout = '';
    let done = false;
    const finish = (val) => {
      if (done) return;
      done = true;
      nvidiaSmiInFlight = null;
      nvidiaStaticMeta.probed = true;
      resolvePromise(val);
    };
    try {
      const child = spawn('nvidia-smi', [
        '--query-gpu=name,utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw',
        '--format=csv,noheader,nounits',
      ], { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });

      const killTimer = setTimeout(() => {
        try { child.kill(); } catch {}
        finish(nvidiaSmiCache.data);
      }, 2200);

      child.stdout.on('data', (chunk) => { stdout += chunk.toString('utf8'); });
      child.on('error', () => {
        clearTimeout(killTimer);
        nvidiaSmiCache.unavailable = true;
        finish(null);
      });
      child.on('close', (code) => {
        clearTimeout(killTimer);
        const parsed = code === 0 ? parseNvidiaSmiCsv(stdout) : null;
        if (parsed) {
          nvidiaSmiCache = { fetchedAt: Date.now(), data: parsed, unavailable: false };
          nvidiaStaticMeta = {
            probed: true,
            name: parsed.name || nvidiaStaticMeta.name,
            rawName: parsed.rawName || nvidiaStaticMeta.rawName,
            vramTotalMb: Number.isFinite(parsed.vramTotalMb) ? parsed.vramTotalMb : nvidiaStaticMeta.vramTotalMb,
          };
        }
        finish(parsed || nvidiaSmiCache.data);
      });
    } catch {
      nvidiaSmiCache.unavailable = true;
      finish(null);
    }
  });
  return nvidiaSmiInFlight;
}

let sysmonHelperProc = null;
let sysmonHelperReady = false;
let lastSysmonDemandAt = 0;
let lastSysmonPingSentAt = 0;
let latestSysmonState = {
  cpuName: '',
  gpuNameFallback: '',
  igpuName: '',
  cpuTempC: null,
  pdhGpuPct: null,
  dioramaRamMb: null,
  wallpaperRamMb: null,
  bridgeRamMb: null,
  dioramaCpuPct: null,
  dioramaGpuPct: null,
  dioramaVramMb: null,
  totalSystemDedVramMb: 0,
  activeAdapterCount: 0,
  dgpuLikelyActive: false,
  wallpaperRunning: false,
  updatedAt: '',
};

function syncSysmonTrackedPids() {
  if (!sysmonHelperProc || !sysmonHelperProc.stdin || !sysmonHelperProc.stdin.writable) return;
  const pids = [];
  if (nativeHelperProc?.pid) pids.push(nativeHelperProc.pid);
  if (mediaHelperProc?.pid) pids.push(mediaHelperProc.pid);
  try {
    sysmonHelperProc.stdin.write(`PIDS|${pids.join(',')}\n`);
  } catch {}
}

function startSysmonHelper() {
  if (!existsSync(sysmonHelperScriptPath) || sysmonHelperProc) return;
  const proc = spawn('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy', 'Bypass',
    '-WindowStyle', 'Hidden',
    '-File', sysmonHelperScriptPath,
    '-BridgePid', String(process.pid),
    '-IntervalMs', '3500',
  ], {
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'ignore'],
  });

  sysmonHelperProc = proc;
  const rl = readline.createInterface({ input: proc.stdout });
  rl.on('line', (line) => {
    if (line === 'SYSMON_READY') {
      sysmonHelperReady = true;
      syncSysmonTrackedPids();
      pingSysmonHelper();
      return;
    }
    if (line.startsWith('SYSMON|')) {
      try {
        const parsed = JSON.parse(line.slice(7));
        if (parsed && typeof parsed === 'object') {
          latestSysmonState = { ...latestSysmonState, ...parsed };
        }
      } catch {}
    }
  });

  proc.on('exit', () => {
    sysmonHelperProc = null;
    sysmonHelperReady = false;
    if (lastSysmonDemandAt > 0 && Date.now() - lastSysmonDemandAt < 15000) {
      setTimeout(() => {
        if (!sysmonHelperProc && Date.now() - lastSysmonDemandAt < 20000) startSysmonHelper();
      }, 5000);
    }
  });
}

function pingSysmonHelper() {
  const now = Date.now();
  lastSysmonDemandAt = now;
  if (!sysmonHelperProc) {
    startSysmonHelper();
    return;
  }
  if (now - lastSysmonPingSentAt < 2000) return;
  if (sysmonHelperProc.stdin && sysmonHelperProc.stdin.writable) {
    try {
      sysmonHelperProc.stdin.write('PING\n');
      lastSysmonPingSentAt = now;
    } catch {}
  }
}

async function getSystemMonitorSnapshot() {
  pingSysmonHelper();

  const cpuSample = sampleOsCpuPercent();
  const totalBytes = os.totalmem();
  const freeBytes = os.freemem();
  const usedBytes = Math.max(0, totalBytes - freeBytes);
  const ramPct = totalBytes > 0 ? Number(((usedBytes / totalBytes) * 100).toFixed(1)) : 0;
  const ramUsedGb = Number((usedBytes / (1024 ** 3)).toFixed(1));
  const ramTotalGb = Number((totalBytes / (1024 ** 3)).toFixed(1));

  const pdhGpu = Number.isFinite(latestSysmonState.pdhGpuPct) ? latestSysmonState.pdhGpuPct : null;
  const igpuName = shortenGpuName(latestSysmonState.igpuName || '');
  const fallbackDgpu = shortenGpuName(latestSysmonState.gpuNameFallback || '');
  const hasHybridGpu = Boolean(
    igpuName &&
    (nvidiaStaticMeta.name || fallbackDgpu) &&
    /nvidia|rtx|gtx/i.test(nvidiaStaticMeta.rawName || latestSysmonState.gpuNameFallback || ''),
  );

  // Zero-dGPU-wakeup guard: probe nvidia-smi once to cache model/VRAM total, then skip
  // spawning nvidia-smi on hybrid laptops whenever PDH shows the dGPU is idle (D3Cold)!
  let nv = null;
  if (!nvidiaStaticMeta.probed) {
    nv = await queryNvidiaSmi({ forceProbe: true });
  } else if (hasHybridGpu && pdhGpu !== null && latestSysmonState.dgpuLikelyActive === false) {
    nv = null;
  } else {
    nv = await queryNvidiaSmi();
  }

  const nvGpu = nv && Number.isFinite(nv.utilPct) ? nv.utilPct : null;
  const nvidiaActive = Boolean(nv && ((nvGpu !== null && nvGpu >= 3) || (Number.isFinite(nv.vramUsedMb) && nv.vramUsedMb > 128)));
  const dgpuName = nv?.name || nvidiaStaticMeta.name || fallbackDgpu;

  // On hybrid laptops (Intel/AMD iGPU + NVIDIA dGPU), report honestly which GPU is currently carrying the load
  let gpuMode = 'dgpu';
  let activeGpuName = dgpuName || igpuName || 'GPU';
  let gpuPct = nvGpu !== null ? nvGpu : pdhGpu;
  if ((hasHybridGpu && !nvidiaActive && pdhGpu !== null) || (nv && !nvidiaActive && pdhGpu !== null)) {
    gpuMode = 'igpu';
    activeGpuName = igpuName || 'Dahili GPU';
    gpuPct = pdhGpu;
  } else if (nvGpu !== null && pdhGpu !== null) {
    gpuPct = Number(Math.max(nvGpu, pdhGpu).toFixed(1));
  }

  const bridgeRssMb = Number((process.memoryUsage().rss / (1024 * 1024)).toFixed(1));
  const dioBridgeMb = Number.isFinite(latestSysmonState.bridgeRamMb) ? latestSysmonState.bridgeRamMb : bridgeRssMb;
  const dioWallpaperMb = Number.isFinite(latestSysmonState.wallpaperRamMb) ? latestSysmonState.wallpaperRamMb : 0;
  const dioTotalRamMb = Number.isFinite(latestSysmonState.dioramaRamMb) && latestSysmonState.dioramaRamMb > 0
    ? latestSysmonState.dioramaRamMb
    : bridgeRssMb;

  return {
    cpu: {
      pct: cpuSample.pct,
      tempC: Number.isFinite(latestSysmonState.cpuTempC) ? latestSysmonState.cpuTempC : null,
      cores: cpuSample.cores,
      name: (latestSysmonState.cpuName || cpuSample.model || 'CPU').replace(/\s+/g, ' ').trim(),
    },
    ram: {
      pct: ramPct,
      usedGb: ramUsedGb,
      totalGb: ramTotalGb,
    },
    gpu: {
      mode: gpuMode,
      pct: gpuPct,
      tempC: nv && Number.isFinite(nv.tempC) ? Number(nv.tempC.toFixed(1)) : null,
      vramUsedMb: nv && Number.isFinite(nv.vramUsedMb) ? Math.round(nv.vramUsedMb) : null,
      vramTotalMb: nv && Number.isFinite(nv.vramTotalMb) ? Math.round(nv.vramTotalMb) : null,
      powerW: nv && Number.isFinite(nv.powerW) ? Number(nv.powerW.toFixed(1)) : null,
      name: activeGpuName,
      dgpuName: dgpuName || '',
      igpuName: igpuName || '',
    },
    diorama: {
      ramMb: dioTotalRamMb,
      wallpaperRamMb: dioWallpaperMb,
      bridgeRamMb: dioBridgeMb,
      cpuPct: Number.isFinite(latestSysmonState.dioramaCpuPct) ? latestSysmonState.dioramaCpuPct : null,
      gpuPct: Number.isFinite(latestSysmonState.dioramaGpuPct) ? latestSysmonState.dioramaGpuPct : null,
      vramMb: Number.isFinite(latestSysmonState.dioramaVramMb) ? latestSysmonState.dioramaVramMb : null,
      wallpaperRunning: Boolean(latestSysmonState.wallpaperRunning),
    },
    helperReady: sysmonHelperReady,
    updatedAt: new Date().toISOString(),
  };
}

function readRequestBody(req, maxBytes = 8192) {
  return new Promise((resolvePromise, rejectPromise) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        req.destroy();
        rejectPromise(new Error('Body too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolvePromise(Buffer.concat(chunks).toString('utf8')));
    req.on('error', rejectPromise);
  });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url || '/', `http://${HOST}:${PORT}`);
  const { pathname } = reqUrl;

  try {
    if (pathname === '/api/desktop/status' && req.method === 'GET') {
      const index = await getDesktopIndex();
      sendJson(res, 200, {
        ok: true,
        bridge: 'diorama-desktop-bridge',
        version: 2,
        wheelHook: nativeHelperReady,
        indexedCount: index.length,
        appCount: index.filter((item) => item.kind === 'app').length,
        user: os.userInfo().username,
      });
      return;
    }

    if (pathname === '/api/desktop/events' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        ...CORS_HEADERS,
      });
      res.write('data: {"type":"connected"}\n\n');
      sseClients.add(res);
      req.on('close', () => sseClients.delete(res));
      return;
    }

    if (pathname === '/api/desktop/icon' && req.method === 'GET') {
      const target = reqUrl.searchParams.get('target') || '';
      const pngBuffer = await extractWindowsIconPng(target);
      if (!pngBuffer) {
        res.writeHead(404, CORS_HEADERS);
        res.end();
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
        ...CORS_HEADERS,
      });
      res.end(pngBuffer);
      return;
    }

    if (pathname === '/api/desktop/search' && req.method === 'GET') {
      const query = reqUrl.searchParams.get('q') || '';
      const category = reqUrl.searchParams.get('category') || 'all';
      const refresh = reqUrl.searchParams.get('refresh') === '1';
      const limit = Math.max(1, Math.min(500, Number(reqUrl.searchParams.get('limit')) || 28));
      if (refresh) await getDesktopIndex(true);
      const data = await searchDesktopItems({ query, category, limit });
      sendJson(res, 200, { status: 'ok', ...data });
      return;
    }

    if (pathname === '/api/desktop/ime' && req.method === 'POST') {
      const rawBody = await readRequestBody(req);
      const body = JSON.parse(rawBody || '{}');
      const focused = Boolean(body.focused);
      if (nativeHelperProc && nativeHelperProc.stdin.writable) {
        try {
          nativeHelperProc.stdin.write(focused ? 'IME|1\n' : 'IME|0\n');
        } catch {}
      }
      sendJson(res, 200, { status: 'ok', focused });
      return;
    }

    if (pathname === '/api/desktop/launch' && req.method === 'POST') {
      const rawBody = await readRequestBody(req);
      const body = JSON.parse(rawBody || '{}');
      const result = await resolveAndLaunchTarget(body.target);
      sendJson(res, 200, { status: 'ok', ...result });
      return;
    }

    if (pathname === '/api/desktop/xiaomi/discover' && req.method === 'GET') {
      const devices = await discoverXiaomiDevicesOnLan(1600);
      sendJson(res, 200, { status: 'ok', devices });
      return;
    }

    if (pathname === '/api/desktop/xiaomi/status' && req.method === 'POST') {
      const rawBody = await readRequestBody(req);
      const body = JSON.parse(rawBody || '{}');
      const telemetry = await queryXiaomiAirPurifier4(body.ip, body.token);
      sendJson(res, 200, { status: 'ok', telemetry });
      return;
    }

    if (pathname === '/api/desktop/xiaomi/control' && req.method === 'POST') {
      const rawBody = await readRequestBody(req);
      const body = JSON.parse(rawBody || '{}');
      const telemetry = await controlXiaomiAirPurifier4(body.ip, body.token, body.action || {});
      sendJson(res, 200, { status: 'ok', telemetry });
      return;
    }

    if (pathname === '/api/desktop/user-state' && req.method === 'GET') {
      const state = await readUserLocalState();
      sendJson(res, 200, { status: 'ok', state });
      return;
    }

    if (pathname === '/api/desktop/user-state' && req.method === 'POST') {
      const rawBody = await readRequestBody(req, 524288);
      const body = JSON.parse(rawBody || '{}');
      const state = await writeUserLocalState(body);
      sendJson(res, 200, { status: 'ok', state });
      return;
    }

    if (pathname === '/api/desktop/media/status' && req.method === 'GET') {
      sendJson(res, 200, { status: 'ok', ready: mediaHelperReady, media: latestMediaState });
      return;
    }

    if (pathname === '/api/desktop/media/thumbnail' && req.method === 'GET') {
      if (!latestMediaThumbBuffer) {
        res.writeHead(404, CORS_HEADERS);
        res.end();
        return;
      }
      res.writeHead(200, {
        'Content-Type': latestMediaThumbMime,
        'Cache-Control': 'no-store',
        ...CORS_HEADERS,
      });
      res.end(latestMediaThumbBuffer);
      return;
    }

    if (pathname === '/api/desktop/media/control' && req.method === 'POST') {
      const rawBody = await readRequestBody(req);
      const body = JSON.parse(rawBody || '{}');
      const result = sendMediaControlCommand(body.action);
      sendJson(res, 200, { status: 'ok', ...result });
      return;
    }

    if (pathname === '/api/desktop/sports/teams' && req.method === 'GET') {
      const league = reqUrl.searchParams.get('league') || 'tur.1';
      const lang = reqUrl.searchParams.get('lang') === 'en' ? 'en' : 'tr';
      const teams = await fetchLeagueTeams(league, lang);
      sendJson(res, 200, { status: 'ok', league, teams });
      return;
    }

    if (pathname === '/api/desktop/sports/fixtures' && req.method === 'GET') {
      const clubsParam = reqUrl.searchParams.get('clubs') || '';
      const clubIds = clubsParam ? clubsParam.split(',').filter(Boolean).slice(0, 3) : [];
      const nationalId = reqUrl.searchParams.get('nationalId') ?? '';
      const team = reqUrl.searchParams.get('team') || 'none';
      const includeNational = reqUrl.searchParams.get('national') !== '0';
      const tz = reqUrl.searchParams.get('tz') || 'Europe/Istanbul';
      const lang = reqUrl.searchParams.get('lang') === 'en' ? 'en' : 'tr';
      const forceRefresh = reqUrl.searchParams.get('refresh') === '1';
      const data = await fetchSportsFixtures({ clubIds, nationalId, team, includeNational, tz, lang, forceRefresh });
      sendJson(res, 200, { status: 'ok', ...data });
      return;
    }

    if (pathname === '/api/desktop/news-en' && req.method === 'GET') {
      const cat = reqUrl.searchParams.get('cat') || 'gundem';
      const forceRefresh = reqUrl.searchParams.get('refresh') === '1';
      const data = await fetchEnglishNews(cat, forceRefresh);
      sendJson(res, 200, data);
      return;
    }

    if (pathname === '/api/desktop/system/stats' && req.method === 'GET') {
      const stats = await getSystemMonitorSnapshot();
      sendJson(res, 200, { status: 'ok', ...stats });
      return;
    }

    if (pathname === '/api/desktop/shutdown' && req.method === 'POST') {
      sendJson(res, 200, { status: 'ok', shuttingDown: true });
      if (nativeHelperProc) {
        try { nativeHelperProc.kill(); } catch {}
      }
      if (mediaHelperProc) {
        try { mediaHelperProc.kill(); } catch {}
      }
      if (sysmonHelperProc) {
        try { sysmonHelperProc.kill(); } catch {}
      }
      setTimeout(() => process.exit(0), 100);
      return;
    }

    if (pathname === '/api/news' && req.method === 'GET') {
      const webReq = new Request(reqUrl.href, { method: 'GET' });
      const webRes = await handleNews(webReq);
      const text = await webRes.text();
      res.writeHead(webRes.status, {
        'Content-Type': 'application/json; charset=utf-8',
        ...CORS_HEADERS,
      });
      res.end(text);
      return;
    }

    if (pathname === '/api/custom-news' && req.method === 'POST') {
      const rawBody = await readRequestBody(req);
      const webReq = new Request(reqUrl.href, {
        method: 'POST',
        headers: {
          'content-type': req.headers['content-type'] || 'application/json',
          origin: reqUrl.origin,
        },
        body: rawBody,
      });
      const webRes = await handleCustomNews(webReq);
      const text = await webRes.text();
      res.writeHead(webRes.status, {
        'Content-Type': 'application/json; charset=utf-8',
        ...CORS_HEADERS,
      });
      res.end(text);
      return;
    }

    const cleanRel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const candidatePath = resolve(wallpaperDist, cleanRel);
    if (candidatePath.startsWith(wallpaperDist) && existsSync(candidatePath)) {
      const fileStat = await stat(candidatePath);
      if (fileStat.isFile()) {
        const content = await readFile(candidatePath);
        const ext = extname(candidatePath).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
          'Cache-Control': 'no-cache',
          ...CORS_HEADERS,
        });
        res.end(content);
        return;
      }
    }

    sendJson(res, 404, { status: 'error', message: 'Uç nokta bulunamadı.' });
  } catch (error) {
    sendJson(res, 500, {
      status: 'error',
      message: String(error?.message || 'Masaüstü köprü hatası.').slice(0, 200),
    });
  }
});

export { SYSTEM_ITEMS, getDesktopIndex, searchDesktopItems, parseXiaomiMiotTelemetry, parseEspnScheduleEvents, parseNvidiaSmiCsv };

const isMainModule = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMainModule) {
  let retried = false;
  server.on('error', async (err) => {
    if (err && err.code === 'EADDRINUSE' && !retried) {
      retried = true;
      console.log(`[Diorama Desktop Bridge] Eski köprü servisi güncelleniyor (Port ${PORT})...`);
      try {
        await fetch(`http://${HOST}:${PORT}/api/desktop/shutdown`, { method: 'POST' });
      } catch {
        // If old process does not have /shutdown endpoint, kill via netstat PID
        spawn('powershell.exe', [
          '-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command',
          `Get-NetTCPConnection -LocalPort ${PORT} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }`,
        ], { windowsHide: true });
      }
      setTimeout(() => server.listen(PORT, HOST), 900);
      return;
    }
    console.error('[Diorama Desktop Bridge] Sunucu hatası:', err);
  });

  server.listen(PORT, HOST, async () => {
    sampleOsCpuPercent();
    startNativeHelper();
    startMediaHelper();
    const index = await getDesktopIndex();
    console.log(`[Diorama Desktop Bridge v4] http://${HOST}:${PORT} üzerinde çalışıyor (${index.length} uygulama/dosya indekslendi, sistem monitörü talep üzerine, spor fikstürü, medya/plak ve fare tekerleği aktif).`);
  });
}
