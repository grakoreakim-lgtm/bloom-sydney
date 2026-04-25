/**
 * BloomAdmin.jsx
 * Bloom Sydney — Florist Admin Dashboard
 * Stack: React (single-file, no external deps beyond React)
 * Deploy: Drop into any Next.js /app or /pages route as a Client Component
 *
 * Pages implemented:
 *   DAILY OPS   → Dashboard, Flemington List, Orders, Packing Slip, Delivery Route
 *   CATALOGUE   → Today's Flower, Products & Stock, Wine Pairing
 *   CUSTOMERS   → Customer DB, Anniversary Calendar, Subscriptions
 *   GROWTH      → Analytics, Instagram Sync, Settings
 */

"use client";
import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA  (replace with real API / Prisma calls)
// ─────────────────────────────────────────────────────────────────────────────
const ORDERS = [
  { id: "#0124", name: "Sarah K.",  product: "Tulip + Rosé Hamper",  addr: "12 Oxford St, Epping",            postcode: "2121", time: "2:00 PM",  total: 95,  status: "DISPATCHED", hasAlcohol: true,  msg: "Happy birthday my love 🌷" },
  { id: "#0123", name: "James W.", product: "Standard Bunch",         addr: "8 Pennant Hills Rd, Carlingford", postcode: "2118", time: "3:00 PM",  total: 48,  status: "PACKING",    hasAlcohol: false, msg: "Thinking of you" },
  { id: "#0122", name: "Mia C.",   product: "Hamper Deluxe",           addr: "44 Victoria Rd, Ryde",           postcode: "2112", time: "4:00 PM",  total: 120, status: "PENDING",    hasAlcohol: true,  msg: "Congratulations on the promotion!" },
  { id: "#0121", name: "Tom H.",   product: "Tulip + Rosé Hamper",   addr: "3 Herring Rd, Macquarie Park",    postcode: "2113", time: "1:00 PM",  total: 95,  status: "DELIVERED",  hasAlcohol: true,  msg: "Anniversary love ❤️" },
  { id: "#0120", name: "Amy L.",   product: "Peony Bunch",             addr: "21 Eastwood Ave, Eastwood",      postcode: "2122", time: "12:00 PM", total: 55,  status: "DELIVERED",  hasAlcohol: false, msg: "Just because 🌸" },
];

const PRODUCTS = [
  { id: 1, name: "White Tulip Bunch",    type: "Standard", price: 48,  cost: 18, stock: 8,  max: 20, active: true,  soldToday: 12 },
  { id: 2, name: "Tulip + Rosé Hamper",  type: "Hamper",   price: 95,  cost: 34, stock: 5,  max: 15, active: true,  soldToday: 7  },
  { id: 3, name: "Hamper Deluxe",         type: "Hamper",   price: 120, cost: 45, stock: 3,  max: 10, active: true,  soldToday: 2  },
  { id: 4, name: "Pink Peony Bunch",      type: "Standard", price: 52,  cost: 20, stock: 12, max: 20, active: true,  soldToday: 0  },
  { id: 5, name: "Peony + Chardonnay",    type: "Hamper",   price: 110, cost: 42, stock: 4,  max: 10, active: false, soldToday: 0  },
  { id: 6, name: "Sunflower Bunch",        type: "Standard", price: 45,  cost: 15, stock: 0,  max: 25, active: true,  soldToday: 25 },
];

const WINES = [
  { id: 1, name: "Hunter Valley Rosé",       region: "Hunter Valley, NSW", varietal: "Grenache Rosé",    price: 28, stock: 24, pairedWith: "White Tulip, Pink Peony", notes: "Strawberry, watermelon, light mineral finish" },
  { id: 2, name: "Yarra Valley Chardonnay",  region: "Yarra Valley, VIC",  varietal: "Chardonnay",       price: 32, stock: 18, pairedWith: "Pink Peony, Sunflower",   notes: "Stone fruit, vanilla oak, creamy texture" },
  { id: 3, name: "Barossa Shiraz",            region: "Barossa Valley, SA", varietal: "Shiraz",           price: 35, stock: 12, pairedWith: "Red Rose, Protea",        notes: "Dark berry, black pepper, chocolate" },
  { id: 4, name: "Margaret River Sauv Blanc", region: "Margaret River, WA", varietal: "Sauvignon Blanc",  price: 30, stock: 30, pairedWith: "Sunflower, White Lily",   notes: "Tropical citrus, fresh-cut grass, crisp" },
];

const CUSTOMERS = [
  { id: 1, name: "Sarah Kim",     email: "sarah@email.com", phone: "0412 345 678", orders: 8,  total: 740,  tag: "VIP",        lastOrder: "Apr 20", suburb: "Epping",       annivCount: 2 },
  { id: 2, name: "James Wilson",  email: "james@email.com", phone: "0423 456 789", orders: 3,  total: 228,  tag: "ACTIVE",     lastOrder: "Apr 18", suburb: "Carlingford",  annivCount: 1 },
  { id: 3, name: "Mia Chen",      email: "mia@email.com",   phone: "0434 567 890", orders: 12, total: 1120, tag: "SUBSCRIBER", lastOrder: "Apr 25", suburb: "Ryde",         annivCount: 3 },
  { id: 4, name: "Tom Harrison",  email: "tom@email.com",   phone: "0445 678 901", orders: 5,  total: 455,  tag: "ACTIVE",     lastOrder: "Apr 25", suburb: "Macquarie Pk", annivCount: 1 },
  { id: 5, name: "Chris Park",    email: "chris@email.com", phone: "0456 789 012", orders: 2,  total: 143,  tag: "NEW",        lastOrder: "Apr 10", suburb: "Eastwood",     annivCount: 1 },
  { id: 6, name: "Anna Lee",      email: "anna@email.com",  phone: "0467 890 123", orders: 6,  total: 510,  tag: "SUBSCRIBER", lastOrder: "Apr 22", suburb: "Epping",       annivCount: 2 },
];

const SUBSCRIPTIONS = [
  { id: 1, name: "Mia Chen",   plan: "Monthly",    nextDate: "May 1",  product: "Seasonal Bunch",  price: 48,  status: "ACTIVE",  autoRenew: true  },
  { id: 2, name: "Anna Lee",   plan: "Fortnightly", nextDate: "Apr 28", product: "Tulip + Rosé",   price: 95,  status: "ACTIVE",  autoRenew: true  },
  { id: 3, name: "Sarah Kim",  plan: "Monthly",    nextDate: "May 5",  product: "Hamper Deluxe",   price: 120, status: "PAUSED",  autoRenew: false },
  { id: 4, name: "Tom H.",     plan: "Monthly",    nextDate: "May 10", product: "Standard Bunch",  price: 48,  status: "ACTIVE",  autoRenew: true  },
];

const ANNIVERSARY_DATA = [
  { day: 26, name: "Chris P.", event: "Wife's Birthday",   daysLeft: 2, lastFlower: "Pink Peony", sent: false },
  { day: 29, name: "Anna L.",  event: "Anniversary",        daysLeft: 5, lastFlower: "White Tulip", sent: false },
  { day: 3,  name: "Mark B.",  event: "Mother's Day",       daysLeft: 9, lastFlower: "Sunflower",  sent: false, nextMonth: true },
];

const FLEMINGTON = [
  { flower: "White Tulip",   bunches: 12, unit: "단", note: "Main product today",    checked: false },
  { flower: "Pink Peony",    bunches: 6,  unit: "단", note: "Tomorrow schedule",     checked: false },
  { flower: "Baby's Breath", bunches: 8,  unit: "묶음", note: "Filler — all orders", checked: false },
  { flower: "Eucalyptus",    bunches: 4,  unit: "묶음", note: "Hamper decor",         checked: false },
];

const ROUTE = [
  { order: "#0120", name: "Amy L.",  addr: "Eastwood",     fullAddr: "21 Eastwood Ave",         time: "12:30 PM", done: true  },
  { order: "#0121", name: "Tom H.",  addr: "Macquarie Pk", fullAddr: "3 Herring Rd",            time: "1:00 PM",  done: true  },
  { order: "#0124", name: "Sarah K.",addr: "Epping",       fullAddr: "12 Oxford St",            time: "2:00 PM",  done: false, alcohol: true },
  { order: "#0123", name: "James W.",addr: "Carlingford",  fullAddr: "8 Pennant Hills Rd",      time: "3:00 PM",  done: false, alcohol: false },
  { order: "#0122", name: "Mia C.",  addr: "Ryde",         fullAddr: "44 Victoria Rd",          time: "4:00 PM",  done: false, alcohol: true },
];

const WEEKLY_REV = [820, 1040, 960, 1240];

