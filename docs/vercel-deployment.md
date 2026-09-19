# BLUFF Vercel Deployment & OAuth Configuration Guide

English | [简体中文](./vercel-deployment-zh.md)

---

This document provides a comprehensive step-by-step guide to deploying **BLUFF** on [Vercel](https://vercel.com), setting up a **Cloud PostgreSQL database** (such as Neon or Supabase), and configuring third-party authentication via **Google** and **GitHub**.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Step 1: Configure PostgreSQL Database](#2-step-1-configure-postgresql-database)
3. [Step 2: Configure Google OAuth Credentials](#3-step-2-configure-google-oauth-credentials)
4. [Step 3: Configure GitHub OAuth Credentials](#4-step-3-configure-github-oauth-credentials)
5. [Step 4: Generate AUTH_SECRET](#5-step-4-generate-auth_secret)
6. [Step 5: Deploy to Vercel](#6-step-5-deploy-to-vercel)
7. [Step 6: Push Database Schema](#7-step-6-push-database-schema)
8. [Full Environment Variables Reference](#8-full-environment-variables-reference)
9. [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 1. Prerequisites

- A [GitHub](https://github.com) account with the repository pushed to your personal profile or organization.
- A [Vercel](https://vercel.com) account.
- Node.js 18+ and pnpm 10+ (for local development and database migrations).

---

## 2. Step 1: Configure PostgreSQL Database

BLUFF uses Prisma ORM + PostgreSQL to persist player profiles, match statistics, and complete run replays. We recommend using a serverless-native PostgreSQL provider:

### Option A: Neon (Recommended — fast cold starts and generous free tier)
1. Go to [neon.tech](https://neon.tech) and sign up or log in.
2. Click **Create Project** and enter a project name (e.g., `bluff-db`).
3. Copy the **Connection String** from the dashboard (e.g., `postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`).
4. Save this string as your `DATABASE_URL`.

### Option B: Supabase
1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Navigate to **Project Settings -> Database -> Connection string -> URI**.
3. Copy the URI string (remember to replace the password placeholder with your actual database password).

---

## 3. Step 2: Configure Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project (e.g., `bluff-game`).
3. **Configure OAuth Consent Screen**:
   - If this is your first time, go to **APIs & Services -> OAuth consent screen**.
   - **User Type**: Choose **External**, then click **Create**.
   - Fill in **App name** (e.g., `BLUFF`), **User support email**, and **Developer contact email**.
   - **Scopes**: Click **Add or Remove Scopes**, check `.../auth/userinfo.email`, `.../auth/userinfo.profile`, and `openid`.
   - **Test users**: If the publishing status is "Testing", **you must add your Google email address under Test users**; otherwise Google will block authentication attempts with a 403 error.
4. **Create OAuth Client ID**:
   - Go to **APIs & Services -> Credentials**.
   - Click **Create Credentials -> OAuth client ID**.
   - **Application type**: Select **Web application**.
   - **Name**: Enter a descriptive name (e.g., `BLUFF Web Client`).
   - **Authorized redirect URIs**: Click **Add URI** and enter:
     - Local development: `http://localhost:3000/api/auth/callback/google`
     - Vercel production: `https://<your-project>.vercel.app/api/auth/callback/google`
5. Click **Create** to obtain your credentials:
   - **Client ID** -> Save as `AUTH_GOOGLE_ID` (format: `xxx.apps.googleusercontent.com`)
   - **Client Secret** -> Save as `AUTH_GOOGLE_SECRET` (format: `GOCSPX-xxx`)

---

## 4. Step 3: Configure GitHub OAuth Credentials

1. Sign in to GitHub and visit [GitHub Developer Settings](https://github.com/settings/developers).
2. Select **OAuth Apps** on the left -> click **New OAuth App**.
3. Fill in the application details:
   - **Application name**: `BLUFF`
   - **Homepage URL**: `https://<your-project>.vercel.app` (or `http://localhost:3000` for local dev)
   - **Application description**: Optional
   - **Authorization callback URL**:
     - Local development: `http://localhost:3000/api/auth/callback/github`
     - Vercel production: `https://<your-project>.vercel.app/api/auth/callback/github`
4. Click **Register application**.
5. On the application details page:
   - Copy the **Client ID** -> Save as `AUTH_GITHUB_ID` (e.g., `Ov23li9...`)
   - Click **Generate a new client secret** -> Copy the generated secret, save as `AUTH_GITHUB_SECRET` (e.g., `18ee0d2...`)
   > [!IMPORTANT]
   > The Client Secret is only displayed once upon generation. Be sure to copy and store it securely.

---

## 5. Step 4: Generate AUTH_SECRET

Run the following command in your terminal to generate a secure 32-byte Base64 key:

```bash
openssl rand -base64 32
```
or:
```bash
npx auth secret
```

Copy the output string. This value serves as `AUTH_SECRET`.

---

## 6. Step 5: Deploy to Vercel

### Method A: One-Click Automated Deployment (Recommended)

Click the button below. Vercel will guide you through repository cloning, project creation, and interactive environment variable configuration:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fh1bomb%2Fbluff&project-name=bluff&repository-name=bluff&env=DATABASE_URL,AUTH_SECRET,AUTH_GOOGLE_ID,AUTH_GOOGLE_SECRET,AUTH_GITHUB_ID,AUTH_GITHUB_SECRET&envDescription=Configure%20PostgreSQL%20database%20and%20NextAuth%20OAuth%20credentials&envLink=https%3A%2F%2Fgithub.com%2Fh1bomb%2Fbluff%2Fblob%2Fmain%2Fdocs%2Fvercel-deployment.md)

---

### Method B: Manual Import via Vercel Dashboard

1. Sign in to [Vercel](https://vercel.com/new).
2. Choose **Import Git Repository** and select your `bluff` repository.
3. Keep **Framework Preset** as **Next.js**.
4. In the **Environment Variables** section, add the following variables:

| Variable Name | Description | Source / Example |
|---------------|-------------|------------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` (Neon/Supabase) |
| `AUTH_SECRET` | NextAuth encryption secret | Base64 random string from Step 4 |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | From Step 2 |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret | From Step 2 |
| `AUTH_GITHUB_ID` | GitHub OAuth Client ID | From Step 3 |
| `AUTH_GITHUB_SECRET` | GitHub OAuth Client Secret | From Step 3 |
| `TYPESAFE_API_KEY` | *(Optional)* TypeSafe AI key | For LLM-powered opponent analysis |

5. Click **Deploy** to initiate the build and deployment.

---

## 7. Step 6: Push Database Schema

Once deployed, synchronize the Prisma schema to your production database. Export the production database connection string in your local terminal and execute:

```bash
# Set your production PostgreSQL connection string
export DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require"

# Push schema tables to the database
pnpm prisma db push
```

Upon completion, the 5 requisite tables (`User`, `Account`, `Session`, `VerificationToken`, and `GameRun`) will be automatically created.

---

## 8. Full Environment Variables Reference

Save the following template to your local `.env.local` for development and testing:

```bash
# PostgreSQL Database
DATABASE_URL="postgresql://user:password@localhost:5432/bluff?sslmode=require"

# NextAuth Encryption Secret
AUTH_SECRET="your_generated_secret_32_chars"

# Google OAuth
AUTH_GOOGLE_ID="xxx.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-xxx"

# GitHub OAuth
AUTH_GITHUB_ID="Iv1.xxx"
AUTH_GITHUB_SECRET="xxx"

# TypeSafe AI Engine (Optional)
TYPESAFE_API_KEY="your_api_key_optional"
```

---

## 💡 Troubleshooting & FAQ

### 1. Modified Vercel environment variables, but login still fails?
- **Root Cause**: Adding or modifying environment variables under `Settings -> Environment Variables` in Vercel **does not automatically apply to existing deployment instances**.
- **Solution**: Navigate to the **Deployments** tab in your Vercel project, locate the latest deployment, click **`...` -> Redeploy**, or push a new commit to GitHub to trigger a fresh build.

### 2. Google login redirects back to the homepage without entering the logged-in state?
- **Possibility 1: Email already registered via GitHub**
  - By default, NextAuth prevents linking different OAuth providers to the same email address without explicit consent. In BLUFF, `allowDangerousEmailAccountLinking: true` is enabled in `src/auth.ts`, safely merging accounts sharing the identical email address.
- **Possibility 2: Check Vercel Function Runtime Logs**
  1. Open [vercel.com](https://vercel.com) and navigate to your project.
  2. Click the **Deployments** tab, then select the active production deployment.
  3. Click the **Logs** (or **Runtime Logs**) tab.
  4. Filter by `api/auth` and retry the login flow to inspect detailed callback traces and error logs.

### 3. Google OAuth error: "Access blocked: This app has not been verified" or 403 Forbidden?
- **Root Cause**: The OAuth Consent Screen in Google Cloud Console is in "Testing" mode.
- **Solution**:
  - Go to **Google Cloud Console -> APIs & Services -> OAuth consent screen -> Test users**.
  - Click **Add users** and add your Google email address, or click **Publish App** to make it publicly accessible.

### 4. Redirect URI mismatch error (`redirect_uri_mismatch`)?
- Verify that the Callback URLs configured in Google Cloud Console and GitHub OAuth Apps match your actual Vercel domain exactly (must use `https://` and terminate with `/api/auth/callback/google` or `/api/auth/callback/github`).

### 5. Can I play without configuring a database?
- Yes! BLUFF features a built-in offline fallback engine. If `DATABASE_URL` is omitted or when playing as an unauthenticated guest in non-restricted modes, the game transparently saves state to the browser's IndexedDB.
