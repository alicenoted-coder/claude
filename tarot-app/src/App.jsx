import { useState } from "react";

// ============== 牌組資料 ==============
const majorArcana = [
  { num: 0, zh: "愚者", en: "The Fool", roman: "0" },
  { num: 1, zh: "魔術師", en: "The Magician", roman: "I" },
  { num: 2, zh: "女祭司", en: "The High Priestess", roman: "II" },
  { num: 3, zh: "皇后", en: "The Empress", roman: "III" },
  { num: 4, zh: "皇帝", en: "The Emperor", roman: "IV" },
  { num: 5, zh: "教皇", en: "The Hierophant", roman: "V" },
  { num: 6, zh: "戀人", en: "The Lovers", roman: "VI" },
  { num: 7, zh: "戰車", en: "The Chariot", roman: "VII" },
  { num: 8, zh: "力量", en: "Strength", roman: "VIII" },
  { num: 9, zh: "隱者", en: "The Hermit", roman: "IX" },
  { num: 10, zh: "命運之輪", en: "Wheel of Fortune", roman: "X" },
  { num: 11, zh: "正義", en: "Justice", roman: "XI" },
  { num: 12, zh: "吊人", en: "The Hanged Man", roman: "XII" },
  { num: 13, zh: "死神", en: "Death", roman: "XIII" },
  { num: 14, zh: "節制", en: "Temperance", roman: "XIV" },
  { num: 15, zh: "惡魔", en: "The Devil", roman: "XV" },
  { num: 16, zh: "高塔", en: "The Tower", roman: "XVI" },
  { num: 17, zh: "星星", en: "The Star", roman: "XVII" },
  { num: 18, zh: "月亮", en: "The Moon", roman: "XVIII" },
  { num: 19, zh: "太陽", en: "The Sun", roman: "XIX" },
  { num: 20, zh: "審判", en: "Judgement", roman: "XX" },
  { num: 21, zh: "世界", en: "The World", roman: "XXI" },
].map((c) => ({ ...c, arcana: "major" }));

const suits = [
  { id: "wands", zh: "權杖", en: "Wands", symbol: "△" },
  { id: "cups", zh: "聖杯", en: "Cups", symbol: "▽" },
  { id: "swords", zh: "寶劍", en: "Swords", symbol: "✶" },
  { id: "pentacles", zh: "錢幣", en: "Pentacles", symbol: "◈" },
];

const ranks = [
  { id: "ace", zh: "王牌", en: "Ace", roman: "I" },
  { id: "2", zh: "二", en: "Two", roman: "II" },
  { id: "3", zh: "三", en: "Three", roman: "III" },
  { id: "4", zh: "四", en: "Four", roman: "IV" },
  { id: "5", zh: "五", en: "Five", roman: "V" },
  { id: "6", zh: "六", en: "Six", roman: "VI" },
  { id: "7", zh: "七", en: "Seven", roman: "VII" },
  { id: "8", zh: "八", en: "Eight", roman: "VIII" },
  { id: "9", zh: "九", en: "Nine", roman: "IX" },
  { id: "10", zh: "十", en: "Ten", roman: "X" },
  { id: "page", zh: "侍者", en: "Page", roman: "P" },
  { id: "knight", zh: "騎士", en: "Knight", roman: "Kn" },
  { id: "queen", zh: "皇后", en: "Queen", roman: "Q" },
  { id: "king", zh: "國王", en: "King", roman: "K" },
];

const minorArcana = suits.flatMap((s) =>
  ranks.map((r) => ({
    zh: `${s.zh}${r.zh}`,
    en: `${r.en} of ${s.en}`,
    roman: r.roman,
    suitSymbol: s.symbol,
    suitZh: s.zh,
    arcana: "minor",
  }))
);

const ALL_CARDS = [...majorArcana, ...minorArcana];

