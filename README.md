# 吃飯了 Eating Time

以台北市中山區松江路223號（近行天宮站）為中心的抽卡選店工具。選好午餐／晚餐／飲料／甜點其中一種，抽一張卡決定今天吃哪裡。

## 開發

```bash
npm install
npm run dev
```

## 建置

```bash
npm run build
npm run preview
```

## 專案結構

- `index.html`：頁面進入點
- `src/main.js`：抽卡與類別篩選邏輯
- `src/style.css`：樣式
- `src/data/stores.json`：店家資料（名稱／類型／地址／描述）
- `src/data/categories.json`：四種用餐類型定義
- `public/images/backgrounds/`：場景背景插畫

## 資料

店家資料整理自美食部落格、媒體專題與地圖評論等公開資訊，非即時營業狀態。抽到店家後請用結果卡片的 Google 地圖連結核對是否仍營業。
