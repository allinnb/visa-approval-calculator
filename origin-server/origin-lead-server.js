/**
 * ORIGIN 官网留资接收服务（迭代 08.5）
 * 监听 127.0.0.1:3100，由 nginx 反代 /api/tool-lead（originintl.cn）。
 * 存储：/www/backup/origin-leads/leads.ndjson（webroot 之外，公网不可读）
 * 通知：设置环境变量 WECOM_WEBHOOK 后同步推送企业微信群机器人；未配置也能落盘，不报错。
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3100;
const HOST = '127.0.0.1';
const STORE_DIR = process.env.STORE_DIR || '/www/backup/origin-leads';
const STORE_FILE = path.join(STORE_DIR, 'leads.ndjson');
const WECOM_WEBHOOK = process.env.WECOM_WEBHOOK || '';
const RATE_LIMIT = 20;          // 每 IP 每 10 分钟
const RATE_WINDOW = 600 * 1000;
const MAX_BODY = 4096;

if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true, mode: 0o700 });

const hits = new Map();          // ip -> number[]
const PHONE = /^1[3-9]\d{9}$/;
const WECHAT = /^[A-Za-z][-_A-Za-z0-9]{5,19}$/;

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    // 仅允许官网自身跨域调用
    'Access-Control-Allow-Origin': 'https://originintl.cn',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  res.end(body);
}

function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW);
  if (arr.length >= RATE_LIMIT) { hits.set(ip, arr); return true; }
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return false;
}

async function notifyWecom(rec) {
  if (!WECOM_WEBHOOK) return;
  const content = `【官网留资】${rec.name}（${rec.contact}）\n目的：${rec.destination}\n出行：${rec.travelTime}\n自测：${rec.score} 分 / ${rec.grade}\n时间：${rec.ts}`;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 5000);
    await fetch(WECOM_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msgtype: 'text', text: { content } }),
      signal: ctl.signal,
    });
    clearTimeout(t);
  } catch (e) {
    console.error('[wecom] notify failed:', e.message);
  }
}

const server = http.createServer((req, res) => {
  const ip = (req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    .toString().split(',')[0].trim();

  if (req.method === 'OPTIONS') return json(res, 204, { ok: true });

  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, { ok: true, store: STORE_FILE, wecom: !!WECOM_WEBHOOK });
  }

  if (req.method === 'GET' && req.url === '/count') {
    let n = 0;
    try { n = fs.readFileSync(STORE_FILE, 'utf8').split('\n').filter(Boolean).length; } catch (e) {}
    return json(res, 200, { ok: true, count: n });
  }

  if (req.method !== 'POST' || (req.url !== '/lead' && req.url !== '/')) {
    return json(res, 404, { ok: false, msg: 'not found' });
  }

  if (rateLimited(ip)) return json(res, 429, { ok: false, msg: 'too many requests' });

  let raw = '';
  let tooBig = false;
  req.on('data', (c) => {
    raw += c;
    if (raw.length > MAX_BODY) { tooBig = true; req.destroy(); }
  });
  req.on('end', () => {
    if (tooBig) return json(res, 413, { ok: false, msg: 'payload too large' });
    let d;
    try { d = JSON.parse(raw); } catch (e) { return json(res, 400, { ok: false, msg: 'bad json' }); }

    // 合规红线：必须显式同意
    if (d.consent !== true) return json(res, 400, { ok: false, msg: 'consent required' });

    const name = String(d.name || '').trim();
    const contact = String(d.contact || '').trim();
    const destination = String(d.destination || '').trim();
    const travelTime = String(d.travelTime || '').trim();

    if (!name || name.length > 20) return json(res, 400, { ok: false, msg: 'invalid name' });
    const isPhone = PHONE.test(contact);
    const isWechat = WECHAT.test(contact);
    if (!isPhone && !isWechat) return json(res, 400, { ok: false, msg: 'invalid contact' });
    if (!destination || destination.length > 60) return json(res, 400, { ok: false, msg: 'invalid destination' });
    if (!travelTime || travelTime.length > 30) return json(res, 400, { ok: false, msg: 'invalid travel time' });

    const now = new Date();
    const rec = {
      ts: now.toISOString(),
      name,
      contact,
      contactType: isPhone ? 'phone' : 'wechat',
      destination,
      travelTime,
      region: String(d.region || '').slice(0, 20),
      visaType: String(d.visaType || '').slice(0, 20),
      score: Number.isFinite(d.score) ? d.score : -1,
      grade: String(d.grade || '').slice(0, 10),
      source: String(d.source || 'approval_tool').slice(0, 40),
      consentVersion: String(d.consentVersion || '').slice(0, 40),
      consentedAt: now.toISOString(),
      ua: String(req.headers['user-agent'] || '').slice(0, 180),
      ip,
    };

    try {
      fs.appendFileSync(STORE_FILE, JSON.stringify(rec) + '\n', { mode: 0o600 });
    } catch (e) {
      console.error('[store] write failed:', e.message);
      return json(res, 500, { ok: false, msg: 'store failed' });
    }
    notifyWecom(rec);
    return json(res, 200, { ok: true, msg: 'received' });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`origin-lead service listening on ${HOST}:${PORT}, store=${STORE_FILE}, wecom=${!!WECOM_WEBHOOK}`);
});
