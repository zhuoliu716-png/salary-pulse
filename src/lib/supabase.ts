import { createClient } from '@supabase/supabase-js';
import type { SalaryConfig } from './tax';
import { parseConfig } from './validate';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anonKey);
export const supabase = supabaseConfigured ? createClient(url!, anonKey!) : null;

export interface AppSession { user: { id: string; email: string }; token?: string }
const LOCAL_SESSION = 'salary-pulse:local-session';
const LOCAL_ACCOUNTS = 'salary-pulse:local-accounts';

async function localRequest(path: string, init: RequestInit = {}) {
  const stored = sessionStorage.getItem(LOCAL_SESSION);
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  if (stored) headers.set('authorization', `Bearer ${(JSON.parse(stored) as AppSession).token ?? ''}`);
  const response = await fetch(path, { ...init, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) { if (response.status === 404 || response.status === 405) throw new TypeError('local account API unavailable'); throw new Error(payload.error || '本机账号服务暂时不可用。'); }
  return payload;
}

type LocalAccount = { id: string; email: string; password: string; config?: SalaryConfig };
function localAccounts(): LocalAccount[] { try { return JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS) || '[]') as LocalAccount[]; } catch { return []; } }
function saveLocalAccounts(accounts: LocalAccount[]) { localStorage.setItem(LOCAL_ACCOUNTS, JSON.stringify(accounts)); }
function browserSession(account: LocalAccount): AppSession { const session = { user: { id: account.id, email: account.email }, token: `browser-${account.id}` }; sessionStorage.setItem(LOCAL_SESSION, JSON.stringify(session)); window.dispatchEvent(new Event('salary-pulse-auth')); return session; }
async function browserPassword(password: string) { const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password)); return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join(''); }
async function localBrowserSignUp(email: string, password: string): Promise<AppSession> { const accounts = localAccounts(); const normalized = email.trim().toLowerCase(); if (accounts.some(account => account.email === normalized)) throw new Error('这个邮箱已经注册，请直接登录。'); const account = { id: crypto.randomUUID(), email: normalized, password: await browserPassword(password) }; accounts.push(account); saveLocalAccounts(accounts); return browserSession(account); }
async function localBrowserSignIn(email: string, password: string): Promise<AppSession> { const hashed = await browserPassword(password); const account = localAccounts().find(candidate => candidate.email === email.trim().toLowerCase() && candidate.password === hashed); if (!account) throw new Error('邮箱或密码不正确。'); return browserSession(account); }
function currentBrowserAccount(): LocalAccount | null { const stored = sessionStorage.getItem(LOCAL_SESSION); if (!stored) return null; try { const session = JSON.parse(stored) as AppSession; return localAccounts().find(account => account.id === session.user.id) || null; } catch { return null; } }

export async function getAppSession(): Promise<AppSession | null> {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    return user ? { user: { id: user.id, email: user.email ?? '已登录' } } : null;
  }
  const stored = sessionStorage.getItem(LOCAL_SESSION);
  if (!stored) return null;
  try { const payload = await localRequest('/api/auth/session'); return payload.session as AppSession; } catch { const account = currentBrowserAccount(); return account ? { user: { id: account.id, email: account.email }, token: `browser-${account.id}` } : null; }
}

export function subscribeAuth(callback: (session: AppSession | null) => void) {
  if (supabase) {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => callback(next?.user ? { user: { id: next.user.id, email: next.user.email ?? '已登录' } } : null));
    return () => data.subscription.unsubscribe();
  }
  const listener = () => { void getAppSession().then(callback); };
  window.addEventListener('salary-pulse-auth', listener); return () => window.removeEventListener('salary-pulse-auth', listener);
}

export async function signIn(email: string, password: string): Promise<AppSession> {
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) throw new Error('邮箱或密码不正确。');
    return { user: { id: data.user.id, email: data.user.email ?? email } };
  }
  try { const payload = await localRequest('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); sessionStorage.setItem(LOCAL_SESSION, JSON.stringify(payload.session)); window.dispatchEvent(new Event('salary-pulse-auth')); return payload.session as AppSession; } catch (error) { if (error instanceof TypeError) return localBrowserSignIn(email, password); throw error; }
}

export async function signUp(email: string, password: string): Promise<AppSession> {
  if (supabase) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) throw new Error(error?.message || '注册失败，请重试。');
    if (!data.session) throw new Error('注册成功，请检查邮箱后完成确认。');
    return { user: { id: data.user.id, email: data.user.email ?? email } };
  }
  try { const payload = await localRequest('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password }) }); sessionStorage.setItem(LOCAL_SESSION, JSON.stringify(payload.session)); window.dispatchEvent(new Event('salary-pulse-auth')); return payload.session as AppSession; } catch (error) { if (error instanceof TypeError) return localBrowserSignUp(email, password); throw error; }
}

export async function signOut(): Promise<void> {
  if (supabase) { await supabase.auth.signOut(); return; }
  try { await localRequest('/api/auth/logout', { method: 'POST' }); } catch { /* session is cleared locally even if the API is down */ }
  sessionStorage.removeItem(LOCAL_SESSION); window.dispatchEvent(new Event('salary-pulse-auth'));
}

export async function loadProfile(userId: string): Promise<SalaryConfig | null> {
  if (!supabase) { try { const payload = await localRequest('/api/profile'); return payload.config ? parseConfig(payload.config) : null; } catch (error) { if (!(error instanceof TypeError)) throw error; const account = currentBrowserAccount(); return account?.config ? parseConfig(account.config) : null; } }
  const { data, error } = await supabase.from('salary_profiles').select('config').eq('user_id', userId).maybeSingle();
  if (error) throw new Error('读取云端设置失败，请检查网络后重试。');
  return data?.config ? parseConfig(data.config) : null;
}

export async function saveProfile(userId: string, value: SalaryConfig): Promise<SalaryConfig> {
  if (!supabase) { const config = parseConfig(value); try { const payload = await localRequest('/api/profile', { method: 'PUT', body: JSON.stringify({ config }) }); return parseConfig(payload.config); } catch (error) { if (!(error instanceof TypeError)) throw error; const accounts = localAccounts(); const account = currentBrowserAccount(); if (!account) throw new Error('请先登录。'); const index = accounts.findIndex(candidate => candidate.id === account.id); accounts[index] = { ...account, config }; saveLocalAccounts(accounts); return config; } }
  const config = parseConfig(value);
  const { data, error } = await supabase
    .from('salary_profiles')
    .upsert({ user_id: userId, config, updated_at: new Date().toISOString() })
    .select('config')
    .single();
  if (error || !data?.config) throw new Error('云端保存失败，请检查网络后重试。');
  return parseConfig(data.config);
}
