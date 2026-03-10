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

  if (authLoading || loading) return <div style={{ textAlign: "center", padding: "4rem", background: "rgba(255,255,255,0.9)", borderRadius: "20px", boxShadow: "0 8px 30px rgba(233, 30, 99, 0.1)", maxWidth: "400px", margin: "2rem auto", color: "#5d4037", fontSize: 18 }}>Memuatkan...</div>;

  if (!isAffiliate) return (
    <div style={{ textAlign: "center", padding: "4rem", background: "rgba(255,255,255,0.9)", borderRadius: "20px", boxShadow: "0 8px 30px rgba(233, 30, 99, 0.1)", maxWidth: "500px", margin: "2rem auto" }}>
      <div style={{ fontSize: 60, marginBottom: 20 }}>🤝</div>
      <h2 style={{ fontFamily: "'Playfair Display',serif", color: "#e91e63", fontSize: 24, fontWeight: 700 }}>Affiliate Sahaja</h2>
      <p style={{ color: "#5d4037", fontSize: 16 }}>Anda perlu mendaftar sebagai affiliate untuk mengakses halaman ini.</p>
      <button onClick={() => navigate("/affiliate/register")} style={{ background: "linear-gradient(135deg, #e91e63, #ffb74d)", border: "none", color: "#fff", padding: "12px 28px", borderRadius: 25, cursor: "pointer", fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 600, boxShadow: "0 4px 15px rgba(233, 30, 99, 0.3)", marginTop: 16 }}>Daftar Sekarang</button>
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ color: "#e91e63", letterSpacing: 2, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase" }}>Dashboard Affiliate</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", color: "#e91e63", fontSize: 28, margin: 0, fontWeight: 700 }}>{aff?.full_name || dbUser?.full_name}</h2>
          <div style={{ color: "#5d4037", fontSize: 14, marginTop: 6, fontWeight: 500 }}>
            Kod: <span style={{ color: "#ffb74d", fontWeight: 700 }}>{aff?.affiliate_code}</span>
            {" · "}Promo: <span style={{ color: "#ffb74d", fontWeight: 700 }}>{aff?.promo_code}</span>
            {" · "}Komisyen: <span style={{ color: "#81c784", fontWeight: 600 }}>{aff?.commission_type === "percent" ? `${aff.commission_value}%` : formatMYR(aff?.commission_value)}</span>
          </div>
        </div>
        <button onClick={() => setShowPoster(true)} style={{ background: "linear-gradient(135deg, #e91e63, #ffb74d)", border: "none", color: "#fff", padding: "12px 24px", borderRadius: 25, cursor: "pointer", fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 600, boxShadow: "0 4px 15px rgba(233, 30, 99, 0.3)" }}>
          🎨 Jana Poster Promosi
        </button>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 20, marginBottom: "2rem" }}>
        {[
          ["🔗", "Klik Pautan", aff?.total_clicks?.toLocaleString() || "0", "#1976d2"],
          ["🛒", "Pesanan Berjaya", aff?.total_orders || 0, "#81c784"],
          ["💰", "Komisyen Earned", formatMYR(aff?.total_earned), "#ffb74d"],
          ["⏳", "Belum Dibayar", formatMYR(pending), "#ffb74d"],
          ["✅", "Sudah Dibayar", formatMYR(aff?.total_paid), "#8d6e63"],
        ].map(([ic, lab, val, col]) => (
          <div key={lab} style={{ background: "rgba(255,255,255,0.95)", border: "2px solid #fce4ec", borderRadius: 16, padding: "1.5rem", boxShadow: "0 4px 15px rgba(233, 30, 99, 0.1)", transition: "all 0.3s ease" }} onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"} onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>{ic}</div>
            <div style={{ color: "#5d4037", fontSize: 13, fontWeight: 500 }}>{lab}</div>
            <div style={{ color: col, fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Referral Link */}
        <div style={{ background: "rgba(255,255,255,0.95)", border: "2px solid #fce4ec", borderRadius: 16, padding: "1.8rem", boxShadow: "0 4px 15px rgba(233, 30, 99, 0.1)" }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#e91e63", margin: "0 0 1.2rem", fontSize: 18, fontWeight: 600 }}>🔗 Pautan Rujukan Anda</h3>
          <div style={{ background: "rgba(233, 30, 99, 0.05)", border: "2px solid #fce4ec", borderRadius: 12, padding: "12px 16px", color: "#2c1810", fontFamily: "monospace", fontSize: 13, wordBreak: "break-all", marginBottom: 12, fontWeight: 500 }}>
            {refLink}
          </div>
          <button onClick={copyLink} style={{ background: "linear-gradient(135deg, #e91e63, #ffb74d)", border: "none", color: "#fff", padding: "10px 20px", borderRadius: 20, cursor: "pointer", fontSize: 14, fontWeight: 600, boxShadow: "0 4px 15px rgba(233, 30, 99, 0.3)", marginRight: 12 }}>
            📋 Salin Pautan
          </button>
          <div style={{ marginTop: 12, color: "#5d4037", fontSize: 13, fontWeight: 500 }}>
            🍪 Cookie tracking <strong style={{ color: "#e91e63" }}>30 hari</strong> · Kod promo: <strong style={{ color: "#ffb74d" }}>{aff?.promo_code}</strong>
          </div>
        </div>

        {/* Recent Commissions */}
        <div style={{ background: "rgba(255,255,255,0.95)", border: "2px solid #fce4ec", borderRadius: 16, padding: "1.8rem", boxShadow: "0 4px 15px rgba(233, 30, 99, 0.1)" }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#e91e63", margin: "0 0 1.2rem", fontSize: 18, fontWeight: 600 }}>📋 Komisyen Terkini</h3>
          {commissions.length === 0 ? (
            <div style={{ color: "#5d4037", fontSize: 14, fontStyle: "italic", textAlign: "center", padding: "2rem" }}>Belum ada komisyen lagi. Mula promosi! 🎂</div>
          ) : commissions.slice(0, 5).map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #fce4ec", background: "rgba(233, 30, 99, 0.02)", borderRadius: 8, marginBottom: 8 }}>
              <div>
                <div style={{ color: "#2c1810", fontSize: 14, fontWeight: 600 }}>{c.order_number}</div>
                <div style={{ color: "#5d4037", fontSize: 12 }}>{new Date(c.order_date).toLocaleDateString("ms-MY")}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#e91e63", fontSize: 15, fontWeight: 700 }}>+{formatMYR(c.commission_earned)}</div>
                <div style={{ color: c.status === "paid" ? "#4caf50" : "#ffb74d", fontSize: 12, fontWeight: 600 }}>{c.status === "paid" ? "Dibayar" : "Tertunggak"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div style={{ background: "rgba(255,255,255,0.95)", border: "2px solid #fce4ec", borderRadius: 16, padding: "1.8rem", marginTop: 24, boxShadow: "0 4px 15px rgba(233, 30, 99, 0.1)" }}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#e91e63", margin: "0 0 1.2rem", fontSize: 18, fontWeight: 600 }}>🏆 Papan Pendahulu Affiliate</h3>
        {leaderboard.map((a, i) => (
          <div key={a.affiliate_code} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px", borderBottom: "1px solid #fce4ec", background: i % 2 === 0 ? "rgba(255,255,255,0.8)" : "rgba(233, 30, 99, 0.02)", borderRadius: 8, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: i === 0 ? "linear-gradient(135deg, #ffd700, #ffb74d)" : i === 1 ? "linear-gradient(135deg, #c0c0c0, #9e9e9e)" : i === 2 ? "linear-gradient(135deg, #cd7f32, #a0522d)" : "linear-gradient(135deg, #fce4ec, #ffebee)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: i < 3 ? "#2c1810" : "#e91e63", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#2c1810", fontSize: 15, fontWeight: 600 }}>{a.full_name}</div>
              <div style={{ color: "#5d4037", fontSize: 13 }}>{a.total_orders} pesanan · {a.total_clicks} klik · Promo: <strong style={{ color: "#ffb74d" }}>{a.promo_code}</strong></div>
            </div>
            <div style={{ color: "#e91e63", fontWeight: 700, fontSize: 16 }}>{formatMYR(a.total_earned)}</div>
          </div>
        ))}
      </div>

      {/* Poster Modal */}
      {showPoster && aff && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowPoster(false)}>
          <div style={{ background: "linear-gradient(145deg, #fff8f5, #fce4ec)", border: "3px solid #e91e63", borderRadius: 24, padding: "2.5rem", maxWidth: 380, width: "90%", textAlign: "center", boxShadow: "0 8px 32px rgba(233, 30, 99, 0.3)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 12, letterSpacing: 3, color: "#e91e63", marginBottom: 12, fontWeight: 600 }}>KOLEKSI PREMIUM RAYA 2025</div>
            <div style={{ fontSize: 64 }}>🌙</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", color: "#2c1810", fontSize: 24, margin: "12px 0", fontWeight: 700 }}>Biskut Raya Premium</h2>
            <p style={{ color: "#5d4037", fontSize: 14, marginBottom: 20, fontWeight: 500 }}>Gunakan kod promo saya untuk diskaun eksklusif!</p>
            <div style={{ background: "linear-gradient(135deg, #fce4ec, #ffebee)", border: "2px dashed #e91e63", borderRadius: 12, padding: "16px", marginBottom: 20 }}>
              <div style={{ color: "#e91e63", fontSize: 32, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{aff.promo_code}</div>
              <div style={{ color: "#ffb74d", fontSize: 14, fontWeight: 600 }}>Diskaun {aff.promo_discount_pct}% untuk anda!</div>
            </div>
            <div style={{ color: "#2c1810", fontSize: 12, fontFamily: "monospace", marginBottom: 20, wordBreak: "break-all", background: "rgba(233, 30, 99, 0.05)", padding: "8px 12px", borderRadius: 8, border: "1px solid #fce4ec" }}>{refLink}</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 16 }}>
              {[["WhatsApp", "#25d366"], ["Instagram", "#e1306c"], ["TikTok", "#69c9d0"]].map(([s, c]) => (
                <button key={s} style={{ background: `${c}22`, border: `2px solid ${c}55`, color: c, padding: "8px 16px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.2s ease" }} onMouseOver={(e) => e.target.style.transform = "scale(1.05)"} onMouseOut={(e) => e.target.style.transform = "scale(1)"}>{s}</button>
              ))}
            </div>
            <button onClick={() => setShowPoster(false)} style={{ background: "none", border: "none", color: "#5d4037", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Tutup ✕</button>
          </div>
        </div>
      )}
    </div>
  );
}