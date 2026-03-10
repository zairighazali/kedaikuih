// frontend/src/App.jsx
// Main app with React Router, Auth + Cart providers, and Navbar

import { BrowserRouter, Routes, Route, Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider, useCart } from "./context/CartContext";
import { useState, useEffect } from "react";
import { settingsApi, affiliatesApi, paymentApi } from "./lib/api";

// Pages
import ShopPage from "./pages/ShopPage";
import CheckoutPage from "./pages/CheckoutPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import AffiliateDashPage from "./pages/AffiliateDashPage";

// ─── Countdown ───────────────────────────────────────────────
function useCountdown(target) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(target) - Date.now());
      setTime({ d: Math.floor(diff / 86400000), h: Math.floor(diff / 3600000) % 24, m: Math.floor(diff / 60000) % 60, s: Math.floor(diff / 1000) % 60 });
    };
    if (!target) return;
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return time;
}

function CountdownBanner({ deadline }) {
  const { d, h, m, s } = useCountdown(deadline);
  if (!deadline) return null;
  return (
    <div style={{ background: "linear-gradient(135deg,#e91e63,#ffb74d)", padding: "12px 0", textAlign: "center", boxShadow: "0 2px 10px rgba(233, 30, 99, 0.1)" }}>
      <div style={{ color: "#fff", fontFamily: "'Playfair Display',serif", fontSize: "clamp(12px, 3vw, 14px)", letterSpacing: 1, marginBottom: 6, fontWeight: 600, padding: "0 1rem" }}>
        ⏳ Tarikh Akhir Pesanan — Kuih tiba sebelum Hari Raya!
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: "clamp(8px, 4vw, 16px)", flexWrap: "wrap", padding: "0 1rem" }}>
        {[["d", "Hari"], ["h", "Jam"], ["m", "Minit"], ["s", "Saat"]].map(([k, label]) => (
          <div key={k} style={{ textAlign: "center", minWidth: "clamp(35px, 8vw, 50px)" }}>
            <div style={{ background: "rgba(255,255,255,0.9)", color: "#e91e63", fontFamily: "monospace", fontSize: "clamp(16px, 4vw, 20px)", fontWeight: 700, padding: "4px 8px", borderRadius: 8, boxShadow: "0 2px 8px rgba(233, 30, 99, 0.2)" }}>
              {String({ d, h, m, s }[k]).padStart(2, "0")}
            </div>
            <div style={{ color: "#ffb74d", fontSize: "clamp(8px, 2vw, 10px)", marginTop: 4, fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────
function Navbar() {
  const { dbUser, isAdmin, isAffiliate, logout } = useAuth();
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Truncate user name for mobile display
  const displayName = dbUser?.full_name || dbUser?.email || "";
  const truncatedName = displayName.length > 20 ? displayName.substring(0, 17) + "..." : displayName;

  return (
    <nav style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", borderBottom: "2px solid #fce4ec", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 20px rgba(233, 30, 99, 0.1)" }}>
      <div className="nav-content" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 70, position: "relative" }}>
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 32 }}>🧁</span>
          <div>
            <div className="nav-brand" style={{ fontFamily: "'Playfair Display',serif", color: "#e91e63", fontSize: 20, fontWeight: 700, lineHeight: 1 }}>Biskut Raya</div>
            <div style={{ color: "#ffb74d", fontSize: 10, letterSpacing: 2, fontWeight: 600 }}>SWEET DELIGHTS</div>
          </div>
        </Link>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ display: "none", background: "none", border: "none", fontSize: 24, color: "#e91e63", cursor: "pointer" }}
          className="mobile-menu-btn"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>

        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: "clamp(0.5rem, 2vw, 1.5rem)" }}>
          <Link to="/shop" style={{ color: "#e91e63", textDecoration: "none", fontFamily: "'Playfair Display',serif", fontSize: "clamp(13px, 2.5vw, 15px)", fontWeight: 600, padding: "clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 16px)", borderRadius: "20px", transition: "all 0.3s ease" }} onMouseEnter={(e) => e.target.style.background = "#fce4ec"} onMouseLeave={(e) => e.target.style.background = "transparent"}>Kedai</Link>
          {isAffiliate && <Link to="/affiliate" style={{ color: "#e91e63", textDecoration: "none", fontFamily: "'Playfair Display',serif", fontSize: "clamp(13px, 2.5vw, 15px)", fontWeight: 600, padding: "clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 16px)", borderRadius: "20px", transition: "all 0.3s ease" }} onMouseEnter={(e) => e.target.style.background = "#fce4ec"} onMouseLeave={(e) => e.target.style.background = "transparent"}>Dashboard</Link>}
          {isAdmin && <Link to="/admin" style={{ color: "#e91e63", textDecoration: "none", fontFamily: "'Playfair Display',serif", fontSize: "clamp(13px, 2.5vw, 15px)", fontWeight: 600, padding: "clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 16px)", borderRadius: "20px", transition: "all 0.3s ease" }} onMouseEnter={(e) => e.target.style.background = "#fce4ec"} onMouseLeave={(e) => e.target.style.background = "transparent"}>Admin</Link>}

          {dbUser ? (
            <>
              <span className="user-name-display" style={{ color: "#5d4037", fontSize: "clamp(11px, 2vw, 13px)", fontWeight: 500, maxWidth: "clamp(80px, 15vw, 150px)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={displayName}>{truncatedName}</span>
              <button onClick={logout} style={{ background: "#e91e63", border: "none", color: "#fff", cursor: "pointer", padding: "clamp(5px, 1.2vw, 6px) clamp(10px, 2vw, 16px)", borderRadius: 20, fontSize: "clamp(11px, 2vw, 13px)", fontWeight: 600 }}>Keluar</button>
            </>
          ) : (
            <Link to="/login" style={{ background: "linear-gradient(135deg, #e91e63, #ffb74d)", color: "#fff", padding: "clamp(6px, 1.5vw, 8px) clamp(12px, 2.5vw, 20px)", borderRadius: 25, fontSize: "clamp(12px, 2.5vw, 14px)", textDecoration: "none", fontFamily: "'Playfair Display',serif", fontWeight: 600, boxShadow: "0 4px 15px rgba(233, 30, 99, 0.3)" }}>Log Masuk</Link>
          )}

          <Link to="/cart" style={{ position: "relative", fontSize: "clamp(22px, 4vw, 26px)", textDecoration: "none" }}>
            🛒
            {itemCount > 0 && (
              <span style={{ position: "absolute", top: -8, right: -10, background: "#e91e63", color: "#fff", borderRadius: "50%", width: "clamp(18px, 3vw, 22px)", height: "clamp(18px, 3vw, 22px)", fontSize: "clamp(9px, 2vw, 11px)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, boxShadow: "0 2px 8px rgba(233, 30, 99, 0.3)" }}>
                {itemCount}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "rgba(255,255,255,0.98)", borderBottom: "2px solid #fce4ec", padding: "clamp(1rem, 3vw, 1.5rem)", display: "flex", flexDirection: "column", gap: "clamp(0.5rem, 1.5vw, 0.75rem)", boxShadow: "0 4px 20px rgba(233, 30, 99, 0.1)", maxHeight: "80vh", overflowY: "auto" }}>
            <Link to="/shop" onClick={() => setMobileMenuOpen(false)} style={{ color: "#e91e63", textDecoration: "none", fontFamily: "'Playfair Display',serif", fontSize: "clamp(15px, 3vw, 16px)", fontWeight: 600, padding: "clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)", borderRadius: "20px", transition: "all 0.3s ease" }} onMouseEnter={(e) => e.target.style.background = "#fce4ec"} onMouseLeave={(e) => e.target.style.background = "transparent"}>Kedai</Link>
            {isAffiliate && <Link to="/affiliate" onClick={() => setMobileMenuOpen(false)} style={{ color: "#e91e63", textDecoration: "none", fontFamily: "'Playfair Display',serif", fontSize: "clamp(15px, 3vw, 16px)", fontWeight: 600, padding: "clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)", borderRadius: "20px", transition: "all 0.3s ease" }} onMouseEnter={(e) => e.target.style.background = "#fce4ec"} onMouseLeave={(e) => e.target.style.background = "transparent"}>Dashboard</Link>}
            {isAdmin && <Link to="/admin" onClick={() => setMobileMenuOpen(false)} style={{ color: "#e91e63", textDecoration: "none", fontFamily: "'Playfair Display',serif", fontSize: "clamp(15px, 3vw, 16px)", fontWeight: 600, padding: "clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)", borderRadius: "20px", transition: "all 0.3s ease" }} onMouseEnter={(e) => e.target.style.background = "#fce4ec"} onMouseLeave={(e) => e.target.style.background = "transparent"}>Admin</Link>}

            {/* Cart link in mobile menu */}
            <Link to="/cart" onClick={() => setMobileMenuOpen(false)} style={{ color: "#e91e63", textDecoration: "none", fontFamily: "'Playfair Display',serif", fontSize: "clamp(15px, 3vw, 16px)", fontWeight: 600, padding: "clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)", borderRadius: "20px", display: "flex", alignItems: "center", gap: "clamp(8px, 2vw, 12px)", transition: "all 0.3s ease" }} onMouseEnter={(e) => e.target.style.background = "#fce4ec"} onMouseLeave={(e) => e.target.style.background = "transparent"}>
              <span>🛒 Troli</span>
              {itemCount > 0 && (
                <span style={{ background: "#e91e63", color: "#fff", borderRadius: "50%", width: "clamp(18px, 3vw, 20px)", height: "clamp(18px, 3vw, 20px)", fontSize: "clamp(10px, 2vw, 11px)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Divider */}
            <div style={{ height: 1, background: "#fce4ec", margin: "clamp(0.5rem, 1.5vw, 0.75rem) 0" }}></div>

            {dbUser ? (
              <>
                <div style={{ color: "#5d4037", fontSize: "clamp(13px, 2.5vw, 14px)", fontWeight: 500, padding: "clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 16px)", background: "rgba(252, 228, 236, 0.5)", borderRadius: "12px", textAlign: "center" }}>
                  {truncatedName}
                </div>
                <button onClick={() => { logout(); setMobileMenuOpen(false); }} style={{ background: "#e91e63", border: "none", color: "#fff", cursor: "pointer", padding: "clamp(8px, 2vw, 10px) clamp(16px, 4vw, 20px)", borderRadius: 20, fontSize: "clamp(13px, 2.5vw, 14px)", fontWeight: 600, alignSelf: "center", marginTop: "clamp(0.25rem, 0.8vw, 0.5rem)" }}>Keluar</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{ background: "linear-gradient(135deg, #e91e63, #ffb74d)", color: "#fff", padding: "clamp(8px, 2vw, 10px) clamp(16px, 4vw, 20px)", borderRadius: 25, fontSize: "clamp(13px, 2.5vw, 14px)", textDecoration: "none", fontFamily: "'Playfair Display',serif", fontWeight: 600, alignSelf: "center", boxShadow: "0 4px 15px rgba(233, 30, 99, 0.3)" }}>Log Masuk</Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

// ─── Cart Page ────────────────────────────────────────────────
function CartPage() {
  const { items, updateQty, removeItem, subtotal, appliedPromo } = useCart();
  const navigate = useNavigate();
  const [shippingSettings, setShippingSettings] = useState(null);

  useEffect(() => {
    settingsApi.getShipping().then(r => setShippingSettings(r.data.shipping)).catch(() => {});
  }, []);

  const stdRate = Number(shippingSettings?.standard_rate || 8);
  const freeThreshold = Number(shippingSettings?.free_shipping_threshold || 100);
  const shipping = subtotal >= freeThreshold ? 0 : stdRate;
  const total = subtotal + shipping;
  const fmt = (n) => `RM ${Number(n).toFixed(2)}`;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h2 style={{ fontFamily: "'Playfair Display',serif", color: "#e91e63", fontSize: 28, marginBottom: "2rem", textAlign: "center" }}>Troli Anda 🛒</h2>
      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", background: "rgba(255,255,255,0.9)", borderRadius: "20px", boxShadow: "0 8px 30px rgba(233, 30, 99, 0.1)" }}>
          <div style={{ fontSize: 70, marginBottom: 16 }}>🛒</div>
          <div style={{ fontSize: 20, fontFamily: "'Playfair Display',serif", color: "#e91e63", marginBottom: 12, fontWeight: 600 }}>Troli anda kosong</div>
          <button onClick={() => navigate("/shop")} style={{ background: "linear-gradient(135deg, #e91e63, #ffb74d)", border: "none", color: "#fff", padding: "12px 28px", borderRadius: 25, cursor: "pointer", fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 600, boxShadow: "0 4px 15px rgba(233, 30, 99, 0.3)" }}>Mulai Beli-Belah</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
          <div>
            {items.map((item) => (
              <div key={item.id} style={{ background: "rgba(255,255,255,0.9)", border: "2px solid #fce4ec", borderRadius: 16, padding: "1.2rem 1.5rem", marginBottom: 12, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 4px 15px rgba(233, 30, 99, 0.1)", transition: "all 0.3s ease" }} onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"} onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}>
                <div style={{ fontSize: 48 }}>{item.image_emoji || "🍪"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", color: "#e91e63", fontWeight: 600, fontSize: 18 }}>{item.name}</div>
                  <div style={{ color: "#ffb74d", fontSize: 14, fontWeight: 500 }}>{fmt(item.price)} / balang</div>
                  {item.qty >= (item.min_bulk_qty || 20) && <div style={{ color: "#81c784", fontSize: 12, fontWeight: 600 }}>🎁 Harga borong!</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ background: "#fce4ec", border: "none", color: "#e91e63", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 18, fontWeight: 600 }}>−</button>
                  <span style={{ color: "#e91e63", minWidth: 32, textAlign: "center", fontWeight: 700, fontSize: 16 }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ background: "#fce4ec", border: "none", color: "#e91e63", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 18, fontWeight: 600 }}>+</button>
                </div>
                <div style={{ color: "#ffb74d", fontWeight: 700, minWidth: 80, textAlign: "right", fontSize: 16 }}>{fmt(Number(item.price) * item.qty)}</div>
                <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: "#8d6e63", cursor: "pointer", fontSize: 20, padding: 4 }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ background: "rgba(255,255,255,0.95)", border: "2px solid #fce4ec", borderRadius: 16, padding: "1.8rem", height: "fit-content", boxShadow: "0 8px 30px rgba(233, 30, 99, 0.1)" }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#e91e63", margin: "0 0 1.5rem", fontSize: 18, fontWeight: 600 }}>Ringkasan</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {[["Subtotal", fmt(subtotal)], ["Penghantaran", shipping === 0 ? "PERCUMA 🎉" : fmt(shipping)]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#5d4037", fontSize: 14 }}>{k}</span>
                  <span style={{ color: shipping === 0 && k === "Penghantaran" ? "#81c784" : "#ffb74d", fontSize: 14, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
              {subtotal < freeThreshold && shippingSettings && (
                <div style={{ color: "#8d6e63", fontSize: 12, fontStyle: "italic" }}>* Tambah {fmt(freeThreshold - subtotal)} lagi untuk penghantaran percuma</div>
              )}
            </div>
            <div style={{ borderTop: "2px solid #fce4ec", paddingTop: 12, display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
              <span style={{ color: "#e91e63", fontWeight: 700, fontFamily: "'Playfair Display',serif", fontSize: 16 }}>JUMLAH</span>
              <span style={{ color: "#ffb74d", fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{fmt(total)}</span>
            </div>
            {appliedPromo && (
              <div style={{ background: "rgba(129, 199, 132, 0.1)", border: "1px solid #81c784", borderRadius: 8, padding: "8px 12px", marginBottom: 12, color: "#81c784", fontSize: 13, fontWeight: 600 }}>
                🏷️ Kod: {appliedPromo.promo_code} — Diskaun {appliedPromo.discount_pct}%
              </div>
            )}
            <button onClick={() => navigate("/checkout")} style={{ width: "100%", background: "linear-gradient(135deg, #e91e63, #ffb74d)", border: "none", color: "#fff", padding: 14, borderRadius: 25, cursor: "pointer", fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 600, boxShadow: "0 4px 15px rgba(233, 30, 99, 0.3)" }}>
              Teruskan ke Pembayaran →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Home / Hero ──────────────────────────────────────────────
function HomePage() {
  const navigate = useNavigate();
  return (
    <div style={{ position: "relative", minHeight: "85vh", background: "linear-gradient(160deg, #fef7f0 0%, #fff8f2 50%, #fef2f2 100%)", display: "flex", alignItems: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "15%", right: "10%", width: 400, height: 400, background: "radial-gradient(circle, rgba(233, 30, 99, 0.1) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", left: "5%", width: 200, height: 200, background: "radial-gradient(circle, rgba(255, 183, 77, 0.15) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "4rem 2rem", width: "100%", position: "relative", zIndex: 2 }}>
        <div style={{ maxWidth: 600 }}>
          <div style={{ color: "#e91e63", letterSpacing: 4, fontSize: 12, fontFamily: "'Playfair Display',serif", marginBottom: 20, fontWeight: 600, textTransform: "uppercase" }}>Koleksi Premium Raya 2025</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(2.8rem,6vw,5rem)", color: "#2c1810", lineHeight: 1.1, margin: "0 0 1.8rem", fontWeight: 700 }}>
            Manis Raya,<br /><em style={{ color: "#e91e63", fontStyle: "italic" }}>Sampai ke Pintu</em>
          </h1>
          <p style={{ color: "#5d4037", fontSize: 18, lineHeight: 1.7, marginBottom: "2.5rem", maxWidth: 500, fontWeight: 400 }}>
            Biskut dan kuih Raya Premium, dibakar dengan kasih sayang dan resipi turun-temurun. Penghantaran ke seluruh Malaysia.
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <button onClick={() => navigate("/shop")} style={{ background: "linear-gradient(135deg, #e91e63, #ffb74d)", border: "none", color: "#fff", padding: "16px 36px", borderRadius: 30, cursor: "pointer", fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 600, boxShadow: "0 6px 20px rgba(233, 30, 99, 0.3)", transition: "all 0.3s ease" }}>
              Beli Sekarang ✦
            </button>
            <button onClick={() => navigate("/affiliate/register")} style={{ background: "rgba(255,255,255,0.9)", border: "2px solid #e91e63", color: "#e91e63", padding: "16px 32px", borderRadius: 30, cursor: "pointer", fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 600, backdropFilter: "blur(10px)", transition: "all 0.3s ease" }}>
              Jadi Affiliate
            </button>
          </div>
          <div style={{ display: "flex", gap: 40, marginTop: "3rem", flexWrap: "wrap" }}>
            {[["🏆","Produk Premium"], ["🚚","Penghantaran Selamat"], ["💳","FPX / Online Banking"], ["🤝","Program Affiliate"]].map(([ic, t]) => (
              <div key={t} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22 }}>{ic}</div>
                <div style={{ color: "#7a5a3a", fontSize: 10, marginTop: 4 }}>{t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Affiliate Register ───────────────────────────────────────
function AffiliateRegisterPage() {
  const { dbUser, isCustomer } = useAuth();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!isCustomer) return (
    <div style={{ textAlign: "center", padding: "4rem" }}>
      <p style={{ color: "#7a5a3a" }}>Sila log masuk dahulu.</p>
      <button onClick={() => navigate("/login")} style={{ background: "#8B4513", border: "none", color: "#fff", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontFamily: "'Playfair Display',serif" }}>Log Masuk</button>
    </div>
  );

  if (done) return (
    <div style={{ maxWidth: 500, margin: "4rem auto", textAlign: "center", padding: "2rem" }}>
      <div style={{ fontSize: 60 }}>🎉</div>
      <h2 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a" }}>Permohonan Dihantar!</h2>
      <p style={{ color: "#7a5a3a" }}>Akaun anda sedang disemak. Anda akan dimaklumkan dalam masa 24 jam.</p>
      <button onClick={() => navigate("/")} style={{ marginTop: 16, background: "#8B4513", border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontFamily: "'Playfair Display',serif" }}>Kembali</button>
    </div>
  );

  const handleSubmit = async () => {
    if (!promoCode) { setError("Sila masukkan kod promo."); return; }
    setLoading(true); setError("");
    try {
      await affiliatesApi.register({ promo_code: promoCode });
      setDone(true);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 500, margin: "3rem auto", padding: "0 1.5rem" }}>
      <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(139,69,19,.4)", borderRadius: 16, padding: "2.5rem" }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a", textAlign: "center", marginBottom: ".5rem" }}>Daftar Affiliate</h2>
        <p style={{ color: "#7a5a3a", textAlign: "center", fontSize: 13, marginBottom: "1.5rem" }}>Jana pendapatan dengan komisyen sehingga 15% setiap jualan!</p>
        {error && <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 6, padding: "8px 12px", color: "#fca5a5", fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <div style={{ marginBottom: 14 }}>
          <label style={{ color: "#cd853f", fontSize: 12, display: "block", marginBottom: 4 }}>Nama Penuh</label>
          <input value={dbUser?.full_name || ""} disabled style={{ width: "100%", background: "rgba(255,255,255,.03)", border: "1px solid rgba(139,69,19,.2)", color: "#7a5a3a", padding: "9px 12px", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ color: "#cd853f", fontSize: 12, display: "block", marginBottom: 4 }}>Kod Promo Yang Diingini *</label>
          <input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="cth: NAMA10" style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid rgba(139,69,19,.4)", color: "#fde68a", padding: "9px 12px", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        </div>
        <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", background: loading ? "#555" : "linear-gradient(135deg,#8B4513,#cd853f)", border: "none", color: "#fff", padding: "12px", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Playfair Display',serif", fontSize: 16 }}>
          {loading ? "Memproses..." : "Hantar Permohonan →"}
        </button>
      </div>
    </div>
  );
}

// ─── Payment Return ───────────────────────────────────────────
function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [status, setStatus] = useState("loading");
  const navigate = useNavigate();

  useEffect(() => {
    if (!orderId) { setStatus("error"); return; }
    // Poll payment status
    let tries = 0;
    const poll = setInterval(async () => {
      tries++;
      try {
        const res = await paymentApi.getStatus(orderId);
        if (res.data.order.status === "paid" || res.data.order.status !== "pending_payment") {
          setStatus(res.data.order.status);
          clearInterval(poll);
        }
      } catch { setStatus("error"); clearInterval(poll); }
      if (tries > 10) { setStatus("pending"); clearInterval(poll); }
    }, 2000);
    return () => clearInterval(poll);
  }, [orderId]);

  return (
    <div style={{ textAlign: "center", padding: "4rem" }}>
      {status === "loading" && <><div style={{ fontSize: 48 }}>⏳</div><div style={{ color: "#cd853f", fontFamily: "'Playfair Display',serif", fontSize: 18, marginTop: 12 }}>Mengesahkan pembayaran...</div></>}
      {status === "paid" && (
        <>
          <div style={{ fontSize: 64 }}>✅</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a" }}>Pembayaran Berjaya!</h2>
          <p style={{ color: "#7a5a3a" }}>Pesanan anda sedang diproses. Terima kasih!</p>
          <button onClick={() => navigate("/")} style={{ marginTop: 16, background: "#8B4513", border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontFamily: "'Playfair Display',serif" }}>Kembali ke Utama</button>
        </>
      )}
      {(status === "pending" || status === "error") && (
        <>
          <div style={{ fontSize: 64 }}>⚠️</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a" }}>Status Belum Pasti</h2>
          <p style={{ color: "#7a5a3a" }}>Pembayaran anda sedang disahkan. Anda akan dimaklumkan melalui e-mel.</p>
          <button onClick={() => navigate("/")} style={{ marginTop: 16, background: "#8B4513", border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontFamily: "'Playfair Display',serif" }}>Kembali ke Utama</button>
        </>
      )}
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────
function AppInner() {
  const [deadline, setDeadline] = useState(null);

  useEffect(() => {
    settingsApi.getSite().then(r => setDeadline(r.data.settings?.order_deadline)).catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fef7f0, #fff8f2)", fontFamily: "Georgia, serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet" />
      <Navbar />
      <CountdownBanner deadline={deadline} />
      <Routes>
        <Route path="/"                   element={<HomePage />} />
        <Route path="/shop"               element={<ShopPage />} />
        <Route path="/cart"               element={<CartPage />} />
        <Route path="/checkout"           element={<CheckoutPage />} />
        <Route path="/login"              element={<LoginPage />} />
        <Route path="/affiliate"          element={<AffiliateDashPage />} />
        <Route path="/affiliate/register" element={<AffiliateRegisterPage />} />
        <Route path="/admin"              element={<AdminPage />} />
        <Route path="/payment/return"     element={<PaymentReturnPage />} />
      </Routes>
      <footer style={{ borderTop: "2px solid #fce4ec", padding: "2rem", textAlign: "center", background: "rgba(255,255,255,0.9)", marginTop: "3rem", boxShadow: "0 -2px 10px rgba(233, 30, 99, 0.1)" }}>
        <div style={{ fontFamily: "'Playfair Display',serif", color: "#e91e63", marginBottom: 8, fontSize: 16, fontWeight: 600 }}>🌙 Biskut Raya Premium Collection 2025</div>
        <div style={{ color: "#5d4037", fontSize: 13 }}>Pembayaran FPX melalui ToyyibPay · Penghantaran Seluruh Malaysia · © 2025</div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppInner />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}