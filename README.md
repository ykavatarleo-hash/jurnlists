# Jurnlists Member Counter for Discord

Posts an announcement to Discord whenever your Roblox group (Jurnlists)
gains or loses members, via GitHub Actions — no hosting required.

Example message it posts (as a colored embed):

> <:celebration:1417757294107820132> **Jurnlists** has reached **1,234** members!

## What's already configured

- **Group:** Jurnlists (Group ID `11867970`)
- **Embed color:** `#f3b359`
- **Posts only when the member count changes** (not on a fixed schedule regardless of change)
- **No milestone math** — just announces the current count whenever it changes

## ⚠️ Important: regenerate your webhook

If this webhook URL was ever shared anywhere outside of Discord itself
(chat, screenshot, message), reset it before going live: **Discord →
Channel Settings → Integrations → Webhooks → reset token**, then use the
new URL below. Treat webhook URLs like passwords.

## Setup

### 1. Create the repo

Create a new GitHub repository and make sure it's set to **Public**
(Settings → Danger Zone → Change visibility, if needed). This matters:
**scheduled GitHub Actions only run automatically on public repos for free
accounts** — private repos only allow manual runs, which silently breaks
the automation.

Upload these files, keeping the folder structure exactly as-is:

```
update-counter.js
state.json
.github/workflows/update-counter.yml
```

Upload them as individual files (or an extracted folder) — **not as a
.zip** — since GitHub won't auto-extract zip uploads.

### 2. Add repository secrets

**Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Value |
|---|---|
| `DISCORD_WEBHOOK_URL` | Your Discord webhook URL |
| `ROBLOX_GROUP_ID` | `11867970` |
| `EMBED_COLOR_HEX` | `#f3b359` |
| `GROUP_DISPLAY_NAME` | `Jurnlists` |
| `CELEBRATION_EMOJI` | `<:celebration:1417757294107820132>` |

(Only `DISCORD_WEBHOOK_URL` is strictly required — the others have defaults
baked into the script — but setting them as secrets makes them easy to
change later without touching code.)

### 3. Enable workflow write permissions

This workflow commits an updated `state.json` back to the repo each time
the count changes, so it needs write access:

- **Settings → Actions → General**
- Under "Workflow permissions," select **"Read and write permissions"**
- Save

### 4. Test it manually

- **Actions tab → "Update Jurnlists Member Counter" → Run workflow**
- Confirm it goes green
- Check Discord for the message

### 5. Set up reliable scheduling (important — read this)

GitHub's own built-in schedule trigger is unreliable in practice — it can
silently fail to fire for long stretches, or fire very late, especially on
new/low-traffic repos. The workflow file includes a `schedule` trigger as
a baseline, but **don't rely on it alone**. Use an external trigger
instead:

1. Create a free account at **cron-job.org**
2. Create a GitHub Personal Access Token (classic):
   **GitHub → Settings → Developer settings → Personal access tokens →
   Tokens (classic) → Generate new token (classic)**
   - Scope: check **`repo`** only
   - Expiration: your choice (no expiration is fine for a personal automation)
   - Copy the token immediately — it's only shown once
3. In cron-job.org, create a new cronjob:
   - **URL:**
     ```
     https://api.github.com/repos/YOUR_USERNAME/YOUR_REPO/actions/workflows/update-counter.yml/dispatches
     ```
   - **Request method:** POST
   - **Headers:**
     - `Authorization` → `Bearer YOUR_TOKEN_HERE` (note the word "Bearer" and the space — a common mistake is pasting just the raw token)
     - `Accept` → `application/vnd.github+json`
   - **Request body (raw JSON):**
     ```json
     {"ref":"main"}
     ```
   - **Schedule:** every 5 minutes
4. Save, then check the job's execution history after a few minutes —
   look for a success status (not 401 Unauthorized, which usually means
   the "Bearer " prefix or token got mistyped/truncated).

### 6. Done

Once secrets are set, permissions enabled, and the cron-job.org trigger is
running, it works fully on autopilot — checks every 5 minutes, posts to
Discord only when the member count actually changes. Nothing to host or
babysit.

## Customizing later

- **Change the message wording:** edit the `description` string in `update-counter.js`.
- **Change embed color:** edit the `EMBED_COLOR_HEX` secret.
- **Change check frequency:** edit the cron-job.org schedule (5 minutes recommended minimum).
