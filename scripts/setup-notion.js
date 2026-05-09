#!/usr/bin/env node
/**
 * 茶水間の第二大腦 - PARA System Notion Setup Script
 *
 * Usage:
 *   NOTION_TOKEN=secret_xxx NOTION_PARENT_PAGE_ID=yyy node scripts/setup-notion.js
 *
 * Prerequisites:
 *   1. Create a Notion integration at https://www.notion.so/my-integrations
 *   2. Copy the "Internal Integration Secret" as NOTION_TOKEN
 *   3. Create or open a Notion page where everything will be built
 *   4. Share that page with your integration (... > Connections > your integration)
 *   5. Copy the page ID from the URL (32-char hex after the last dash) as NOTION_PARENT_PAGE_ID
 */

const { Client } = require("@notionhq/client");

const TOKEN = process.env.NOTION_TOKEN;
const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID;

if (!TOKEN || !PARENT_PAGE_ID) {
  console.error(
    "Missing required env vars: NOTION_TOKEN and NOTION_PARENT_PAGE_ID"
  );
  process.exit(1);
}

const notion = new Client({ auth: TOKEN });

// ─── helpers ────────────────────────────────────────────────────────────────

const rt = (text, opts = {}) => ({
  type: "text",
  text: { content: text, link: null },
  annotations: {
    bold: opts.bold ?? false,
    italic: opts.italic ?? false,
    strikethrough: false,
    underline: false,
    code: false,
    color: opts.color ?? "default",
  },
});

const heading2 = (text, color = "default") => ({
  type: "heading_2",
  heading_2: {
    rich_text: [rt(text, { color })],
    color,
    is_toggleable: false,
  },
});

const heading3 = (text) => ({
  type: "heading_3",
  heading_3: { rich_text: [rt(text)], is_toggleable: false },
});

const para = (text) => ({
  type: "paragraph",
  paragraph: { rich_text: [rt(text)] },
});

const bullet = (text, color = "default") => ({
  type: "bulleted_list_item",
  bulleted_list_item: { rich_text: [rt(text)], color },
});

const numbered = (text) => ({
  type: "numbered_list_item",
  numbered_list_item: { rich_text: [rt(text)] },
});

const divider = () => ({ type: "divider", divider: {} });

const callout = (text, emoji = "💡") => ({
  type: "callout",
  callout: {
    rich_text: [rt(text)],
    icon: { type: "emoji", emoji },
    color: "gray_background",
  },
});

const toggle = (text, children = []) => ({
  type: "toggle",
  toggle: {
    rich_text: [rt(text, { bold: true })],
    children,
  },
});

// ─── database schemas ────────────────────────────────────────────────────────

async function createAreaDB(parentPageId) {
  console.log("  Creating Area (領域) database…");
  const db = await notion.databases.create({
    parent: { type: "page_id", page_id: parentPageId },
    icon: { type: "emoji", emoji: "📊" },
    title: [{ type: "text", text: { content: "Area · 領域" } }],
    properties: {
      Name: { title: {} },
      "核心念念 / 精神語錄": { rich_text: {} },
      "完成率 (%)": { number: { format: "percent" } },
      "執行中專案": { number: { format: "number" } },
      "待辦總覽": { number: { format: "number" } },
    },
  });
  return db.id;
}

async function createProjectDB(parentPageId, areaDbId) {
  console.log("  Creating Project (專案) database…");
  const db = await notion.databases.create({
    parent: { type: "page_id", page_id: parentPageId },
    icon: { type: "emoji", emoji: "📋" },
    title: [{ type: "text", text: { content: "Project · 專案" } }],
    properties: {
      Name: { title: {} },
      "專案目標": { rich_text: {} },
      Status: {
        select: {
          options: [
            { name: "Inbox", color: "blue" },
            { name: "Planned", color: "green" },
            { name: "In Progress", color: "yellow" },
            { name: "Completed", color: "purple" },
          ],
        },
      },
      Area: {
        relation: {
          database_id: areaDbId,
          single_property: {},
        },
      },
      "截止日期": { date: {} },
    },
  });
  return db.id;
}

