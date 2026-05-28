import { useState, useRef, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
//  ELITE ENDOCRINOLOGY AI v5.0 — SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════
const SYSTEM_PROMPT = `You are ELITE ENDOCRINOLOGY AI v5.0 — a senior endocrinology consultant operating at academic Grand Round standards with ZERO-HALLUCINATION protocol.

IDENTITY & CONTEXT:
- Senior endocrinology & metabolism consultant, peer-level academic interaction
- Clinical context: Egypt healthcare system, Egyptian pharmaceutical market (brand + generics)
- Growth reference: Egyptian National Growth Charts (2020)
- User: Dr. Nader — senior male endocrinologist — address as peer colleague
- Language: Respond in Arabic with English medical terminology embedded naturally

OPERATIONAL MODES (auto-detected or user-specified):
🔴 FULL MODE ("/" prefix or complex multi-system case):
   → 12-Step analysis: Data Inventory → Red Flags → Bayesian DDx → Hidden Disorder Scan → Phenotype-Drug Mismatch → Pathophysiology → Diagnostic Synthesis → Further Workup → Treatment Plan → Cost-Benefit → Monitoring & Follow-Up → Patient Communication
   → Followed by FULL SELF-AUDIT

🟡 FOCUSED MODE ("//" prefix or focused diagnostic question):
   → 6-Step: Key Data → Red Flags → Top 3 DDx → Essential Workup → Core Treatment → MINI-AUDIT

🟢 RAPID MODE ("///" prefix or quick fact/dose/guideline):
   → Direct Answer + Evidence Level + Red Flags + Tag (✅/⚠️/❓/🚫)

ZERO-HALLUCINATION PROTOCOL (MANDATORY ALL MODES):
Certainty tags on every clinical statement:
✅ CONFIRMED  = Direct guideline, GRADE A/B, L1-L2
⚠️ PROBABLE   = Logical extrapolation, GRADE C, L3
❓ UNCERTAIN  = Conflicting data, L4
🚫 UNKNOWN   = No data, L5 hypothesis

Evidence pyramid:
🟢 L1 = Meta-analysis / RCT / Major Guidelines (ADA 2026, Endocrine Society, AACE, ATA 2023, ESE/ENSAT, KDIGO 2024, ISPAD 2022)
🔵 L2 = Single RCT / Large cohort / Williams 14th Ed (2024) / Oxford 4th Ed (2023) / Greenspan's 11th (2023)
🟡 L3 = Observational / Case series
🟠 L4 = Expert opinion / Case reports
⚪ L5 = Hypothesis / Theoretical

ABSOLUTE FORBIDDEN:
❌ Never fabricate PMID, DOI, page numbers
❌ Never guess lab values not provided
❌ Never cite medications unavailable in Egypt
❌ Never assume imaging findings not in provided images
❌ Never ignore guideline conflicts — flag them explicitly
❌ Never use adult protocols for pediatric cases without adaptation
❌ Never skip "MISSING DATA" declaration when data is absent

CITATION FORMAT:
[Statement] — [Source + Year + Evidence Level]
Example: "Metformin first-line for T2DM" — ADA 2026 Standards, GRADE A, L1

GUIDELINE CONFLICT FORMAT:
⚠️ GUIDELINE CONFLICT:
• ADA 2026 recommends: [X]
• Endocrine Society [year] recommends: [Y]
• Suggested approach: [clinical reasoning]

DDx CHAIN-OF-VERIFICATION FORMAT:
━━━━━━━━━━━━━━━━━━━━━━━━
**[Diagnosis]** — Probability: XX%  Evidence: L[1-5]
━━━━━━━━━━━━━━━━━━━━━━━━
✅ Supporting Criteria MET: [with evidence from case]
⚠️ Criteria PARTIALLY Met: [reasoning]
❌ Criteria NOT Met: [what's missing]
🚫 Missing Data Needed: [specific tests]
FINAL: Most likely: [X] — Confidence: [High/Moderate/Low]

EGYPTIAN PHARMACEUTICAL FORMAT:
💊 [Generic Name]
   • Brand: [Name] — [Strength] — [Cost EGP]
   • Generic: [Name] — [Strength] — [Cost EGP]
   • Dose: [X mg/day] — [Timing] — [Route]
   Self-check: □ Contraindications? □ Drug interactions? □ Dose adjustment? □ Available Egypt? □ Monitoring?

AUTO-CALCULATION (ALL DIABETES CASES with weight + insulin):
📊 TDD: [X] units | TDD/kg: [Y] u/kg | Basal:Bolus: [X%:Y%]
   ISF(1800): [Z] mg/dL/unit | ICR: 1:[C]g carbs | Correction: (BG-Target)/ISF
   ⚠️ Flag if TDD/kg >1.5 T1DM or >2.0 T2DM → Insulin resistance

RADIOLOGY PROTOCOL:
DESCRIBE before interpret. Certainty flags: ✅visible ⚠️probable ❓unclear 🚫indeterminate
Order: Bone → Soft Tissue → Vascular → Hardware → Alignment → Special Findings
Never confirm fracture without fracture line. Never fabricate measurements.

SESSION HEADER (start every response):
┌─────────────────────────────────────┐
│ 🏥 ELITE ENDO AI v5.0               │
│ 📅 [Egypt time UTC+2]               │
│ Mode: [🔴FULL/🟡FOCUSED/🟢RAPID]   │
└─────────────────────────────────────┘

MANDATORY FOOTER (end every response):
─────────────────────────────────────
⚠️ Clinical Disclaimer:
هذا تحليل استشاري أكاديمي لا يحل محل الفحص السريري المباشر.
القرار النهائي للطبيب المعالج بناءً على السياق الكامل للحالة.
Evidence: 🟢L1-L2=Strong | 🟡L3=Moderate | 🟠L4-L5=Weak
Anti-Hallucination: ACTIVE ✅ | ELITE ENDO v5.0
─────────────────────────────────────`;

// ═══════════════════════════════════════════════════════════════
//  MODES CONFIG
// ═══════════════════════════════════════════════════════════════
const MODES = {
  FULL: {
    id: "FULL", emoji: "🔴", label: "FULL", prefix: "/",
    color: "#ff4757", bg: "rgba(255,71,87,0.1)", border: "rgba(255,71,87,0.28)",
    desc: "12-Step + Full Audit", steps: "12 خطوة"
  },
  FOCUSED: {
    id: "FOCUSED", emoji: "🟡", label: "FOCUSED", prefix: "//",
    color: "#ffa502", bg: "rgba(255,165,2,0.1)", border: "rgba(255,165,2,0.28)",
    desc: "6-Step + Mini Audit", steps: "6 خطوات"
  },
  RAPID: {
    id: "RAPID", emoji: "🟢", label: "RAPID", prefix: "///",
    color: "#00d4aa", bg: "rgba(0,212,170,0.1)", border: "rgba(0,212,170,0.28)",
    desc: "Direct + RedFlags", steps: "إجابة فورية"
  }
};

// ═══════════════════════════════════════════════════════════════
//  TEMPLATES
// ═══════════════════════════════════════════════════════════════
const TEMPLATES = [
  {
    icon: "🩺", label: "Case Template",
    text: `CASE:
  Age/Sex:          
  Chief Complaint:  
  Duration:         
  Current Meds:     [none / list]
  Labs:             
  Imaging:          [none / findings]
  Question:         
  Mode:             🔴FULL`
  },
  {
    icon: "💉", label: "Insulin Calc",
    text: `CASE: Insulin optimization
  Weight: [XX] kg  |  Type: [T1DM/T2DM]
  TDD: [XX] units
  Basal: [XX] units [Glargine/Detemir/NPH] × [1-2/day]
  Bolus: [XX] units [Aspart/Lispro] × 3
  Last HbA1c: [X%]
  Problem: `
  },
  {
    icon: "⚡", label: "Quick Q",
    text: `Q: 
Context: 
Mode: RAPID`
  },
  {
    icon: "🧪", label: "Lab Review",
    text: `Lab results to interpret:
Patient: [Age/Sex]
- 
- 
- 
Clinical context: 
Mode: FOCUSED`
  },
  {
    icon: "💊", label: "Drug / Egypt",
    text: `Q: ما البديل المتاح في السوق المصري لـ [اسم الدواء]؟
Patient: [Age/Sex/Weight/Condition]
Current meds: 
Indication: 
Mode: RAPID`
  },
  {
    icon: "🏥", label: "Referral Letter",
    text: `اكتب خطاب إحالة لـ:
Patient: [Name - Age - Sex]
Referring to: [Specialty]
Diagnosis: 
Key findings: 
Request: 
Language: Arabic`
  }
];

// ═══════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════
function getEgyptTime() {
  const now = new Date();
  return {
    time: now.toLocaleTimeString("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    date: now.toLocaleDateString("en-GB", { timeZone: "Africa/Cairo", weekday: "short", year: "numeric", month: "short", day: "numeric" }),
    dateAr: now.toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo", weekday: "long", month: "long", day: "numeric", year: "numeric" })
  };
}

function MessageContent({ content, streaming }) {
  return (
    <pre style={{
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      fontSize: "0.82rem",
      lineHeight: "1.72",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      color: "#b8d0e8",
      margin: 0
    }}>
      {content}
      {streaming && <span style={{ color: "#00d4aa", animation: "blink 0.7s step-start infinite" }}>▌</span>}
    </pre>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function EliteEndoApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("FOCUSED");
  const [loading, setLoading] = useState(false);
  const [clock, setClock] = useState(getEgyptTime());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [msgIdCounter, setMsgIdCounter] = useState(1);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setClock(getEgyptTime()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const nextId = () => {
    const id = msgIdCounter;
    setMsgIdCounter(prev => prev + 1);
    return id;
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyMessage = (text, id) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2200);
  };

  const insertTemplate = (text) => {
    setInput(text);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const clearChat = () => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setLoading(false);
  };

  const stopGeneration = () => {
    if (abortRef.current) abortRef.current.abort();
    setLoading(false);
    setMessages(prev => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last?.streaming) updated[updated.length - 1] = { ...last, streaming: false };
      return updated;
    });
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userContent = input.trim();
    setInput("");

    const userMsgId = Date.now();
    const userMsg = { role: "user", content: userContent, timestamp: new Date(), id: userMsgId };
    const historyForApi = [...messages, userMsg];

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const modeCtx = `\n\nActive Mode: ${mode} (${MODES[mode].prefix})\nEgypt Time: ${clock.date}, ${clock.time}\nUser: Dr. Nader`;

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          stream: true,
          system: SYSTEM_PROMPT + modeCtx,
          messages: historyForApi.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `HTTP ${res.status}`);
      }

      const assistantId = Date.now() + 1;
      setMessages(prev => [...prev, { role: "assistant", content: "", id: assistantId, timestamp: new Date(), streaming: true }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;
          try {
            const evt = JSON.parse(raw);
            if (evt.type === "content_block_delta" && evt.delta?.text) {
              fullText += evt.delta.text;
              setMessages(prev =>
                prev.map(m => m.id === assistantId ? { ...m, content: fullText } : m)
              );
            }
          } catch {}
        }
      }

      setMessages(prev =>
        prev.map(m => m.id === assistantId ? { ...m, streaming: false } : m)
      );

    } catch (err) {
      if (err.name === "AbortError") return;
      const errMsg = `❌ خطأ في الاتصال\n\n${err.message}\n\nتحقق من الاتصال وحاول مجدداً.`;
      setMessages(prev => [...prev, { role: "assistant", content: errMsg, id: Date.now(), timestamp: new Date(), error: true, streaming: false }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, mode, clock]);

  const currentMode = MODES[mode];
  const msgCount = messages.filter(m => m.role === "user").length;

  // ════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════
  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: "#070d1a", minHeight: "100vh", height: "100vh", color: "#c8d8f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── STYLES ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-track{background:rgba(255,255,255,0.02);}
        ::-webkit-scrollbar-thumb{background:rgba(0,212,170,0.18);border-radius:2px;}
        textarea{outline:none;caret-color:#00d4aa;}
        button{outline:none;}
        @keyframes blink{0%,100%{opacity:1;}50%{opacity:0;}}
        @keyframes dot{0%,80%,100%{transform:scale(0.6);opacity:0.4;}40%{transform:scale(1);opacity:1;}}
        @keyframes msgIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
        @keyframes userIn{from{opacity:0;transform:translateX(10px);}to{opacity:1;transform:translateX(0);}}
        @keyframes glow{0%,100%{box-shadow:0 0 8px rgba(0,212,170,0.15);}50%{box-shadow:0 0 18px rgba(0,212,170,0.3);}}
        .msg-ai{animation:msgIn 0.25s ease;}
        .msg-user{animation:userIn 0.2s ease;}
        .t-btn{transition:all 0.15s ease;cursor:pointer;}
        .t-btn:hover{background:rgba(0,212,170,0.07)!important;border-color:rgba(0,212,170,0.22)!important;color:#7ab0a0!important;}
        .mode-item{transition:all 0.18s ease;cursor:pointer;}
        .mode-item:hover{transform:translateX(2px);}
        .send-btn{transition:all 0.15s ease;}
        .send-btn:hover:not(:disabled){transform:scale(1.04);}
        .send-btn:active:not(:disabled){transform:scale(0.97);}
        .icon-btn{transition:all 0.15s ease;cursor:pointer;}
        .icon-btn:hover{color:#00d4aa!important;}
        .copy-fade{opacity:0;transition:opacity 0.15s ease;}
        .msg-ai:hover .copy-fade{opacity:1;}
        .sidebar-anim{transition:width 0.28s ease,min-width 0.28s ease,opacity 0.2s ease,padding 0.28s ease;}
        .pulse-dot::before{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:#00d4aa;animation:dot 1.2s ease-in-out infinite;margin-right:6px;vertical-align:middle;}
        .active-glow{animation:glow 2.5s ease-in-out infinite;}
      `}</style>

      {/* ══════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════ */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 18px",
        background: "rgba(7,13,26,0.97)",
        borderBottom: "1px solid rgba(0,212,170,0.1)",
        backdropFilter: "blur(20px)",
        zIndex: 20, flexShrink: 0,
        minHeight: "56px"
      }}>
        {/* Left: Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
          <button
            className="icon-btn"
            onClick={() => setSidebarOpen(s => !s)}
            style={{ background: "transparent", border: "none", color: "#2a4060", fontSize: "14px", padding: "4px", marginRight: "2px" }}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
          <div style={{
            width: 34, height: 34,
            background: "linear-gradient(135deg, #00d4aa, #0087cc)",
            borderRadius: "9px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "17px",
            boxShadow: "0 0 14px rgba(0,212,170,0.28)"
          }}>⚕</div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "0.92rem", color: "#e0eeff", letterSpacing: "0.03em" }}>
              ELITE ENDO AI
            </div>
            <div style={{ fontSize: "0.58rem", color: "#00d4aa", opacity: 0.7, letterSpacing: "0.1em", fontWeight: 500 }}>
              v5.0 · ZERO-HALLUCINATION PROTOCOL
            </div>
          </div>
        </div>

        {/* Center: Active Mode Badge */}
        <div style={{
          padding: "6px 14px", borderRadius: "20px",
          background: currentMode.bg, border: `1px solid ${currentMode.border}`,
          display: "flex", alignItems: "center", gap: "7px",
          fontSize: "0.72rem", fontWeight: 700, color: currentMode.color,
          letterSpacing: "0.07em"
        }}>
          <span>{currentMode.emoji}</span>
          <span>{currentMode.label}</span>
          <span style={{ opacity: 0.5, fontWeight: 400, fontSize: "0.65rem" }}>· {currentMode.desc}</span>
        </div>

        {/* Right: Clock + User */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.88rem", color: "#00d4aa", fontWeight: 500, letterSpacing: "0.04em" }}>
              {clock.time}
            </div>
            <div style={{ fontSize: "0.58rem", color: "#2a4a60", letterSpacing: "0.04em" }}>{clock.date} · Cairo</div>
          </div>
          <div style={{
            padding: "5px 11px",
            background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.12)",
            borderRadius: "8px", fontSize: "0.75rem", color: "#5a8090", fontWeight: 500
          }}>
            د. نادر
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════
          BODY
      ══════════════════════════════════════════════ */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ─── SIDEBAR ─── */}
        <aside className="sidebar-anim" style={{
          width: sidebarOpen ? "230px" : "0px",
          minWidth: sidebarOpen ? "230px" : "0px",
          opacity: sidebarOpen ? 1 : 0,
          padding: sidebarOpen ? "16px 12px" : "0",
          background: "rgba(5,10,20,0.85)",
          borderRight: "1px solid rgba(255,255,255,0.04)",
          overflow: "hidden",
          display: "flex", flexDirection: "column", gap: "18px",
          flexShrink: 0
        }}>

          {/* MODES */}
          <div>
            <div style={{ fontSize: "0.58rem", color: "#1e3a50", letterSpacing: "0.16em", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase" }}>
              Analysis Mode
            </div>
            {Object.values(MODES).map(m => (
              <div key={m.id} className="mode-item" onClick={() => setMode(m.id)} style={{
                padding: "9px 10px", borderRadius: "8px", marginBottom: "5px",
                background: mode === m.id ? m.bg : "transparent",
                border: `1px solid ${mode === m.id ? m.border : "rgba(255,255,255,0.04)"}`,
                display: "flex", alignItems: "center", gap: "9px"
              }}>
                <span style={{ fontSize: "15px" }}>{m.emoji}</span>
                <div>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, color: mode === m.id ? m.color : "#3a5a70", letterSpacing: "0.05em" }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: "0.57rem", color: "#1e3048", marginTop: "1px" }}>{m.steps} · {m.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* DIVIDER */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }} />

          {/* TEMPLATES */}
          <div>
            <div style={{ fontSize: "0.58rem", color: "#1e3a50", letterSpacing: "0.16em", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase" }}>
              Quick Templates
            </div>
            {TEMPLATES.map((t, i) => (
              <div key={i} className="t-btn" onClick={() => insertTemplate(t.text)} style={{
                padding: "7px 10px", borderRadius: "6px", marginBottom: "4px",
                background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                fontSize: "0.7rem", color: "#3a5870"
              }}>
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </div>
            ))}
          </div>

          {/* DIVIDER */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }} />

          {/* SHORTCUTS */}
          <div>
            <div style={{ fontSize: "0.58rem", color: "#1e3a50", letterSpacing: "0.16em", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase" }}>
              Mode Shortcuts
            </div>
            {[["/ + Enter", "🔴 FULL"], ["// + Enter", "🟡 FOCUSED"], ["/// + Enter", "🟢 RAPID"]].map(([key, label]) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 4px", fontSize: "0.62rem", color: "#2a4055" }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#00a070", fontSize: "0.65rem" }}>{key}</span>
                <span>{label}</span>
              </div>
            ))}
            <div style={{ marginTop: "8px", padding: "4px 4px", fontSize: "0.62rem", color: "#2a4055", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#4a6080", fontSize: "0.65rem" }}>Ctrl+Enter</span>
              <span>Send</span>
            </div>
          </div>

          {/* SESSION INFO */}
          <div style={{ marginTop: "auto" }}>
            <div style={{
              padding: "9px 10px",
              background: "rgba(0,212,170,0.04)", border: "1px solid rgba(0,212,170,0.07)", borderRadius: "8px"
            }}>
              <div style={{ fontSize: "0.6rem", color: "#2a5040", marginBottom: "5px" }}>{clock.dateAr}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.62rem", color: "#1e4030" }}>
                  {msgCount} {msgCount === 1 ? "سؤال" : "أسئلة"} · {messages.length} رسائل
                </span>
                {messages.length > 0 && (
                  <span onClick={clearChat} className="icon-btn" style={{ fontSize: "0.62rem", color: "#1e4030" }}>
                    مسح ×
                  </span>
                )}
              </div>
            </div>
            <div style={{ marginTop: "8px", fontSize: "0.55rem", color: "#152030", textAlign: "center", lineHeight: 1.5 }}>
              Anti-Hallucination: ACTIVE ✓<br />
              Egyptian Pharma Context ✓
            </div>
          </div>
        </aside>

        {/* ─── MAIN CHAT ─── */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", background: "linear-gradient(180deg, #070d1a 0%, #080f1e 100%)" }}>

          {/* Background grid texture */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.018,
            backgroundImage: "linear-gradient(rgba(0,212,170,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,170,0.8) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }} />

          {/* ── MESSAGES AREA ── */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px 16px", position: "relative", zIndex: 1 }}>

            {messages.length === 0 ? (
              /* WELCOME */
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "28px", textAlign: "center" }}>
                <div style={{
                  width: 78, height: 78,
                  background: "linear-gradient(135deg, rgba(0,212,170,0.12), rgba(0,135,204,0.12))",
                  borderRadius: "22px", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "36px", border: "1px solid rgba(0,212,170,0.18)",
                  boxShadow: "0 0 36px rgba(0,212,170,0.1)"
                }} className="active-glow">⚕️</div>

                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.6rem", fontWeight: 800, color: "#c8e0f8", marginBottom: "6px" }}>
                    مرحباً د. نادر
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#2a4a60", maxWidth: "440px", lineHeight: 1.6 }}>
                    ELITE ENDOCRINOLOGY AI v5.0 جاهز للعمل<br />
                    <span style={{ fontSize: "0.72rem", color: "#1e3848" }}>
                      Academic Grand Round Standard · Zero-Hallucination · Egyptian Pharma Context
                    </span>
                  </div>
                </div>

                {/* Mode Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", maxWidth: "520px", width: "100%" }}>
                  {Object.values(MODES).map(m => (
                    <div key={m.id} onClick={() => { setMode(m.id); textareaRef.current?.focus(); }}
                      style={{ padding: "14px 10px", background: m.bg, border: `1px solid ${m.border}`, borderRadius: "10px", cursor: "pointer", textAlign: "center", transition: "all 0.15s ease" }}
                      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                    >
                      <div style={{ fontSize: "22px", marginBottom: "5px" }}>{m.emoji}</div>
                      <div style={{ fontSize: "0.68rem", fontWeight: 800, color: m.color, letterSpacing: "0.06em" }}>{m.label}</div>
                      <div style={{ fontSize: "0.57rem", color: "#1e3a50", marginTop: "3px" }}>{m.desc}</div>
                    </div>
                  ))}
                </div>

                {/* Quick examples */}
                <div style={{ maxWidth: "520px", width: "100%" }}>
                  <div style={{ fontSize: "0.6rem", color: "#1e3a50", letterSpacing: "0.12em", marginBottom: "8px", textTransform: "uppercase" }}>أمثلة سريعة</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" }}>
                    {["/ حالة T2DM جديدة مع CKD", "/// جرعة Semaglutide في مصر", "// قراءة HbA1c + Insulin مرتفع", "/ طفل نقص هرمون النمو", "/// Calcitriol vs Alfacalcidol"].map(q => (
                      <div key={q} onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                        style={{ padding: "5px 11px", background: "rgba(0,212,170,0.04)", border: "1px solid rgba(0,212,170,0.1)", borderRadius: "20px", fontSize: "0.67rem", color: "#3a6070", cursor: "pointer", transition: "all 0.15s ease" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,212,170,0.08)"; e.currentTarget.style.color = "#5a8090"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,212,170,0.04)"; e.currentTarget.style.color = "#3a6070"; }}
                      >{q}</div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* MESSAGES */
              <div style={{ maxWidth: "820px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "14px" }}>
                {messages.map((msg, idx) => (
                  <div key={msg.id || idx}
                    className={msg.role === "user" ? "msg-user" : "msg-ai"}
                    style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: "9px", alignItems: "flex-start" }}
                  >
                    {/* AI Avatar */}
                    {msg.role === "assistant" && (
                      <div style={{
                        width: 26, height: 26, borderRadius: "7px", flexShrink: 0, marginTop: "2px",
                        background: msg.error ? "rgba(255,71,87,0.12)" : "linear-gradient(135deg,rgba(0,212,170,0.15),rgba(0,135,204,0.12))",
                        border: msg.error ? "1px solid rgba(255,71,87,0.2)" : "1px solid rgba(0,212,170,0.18)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px"
                      }}>
                        {msg.streaming ? <span className="pulse-dot" style={{ fontSize: "0px" }}></span> : "⚕"}
                      </div>
                    )}

                    <div style={{ maxWidth: msg.role === "user" ? "70%" : "92%", minWidth: "40px" }}>
                      {/* Bubble */}
                      <div style={{
                        padding: msg.role === "user" ? "9px 14px" : "13px 16px",
                        borderRadius: msg.role === "user" ? "14px 14px 3px 14px" : "3px 14px 14px 14px",
                        background: msg.role === "user"
                          ? "linear-gradient(135deg, rgba(0,212,170,0.13), rgba(0,135,204,0.1))"
                          : msg.error ? "rgba(255,71,87,0.06)" : "rgba(12,20,36,0.92)",
                        border: msg.role === "user"
                          ? "1px solid rgba(0,212,170,0.18)"
                          : msg.error ? "1px solid rgba(255,71,87,0.16)" : "1px solid rgba(255,255,255,0.055)",
                        boxShadow: msg.role === "assistant" ? "0 2px 16px rgba(0,0,0,0.28)" : "none",
                        position: "relative"
                      }}>
                        {msg.role === "user" ? (
                          <div style={{ fontSize: "0.84rem", color: "#c0d8f0", whiteSpace: "pre-wrap", lineHeight: 1.65, direction: "auto" }}>
                            {msg.content}
                          </div>
                        ) : msg.content ? (
                          <MessageContent content={msg.content} streaming={msg.streaming} />
                        ) : (
                          <div style={{ display: "flex", gap: "4px", padding: "3px 0", alignItems: "center" }}>
                            {[0, 0.2, 0.4].map((d, i) => (
                              <span key={i} style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#00d4aa", animation: `dot 1.2s ease-in-out ${d}s infinite` }} />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Meta row */}
                      <div style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "3px 3px 0",
                        justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
                      }}>
                        <span style={{ fontSize: "0.58rem", color: "#1a3048", fontFamily: "'IBM Plex Mono', monospace" }}>
                          {msg.timestamp.toLocaleTimeString("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {msg.role === "assistant" && msg.content && !msg.streaming && (
                          <span className="copy-fade icon-btn" onClick={() => copyMessage(msg.content, msg.id)}
                            style={{ fontSize: "0.58rem", color: copiedId === msg.id ? "#00d4aa" : "#1a3048", cursor: "pointer" }}>
                            {copiedId === msg.id ? "✓ تم النسخ" : "نسخ"}
                          </span>
                        )}
                        {msg.streaming && (
                          <span style={{ fontSize: "0.58rem", color: "#00a070" }} className="pulse-dot">جاري التحليل</span>
                        )}
                      </div>
                    </div>

                    {/* User Avatar */}
                    {msg.role === "user" && (
                      <div style={{
                        width: 26, height: 26, borderRadius: "7px", flexShrink: 0, marginTop: "2px",
                        background: "rgba(0,212,170,0.07)", border: "1px solid rgba(0,212,170,0.12)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "#3a7060"
                      }}>ن</div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ── INPUT AREA ── */}
          <div style={{
            padding: "12px 28px 16px",
            background: "rgba(5,10,20,0.96)",
            borderTop: "1px solid rgba(0,212,170,0.07)",
            backdropFilter: "blur(20px)",
            flexShrink: 0, position: "relative", zIndex: 2
          }}>
            <div style={{ maxWidth: "820px", margin: "0 auto" }}>

              {/* Mode quick-tabs */}
              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "8px" }}>
                {Object.values(MODES).map(m => (
                  <button key={m.id} onClick={() => setMode(m.id)} style={{
                    padding: "3px 10px", borderRadius: "12px", cursor: "pointer",
                    background: mode === m.id ? m.bg : "transparent",
                    border: `1px solid ${mode === m.id ? m.border : "rgba(255,255,255,0.05)"}`,
                    color: mode === m.id ? m.color : "#2a4060",
                    fontSize: "0.63rem", fontWeight: 700, letterSpacing: "0.06em",
                    transition: "all 0.15s ease"
                  }}>
                    {m.emoji} {m.label}
                  </button>
                ))}

                {loading && (
                  <button onClick={stopGeneration} style={{
                    marginLeft: "6px", padding: "3px 10px", borderRadius: "12px", cursor: "pointer",
                    background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.2)",
                    color: "#ff4757", fontSize: "0.63rem", fontWeight: 600, transition: "all 0.15s ease"
                  }}>⏹ إيقاف</button>
                )}

                <span style={{ marginLeft: "auto", fontSize: "0.57rem", color: "#0e2030" }}>
                  Ctrl+Enter = إرسال
                </span>
              </div>

              {/* Input box */}
              <div style={{
                display: "flex", gap: "8px",
                background: "rgba(12, 20, 35, 0.9)",
                border: `1px solid ${loading ? "rgba(0,212,170,0.06)" : "rgba(0,212,170,0.14)"}`,
                borderRadius: "12px", padding: "3px 3px 3px 4px",
                transition: "border-color 0.2s ease",
                boxShadow: loading ? "none" : "0 0 0 1px rgba(0,212,170,0.03)"
              }}
                onFocus={e => e.currentTarget.style.borderColor = "rgba(0,212,170,0.24)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(0,212,170,0.14)"}
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  rows={3}
                  placeholder={`${currentMode.emoji} ${currentMode.label} نشط — اكتب سؤالك أو استخدم template من القائمة الجانبية…`}
                  style={{
                    flex: 1, background: "transparent", border: "none",
                    color: "#b8d0e8", fontSize: "0.85rem",
                    padding: "10px 12px", resize: "none",
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    lineHeight: 1.65, direction: "auto",
                    opacity: loading ? 0.5 : 1
                  }}
                />
                <button
                  className="send-btn"
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  style={{
                    padding: "10px 18px", alignSelf: "stretch",
                    borderRadius: "9px",
                    background: loading || !input.trim()
                      ? "rgba(0,212,170,0.04)"
                      : "linear-gradient(135deg, rgba(0,212,170,0.18), rgba(0,135,204,0.13))",
                    border: `1px solid ${loading || !input.trim() ? "rgba(0,212,170,0.06)" : "rgba(0,212,170,0.22)"}`,
                    color: loading || !input.trim() ? "#1a4040" : "#00d4aa",
                    fontSize: "1.15rem", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    minWidth: "48px"
                  }}
                >
                  {loading ? (
                    <span style={{ display: "flex", gap: "3px" }}>
                      {[0, 0.15, 0.3].map((d, i) => (
                        <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#00a060", animation: `dot 1.2s ease ${d}s infinite` }} />
                      ))}
                    </span>
                  ) : "↑"}
                </button>
              </div>

              {/* Status bar */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "0.55rem", color: "#0d1e30" }}>
                <span>⚕ ELITE ENDO v5.0 · Anti-Hallucination ACTIVE ✓ · {clock.time} Cairo</span>
                <span>Egyptian Pharma Context · Williams 14th · ADA 2026 · ISPAD 2022</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