const lenormandDeck = [
  { num: 1, roman: "1", zh: "騎士", en: "Rider" },
  { num: 2, roman: "2", zh: "三葉草", en: "Clover" },
  { num: 3, roman: "3", zh: "船", en: "Ship" },
  { num: 4, roman: "4", zh: "房屋", en: "House" },
  { num: 5, roman: "5", zh: "樹", en: "Tree" },
  { num: 6, roman: "6", zh: "雲", en: "Clouds" },
  { num: 7, roman: "7", zh: "蛇", en: "Snake" },
  { num: 8, roman: "8", zh: "棺材", en: "Coffin" },
  { num: 9, roman: "9", zh: "花束", en: "Bouquet" },
  { num: 10, roman: "10", zh: "鐮刀", en: "Scythe" },
  { num: 11, roman: "11", zh: "鞭子", en: "Whip" },
  { num: 12, roman: "12", zh: "鳥", en: "Birds" },
  { num: 13, roman: "13", zh: "小孩", en: "Child" },
  { num: 14, roman: "14", zh: "狐狸", en: "Fox" },
  { num: 15, roman: "15", zh: "熊", en: "Bear" },
  { num: 16, roman: "16", zh: "星星", en: "Stars" },
  { num: 17, roman: "17", zh: "鸛鳥", en: "Stork" },
  { num: 18, roman: "18", zh: "狗", en: "Dog" },
  { num: 19, roman: "19", zh: "塔", en: "Tower" },
  { num: 20, roman: "20", zh: "花園", en: "Garden" },
  { num: 21, roman: "21", zh: "山", en: "Mountain" },
  { num: 22, roman: "22", zh: "十字路口", en: "Crossroads" },
  { num: 23, roman: "23", zh: "老鼠", en: "Mice" },
  { num: 24, roman: "24", zh: "心", en: "Heart" },
  { num: 25, roman: "25", zh: "戒指", en: "Ring" },
  { num: 26, roman: "26", zh: "書", en: "Book" },
  { num: 27, roman: "27", zh: "信", en: "Letter" },
  { num: 28, roman: "28", zh: "男人", en: "Man" },
  { num: 29, roman: "29", zh: "女人", en: "Woman" },
  { num: 30, roman: "30", zh: "百合", en: "Lily" },
  { num: 31, roman: "31", zh: "太陽", en: "Sun" },
  { num: 32, roman: "32", zh: "月亮", en: "Moon" },
  { num: 33, roman: "33", zh: "鑰匙", en: "Key" },
  { num: 34, roman: "34", zh: "魚", en: "Fish" },
  { num: 35, roman: "35", zh: "錨", en: "Anchor" },
  { num: 36, roman: "36", zh: "十字架", en: "Cross" },
].map((c) => ({ ...c, arcana: "lenormand" }));

// ============== 隨機性：CSPRNG + Fisher-Yates ==============
function secureRandomInt(max) {
  const arr = new Uint32Array(1);
  const limit = Math.floor(0xffffffff / max) * max;
  let r;
  do {
    crypto.getRandomValues(arr);
    r = arr[0];
  } while (r >= limit);
  return r % max;
}

function secureCoinFlip() {
  const arr = new Uint8Array(1);
  crypto.getRandomValues(arr);
  return arr[0] < 128;
}

function fisherYatesShuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ============== 預設牌陣 ==============
const PRESETS = [
  {
    id: "single",
    name: "單張指引",
    positions: [{ name: "當下指引", meaning: "此刻你最需要看見的訊息" }],
  },
  {
    id: "three-time",
    name: "時間三張",
    positions: [
      { name: "過去", meaning: "事件的根源、過往的影響" },
      { name: "現在", meaning: "當下的狀態、能量、選擇點" },
      { name: "未來", meaning: "若維持現在方向會走向何處" },
    ],
  },
  {
    id: "three-mind",
    name: "心智三張",
    positions: [
      { name: "想法", meaning: "你的理性層面與認知" },
      { name: "感受", meaning: "情緒、直覺、身體訊號" },
      { name: "行動", meaning: "可能或建議的行為方向" },
    ],
  },
  {
    id: "five",
    name: "決策五張",
    positions: [
      { name: "現況", meaning: "當下處境的本質" },
      { name: "選項 A", meaning: "其中一條路的能量與結果" },
      { name: "選項 B", meaning: "另一條路的能量與結果" },
      { name: "潛在阻礙", meaning: "你還沒看見的卡點" },
      { name: "建議方向", meaning: "牌陣綜合提示的傾向" },
    ],
  },
  {
    id: "celtic",
    name: "凱爾特十字",
    positions: [
      { name: "現況", meaning: "問題核心、當下狀態" },
      { name: "挑戰", meaning: "橫亙在前的阻礙或助力" },
      { name: "根基", meaning: "底層、潛意識基礎" },
      { name: "過去", meaning: "剛過去的影響、淡出的力量" },
      { name: "可能未來", meaning: "短期內的趨勢" },
      { name: "近期", meaning: "即將發生的事件能量" },
      { name: "自己", meaning: "你的態度與位置" },
      { name: "外在", meaning: "他人、環境給的影響" },
      { name: "希望或恐懼", meaning: "你內在的渴望與害怕" },
      { name: "最終結果", meaning: "若不偏離當前路徑的結果" },
    ],
  },
];

