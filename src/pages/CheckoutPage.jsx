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
  width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid rgba(139,69,19,.4)",
  color: "#fde68a", padding: "9px 12px", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box",
};
const labelStyle = { color: "#cd853f", fontSize: 12, display: "block", marginBottom: 4 };

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
      <div style={{ textAlign: "center", padding: "4rem", color: "#7a5a3a" }}>
        <p>Sila log masuk untuk membuat pesanan.</p>
        <button onClick={() => navigate("/login")} style={{ background: "#8B4513", border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontFamily: "'Playfair Display',serif" }}>Log Masuk</button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "4rem", color: "#7a5a3a" }}>
        <p>Troli anda kosong.</p>
        <button onClick={() => navigate("/shop")} style={{ background: "#8B4513", border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontFamily: "'Playfair Display',serif" }}>Ke Kedai</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h2 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a", fontSize: 26, marginBottom: "1rem" }}>Checkout</h2>

      {/* Step indicators */}
      <div style={{ display: "flex", gap: 8, marginBottom: "2rem" }}>
        {["Penghantaran", "Pembayaran", "Sahkan"].map((s, i) => (
          <div key={s} style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: step > i + 1 ? "#22c55e" : step === i + 1 ? "#cd853f" : "rgba(139,69,19,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 700 }}>
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span style={{ color: step === i + 1 ? "#fde68a" : "#7a5a3a", fontSize: 13 }}>{s}</span>
            {i < 2 && <div style={{ flex: 1, height: 2, background: step > i + 1 ? "#22c55e" : "rgba(139,69,19,.3)", borderRadius: 1 }} />}
          </div>
        ))}
      </div>

      {error && <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 8, padding: "10px 16px", color: "#fca5a5", fontSize: 13, marginBottom: 16 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>
        {/* Left: Form steps */}
        <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(139,69,19,.3)", borderRadius: 12, padding: "1.5rem" }}>
          {step === 1 && (
            <>
              <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a", margin: "0 0 1.2rem" }}>Maklumat Penghantaran</h3>
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

              <label style={{ ...labelStyle, marginTop: 8 }}>Pilihan Penghantaran</label>
              {[
                ["standard", `Standard (3–5 hari) — ${subtotal >= freeThreshold ? "PERCUMA" : formatMYR(stdRate)}`],
                ["express",  `Express (1–2 hari) — ${formatMYR(expRate)}`],
                ["pickup",   "Self-Pickup KL — PERCUMA"],
              ].map(([val, label]) => (
                <label key={val} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, cursor: "pointer", color: "#a0785a", fontSize: 14 }}>
                  <input type="radio" name="shipping" value={val} checked={form.shipping_method === val} onChange={() => set("shipping_method")(val)} />
                  {label}
                </label>
              ))}

              <button
                onClick={() => {
                  if (!form.ship_name || !form.ship_phone || !form.ship_address) { setError("Sila isi semua medan bertanda *"); return; }
                  setError(""); setStep(2);
                }}
                style={{ marginTop: 12, background: "#8B4513", border: "none", color: "#fff", padding: "10px 28px", borderRadius: 8, cursor: "pointer", fontFamily: "'Playfair Display',serif", fontSize: 15 }}
              >
                Seterusnya →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a", margin: "0 0 1.2rem" }}>Kaedah Pembayaran</h3>
              <div style={{ background: "rgba(59,130,246,.08)", border: "1px solid rgba(59,130,246,.3)", borderRadius: 10, padding: "1.2rem", marginBottom: 16 }}>
                <div style={{ color: "#93c5fd", fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                  🏦 FPX Online Banking <span style={{ background: "rgba(34,197,94,.2)", color: "#86efac", fontSize: 10, padding: "2px 8px", borderRadius: 10 }}>Disyorkan</span>
                </div>
                <p style={{ color: "#7a5a3a", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                  Bayar terus melalui akaun bank Malaysia anda. Sokong semua bank utama — Maybank, CIMB, Public Bank, RHB, dan lain-lain. Pembayaran disahkan secara automatik melalui ToyyibPay.
                </p>
              </div>
              <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(139,69,19,.2)", borderRadius: 8, padding: "0.8rem 1rem", marginBottom: 12 }}>
                <div style={{ color: "#7a5a3a", fontSize: 12 }}>✅ Selamat & disulitkan · ✅ Pengesahan segera · ✅ Stok dikemas kini automatik</div>
              </div>
              <p style={{ color: "#a0785a", fontSize: 13, marginBottom: 16 }}>
                Anda akan diarahkan ke halaman pembayaran ToyyibPay selepas mengesahkan pesanan.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ background: "transparent", border: "1px solid #8B4513", color: "#cd853f", padding: "10px 20px", borderRadius: 8, cursor: "pointer" }}>← Kembali</button>
                <button onClick={() => setStep(3)} style={{ background: "#8B4513", border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontFamily: "'Playfair Display',serif", fontSize: 15 }}>Seterusnya →</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a", margin: "0 0 1.2rem" }}>Sahkan Pesanan</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {[["Nama", form.ship_name], ["Telefon", form.ship_phone], ["Alamat", form.ship_address], ["Bandar", form.ship_city], ["Negeri", form.ship_state], ["Penghantaran", form.shipping_method], ["Pembayaran", "FPX Online Banking"]].map(([k, v]) => v && (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#7a5a3a", fontSize: 13 }}>{k}</span>
                    <span style={{ color: "#cd853f", fontSize: 13 }}>{v}</span>
                  </div>
                ))}
              </div>
              {appliedPromo && (
                <div style={{ background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 6, padding: "6px 12px", marginBottom: 12, color: "#86efac", fontSize: 13 }}>
                  🏷️ Kod promo: {appliedPromo.promo_code} — Jimat {formatMYR(discountAmt)}
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStep(2)} style={{ background: "transparent", border: "1px solid #8B4513", color: "#cd853f", padding: "10px 20px", borderRadius: 8, cursor: "pointer" }}>← Kembali</button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  style={{ flex: 1, background: loading ? "#555" : "linear-gradient(135deg,#8B4513,#cd853f)", border: "none", color: "#fff", padding: 12, borderRadius: 8, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 600 }}
                >
                  {loading ? "⏳ Memproses..." : `Bayar ${formatMYR(total)} melalui FPX →`}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right: Order summary */}
        <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(139,69,19,.3)", borderRadius: 12, padding: "1.5rem", height: "fit-content" }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a", margin: "0 0 1rem", fontSize: 16 }}>Ringkasan</h3>
          {items.map((item) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#a0785a", fontSize: 13 }}>{item.image_emoji || "🍪"} {item.name} ×{item.qty}</span>
              <span style={{ color: "#cd853f", fontSize: 13 }}>{formatMYR(Number(item.price) * item.qty)}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid rgba(139,69,19,.3)", paddingTop: 10, marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              ["Subtotal", formatMYR(subtotal)],
              discountAmt > 0 && ["Diskaun Promo", `-${formatMYR(discountAmt)}`],
              ["Penghantaran", shippingCost === 0 ? "PERCUMA 🎉" : formatMYR(shippingCost)],
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#7a5a3a", fontSize: 13 }}>{k}</span>
                <span style={{ color: k === "Diskaun Promo" ? "#22c55e" : shippingCost === 0 && k === "Penghantaran" ? "#22c55e" : "#cd853f", fontSize: 13 }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(139,69,19,.2)" }}>
              <span style={{ color: "#fde68a", fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>JUMLAH</span>
              <span style={{ color: "#F4A460", fontWeight: 700, fontFamily: "'Playfair Display',serif", fontSize: 18 }}>{formatMYR(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}