import { useState } from "react";

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

const PRESETS = [
  { id: "single", name: "單張指引", positions: ["當下指引"] },
  { id: "three-time", name: "時間三張", positions: ["過去", "現在", "未來"] },
  { id: "three-mind", name: "心智三張", positions: ["想法", "感受", "行動"] },
  {
    id: "five",
    name: "決策五張",
    positions: ["現況", "選項 A", "選項 B", "潛在阻礙", "建議方向"],
  },
  {
    id: "celtic",
    name: "凱爾特十字",
    positions: [
      "現況", "挑戰", "根基", "過去", "可能未來",
      "近期", "自己", "外在", "希望或恐懼", "最終結果",
    ],
  },
];

const C = {
  bg: "#1a1714",
  bg2: "#221e1a",
  ink: "#ede4d3",
  inkMuted: "#8a7f73",
  paper: "#ede4d3",
  paperInk: "#2a2520",
  rule: "#4a4339",
  accent: "#8b3a2f",
};

const FONT_DISPLAY = '"Cormorant Garamond", ui-serif, Georgia, "Times New Roman", serif';
const FONT_SANS = "ui-sans-serif, system-ui, -apple-system, sans-serif";
const FONT_MONO = 'ui-monospace, "SF Mono", Menlo, monospace';

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
        boxShadow: "0 1px 0 rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.35)",
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
        <span>{isMajor ? "MAJOR" : card.suitZh}</span>
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

      <div style={{ position: "absolute", bottom: 12, left: 14, right: 14 }}>
        <div style={{ borderTop: `1px solid ${C.rule}`, marginBottom: 8 }} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: "0.12em",
            color: C.inkMuted,
            textTransform: "uppercase",
          }}
        >
          <span style={{ fontFamily: FONT_SANS, letterSpacing: 0, color: C.paperInk }}>
            {card.position}
          </span>
          <span>{card.reversed ? "逆" : "正"}</span>
        </div>
      </div>
    </div>
  );
}

function PositionRow({ value, index, onChange, onRemove, canRemove }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 11,
          color: C.inkMuted,
          letterSpacing: "0.1em",
          width: 24,
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(index, e.target.value)}
        style={{
          flex: 1,
          background: "transparent",
          border: `1px solid ${C.rule}`,
          color: C.ink,
          padding: "6px 10px",
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
          border: `1px solid ${C.rule}`,
          color: canRemove ? C.inkMuted : "#3a3530",
          width: 28,
          height: 28,
          cursor: canRemove ? "pointer" : "not-allowed",
          fontSize: 14,
          lineHeight: 1,
        }}
        aria-label="刪除位置"
      >
        ×
      </button>
    </div>
  );
}

