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
2. 创建或选择一个项目。
3. 前往 **APIs & Services (API 与服务) -> Credentials (凭据)**。
4. 点击 **Create Credentials (创建凭据) -> OAuth client ID (OAuth 客户端 ID)**。
5. 应用类型选择 **Web application (Web 应用)**。
6. 设置 **Authorized redirect URIs (已获授权的重定向 URI)**：
   - 本地开发：`http://localhost:3000/api/auth/callback/google`
   - Vercel 生产环境：`https://<你的项目域名>.vercel.app/api/auth/callback/google`
7. 创建后获取：
   - `AUTH_GOOGLE_ID`: 客户端 ID
   - `AUTH_GOOGLE_SECRET`: 客户端密钥

---

## 4. 第三步：配置 GitHub OAuth 凭证

1. 登录 GitHub，访问 [GitHub Developer Settings](https://github.com/settings/developers)。
2. 选择 **OAuth Apps** -> 点击 **New OAuth App**。
3. 填写信息：
   - **Application name**: `BLUFF`
   - **Homepage URL**: `https://<你的项目域名>.vercel.app`（本地开发写 `http://localhost:3000`）
   - **Authorization callback URL**:
     - 本地开发：`http://localhost:3000/api/auth/callback/github`
     - Vercel 生产环境：`https://<你的项目域名>.vercel.app/api/auth/callback/github`
4. 点击 **Register application**。
5. 点击 **Generate a new client secret** 生成密钥。
6. 获取：
   - `AUTH_GITHUB_ID`: Client ID
   - `AUTH_GITHUB_SECRET`: Client Secret

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

## 💡 常见问题与提示

1. **未配置数据库也能玩吗？**
   - 可以！BLUFF 拥有内置的防断兜底机制。如果未配置 `DATABASE_URL` 或未登录，游戏会自动使用浏览器本地 IndexedDB 保存战局，完全不影响核心对战。
2. **部署后登录重定向错误？**
   - 请检查 Google Cloud Console 和 GitHub OAuth App 中的 Callback URL 是否与 Vercel 提供的实际域名精确匹配（需包含 `https://` 且必须以 `/api/auth/callback/google` 或 `/api/auth/callback/github` 结尾）。
