const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PROFILE = path.join(process.env.TEMP || '.', 'opencode', 'chrome-burger-shot');
const PORT = 9343;
const URL = 'file:///C:/Users/uzunv/OneDrive/Desktop/Test/pizza-clicker/index.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitPort() {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch('http://127.0.0.1:' + PORT + '/json/list');
      if (r.ok) return await r.json();
    } catch (e) { /* retry */ }
    await sleep(150);
  }
  throw new Error('CDP port not ready');
}

(async () => {
  try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  const child = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--remote-debugging-port=' + PORT, '--user-data-dir=' + PROFILE,
    '--window-size=1280,800', 'about:blank'
  ], { stdio: 'ignore' });

  try {
    const pages = await waitPort();
    const page = pages.find((p) => p.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    const pending = new Map();
    const errors = [];
    let nextId = 1;
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.text);
      if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') errors.push(msg.params.entry.text);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve);
      ws.addEventListener('error', reject);
    });
    const send = (method, params) => new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params: params || {} }));
    });
    const evalJs = async (expression) => {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true });
      return r.result.value;
    };
    const shoot = async (file) => {
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Log.enable');
    await send('Page.navigate', { url: URL });
    await sleep(2200);

    await evalJs("document.getElementById('skinsBtn').click()");
    await sleep(400);
    await evalJs("document.querySelector('.skin-card[data-id=\"burger\"]').click()");
    await sleep(400);
    await shoot('C:/Users/uzunv/OneDrive/Desktop/Test/pizza-clicker/_burger-modal.png');

    await evalJs("document.getElementById('skinApply').click()");
    await sleep(400);
    await evalJs("document.getElementById('skinClose').click()");
    await sleep(700);
    await shoot('C:/Users/uzunv/OneDrive/Desktop/Test/pizza-clicker/_burger-game.png');

    const info = await evalJs(`(() => ({
      cards: document.querySelectorAll('.skin-card').length,
      name: document.getElementById('skinName').textContent,
      badge: document.getElementById('skinBadge').textContent,
      saved: JSON.parse(localStorage.getItem('pizzaClickerSaveV2') || '{}').skin,
      toast: document.getElementById('toast').textContent
    }))()`);
    console.log(JSON.stringify({ info, errors }));
    ws.close();
  } finally {
    child.kill();
  }
})().catch((err) => { console.error(String(err)); process.exit(1); });
