import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const port = Number(process.env.LOCAL_API_PORT || 8787);
const dataDir = resolve('.local-data');
const dataFile = resolve(dataDir, 'accounts.json');
mkdirSync(dataDir, { recursive: true });
const db = existsSync(dataFile) ? JSON.parse(readFileSync(dataFile, 'utf8')) : { users: {}, sessions: {}, profiles: {} };
const persist = () => writeFileSync(dataFile, JSON.stringify(db, null, 2), { mode: 0o600 });
const json = (response, status, payload) => { response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); response.end(JSON.stringify(payload)); };
const body = async (request) => { let raw = ''; for await (const chunk of request) raw += chunk; return raw ? JSON.parse(raw) : {}; };
const sessionFor = (request) => { const token = String(request.headers.authorization || '').replace(/^Bearer\s+/i, ''); return token && db.sessions[token] ? db.sessions[token] : null; };
const hashPassword = (password, salt = randomBytes(16).toString('hex')) => ({ salt, hash: scryptSync(password, salt, 64).toString('hex') });
const makeSession = (user) => { const token = randomBytes(32).toString('hex'); db.sessions[token] = user.id; persist(); return { token, user: { id: user.id, email: user.email } }; };

const api = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || '127.0.0.1'}`);
    if (!url.pathname.startsWith('/api/')) return json(response, 404, { error: 'Not found' });
    if (request.method === 'POST' && url.pathname === '/api/auth/signup') {
      const { email, password } = await body(request); const normalized = String(email || '').trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(normalized)) return json(response, 400, { error: '请输入有效邮箱。' });
      if (String(password || '').length < 6) return json(response, 400, { error: '密码至少需要 6 位字符。' });
      if (db.users[normalized]) return json(response, 409, { error: '这个邮箱已经注册，请直接登录。' });
      const user = { id: randomUUID(), email: normalized, ...hashPassword(String(password)) }; db.users[normalized] = user; persist(); return json(response, 200, { session: makeSession(user) });
    }
    if (request.method === 'POST' && url.pathname === '/api/auth/login') {
      const { email, password } = await body(request); const user = db.users[String(email || '').trim().toLowerCase()];
      if (!user || !password) return json(response, 401, { error: '邮箱或密码不正确。' });
      const actual = Buffer.from(scryptSync(String(password), user.salt, 64)); const expected = Buffer.from(user.hash); if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return json(response, 401, { error: '邮箱或密码不正确。' });
      return json(response, 200, { session: makeSession(user) });
    }
    if (request.method === 'GET' && url.pathname === '/api/auth/session') { const id = sessionFor(request); const user = id && Object.values(db.users).find((candidate) => candidate.id === id); return user ? json(response, 200, { session: { user: { id: user.id, email: user.email } } }) : json(response, 401, { error: '登录已失效。' }); }
    if (request.method === 'POST' && url.pathname === '/api/auth/logout') { const token = String(request.headers.authorization || '').replace(/^Bearer\s+/i, ''); if (token) { delete db.sessions[token]; persist(); } return json(response, 200, { ok: true }); }
    const id = sessionFor(request); if (!id) return json(response, 401, { error: '请先登录。' });
    if (request.method === 'GET' && url.pathname === '/api/profile') return json(response, 200, { config: db.profiles[id] || null });
    if (request.method === 'PUT' && url.pathname === '/api/profile') { const payload = await body(request); if (!payload.config || typeof payload.config !== 'object') return json(response, 400, { error: '设置格式不正确。' }); db.profiles[id] = payload.config; persist(); return json(response, 200, { config: db.profiles[id] }); }
    return json(response, 404, { error: 'Not found' });
  } catch (error) { console.error(error); return json(response, 500, { error: '本机账号服务暂时不可用。' }); }
});
api.listen(port, '127.0.0.1', () => console.log(`Local account API: http://127.0.0.1:${port}`));
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173'], { stdio: 'inherit', env: process.env });
const shutdown = () => { vite.kill('SIGTERM'); api.close(() => process.exit(0)); };
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