// ============== Parser ==============
function parseLayoutText(text) {
  const result = {
    layoutName: "",
    question: "",
    positions: [],
    layoutMeta: "",
    diagnostics: [],
    optionalCount: 0,
  };

  if (!text || !text.trim()) {
    result.diagnostics.push("文字為空");
    return result;
  }

  // === 1. 牌陣名 ===
  const nameByKeyword = text.match(
    /^[\s#>*]*[A-Za-z0-9]*[.)、]?\s*([^\n]*牌陣[^\n（()]*?)\s*(?:[（(]\s*\d+\s*張?\s*[)）])?\s*$/m
  );
  if (nameByKeyword) {
    result.layoutName = nameByKeyword[1].trim().replace(/^[#\s]+/, "");
  }

  // === 2. 默念問句 ===
  // 多種格式都支援：【問題】、Q:、問題:、想問:、問句\n
  const questionPatterns = [
    // 【問題】 內容 / 【問句】 內容（同行）
    /【\s*(?:默念問句|問題|問句|想問|問)\s*】\s*[:：]?\s*([^\n]+)/,
    // Q: / 問: / 問題: / 想問:（同行）
    /(?:^|\n)\s*(?:Q|問|問題|問句|默念問句|想問|想問的)\s*[:：]\s*([^\n]+)/,
    // 「問句：」換行後內容
    /(?:默念問句|問句|問題)\s*[:：]\s*\n+([\s\S]*?)(?=\n\s*(?:牌陣位置|位置\s*[:：]|這個牌陣|牌陣特性|會給你什麼|解讀指示|\d+\s*張)|$)/,
  ];
  for (const p of questionPatterns) {
    const m = text.match(p);
    if (m) {
      result.question = m[1]
        .trim()
        .replace(/^[「『"'"]+/, "")
        .replace(/[」』"'"]+$/, "")
        .trim();
      break;
    }
  }

  // === 3. 位置（含可選位置識別）===
  function scanPositions(block) {
    const lines = block.split("\n");
    const candidates = [];
    let isOptionalSection = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      if (/^[|\-:\s]+$/.test(line)) continue;
      if (/位置/.test(line) && /意義/.test(line) && !/^\s*\|?\s*\d/.test(line))
        continue;

      // 「可選」段落 marker
      if (
        /(?:可選|可以加|再深一點|想再深|想加|進階|加碼|延伸|另外可加)/.test(
          line
        ) &&
        !/^\s*\d/.test(line) &&
        !/^\|/.test(line)
      ) {
        isOptionalSection = true;
        continue;
      }

      // Markdown table: | 1 | xxx | yyy |
      const md = line.match(
        /^\|?\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*(.+?)\s*\|?\s*$/
      );
      if (md) {
        candidates.push({
          num: parseInt(md[1], 10),
          name: md[2].trim(),
          meaning: md[3].trim(),
          optional: isOptionalSection,
        });
        continue;
      }

      // Plain: 1. xxx — yyy / \t1.\txxx——yyy / 1) xxx: yyy / 1、xxx – yyy
      const plain = line.match(
        /^\s*(\d+)\s*[.)、\s\t]\s*([^—\-–:：\t]+?)\s*[—\-–:：]{1,3}\s*(.+)$/
      );
      if (plain) {
        candidates.push({
          num: parseInt(plain[1], 10),
          name: plain[2].trim(),
          meaning: plain[3].trim(),
          optional: isOptionalSection,
        });
        continue;
      }

      // List: - xxx (yyy) / • xxx（yyy）
      const list = line.match(/^[-*•·]\s*([^(（]+?)\s*[（(](.+?)[）)]\s*$/);
      if (list) {
        candidates.push({
          num: candidates.length + 1,
          name: list[1].trim(),
          meaning: list[2].trim(),
          optional: isOptionalSection,
        });
      }
    }

    return candidates;
  }

  // 先試在「位置：」區段內找
  const tableSec = text.match(
    /(?:牌陣位置|位置)\s*[:：]\s*\n+([\s\S]*?)(?=\n\s*(?:這個牌陣|牌陣特性|會給你什麼|解讀指示)|$)/
  );
  let candidates = tableSec ? scanPositions(tableSec[1]) : [];

  // Fallback：沒抓到就全文掃
  if (candidates.length === 0) {
    candidates = scanPositions(text);
  }

  // 驗證：要同時有編號 1 和 2 才視為有效（防止單一假陽性）
  const nums = candidates.map((c) => c.num);
  if (nums.includes(1) && nums.includes(2)) {
    candidates.sort((a, b) => a.num - b.num);
    result.positions = candidates.map((c) => ({
      name: c.name,
      meaning: c.meaning,
    }));
    result.optionalCount = candidates.filter((c) => c.optional).length;
  }

  // === 4. 牌陣特性 ===
  const metaMatch = text.match(
    /(?:這個牌陣會給你什麼|牌陣特性|會給你什麼)\s*[:：]\s*\n+([\s\S]*?)(?=\n\s*(?:解讀指示|默念問句|牌陣位置|[A-Z]\s*\.)|$)/
  );
  if (metaMatch) {
    result.layoutMeta = metaMatch[1].trim();
  }

  // === 診斷 ===
  if (result.positions.length === 0) {
    result.diagnostics.push("未抓到位置，請手動填入或檢查格式");
  } else if (result.optionalCount > 0) {
    result.diagnostics.push(
      `抓到 ${result.positions.length} 個位置（含 ${result.optionalCount} 個延伸／可選，可手動刪除）`
    );
  } else {
    result.diagnostics.push(`抓到 ${result.positions.length} 個位置`);
  }
  if (!result.layoutName) result.diagnostics.push("未抓到牌陣名");
  if (!result.question) result.diagnostics.push("未抓到問句");

  return result;
}

// ============== 設計 token ==============
const C = {
  bg: "#1a1714",
  bg2: "#221e1a",
  bg3: "#2a241f",
  ink: "#ede4d3",
  inkMuted: "#8a7f73",
  paper: "#ede4d3",
  paperInk: "#2a2520",
  rule: "#4a4339",
  accent: "#8b3a2f",
  reversed: "#8b3a2f",
};

const FONT_DISPLAY =
  '"Cormorant Garamond", ui-serif, Georgia, "Times New Roman", serif';
const FONT_SANS = "ui-sans-serif, system-ui, -apple-system, sans-serif";
const FONT_MONO = 'ui-monospace, "SF Mono", Menlo, monospace';

// ============== 子元件 ==============
function TarotCard({ card }) {
  const isMajor = card.arcana === "major";
  return (
    <div
      style={{
        width: "min(180px, 46vw)",
        minHeight: "280px",
        background: C.paper,
        color: C.paperInk,
        border: `1px solid ${C.rule}`,
        padding: "14px",
        position: "relative",
        boxShadow:
          "0 1px 0 rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.35)",
      }}
    >
      {card.reversed && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            color: C.accent,
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: "0.18em",
            border: `1px solid ${C.accent}`,
            padding: "2px 6px",
          }}
        >
          ⟲ REV
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: FONT_MONO,
          fontSize: 10,
          letterSpacing: "0.18em",
          color: C.inkMuted,
          textTransform: "uppercase",
        }}
      >
        <span>{String(card.positionIdx + 1).padStart(2, "0")}</span>
        <span>{card.arcana === "lenormand" ? "LENORMAND" : isMajor ? "MAJOR" : `${card.suitZh}`}</span>
      </div>
      <div style={{ borderTop: `1px solid ${C.rule}`, margin: "10px 0" }} />
      <div style={{ textAlign: "center", paddingTop: 12 }}>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 60,
            lineHeight: 1,
            letterSpacing: "0.04em",
            transform: card.reversed ? "rotate(180deg)" : "none",
            display: "inline-block",
          }}
        >
          {card.roman}
        </div>
        <div
          style={{
            marginTop: 16,
            fontFamily: FONT_DISPLAY,
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: "0.02em",
          }}
        >
          {card.zh}
        </div>
        <div
          style={{
            marginTop: 2,
            fontFamily: FONT_DISPLAY,
            fontSize: 12,
            fontStyle: "italic",
            color: C.inkMuted,
          }}
        >
          {card.en}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: 14,
          right: 14,
        }}
      >
        <div style={{ borderTop: `1px solid ${C.rule}`, marginBottom: 8 }} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 13, color: C.paperInk, fontFamily: FONT_SANS }}>
            {card.position}
          </span>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              color: C.inkMuted,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {card.reversed ? "逆" : "正"}
          </span>
        </div>
      </div>
    </div>
  );
}

