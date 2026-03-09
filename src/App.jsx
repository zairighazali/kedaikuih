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
    <div style={{ background: "linear-gradient(135deg,#8B1A1A,#5c0a0a)", padding: "8px 0", textAlign: "center" }}>
      <div style={{ color: "#fde68a", fontFamily: "'Playfair Display',serif", fontSize: 12, letterSpacing: 1, marginBottom: 4 }}>
        ⏳ Tarikh Akhir Pesanan — Cakes tiba sebelum Hari Raya!
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        {[["d", "Hari"], ["h", "Jam"], ["m", "Minit"], ["s", "Saat"]].map(([k, label]) => (
          <div key={k} style={{ textAlign: "center" }}>
            <div style={{ background: "#1a0a00", color: "#F4A460", fontFamily: "monospace", fontSize: 18, fontWeight: 700, padding: "2px 8px", borderRadius: 4, minWidth: 36 }}>
              {String({ d, h, m, s }[k]).padStart(2, "0")}
            </div>
            <div style={{ color: "#cd853f", fontSize: 9, marginTop: 2 }}>{label}</div>
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

  return (
    <nav style={{ background: "#1a0a00", borderBottom: "1px solid #8B4513", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 26 }}>🌙</span>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", color: "#F4A460", fontSize: 17, fontWeight: 700, lineHeight: 1 }}>Biskut Raya</div>
            <div style={{ color: "#cd853f", fontSize: 9, letterSpacing: 3 }}>PREMIUM COLLECTION</div>
          </div>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
          <Link to="/shop" style={{ color: "#cd853f", textDecoration: "none", fontFamily: "'Playfair Display',serif", fontSize: 14 }}>Kedai</Link>
          {isAffiliate && <Link to="/affiliate" style={{ color: "#cd853f", textDecoration: "none", fontFamily: "'Playfair Display',serif", fontSize: 14 }}>Dashboard</Link>}
          {isAdmin && <Link to="/admin" style={{ color: "#cd853f", textDecoration: "none", fontFamily: "'Playfair Display',serif", fontSize: 14 }}>Admin</Link>}

          {dbUser ? (
            <>
              <span style={{ color: "#7a5a3a", fontSize: 12 }}>{dbUser.full_name || dbUser.email}</span>
              <button onClick={logout} style={{ background: "none", border: "1px solid #8B4513", color: "#cd853f", cursor: "pointer", padding: "4px 12px", borderRadius: 4, fontSize: 12 }}>Keluar</button>
            </>
          ) : (
            <Link to="/login" style={{ border: "1px solid #8B4513", color: "#cd853f", padding: "4px 14px", borderRadius: 4, fontSize: 13, textDecoration: "none", fontFamily: "'Playfair Display',serif" }}>Log Masuk</Link>
          )}

          <Link to="/cart" style={{ position: "relative", fontSize: 22, textDecoration: "none" }}>
            🛒
            {itemCount > 0 && (
              <span style={{ position: "absolute", top: -6, right: -8, background: "#e74c3c", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                {itemCount}
              </span>
            )}
          </Link>
        </div>
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
      <h2 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a", fontSize: 26, marginBottom: "2rem" }}>Troli Anda 🛒</h2>
      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#7a5a3a" }}>
          <div style={{ fontSize: 60, marginBottom: 12 }}>🛒</div>
          <div style={{ fontSize: 18, fontFamily: "'Playfair Display',serif", color: "#fde68a", marginBottom: 8 }}>Troli anda kosong</div>
          <button onClick={() => navigate("/shop")} style={{ background: "#8B4513", border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontFamily: "'Playfair Display',serif" }}>Mulai Beli-Belah</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
          <div>
            {items.map((item) => (
              <div key={item.id} style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(139,69,19,.3)", borderRadius: 12, padding: "1rem 1.2rem", marginBottom: 10, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ fontSize: 44 }}>{item.image_emoji || "🍪"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a", fontWeight: 600 }}>{item.name}</div>
                  <div style={{ color: "#cd853f", fontSize: 13 }}>{fmt(item.price)} / balang</div>
                  {item.qty >= (item.min_bulk_qty || 20) && <div style={{ color: "#22c55e", fontSize: 11 }}>🎁 Harga borong!</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ background: "rgba(139,69,19,.4)", border: "none", color: "#fde68a", width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 16 }}>−</button>
                  <span style={{ color: "#fde68a", minWidth: 28, textAlign: "center", fontWeight: 700 }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ background: "rgba(139,69,19,.4)", border: "none", color: "#fde68a", width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 16 }}>+</button>
                </div>
                <div style={{ color: "#F4A460", fontWeight: 700, minWidth: 70, textAlign: "right" }}>{fmt(Number(item.price) * item.qty)}</div>
                <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", color: "#7a5a3a", cursor: "pointer", fontSize: 18 }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(139,69,19,.3)", borderRadius: 12, padding: "1.5rem", height: "fit-content" }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a", margin: "0 0 1.2rem", fontSize: 16 }}>Ringkasan</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {[["Subtotal", fmt(subtotal)], ["Penghantaran", shipping === 0 ? "PERCUMA 🎉" : fmt(shipping)]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#7a5a3a", fontSize: 13 }}>{k}</span>
                  <span style={{ color: shipping === 0 && k === "Penghantaran" ? "#22c55e" : "#cd853f", fontSize: 13 }}>{v}</span>
                </div>
              ))}
              {subtotal < freeThreshold && shippingSettings && (
                <div style={{ color: "#7a5a3a", fontSize: 11 }}>* Tambah {fmt(freeThreshold - subtotal)} lagi untuk penghantaran percuma</div>
              )}
            </div>
            <div style={{ borderTop: "1px solid rgba(139,69,19,.3)", paddingTop: 10, display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ color: "#fde68a", fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>JUMLAH</span>
              <span style={{ color: "#F4A460", fontSize: 20, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{fmt(total)}</span>
            </div>
            {appliedPromo && (
              <div style={{ background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 6, padding: "6px 10px", marginBottom: 10, color: "#86efac", fontSize: 12 }}>
                🏷️ Kod: {appliedPromo.promo_code} — Diskaun {appliedPromo.discount_pct}%
              </div>
            )}
            <button onClick={() => navigate("/checkout")} style={{ width: "100%", background: "linear-gradient(135deg,#8B4513,#cd853f)", border: "none", color: "#fff", padding: 12, borderRadius: 8, cursor: "pointer", fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 600 }}>
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
    <div style={{ position: "relative", minHeight: "80vh", background: "linear-gradient(160deg,#0d0500,#1a0a00 40%,#2d1200)", display: "flex", alignItems: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "10%", right: "8%", width: 320, height: 320, background: "radial-gradient(circle,rgba(139,69,19,.25) 0%,transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "4rem 2rem", width: "100%" }}>
        <div style={{ maxWidth: 580 }}>
          <div style={{ color: "#cd853f", letterSpacing: 6, fontSize: 11, fontFamily: "monospace", marginBottom: 16 }}>KOLEKSI PREMIUM RAYA 2025</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(2.5rem,5vw,4.5rem)", color: "#fde68a", lineHeight: 1.1, margin: "0 0 1.5rem" }}>
            Manis Raya,<br /><em style={{ color: "#F4A460" }}>Sampai ke Pintu</em>
          </h1>
          <p style={{ color: "#a0785a", fontSize: 16, lineHeight: 1.7, marginBottom: "2rem", maxWidth: 480 }}>
            Biskut dan kuih Raya Premium, dibakar dengan kasih sayang dan resipi turun-temurun. Penghantaran ke seluruh Malaysia.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={() => navigate("/shop")} style={{ background: "linear-gradient(135deg,#8B4513,#cd853f)", border: "none", color: "#fff", padding: "14px 32px", borderRadius: 8, cursor: "pointer", fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 600 }}>
              Beli Sekarang ✦
            </button>
            <button onClick={() => navigate("/affiliate/register")} style={{ background: "transparent", border: "1px solid #8B4513", color: "#cd853f", padding: "14px 28px", borderRadius: 8, cursor: "pointer", fontFamily: "'Playfair Display',serif", fontSize: 15 }}>
              Jadi Affiliate
            </button>
          </div>
          <div style={{ display: "flex", gap: 32, marginTop: "2.5rem" }}>
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
    <div style={{ minHeight: "100vh", background: "#0d0500", fontFamily: "Georgia, serif" }}>
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
      <footer style={{ borderTop: "1px solid rgba(139,69,19,.2)", padding: "2rem", textAlign: "center", color: "#7a5a3a", fontSize: 12, marginTop: "3rem" }}>
        <div style={{ fontFamily: "'Playfair Display',serif", color: "#cd853f", marginBottom: 4 }}>🌙 Biskut Raya Premium Collection 2025</div>
        <div>Pembayaran FPX melalui ToyyibPay · Penghantaran Seluruh Malaysia · © 2025</div>
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