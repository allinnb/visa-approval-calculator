<?php
/**
 * ORIGIN 出签率自测 · 低敏留资接收端点（迭代 08.5）
 * 路径: /api/tool-lead.php   (同源, 无需 CORS)
 * 存储: /www/wwwroot/originintl.cn/api/store/leads.log
 *       - 放 webroot 内是因 .user.ini open_basedir 限制；
 *       - nginx 敏感文件规则对 *.log 直接返回 404，公网不可读（已有 vhost 规则，勿删）。
 * 通知: 配置 WECOM_WEBHOOK 后可同步推送企业微信群机器人；未配置时仅落盘, 不报错。
 * 方法: POST application/json
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// 可选：在此粘贴企业微信群机器人 Webhook，实现实时通知
const WECOM_WEBHOOK = '';

const STORE_DIR = '/www/wwwroot/originintl.cn/api/store';
const STORE_FILE = STORE_DIR . '/leads.log';
const RATE_DIR = STORE_DIR . '/rate';
const RATE_LIMIT = 20;   // 每 IP 每 10 分钟
const RATE_WINDOW = 600;

function out($ok, $msg, $code = 200) {
    http_response_code($code);
    echo json_encode(array('ok' => $ok, 'msg' => $msg), JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    out(false, 'method not allowed', 405);
}

$raw = file_get_contents('php://input');
if (strlen($raw) > 4096) out(false, 'payload too large', 413);
$d = json_decode($raw, true);
if (!is_array($d)) out(false, 'bad json', 400);

// ---- 合规：必须显式同意，后端强制 ----
if (empty($d['consent'])) out(false, 'consent required', 400);

// ---- 字段校验 ----
$name = trim((string)($d['name'] ?? ''));
$contact = trim((string)($d['contact'] ?? ''));
$dest = trim((string)($d['destination'] ?? ''));
$time = trim((string)($d['travelTime'] ?? ''));
$source = trim((string)($d['source'] ?? 'approval_tool'));

if ($name === '' || mb_strlen($name) > 20) out(false, 'invalid name', 400);
$isPhone = (bool)preg_match('/^1[3-9]\d{9}$/', $contact);
$isWechat = (bool)preg_match('/^[A-Za-z][-_A-Za-z0-9]{5,19}$/', $contact);
if (!$isPhone && !$isWechat) out(false, 'invalid contact', 400);
if ($dest === '' || mb_strlen($dest) > 60) out(false, 'invalid destination', 400);
if ($time === '' || mb_strlen($time) > 30) out(false, 'invalid travel time', 400);

// ---- 简易限流（文件计数） ----
if (!is_dir(RATE_DIR)) @mkdir(RATE_DIR, 0700, true);
$ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$ip = preg_replace('/[^0-9a-fA-F:.]/', '', explode(',', $ip)[0]);
$rateFile = RATE_DIR . '/' . hash('sha256', $ip) . '.cnt';
$now = time();
$hits = array();
if (is_file($rateFile)) {
    $hits = array_filter(explode("\n", (string)file_get_contents($rateFile)), function ($t) use ($now) {
        return $t !== '' && (int)$t > $now - RATE_WINDOW;
    });
}
if (count($hits) >= RATE_LIMIT) out(false, 'too many requests', 429);
$hits[] = (string)$now;
@file_put_contents($rateFile, implode("\n", $hits), LOCK_EX);

// ---- 落盘（webroot 之外） ----
if (!is_dir(STORE_DIR)) @mkdir(STORE_DIR, 0700, true);
$rec = array(
    'ts' => date('c'),
    'name' => $name,
    'contact' => $contact,
    'contactType' => $isPhone ? 'phone' : 'wechat',
    'destination' => $dest,
    'travelTime' => $time,
    'region' => (string)($d['region'] ?? ''),
    'visaType' => (string)($d['visaType'] ?? ''),
    'score' => (int)($d['score'] ?? -1),
    'grade' => (string)($d['grade'] ?? ''),
    'source' => $source,
    'consentVersion' => (string)($d['consentVersion'] ?? ''),
    'consentedAt' => date('c'),
    'ua' => substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 180),
    'ip' => $ip,
);
$line = json_encode($rec, JSON_UNESCAPED_UNICODE) . "\n";
if (@file_put_contents(STORE_FILE, $line, FILE_APPEND | LOCK_EX) === false) {
    out(false, 'store failed', 500);
}

// ---- 可选实时通知 ----
if (WECOM_WEBHOOK !== '') {
    $text = "【官网留资】{$name}（{$contact}）\n目的：{$dest}\n出行：{$time}\n自测：{$rec['score']} 分 / {$rec['grade']}\n来源：{$source}";
    $ctx = stream_context_create(array('http' => array(
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\n",
        'content' => json_encode(array('msgtype' => 'text', 'text' => array('content' => $text))),
        'timeout' => 4,
    )));
    @file_get_contents(WECOM_WEBHOOK, false, $ctx);
}

out(true, 'received');