function PositionRow({ value, index, onChange, onRemove, canRemove }) {
  return (
    <div
      style={{
        border: `1px solid ${C.rule}`,
        padding: "8px 10px",
        marginBottom: 6,
        background: C.bg,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 11,
            color: C.inkMuted,
            letterSpacing: "0.1em",
            minWidth: 22,
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <input
          value={value.name}
          onChange={(e) => onChange(index, { ...value, name: e.target.value })}
          placeholder="位置名（例：內在動機）"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            borderBottom: `1px solid ${C.rule}`,
            color: C.ink,
            padding: "4px 0",
            fontSize: 13,
            fontFamily: FONT_SANS,
            outline: "none",
          }}
        />
        <button
          onClick={() => onRemove(index)}
          disabled={!canRemove}
          style={{
            background: "transparent",
            border: "none",
            color: canRemove ? C.inkMuted : "#3a3530",
            cursor: canRemove ? "pointer" : "not-allowed",
            fontSize: 18,
            padding: 4,
          }}
          aria-label="刪除位置"
        >
          ×
        </button>
      </div>
      <input
        value={value.meaning}
        onChange={(e) => onChange(index, { ...value, meaning: e.target.value })}
        placeholder="意義（給 AI 解讀的脈絡）"
        style={{
          width: "calc(100% - 30px)",
          marginLeft: 30,
          background: "transparent",
          border: "none",
          color: C.inkMuted,
          padding: "2px 0",
          fontSize: 12,
          fontFamily: FONT_SANS,
          fontStyle: "italic",
          outline: "none",
        }}
      />
    </div>
  );
}