const STATUS_META = {
  PENDING:    { text: "#e8734a", bg: "#2a1510" },
  PACKING:    { text: "#c8a96e", bg: "#1a1500" },
  DISPATCHED: { text: "#6ab",   bg: "#0a1520" },
  DELIVERED:  { text: "#4a9",   bg: "#0a1a12" },
};

const TAG_META = {
  VIP:        { text: "#e8c98e", bg: "#2a1e08" },
  SUBSCRIBER: { text: "#4a9",   bg: "#0a1a12" },
  ACTIVE:     { text: "#6ab",   bg: "#0a1520" },
  NEW:        { text: "#888",   bg: "#1a1a1a" },
};

const SUB_META = {
  ACTIVE: { text: "#4a9",   bg: "#0a1a12" },
  PAUSED: { text: "#888",   bg: "#1a1a1a" },
};

// ─────────────────────────────────────────────────────────────────────────────
// NAV STRUCTURE
// ─────────────────────────────────────────────────────────────────────────────
const NAV = [
  { section: "DAILY OPS", items: [
    { id: "dashboard",  icon: "⬡", label: "Dashboard",        badge: null    },
    { id: "flemington", icon: "✿", label: "Flemington 리스트", badge: "TODAY" },
    { id: "orders",     icon: "◈", label: "주문 관리",          badge: "12"    },
    { id: "packing",    icon: "◻", label: "Packing Slip",      badge: null    },
    { id: "delivery",   icon: "◎", label: "배송 루트",          badge: null    },
  ]},
  { section: "CATALOGUE", items: [
    { id: "today",    icon: "✦", label: "오늘의 꽃 관리", badge: null },
    { id: "products", icon: "❋", label: "상품 & 재고",    badge: null },
    { id: "wine",     icon: "◉", label: "와인 페어링",    badge: null },
  ]},
  { section: "CUSTOMERS", items: [
    { id: "customers",     icon: "⬟", label: "고객 DB",      badge: null },
    { id: "anniversaries", icon: "◇", label: "기념일 캘린더", badge: "3"  },
    { id: "subscriptions", icon: "◐", label: "구독 관리",    badge: null },
  ]},
  { section: "GROWTH", items: [
    { id: "analytics", icon: "◬", label: "매출 분석",   badge: null },
    { id: "instagram", icon: "⬡", label: "인스타 연동", badge: null },
    { id: "settings",  icon: "◯", label: "설정",        badge: null },
  ]},
];

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  gold:   "#c8a96e",
  goldLt: "#e8c98e",
  red:    "#e8734a",
  green:  "#4a9a78",
  blue:   "#6aaabb",
  bg0:    "#080804",
  bg1:    "#0f0f0a",
  bg2:    "#1a1a0e",
  border: "#2a2a1a",
  borderFaint: "#1a1a0a",
  text:   "#e8e8d8",
  muted:  "#888",
  dim:    "#555",
  dimmer: "#333",
};

