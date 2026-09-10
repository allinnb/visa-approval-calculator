/**
 * ORIGIN 官网留资 / 转化事件服务（迭代 08.6）
 * 监听 127.0.0.1:3100，由 nginx 反代：
 *   POST /api/tool-lead   -> /lead     留资（含线索编号）
 *   POST /api/tool-event  -> /event    匿名转化事件（严格不含身份与答案）
 *   GET  /api/lead-stats  -> /stats    只读聚合统计（需 STATS_TOKEN，不含 PII）
 *   GET  /api/health      -> /health
 * 存储：/www/backup/origin-leads/{leads,events}.ndjson（webroot 之外，0700/0600）
 * 通知：环境变量 WECOM_WEBHOOK（企微群机器人）配置后即时推送；未配置也能落盘，不报错。
 *
 * 合规红线（不要在后续迭代里放宽）：
 *   1. 匿名事件接口只接受白名单字段，代码层面根本不读取 name/contact/answers，
 *      即使前端误传也不会落盘 —— 页面承诺「问卷答案不上传」靠这里兜底。
 *   2. 原始分数不落盘，只落分数档（bandOf），进一步降低可识别性。
 *   3. /stats 只返回聚合数据，绝不返回姓名与联系方式原文。
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3100;
const HOST = '127.0.0.1';
const STORE_DIR = process.env.STORE_DIR || '/www/backup/origin-leads';
const LEAD_FILE = path.join(STORE_DIR, 'leads.ndjson');
const EVENT_FILE = path.join(STORE_DIR, 'events.ndjson');
const WECOM_WEBHOOK = process.env.WECOM_WEBHOOK || '';
const STATS_TOKEN = process.env.STATS_TOKEN || '';
// 企业微信自建应用（08.8）：与群机器人二选一或并存，哪个配了走哪个
const WECOM_APP_CORP_ID = process.env.WECOM_APP_CORP_ID || '';
const WECOM_APP_SECRET = process.env.WECOM_APP_SECRET || '';
const WECOM_APP_AGENT_ID = process.env.WECOM_APP_AGENT_ID || '';
const WECOM_APP_TOUSER = process.env.WECOM_APP_TOUSER || '@all';

const LEAD_LIMIT = 20;          // 每 IP 每 10 分钟
const EVENT_LIMIT = 90;         // 每 IP 每 10 分钟
const RATE_WINDOW = 600 * 1000;
const MAX_BODY = 4096;
const ALLOW_ORIGIN = 'https://originintl.cn';

if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true, mode: 0o700 });

const hits = new Map();          // ip -> number[]
const PHONE = /^1[3-9]\d{9}$/;
const WECHAT = /^[A-Za-z][-_A-Za-z0-9]{5,19}$/;
const LEAD_ID_RE = /^OR-\d{4}-[A-Z2-9]{4}$/;

/* ================= 工具 ================= */

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': ALLOW_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  });
  res.end(body);
}

function limited(bucket, ip, max) {
  const key = bucket + '|' + ip;
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < RATE_WINDOW);
  if (arr.length >= max) { hits.set(key, arr); return true; }
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return false;
}

function str(v, max) { return typeof v === 'string' ? v.trim().slice(0, max) : ''; }
function readBody(req, cb) {
  let raw = '';
  let tooBig = false;
  req.on('data', (c) => { raw += c; if (raw.length > MAX_BODY) { tooBig = true; req.destroy(); } });
  req.on('end', () => { if (tooBig) return cb(new Error('too big')); cb(null, raw); });
}

// 编号字母表去掉易混字符 0/O/1/I
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
function newLeadId(d) {
  const mmdd = String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  const b = crypto.randomBytes(4);
  let s = '';
  for (let i = 0; i < 4; i++) s += ALPHABET[b[i] % ALPHABET.length];
  return 'OR-' + mmdd + '-' + s;
}

// 原始分 -> 分数档；原始分不落盘
function bandOf(score) {
  if (typeof score !== 'number' || !Number.isFinite(score) || score < 0) return '';
  if (score >= 90) return '90-100';
  if (score >= 80) return '80-89';
  if (score >= 70) return '70-79';
  if (score >= 60) return '60-69';
  if (score >= 40) return '40-59';
  return '0-39';
}

function countLines(file) {
  try { return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).length; } catch (e) { return 0; }
}

function readLines(file, limit) {
  try {
    const all = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
    return limit ? all.slice(-limit) : all;
  } catch (e) { return []; }
}

/* ================= 企业微信推送（无版本依赖，用 https 模块） ================= */

