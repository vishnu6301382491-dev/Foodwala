# FoodWala Backend Deployment Guide (Render & Cloud MySQL)

This guide walks you through deploying the FoodWala Enterprise API on Render and connecting it to a cloud MySQL database (TiDB Cloud Serverless or Aiven).

---

## 1. Web Service Configuration (Render Dashboard)

Go to [dashboard.render.com](https://dashboard.render.com) and click on your **foodwala-backend** web service.

### (a) Settings > Build & Deploy
Under the **Settings** tab, configure the following fields:
* **Repository**: `vishnu6301382491-dev/Foodwala`
* **Branch**: `main`
* **Root Directory**: `server`
* **Runtime**: `Node`
* **Build Command**: `npm install`
* **Start Command**: `npm start`
* **Health Check Path**: `/api/health`
* Click **Save Changes**.

> [!NOTE]
> The repo is configured so that if **Root Directory** is left blank, the root `package.json` will automatically install server dependencies via `postinstall` (`npm install --prefix server`) and run `node server/server.js`. Setting **Root Directory** to `server` is recommended.

### (b) If Repository is Incorrect or Cannot Be Changed
If your current Render web service is connected to the wrong repository or cannot change branches:
1. In the Render Dashboard, click **New +** (top right) > **Blueprint**.
2. Connect your GitHub account and select the **`vishnu6301382491-dev/Foodwala`** repository.
3. Render will read [`render.yaml`](render.yaml) automatically and set up the service, build commands, and health check.
4. If creating a standard Web Service instead of a Blueprint:
   * Click **New +** > **Web Service**.
   * Select `vishnu6301382491-dev/Foodwala`.
   * Fill in the settings from step (a) above.
5. If the new service receives a new URL (e.g., `https://foodwala-api-xyz.onrender.com`), update `API_BASE_URL` in [`js/config.js`](js/config.js) (Line 19).

---

## 2. Environment Variables Configuration

Navigate to the **Environment** tab of your Render web service and add the following key-value pairs:

| Key | Value / Instructions | Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations and security |
| `PORT` | `10000` | Render default web service port |
| `CORS_ORIGINS` | `https://vishnu6301382491-dev.github.io` | Allows browser requests from GitHub Pages |
| `FRONTEND_URL` | `https://vishnu6301382491-dev.github.io` | Primary frontend origin |
| `DB_HOST` | `<your-cloud-database-host>` | e.g., `gateway01.ap-southeast-1.prod.aws.tidbcloud.com` |
| `DB_PORT` | `4000` (for TiDB) or `3306` (standard MySQL) | Cloud MySQL port |
| `DB_USER` | `<your-cloud-database-user>` | Cloud database username |
| `DB_PASSWORD` | `<your-cloud-database-password>` | Cloud database password |
| `DB_NAME` | `fudwala` | Database name |
| `DB_SSL` | `true` | Enforces TLS/SSL connection with system CAs |
| `JWT_SECRET` | Click **Generate** in Render UI | Random 64-char secret for session tokens |
| `ADMIN_PASSWORD` | `<choose-a-strong-password>` | Syncs the admin user credentials on startup |
| `OTP_DEV_MODE` | `true` | Logs OTPs to server console for testing |
| `SMS_PROVIDER` | `console` | Fallback SMS provider |

> [!CAUTION]
> Never commit real database passwords or `JWT_SECRET` values to GitHub. Enter them only in the Render Environment Dashboard.

---

## 3. Deploy & Verify

### (a) Trigger Deployment
1. On the web service page, click the **Manual Deploy** button (top right).
2. Click **Clear build cache & deploy**.
3. Watch the **Logs** tab until you see:
   ```text
   ======================================================
   🚀 FoodWala API Server Running on http://0.0.0.0:10000
   📦 Version        : 1.0.1 (commit: <hash>)
   🌐 Health Check   : http://0.0.0.0:10000/api/health
   🔒 Environment    : production
   📱 CORS Origins   : https://vishnu6301382491-dev.github.io
   ======================================================
   ```

### (b) Run the Deployment Verifier
From your local terminal, run:
```bash
npm run verify
```
Or verify a custom URL:
```bash
node scripts/verify-deploy.js https://foodwala-backend.onrender.com <expected-commit-hash>
```

When successful, the verifier will print:
```text
✅ DEPLOYMENT STATUS: HEALTHY
📦 Version         : 1.0.1
🔖 Deployed Commit : <commit-hash>
🗄️ Database Live   : YES (Connected)
🎉 RESULT: PASS - Live service is running the expected commit!
```

---

## 4. Reading Render Events & Logs (Troubleshooting)

| Error in Logs | Root Cause | Fix |
| :--- | :--- | :--- |
| `ECONNREFUSED` | Cannot connect to database host:port | Verify `DB_HOST` and `DB_PORT`. Check if database server is running. |
| `ENOTFOUND` | DNS resolution failed for database host | Check for typos in `DB_HOST` (e.g. extra spaces or `https://` prefix). |
| `ER_ACCESS_DENIED_ERROR` | Bad database credentials | Check `DB_USER` and `DB_PASSWORD` in the Environment tab. For TiDB Cloud, ensure username includes cluster prefix if applicable. |
| `ER_BAD_DB_ERROR` | Database does not exist | Run `CREATE DATABASE IF NOT EXISTS fudwala;` in your cloud SQL console. |
| `SSL/TLS handshake failed` | SSL certificate or TLS version error | Ensure `DB_SSL=true`. If using custom self-signed certs, set `DB_SSL_REJECT_UNAUTHORIZED=false`. |
| `Cannot find module ...` | Missing dependency in node_modules | Ensure **Build Command** is `npm install` and **Root Directory** is `server`. |
| `no open ports detected` | Server did not bind to port or crashed | The server binds to `0.0.0.0` and `process.env.PORT || 5000`. Ensure `PORT=10000` is set. |

---

## 5. Free Cloud Database Setup (TiDB Cloud)

1. Sign up for a free account at [tidbcloud.com](https://tidbcloud.com).
2. Click **Create Cluster** and select **Serverless (Free)**.
3. Choose a region close to your Render service (e.g., AWS Oregon `us-west-2` or AWS Frankfurt/Singapore).
4. After creation, open the cluster's **Overview** and copy:
   * **Host** (e.g. `gateway01.us-west-2.prod.aws.tidbcloud.com`)
   * **Port** (e.g. `4000`)
   * **User**
   * **Password**
5. Open the TiDB Cloud **SQL Editor** tab and execute:
   ```sql
   CREATE DATABASE IF NOT EXISTS fudwala;
   USE fudwala;
   ```
6. Import the FoodWala schema and seed data from your machine using MySQL CLI:
   ```bash
   mysql -h <HOST> -P 4000 -u <USER> -p fudwala --ssl-mode=REQUIRED < database/cloud_schema.sql
   ```
   *All 19 tables, 105 restaurants, and 756 menu items will be created and populated.*
7. Put the credentials into the Render **Environment** tab as shown in Section 2.