function PageHeader({ title, sub, action }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
      <div>
        <h1 style={{ fontSize:22, fontWeight:300, color:C.text, letterSpacing:1, margin:0 }}>{title}</h1>
        {sub && <div style={{ fontSize:12, color:C.dim, marginTop:4, fontFamily:"monospace" }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

function StatCard({ label, value, sub, accent, warn, green }) {
  const border = warn ? C.red : green ? C.green : accent ? C.gold : C.border;
  const bg     = warn ? "#1a0e0a" : green ? "#0a1a10" : accent ? C.bg2 : C.bg1;
  const valCol = warn ? C.red : green ? C.green : accent ? C.gold : C.text;
  return (
    <div style={{ background:bg, border:`1px solid ${border}`, borderRadius:2, padding:"20px 24px", position:"relative", overflow:"hidden" }}>
      {(accent || warn || green) && (
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background: warn ? C.red : green ? C.green : `linear-gradient(90deg,${C.gold},${C.goldLt})` }} />
      )}
      <div style={{ fontSize:11, color:C.dim, letterSpacing:2, marginBottom:8, fontFamily:"monospace" }}>{label}</div>
      <div style={{ fontSize:32, fontWeight:300, color:valCol, letterSpacing:-1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:C.dim, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function AlcoholBadge({ small }) {
  return (
    <span title="주류 포함 — ID 확인 필수" style={{
      display:"inline-flex", alignItems:"center", gap:3,
      fontFamily:"monospace", fontSize: small ? 9 : 10, color:C.red,
      background:"#2a1510", border:`1px solid ${C.red}44`,
      padding: small ? "1px 5px" : "2px 7px", borderRadius:1, letterSpacing:1, cursor:"help", whiteSpace:"nowrap"
    }}>🍷 ID</span>
  );
}

function Btn({ children, onClick, variant = "ghost", style: s = {} }) {
  const styles = {
    primary: { background:`linear-gradient(135deg,${C.gold},#a87940)`, border:"none", color:"#0a0a05", fontWeight:700 },
    outline: { background:"transparent", border:`1px solid ${C.gold}`, color:C.gold },
    ghost:   { background:"transparent", border:`1px solid ${C.border}`, color:C.dim },
    danger:  { background:"transparent", border:`1px solid ${C.red}44`, color:C.red },
  };
  return (
    <button onClick={onClick} style={{
      padding:"7px 16px", borderRadius:1, fontSize:11, cursor:"pointer",
      fontFamily:"monospace", letterSpacing:1, ...styles[variant], ...s
    }}>{children}</button>
  );
}

function SectionBox({ title, action, children, style: s = {} }) {
  return (
    <div style={{ background:C.bg1, border:`1px solid ${C.border}`, borderRadius:2, overflow:"hidden", ...s }}>
      {(title || action) && (
        <div style={{ padding:"13px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          {title && <span style={{ fontSize:11, color:C.dim, fontFamily:"monospace", letterSpacing:2 }}>{title}</span>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function StatusPill({ status }) {
  const m = STATUS_META[status] || { text:C.muted, bg:"#1a1a1a" };
  return <span style={{ fontFamily:"monospace", fontSize:10, color:m.text, background:m.bg, padding:"3px 9px", borderRadius:1, letterSpacing:1 }}>{status}</span>;
}

function TagPill({ tag }) {
  const m = TAG_META[tag] || { text:C.muted, bg:"#1a1a1a" };
  return <span style={{ fontFamily:"monospace", fontSize:10, color:m.text, background:m.bg, padding:"2px 8px", borderRadius:1, letterSpacing:1 }}>{tag}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// COUNTDOWN HOOK
// ─────────────────────────────────────────────────────────────────────────────
function useCountdown(targetHour = 13) {
  const calc = useCallback(() => {
    const now = new Date();
    const t = new Date(now); t.setHours(targetHour, 0, 0, 0);
    if (now >= t) t.setDate(t.getDate() + 1);
    return Math.max(0, Math.floor((t - now) / 1000));
  }, [targetHour]);
  const [secs, setSecs] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setSecs(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return { display: `${h}:${m}:${s}`, urgent: secs < 1800 };
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function DashboardPage() {
  const { display, urgent } = useCountdown(13);
  const alcoholPending = ORDERS.filter(o => o.hasAlcohol && o.status !== "DELIVERED").length;

  return (
    <div>
      {/* Header bar */}
      <div style={{ background:C.bg1, border:`1px solid ${C.border}`, borderRadius:2, padding:"12px 20px", marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:11, color:C.dim, fontFamily:"monospace", letterSpacing:2 }}>SYDNEY · FRIDAY 25 APR 2025</span>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:10, color:C.dim, fontFamily:"monospace", letterSpacing:2 }}>ORDER CUTOFF IN</div>
            <div style={{ fontSize:22, fontFamily:"monospace", color: urgent ? C.red : C.gold, letterSpacing:3 }}>{display}</div>
          </div>
          <Btn variant={urgent ? "danger" : "ghost"}>CLOSE NOW</Btn>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        <StatCard label="TODAY ORDERS" value="12"   sub="+3 from yesterday"  accent />
        <StatCard label="REVENUE"      value="$1,240" sub="Wine hamper 58%"   />
        <StatCard label="🍷 ID CHECK"  value={alcoholPending} sub="주류 미배송 건" warn />
        <StatCard label="DELIVERED"    value="6 / 12" sub="3 dispatched"      green />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16 }}>
        <SectionBox title="TODAY'S ORDER QUEUE">
          {ORDERS.map(o => (
            <div key={o.id} style={{ display:"flex", alignItems:"center", padding:"11px 20px", borderBottom:`1px solid ${C.borderFaint}`, gap:10 }}>
              <span style={{ fontFamily:"monospace", fontSize:11, color:C.dim, width:52 }}>{o.id}</span>
              <span style={{ flex:1, fontSize:13, color:C.text }}>{o.name}</span>
              <span style={{ flex:2, fontSize:12, color:C.muted }}>{o.product}</span>
              {o.hasAlcohol && <AlcoholBadge small />}
              <StatusPill status={o.status} />
            </div>
          ))}
        </SectionBox>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <SectionBox title="FLEMINGTON TODAY">
            <div style={{ padding:"8px 0" }}>
              {FLEMINGTON.map(f => (
                <div key={f.flower} style={{ display:"flex", justifyContent:"space-between", padding:"8px 20px", borderBottom:`1px solid ${C.borderFaint}` }}>
                  <span style={{ fontSize:12, color:C.muted }}>{f.flower}</span>
                  <span style={{ fontFamily:"monospace", fontSize:12, color:C.gold }}>{f.bunches}{f.unit}</span>
                </div>
              ))}
            </div>
          </SectionBox>

          <SectionBox title="ANNIVERSARIES">
            <div style={{ padding:"8px 0" }}>
              {ANNIVERSARY_DATA.map(a => (
                <div key={a.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 20px", borderBottom:`1px solid ${C.borderFaint}` }}>
                  <div>
                    <div style={{ fontSize:12, color:C.text }}>{a.name}</div>
                    <div style={{ fontSize:11, color:C.dim, marginTop:2 }}>{a.event}</div>
                  </div>
                  <span style={{ fontFamily:"monospace", fontSize:11, color: a.daysLeft<=3 ? C.red : C.gold, background: a.daysLeft<=3 ? "#2a1510":"#1a1500", padding:"2px 8px", borderRadius:1 }}>D-{a.daysLeft}</span>
                </div>
              ))}
            </div>
          </SectionBox>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: FLEMINGTON LIST
// ─────────────────────────────────────────────────────────────────────────────
function FlemingtonPage() {
  const [items, setItems] = useState(FLEMINGTON);
  const toggle = (i) => setItems(prev => prev.map((x, idx) => idx === i ? { ...x, checked: !x.checked } : x));
  const doneCount = items.filter(x => x.checked).length;

  return (
    <div>
      <PageHeader
        title="Flemington 구매 리스트"
        sub={`오늘 시장 픽업 · ${doneCount}/${items.length} 완료`}
        action={<Btn variant="outline">🖨 PRINT LIST</Btn>}
      />
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16 }}>
        <SectionBox title="SHOPPING LIST · APR 25">
          {items.map((f, i) => (
            <div key={f.flower} onClick={() => toggle(i)} style={{
              display:"flex", alignItems:"center", gap:16, padding:"16px 24px",
              borderBottom:`1px solid ${C.borderFaint}`, cursor:"pointer",
              opacity: f.checked ? 0.4 : 1, transition:"opacity 0.2s"
            }}>
              <div style={{
                width:26, height:26, border:`1px solid ${f.checked ? C.green : C.border}`,
                borderRadius:2, display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:14, color:C.green, background: f.checked ? "#0a1a10" : "transparent", flexShrink:0
              }}>
                {f.checked ? "✓" : ""}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, color:C.text, textDecoration: f.checked ? "line-through" : "none" }}>{f.flower}</div>
                <div style={{ fontSize:11, color:C.dim, marginTop:2 }}>{f.note}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:22, fontWeight:300, color:C.gold, fontFamily:"monospace" }}>{f.bunches}</div>
                <div style={{ fontSize:11, color:C.dim }}>{f.unit}</div>
              </div>
            </div>
          ))}
          <div style={{ padding:"14px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:11, color:C.dim, fontFamily:"monospace" }}>TOTAL ITEMS: {items.reduce((a, b) => a + b.bunches, 0)}</span>
            <Btn variant="ghost" onClick={() => setItems(FLEMINGTON)}>RESET</Btn>
          </div>
        </SectionBox>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <SectionBox>
            <div style={{ padding:24 }}>
              <div style={{ fontSize:11, color:C.dim, letterSpacing:2, marginBottom:16, fontFamily:"monospace" }}>MARKET INFO</div>
              <div style={{ fontSize:12, color:C.muted, lineHeight:2 }}>
                Sydney Flower Market<br />
                <span style={{ color:C.gold }}>Stall 14A · Kim's Wholesale</span><br />
                영업: 05:30 – 09:00 AM<br />
                <span style={{ color:C.dim }}>Flemington NSW 2140</span>
              </div>
              <div style={{ marginTop:16, padding:"10px 14px", background:"#0a0a05", border:`1px solid ${C.borderFaint}`, borderRadius:2, fontSize:11, color:C.dim, lineHeight:1.8 }}>
                💡 Peony 내일 스케줄 있으니<br />여분 2단 추가 권장
              </div>
            </div>
          </SectionBox>

          <SectionBox>
            <div style={{ padding:24 }}>
              <div style={{ fontSize:11, color:C.dim, letterSpacing:2, marginBottom:12, fontFamily:"monospace" }}>BUDGET ESTIMATE</div>
              <div style={{ fontSize:32, fontWeight:300, color:C.text }}>~$180</div>
              <div style={{ fontSize:12, color:C.dim, marginTop:4 }}>단가 평균 $12 기준</div>
              <div style={{ marginTop:16, height:4, background:C.borderFaint, borderRadius:2 }}>
                <div style={{ height:"100%", width:`${(doneCount/items.length)*100}%`, background:C.gold, borderRadius:2, transition:"width 0.3s" }} />
              </div>
              <div style={{ fontSize:11, color:C.dim, marginTop:6, fontFamily:"monospace" }}>{doneCount}/{items.length} PICKED UP</div>
            </div>
          </SectionBox>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: ORDERS
// ─────────────────────────────────────────────────────────────────────────────
function OrdersPage() {
  const [filter, setFilter] = useState("ALL");
  const statuses = ["ALL", "PENDING", "PACKING", "DISPATCHED", "DELIVERED"];
  const filtered = filter === "ALL" ? ORDERS : ORDERS.filter(o => o.status === filter);
  const alcoholCount = ORDERS.filter(o => o.hasAlcohol).length;

  return (
    <div>
      <PageHeader title="주문 관리" sub="12 orders today · 3 pending action" />

      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
        {statuses.map(f => {
          const cnt = f === "ALL" ? ORDERS.length : ORDERS.filter(o => o.status === f).length;
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:"6px 14px", borderRadius:1, cursor:"pointer", fontFamily:"monospace", fontSize:11, letterSpacing:1,
              background: filter===f ? C.bg2 : "transparent",
              border: `1px solid ${filter===f ? C.gold : C.border}`,
              color: filter===f ? C.gold : C.dim,
            }}>{f} ({cnt})</button>
          );
        })}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
          <AlcoholBadge />
          <span style={{ fontSize:11, color:C.red, fontFamily:"monospace" }}>{alcoholCount}건 — 수령 시 ID 확인 필수</span>
        </div>
      </div>

      <SectionBox>
        <div style={{ display:"grid", gridTemplateColumns:"60px 110px 1fr 1fr 80px 70px 120px 80px", padding:"10px 20px", borderBottom:`1px solid ${C.border}` }}>
          {["ORDER","CUSTOMER","PRODUCT","ADDRESS","TIME","TOTAL","STATUS","SLIP"].map(h => (
            <span key={h} style={{ fontSize:10, color:C.dimmer, fontFamily:"monospace", letterSpacing:1 }}>{h}</span>
          ))}
        </div>
        {filtered.map(o => (
          <div key={o.id} style={{ display:"grid", gridTemplateColumns:"60px 110px 1fr 1fr 80px 70px 120px 80px", padding:"13px 20px", borderBottom:`1px solid ${C.borderFaint}`, alignItems:"center" }}>
            <span style={{ fontFamily:"monospace", fontSize:11, color:C.dim }}>{o.id}</span>
            <span style={{ fontSize:13, color:C.text }}>{o.name}</span>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:12, color:C.muted }}>{o.product}</span>
              {o.hasAlcohol && <AlcoholBadge small />}
            </div>
            <span style={{ fontSize:11, color:C.dim }}>{o.addr}</span>
            <span style={{ fontSize:12, color:C.muted }}>{o.time}</span>
            <span style={{ fontSize:13, color:C.gold }}>${o.total}</span>
            <StatusPill status={o.status} />
            <Btn variant="ghost" style={{ padding:"4px 10px", fontSize:10 }}>PRINT ↗</Btn>
          </div>
        ))}
      </SectionBox>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: PACKING SLIP
// ─────────────────────────────────────────────────────────────────────────────
function PackingPage() {
  const [selectedId, setSelectedId] = useState(ORDERS[0].id);
  const order = ORDERS.find(o => o.id === selectedId);

  return (
    <div>
      <PageHeader title="Packing Slip" sub="주문 선택 → 미리보기 → 프린트" />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:16 }}>
        <SectionBox title="SELECT ORDER">
          {ORDERS.map(o => (
            <div key={o.id} onClick={() => setSelectedId(o.id)} style={{
              padding:"12px 20px", borderBottom:`1px solid ${C.borderFaint}`, cursor:"pointer",
              background: selectedId===o.id ? C.bg2 : "transparent",
              borderLeft:`2px solid ${selectedId===o.id ? C.gold : "transparent"}`,
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:13, color: selectedId===o.id ? C.text : C.muted }}>{o.name}</span>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  {o.hasAlcohol && <span style={{ fontSize:14 }}>🍷</span>}
                </div>
              </div>
              <div style={{ fontSize:11, color:C.dim, marginTop:3, display:"flex", gap:8 }}>
                <span>{o.id}</span>
                <StatusPill status={o.status} />
              </div>
            </div>
          ))}
        </SectionBox>

        {order && (
          <div>
            {/* Print preview — light-themed */}
            <div style={{ background:"#f8f4ee", borderRadius:2, padding:36, color:"#2a1a0a" }}>
              <div style={{ borderBottom:"2px solid #2a1a0a", paddingBottom:16, marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:20, letterSpacing:4, color:"#8a5a1a", fontFamily:"Georgia,serif" }}>BLOOM</div>
                  <div style={{ fontSize:10, color:"#aa8a5a", letterSpacing:2, marginTop:2 }}>SYDNEY FLORIST · CARLINGFORD</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, color:"#888", fontFamily:"monospace" }}>ORDER {order.id}</div>
                  <div style={{ fontSize:11, color:"#888", fontFamily:"monospace" }}>APR 25, 2025</div>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:24 }}>
                <div>
                  <div style={{ fontSize:10, letterSpacing:2, color:"#aa8a5a", marginBottom:8 }}>RECIPIENT</div>
                  <div style={{ fontSize:14, fontWeight:600 }}>{order.name}</div>
                  <div style={{ fontSize:12, color:"#666", marginTop:4, lineHeight:1.6 }}>{order.addr}</div>
                </div>
                <div>
                  <div style={{ fontSize:10, letterSpacing:2, color:"#aa8a5a", marginBottom:8 }}>DELIVERY TIME</div>
                  <div style={{ fontSize:13 }}>{order.time}</div>
                  {order.hasAlcohol && (
                    <div style={{ marginTop:8, padding:"7px 10px", background:"#fde8d8", border:"1px solid #e8734a", borderRadius:2, fontSize:11, color:"#c0481a", fontWeight:600 }}>
                      ⚠️ ALCOHOL — ID VERIFICATION REQUIRED AT DOOR
                    </div>
                  )}
                </div>
              </div>

              <div style={{ background:"#f0ead8", borderRadius:2, padding:"14px 18px", marginBottom:20 }}>
                <div style={{ fontSize:10, letterSpacing:2, color:"#aa8a5a", marginBottom:6 }}>PRODUCT</div>
                <div style={{ fontSize:14, fontWeight:600 }}>{order.product}</div>
                <div style={{ fontSize:13, color:"#8a6a3a", marginTop:4 }}>${order.total}</div>
              </div>

              <div style={{ border:"1px dashed #c8a878", borderRadius:2, padding:"16px 18px", marginBottom:24 }}>
                <div style={{ fontSize:10, letterSpacing:2, color:"#aa8a5a", marginBottom:8 }}>MESSAGE CARD</div>
                <div style={{ fontSize:15, color:"#4a2a0a", fontStyle:"italic", lineHeight:1.7 }}>"{order.msg}"</div>
              </div>

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:10, color:"#aaa" }}>bloom.com.au · Carlingford NSW 2118</div>
                <button style={{ padding:"10px 24px", background:"#2a1a0a", border:"none", color:"#f0e8d8", fontSize:12, cursor:"pointer", fontFamily:"monospace", letterSpacing:2, borderRadius:2 }}>
                  🖨 PRINT SLIP
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: DELIVERY ROUTE
// ─────────────────────────────────────────────────────────────────────────────
function DeliveryPage() {
  const [route, setRoute] = useState(ROUTE);
  const nextIdx = route.findIndex(r => !r.done);
  const markDone = (i) => setRoute(prev => prev.map((r, idx) => idx === i ? { ...r, done: true } : r));
  const doneCount = route.filter(r => r.done).length;

  return (
    <div>
      <PageHeader title="배송 루트 최적화" sub={`Carlingford 거점 출발 · ${doneCount}/${route.length} 완료`} />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <SectionBox title="RECOMMENDED ROUTE">
          <div style={{ padding:"8px 0" }}>
            {route.map((r, i) => (
              <div key={r.order} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 20px", borderBottom: i<route.length-1 ? `1px solid ${C.borderFaint}` : "none", opacity: r.done ? 0.35 : 1, transition:"opacity 0.3s" }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                  <div style={{
                    width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11,
                    background: r.done ? "#0a1a10" : i===nextIdx ? C.bg2 : "#141410",
                    border:`1px solid ${r.done ? C.green : i===nextIdx ? C.gold : C.border}`,
                    color: r.done ? C.green : C.muted,
                  }}>
                    {r.done ? "✓" : i + 1}
                  </div>
                  {i < route.length - 1 && <div style={{ width:1, height:12, background:C.borderFaint }} />}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:13, color: r.done ? C.dim : C.text }}>{r.addr}</span>
                    {r.alcohol && <AlcoholBadge small />}
                  </div>
                  <div style={{ fontSize:11, color:C.dimmer, marginTop:2 }}>{r.order} · {r.name} · {r.fullAddr}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontFamily:"monospace", fontSize:11, color:C.dim }}>{r.time}</span>
                  {!r.done && i===nextIdx && (
                    <Btn variant="outline" style={{ fontSize:10, padding:"4px 10px" }} onClick={() => markDone(i)}>DONE</Btn>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding:16, borderTop:`1px solid ${C.borderFaint}` }}>
            <Btn variant="primary" style={{ width:"100%", padding:"11px", textAlign:"center" }}>OPEN IN GOOGLE MAPS →</Btn>
          </div>
        </SectionBox>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <SectionBox title="ZONE MAP · NW SYDNEY">
            <div style={{ padding:20 }}>
              {[
                { zone:"Carlingford 2118", orders:4, pct:80, color:C.gold },
                { zone:"Epping 2121",      orders:3, pct:60, color:"#a8893e" },
                { zone:"Macquarie Pk 2113",orders:3, pct:60, color:"#8a6a28" },
                { zone:"Eastwood 2122",    orders:2, pct:40, color:"#6a5020" },
                { zone:"Ryde 2112",        orders:2, pct:40, color:"#4a3818" },
              ].map(z => (
                <div key={z.zone} style={{ marginBottom:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontSize:12, color:C.muted }}>{z.zone}</span>
                    <span style={{ fontFamily:"monospace", fontSize:12, color:z.color }}>{z.orders} orders</span>
                  </div>
                  <div style={{ height:4, background:C.borderFaint, borderRadius:2 }}>
                    <div style={{ height:"100%", width:`${z.pct}%`, background:z.color, borderRadius:2 }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionBox>

          <SectionBox>
            <div style={{ padding:20 }}>
              <div style={{ fontSize:11, color:C.dim, letterSpacing:2, marginBottom:14, fontFamily:"monospace" }}>TODAY'S PROGRESS</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                {[["DONE", doneCount, C.green], ["LEFT", route.length - doneCount, C.gold], ["ALCOHOL", route.filter(r=>r.alcohol).length, C.red]].map(([l,v,c]) => (
                  <div key={l} style={{ background:"#0a0a05", border:`1px solid ${c}22`, borderRadius:2, padding:"12px 14px" }}>
                    <div style={{ fontSize:9, color:C.dim, fontFamily:"monospace", letterSpacing:2, marginBottom:6 }}>{l}</div>
                    <div style={{ fontSize:24, fontWeight:300, color:c }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </SectionBox>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: TODAY'S FLOWER
// ─────────────────────────────────────────────────────────────────────────────
function TodayFlowerPage() {
  return (
    <div>
      <PageHeader title="오늘의 꽃 관리" sub="Daily Bunch · Auto-publishes 06:00 AM via ISR" />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <SectionBox title="TODAY'S LISTING">
          <div style={{ padding:24 }}>
            <div style={{ background:C.bg2, border:`1px dashed ${C.border}`, borderRadius:2, height:130, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20, color:C.dim, fontSize:13, cursor:"pointer" }}>
              + 꽃 사진 드래그 & 드롭
            </div>
            {[["FLOWER NAME","White Tulip Bunch"],["PAIRING","Hunter Valley Rosé"],["STANDARD PRICE","$48"],["HAMPER PRICE","$95"],["STOCK LIMIT","20 units"],["CUTOFF TIME","1:00 PM"]].map(([l,v]) => (
              <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:`1px solid ${C.borderFaint}` }}>
                <span style={{ fontSize:11, color:C.dim, fontFamily:"monospace" }}>{l}</span>
                <span style={{ fontSize:13, color:C.text }}>{v}</span>
              </div>
            ))}
            <Btn variant="primary" style={{ width:"100%", marginTop:20, padding:"11px", textAlign:"center" }}>PUBLISH → SITE + INSTAGRAM</Btn>
          </div>
        </SectionBox>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <SectionBox title="INSTAGRAM CAPTION">
            <div style={{ padding:20 }}>
              <div style={{ background:"#0a0a05", border:`1px solid ${C.borderFaint}`, borderRadius:2, padding:14, fontSize:12, color:"#777", lineHeight:1.9, marginBottom:14 }}>
                🌷 오늘의 무드: White Tulip & Hunter Valley Rosé<br />
                순백의 튤립이 전하는 청초함, 거기에 산미가 살아있는 로제 한 잔. ✨<br />
                <span style={{ color:C.dimmer }}>#SydneyFlorist #DailyFlowers #WinePairing #Carlingford</span>
              </div>
              <Btn variant="ghost" style={{ width:"100%", textAlign:"center" }}>✏ EDIT CAPTION</Btn>
            </div>
          </SectionBox>

          <SectionBox title="3-DAY SCHEDULE">
            <div style={{ padding:"8px 0" }}>
              {[["Apr 26","Pink Peony + Chardonnay","READY"],["Apr 27","Sunflower + Sauv Blanc","READY"],["Apr 28","TBD","MISSING"]].map(([d,t,s]) => (
                <div key={d} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 20px", borderBottom:`1px solid ${C.borderFaint}` }}>
                  <div>
                    <span style={{ fontSize:11, color:C.dim, fontFamily:"monospace", marginRight:12 }}>{d}</span>
                    <span style={{ fontSize:12, color: s==="MISSING" ? C.dimmer : C.muted }}>{t}</span>
                  </div>
                  <span style={{ fontSize:10, color: s==="MISSING" ? C.red : C.green, fontFamily:"monospace" }}>{s}</span>
                </div>
              ))}
            </div>
          </SectionBox>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: PRODUCTS & STOCK
// ─────────────────────────────────────────────────────────────────────────────
function ProductsPage() {
  const [products, setProducts] = useState(PRODUCTS);
  const toggleActive = (id) => setProducts(prev => prev.map(p => p.id===id ? { ...p, active:!p.active } : p));

  return (
    <div>
      <PageHeader
        title="상품 & 재고"
        sub={`${products.filter(p=>p.active).length} active · ${products.filter(p=>p.stock===0).length} sold out`}
        action={<Btn variant="outline">+ ADD PRODUCT</Btn>}
      />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
        <StatCard label="ACTIVE PRODUCTS" value={products.filter(p=>p.active).length} />
        <StatCard label="LOW STOCK"        value={products.filter(p=>p.stock>0&&p.stock/p.max<0.3).length} sub="Under 30%" warn />
        <StatCard label="SOLD OUT"         value={products.filter(p=>p.stock===0).length} accent />
      </div>

      <SectionBox>
        <div style={{ display:"grid", gridTemplateColumns:"180px 90px 70px 70px 70px 1fr 80px 70px", padding:"10px 20px", borderBottom:`1px solid ${C.border}` }}>
          {["PRODUCT","TYPE","PRICE","COST","MARGIN","STOCK","SOLD TODAY","STATUS"].map(h => (
            <span key={h} style={{ fontSize:10, color:C.dimmer, fontFamily:"monospace", letterSpacing:1 }}>{h}</span>
          ))}
        </div>
        {products.map(p => {
          const margin = Math.round(((p.price - p.cost) / p.price) * 100);
          const stockPct = p.stock / p.max;
          const stockColor = p.stock===0 ? C.red : stockPct<0.3 ? C.red : stockPct<0.6 ? C.gold : C.green;
          return (
            <div key={p.id} style={{ display:"grid", gridTemplateColumns:"180px 90px 70px 70px 70px 1fr 80px 70px", padding:"14px 20px", borderBottom:`1px solid ${C.borderFaint}`, alignItems:"center", opacity: p.active ? 1 : 0.45 }}>
              <div>
                <div style={{ fontSize:13, color:C.text }}>{p.name}</div>
              </div>
              <span style={{ fontSize:11, color: p.type==="Hamper" ? C.gold : C.muted, fontFamily:"monospace" }}>{p.type.toUpperCase()}</span>
              <span style={{ fontSize:13, color:C.gold }}>${p.price}</span>
              <span style={{ fontSize:13, color:C.dim }}>${p.cost}</span>
              <span style={{ fontSize:13, color: margin>55 ? C.green : margin>40 ? C.gold : C.red }}>{margin}%</span>
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:11, color:stockColor, fontFamily:"monospace" }}>{p.stock}/{p.max}</span>
                  {p.stock===0 && <span style={{ fontSize:9, color:C.red, fontFamily:"monospace" }}>SOLD OUT</span>}
                </div>
                <div style={{ height:3, background:C.borderFaint, borderRadius:2 }}>
                  <div style={{ height:"100%", width:`${stockPct*100}%`, background:stockColor, borderRadius:2 }} />
                </div>
              </div>
              <span style={{ fontSize:13, color: p.soldToday>0 ? C.muted : C.dimmer }}>{p.soldToday > 0 ? `${p.soldToday} sold` : "—"}</span>
              <button onClick={() => toggleActive(p.id)} style={{
                padding:"4px 10px", borderRadius:1, fontSize:10, cursor:"pointer", fontFamily:"monospace", letterSpacing:1,
                background: p.active ? "#0a1a10" : "#1a1a1a", border:`1px solid ${p.active ? C.green : C.border}`,
                color: p.active ? C.green : C.dim,
              }}>{p.active ? "LIVE" : "OFF"}</button>
            </div>
          );
        })}
      </SectionBox>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: WINE PAIRING
// ─────────────────────────────────────────────────────────────────────────────
function WinePage() {
  const [selected, setSelected] = useState(WINES[0].id);
  const wine = WINES.find(w => w.id === selected);

  return (
    <div>
      <PageHeader title="와인 페어링" sub="Curated pairings · Packaged Liquor Licence required" action={<Btn variant="outline">+ ADD WINE</Btn>} />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <SectionBox title="WINE CATALOGUE">
          {WINES.map(w => (
            <div key={w.id} onClick={() => setSelected(w.id)} style={{
              padding:"16px 20px", borderBottom:`1px solid ${C.borderFaint}`, cursor:"pointer",
              background: selected===w.id ? C.bg2 : "transparent",
              borderLeft:`2px solid ${selected===w.id ? C.gold : "transparent"}`,
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:13, color: selected===w.id ? C.text : C.muted }}>{w.name}</div>
                  <div style={{ fontSize:11, color:C.dim, marginTop:3 }}>{w.region} · {w.varietal}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:14, color:C.gold }}>${w.price}</div>
                  <div style={{ fontSize:11, color:C.dim, marginTop:2, fontFamily:"monospace" }}>{w.stock} left</div>
                </div>
              </div>
            </div>
          ))}
        </SectionBox>

        {wine && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <SectionBox>
              <div style={{ padding:24 }}>
                <div style={{ fontSize:18, fontWeight:300, color:C.text, marginBottom:4 }}>{wine.name}</div>
                <div style={{ fontSize:12, color:C.gold, marginBottom:20, fontFamily:"monospace" }}>{wine.region}</div>
                {[
                  ["VARIETAL",   wine.varietal],
                  ["PRICE",      `$${wine.price}`],
                  ["STOCK",      `${wine.stock} bottles`],
                  ["PAIRS WITH", wine.pairedWith],
                ].map(([l,v]) => (
                  <div key={l} style={{ display:"flex", gap:16, padding:"9px 0", borderBottom:`1px solid ${C.borderFaint}` }}>
                    <span style={{ fontSize:11, color:C.dim, fontFamily:"monospace", width:90 }}>{l}</span>
                    <span style={{ fontSize:13, color:C.muted }}>{v}</span>
                  </div>
                ))}
                <div style={{ marginTop:20, padding:14, background:"#0a0a05", border:`1px solid ${C.borderFaint}`, borderRadius:2 }}>
                  <div style={{ fontSize:10, color:C.dim, fontFamily:"monospace", letterSpacing:2, marginBottom:8 }}>TASTING NOTES</div>
                  <div style={{ fontSize:13, color:C.muted, fontStyle:"italic", lineHeight:1.7 }}>"{wine.notes}"</div>
                </div>
              </div>
            </SectionBox>
            <SectionBox>
              <div style={{ padding:20 }}>
                <div style={{ fontSize:11, color:C.dim, letterSpacing:2, marginBottom:14, fontFamily:"monospace" }}>STOCK LEVEL</div>
                <div style={{ height:6, background:C.borderFaint, borderRadius:3, marginBottom:8 }}>
                  <div style={{ height:"100%", width:`${(wine.stock/40)*100}%`, background: wine.stock<10 ? C.red : C.gold, borderRadius:3 }} />
                </div>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:11, color:C.dim, fontFamily:"monospace" }}>{wine.stock} bottles remaining</span>
                  {wine.stock < 10 && <span style={{ fontSize:11, color:C.red, fontFamily:"monospace" }}>REORDER SOON</span>}
                </div>
              </div>
            </SectionBox>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: CUSTOMER DB
// ─────────────────────────────────────────────────────────────────────────────
function CustomersPage() {
  const [search, setSearch] = useState("");
  const filtered = CUSTOMERS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="고객 DB" sub={`${CUSTOMERS.length} total customers · 41 subscribers`} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        <StatCard label="TOTAL"       value={CUSTOMERS.length} />
        <StatCard label="SUBSCRIBERS" value={CUSTOMERS.filter(c=>c.tag==="SUBSCRIBER").length} sub="Active plan" accent />
        <StatCard label="VIP"         value={CUSTOMERS.filter(c=>c.tag==="VIP").length} sub="8+ orders" />
        <StatCard label="AVG SPEND"   value="$533" sub="Per customer" green />
      </div>

      <SectionBox title="CUSTOMER LIST" action={
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name / email..."
          style={{ background:"#0a0a05", border:`1px solid ${C.border}`, color:C.muted, padding:"6px 12px", fontSize:12, borderRadius:1, fontFamily:"monospace", width:200, outline:"none" }}
        />
      }>
        <div style={{ display:"grid", gridTemplateColumns:"160px 1fr 110px 80px 80px 100px 80px", padding:"10px 20px", borderBottom:`1px solid ${C.border}` }}>
          {["NAME","EMAIL","SUBURB","ORDERS","SPEND","LAST ORDER","TAG"].map(h => (
            <span key={h} style={{ fontSize:10, color:C.dimmer, fontFamily:"monospace", letterSpacing:1 }}>{h}</span>
          ))}
        </div>
        {filtered.map(c => (
          <div key={c.id} style={{ display:"grid", gridTemplateColumns:"160px 1fr 110px 80px 80px 100px 80px", padding:"13px 20px", borderBottom:`1px solid ${C.borderFaint}`, alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:28, height:28, borderRadius:"50%", background:C.bg2, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:C.gold, flexShrink:0 }}>
                {c.name[0]}
              </div>
              <span style={{ fontSize:13, color:C.text }}>{c.name}</span>
            </div>
            <span style={{ fontSize:12, color:C.dim }}>{c.email}</span>
            <span style={{ fontSize:12, color:C.muted }}>{c.suburb}</span>
            <span style={{ fontSize:13, color:C.muted, fontFamily:"monospace" }}>{c.orders}</span>
            <span style={{ fontSize:13, color:C.gold }}>${c.total}</span>
            <span style={{ fontSize:12, color:C.dim }}>{c.lastOrder}</span>
            <TagPill tag={c.tag} />
          </div>
        ))}
      </SectionBox>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: ANNIVERSARY CALENDAR
// ─────────────────────────────────────────────────────────────────────────────
function AnniversaryPage() {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const annivDays = new Set(ANNIVERSARY_DATA.filter(a => !a.nextMonth).map(a => a.day));
  const orderDays = new Set([20, 22, 24, 25, 26, 29]);

  return (
    <div>
      <PageHeader title="기념일 캘린더" sub="April 2025 · 3 reminders due" />
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16 }}>
        <SectionBox>
          <div style={{ padding:24 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <span style={{ fontSize:14, color:C.text, letterSpacing:2 }}>APRIL 2025</span>
              <div style={{ display:"flex", gap:8 }}>
                <Btn variant="ghost" style={{ padding:"4px 12px" }}>‹</Btn>
                <Btn variant="ghost" style={{ padding:"4px 12px" }}>›</Btn>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:8 }}>
              {["SUN","MON","TUE","WED","THU","FRI","SAT"].map(d => (
                <div key={d} style={{ fontSize:10, color:C.dimmer, fontFamily:"monospace", textAlign:"center", paddingBottom:6 }}>{d}</div>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
              {[...Array(2)].map((_, i) => <div key={`e${i}`} />)}
              {days.map(d => {
                const isToday = d === 25;
                const hasAnniv = annivDays.has(d);
                const hasOrder = orderDays.has(d);
                return (
                  <div key={d} style={{
                    aspectRatio:"1", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                    borderRadius:2, cursor:"pointer",
                    background: isToday ? C.bg2 : "transparent",
                    border:`1px solid ${isToday ? C.gold : hasAnniv ? C.gold+"44" : C.borderFaint}`,
                  }}>
                    <span style={{ fontSize:12, color: isToday ? C.gold : C.muted }}>{d}</span>
                    <div style={{ display:"flex", gap:2, marginTop:2 }}>
                      {hasAnniv && <div style={{ width:4, height:4, borderRadius:"50%", background:C.gold }} />}
                      {hasOrder && <div style={{ width:4, height:4, borderRadius:"50%", background:C.green }} />}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display:"flex", gap:16, marginTop:16 }}>
              {[[C.gold,"기념일"],[C.green,"주문"]].map(([color, label]) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:color }} />
                  <span style={{ fontSize:11, color:C.dim }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionBox>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <SectionBox title="REMINDER QUEUE">
            {ANNIVERSARY_DATA.map(a => (
              <div key={a.name} style={{ padding:"14px 20px", borderBottom:`1px solid ${C.borderFaint}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:13, color:C.text }}>{a.name}</div>
                    <div style={{ fontSize:11, color:C.dim, marginTop:2 }}>{a.event}</div>
                    <div style={{ fontSize:11, color:C.dimmer, marginTop:2 }}>Last: {a.lastFlower}</div>
                  </div>
                  <span style={{ fontFamily:"monospace", fontSize:11, color: a.daysLeft<=3 ? C.red : C.gold, background: a.daysLeft<=3 ? "#2a1510":"#1a1500", padding:"3px 8px", borderRadius:1 }}>D-{a.daysLeft}</span>
                </div>
                <Btn variant="ghost" style={{ width:"100%", textAlign:"center", fontSize:10 }}>SEND REMINDER →</Btn>
              </div>
            ))}
          </SectionBox>

          <SectionBox>
            <div style={{ padding:20 }}>
              <div style={{ fontSize:11, color:C.dim, letterSpacing:2, marginBottom:14, fontFamily:"monospace" }}>REMINDER TEMPLATE</div>
              <div style={{ background:"#0a0a05", border:`1px solid ${C.borderFaint}`, borderRadius:2, padding:14, fontSize:12, color:"#666", lineHeight:1.9 }}>
                안녕하세요 <span style={{ color:C.gold }}>{"{name}"}님</span>,<br />
                <span style={{ color:C.gold }}>{"{event}"}</span>이 다가오고 있어요 🌸<br />
                올해도 특별하게 준비해 드릴게요.<br />
                <span style={{ color:C.green }}>→ 10% 얼리버드 할인 적용</span>
              </div>
            </div>
          </SectionBox>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: SUBSCRIPTIONS
// ─────────────────────────────────────────────────────────────────────────────
function SubscriptionsPage() {
  const mrr = SUBSCRIPTIONS.filter(s => s.status==="ACTIVE").reduce((acc, s) => acc + s.price, 0);

  return (
    <div>
      <PageHeader title="구독 관리" sub={`${SUBSCRIPTIONS.filter(s=>s.status==="ACTIVE").length} active subscriptions`} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        <StatCard label="ACTIVE SUBS"  value={SUBSCRIPTIONS.filter(s=>s.status==="ACTIVE").length} accent />
        <StatCard label="MRR"          value={`$${mrr}`} sub="Monthly recurring" green />
        <StatCard label="PAUSED"       value={SUBSCRIPTIONS.filter(s=>s.status==="PAUSED").length} />
        <StatCard label="NEXT BILLING" value="Apr 28" sub="Anna L. · $95" />
      </div>

      <SectionBox title="SUBSCRIPTION LIST">
        <div style={{ display:"grid", gridTemplateColumns:"140px 100px 80px 1fr 80px 80px 80px", padding:"10px 20px", borderBottom:`1px solid ${C.border}` }}>
          {["CUSTOMER","PLAN","NEXT DATE","PRODUCT","PRICE","AUTO","STATUS"].map(h => (
            <span key={h} style={{ fontSize:10, color:C.dimmer, fontFamily:"monospace", letterSpacing:1 }}>{h}</span>
          ))}
        </div>
        {SUBSCRIPTIONS.map(s => {
          const sm = SUB_META[s.status];
          return (
            <div key={s.id} style={{ display:"grid", gridTemplateColumns:"140px 100px 80px 1fr 80px 80px 80px", padding:"14px 20px", borderBottom:`1px solid ${C.borderFaint}`, alignItems:"center" }}>
              <span style={{ fontSize:13, color:C.text }}>{s.name}</span>
              <span style={{ fontSize:12, color:C.muted, fontFamily:"monospace" }}>{s.plan}</span>
              <span style={{ fontSize:12, color:C.gold, fontFamily:"monospace" }}>{s.nextDate}</span>
              <span style={{ fontSize:12, color:C.muted }}>{s.product}</span>
              <span style={{ fontSize:13, color:C.gold }}>${s.price}</span>
              <span style={{ fontSize:12, color: s.autoRenew ? C.green : C.dim, fontFamily:"monospace" }}>{s.autoRenew ? "ON" : "OFF"}</span>
              <span style={{ fontFamily:"monospace", fontSize:10, color:sm.text, background:sm.bg, padding:"3px 8px", borderRadius:1 }}>{s.status}</span>
            </div>
          );
        })}
        <div style={{ padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:11, color:C.dim, fontFamily:"monospace" }}>TOTAL MRR: <span style={{ color:C.gold }}>${mrr}/mo</span></span>
          <Btn variant="outline">+ NEW SUBSCRIPTION</Btn>
        </div>
      </SectionBox>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
function AnalyticsPage() {
  const maxRev = 1400;

  return (
    <div>
      <PageHeader title="매출 분석" sub="April 2025 · Sydney" />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        <StatCard label="MONTHLY REV"  value="$4,060" sub="+18% vs last month"   accent />
        <StatCard label="AVG ORDER"    value="$87"    sub="Hamper avg: $102"      />
        <StatCard label="WINE HAMPER"  value="58%"    sub="of total revenue"      green />
        <StatCard label="NW SUBURBS"   value="68%"    sub="of all orders"         />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16 }}>
        <SectionBox title="WEEKLY REVENUE · APRIL">
          <div style={{ padding:24 }}>
            <div style={{ display:"flex", alignItems:"flex-end", gap:16, height:130 }}>
              {["W1","W2","W3","W4"].map((w, i) => (
                <div key={w} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:11, color:C.gold, fontFamily:"monospace" }}>${WEEKLY_REV[i]}</span>
                  <div style={{ width:"100%", background: i===3 ? `linear-gradient(180deg,${C.gold},#8a6a28)` : C.border, height:`${(WEEKLY_REV[i]/maxRev)*100}%`, borderRadius:"2px 2px 0 0" }} />
                  <span style={{ fontSize:11, color:C.dim, fontFamily:"monospace" }}>{w}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionBox>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <SectionBox title="TOP PRODUCTS">
            <div style={{ padding:"8px 0" }}>
              {[
                { name:"Tulip + Rosé",  rev:740, pct:34 },
                { name:"Hamper Deluxe",  rev:360, pct:17 },
                { name:"Peony + Chard", rev:330, pct:15 },
                { name:"Standard Bunch",rev:290, pct:13 },
              ].map(p => (
                <div key={p.name} style={{ padding:"10px 20px", borderBottom:`1px solid ${C.borderFaint}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ fontSize:12, color:C.muted }}>{p.name}</span>
                    <span style={{ fontSize:12, color:C.gold, fontFamily:"monospace" }}>${p.rev}</span>
                  </div>
                  <div style={{ height:3, background:C.borderFaint, borderRadius:2 }}>
                    <div style={{ height:"100%", width:`${p.pct*2}%`, background:C.gold, borderRadius:2 }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionBox>

          <SectionBox title="DELIVERY ZONES">
            <div style={{ padding:16 }}>
              {[
                { zone:"Carlingford", pct:38 },
                { zone:"Epping",      pct:24 },
                { zone:"Macquarie Pk",pct:18 },
                { zone:"Ryde",        pct:12 },
                { zone:"Other",       pct:8  },
              ].map(z => (
                <div key={z.zone} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <span style={{ fontSize:11, color:C.muted, width:100 }}>{z.zone}</span>
                  <div style={{ flex:1, height:3, background:C.borderFaint, borderRadius:2 }}>
                    <div style={{ height:"100%", width:`${z.pct}%`, background:C.gold, borderRadius:2 }} />
                  </div>
                  <span style={{ fontSize:11, color:C.dim, fontFamily:"monospace", width:28 }}>{z.pct}%</span>
                </div>
              ))}
            </div>
          </SectionBox>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: INSTAGRAM SYNC
// ─────────────────────────────────────────────────────────────────────────────
function InstagramPage() {
  const posts = [
    { id: 1, img: "🌷", caption: "오늘의 무드: White Tulip & Rosé", likes: 142, date: "Apr 25", synced: true },
    { id: 2, img: "🌸", caption: "Pink Peony — 봄의 절정",           likes: 98,  date: "Apr 24", synced: true },
    { id: 3, img: "🌻", caption: "Sunflower + Sauv Blanc",           likes: 76,  date: "Apr 22", synced: false },
  ];

  return (
    <div>
      <PageHeader title="인스타그램 연동" sub="@bloom.sydney.florist · Instagram Basic Display API" />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        <StatCard label="FOLLOWERS"   value="2,840" sub="+120 this month" accent />
        <StatCard label="AVG LIKES"   value="105"   sub="Last 30 posts" />
        <StatCard label="LINK IN BIO" value="48"    sub="Clicks this week" green />
        <StatCard label="API STATUS"  value="LIVE"  sub="Connected" green />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16 }}>
        <SectionBox title="RECENT POSTS">
          {posts.map(p => (
            <div key={p.id} style={{ display:"flex", alignItems:"center", gap:16, padding:"16px 20px", borderBottom:`1px solid ${C.borderFaint}` }}>
              <div style={{ width:52, height:52, background:C.bg2, borderRadius:2, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>
                {p.img}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:C.text }}>{p.caption}</div>
                <div style={{ fontSize:11, color:C.dim, marginTop:3, fontFamily:"monospace" }}>{p.date} · ♥ {p.likes}</div>
              </div>
              <span style={{ fontFamily:"monospace", fontSize:10, color: p.synced ? C.green : C.gold, background: p.synced ? "#0a1a10":"#1a1500", padding:"3px 8px", borderRadius:1 }}>
                {p.synced ? "SYNCED" : "PENDING"}
              </span>
            </div>
          ))}
        </SectionBox>

        <SectionBox title="API SETTINGS">
          <div style={{ padding:20 }}>
            {[
              ["APP ID",       "bloom_sydney_01"],
              ["ACCOUNT",      "@bloom.sydney"],
              ["SCOPE",        "user_media, user_profile"],
              ["TOKEN EXPIRY", "Jun 15, 2025"],
            ].map(([l,v]) => (
              <div key={l} style={{ display:"flex", flexDirection:"column", gap:3, padding:"10px 0", borderBottom:`1px solid ${C.borderFaint}` }}>
                <span style={{ fontSize:10, color:C.dim, fontFamily:"monospace", letterSpacing:2 }}>{l}</span>
                <span style={{ fontSize:12, color:C.muted }}>{v}</span>
              </div>
            ))}
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:16 }}>
              <Btn variant="outline" style={{ width:"100%", textAlign:"center" }}>REFRESH TOKEN</Btn>
              <Btn variant="ghost"   style={{ width:"100%", textAlign:"center" }}>SYNC FEED NOW</Btn>
            </div>
          </div>
        </SectionBox>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
function SettingsPage() {
  const [notif, setNotif] = useState({ newOrder: true, lowStock: true, annivReminder: true, dailyReport: false });
  const toggle = (k) => setNotif(prev => ({ ...prev, [k]: !prev[k] }));

  return (
    <div>
      <PageHeader title="설정" sub="Business configuration · Bloom Sydney" />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <SectionBox title="BUSINESS INFO">
            <div style={{ padding:24 }}>
              {[
                ["BUSINESS NAME",  "Bloom Sydney"],
                ["ABN",            "12 345 678 901"],
                ["ADDRESS",        "Carlingford NSW 2118"],
                ["CUTOFF TIME",    "1:00 PM"],
                ["DELIVERY ZONES", "2118, 2121, 2122, 2113, 2112"],
              ].map(([l,v]) => (
                <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${C.borderFaint}` }}>
                  <span style={{ fontSize:11, color:C.dim, fontFamily:"monospace" }}>{l}</span>
                  <span style={{ fontSize:13, color:C.muted }}>{v}</span>
                </div>
              ))}
              <Btn variant="outline" style={{ marginTop:16, width:"100%", textAlign:"center" }}>EDIT INFO</Btn>
            </div>
          </SectionBox>

          <SectionBox title="COMPLIANCE">
            <div style={{ padding:20 }}>
              <div style={{ padding:14, background:"#1a0e0a", border:`1px solid ${C.red}44`, borderRadius:2, marginBottom:16 }}>
                <div style={{ fontSize:11, color:C.red, fontFamily:"monospace", marginBottom:6 }}>🍷 PACKAGED LIQUOR LICENCE</div>
                <div style={{ fontSize:12, color:"#888", lineHeight:1.7 }}>
                  와인 포함 주문 배송 시 수령인 ID 확인 필수.<br />
                  NSW Liquor Act 2007 준수.<br />
                  <span style={{ color:C.dim }}>Licence No: LIQP770016XXX</span>
                </div>
              </div>
              {[["Max hamper alcohol","2L per order"],["ID check age","18+"],["Delivery record","90 days"]].map(([l,v]) => (
                <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${C.borderFaint}`, fontSize:12 }}>
                  <span style={{ color:C.dim }}>{l}</span>
                  <span style={{ color:C.muted, fontFamily:"monospace" }}>{v}</span>
                </div>
              ))}
            </div>
          </SectionBox>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <SectionBox title="NOTIFICATIONS">
            <div style={{ padding:20 }}>
              {[
                ["newOrder",      "신규 주문 알림",      "실시간 토스트 + 소리"],
                ["lowStock",      "재고 부족 경고",      "30% 이하 시 알림"],
                ["annivReminder", "기념일 D-7 리마인더", "자동 발송 스케줄"],
                ["dailyReport",   "일일 매출 리포트",    "오후 6시 이메일"],
              ].map(([key, label, sub]) => (
                <div key={key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:`1px solid ${C.borderFaint}` }}>
                  <div>
                    <div style={{ fontSize:13, color:C.text }}>{label}</div>
                    <div style={{ fontSize:11, color:C.dim, marginTop:2 }}>{sub}</div>
                  </div>
                  <div onClick={() => toggle(key)} style={{
                    width:40, height:22, borderRadius:11, background: notif[key] ? C.gold : C.border,
                    cursor:"pointer", position:"relative", transition:"background 0.2s"
                  }}>
                    <div style={{
                      position:"absolute", top:3, left: notif[key] ? 21 : 3,
                      width:16, height:16, borderRadius:"50%",
                      background: notif[key] ? "#0a0a05" : C.dim, transition:"left 0.2s"
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionBox>

          <SectionBox title="INTEGRATIONS">
            <div style={{ padding:"8px 0" }}>
              {[
                { name:"Stripe Payments",    status:"CONNECTED", color:C.green },
                { name:"Instagram API",       status:"CONNECTED", color:C.green },
                { name:"Google Maps API",     status:"CONNECTED", color:C.green },
                { name:"WhatsApp Business",   status:"SETUP REQ", color:C.gold  },
                { name:"Mailchimp",           status:"NOT SET",   color:C.dim   },
              ].map(i => (
                <div key={i.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 20px", borderBottom:`1px solid ${C.borderFaint}` }}>
                  <span style={{ fontSize:13, color:C.muted }}>{i.name}</span>
                  <span style={{ fontFamily:"monospace", fontSize:10, color:i.color, background:`${i.color}18`, padding:"3px 9px", borderRadius:1 }}>{i.status}</span>
                </div>
              ))}
            </div>
          </SectionBox>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE REGISTRY
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_COMPONENTS = {
  dashboard:     DashboardPage,
  flemington:    FlemingtonPage,
  orders:        OrdersPage,
  packing:       PackingPage,
  delivery:      DeliveryPage,
  today:         TodayFlowerPage,
  products:      ProductsPage,
  wine:          WinePage,
  customers:     CustomersPage,
  anniversaries: AnniversaryPage,
  subscriptions: SubscriptionsPage,
  analytics:     AnalyticsPage,
  instagram:     InstagramPage,
  settings:      SettingsPage,
};

// ─────────────────────────────────────────────────────────────────────────────
// ROOT LAYOUT
// ─────────────────────────────────────────────────────────────────────────────
export default function BloomAdmin() {
  const [active, setActive] = useState("dashboard");
  const [toast, setToast] = useState(true);
  const ActivePage = PAGE_COMPONENTS[active];

  return (
    <div style={{ display:"flex", height:"100vh", background:C.bg0, fontFamily:"'Georgia','Times New Roman',serif", color:C.text, overflow:"hidden" }}>
      {/* ── Sidebar ── */}
      <aside style={{ width:228, background:"#060603", borderRight:`1px solid #1a1a0e`, display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"22px 20px 18px", borderBottom:"1px solid #1a1a0e" }}>
          <div style={{ fontSize:17, letterSpacing:4, color:C.gold }}>BLOOM</div>
          <div style={{ fontSize:10, color:C.dimmer, letterSpacing:2, marginTop:2, fontFamily:"monospace" }}>ADMIN · SYDNEY</div>
        </div>

        <nav style={{ flex:1, overflowY:"auto", padding:"6px 0" }}>
          {NAV.map(group => (
            <div key={group.section} style={{ marginBottom:4 }}>
              <div style={{ padding:"10px 20px 5px", fontSize:9, color:"#252515", letterSpacing:3, fontFamily:"monospace" }}>
                {group.section}
              </div>
              {group.items.map(item => {
                const isActive = active === item.id;
                return (
                  <button key={item.id} onClick={() => setActive(item.id)} style={{
                    width:"100%", display:"flex", alignItems:"center", gap:10,
                    padding:"9px 20px", background: isActive ? C.bg2 : "transparent",
                    border:"none", borderLeft:`2px solid ${isActive ? C.gold : "transparent"}`,
                    color: isActive ? C.gold : C.dim,
                    fontSize:13, cursor:"pointer", textAlign:"left", transition:"all 0.12s"
                  }}>
                    <span style={{ fontSize:12, opacity:0.7 }}>{item.icon}</span>
                    <span style={{ flex:1 }}>{item.label}</span>
                    {item.badge && (
                      <span style={{
                        fontSize:10, fontFamily:"monospace", padding:"1px 6px", borderRadius:1,
                        background: item.badge==="TODAY" ? C.bg2 : "#2a1500",
                        color: item.badge==="TODAY" ? C.gold : "#e8a04a",
                      }}>{item.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={{ padding:"14px 20px", borderTop:"1px solid #1a1a0e" }}>
          <div style={{ fontSize:12, color:C.dim }}>사장님</div>
          <div style={{ fontSize:10, color:C.dimmer, fontFamily:"monospace", marginTop:2 }}>CARLINGFORD HUB</div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Real-time order toast */}
        {toast && (
          <div style={{ background:C.bg2, borderBottom:`1px solid ${C.gold}44`, padding:"10px 28px", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:C.gold, boxShadow:`0 0 6px ${C.gold}` }} />
            <span style={{ fontSize:12, color:C.gold, fontFamily:"monospace" }}>
              NEW ORDER — #0125 · Emily R. · Peony + Chardonnay · $110
            </span>
            <button onClick={() => { setActive("orders"); setToast(false); }} style={{ marginLeft:"auto", padding:"4px 14px", background:C.gold, border:"none", color:"#0a0a05", fontSize:11, cursor:"pointer", fontFamily:"monospace", letterSpacing:1 }}>
              VIEW
            </button>
            <button onClick={() => setToast(false)} style={{ padding:"4px 10px", background:"transparent", border:`1px solid ${C.border}`, color:C.dim, fontSize:11, cursor:"pointer" }}>✕</button>
          </div>
        )}

        <main style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}>
          {ActivePage ? <ActivePage /> : (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60%", color:C.dimmer, fontSize:13, fontFamily:"monospace" }}>
              COMING SOON
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
