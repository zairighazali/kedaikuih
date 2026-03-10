// frontend/src/pages/AdminPage.jsx
// Admin panel: products CRUD, order management, affiliate management, settings

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { productsApi, ordersApi, affiliatesApi, settingsApi } from "../lib/api";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { app } from "../lib/firebase"; // named export of the Firebase app instance

const storage = getStorage(app);

function formatMYR(n) { return `RM ${Number(n).toFixed(2)}`; }

const STATUS_COLORS = {
  pending_payment: "#f59e0b", paid: "#3b82f6", processing: "#8b5cf6",
  shipped: "#f97316", delivered: "#22c55e", cancelled: "#ef4444",
};
const STATUS_LABELS = {
  pending_payment: "Belum Bayar", paid: "Dibayar", processing: "Diproses",
  shipped: "Dihantar", delivered: "Diterima", cancelled: "Dibatalkan",
};

const inputStyle = {
  width: "100%", background: "rgba(255,255,255,0.9)", border: "2px solid #fce4ec",
  color: "#2c1810", padding: "10px 12px", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box",
  transition: "all 0.3s ease"
};

export default function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("dashboard");

  if (loading) return <div style={{ textAlign: "center", padding: "4rem", background: "rgba(255,255,255,0.9)", borderRadius: "20px", boxShadow: "0 8px 30px rgba(233, 30, 99, 0.1)", maxWidth: "400px", margin: "2rem auto", color: "#5d4037", fontSize: 18 }}>Memuatkan...</div>;
  if (!isAdmin) return <div style={{ textAlign: "center", padding: "4rem", background: "rgba(255,255,255,0.9)", borderRadius: "20px", boxShadow: "0 8px 30px rgba(233, 30, 99, 0.1)", maxWidth: "400px", margin: "2rem auto", color: "#e91e63", fontSize: 18, fontWeight: 600 }}>⛔ Akses ditolak. Admin sahaja.</div>;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem", background: "linear-gradient(135deg, #fff8f5, #fce4ec)", minHeight: "100vh" }}>
      <div style={{ marginBottom: "0.5rem", color: "#e91e63", fontSize: 14, fontWeight: 600 }}>Panel Admin</div>
      <h2 style={{ fontFamily: "'Playfair Display',serif", color: "#e91e63", margin: "0 0 1.5rem", fontSize: 28, fontWeight: 700 }}>Pengurusan Sistem</h2>

      {/* Tab nav */}
      <div style={{ display: "flex", gap: 12, marginBottom: "2rem", flexWrap: "wrap" }}>
        {[["dashboard","📊 Dashboard"], ["products","🧁 Produk"], ["orders","📦 Pesanan"], ["affiliates","🤝 Affiliate"], ["settings","⚙️ Tetapan"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ background: tab === k ? "linear-gradient(135deg, #e91e63, #ffb74d)" : "rgba(255,255,255,0.9)", border: "2px solid #fce4ec", color: tab === k ? "#fff" : "#e91e63", padding: "10px 20px", borderRadius: 25, cursor: "pointer", fontSize: 15, fontWeight: 600, boxShadow: tab === k ? "0 4px 15px rgba(233, 30, 99, 0.3)" : "0 2px 8px rgba(233, 30, 99, 0.1)", transition: "all 0.3s ease" }}>{l}</button>
        ))}
      </div>

      {tab === "dashboard" && <DashboardTab />}
      {tab === "products"  && <ProductsTab />}
      {tab === "orders"    && <OrdersTab />}
      {tab === "affiliates"&& <AffiliatesTab />}
      {tab === "settings"  && <SettingsTab />}
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────
function DashboardTab() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([ordersApi.list({ limit: 100 }), affiliatesApi.list()])
      .then(([ord, aff]) => {
        const orders = ord.data.orders;
        const affiliates = aff.data.affiliates;
        setStats({
          revenue: orders.filter(o => o.status !== "cancelled" && o.status !== "pending_payment").reduce((s, o) => s + Number(o.total), 0),
          totalOrders: orders.length,
          pendingOrders: orders.filter(o => o.status === "pending_payment").length,
          commissionDue: affiliates.reduce((s, a) => s + Number(a.pending_payout || 0), 0),
          affiliateCount: affiliates.length,
        });
      })
      .catch(console.error);
  }, []);

  if (!stats) return <div style={{ color: "#7a5a3a" }}>Memuatkan...</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20 }}>
      {[
        ["💰", "Jumlah Hasil", formatMYR(stats.revenue), "#81c784"],
        ["📦", "Jumlah Pesanan", stats.totalOrders, "#1976d2"],
        ["⚠️", "Belum Bayar", stats.pendingOrders, "#ffb74d"],
        ["🤝", "Komisyen Tertunggak", formatMYR(stats.commissionDue), "#ff9800"],
        ["👥", "Affiliate Aktif", stats.affiliateCount, "#9c27b0"],
      ].map(([ic, lab, val, col]) => (
        <div key={lab} style={{ background: "rgba(255,255,255,0.95)", border: "2px solid #fce4ec", borderRadius: 16, padding: "1.8rem", boxShadow: "0 4px 15px rgba(233, 30, 99, 0.1)", transition: "all 0.3s ease", cursor: "pointer" }} onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"} onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>{ic}</div>
          <div style={{ color: "#5d4037", fontSize: 13, fontWeight: 500 }}>{lab}</div>
          <div style={{ color: col, fontSize: 26, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Firebase Storage helpers ────────────────────────────────

async function uploadProductImage(file, onProgress) {
  const ext  = file.name.split(".").pop().toLowerCase();
  const path = `products/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const sRef = storageRef(storage, path);
  const task = uploadBytesResumable(sRef, file, { contentType: file.type });
  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => resolve({ url: await getDownloadURL(task.snapshot.ref), storagePath: path })
    );
  });
}

async function deleteProductImage(path) {
  if (!path) return;
  try { await deleteObject(storageRef(storage, path)); } catch { /* already gone */ }
}

// ─── ImageUploader component ─────────────────────────────────

function ImageUploader({ currentUrl, onUploaded }) {
  const fileRef = useRef();
  const [preview,  setPreview]  = useState(currentUrl || null);
  const [progress, setProgress] = useState(null); // null=idle, 0-100=uploading
  const [error,    setError]    = useState("");

  useEffect(() => { setPreview(currentUrl || null); }, [currentUrl]);

  const handle = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Fail mesti imej (JPG/PNG/WebP)."); return; }
    if (file.size > 5 * 1024 * 1024)    { setError("Saiz maksimum 5 MB."); return; }
    setError(""); setPreview(URL.createObjectURL(file)); setProgress(0);
    try {
      const { url, storagePath } = await uploadProductImage(file, setProgress);
      setProgress(null);
      onUploaded(url, storagePath);
    } catch (e) { setError("Upload gagal: " + e.message); setProgress(null); }
  };

  return (
    <div>
      {/* Drop / click zone */}
      <div
        onClick={() => progress === null && fileRef.current.click()}
        onDrop={(e) => { e.preventDefault(); handle(e.dataTransfer.files[0]); }}
        onDragOver={(e) => e.preventDefault()}
        style={{ position: "relative", height: 130, borderRadius: 10, overflow: "hidden", cursor: progress !== null ? "wait" : "pointer",
          border: "2px dashed rgba(233, 30, 99, 0.3)", background: "rgba(255,255,255,0.8)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
      >
        {preview
          ? <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <>
              <div style={{ fontSize: 30 }}>📷</div>
              <div style={{ color: "#e91e63", fontSize: 12, marginTop: 4, fontWeight: 500 }}>Klik atau seret gambar</div>
              <div style={{ color: "#5d4037", fontSize: 10 }}>JPG · PNG · WebP · maks 5 MB</div>
            </>
        }
        {progress !== null && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.95)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 10 }}>
            <div style={{ color: "#e91e63", fontSize: 13, fontWeight: 700 }}>Menghantar... {progress}%</div>
            <div style={{ width: "72%", height: 6, background: "rgba(233, 30, 99, 0.1)", borderRadius: 3 }}>
              <div style={{ width: `${progress}%`, height: "100%", borderRadius: 3,
                background: "linear-gradient(90deg,#e91e63,#ffb74d)", transition: "width .25s" }} />
            </div>
          </div>
        )}
      </div>

      {/* Change / Remove buttons */}
      {preview && progress === null && (
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <button type="button" onClick={() => fileRef.current.click()}
            style={{ flex: 1, background: "rgba(59,130,246,.15)", border: "1px solid rgba(59,130,246,.4)",
              color: "#1976d2", padding: "5px 8px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 500 }}>
            🔄 Tukar
          </button>
          <button type="button" onClick={() => { setPreview(null); onUploaded("", ""); }}
            style={{ background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.4)",
              color: "#dc2626", padding: "5px 8px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 500 }}>
            🗑️ Buang
          </button>
        </div>
      )}

      {error && <div style={{ color: "#fca5a5", fontSize: 11, marginTop: 4 }}>⚠️ {error}</div>}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => handle(e.target.files[0])} />
    </div>
  );
}

// ─── Products ────────────────────────────────────────────────
function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editId,   setEditId]   = useState(null);
  const [editData, setEditData] = useState({});
  const [showAdd,  setShowAdd]  = useState(false);
  const [newP, setNewP] = useState({
    name: "", description: "", price: "", stock: "", category: "",
    image_url: "", image_storagePath: "", min_bulk_qty: 20, bulk_discount_pct: 10,
  });
  const [msg, setMsg] = useState("");

  const load = () => productsApi.adminAll().then((r) => setProducts(r.data.products)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const handleAdd = async () => {
    try {
      await productsApi.create({ ...newP, price: +newP.price, stock: +newP.stock });
      flash("✅ Produk ditambah!"); setShowAdd(false);
      setNewP({ name: "", description: "", price: "", stock: "", category: "", image_url: "", image_storagePath: "", min_bulk_qty: 20, bulk_discount_pct: 10 });
      load();
    } catch (err) { flash("❌ " + err.message); }
  };

  const handleSave = async (id) => {
    try {
      await productsApi.update(id, { ...editData, price: +editData.price, stock: +editData.stock });
      flash("✅ Produk dikemas kini!"); setEditId(null); load();
    } catch (err) { flash("❌ " + err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Padam produk ini?")) return;
    try {
      const prod = products.find(p => p.id === id);
      if (prod?.image_storagePath) await deleteProductImage(prod.image_storagePath);
      await productsApi.remove(id); flash("✅ Produk dipadam!"); load();
    } catch (err) { flash("❌ " + err.message); }
  };

  // shared field list for add & edit (text fields only)
  const fields = [["name","Nama Produk *"],["price","Harga (RM) *"],["stock","Stok *"],["category","Kategori"],["min_bulk_qty","Min. Borong"],["bulk_discount_pct","Diskaun Borong (%)"]];

  return (
    <div>
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#e91e63", margin: 0, fontSize: 24, fontWeight: 600 }}>Urus Produk</h3>
        <button onClick={() => setShowAdd(!showAdd)}
          style={{ background: "linear-gradient(135deg, #e91e63, #ffb74d)", border: "none", color: "#fff", padding: "10px 20px", borderRadius: 25, cursor: "pointer", fontSize: 15, fontWeight: 600, boxShadow: "0 4px 15px rgba(233, 30, 99, 0.3)" }}>
          + Tambah Produk
        </button>
      </div>
      {msg && <div style={{ background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 6, padding: "8px 12px", color: "#86efac", fontSize: 13, marginBottom: 12 }}>{msg}</div>}

      {/* ── ADD FORM ── */}
      {showAdd && (
        <div style={{ background: "rgba(255,255,255,0.95)", border: "2px solid #fce4ec", borderRadius: 16, padding: "1.8rem", marginBottom: 20, boxShadow: "0 4px 15px rgba(233, 30, 99, 0.1)" }}>
          <h4 style={{ color: "#e91e63", fontFamily: "'Playfair Display',serif", margin: "0 0 1.2rem", fontSize: 20, fontWeight: 600 }}>Produk Baru</h4>
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 16, marginBottom: 12 }}>
            {/* image */}
            <div>
              <div style={{ color: "#e91e63", fontSize: 12, marginBottom: 6, fontWeight: 600 }}>Gambar Produk</div>
              <ImageUploader currentUrl={newP.image_url}
                onUploaded={(url, path) => setNewP(p => ({ ...p, image_url: url, image_storagePath: path }))} />
            </div>
            {/* text fields */}
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {fields.map(([k, l]) => (
                  <div key={k}>
                    <label style={{ color: "#e91e63", fontSize: 12, display: "block", marginBottom: 4, fontWeight: 500 }}>{l}</label>
                    <input value={newP[k]} onChange={(e) => setNewP(p => ({...p, [k]: e.target.value}))} style={inputStyle} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ color: "#e91e63", fontSize: 12, display: "block", marginBottom: 4, fontWeight: 500 }}>Penerangan</label>
                <textarea value={newP.description} onChange={(e) => setNewP(p => ({...p, description: e.target.value}))}
                  rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleAdd} style={{ background: "linear-gradient(135deg, #4caf50, #66bb6a)", border: "none", color: "#fff", padding: "10px 24px", borderRadius: 25, cursor: "pointer", fontSize: 15, fontWeight: 600, boxShadow: "0 4px 15px rgba(76, 175, 80, 0.3)" }}>✓ Simpan Produk</button>
            <button onClick={() => setShowAdd(false)} style={{ background: "rgba(255,255,255,0.9)", border: "2px solid #fce4ec", color: "#e91e63", padding: "10px 20px", borderRadius: 25, cursor: "pointer", fontSize: 15, fontWeight: 600 }}>Batal</button>
          </div>
        </div>
      )}

      {/* ── PRODUCT LIST ── */}
      {loading ? <div style={{ color: "#7a5a3a" }}>Memuatkan...</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {products.map((p) => editId === p.id ? (

            // ── EDIT ROW ──
            <div key={p.id} style={{ background: "rgba(255,255,255,0.95)", border: "2px solid #e91e63", borderRadius: 16, padding: "1.5rem 1.8rem", boxShadow: "0 4px 15px rgba(233, 30, 99, 0.2)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 16, marginBottom: 12 }}>
                <div>
                  <div style={{ color: "#e91e63", fontSize: 12, marginBottom: 6, fontWeight: 600 }}>Gambar Produk</div>
                  <ImageUploader currentUrl={editData.image_url || ""}
                    onUploaded={(url, path) => setEditData(d => ({ ...d, image_url: url, image_storagePath: path }))} />
                </div>
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 12 }}>
                    {fields.map(([k, l]) => (
                      <div key={k}>
                        <div style={{ color: "#e91e63", fontSize: 12, fontWeight: 500 }}>{l}</div>
                        <input value={editData[k] || ""} onChange={(e) => setEditData(d => ({...d, [k]: e.target.value}))} style={inputStyle} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ color: "#e91e63", fontSize: 12, fontWeight: 500 }}>Penerangan</div>
                    <textarea value={editData.description || ""} onChange={(e) => setEditData(d => ({...d, description: e.target.value}))}
                      rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => handleSave(p.id)} style={{ background: "linear-gradient(135deg, #4caf50, #66bb6a)", border: "none", color: "#fff", padding: "10px 24px", borderRadius: 25, cursor: "pointer", fontSize: 15, fontWeight: 600, boxShadow: "0 4px 15px rgba(76, 175, 80, 0.3)" }}>✓ Simpan</button>
                <button onClick={() => setEditId(null)} style={{ background: "rgba(255,255,255,0.9)", border: "2px solid #fce4ec", color: "#e91e63", padding: "10px 20px", borderRadius: 25, cursor: "pointer", fontSize: 15, fontWeight: 600 }}>✕ Batal</button>
              </div>
            </div>

          ) : (

            // ── VIEW ROW ──
            <div key={p.id} style={{ background: "rgba(255,255,255,0.95)", border: `2px solid ${p.is_active ? "#fce4ec" : "#ef4444"}`,
              borderRadius: 16, padding: "1.2rem 1.5rem", display: "flex", alignItems: "center", gap: 16, opacity: p.is_active ? 1 : 0.7, boxShadow: "0 2px 8px rgba(233, 30, 99, 0.1)", transition: "all 0.3s ease" }}>

              {/* thumbnail — real photo or fallback emoji */}
              <div style={{ width: 60, height: 60, borderRadius: 12, overflow: "hidden", flexShrink: 0,
                background: "linear-gradient(135deg, #fce4ec, #ffebee)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fce4ec" }}>
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 30 }}>{p.image_emoji || "🍪"}</span>
                }
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ color: "#3e2723", fontFamily: "'Playfair Display',serif", fontWeight: 600, fontSize: 16 }}>{p.name}</div>
                <div style={{ color: "#5d4037", fontSize: 13 }}>{p.category} · {formatMYR(p.price)}</div>
              </div>
              <div style={{ textAlign: "center", minWidth: 70 }}>
                <div style={{ color: p.stock < 10 ? "#ef4444" : "#4caf50", fontWeight: 700, fontSize: 18 }}>{p.stock}</div>
                <div style={{ color: "#5d4037", fontSize: 11 }}>balang</div>
              </div>
              {!p.is_active && <span style={{ color: "#ef4444", fontSize: 12, background: "rgba(239, 68, 68, 0.1)", padding: "4px 10px", borderRadius: 12, fontWeight: 500 }}>TIDAK AKTIF</span>}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setEditId(p.id); setEditData({ ...p }); }}
                  style={{ background: "rgba(59,130,246,.15)", border: "1px solid rgba(59,130,246,.4)", color: "#1976d2", padding: "8px 16px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>✏️ Edit</button>
                <button onClick={() => handleDelete(p.id)}
                  style={{ background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.4)", color: "#dc2626", padding: "8px 16px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>🗑️ Padam</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Orders ──────────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    const params = statusFilter ? { status: statusFilter } : {};
    ordersApi.list(params)
      .then((r) => setOrders(r.data.orders))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [statusFilter]);

  const updateStatus = async (id, status) => {
    try {
      await ordersApi.updateStatus(id, status);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: 10 }}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#e91e63", margin: 0, fontSize: 24, fontWeight: 600 }}>Semua Pesanan</h3>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ background: "rgba(255,255,255,0.9)", border: "2px solid #fce4ec", color: "#2c1810", padding: "8px 16px", borderRadius: 20, fontSize: 14, outline: "none", fontWeight: 500 }}>
          <option value="">Semua Status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? <div style={{ color: "#7a5a3a" }}>Memuatkan...</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {orders.map((o) => (
            <div key={o.id} style={{ background: "rgba(255,255,255,0.95)", border: "2px solid #fce4ec", borderRadius: 16, padding: "1.2rem 1.5rem", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", boxShadow: "0 2px 8px rgba(233, 30, 99, 0.1)", transition: "all 0.3s ease" }}>
              <div style={{ minWidth: 120 }}>
                <div style={{ color: "#2c1810", fontFamily: "monospace", fontWeight: 700, fontSize: 14 }}>{o.order_number}</div>
                <div style={{ color: "#5d4037", fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString("ms-MY")}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#2c1810", fontSize: 15, fontWeight: 600 }}>{o.customer_name || o.ship_name}</div>
                <div style={{ color: "#5d4037", fontSize: 13 }}>{o.customer_email} · {o.item_count} item</div>
              </div>
              <div style={{ color: "#e91e63", fontWeight: 700, fontSize: 16 }}>{formatMYR(o.total)}</div>
              <span style={{ background: `${STATUS_COLORS[o.status]}22`, color: STATUS_COLORS[o.status], padding: "6px 14px", borderRadius: 20, fontSize: 13, border: `2px solid ${STATUS_COLORS[o.status]}55`, whiteSpace: "nowrap", fontWeight: 600 }}>
                {STATUS_LABELS[o.status] || o.status}
              </span>
              <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}
                style={{ background: "rgba(255,255,255,0.9)", border: "2px solid #fce4ec", color: "#2c1810", padding: "8px 12px", borderRadius: 20, fontSize: 13, outline: "none", fontWeight: 500 }}>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Affiliates ───────────────────────────────────────────────
function AffiliatesTab() {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editComm, setEditComm] = useState(null);
  const [commData, setCommData] = useState({});
  const [msg, setMsg] = useState("");

  const load = () => affiliatesApi.list().then(r => setAffiliates(r.data.affiliates)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const approve = async (id) => {
    try { await affiliatesApi.approve(id, { commission_type: "percent", commission_value: 10 }); flash("✅ Affiliate diluluskan!"); load(); }
    catch (err) { flash("❌ " + err.message); }
  };

  const payout = async (id) => {
    if (!window.confirm("Sahkan pembayaran komisyen ini?")) return;
    try { await affiliatesApi.payout(id); flash("✅ Pembayaran dikonfirmasi!"); load(); }
    catch (err) { flash("❌ " + err.message); }
  };

  const saveComm = async (id) => {
    try { await affiliatesApi.setCommission(id, commData); flash("✅ Kadar komisyen dikemas kini!"); setEditComm(null); load(); }
    catch (err) { flash("❌ " + err.message); }
  };

  return (
    <div>
      <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#e91e63", margin: "0 0 1rem", fontSize: 24, fontWeight: 600 }}>Urus Affiliate</h3>
      {msg && <div style={{ background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 6, padding: "8px 12px", color: "#86efac", fontSize: 13, marginBottom: 12 }}>{msg}</div>}
      {loading ? <div style={{ color: "#7a5a3a" }}>Memuatkan...</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {affiliates.map((a) => (
            <div key={a.id} style={{ background: "rgba(255,255,255,0.95)", border: "2px solid #fce4ec", borderRadius: 16, padding: "1.5rem 1.8rem", boxShadow: "0 4px 15px rgba(233, 30, 99, 0.1)", transition: "all 0.3s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ color: "#2c1810", fontFamily: "'Playfair Display',serif", fontWeight: 600, fontSize: 16 }}>{a.full_name}</div>
                  <div style={{ color: "#5d4037", fontSize: 13 }}>
                    {a.email} · Kod: <span style={{ color: "#e91e63", fontWeight: 600 }}>{a.affiliate_code}</span> · Promo: <span style={{ color: "#ffb74d", fontWeight: 600 }}>{a.promo_code}</span>
                  </div>
                  <span style={{ background: a.status === "active" ? "linear-gradient(135deg, #4caf50, #66bb6a)" : "linear-gradient(135deg, #ffb74d, #ffcc02)", color: "#fff", fontSize: 12, padding: "4px 12px", borderRadius: 16, marginTop: 6, display: "inline-block", fontWeight: 600 }}>
                    {a.status === "active" ? "Aktif" : a.status === "pending" ? "Menunggu" : a.status}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
                  {[["Klik", a.total_clicks], ["Pesanan", a.total_orders], ["Earned", formatMYR(a.total_earned)], ["Tertunggak", formatMYR(a.pending_payout || 0)]].map(([l, v]) => (
                    <div key={l} style={{ textAlign: "center" }}>
                      <div style={{ color: "#e91e63", fontWeight: 700, fontSize: 16 }}>{v}</div>
                      <div style={{ color: "#5d4037", fontSize: 12 }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {a.status === "pending" && (
                    <button onClick={() => approve(a.id)} style={{ background: "linear-gradient(135deg, #4caf50, #66bb6a)", border: "none", color: "#fff", padding: "8px 16px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 15px rgba(76, 175, 80, 0.3)" }}>✅ Luluskan</button>
                  )}
                  <button onClick={() => { setEditComm(a.id); setCommData({ commission_type: a.commission_type, commission_value: a.commission_value, promo_discount_pct: a.promo_discount_pct }); }} style={{ background: "rgba(59,130,246,.15)", border: "2px solid rgba(59,130,246,.4)", color: "#1976d2", padding: "8px 16px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>✏️ Kadar</button>
                  {Number(a.pending_payout) > 0 && (
                    <button onClick={() => payout(a.id)} style={{ background: "linear-gradient(135deg, #e91e63, #ffb74d)", border: "none", color: "#fff", padding: "8px 16px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 15px rgba(233, 30, 99, 0.3)" }}>💸 Bayar {formatMYR(a.pending_payout)}</button>
                  )}
                </div>
              </div>

              {editComm === a.id && (
                <div style={{ marginTop: 16, padding: "16px", background: "linear-gradient(135deg, #fce4ec, #ffebee)", borderRadius: 12, display: "flex", gap: 16, flexWrap: "wrap", border: "2px solid #e91e63" }}>
                  <div>
                    <div style={{ color: "#e91e63", fontSize: 12, fontWeight: 600 }}>Jenis Komisyen</div>
                    <select value={commData.commission_type} onChange={e => setCommData(d => ({...d, commission_type: e.target.value}))} style={{ ...inputStyle, width: 140 }}>
                      <option value="percent">Peratus (%)</option>
                      <option value="fixed">Tetap (RM)</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ color: "#e91e63", fontSize: 12, fontWeight: 600 }}>Nilai</div>
                    <input type="number" value={commData.commission_value} onChange={e => setCommData(d => ({...d, commission_value: e.target.value}))} style={{ ...inputStyle, width: 100 }} />
                  </div>
                  <div>
                    <div style={{ color: "#e91e63", fontSize: 12, fontWeight: 600 }}>Diskaun Promo (%)</div>
                    <input type="number" value={commData.promo_discount_pct} onChange={e => setCommData(d => ({...d, promo_discount_pct: e.target.value}))} style={{ ...inputStyle, width: 100 }} />
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                    <button onClick={() => saveComm(a.id)} style={{ background: "linear-gradient(135deg, #4caf50, #66bb6a)", border: "none", color: "#fff", padding: "10px 20px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 15px rgba(76, 175, 80, 0.3)" }}>Simpan</button>
                    <button onClick={() => setEditComm(null)} style={{ background: "rgba(255,255,255,0.9)", border: "2px solid #fce4ec", color: "#e91e63", padding: "10px 16px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Batal</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────
function SettingsTab() {
  const [shipping, setShipping] = useState({ standard_rate: "", express_rate: "", free_shipping_threshold: "" });
  const [deadline, setDeadline] = useState("");
  const [msg, setMsg] = useState("");
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  useEffect(() => {
    settingsApi.getShipping().then(r => setShipping(r.data.shipping)).catch(() => {});
    settingsApi.getSite().then(r => setDeadline(r.data.settings.order_deadline || "")).catch(() => {});
  }, []);

  const saveShipping = async () => {
    try { await settingsApi.updateShipping(shipping); flash("✅ Kadar penghantaran dikemas kini!"); }
    catch (err) { flash("❌ " + err.message); }
  };

  const saveDeadline = async () => {
    try { await settingsApi.updateSite("order_deadline", deadline); flash("✅ Tarikh akhir dikemas kini!"); }
    catch (err) { flash("❌ " + err.message); }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {msg && <div style={{ gridColumn: "1/-1", background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 6, padding: "8px 12px", color: "#86efac", fontSize: 13 }}>{msg}</div>}

      <div style={{ background: "rgba(255,255,255,0.95)", border: "2px solid #fce4ec", borderRadius: 16, padding: "1.8rem", boxShadow: "0 4px 15px rgba(233, 30, 99, 0.1)" }}>
        <h4 style={{ fontFamily: "'Playfair Display',serif", color: "#e91e63", margin: "0 0 1rem", fontSize: 18, fontWeight: 600 }}>🚚 Kadar Penghantaran</h4>
        {[["standard_rate","Standard (RM)"], ["express_rate","Express (RM)"], ["free_shipping_threshold","Percuma jika ≥ (RM)"]].map(([k, l]) => (
          <div key={k} style={{ marginBottom: 12 }}>
            <label style={{ color: "#e91e63", fontSize: 13, display: "block", marginBottom: 4, fontWeight: 500 }}>{l}</label>
            <input type="number" value={shipping[k] || ""} onChange={e => setShipping(s => ({...s, [k]: e.target.value}))} style={inputStyle} />
          </div>
        ))}
        <button onClick={saveShipping} style={{ background: "linear-gradient(135deg, #e91e63, #ffb74d)", border: "none", color: "#fff", padding: "10px 24px", borderRadius: 25, cursor: "pointer", fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 600, boxShadow: "0 4px 15px rgba(233, 30, 99, 0.3)" }}>Simpan</button>
      </div>

      <div style={{ background: "rgba(255,255,255,0.95)", border: "2px solid #fce4ec", borderRadius: 16, padding: "1.8rem", boxShadow: "0 4px 15px rgba(233, 30, 99, 0.1)" }}>
        <h4 style={{ fontFamily: "'Playfair Display',serif", color: "#e91e63", margin: "0 0 1rem", fontSize: 18, fontWeight: 600 }}>⏳ Tarikh Akhir Pesanan</h4>
        <label style={{ color: "#e91e63", fontSize: 13, display: "block", marginBottom: 4, fontWeight: 500 }}>ISO Datetime (e.g. 2025-03-28T23:59:59+08:00)</label>
        <input value={deadline} onChange={e => setDeadline(e.target.value)} style={inputStyle} />
        <button onClick={saveDeadline} style={{ marginTop: 12, background: "linear-gradient(135deg, #e91e63, #ffb74d)", border: "none", color: "#fff", padding: "10px 24px", borderRadius: 25, cursor: "pointer", fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 600, boxShadow: "0 4px 15px rgba(233, 30, 99, 0.3)" }}>Simpan</button>
      </div>
    </div>
  );
}