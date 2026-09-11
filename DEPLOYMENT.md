# 薪水跳动 2.0 部署

## 1. 创建 Supabase 项目

1. 在 Supabase 创建一个新项目。
2. 在 SQL Editor 执行 `supabase/schema.sql`。
3. 在 Authentication → Providers → Email 中关闭 Confirm email，这样注册后即可直接使用。
4. 在 Project Settings → API 复制 Project URL 和 anon public key。

## 2. 配置本地环境

复制 `.env.example` 为 `.env.local`，填入：

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

如果你只想运行前端壳：

```bash
npm install
npm run dev
```

如果没有 Supabase 配置，使用完整本机账号模式：

```bash
npm run dev:full
```

它会同时启动 Vite 和 `127.0.0.1:8787` 本机账号 API。账号、会话和薪酬配置写入项目下的 `.local-data/accounts.json`，该目录已加入 `.gitignore`。密码不会明文保存，配置按用户 ID 隔离。

本机模式适合现在直接使用和验收。当前 GitHub Pages 公网版本在没有 Supabase 时会自动切换为浏览器本地账号模式：朋友可以各自注册和使用，账号数据隔离在各自浏览器中，但无法跨设备同步。要让同一个账号在多台设备恢复数据，需要配置 Supabase，再部署到 Vercel 或 Netlify。

## 3. 部署到 Vercel 或 Netlify

将仓库根目录设置为当前项目目录，构建命令使用 `npm run build`，输出目录使用 `dist`。在托管平台添加同名的两个环境变量后重新部署。

Supabase 的 `salary_profiles` 表启用了 Row Level Security。前端使用 anon key 时，查询和写入只允许当前登录用户访问自己的 `user_id` 行。薪酬配置不会写入 URL。

## 4. 费用

Supabase 和 Vercel/Netlify 都有免费额度，适合个人和早期朋友试用。费用通常来自超出免费额度后的数据库、流量或邮件发送量；本项目没有后台常驻服务，也不需要单独购买服务器。
