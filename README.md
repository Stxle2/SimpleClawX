# 🦞 SimpleClawX

**Multi-account X (Twitter) wrapper for Mac with built-in OpenClaw agent watcher feed**

---

## What it does

- Switch between multiple X accounts in one app — each account has its own isolated session (no cookie conflicts)
- Built-in watcher sidebar — see latest tweets from accounts you track (@karpathy, @steipete, etc.)
- Click any watched tweet to load it in the main view
- Clean dark UI, Mac-native feel (hidden title bar, traffic lights)

---

## Install

```bash
git clone https://github.com/Stxle2/simpleclawx
cd simpleclawx
npm install
npm start
```

### Build .app for Mac

```bash
npm run build
# Output: dist/SimpleClawX-*.dmg
```

---

## Configure accounts

Edit `src/main.js` — update the `ACCOUNTS` array:

```js
const ACCOUNTS = [
  { id: 'myaccount',  label: '🌍 MyAccount',  url: 'https://x.com/MyAccount',  color: '#e74c3c' },
  { id: 'mybot',      label: '🤖 MyBot',       url: 'https://x.com/MyBot',      color: '#3498db' },
];
```

## Configure watcher feed

Edit the `WATCHED` array in `src/main.js`:

```js
const WATCHED = ['karpathy', 'steipete', 'morgoth_raven'];
```

Requires X API bearer token in `src/ui.html` (free tier works).

---

## Requirements

- Node.js 18+
- Mac (Windows/Linux untested)
- X API bearer token (free — [developer.twitter.com](https://developer.twitter.com))

---

MIT License — Part of the [SimpleClaw](https://github.com/Stxle2/simpleclaw) ecosystem