function postJson(url, payload, timeoutMs) {
  return new Promise((resolve) => {
    let u;
    try { u = new URL(url); } catch (e) { return resolve({ ok: false, msg: 'bad url' }); }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return resolve({ ok: false, msg: 'bad protocol' });
    const lib = u.protocol === 'http:' ? http : https;
    const body = Buffer.from(JSON.stringify(payload));
    const req = lib.request({
      hostname: u.hostname,
      port: u.port || (u.protocol === 'http:' ? 80 : 443),
      path: u.pathname + u.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': body.length },
      timeout: timeoutMs || 5000,
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) return resolve({ ok: true, body: data.slice(0, 200) });
        resolve({ ok: false, msg: 'http ' + res.statusCode });
      });
    });
    req.on('error', (e) => resolve({ ok: false, msg: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, msg: 'timeout' }); });
    req.write(body);
    req.end();
  });
}

/* ---------- 企业微信自建应用：先取 access_token（带缓存），再发 markdown 消息 ---------- */
let __token = { v: '', exp: 0 };
function getAccessToken() {
  return new Promise((resolve) => {
    const now = Date.now();
    if (__token.v && __token.exp > now + 60000) return resolve(__token.v);
    const url = 'https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=' +
      encodeURIComponent(WECOM_APP_CORP_ID) + '&corpsecret=' + encodeURIComponent(WECOM_APP_SECRET);
    const req = https.get(url, { timeout: 6000 }, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          if (j.errcode === 0 && j.access_token) {
            __token = { v: j.access_token, exp: now + (j.expires_in || 7200) * 1000 };
            return resolve(j.access_token);
          }
          console.error('[wecom-app] gettoken failed:', d.slice(0, 160));
          resolve('');
        } catch (e) { resolve(''); }
      });
    });
    req.on('error', (e) => { console.error('[wecom-app] gettoken err:', e.message); resolve(''); });
    req.on('timeout', () => { req.destroy(); resolve(''); });
  });
}

async function pushWecomApp(markdown) {
  const token = await getAccessToken();
  if (!token) return { ok: false, msg: 'no access_token' };
  const r = await postJson('https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=' + token, {
    touser: WECOM_APP_TOUSER,
    msgtype: 'markdown',
    agentid: Number(WECOM_APP_AGENT_ID) || WECOM_APP_AGENT_ID,
    markdown: { content: markdown },
    safe: 0,
  });
  if (r.ok && r.body) {
    try {
      const j = JSON.parse(r.body);
      if (j.errcode && j.errcode !== 0) {
        return { ok: false, msg: 'errcode ' + j.errcode + ' ' + (j.errmsg || '') };
      }
    } catch (e) { /* body 不是完整 JSON，忽略 */ }
  }
  return r;
}

/**
 * 统一推送出口：群机器人 + 自建应用，配了哪个走哪个（可同时）。
 * markdown 语法两边都支持 ** 加粗与 > 引用。
 */
async function pushWecom(markdown) {
  const results = [];
  if (WECOM_WEBHOOK) {
    const r = await postJson(WECOM_WEBHOOK, { msgtype: 'markdown', markdown: { content: markdown } });
    if (!r.ok) console.error('[wecom-webhook] push failed:', r.msg);
    results.push(r);
  }
  if (WECOM_APP_SECRET && WECOM_APP_AGENT_ID) {
    const r = await pushWecomApp(markdown);
    if (!r.ok) console.error('[wecom-app] push failed:', r.msg);
    results.push(r);
  }
  if (!results.length) return { ok: false, msg: 'no channel configured' };
  return results[0];
}