// ============== 主元件 ==============
export default function TarotApp() {
  const [layoutName, setLayoutName] = useState("");
  const [question, setQuestion] = useState("");
  const [positions, setPositions] = useState([
    { name: "當下指引", meaning: "此刻你最需要看見的訊息" },
  ]);
  const [layoutMeta, setLayoutMeta] = useState("");
  const [instructions, setInstructions] = useState("");
  const [includeReversed, setIncludeReversed] = useState(true);
  const [deckScope, setDeckScope] = useState("all");

  const [pasteText, setPasteText] = useState("");
  const [parseResult, setParseResult] = useState(null);
  const [pasteOpen, setPasteOpen] = useState(true);

  const [drawnCards, setDrawnCards] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

  const applyPreset = (preset) => {
    setLayoutName(preset.name);
    setPositions(preset.positions.map((p) => ({ ...p })));
    setDrawnCards([]);
  };

  const handleParseAndApply = () => {
    const r = parseLayoutText(pasteText);
    setParseResult(r);
    if (r.layoutName) setLayoutName(r.layoutName);
    if (r.question) setQuestion(r.question);
    if (r.positions.length > 0) setPositions(r.positions);
    if (r.layoutMeta) setLayoutMeta(r.layoutMeta);
    setDrawnCards([]);
  };

  const clearPaste = () => {
    setPasteText("");
    setParseResult(null);
  };

  const addPosition = () => {
    setPositions([
      ...positions,
      { name: `位置 ${positions.length + 1}`, meaning: "" },
    ]);
  };

  const updatePosition = (i, newValue) => {
    const next = [...positions];
    next[i] = newValue;
    setPositions(next);
  };

  const removePosition = (i) => {
    if (positions.length <= 1) return;
    setPositions(positions.filter((_, idx) => idx !== i));
  };

  const drawCards = () => {
    if (positions.length === 0 || isDrawing) return;
    const pool =
      deckScope === "lenormand"
        ? lenormandDeck
        : deckScope === "major"
        ? majorArcana
        : deckScope === "minor"
        ? minorArcana
        : ALL_CARDS;
    if (pool.length < positions.length) {
      alert(`牌池只有 ${pool.length} 張，無法抽 ${positions.length} 張。`);
      return;
    }
    setIsDrawing(true);
    setDrawnCards([]);
    const shuffled = fisherYatesShuffle(pool);
    const drawn = shuffled.slice(0, positions.length).map((card, i) => ({
      ...card,
      reversed: includeReversed && secureCoinFlip(),
      position: positions[i].name,
      positionMeaning: positions[i].meaning,
      positionIdx: i,
    }));
    drawn.forEach((card, i) => {
      setTimeout(() => {
        setDrawnCards((prev) => [...prev, card]);
        if (i === drawn.length - 1) setIsDrawing(false);
      }, 220 * (i + 1));
    });
  };

  const exportPrompt = () => {
    if (drawnCards.length === 0) return;
    const lines = [];
    lines.push("我抽了一個塔羅牌陣，請幫我解讀。");
    lines.push("");
    lines.push(`【牌陣】${layoutName || "（未命名）"}`);
    lines.push("");
    lines.push("【默念問句】");
    lines.push(question || "（未填）");
    lines.push("");
    lines.push("【位置設計】");
    positions.forEach((p, i) => {
      lines.push(`${i + 1}. ${p.name}${p.meaning ? ` — ${p.meaning}` : ""}`);
    });
    lines.push("");
    if (layoutMeta) {
      lines.push("【牌陣特性】");
      lines.push(layoutMeta);
      lines.push("");
    }
    lines.push("【抽牌結果】");
    drawnCards.forEach((c) => {
      lines.push(
        `${c.positionIdx + 1}. ${c.position}：${c.zh}（${
          c.reversed ? "逆位" : "正位"
        }） / ${c.en}`
      );
    });
    lines.push("");
    lines.push("【解讀指示】");
    lines.push(instructions || "（未填）");
    const text = lines.join("\n");

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => {
          setCopyStatus("已複製到剪貼簿");
          setTimeout(() => setCopyStatus(""), 2500);
        },
        () => {
          setCopyStatus("複製失敗");
          setTimeout(() => setCopyStatus(""), 2500);
        }
      );
    }
  };

  // ===== 樣式 =====
  const labelStyle = {
    fontFamily: FONT_MONO,
    fontSize: 10,
    letterSpacing: "0.2em",
    color: C.inkMuted,
    textTransform: "uppercase",
    display: "block",
    marginBottom: 8,
  };

  const inputStyle = {
    width: "100%",
    background: C.bg,
    border: `1px solid ${C.rule}`,
    color: C.ink,
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: FONT_SANS,
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
  };

  const chipBase = {
    fontFamily: FONT_SANS,
    fontSize: 12,
    padding: "6px 12px",
    border: `1px solid ${C.rule}`,
    background: "transparent",
    color: C.ink,
    cursor: "pointer",
    letterSpacing: "0.02em",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.ink,
        fontFamily: FONT_SANS,
        padding: "24px 16px 80px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* ============ HEADER ============ */}
        <header style={{ marginBottom: 32 }}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              letterSpacing: "0.3em",
              color: C.inkMuted,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            personal tarot · 私用抽牌工作台
          </div>
          <h1
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: "clamp(36px, 6vw, 56px)",
              fontWeight: 500,
              letterSpacing: "0.02em",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            設下問題，<span style={{ fontStyle: "italic", color: C.accent }}>洗牌</span>
            ，<br />
            讓牌陣回答你。
          </h1>
          <div
            style={{
              marginTop: 12,
              maxWidth: 560,
              fontSize: 13,
              color: C.inkMuted,
              lineHeight: 1.6,
            }}
          >
            貼上 AI 設計好的牌陣 → 自動填入 → 抽牌 → 匯出 prompt 給 AI 解讀。
          </div>
        </header>

        <div
          className="tarot-main-grid"
          style={{ display: "grid", gap: 32 }}
        >
          <style>{`
            @media (min-width: 900px) {
              .tarot-main-grid {
                grid-template-columns: 5fr 7fr;
                align-items: start;
              }
            }
          `}</style>

          {/* ============ 左：設定區 ============ */}
          <section
            style={{
              border: `1px solid ${C.rule}`,
              padding: 20,
              background: C.bg2,
            }}
          >
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 10,
                letterSpacing: "0.3em",
                color: C.accent,
                textTransform: "uppercase",
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: `1px solid ${C.rule}`,
              }}
            >
              — i — 你的輸入
            </div>

            {/* === 貼上解析區 === */}
            <div
              style={{
                background: C.bg3,
                border: `1px dashed ${C.accent}`,
                padding: 14,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                  cursor: "pointer",
                }}
                onClick={() => setPasteOpen(!pasteOpen)}
              >
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    color: C.accent,
                    textTransform: "uppercase",
                  }}
                >
                  ⚡ Quick Paste · 從文字解析
                </div>
                <span style={{ color: C.inkMuted, fontSize: 14 }}>
                  {pasteOpen ? "−" : "+"}
                </span>
              </div>

              {pasteOpen && (
                <>
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={`把 AI 設計的牌陣整段貼進來，例如：

A. 動機三角牌陣（3張）

默念問句：
「allen 當初在跟我相處時，他的內在動機、外在壓力、與真實渴望是什麼？」

牌陣位置：
| # | 位置 | 意義 |
| 1 | 內在動機 | 他內心驅動行為的核心原因 |
| 2 | 外在壓力 | 環境、現實、其他人對他的期待 |
| 3 | 真實渴望 | 他真正想要的（可能跟動機不同）|

這個牌陣會給你什麼：
• 純粹聚焦在「他當時的狀態」
• 三張牌之間的張力會說話`}
                    rows={8}
                    style={{
                      ...inputStyle,
                      fontFamily: FONT_MONO,
                      fontSize: 12,
                      background: C.bg,
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={handleParseAndApply}
                      disabled={!pasteText.trim()}
                      style={{
                        ...chipBase,
                        background: C.accent,
                        color: C.ink,
                        border: "none",
                        padding: "8px 14px",
                        fontWeight: 600,
                        opacity: pasteText.trim() ? 1 : 0.4,
                        cursor: pasteText.trim() ? "pointer" : "not-allowed",
                      }}
                    >
                      ⟶ 解析填入
                    </button>
                    <button onClick={clearPaste} style={chipBase}>
                      清空
                    </button>
                  </div>

                  {parseResult && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 10,
                        background: C.bg,
                        border: `1px solid ${C.rule}`,
                        fontFamily: FONT_MONO,
                        fontSize: 11,
                        color: C.inkMuted,
                        lineHeight: 1.7,
                      }}
                    >
                      {parseResult.diagnostics.map((d, i) => {
                        const ok = d.startsWith("抓到");
                        return (
                          <div
                            key={i}
                            style={{
                              color: ok ? "#a8c896" : C.inkMuted,
                            }}
                          >
                            {ok ? "✓" : "·"} {d}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* === 牌陣名 === */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>牌陣名</label>
              <input
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                placeholder="例：動機三角牌陣"
                style={{ ...inputStyle, padding: "8px 12px" }}
              />
            </div>

            {/* === 默念問句 === */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>默念問句</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="你心裡要問的問題（具體會比模糊好）"
                rows={3}
                style={inputStyle}
              />
            </div>

            {/* === 預設快選 === */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>套用內建範例</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p)}
                    style={chipBase}
                  >
                    {p.name}
                    <span
                      style={{
                        marginLeft: 6,
                        color: C.inkMuted,
                        fontFamily: FONT_MONO,
                        fontSize: 10,
                      }}
                    >
                      ·{p.positions.length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* === 位置 === */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>位置 ({positions.length})</label>
              {positions.map((pos, i) => (
                <PositionRow
                  key={i}
                  value={pos}
                  index={i}
                  onChange={updatePosition}
                  onRemove={removePosition}
                  canRemove={positions.length > 1}
                />
              ))}
              <button
                onClick={addPosition}
                style={{
                  ...chipBase,
                  width: "100%",
                  marginTop: 4,
                  padding: "8px",
                  color: C.inkMuted,
                  borderStyle: "dashed",
                }}
              >
                ＋ 新增位置
              </button>
            </div>

            {/* === 牌陣特性 === */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>牌陣特性（選填）</label>
              <textarea
                value={layoutMeta}
                onChange={(e) => setLayoutMeta(e.target.value)}
                placeholder="這個牌陣會給你什麼／怎麼讀／注意事項"
                rows={3}
                style={inputStyle}
              />
            </div>

            {/* === 卡組範圍 === */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>卡組範圍</label>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { id: "all", name: "完整 78" },
                  { id: "major", name: "大 22" },
                  { id: "minor", name: "小 56" },
                ].map((opt) => {
                  const active = deckScope === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setDeckScope(opt.id)}
                      style={{
                        ...chipBase,
                        flex: 1,
                        background: active ? C.ink : "transparent",
                        color: active ? C.bg : C.ink,
                        borderColor: active ? C.ink : C.rule,
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      {opt.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* === 逆位 === */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={includeReversed}
                  onChange={(e) => setIncludeReversed(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: C.accent }}
                />
                <span style={{ fontSize: 13 }}>包含逆位</span>
                <span
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 10,
                    color: C.inkMuted,
                    letterSpacing: "0.1em",
                  }}
                >
                  REVERSED · 50%
                </span>
              </label>
            </div>

            {/* === 解讀指示 === */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>解讀指示（給 AI 看）</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="例：聚焦在工作面向／用 Rider-Waite 體系／給我具體下一步行動"
                rows={3}
                style={inputStyle}
              />
            </div>

            <button
              onClick={drawCards}
              disabled={isDrawing}
              style={{
                width: "100%",
                background: C.accent,
                color: C.ink,
                border: "none",
                padding: "14px 16px",
                fontFamily: FONT_DISPLAY,
                fontSize: 18,
                letterSpacing: "0.2em",
                cursor: isDrawing ? "wait" : "pointer",
                textTransform: "uppercase",
                opacity: isDrawing ? 0.6 : 1,
              }}
            >
              {isDrawing
                ? "翻牌中…"
                : drawnCards.length > 0
                ? "再抽一次"
                : "洗牌・抽牌"}
            </button>
          </section>

          {/* ============ 右：結果區 ============ */}
          <section style={{ minHeight: 480 }}>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 10,
                letterSpacing: "0.3em",
                color: C.accent,
                textTransform: "uppercase",
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: `1px solid ${C.rule}`,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>— ii — 牌陣回應</span>
              {drawnCards.length > 0 && (
                <span style={{ color: C.inkMuted }}>
                  {drawnCards.length} / {positions.length}
                </span>
              )}
            </div>

            {layoutName && drawnCards.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: 24,
                    fontWeight: 500,
                    letterSpacing: "0.02em",
                  }}
                >
                  {layoutName}
                </div>
              </div>
            )}

            {drawnCards.length === 0 && !isDrawing && (
              <div
                style={{
                  minHeight: 320,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px dashed ${C.rule}`,
                  color: C.inkMuted,
                  padding: 32,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: 80,
                    color: C.rule,
                    lineHeight: 1,
                    marginBottom: 16,
                  }}
                >
                  ✶
                </div>
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: 20,
                    fontStyle: "italic",
                    marginBottom: 6,
                  }}
                >
                  準備就緒
                </div>
                <div style={{ fontSize: 13 }}>
                  貼上牌陣或填好設定，按下「洗牌・抽牌」。
                </div>
              </div>
            )}

            {(drawnCards.length > 0 || isDrawing) && (
              <>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 16,
                    justifyContent: "flex-start",
                    marginBottom: 24,
                  }}
                >
                  {drawnCards.map((c) => (
                    <TarotCard key={c.positionIdx} card={c} />
                  ))}
                </div>

                {drawnCards.length === positions.length && (
                  <div
                    style={{
                      borderTop: `1px solid ${C.rule}`,
                      paddingTop: 20,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <button
                      onClick={exportPrompt}
                      style={{
                        background: C.ink,
                        color: C.bg,
                        border: "none",
                        padding: "10px 18px",
                        fontFamily: FONT_SANS,
                        fontSize: 13,
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                        cursor: "pointer",
                      }}
                    >
                      匯出 Prompt → 複製到剪貼簿
                    </button>
                    <button
                      onClick={() => setDrawnCards([])}
                      style={{ ...chipBase, padding: "10px 18px" }}
                    >
                      清空結果
                    </button>
                    {copyStatus && (
                      <span
                        style={{
                          fontFamily: FONT_MONO,
                          fontSize: 11,
                          color: C.accent,
                          letterSpacing: "0.1em",
                        }}
                      >
                        ✓ {copyStatus}
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        <footer
          style={{
            marginTop: 64,
            paddingTop: 24,
            borderTop: `1px solid ${C.rule}`,
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: "0.2em",
            color: C.inkMuted,
            textTransform: "uppercase",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span>private use · v0.2 · quick paste</span>
          <span>78 cards · entropy: system</span>
        </footer>
      </div>
    </div>
  );
}
