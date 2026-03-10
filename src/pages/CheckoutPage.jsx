// frontend/src/pages/CheckoutPage.jsx
// 3-step checkout: Shipping → Payment → Confirm
// After order is created, redirects to ToyyibPay FPX

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { ordersApi, paymentApi, settingsApi } from "../lib/api";
import { useSiteSettings } from "../hooks/index.js";

function formatMYR(n) { return `RM ${Number(n).toFixed(2)}`; }

const inputStyle = {
  width: "100%", background: "rgba(255,255,255,0.9)", border: "2px solid #fce4ec",
  color: "#2c1810", padding: "12px 16px", borderRadius: 12, fontSize: 15, outline: "none", boxSizing: "border-box",
  transition: "all 0.3s ease"
};
const labelStyle = { color: "#e91e63", fontSize: 13, display: "block", marginBottom: 6, fontWeight: 600 };

function Field({ label, value, onChange, type = "text", required }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={labelStyle}>{label}{required && " *"}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} required={required} />
    </div>
  );
}

export default function CheckoutPage() {
  const { items, subtotal, appliedPromo, clearCart } = useCart();
  const { dbUser, isCustomer } = useAuth();
  const navigate = useNavigate();
  const { shipping: shippingSettings } = useSiteSettings();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    ship_name: dbUser?.full_name || "",
    ship_phone: dbUser?.phone || "",
    ship_address: "",
    ship_city: "",
    ship_postcode: "",
    ship_state: "",
    shipping_method: "standard",
  });

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  // Calculate shipping cost
  const stdRate  = Number(shippingSettings?.standard_rate || 8);
  const expRate  = Number(shippingSettings?.express_rate || 18);
  const freeThreshold = Number(shippingSettings?.free_shipping_threshold || 100);

  const shippingCost = form.shipping_method === "pickup" ? 0
    : form.shipping_method === "express" ? expRate
    : subtotal >= freeThreshold ? 0 : stdRate;

  const discountAmt = appliedPromo ? subtotal * (Number(appliedPromo.discount_pct) / 100) : 0;
  const total = subtotal - discountAmt + shippingCost;

  // Get affiliate ref from cookie
  const getRefFromCookie = () => {
    const match = document.cookie.match(/aff_ref=([^;]+)/);
    return match ? match[1] : null;
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError("");
    try {
      // Build order payload
      const orderPayload = {
        items: items.map((i) => ({ product_id: i.id, quantity: i.qty })),
        ...form,
        promo_code: appliedPromo?.promo_code || null,
      };

      // 1. Create order in DB
      const orderRes = await ordersApi.create(orderPayload);
      const order = orderRes.data.order;

      // 2. Create ToyyibPay bill
      const payRes = await paymentApi.create(order.id);
      const paymentUrl = payRes.data.payment_url;

      // 3. Clear cart & redirect to payment
      clearCart();
      window.location.href = paymentUrl;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!isCustomer) {
    return (
      <div style={{ textAlign: "center", padding: "4rem", background: "rgba(255,255,255,0.9)", borderRadius: "20px", boxShadow: "0 8px 30px rgba(233, 30, 99, 0.1)", maxWidth: "500px", margin: "2rem auto" }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>🔒</div>
        <p style={{ color: "#5d4037", fontSize: 18, marginBottom: 20 }}>Sila log masuk untuk membuat pesanan.</p>
        <button onClick={() => navigate("/login")} style={{ background: "linear-gradient(135deg, #e91e63, #ffb74d)", border: "none", color: "#fff", padding: "12px 28px", borderRadius: 25, cursor: "pointer", fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 600, boxShadow: "0 4px 15px rgba(233, 30, 99, 0.3)" }}>Log Masuk</button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "4rem", background: "rgba(255,255,255,0.9)", borderRadius: "20px", boxShadow: "0 8px 30px rgba(233, 30, 99, 0.1)", maxWidth: "500px", margin: "2rem auto" }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>🛒</div>
        <p style={{ color: "#5d4037", fontSize: 18, marginBottom: 20 }}>Troli anda kosong.</p>
        <button onClick={() => navigate("/shop")} style={{ background: "linear-gradient(135deg, #e91e63, #ffb74d)", border: "none", color: "#fff", padding: "12px 28px", borderRadius: 25, cursor: "pointer", fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 600, boxShadow: "0 4px 15px rgba(233, 30, 99, 0.3)" }}>Ke Kedai</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h2 style={{ fontFamily: "'Playfair Display',serif", color: "#e91e63", fontSize: 32, marginBottom: "2rem", textAlign: "center", fontWeight: 700 }}>Checkout</h2>

      {/* Step indicators */}
      <div style={{ display: "flex", gap: 12, marginBottom: "2.5rem", justifyContent: "center" }}>
        {["Penghantaran", "Pembayaran", "Sahkan"].map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: step > i + 1 ? "#81c784" : step === i + 1 ? "#e91e63" : "rgba(233, 30, 99, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff", fontWeight: 700, boxShadow: step === i + 1 ? "0 4px 15px rgba(233, 30, 99, 0.3)" : "none" }}>
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span style={{ color: step === i + 1 ? "#e91e63" : "#5d4037", fontSize: 15, fontWeight: step === i + 1 ? 600 : 400 }}>{s}</span>
            {i < 2 && <div style={{ width: 40, height: 2, background: step > i + 1 ? "#81c784" : "rgba(233, 30, 99, 0.2)", borderRadius: 1, margin: "0 8px" }} />}
          </div>
        ))}
      </div>

      {error && <div style={{ background: "rgba(233, 30, 99, 0.1)", border: "2px solid #e91e63", borderRadius: 12, padding: "12px 20px", color: "#e91e63", fontSize: 14, marginBottom: 20, fontWeight: 600 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: 32 }}>
        {/* Left: Form steps */}
        <div style={{ background: "rgba(255,255,255,0.95)", border: "2px solid #fce4ec", borderRadius: 20, padding: "2rem", boxShadow: "0 8px 30px rgba(233, 30, 99, 0.1)" }}>
          {step === 1 && (
            <>
              <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#e91e63", margin: "0 0 1.5rem", fontSize: 22, fontWeight: 600 }}>Maklumat Penghantaran</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <Field label="Nama Penuh" value={form.ship_name} onChange={set("ship_name")} required />
                </div>
                <Field label="No. Telefon" value={form.ship_phone} onChange={set("ship_phone")} required />
                <div />
                <div style={{ gridColumn: "1/-1" }}>
                  <Field label="Alamat Lengkap" value={form.ship_address} onChange={set("ship_address")} required />
                </div>
                <Field label="Bandar" value={form.ship_city} onChange={set("ship_city")} />
                <Field label="Poskod" value={form.ship_postcode} onChange={set("ship_postcode")} />
                <div style={{ gridColumn: "1/-1" }}>
                  <Field label="Negeri" value={form.ship_state} onChange={set("ship_state")} />
                </div>
              </div>

              <label style={{ ...labelStyle, marginTop: 12 }}>Pilihan Penghantaran</label>
              {[
                ["standard", `Standard (3–5 hari) — ${subtotal >= freeThreshold ? "PERCUMA" : formatMYR(stdRate)}`],
                ["express",  `Express (1–2 hari) — ${formatMYR(expRate)}`],
                ["pickup",   "Self-Pickup KL — PERCUMA"],
              ].map(([val, label]) => (
                <label key={val} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, cursor: "pointer", color: "#5d4037", fontSize: 15, padding: "8px 12px", borderRadius: "10px", transition: "all 0.3s ease" }} onMouseEnter={(e) => e.target.style.background = "rgba(233, 30, 99, 0.05)"} onMouseLeave={(e) => e.target.style.background = "transparent"}>
                  <input type="radio" name="shipping" value={val} checked={form.shipping_method === val} onChange={() => set("shipping_method")(val)} style={{ accentColor: "#e91e63" }} />
                  {label}
                </label>
              ))}

              <button
                onClick={() => {
                  if (!form.ship_name || !form.ship_phone || !form.ship_address) { setError("Sila isi semua medan bertanda *"); return; }
                  setError(""); setStep(2);
                }}
                style={{ marginTop: 16, background: "linear-gradient(135deg, #e91e63, #ffb74d)", border: "none", color: "#fff", padding: "12px 32px", borderRadius: 25, cursor: "pointer", fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 600, boxShadow: "0 4px 15px rgba(233, 30, 99, 0.3)" }}
              >
                Seterusnya →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#e91e63", margin: "0 0 1.5rem", fontSize: 22, fontWeight: 600 }}>Kaedah Pembayaran</h3>
              <div style={{ background: "rgba(59, 130, 246, 0.08)", border: "2px solid rgba(59, 130, 246, 0.3)", borderRadius: 16, padding: "1.5rem", marginBottom: 20 }}>
                <div style={{ color: "#1976d2", fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 10, fontSize: 16 }}>
                  🏦 FPX Online Banking <span style={{ background: "rgba(129, 199, 132, 0.2)", color: "#81c784", fontSize: 11, padding: "3px 10px", borderRadius: 12, fontWeight: 600 }}>Disyorkan</span>
                </div>
                <p style={{ color: "#5d4037", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                  Bayar terus melalui akaun bank Malaysia anda. Sokong semua bank utama — Maybank, CIMB, Public Bank, RHB, dan lain-lain. Pembayaran disahkan secara automatik melalui ToyyibPay.
                </p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.9)", border: "2px solid #fce4ec", borderRadius: 12, padding: "1rem 1.2rem", marginBottom: 16 }}>
                <div style={{ color: "#81c784", fontSize: 13, fontWeight: 600 }}>✅ Selamat & disulitkan · ✅ Pengesahan segera · ✅ Stok dikemas kini automatik</div>
              </div>
              <p style={{ color: "#5d4037", fontSize: 14, marginBottom: 20 }}>
                Anda akan diarahkan ke halaman pembayaran ToyyibPay selepas mengesahkan pesanan.
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setStep(1)} style={{ background: "rgba(255,255,255,0.9)", border: "2px solid #e91e63", color: "#e91e63", padding: "12px 24px", borderRadius: 25, cursor: "pointer", fontSize: 15, fontWeight: 600 }}>← Kembali</button>
                <button onClick={() => setStep(3)} style={{ background: "linear-gradient(135deg, #e91e63, #ffb74d)", border: "none", color: "#fff", padding: "12px 28px", borderRadius: 25, cursor: "pointer", fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 600, boxShadow: "0 4px 15px rgba(233, 30, 99, 0.3)" }}>Seterusnya →</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#e91e63", margin: "0 0 1.5rem", fontSize: 22, fontWeight: 600 }}>Sahkan Pesanan</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {[["Nama", form.ship_name], ["Telefon", form.ship_phone], ["Alamat", form.ship_address], ["Bandar", form.ship_city], ["Negeri", form.ship_state], ["Penghantaran", form.shipping_method], ["Pembayaran", "FPX Online Banking"]].map(([k, v]) => v && (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.8)", padding: "8px 12px", borderRadius: "8px" }}>
                    <span style={{ color: "#5d4037", fontSize: 14, fontWeight: 500 }}>{k}</span>
                    <span style={{ color: "#e91e63", fontSize: 14, fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
              {appliedPromo && (
                <div style={{ background: "rgba(129, 199, 132, 0.1)", border: "2px solid #81c784", borderRadius: 12, padding: "10px 16px", marginBottom: 16, color: "#81c784", fontSize: 14, fontWeight: 600 }}>
                  🏷️ Kod promo: {appliedPromo.promo_code} — Jimat {formatMYR(discountAmt)}
                </div>
              )}
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setStep(2)} style={{ background: "rgba(255,255,255,0.9)", border: "2px solid #e91e63", color: "#e91e63", padding: "12px 24px", borderRadius: 25, cursor: "pointer", fontSize: 15, fontWeight: 600 }}>← Kembali</button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  style={{ flex: 1, background: loading ? "rgba(100,100,100,0.5)" : "linear-gradient(135deg, #e91e63, #ffb74d)", border: "none", color: "#fff", padding: 14, borderRadius: 25, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 600, boxShadow: loading ? "none" : "0 4px 15px rgba(233, 30, 99, 0.3)" }}
                >
                  {loading ? "⏳ Memproses..." : `Bayar ${formatMYR(total)} melalui FPX →`}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right: Order summary */}
        <div style={{ background: "rgba(255,255,255,0.95)", border: "2px solid #fce4ec", borderRadius: 20, padding: "2rem", height: "fit-content", boxShadow: "0 8px 30px rgba(233, 30, 99, 0.1)" }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#e91e63", margin: "0 0 1.5rem", fontSize: 20, fontWeight: 600 }}>Ringkasan</h3>
          {items.map((item) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, padding: "8px 0", borderBottom: "1px solid #fce4ec" }}>
              <span style={{ color: "#5d4037", fontSize: 14 }}>{item.image_emoji || "🍪"} {item.name} ×{item.qty}</span>
              <span style={{ color: "#ffb74d", fontSize: 14, fontWeight: 600 }}>{formatMYR(Number(item.price) * item.qty)}</span>
            </div>
          ))}
          <div style={{ borderTop: "2px solid #fce4ec", paddingTop: 16, marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              ["Subtotal", formatMYR(subtotal)],
              discountAmt > 0 && ["Diskaun Promo", `-${formatMYR(discountAmt)}`],
              ["Penghantaran", shippingCost === 0 ? "PERCUMA 🎉" : formatMYR(shippingCost)],
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#5d4037", fontSize: 14 }}>{k}</span>
                <span style={{ color: k === "Diskaun Promo" ? "#81c784" : shippingCost === 0 && k === "Penghantaran" ? "#81c784" : "#ffb74d", fontSize: 14, fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "2px solid #fce4ec" }}>
              <span style={{ color: "#e91e63", fontWeight: 700, fontFamily: "'Playfair Display',serif", fontSize: 16 }}>JUMLAH</span>
              <span style={{ color: "#ffb74d", fontWeight: 700, fontFamily: "'Playfair Display',serif", fontSize: 20 }}>{formatMYR(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}