async function createTaskDB(parentPageId, projectDbId) {
  console.log("  Creating Task (任務) database…");
  const db = await notion.databases.create({
    parent: { type: "page_id", page_id: parentPageId },
    icon: { type: "emoji", emoji: "✅" },
    title: [{ type: "text", text: { content: "Task · 任務" } }],
    properties: {
      Name: { title: {} },
      Status: {
        select: {
          options: [
            { name: "未開始", color: "gray" },
            { name: "進行中", color: "blue" },
            { name: "指派", color: "orange" },
            { name: "完成", color: "green" },
            { name: "未完成", color: "red" },
          ],
        },
      },
      Priority: {
        select: {
          options: [
            { name: "重要・緊急", color: "red" },
            { name: "重要・不緊急", color: "yellow" },
            { name: "不重要・緊急", color: "green" },
            { name: "不重要・不緊急", color: "blue" },
          ],
        },
      },
      Project: {
        relation: {
          database_id: projectDbId,
          single_property: {},
        },
      },
      "截止日期": { date: {} },
      "負責人": { rich_text: {} },
      "備註": { rich_text: {} },
    },
  });
  return db.id;
}

async function createResourceDB(parentPageId, projectDbId) {
  console.log("  Creating Resource (資源) database…");
  const db = await notion.databases.create({
    parent: { type: "page_id", page_id: parentPageId },
    icon: { type: "emoji", emoji: "💎" },
    title: [{ type: "text", text: { content: "Resource · 資源" } }],
    properties: {
      Name: { title: {} },
      "分類": {
        select: {
          options: [
            { name: "會議記錄", color: "orange" },
            { name: "合作對象", color: "green" },
            { name: "參考資料", color: "gray" },
            { name: "專案需求", color: "brown" },
            { name: "帳號密碼", color: "yellow" },
            { name: "學習筆記", color: "blue" },
            { name: "個人專用", color: "purple" },
          ],
        },
      },
      Project: {
        relation: {
          database_id: projectDbId,
          single_property: {},
        },
      },
      "日期": { date: {} },
      "標籤": { multi_select: { options: [] } },
    },
  });
  return db.id;
}

async function createArchiveDB(parentPageId) {
  console.log("  Creating Archive (歸檔) database…");
  const db = await notion.databases.create({
    parent: { type: "page_id", page_id: parentPageId },
    icon: { type: "emoji", emoji: "🗃️" },
    title: [{ type: "text", text: { content: "Archive · 歸檔" } }],
    properties: {
      Name: { title: {} },
      "類型": {
        select: {
          options: [
            { name: "專案", color: "blue" },
            { name: "活動", color: "green" },
            { name: "資源", color: "orange" },
            { name: "其他", color: "gray" },
          ],
        },
      },
      "歸檔日期": { date: {} },
      "備註": { rich_text: {} },
    },
  });
  return db.id;
}

// ─── seed data ───────────────────────────────────────────────────────────────

async function seedAreas(areaDbId) {
  console.log("  Seeding Area records…");
  const areas = [
    { name: "品牌與內容 (Brand & Content)", rate: 0.25 },
    { name: "廣告與增長 (Ads & Growth)", rate: 0.4 },
    { name: "活動與合作 (Events & Partnership)", rate: 0.25 },
    { name: "學習與研究 (Learning & R&D)", rate: 0.6 },
    { name: "行政與管理 (Admin & Ops)", rate: 0.8 },
  ];
  const ids = {};
  for (const a of areas) {
    const page = await notion.pages.create({
      parent: { database_id: areaDbId },
      properties: {
        Name: { title: [{ text: { content: a.name } }] },
        "完成率 (%)": { number: a.rate },
      },
    });
    ids[a.name] = page.id;
  }
  return ids;
}

