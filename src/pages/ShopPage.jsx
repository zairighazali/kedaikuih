// frontend/src/pages/ShopPage.jsx
// Product listing — data fetched live from Neon via Express API

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { productsApi } from "../lib/api";
import { affiliatesApi, promoApi } from "../lib/api";
import { useCart } from "../context/CartContext";

const S = {
  wrap: { maxWidth: 1200, margin: "0 auto", padding: "3rem 1.5rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 24 },
  card: { background: "linear-gradient(145deg,rgba(26,10,0,.9),rgba(45,18,0,.9))", border: "1px solid rgba(139,69,19,.4)", borderRadius: 16, overflow: "hidden" },
  cardImg: { background: "linear-gradient(135deg,rgba(139,69,19,.2),rgba(205,133,63,.1))", height: 160, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72 },
  cardBody: { padding: "1.2rem" },
  tag: { background: "rgba(139,69,19,.3)", color: "#cd853f", fontSize: 10, padding: "2px 8px", borderRadius: 10 },
  btn: (disabled) => ({ width: "100%", background: disabled ? "rgba(100,100,100,.2)" : "linear-gradient(135deg,#8B4513,#cd853f)", border: "none", color: disabled ? "#555" : "#fff", padding: 10, borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 600, marginTop: 10 }),
  filterBtn: (active) => ({ background: active ? "linear-gradient(135deg,#8B4513,#cd853f)" : "rgba(255,255,255,.05)", border: "1px solid rgba(139,69,19,.4)", color: active ? "#fff" : "#cd853f", padding: "6px 16px", borderRadius: 20, cursor: "pointer", fontSize: 13 }),
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
    setLoading(true);
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
        <div style={{ background: "rgba(34,197,94,.1)", border: "1px solid #22c55e", borderRadius: 8, padding: "10px 16px", marginBottom: 24, color: "#86efac", fontSize: 13 }}>
          🔗 Anda melawat melalui pautan rujukan. Anda layak mendapat diskaun eksklusif!
        </div>
      )}

      {/* Header + Search */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a", fontSize: 28, margin: 0 }}>Koleksi Biskut Raya</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari produk..."
          style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(139,69,19,.4)", color: "#fde68a", padding: "8px 14px", borderRadius: 8, fontSize: 14, outline: "none", width: 220 }}
        />
      </div>

      {/* Category Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {categories.map((c) => (
          <button key={c} onClick={() => setActiveCategory(c)} style={S.filterBtn(activeCategory === c)}>{c}</button>
        ))}
      </div>

      {/* Promo Code */}
      <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(139,69,19,.3)", borderRadius: 12, padding: "1rem 1.5rem", marginBottom: 24, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ color: "#cd853f", fontSize: 13 }}>🏷️ Kod Promo Affiliate:</span>
        <input
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          placeholder="Contoh: ADAM10"
          style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(139,69,19,.4)", color: "#fde68a", padding: "6px 12px", borderRadius: 6, fontSize: 13, outline: "none" }}
        />
        <button onClick={handlePromo} style={{ background: "#8B4513", border: "none", color: "#fff", padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>Guna</button>
        {promoResult && <span style={{ color: "#22c55e", fontSize: 13 }}>✅ {promoResult.message}</span>}
        {promoError && <span style={{ color: "#ef4444", fontSize: 13 }}>❌ {promoError}</span>}
      </div>

      {/* Product Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#7a5a3a" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌙</div>
          <div>Memuatkan produk...</div>
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#7a5a3a" }}>
          Tiada produk ditemui.
        </div>
      ) : (
        <div style={S.grid}>
          {products.map((p) => {
            const inCart = false;
            const isBulkThreshold = false; // managed in cart context
            const discountPct = appliedPromo?.discount_pct || 0;
            const displayPrice = Number(p.price) * (1 - discountPct / 100);

            return (
              <div key={p.id} style={S.card}>
                <div style={S.cardImg}>
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span>{p.image_emoji || "🍪"}</span>}
                </div>
                <div style={S.cardBody}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a", fontSize: 15, margin: "0 0 4px" }}>{p.name}</h3>
                      <span style={S.tag}>{p.category}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#F4A460", fontWeight: 700, fontSize: 17 }}>{formatMYR(displayPrice)}</div>
                      {discountPct > 0 && <div style={{ color: "#7a5a3a", fontSize: 12, textDecoration: "line-through" }}>{formatMYR(p.price)}</div>}
                    </div>
                  </div>
                  <p style={{ color: "#7a5a3a", fontSize: 13, margin: "10px 0", lineHeight: 1.5 }}>{p.description}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: p.stock > 10 ? "#22c55e" : p.stock > 0 ? "#f59e0b" : "#ef4444", fontSize: 12 }}>
                      ● Stok: {p.stock} balang
                    </span>
                    {p.stock > 0 && p.stock <= 10 && (
                      <span style={{ background: "rgba(245,158,11,.15)", color: "#f59e0b", fontSize: 10, padding: "2px 8px", borderRadius: 10 }}>⚡ Hampir habis!</span>
                    )}
                  </div>
                  <div style={{ color: "#7a5a3a", fontSize: 11, marginTop: 6 }}>
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