export default function App() {
  const [question, setQuestion] = useState("");
  const [instructions, setInstructions] = useState("");
  const [positions, setPositions] = useState(["當下指引"]);
  const [includeReversed, setIncludeReversed] = useState(true);
  const [deckScope, setDeckScope] = useState("all");
  const [drawnCards, setDrawnCards] = useState([]);
  const [copyStatus, setCopyStatus] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);

  const applyPreset = (preset) => {
    setPositions([...preset.positions]);
    setDrawnCards([]);
  };

  const addPosition = () => {
    setPositions([...positions, `位置 ${positions.length + 1}`]);
  };

  const updatePosition = (i, v) => {
    const next = [...positions];
    next[i] = v;
    setPositions(next);
  };

  const removePosition = (i) => {
    if (positions.length <= 1) return;
    setPositions(positions.filter((_, idx) => idx !== i));
  };

  const drawCards = () => {
    if (positions.length === 0 || isDrawing) return;
    const pool =
      deckScope === "major" ? majorArcana :
      deckScope === "minor" ? minorArcana :
      ALL_CARDS;
    if (pool.length < positions.length) {
      alert(`牌池只有 ${pool.length} 張，無法抽 ${positions.length} 張。請改用完整牌組或減少位置。`);
      return;
    }
    setIsDrawing(true);
    setDrawnCards([]);
    const shuffled = fisherYatesShuffle(pool);
    const drawn = shuffled.slice(0, positions.length).map((card, i) => ({
      ...card,
      reversed: includeReversed && secureCoinFlip(),
      position: positions[i],
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
    const text = `我抽了一個塔羅牌陣，請幫我解讀。

【問題】
${question || "（未填）"}

【牌陣設定】
${positions.map((p, i) => `${i + 1}. ${p}`).join("\n")}

【抽牌結果】
${drawnCards.map((c) => `${c.positionIdx + 1}. ${c.position}：${c.zh}（${c.reversed ? "逆位" : "正位"}） / ${c.en}`).join("\n")}

【解讀指示】
${instructions || "（未填）"}`;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => { setCopyStatus("已複製到剪貼簿"); setTimeout(() => setCopyStatus(""), 2500); },
        () => { setCopyStatus("複製失敗"); setTimeout(() => setCopyStatus(""), 2500); }
      );
    } else {
      setCopyStatus("瀏覽器不支援複製");
      setTimeout(() => setCopyStatus(""), 2500);
    }
  };

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
    background: C.bg2,
    border: `1px solid ${C.rule}`,
    color: C.ink,
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: FONT_SANS,
    outline: "none",
    resize: "vertical",
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
            設下問題，<span style={{ fontStyle: "italic", color: C.accent }}>洗牌</span>，<br />
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
            輸入問題與牌陣 → 抽牌 → 匯出 prompt 拿去問 Claude／Gemini 解讀。
            這是工具，不是占卜——把牌當作思考鏡面。
          </div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 32 }}>
          <div className="tarot-main-grid" style={{ display: "grid", gap: 32 }}>
            <style>{`
              @media (min-width: 900px) {
                .tarot-main-grid { grid-template-columns: 5fr 7fr; align-items: start; }
              }
            `}</style>

            {/* 設定區 */}
            <section style={{ border: `1px solid ${C.rule}`, padding: 20, background: C.bg2 }}>
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

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>問題</label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="你想問什麼？（具體會比模糊好）"
                  rows={3}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>牌陣 — 套用範例</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {PRESETS.map((p) => (
                    <button key={p.id} onClick={() => applyPreset(p)} style={chipBase}>
                      {p.name}
                      <span style={{ marginLeft: 6, color: C.inkMuted, fontFamily: FONT_MONO, fontSize: 10 }}>
                        ·{p.positions.length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

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
                  style={{ ...chipBase, width: "100%", marginTop: 4, padding: "8px", color: C.inkMuted, borderStyle: "dashed" }}
                >
                  ＋ 新增位置
                </button>
              </div>

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

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={includeReversed}
                    onChange={(e) => setIncludeReversed(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: C.accent }}
                  />
                  <span style={{ fontSize: 13 }}>包含逆位</span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.inkMuted, letterSpacing: "0.1em" }}>
                    REVERSED · 50%
                  </span>
                </label>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>解讀指示（給 AI 看）</label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="例如：聚焦在工作面向／用 Rider-Waite 體系／不要太悲觀／給我具體下一步行動"
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
                {isDrawing ? "翻牌中…" : drawnCards.length > 0 ? "再抽一次" : "洗牌・抽牌"}
              </button>
            </section>

            {/* 結果區 */}
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
                  <span style={{ color: C.inkMuted }}>{drawnCards.length} / {positions.length}</span>
                )}
              </div>

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
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 80, color: C.rule, lineHeight: 1, marginBottom: 16 }}>
                    ✶
                  </div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontStyle: "italic", marginBottom: 6 }}>
                    準備就緒
                  </div>
                  <div style={{ fontSize: 13 }}>填好左側設定，按下「洗牌・抽牌」。</div>
                </div>
              )}

              {(drawnCards.length > 0 || isDrawing) && (
                <>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "flex-start", marginBottom: 24 }}>
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
                      <button onClick={() => setDrawnCards([])} style={{ ...chipBase, padding: "10px 18px" }}>
                        清空結果
                      </button>
                      {copyStatus && (
                        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.accent, letterSpacing: "0.1em" }}>
                          ✓ {copyStatus}
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
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
          <span>private use · v0.1</span>
          <span>78 cards · entropy: system</span>
        </footer>
      </div>
    </div>
  );
}