async function seedProjects(projectDbId, areaIds) {
  console.log("  Seeding Project records…");
  const areaKeys = Object.keys(areaIds);
  const projects = [
    {
      name: "地瓜百貨快閃",
      status: "In Progress",
      area: areaKeys.find((k) => k.includes("活動")),
    },
    {
      name: "2026 第二期新人訓練",
      status: "In Progress",
      area: areaKeys.find((k) => k.includes("行政")),
    },
    {
      name: "部門 AI 學習導入",
      status: "Planned",
      area: areaKeys.find((k) => k.includes("學習")),
    },
  ];
  const ids = {};
  for (const p of projects) {
    const props = {
      Name: { title: [{ text: { content: p.name } }] },
      Status: { select: { name: p.status } },
    };
    if (p.area && areaIds[p.area]) {
      props["Area"] = { relation: [{ id: areaIds[p.area] }] };
    }
    const page = await notion.pages.create({
      parent: { database_id: projectDbId },
      properties: props,
    });
    ids[p.name] = page.id;
  }
  return ids;
}

async function seedTasks(taskDbId, projectIds) {
  console.log("  Seeding Task records…");
  const tasks = [
    {
      name: "活動規劃",
      status: "未開始",
      priority: "重要・緊急",
      project: "地瓜百貨快閃",
    },
    {
      name: "場地佈置",
      status: "未開始",
      priority: "重要・緊急",
      project: "地瓜百貨快閃",
    },
    {
      name: "器材清點",
      status: "未開始",
      priority: "不重要・緊急",
      project: "地瓜百貨快閃",
    },
    {
      name: "安全演練",
      status: "指派",
      priority: "重要・不緊急",
      project: "地瓜百貨快閃",
    },
    {
      name: "線上說明會",
      status: "未開始",
      priority: "不重要・不緊急",
      project: "部門 AI 學習導入",
    },
    {
      name: "落地測試",
      status: "未開始",
      priority: "不重要・不緊急",
      project: "部門 AI 學習導入",
    },
    {
      name: "植時與復盤",
      status: "未開始",
      priority: "不重要・不緊急",
      project: "部門 AI 學習導入",
    },
    {
      name: "新人訓練",
      status: "未開始",
      priority: "重要・緊急",
      project: "2026 第二期新人訓練",
    },
    {
      name: "行政與管理",
      status: "未開始",
      priority: "重要・不緊急",
      project: "2026 第二期新人訓練",
    },
  ];
  for (const t of tasks) {
    const props = {
      Name: { title: [{ text: { content: t.name } }] },
      Status: { select: { name: t.status } },
      Priority: { select: { name: t.priority } },
    };
    const projectId = projectIds[t.project];
    if (projectId) {
      props["Project"] = { relation: [{ id: projectId }] };
    }
    await notion.pages.create({
      parent: { database_id: taskDbId },
      properties: props,
    });
  }
}

// ─── main page content ───────────────────────────────────────────────────────

