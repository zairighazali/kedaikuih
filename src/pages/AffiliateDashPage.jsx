// frontend/src/pages/AffiliateDashPage.jsx
// Affiliate dashboard: stats, referral link, leaderboard, poster generator

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { affiliatesApi } from "../lib/api";

function formatMYR(n) { return `RM ${Number(n || 0).toFixed(2)}`; }

export default function AffiliateDashPage() {
  const { isAffiliate, dbUser, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPoster, setShowPoster] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!isAffiliate) { setLoading(false); return; }

    Promise.all([affiliatesApi.me(), affiliatesApi.leaderboard()])
      .then(([meRes, lbRes]) => {
        setData(meRes.data);
        setLeaderboard(lbRes.data.leaderboard);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAffiliate, authLoading]);

  if (authLoading || loading) return <div style={{ textAlign: "center", padding: "4rem", color: "#7a5a3a" }}>Memuatkan...</div>;

  if (!isAffiliate) return (
    <div style={{ textAlign: "center", padding: "4rem" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🤝</div>
      <h2 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a" }}>Affiliate Sahaja</h2>
      <p style={{ color: "#7a5a3a" }}>Anda perlu mendaftar sebagai affiliate untuk mengakses halaman ini.</p>
      <button onClick={() => navigate("/affiliate/register")} style={{ background: "#8B4513", border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontFamily: "'Playfair Display',serif", marginTop: 12 }}>Daftar Sekarang</button>
    </div>
  );

  const aff = data?.affiliate;
  const commissions = data?.commissions || [];
  const refLink = aff ? `${window.location.origin}/shop?ref=${aff.affiliate_code}` : "";
  const pending = Number(aff?.total_earned || 0) - Number(aff?.total_paid || 0);

  const copyLink = () => { navigator.clipboard?.writeText(refLink); alert("Pautan disalin!"); };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ color: "#cd853f", letterSpacing: 3, fontSize: 11, marginBottom: 4 }}>DASHBOARD AFFILIATE</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a", fontSize: 24, margin: 0 }}>{aff?.full_name || dbUser?.full_name}</h2>
          <div style={{ color: "#7a5a3a", fontSize: 13, marginTop: 4 }}>
            Kod: <span style={{ color: "#F4A460", fontWeight: 700 }}>{aff?.affiliate_code}</span>
            {" · "}Promo: <span style={{ color: "#F4A460", fontWeight: 700 }}>{aff?.promo_code}</span>
            {" · "}Komisyen: <span style={{ color: "#22c55e" }}>{aff?.commission_type === "percent" ? `${aff.commission_value}%` : formatMYR(aff?.commission_value)}</span>
          </div>
        </div>
        <button onClick={() => setShowPoster(true)} style={{ background: "linear-gradient(135deg,#8B4513,#cd853f)", border: "none", color: "#fff", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontFamily: "'Playfair Display',serif", fontSize: 14 }}>
          🎨 Jana Poster Promosi
        </button>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: "2rem" }}>
        {[
          ["🔗", "Klik Pautan", aff?.total_clicks?.toLocaleString() || "0", "#3b82f6"],
          ["🛒", "Pesanan Berjaya", aff?.total_orders || 0, "#22c55e"],
          ["💰", "Komisyen Earned", formatMYR(aff?.total_earned), "#F4A460"],
          ["⏳", "Belum Dibayar", formatMYR(pending), "#f59e0b"],
          ["✅", "Sudah Dibayar", formatMYR(aff?.total_paid), "#a0785a"],
        ].map(([ic, lab, val, col]) => (
          <div key={lab} style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(139,69,19,.3)", borderRadius: 12, padding: "1.2rem" }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>{ic}</div>
            <div style={{ color: "#7a5a3a", fontSize: 12 }}>{lab}</div>
            <div style={{ color: col, fontSize: 20, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Referral Link */}
        <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(139,69,19,.3)", borderRadius: 12, padding: "1.5rem" }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a", margin: "0 0 1rem", fontSize: 15 }}>🔗 Pautan Rujukan Anda</h3>
          <div style={{ background: "rgba(0,0,0,.3)", border: "1px solid rgba(139,69,19,.3)", borderRadius: 8, padding: "10px 14px", color: "#cd853f", fontFamily: "monospace", fontSize: 12, wordBreak: "break-all", marginBottom: 10 }}>
            {refLink}
          </div>
          <button onClick={copyLink} style={{ background: "#8B4513", border: "none", color: "#fff", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13, marginRight: 8 }}>
            📋 Salin Pautan
          </button>
          <div style={{ marginTop: 10, color: "#7a5a3a", fontSize: 12 }}>
            🍪 Cookie tracking <strong style={{ color: "#cd853f" }}>30 hari</strong> · Kod promo: <strong style={{ color: "#F4A460" }}>{aff?.promo_code}</strong>
          </div>
        </div>

        {/* Recent Commissions */}
        <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(139,69,19,.3)", borderRadius: 12, padding: "1.5rem" }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a", margin: "0 0 1rem", fontSize: 15 }}>📋 Komisyen Terkini</h3>
          {commissions.length === 0 ? (
            <div style={{ color: "#7a5a3a", fontSize: 13 }}>Belum ada komisyen lagi. Mula promosi!</div>
          ) : commissions.slice(0, 5).map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(139,69,19,.15)" }}>
              <div>
                <div style={{ color: "#fde68a", fontSize: 13 }}>{c.order_number}</div>
                <div style={{ color: "#7a5a3a", fontSize: 11 }}>{new Date(c.order_date).toLocaleDateString("ms-MY")}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#22c55e", fontSize: 13, fontWeight: 700 }}>+{formatMYR(c.commission_earned)}</div>
                <div style={{ color: c.status === "paid" ? "#86efac" : "#f59e0b", fontSize: 11 }}>{c.status === "paid" ? "Dibayar" : "Tertunggak"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(139,69,19,.3)", borderRadius: 12, padding: "1.5rem", marginTop: 20 }}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a", margin: "0 0 1rem", fontSize: 15 }}>🏆 Papan Pendahulu Affiliate</h3>
        {leaderboard.map((a, i) => (
          <div key={a.affiliate_code} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(139,69,19,.15)" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: i === 0 ? "#F4A460" : i === 1 ? "#9ca3af" : i === 2 ? "#cd853f" : "rgba(139,69,19,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: i < 3 ? "#1a0a00" : "#cd853f", flexShrink: 0 }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fde68a", fontSize: 14 }}>{a.full_name}</div>
              <div style={{ color: "#7a5a3a", fontSize: 12 }}>{a.total_orders} pesanan · {a.total_clicks} klik · Promo: {a.promo_code}</div>
            </div>
            <div style={{ color: "#22c55e", fontWeight: 700 }}>{formatMYR(a.total_earned)}</div>
          </div>
        ))}
      </div>

      {/* Poster Modal */}
      {showPoster && aff && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowPoster(false)}>
          <div style={{ background: "linear-gradient(145deg,#1a0a00,#2d1200)", border: "2px solid #cd853f", borderRadius: 20, padding: "2.5rem", maxWidth: 360, width: "90%", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 11, letterSpacing: 4, color: "#cd853f", marginBottom: 8 }}>KOLEKSI PREMIUM RAYA 2025</div>
            <div style={{ fontSize: 60 }}>🌙</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a", fontSize: 22, margin: "8px 0" }}>Biskut Raya Premium</h2>
            <p style={{ color: "#a0785a", fontSize: 13, marginBottom: 16 }}>Gunakan kod promo saya untuk diskaun eksklusif!</p>
            <div style={{ background: "rgba(139,69,19,.3)", border: "2px dashed #cd853f", borderRadius: 10, padding: "12px", marginBottom: 16 }}>
              <div style={{ color: "#fde68a", fontSize: 28, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{aff.promo_code}</div>
              <div style={{ color: "#cd853f", fontSize: 12 }}>Diskaun {aff.promo_discount_pct}% untuk anda!</div>
            </div>
            <div style={{ color: "#7a5a3a", fontSize: 11, fontFamily: "monospace", marginBottom: 16, wordBreak: "break-all" }}>{refLink}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
              {[["WhatsApp", "#25d366"], ["Instagram", "#e1306c"], ["TikTok", "#69c9d0"]].map(([s, c]) => (
                <button key={s} style={{ background: `${c}22`, border: `1px solid ${c}55`, color: c, padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>{s}</button>
              ))}
            </div>
            <button onClick={() => setShowPoster(false)} style={{ background: "none", border: "none", color: "#7a5a3a", cursor: "pointer", fontSize: 12 }}>Tutup ✕</button>
          </div>
        </div>
      )}
    </div>
  );
}