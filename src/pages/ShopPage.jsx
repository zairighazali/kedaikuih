// frontend/src/pages/ShopPage.jsx
// Product listing — data fetched live from Neon via Express API

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { productsApi } from "../lib/api";
import { affiliatesApi, promoApi } from "../lib/api";
import { useCart } from "../context/CartContext";

const S = {
  wrap: { maxWidth: 1200, margin: "0 auto", padding: "clamp(1rem, 5vw, 3rem) clamp(0.5rem, 3vw, 1.5rem)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(clamp(250px, 25vw, 300px),1fr))", gap: "clamp(16px, 4vw, 28px)" },
  card: { background: "rgba(255,255,255,0.95)", border: "2px solid #fce4ec", borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 25px rgba(233, 30, 99, 0.1)", transition: "all 0.3s ease" },
  cardImg: { background: "linear-gradient(135deg, rgba(233, 30, 99, 0.1), rgba(255, 183, 77, 0.1))", height: "clamp(140px, 20vw, 180px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "clamp(50px, 12vw, 80px)" },
  cardBody: { padding: "clamp(0.8rem, 3vw, 1.5rem)" },
  tag: { background: "rgba(233, 30, 99, 0.15)", color: "#e91e63", fontSize: "clamp(9px, 2.5vw, 11px)", padding: "clamp(2px, 1vw, 4px) clamp(6px, 2vw, 12px)", borderRadius: 15, fontWeight: 600 },
  btn: (disabled) => ({ width: "100%", background: disabled ? "rgba(100,100,100,.2)" : "linear-gradient(135deg, #e91e63, #ffb74d)", border: "none", color: disabled ? "#666" : "#fff", padding: "clamp(10px, 3vw, 14px)", borderRadius: 25, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "'Playfair Display',serif", fontSize: "clamp(12px, 3vw, 15px)", fontWeight: 600, marginTop: 12, boxShadow: disabled ? "none" : "0 4px 15px rgba(233, 30, 99, 0.3)", transition: "all 0.3s ease" }),
  filterBtn: (active) => ({ background: active ? "linear-gradient(135deg, #e91e63, #ffb74d)" : "rgba(255,255,255,0.9)", border: "2px solid #fce4ec", color: active ? "#fff" : "#e91e63", padding: "clamp(6px, 2vw, 8px) clamp(12px, 3vw, 20px)", borderRadius: 25, cursor: "pointer", fontSize: "clamp(12px, 2.5vw, 14px)", fontWeight: 600, transition: "all 0.3s ease", boxShadow: active ? "0 4px 15px rgba(233, 30, 99, 0.3)" : "0 2px 8px rgba(233, 30, 99, 0.1)" }),
};

function formatMYR(n) { return `RM ${Number(n).toFixed(2)}`; }

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState(null);
  const [promoError, setPromoError] = useState("");

  const { addItem, appliedPromo, setAppliedPromo } = useCart();

  // Track affiliate click if ref code in URL
  useEffect(() => {
    if (refCode) {
      affiliatesApi.track(refCode).catch(() => {});
      // Store in cookie for 30 days
      const exp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `aff_ref=${refCode}; expires=${exp}; path=/; SameSite=Lax`;
    }
  }, [refCode]);

  useEffect(() => {
    const params = {};
    if (activeCategory !== "Semua") params.category = activeCategory;
    if (search) params.search = search;
    productsApi.list(params)
      .then((r) => setProducts(r.data.products))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCategory, search]);

  useEffect(() => {
    productsApi.categories()
      .then((r) => setCategories(["Semua", ...r.data.categories]))
      .catch(() => setCategories(["Semua"]));
  }, []);

  const handlePromo = async () => {
    setPromoError("");
    try {
      const res = await promoApi.validate(promoCode);
      setPromoResult(res.data);
      // Persist in cart context
      setAppliedPromo({ promo_code: res.data.promo_code, discount_pct: res.data.discount_pct });
    } catch (err) {
      setPromoError(err.message);
      setPromoResult(null);
    }
  };

  return (
    <div style={S.wrap}>
      {refCode && (
        <div style={{ background: "rgba(129, 199, 132, 0.1)", border: "2px solid #81c784", borderRadius: 12, padding: "12px 20px", marginBottom: 28, color: "#81c784", fontSize: 14, fontWeight: 600 }}>
          🔗 Anda melawat melalui pautan rujukan. Anda layak mendapat diskaun eksklusif!
        </div>
      )}

      {/* Header + Search */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "clamp(16px, 4vw, 24px)", flexWrap: "wrap", gap: "clamp(12px, 3vw, 16px)" }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", color: "#e91e63", fontSize: "clamp(24px, 6vw, 32px)", margin: 0, fontWeight: 700 }}>Koleksi Biskut Raya</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari produk..."
          style={{ background: "rgba(255,255,255,0.9)", border: "2px solid #fce4ec", color: "#2c1810", padding: "clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)", borderRadius: 25, fontSize: "clamp(14px, 3vw, 15px)", outline: "none", width: "clamp(200px, 30vw, 250px)", boxShadow: "0 2px 8px rgba(233, 30, 99, 0.1)", transition: "all 0.3s ease" }}
        />
      </div>

      {/* Category Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {categories.map((c) => (
          <button key={c} onClick={() => setActiveCategory(c)} style={S.filterBtn(activeCategory === c)}>{c}</button>
        ))}
      </div>

      {/* Promo Code */}
      <div style={{ background: "rgba(255,255,255,0.9)", border: "2px solid #fce4ec", borderRadius: 16, padding: "clamp(0.8rem, 3vw, 1.2rem) clamp(1rem, 4vw, 1.8rem)", marginBottom: "clamp(20px, 5vw, 28px)", display: "flex", alignItems: "center", gap: "clamp(12px, 3vw, 16px)", flexWrap: "wrap", boxShadow: "0 4px 15px rgba(233, 30, 99, 0.1)" }}>
        <span style={{ color: "#e91e63", fontSize: "clamp(13px, 3vw, 15px)", fontWeight: 600 }}>🏷️ Kod Promo Affiliate:</span>
        <input
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          placeholder="Contoh: ADAM10"
          style={{ background: "rgba(255,255,255,0.9)", border: "2px solid #fce4ec", color: "#2c1810", padding: "clamp(6px, 2vw, 8px) clamp(10px, 2.5vw, 14px)", borderRadius: 20, fontSize: "clamp(12px, 2.5vw, 14px)", outline: "none", minWidth: "clamp(120px, 20vw, 150px)" }}
        />
        <button onClick={handlePromo} style={{ background: "linear-gradient(135deg, #e91e63, #ffb74d)", border: "none", color: "#fff", padding: "clamp(6px, 2vw, 8px) clamp(12px, 3vw, 18px)", borderRadius: 20, cursor: "pointer", fontSize: "clamp(12px, 2.5vw, 14px)", fontWeight: 600, boxShadow: "0 4px 15px rgba(233, 30, 99, 0.3)" }}>Guna</button>
        {promoResult && <span style={{ color: "#81c784", fontSize: "clamp(12px, 2.5vw, 14px)", fontWeight: 600 }}>✅ {promoResult.message}</span>}
        {promoError && <span style={{ color: "#e91e63", fontSize: "clamp(12px, 2.5vw, 14px)", fontWeight: 600 }}>❌ {promoError}</span>}
      </div>

      {/* Product Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "clamp(2rem, 8vw, 4rem)", background: "rgba(255,255,255,0.9)", borderRadius: "20px", boxShadow: "0 8px 30px rgba(233, 30, 99, 0.1)" }}>
          <div style={{ fontSize: "clamp(40px, 12vw, 60px)", marginBottom: "clamp(12px, 3vw, 16px)" }}>🧁</div>
          <div style={{ color: "#5d4037", fontSize: "clamp(16px, 4vw, 18px)", fontWeight: 600 }}>Memuatkan produk...</div>
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: "center", padding: "clamp(2rem, 8vw, 4rem)", background: "rgba(255,255,255,0.9)", borderRadius: "20px", boxShadow: "0 8px 30px rgba(233, 30, 99, 0.1)", color: "#5d4037" }}>
          <div style={{ fontSize: "clamp(32px, 10vw, 48px)", marginBottom: "clamp(12px, 3vw, 16px)" }}>🍪</div>
          <div style={{ fontSize: "clamp(16px, 4vw, 18px)", fontWeight: 600 }}>Tiada produk ditemui.</div>
        </div>
      ) : (
        <div style={S.grid}>
          {products.map((p) => {
            const discountPct = appliedPromo?.discount_pct || 0;
            const displayPrice = Number(p.price) * (1 - discountPct / 100);

            return (
              <div key={p.id} style={S.card} onMouseEnter={(e) => e.target.style.transform = "translateY(-4px)"} onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}>
                <div style={S.cardImg}>
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span>{p.image_emoji || "🍪"}</span>}
                </div>
                <div style={S.cardBody}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#e91e63", fontSize: "clamp(14px, 3.5vw, 16px)", margin: "0 0 6px", fontWeight: 600 }}>{p.name}</h3>
                      <span style={S.tag}>{p.category}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#ffb74d", fontWeight: 700, fontSize: "clamp(16px, 4vw, 18px)" }}>{formatMYR(displayPrice)}</div>
                      {discountPct > 0 && <div style={{ color: "#8d6e63", fontSize: "clamp(11px, 2.5vw, 13px)", textDecoration: "line-through" }}>{formatMYR(p.price)}</div>}
                    </div>
                  </div>
                  <p style={{ color: "#5d4037", fontSize: "clamp(12px, 2.8vw, 14px)", margin: "clamp(8px, 2vw, 12px) 0", lineHeight: 1.5 }}>{p.description}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: p.stock > 10 ? "#81c784" : p.stock > 0 ? "#ffb74d" : "#e91e63", fontSize: "clamp(11px, 2.5vw, 13px)", fontWeight: 600 }}>
                      ● Stok: {p.stock} balang
                    </span>
                    {p.stock > 0 && p.stock <= 10 && (
                      <span style={{ background: "rgba(255, 183, 77, 0.15)", color: "#ffb74d", fontSize: "clamp(9px, 2vw, 11px)", padding: "clamp(2px, 0.8vw, 3px) clamp(6px, 2vw, 10px)", borderRadius: 12, fontWeight: 600 }}>⚡ Hampir habis!</span>
                    )}
                  </div>
                  <div style={{ color: "#8d6e63", fontSize: "clamp(10px, 2.2vw, 12px)", marginTop: "clamp(6px, 1.5vw, 8px)", fontWeight: 500 }}>
                    🎁 Beli {p.min_bulk_qty}+ balang: diskaun borong {p.bulk_discount_pct}%
                  </div>
                  <button
                    onClick={() => addItem(p)}
                    disabled={p.stock === 0}
                    style={S.btn(p.stock === 0)}
                  >
                    {p.stock === 0 ? "Kehabisan Stok" : "Tambah ke Troli 🛒"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}