async function buildMainPage(parentPageId, dbIds) {
  console.log("  Building main dashboard page…");

  const page = await notion.pages.create({
    parent: { type: "page_id", page_id: parentPageId },
    icon: { type: "emoji", emoji: "🧠" },
    cover: null,
    properties: {
      title: {
        title: [
          { text: { content: "茶水間の第二大腦 - 讓你準時下班的專案管理系統" } },
        ],
      },
    },
    children: [
      // Usage flow toggle
      toggle("▶ 使用流程", [
        numbered("新增任務時，先填 Task 資料庫，選擇 Project 與優先順序。"),
        numbered("新增專案時，填 Project 資料庫，關聯對應的 Area。"),
        numbered("Area 是長期維護的領域，不隨專案結束而消失。"),
        numbered("完成的 Project / 活動 → 搬到 Archive，保留歷史記錄。"),
        numbered("Resource 存放各種參考資料、會議記錄、帳號密碼等。"),
      ]),

      divider(),

      // Daily reminders
      heading2("每天看一眼，提醒自己不要迷路", "orange"),
      numbered("拒絕盲目體力活，只投產出比最高的戰場。"),
      numbered("封面與店員是第一門面，拒不住球就是無效產出。"),
      numbered("短影片不講廢話，三十秒內擊穿一個核心亮點。"),
      numbered("所有素材模組化，確保每次戰鬥都在累積系統資產。"),
      numbered("七日結案，即時覆盤，路不贏市場數據就重新組組。"),

      divider(),

      // Section header for databases
      heading2("📚 資料庫導覽"),
      para(
        "以下是本系統的五個核心資料庫，點擊前往對應資料庫頁面，或直接在下方視圖操作。"
      ),
      {
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            rt("✅ Task · 任務", { bold: true }),
            rt(" — 所有任務，含優先順序、狀態、關聯專案"),
          ],
        },
      },
      {
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            rt("💎 Resource · 資源", { bold: true }),
            rt(" — 會議記錄、參考資料、帳號密碼等"),
          ],
        },
      },
      {
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            rt("📋 Project · 專案", { bold: true }),
            rt(" — 專案目標、狀態、關聯領域"),
          ],
        },
      },
      {
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            rt("📊 Area · 領域", { bold: true }),
            rt(" — 五大長期維護領域"),
          ],
        },
      },
      {
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [
            rt("🗃️ Archive · 歸檔", { bold: true }),
            rt(" — 完成的專案與活動"),
          ],
        },
      },

      divider(),

      // Priority section
      heading2("🎯 優先順序 — 艾森豪 4 象限"),
      callout(
        "重要・緊急 → 馬上做　｜　重要・不緊急 → 排時間　｜　不重要・緊急 → 委派　｜　不重要・不緊急 → 不做",
        "⚡"
      ),

      divider(),

      // Area overview
      heading2("🗺 領域概況"),
      para(
        "五大領域：品牌與內容 / 廣告與增長 / 活動與合作 / 學習與研究 / 行政與管理"
      ),

      divider(),

      // Resource section
      heading2("📦 Resources 資源庫"),
      para(
        "7 個分類：會議記錄 · 合作對象 · 參考資料 · 專案需求 · 帳號密碼 · 學習筆記 · 個人專用"
      ),
      callout(
        "6 個 page template：MM-DD｜會議主題 / 合作對象 / 相關文件 / 學習資料 / 個人專用 / New Resource（空白）",
        "📝"
      ),

      divider(),

      // PARA structure explanation
      heading2("📐 PARA 串連結構"),
      toggle("A · 領域 (AREA)", [
        para(
          "填核心念念・精神語錄，自動算 5 個象限（完成率 / 執行中專案 / 待辦總覽 / 資源火庫 / 專案清單）"
        ),
        bullet("品牌與內容 (Brand & Content)  ▸ 完成率 25%"),
        bullet("廣告與增長 (Ads & Growth)  ▸ 完成率 40%"),
        bullet("活動與合作 (Events & Partnership)  ▸ 完成率 25%"),
        bullet("學習與研究 (Learning & R&D)  ▸ 完成率 60%"),
        bullet("行政與管理 (Admin & Ops)  ▸ 完成率 80%"),
      ]),
      toggle("P · 專案 (PROJECT)", [
        para(
          "填專案目標，一個 Project 只屬於一個 Area，Status 4 phase 看板，Progress 自動 rollup"
        ),
        bullet("Status: Inbox → Planned → In Progress → Completed"),
        bullet("Progress 進度條：從旗下 Task 完成度自動 rollup，不用手拉"),
      ]),
      toggle("T · 任務 (TASK) & R · 資源 (RESOURCE)", [
        para(
          "Task 跟 Resource 是同一層，都接在 Project 底下，Area 自動算（formula），不用手填"
        ),
        heading3("Task · 任務"),
        bullet("艾森豪 4 象限優先序：重要・緊急 / 重要・不緊急 / 不重要・緊急 / 不重要・不緊急"),
        bullet("5 個執行狀態：未開始 / 進行中 / 指派 / 完成 / 未完成"),
        bullet("「指派」= 要派給他人；「未完成」= 取消放棄"),
        heading3("Resource · 資源"),
        bullet("7 個分類：會議記錄 / 合作對象 / 參考資料 / 專案需求 / 帳號密碼 / 學習筆記 / 個人專用"),
        bullet("所有 Resource 透過「分類」屬性區分子類型"),
      ]),
      toggle("A · 歷史保留 (ARCHIVE)", [
        para(
          "完成的 Project / 結束的活動 / 離職同事 / 過期帳號 → 全移歸檔，不刪除，不汙染現在視線"
        ),
        bullet("半年後找古早資料、新人接手讀歷史、過去寄子流程當下次模板"),
      ]),
    ],
  });

  return page.id;
}

