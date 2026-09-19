# BLUFF Vercel 部署与第三方登录配置指南

本文档介绍如何将 **BLUFF** 部署到 [Vercel](https://vercel.com)，配置 **PostgreSQL 云端数据库**（如 Neon 或 Supabase），并接入 **Google** 和 **GitHub** 第三方登录。

---

## 目录

1. [前置准备](#1-前置准备)
2. [第一步：配置 PostgreSQL 数据库](#2-第一步配置-postgresql-数据库)
3. [第二步：配置 Google OAuth 凭证](#3-第二步配置-google-oauth-凭证)
4. [第三步：配置 GitHub OAuth 凭证](#4-第三步配置-github-oauth-凭证)
5. [第四步：生成 AUTH_SECRET](#5-第四步生成-auth_secret)
6. [第五步：部署到 Vercel](#6-第五步部署到-vercel)
7. [第六步：推送数据库 Schema](#7-第六步推送数据库-schema)
8. [环境变量完整清单](#8-环境变量完整清单)

---

## 1. 前置准备

- 拥有一个 [GitHub](https://github.com) 账号，并将本项目推送至你的个人仓库。
- 拥有一个 [Vercel](https://vercel.com) 账号。
- Node.js 18+ 与 pnpm 10+（用于本地操作与迁移）。

---

## 2. 第一步：配置 PostgreSQL 数据库

BLUFF 采用 Prisma ORM + PostgreSQL 存储用户档案与战局回放数据。推荐使用免费且专为 Serverless 设计的数据库服务：

### 推荐方案 A：Neon (推荐，冷启动快且免费额度高)
1. 访问 [neon.tech](https://neon.tech) 并登录。
2. 点击 **Create Project**，输入项目名称（如 `bluff-db`）。
3. 在 Dashboard 中复制 **Connection String**（例如 `postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`）。
4. 将该连接串保存为 `DATABASE_URL`。

### 推荐方案 B：Supabase
1. 访问 [supabase.com](https://supabase.com) 并新建项目。
2. 前往 **Project Settings -> Database -> Connection string -> URI**。
3. 复制连接串（注意将密码替换为你的数据库真实密码）。

---

## 3. 第二步：配置 Google OAuth 凭证

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)。
2. 创建或选择一个项目（如 `bluff-game`）。
3. **配置 OAuth 同意屏幕 (OAuth consent screen)**：
   - 如果首次配置，前往 **APIs & Services -> OAuth consent screen**。
   - **User Type (用户类型)**：选择 **External (外部)**，点击 **Create**。
   - 填写 **App name** (如 `BLUFF`)、**User support email** 和 **Developer contact email**。
   - **Scopes (权限范围)**：点击 **Add or Remove Scopes**，勾选 `.../auth/userinfo.email`、`.../auth/userinfo.profile` 和 `openid`。
   - **Test users (测试用户)**：如果应用状态处于「Testing (测试中)」，**务必在此处添加你的个人 Google 邮箱**，否则该账号在登录时会被 Google 拦截。
4. **创建 OAuth 凭据**：
   - 前往 **APIs & Services -> Credentials (凭据)**。
   - 点击 **Create Credentials (创建凭据) -> OAuth client ID**。
   - **Application type (应用类型)**：选择 **Web application (Web 应用)**。
   - **Name**：填写名称（如 `BLUFF Web Client`）。
   - **Authorized redirect URIs (已获授权的重定向 URI)**：点击 **Add URI** 添加以下地址：
     - 本地开发：`http://localhost:3000/api/auth/callback/google`
     - Vercel 生产环境：`https://<你的项目域名>.vercel.app/api/auth/callback/google`
5. 点击 **Create** 后弹窗显示：
   - **Client ID** -> 保存为 `AUTH_GOOGLE_ID`（格式通常为 `xxx.apps.googleusercontent.com`）
   - **Client Secret** -> 保存为 `AUTH_GOOGLE_SECRET`（格式通常为 `GOCSPX-xxx`）

---

## 4. 第三步：配置 GitHub OAuth 凭证

1. 登录 GitHub，访问 [GitHub Developer Settings](https://github.com/settings/developers)。
2. 选择左侧 **OAuth Apps** -> 点击右上角 **New OAuth App**。
3. 填写应用信息：
   - **Application name**: `BLUFF`
   - **Homepage URL**: `https://<你的项目域名>.vercel.app`（本地开发可填 `http://localhost:3000`）
   - **Application description**: 可选
   - **Authorization callback URL (关键)**：
     - 本地开发：`http://localhost:3000/api/auth/callback/github`
     - Vercel 生产环境：`https://<你的项目域名>.vercel.app/api/auth/callback/github`
4. 点击 **Register application**。
5. 注册成功后进入详情页：
   - 复制 **Client ID** -> 保存为 `AUTH_GITHUB_ID`（如 `Ov23li9...`）
   - 点击 **Generate a new client secret** -> 复制生成的密钥，保存为 `AUTH_GITHUB_SECRET`（如 `18ee0d2...`）
   > [!IMPORTANT]
   > Client Secret 仅在生成时展示一次，离开页面后无法再次查看，请及时复制保存。

---

## 5. 第四步：生成 AUTH_SECRET

在终端运行以下命令生成随机密钥：

```bash
openssl rand -base64 32
```
或
```bash
npx auth secret
```

复制输出的字符串，此值将作为 `AUTH_SECRET`。

---

## 6. 第五步：部署到 Vercel

### 方式 A：一键快速部署 (推荐)

点击下方按钮，Vercel 会自动引导你完成代码 Fork、项目创建并提示输入所需的环境变量：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fh1bomb%2Fbluff&project-name=bluff&repository-name=bluff&env=DATABASE_URL,AUTH_SECRET,AUTH_GOOGLE_ID,AUTH_GOOGLE_SECRET,AUTH_GITHUB_ID,AUTH_GITHUB_SECRET&envDescription=Configure%20PostgreSQL%20database%20and%20NextAuth%20OAuth%20credentials&envLink=https%3A%2F%2Fgithub.com%2Fh1bomb%2Fbluff%2Fblob%2Fmain%2Fdocs%2Fvercel-deployment.md)

---

### 方式 B：在 Vercel 控制台手动导入

1. 登录 [Vercel 控制台](https://vercel.com/new)。
2. 选择 **Import Git Repository** 并选择你的 `bluff` 仓库。
3. **Framework Preset** 选择 **Next.js**。
4. 在 **Environment Variables (环境变量)** 面板中逐一添加以下变量：

| 变量名 | 说明 | 示例 / 来源 |
|--------|------|-------------|
| `DATABASE_URL` | PostgreSQL 数据库连接串 | `postgresql://...` (Neon/Supabase) |
| `AUTH_SECRET` | NextAuth 鉴权密钥 | 第四步生成的 Base64 随机串 |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | 第二步获取 |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret | 第二步获取 |
| `AUTH_GITHUB_ID` | GitHub OAuth Client ID | 第三步获取 |
| `AUTH_GITHUB_SECRET` | GitHub OAuth Client Secret | 第三步获取 |
| `TYPESAFE_API_KEY` | *(可选)* TypeSafe AI 密钥 | 如需启用 LLM 对手分析填入 |

5. 点击 **Deploy** 开始构建并部署。

---

## 7. 第六步：推送数据库 Schema

部署完成后，需要将 Prisma 数据模型表同步到生产数据库。在本地终端设置生产数据库连接串后执行：

```bash
# 替换为你的生产 PostgreSQL 连接串
export DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require"

# 推送数据模型表结构
pnpm prisma db push
```

成功后，`User`、`Account`、`Session`、`VerificationToken` 以及 `GameRun` 5 张表将自动创建完成。

---

## 8. 环境变量完整清单

你可以将以下模板保存在本地 `.env.local` 用于本地联调：

```bash
# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/bluff?sslmode=require"

# NextAuth
AUTH_SECRET="your_generated_secret_32_chars"

# Google OAuth
AUTH_GOOGLE_ID="xxx.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-xxx"

# GitHub OAuth
AUTH_GITHUB_ID="Iv1.xxx"
AUTH_GITHUB_SECRET="xxx"

# AI 引擎（可选）
TYPESAFE_API_KEY="your_api_key_optional"
```

---

## 💡 常见问题与排错指南

### 1. 修改了 Vercel 环境变量后，登录依然失效？
- **原因**：在 Vercel 项目的 `Settings -> Environment Variables` 中添加或修改环境变量后，**不会自动作用于已有的部署实例**。
- **解决方法**：前往 Vercel 控制台中的 **Deployments** 页面，找到最新的部署记录，点击右侧的 **`...` 按钮 -> Redeploy**，或者向 GitHub 推送一次新的 commit 触发全新构建，环境变量才会注入生效。

### 2. Google 登录跳转回来，但没有进入登录态？
- **排查一：同一邮箱已被 GitHub 先行注册**
  - NextAuth 默认禁止不同提供商自动绑定同一邮箱以防安全风险。BLUFF 项目在 `src/auth.ts` 中已开启 `allowDangerousEmailAccountLinking: true`，支持同邮箱多渠道无缝自动合并。
- **排查二：查看 Vercel 运行时日志**
  1. 打开 [vercel.com](https://vercel.com) 进入对应项目。
  2. 点击 **Deployments** 标签页，点击最新的生产部署记录。
  3. 点击 **Logs**（或 **Runtime Logs**）标签页。
  4. 搜索框输入 `api/auth`，点击登录重试，即可看到详细的 OAuth 请求与错误堆栈。

### 3. Google 登录报错「Access blocked: This app has not been verified」或「403 访问被拒绝」？
- **原因**：Google Cloud Console 中的 OAuth Consent Screen 还处于「Testing (测试中)」状态。
- **解决方法**：
  - 前往 **Google Cloud Console -> APIs & Services -> OAuth consent screen -> Test users**。
  - 点击 **Add users**，将你测试用的 Google 邮箱添加进去保存；或者直接点击 **Publish App (发布应用)** 将其转为公开可用。

### 4. 部署后登录重定向错误（redirect_uri_mismatch）？
- 请检查 Google Cloud Console 和 GitHub OAuth App 中的 Callback URL 是否与 Vercel 提供的实际域名精确匹配（需包含 `https://` 且必须以 `/api/auth/callback/google` 或 `/api/auth/callback/github` 结尾）。

### 5. 未配置数据库也能玩吗？
- 可以！BLUFF 拥有内置的防断兜底机制。如果未配置 `DATABASE_URL` 或处于未登录体验状态，游戏会自动使用浏览器本地 IndexedDB 保存战局，单机核心对战不受任何影响。
