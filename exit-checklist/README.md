# 離職 Checklist（跨裝置同步版）

一份私人的離職準備清單。可勾選、寫備註、看進度，**資料同步在雲端**——
電腦、手機只要輸入同一組通關密語，看到的就是同一份。

- **前端**：單一 `index.html`（純靜態，無建置）
- **後端**：`api/state.js`（Vercel serverless function）
- **資料庫**：Vercel KV（Upstash Redis），免費額度足夠
- **保護**：通關密語存成環境變數，沒密語的人 API 一律回 401，看不到內容

> 注意：採「最後寫入者勝」。同一份資料給你自己跨裝置用沒問題；若兩台裝置同時編輯，後存的會蓋掉先存的。

---

## 部署到 Vercel（約 5 分鐘）

### 1. 匯入專案
1. 進 [Vercel](https://vercel.com) → **Add New… → Project**，匯入這個 GitHub repo。
2. **Root Directory 選 `exit-checklist`**（重要：這個 repo 有多個子專案）。
3. Framework Preset 會是 **Other**，不需要 Build Command，直接部署。

### 2. 建立資料庫（Vercel KV）
1. 專案頁 → **Storage** 分頁 → **Create Database** → 選 **Upstash for Redis**（或 KV）。
2. 建立後點 **Connect** 連到這個專案。
3. 連接後會自動把 `KV_REST_API_URL`、`KV_REST_API_TOKEN`
   （或 `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`）寫進環境變數。

### 3. 設定通關密語
1. 專案 → **Settings → Environment Variables**。
2. 新增 `APP_PASSPHRASE`，值是你自己決定的密語（Production / Preview / Development 都勾）。
3. 回 **Deployments**，對最新一筆 **Redeploy**，讓環境變數生效。

### 4. 開始用
- 打開部署後的網址，輸入密語即可。
- 在手機開同一個網址、輸入同一組密語，就會看到同一份資料。

---

## 本機測試（選用）

```bash
npm i -g vercel
cd exit-checklist
cp .env.example .env.local   # 填入 APP_PASSPHRASE 與 KV 連線資訊
vercel dev
```

---

## 換密語

到 Settings → Environment Variables 改 `APP_PASSPHRASE` 的值，再 Redeploy；
各裝置下次會要求重新輸入。網頁右下角「鎖定 / 切換密語」可手動登出。

## 備份

資料雖在雲端，仍建議重大變動前用頁面下方「⬇ 匯出備份」存一份 JSON；
換環境或誤刪時可用「⬆ 匯入還原」救回。