function nowText(d) {
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

function maskContact(v, isPhone) {
  if (isPhone) return v.slice(0, 3) + '****' + v.slice(-4);
  return v.slice(0, 2) + '***' + v.slice(-2);
}

/* ================= 主服务 ================= */

const server = http.createServer((req, res) => {
  const ip = (req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    .toString().split(',')[0].trim();

  if (req.method === 'OPTIONS') return json(res, 204, { ok: true });

  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, {
      ok: true, store: LEAD_FILE, eventStore: EVENT_FILE,
      wecom: !!WECOM_WEBHOOK, wecomApp: !!(WECOM_APP_SECRET && WECOM_APP_AGENT_ID),
      statsToken: !!STATS_TOKEN,
      leads: countLines(LEAD_FILE), events: countLines(EVENT_FILE),
    });
  }

  if (req.method === 'GET' && req.url === '/count') {
    return json(res, 200, { ok: true, count: countLines(LEAD_FILE), events: countLines(EVENT_FILE) });
  }

  /* ---------- 只读聚合统计（不含 PII） ---------- */
  if (req.method === 'GET' && req.url.indexOf('/stats') === 0) {
    if (!STATS_TOKEN) return json(res, 503, { ok: false, msg: 'stats disabled' });
    const q = req.url.indexOf('?') >= 0 ? req.url.slice(req.url.indexOf('?') + 1) : '';
    const token = new URLSearchParams(q).get('token') || '';
    if (token !== STATS_TOKEN) return json(res, 403, { ok: false, msg: 'forbidden' });

    const todayKey = new Date().toISOString().slice(0, 10);
    const agg = (rows) => {
      const out = { result: 0, intent: 0, abandon: 0, leads: 0 };
      rows.forEach((r) => {
        if (r._lead) { out.leads++; return; }
        if (out[r.kind] !== undefined) out[r.kind]++;
      });
      return out;
    };
    const byEntry = {};
    const byRegion = {};
    const evRows = readLines(EVENT_FILE).map((l) => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean);
    const leadRows = readLines(LEAD_FILE).map((l) => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean);
    const merge = evRows.concat(leadRows.map((r) => Object.assign({}, r, { _lead: true })));
    const today = merge.filter((r) => String(r.ts || '').slice(0, 10) === todayKey);

    merge.forEach((r) => {
      const e = r.entry || (r._lead ? 'unknown' : 'unknown');
      byEntry[e] = byEntry[e] || { result: 0, intent: 0, abandon: 0, leads: 0 };
      if (r._lead) byEntry[e].leads++;
      else if (byEntry[e][r.kind] !== undefined) byEntry[e][r.kind]++;
      const rg = r.region || 'unknown';
      byRegion[rg] = byRegion[rg] || { result: 0, leads: 0 };
      if (r._lead) byRegion[rg].leads++; else byRegion[rg].result++;
    });

    const withRate = (o) => Object.assign({}, o, {
      convRate: o.result ? Math.round((o.leads / o.result) * 1000) / 10 : null,
    });
    return json(res, 200, {
      ok: true,
      today: withRate(agg(today)),
      total: withRate(agg(merge)),
      byEntry: byEntry,
      byRegion: byRegion,
      recentLeads: leadRows.slice(-20).reverse().map((r) => ({
        leadId: r.leadId, ts: r.ts, region: r.region, visaType: r.visaType,
        scoreBand: r.scoreBand, contactType: r.contactType, entry: r.entry,
      })),
    });
  }

  /* ---------- 匿名转化事件 ---------- */
  if (req.method === 'POST' && (req.url === '/event' || req.url === '/api/tool-event')) {
    if (limited('ev', ip, EVENT_LIMIT)) return json(res, 429, { ok: false, msg: 'too many requests' });
    return readBody(req, (err, raw) => {
      if (err) return json(res, 413, { ok: false, msg: 'payload too large' });
      let d;
      try { d = JSON.parse(raw); } catch (e) { return json(res, 400, { ok: false, msg: 'bad json' }); }

      const KINDS = ['result', 'intent', 'abandon'];
      const kind = KINDS.indexOf(str(d.kind, 10)) >= 0 ? str(d.kind, 10) : '';
      if (!kind) return json(res, 400, { ok: false, msg: 'invalid kind' });

      // ↓↓↓ 白名单：只读这些字段。name / contact / answers 在这里根本不会被读取。
      const leadId = LEAD_ID_RE.test(str(d.leadId, 24)) ? str(d.leadId, 24) : '';
      const rec = {
        ts: new Date().toISOString(),
        kind: kind,
        region: str(d.region, 20),
        visaType: str(d.visaType, 20),
        scoreBand: bandOf(d.score),          // 原始分不落盘
        grade: str(d.grade, 10),
        step: Number.isInteger(d.step) && d.step >= 0 && d.step < 20 ? d.step : -1,
        stepTotal: Number.isInteger(d.stepTotal) && d.stepTotal > 0 && d.stepTotal < 20 ? d.stepTotal : -1,
        weakDims: str(d.weakDims, 60),
        entry: str(d.entry, 20),
        utm: str(d.utm, 80),
        leadId: leadId,
        ip: ip,
      };

      try {
        fs.appendFileSync(EVENT_FILE, JSON.stringify(rec) + '\n', { mode: 0o600 });
      } catch (e) {
        console.error('[store] event write failed:', e.message);
        return json(res, 500, { ok: false, msg: 'store failed' });
      }

      // 只有「高意向但没留资」才推送，避免刷屏
      if (kind === 'intent') {
        const band = rec.scoreBand ? '｜' + rec.scoreBand + ' 分档' : '';
        const weak = rec.weakDims ? '\n> 短板：' + rec.weakDims : '';
        pushWecom(
          '**👀 高意向未留资** ' + (rec.leadId || '(无编号)') + '\n' +
          '> ' + (rec.region || '未知') + ' · ' + (rec.visaType || '未知') + band + weak + '\n' +
          '> 来源：' + (rec.entry || 'direct') + (rec.utm ? ' / ' + rec.utm : '') + '\n' +
          '> 已复制评估摘要或点开二维码，可能稍后加企微\n' +
          '> ' + nowText(new Date())
        );
      }
      return json(res, 200, { ok: true });
    });
  }

  /* ---------- 留资 ---------- */
  if (req.method !== 'POST' || (req.url !== '/lead' && req.url !== '/' && req.url !== '/api/tool-lead')) {
    return json(res, 404, { ok: false, msg: 'not found' });
  }
  if (limited('lead', ip, LEAD_LIMIT)) return json(res, 429, { ok: false, msg: 'too many requests' });

  readBody(req, (err, raw) => {
    if (err) return json(res, 413, { ok: false, msg: 'payload too large' });
    let d;
    try { d = JSON.parse(raw); } catch (e) { return json(res, 400, { ok: false, msg: 'bad json' }); }

    // 合规红线：必须显式同意
    if (d.consent !== true) return json(res, 400, { ok: false, msg: 'consent required' });

    const name = str(d.name, 20);
    const contact = str(d.contact, 30);
    const destination = str(d.destination, 60);
    const travelTime = str(d.travelTime, 30);

    if (!name) return json(res, 400, { ok: false, msg: 'invalid name' });
    const isPhone = PHONE.test(contact);
    const isWechat = WECHAT.test(contact);
    if (!isPhone && !isWechat) return json(res, 400, { ok: false, msg: 'invalid contact' });
    if (!destination) return json(res, 400, { ok: false, msg: 'invalid destination' });
    if (!travelTime) return json(res, 400, { ok: false, msg: 'invalid travel time' });

    const now = new Date();
    // 前端本地生成的编号优先采用（用户已在结果页看到它，必须一致）；格式非法则服务端补发
    const incomingId = str(d.leadId, 24);
    const leadId = LEAD_ID_RE.test(incomingId) ? incomingId : newLeadId(now);

    const rec = {
      ts: now.toISOString(),
      leadId: leadId,
      name,
      contact,
      contactType: isPhone ? 'phone' : 'wechat',
      destination,
      travelTime,
      region: str(d.region, 20),
      visaType: str(d.visaType, 20),
      scoreBand: bandOf(typeof d.score === 'number' ? d.score : -1),
      grade: str(d.grade, 10),
      weakDims: str(d.weakDims, 60),
      source: str(d.source, 40) || 'approval_tool',
      entry: str(d.entry, 20),
      utm: str(d.utm, 80),
      consentVersion: str(d.consentVersion, 40),
      consentedAt: now.toISOString(),
      ua: String(req.headers['user-agent'] || '').slice(0, 180),
      ip,
    };

    try {
      fs.appendFileSync(LEAD_FILE, JSON.stringify(rec) + '\n', { mode: 0o600 });
    } catch (e) {
      console.error('[store] write failed:', e.message);
      return json(res, 500, { ok: false, msg: 'store failed' });
    }

    pushWecom(
      '**🔔 官网留资** ' + leadId + '\n' +
      '> 姓名：' + name + '\n' +
      '> 联系：' + contact + '（' + (isPhone ? '手机' : '微信') + '）\n' +
      '> 目的：' + destination + '\n' +
      '> 出行：' + travelTime + '\n' +
      '> 自测：' + (rec.scoreBand || '未测') + (rec.grade ? '（' + rec.grade + '）' : '') + '\n' +
      (rec.weakDims ? '> 短板：' + rec.weakDims + '\n' : '') +
      '> 来源：' + (rec.entry || 'direct') + ' / ' + rec.source + '\n' +
      '> ' + nowText(now)
    );

    return json(res, 200, { ok: true, msg: 'received', leadId: leadId });
  });
});

server.listen(PORT, HOST, () => {
  console.log('origin-lead service on ' + HOST + ':' + PORT +
    ' | leads=' + LEAD_FILE + ' | events=' + EVENT_FILE +
    ' | wecom=' + !!WECOM_WEBHOOK + ' | stats=' + !!STATS_TOKEN);
});
