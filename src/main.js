const { app, BrowserWindow, BrowserView, ipcMain, Notification, session } = require('electron');
const path = require('path');

// ── Accounts ─────────────────────────────────────────────────
const ACCOUNTS = [
  { id: 'memesofmars',  label: '🌍 MemesOfMars',   url: 'https://x.com/MemesOfMars',   color: '#e74c3c' },
  { id: 'skyai',        label: '🤖 SkyAI_Vision',   url: 'https://x.com/SkyAI_Vision',  color: '#3498db' },
  { id: 'amelie',       label: '🎨 Amélie',          url: 'https://x.com/amelieartsmode', color: '#9b59b6' },
];

// ── Watched accounts (watcher feed) ─────────────────────────
const WATCHED = ['karpathy', 'steipete', 'morgoth_raven'];

let mainWindow;
let xViews = {};
let activeAccount = ACCOUNTS[0].id;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'ui.html'));

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('accounts', ACCOUNTS);
    mainWindow.webContents.send('watched', WATCHED);
    createXViews();
    showAccount(ACCOUNTS[0].id);
  });
}

function createXViews() {
  const [, , w, h] = getViewBounds();
  ACCOUNTS.forEach(acc => {
    const partition = `persist:${acc.id}`;
    const view = new BrowserView({
      webPreferences: {
        partition,
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    view.setBounds({ x: 220, y: 0, width: w, height: h });
    view.webContents.loadURL(acc.url);
    xViews[acc.id] = view;
  });
}

function getViewBounds() {
  const [w, h] = mainWindow.getContentSize();
  return [0, 0, w - 220, h];
}

function showAccount(id) {
  if (xViews[activeAccount]) mainWindow.removeBrowserView(xViews[activeAccount]);
  activeAccount = id;
  if (xViews[id]) {
    mainWindow.addBrowserView(xViews[id]);
    const [, , w, h] = getViewBounds();
    xViews[id].setBounds({ x: 220, y: 0, width: w, height: h });
  }
  mainWindow.webContents.send('active-account', id);
}

// ── Resize handling ──────────────────────────────────────────
ipcMain.on('switch-account', (_, id) => showAccount(id));
ipcMain.on('open-url', (_, url) => { if (xViews[activeAccount]) xViews[activeAccount].webContents.loadURL(url); });

ipcMain.handle('import-session', async (_, { accountId, auth_token, ct0 }) => {
  const id   = accountId || activeAccount;
  const view = xViews[id];
  if (!view) return { error: 'No active view' };
  try {
    const domains = ['.x.com', '.twitter.com'];
    for (const domain of domains) {
      await view.webContents.session.cookies.set({ url: 'https://x.com', domain, name: 'auth_token', value: auth_token, httpOnly: true, secure: true });
      await view.webContents.session.cookies.set({ url: 'https://x.com', domain, name: 'ct0',        value: ct0,        httpOnly: false, secure: true });
    }
    view.webContents.loadURL('https://x.com/home');
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.handle('export-session', async (_, accountId) => {
  const id   = accountId || activeAccount;
  const view = xViews[id];
  if (!view) return { error: 'No active view' };
  try {
    // Use Electron session API to get HttpOnly cookies too
    const allCookies = await view.webContents.session.cookies.get({ domain: '.twitter.com' });
    const xCookies   = await view.webContents.session.cookies.get({ domain: '.x.com' });
    const all = [...allCookies, ...xCookies];
    const get = name => all.find(c => c.name === name)?.value;
    const auth_token = get('auth_token');
    const ct0        = get('ct0');
    if (!auth_token) return { error: 'Not logged in — no auth_token found' };
    return { auth_token, ct0, account: id };
  } catch (e) {
    return { error: e.message };
  }
});

mainWindow?.on('resize', () => {
  if (xViews[activeAccount]) {
    const [, , w, h] = getViewBounds();
    xViews[activeAccount].setBounds({ x: 220, y: 0, width: w, height: h });
  }
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