// ─── entry point ─────────────────────────────────────────────────────────────

async function main() {
  console.log("🧠 茶水間の第二大腦 — Notion Setup");
  console.log("====================================\n");

  try {
    // 1. Verify connection
    console.log("📡 Verifying Notion connection…");
    await notion.users.me();
    console.log("   ✓ Connected\n");

    // 2. Create databases (order matters due to relations)
    console.log("🗄  Creating databases…");
    const areaDbId = await createAreaDB(PARENT_PAGE_ID);
    const projectDbId = await createProjectDB(PARENT_PAGE_ID, areaDbId);
    const taskDbId = await createTaskDB(PARENT_PAGE_ID, projectDbId);
    const resourceDbId = await createResourceDB(PARENT_PAGE_ID, projectDbId);
    const archiveDbId = await createArchiveDB(PARENT_PAGE_ID);
    console.log("   ✓ All databases created\n");

    // 3. Seed sample data
    console.log("🌱 Seeding sample data…");
    const areaIds = await seedAreas(areaDbId);
    const projectIds = await seedProjects(projectDbId, areaIds);
    await seedTasks(taskDbId, projectIds);
    console.log("   ✓ Sample data seeded\n");

    // 4. Build main dashboard page
    console.log("🏗  Building main dashboard page…");
    const mainPageId = await buildMainPage(PARENT_PAGE_ID, {
      area: areaDbId,
      project: projectDbId,
      task: taskDbId,
      resource: resourceDbId,
      archive: archiveDbId,
    });
    console.log("   ✓ Main page created\n");

    console.log("✅ Setup complete!\n");
    console.log("Database IDs (save these if you need them later):");
    console.log(`  Area     : ${areaDbId}`);
    console.log(`  Project  : ${projectDbId}`);
    console.log(`  Task     : ${taskDbId}`);
    console.log(`  Resource : ${resourceDbId}`);
    console.log(`  Archive  : ${archiveDbId}`);
    console.log(`  Dashboard: ${mainPageId}`);
    console.log(
      `\n🔗 Open in Notion: https://www.notion.so/${mainPageId.replace(/-/g, "")}`
    );
    console.log("\n📌 Next steps in Notion:");
    console.log(
      "  1. Open the Dashboard page and add database views (Calendar, Kanban, etc.)"
    );
    console.log(
      "  2. Link the Task DB with a filtered view (group by Priority for 四象限)"
    );
    console.log("  3. Link the Area DB with a gallery view for 領域概況");
    console.log("  4. Add the Resource DB with a table view filtered by 分類");
  } catch (err) {
    console.error("\n❌ Error:", err.message);
    if (err.code === "unauthorized") {
      console.error(
        "   → Check your NOTION_TOKEN and make sure the integration is shared with the parent page."
      );
    }
    process.exit(1);
  }
}

main();
