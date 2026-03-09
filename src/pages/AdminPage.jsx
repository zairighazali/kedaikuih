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
  width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid rgba(139,69,19,.4)",
  color: "#fde68a", padding: "8px 10px", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box",
};

export default function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("dashboard");

  if (loading) return <div style={{ textAlign: "center", padding: "4rem", color: "#7a5a3a" }}>Memuatkan...</div>;
  if (!isAdmin) return <div style={{ textAlign: "center", padding: "4rem", color: "#ef4444" }}>⛔ Akses ditolak. Admin sahaja.</div>;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div style={{ marginBottom: "0.5rem", color: "#7a5a3a", fontSize: 12 }}>Panel Admin</div>
      <h2 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a", margin: "0 0 1.5rem" }}>Pengurusan Sistem</h2>

      {/* Tab nav */}
      <div style={{ display: "flex", gap: 8, marginBottom: "2rem", flexWrap: "wrap" }}>
        {[["dashboard","📊 Dashboard"], ["products","🧁 Produk"], ["orders","📦 Pesanan"], ["affiliates","🤝 Affiliate"], ["settings","⚙️ Tetapan"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ background: tab === k ? "linear-gradient(135deg,#8B4513,#cd853f)" : "rgba(255,255,255,.04)", border: "1px solid rgba(139,69,19,.4)", color: tab === k ? "#fff" : "#cd853f", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>{l}</button>
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
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
      {[
        ["💰", "Jumlah Hasil", formatMYR(stats.revenue), "#22c55e"],
        ["📦", "Jumlah Pesanan", stats.totalOrders, "#3b82f6"],
        ["⚠️", "Belum Bayar", stats.pendingOrders, "#f59e0b"],
        ["🤝", "Komisyen Tertunggak", formatMYR(stats.commissionDue), "#f97316"],
        ["👥", "Affiliate Aktif", stats.affiliateCount, "#8b5cf6"],
      ].map(([ic, lab, val, col]) => (
        <div key={lab} style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(139,69,19,.3)", borderRadius: 12, padding: "1.5rem" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>{ic}</div>
          <div style={{ color: "#7a5a3a", fontSize: 12 }}>{lab}</div>
          <div style={{ color: col, fontSize: 24, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{val}</div>
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
          border: "2px dashed rgba(139,69,19,.5)", background: "rgba(255,255,255,.03)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
      >
        {preview
          ? <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <>
              <div style={{ fontSize: 30 }}>📷</div>
              <div style={{ color: "#cd853f", fontSize: 12, marginTop: 4 }}>Klik atau seret gambar</div>
              <div style={{ color: "#7a5a3a", fontSize: 10 }}>JPG · PNG · WebP · maks 5 MB</div>
            </>
        }
        {progress !== null && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.72)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <div style={{ color: "#fde68a", fontSize: 13, fontWeight: 700 }}>Menghantar... {progress}%</div>
            <div style={{ width: "72%", height: 6, background: "rgba(255,255,255,.1)", borderRadius: 3 }}>
              <div style={{ width: `${progress}%`, height: "100%", borderRadius: 3,
                background: "linear-gradient(90deg,#8B4513,#cd853f)", transition: "width .25s" }} />
            </div>
          </div>
        )}
      </div>

      {/* Change / Remove buttons */}
      {preview && progress === null && (
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <button type="button" onClick={() => fileRef.current.click()}
            style={{ flex: 1, background: "rgba(59,130,246,.15)", border: "1px solid rgba(59,130,246,.4)",
              color: "#93c5fd", padding: "5px 8px", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>
            🔄 Tukar
          </button>
          <button type="button" onClick={() => { setPreview(null); onUploaded("", ""); }}
            style={{ background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.4)",
              color: "#fca5a5", padding: "5px 8px", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>
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
        <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a", margin: 0 }}>Urus Produk</h3>
        <button onClick={() => setShowAdd(!showAdd)}
          style={{ background: "#8B4513", border: "none", color: "#fff", padding: "8px 18px", borderRadius: 8, cursor: "pointer" }}>
          + Tambah Produk
        </button>
      </div>
      {msg && <div style={{ background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 6, padding: "8px 12px", color: "#86efac", fontSize: 13, marginBottom: 12 }}>{msg}</div>}

      {/* ── ADD FORM ── */}
      {showAdd && (
        <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(139,69,19,.4)", borderRadius: 12, padding: "1.5rem", marginBottom: 16 }}>
          <h4 style={{ color: "#fde68a", fontFamily: "'Playfair Display',serif", margin: "0 0 1.2rem" }}>Produk Baru</h4>
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 16, marginBottom: 12 }}>
            {/* image */}
            <div>
              <div style={{ color: "#cd853f", fontSize: 11, marginBottom: 6 }}>Gambar Produk</div>
              <ImageUploader currentUrl={newP.image_url}
                onUploaded={(url, path) => setNewP(p => ({ ...p, image_url: url, image_storagePath: path }))} />
            </div>
            {/* text fields */}
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {fields.map(([k, l]) => (
                  <div key={k}>
                    <label style={{ color: "#cd853f", fontSize: 11, display: "block", marginBottom: 3 }}>{l}</label>
                    <input value={newP[k]} onChange={(e) => setNewP(p => ({...p, [k]: e.target.value}))} style={inputStyle} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10 }}>
                <label style={{ color: "#cd853f", fontSize: 11, display: "block", marginBottom: 3 }}>Penerangan</label>
                <textarea value={newP.description} onChange={(e) => setNewP(p => ({...p, description: e.target.value}))}
                  rows={2} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleAdd} style={{ background: "#22c55e", border: "none", color: "#fff", padding: "8px 22px", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>✓ Simpan Produk</button>
            <button onClick={() => setShowAdd(false)} style={{ background: "transparent", border: "1px solid #8B4513", color: "#cd853f", padding: "8px 16px", borderRadius: 6, cursor: "pointer" }}>Batal</button>
          </div>
        </div>
      )}

      {/* ── PRODUCT LIST ── */}
      {loading ? <div style={{ color: "#7a5a3a" }}>Memuatkan...</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {products.map((p) => editId === p.id ? (

            // ── EDIT ROW ──
            <div key={p.id} style={{ background: "rgba(255,255,255,.03)", border: "1px solid #cd853f", borderRadius: 10, padding: "1.2rem 1.4rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 16, marginBottom: 12 }}>
                <div>
                  <div style={{ color: "#7a5a3a", fontSize: 11, marginBottom: 6 }}>Gambar Produk</div>
                  <ImageUploader currentUrl={editData.image_url || ""}
                    onUploaded={(url, path) => setEditData(d => ({ ...d, image_url: url, image_storagePath: path }))} />
                </div>
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 8 }}>
                    {fields.map(([k, l]) => (
                      <div key={k}>
                        <div style={{ color: "#7a5a3a", fontSize: 11 }}>{l}</div>
                        <input value={editData[k] || ""} onChange={(e) => setEditData(d => ({...d, [k]: e.target.value}))} style={inputStyle} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ color: "#7a5a3a", fontSize: 11 }}>Penerangan</div>
                    <textarea value={editData.description || ""} onChange={(e) => setEditData(d => ({...d, description: e.target.value}))}
                      rows={2} style={{ ...inputStyle, resize: "vertical" }} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleSave(p.id)} style={{ background: "#22c55e", border: "none", color: "#fff", padding: "7px 18px", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>✓ Simpan</button>
                <button onClick={() => setEditId(null)} style={{ background: "transparent", border: "1px solid #8B4513", color: "#cd853f", padding: "7px 14px", borderRadius: 6, cursor: "pointer" }}>✕ Batal</button>
              </div>
            </div>

          ) : (

            // ── VIEW ROW ──
            <div key={p.id} style={{ background: "rgba(255,255,255,.03)", border: `1px solid ${p.is_active ? "rgba(139,69,19,.3)" : "rgba(100,100,100,.2)"}`,
              borderRadius: 10, padding: "1rem 1.2rem", display: "flex", alignItems: "center", gap: 14, opacity: p.is_active ? 1 : 0.5 }}>

              {/* thumbnail — real photo or fallback emoji */}
              <div style={{ width: 60, height: 60, borderRadius: 8, overflow: "hidden", flexShrink: 0,
                background: "rgba(139,69,19,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 30 }}>{p.image_emoji || "🍪"}</span>
                }
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ color: "#fde68a", fontFamily: "'Playfair Display',serif", fontWeight: 600 }}>{p.name}</div>
                <div style={{ color: "#7a5a3a", fontSize: 12 }}>{p.category} · {formatMYR(p.price)}</div>
              </div>
              <div style={{ textAlign: "center", minWidth: 70 }}>
                <div style={{ color: p.stock < 10 ? "#ef4444" : "#22c55e", fontWeight: 700, fontSize: 18 }}>{p.stock}</div>
                <div style={{ color: "#7a5a3a", fontSize: 11 }}>balang</div>
              </div>
              {!p.is_active && <span style={{ color: "#7a5a3a", fontSize: 11, background: "rgba(100,100,100,.2)", padding: "2px 8px", borderRadius: 10 }}>TIDAK AKTIF</span>}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setEditId(p.id); setEditData({ ...p }); }}
                  style={{ background: "rgba(59,130,246,.2)", border: "1px solid rgba(59,130,246,.4)", color: "#93c5fd", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>✏️ Edit</button>
                <button onClick={() => handleDelete(p.id)}
                  style={{ background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.4)", color: "#fca5a5", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>🗑️ Padam</button>
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
        <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a", margin: 0 }}>Semua Pesanan</h3>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ background: "rgba(0,0,0,.3)", border: "1px solid rgba(139,69,19,.4)", color: "#cd853f", padding: "6px 12px", borderRadius: 6, fontSize: 13 }}>
          <option value="">Semua Status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? <div style={{ color: "#7a5a3a" }}>Memuatkan...</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {orders.map((o) => (
            <div key={o.id} style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(139,69,19,.3)", borderRadius: 10, padding: "1rem 1.2rem", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{ minWidth: 120 }}>
                <div style={{ color: "#fde68a", fontFamily: "monospace", fontWeight: 700, fontSize: 13 }}>{o.order_number}</div>
                <div style={{ color: "#7a5a3a", fontSize: 11 }}>{new Date(o.created_at).toLocaleDateString("ms-MY")}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#a0785a", fontSize: 14 }}>{o.customer_name || o.ship_name}</div>
                <div style={{ color: "#7a5a3a", fontSize: 12 }}>{o.customer_email} · {o.item_count} item</div>
              </div>
              <div style={{ color: "#F4A460", fontWeight: 700 }}>{formatMYR(o.total)}</div>
              <span style={{ background: `${STATUS_COLORS[o.status]}22`, color: STATUS_COLORS[o.status], padding: "3px 10px", borderRadius: 20, fontSize: 12, border: `1px solid ${STATUS_COLORS[o.status]}55`, whiteSpace: "nowrap" }}>
                {STATUS_LABELS[o.status] || o.status}
              </span>
              <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}
                style={{ background: "rgba(0,0,0,.3)", border: "1px solid rgba(139,69,19,.4)", color: "#cd853f", padding: "5px 8px", borderRadius: 6, fontSize: 12 }}>
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
      <h3 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a", margin: "0 0 1rem" }}>Urus Affiliate</h3>
      {msg && <div style={{ background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 6, padding: "8px 12px", color: "#86efac", fontSize: 13, marginBottom: 12 }}>{msg}</div>}
      {loading ? <div style={{ color: "#7a5a3a" }}>Memuatkan...</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {affiliates.map((a) => (
            <div key={a.id} style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(139,69,19,.3)", borderRadius: 12, padding: "1.2rem 1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ color: "#fde68a", fontFamily: "'Playfair Display',serif", fontWeight: 600 }}>{a.full_name}</div>
                  <div style={{ color: "#7a5a3a", fontSize: 12 }}>
                    {a.email} · Kod: <span style={{ color: "#F4A460" }}>{a.affiliate_code}</span> · Promo: <span style={{ color: "#F4A460" }}>{a.promo_code}</span>
                  </div>
                  <span style={{ background: a.status === "active" ? "rgba(34,197,94,.15)" : "rgba(245,158,11,.15)", color: a.status === "active" ? "#86efac" : "#fcd34d", fontSize: 10, padding: "2px 8px", borderRadius: 10, marginTop: 4, display: "inline-block" }}>
                    {a.status === "active" ? "Aktif" : a.status === "pending" ? "Menunggu" : a.status}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
                  {[["Klik", a.total_clicks], ["Pesanan", a.total_orders], ["Earned", formatMYR(a.total_earned)], ["Tertunggak", formatMYR(a.pending_payout || 0)]].map(([l, v]) => (
                    <div key={l} style={{ textAlign: "center" }}>
                      <div style={{ color: "#cd853f", fontWeight: 700 }}>{v}</div>
                      <div style={{ color: "#7a5a3a", fontSize: 11 }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {a.status === "pending" && (
                    <button onClick={() => approve(a.id)} style={{ background: "rgba(34,197,94,.2)", border: "1px solid rgba(34,197,94,.4)", color: "#86efac", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>✅ Luluskan</button>
                  )}
                  <button onClick={() => { setEditComm(a.id); setCommData({ commission_type: a.commission_type, commission_value: a.commission_value, promo_discount_pct: a.promo_discount_pct }); }} style={{ background: "rgba(59,130,246,.2)", border: "1px solid rgba(59,130,246,.4)", color: "#93c5fd", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>✏️ Kadar</button>
                  {Number(a.pending_payout) > 0 && (
                    <button onClick={() => payout(a.id)} style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", border: "none", color: "#fff", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>💸 Bayar {formatMYR(a.pending_payout)}</button>
                  )}
                </div>
              </div>

              {editComm === a.id && (
                <div style={{ marginTop: 12, padding: "10px", background: "rgba(0,0,0,.2)", borderRadius: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ color: "#7a5a3a", fontSize: 11 }}>Jenis Komisyen</div>
                    <select value={commData.commission_type} onChange={e => setCommData(d => ({...d, commission_type: e.target.value}))} style={{ ...inputStyle, width: 120 }}>
                      <option value="percent">Peratus (%)</option>
                      <option value="fixed">Tetap (RM)</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ color: "#7a5a3a", fontSize: 11 }}>Nilai</div>
                    <input type="number" value={commData.commission_value} onChange={e => setCommData(d => ({...d, commission_value: e.target.value}))} style={{ ...inputStyle, width: 80 }} />
                  </div>
                  <div>
                    <div style={{ color: "#7a5a3a", fontSize: 11 }}>Diskaun Promo (%)</div>
                    <input type="number" value={commData.promo_discount_pct} onChange={e => setCommData(d => ({...d, promo_discount_pct: e.target.value}))} style={{ ...inputStyle, width: 80 }} />
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                    <button onClick={() => saveComm(a.id)} style={{ background: "#22c55e", border: "none", color: "#fff", padding: "7px 16px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Simpan</button>
                    <button onClick={() => setEditComm(null)} style={{ background: "transparent", border: "1px solid #8B4513", color: "#cd853f", padding: "7px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Batal</button>
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

      <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(139,69,19,.3)", borderRadius: 12, padding: "1.5rem" }}>
        <h4 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a", margin: "0 0 1rem" }}>🚚 Kadar Penghantaran</h4>
        {[["standard_rate","Standard (RM)"], ["express_rate","Express (RM)"], ["free_shipping_threshold","Percuma jika ≥ (RM)"]].map(([k, l]) => (
          <div key={k} style={{ marginBottom: 10 }}>
            <label style={{ color: "#cd853f", fontSize: 12, display: "block", marginBottom: 3 }}>{l}</label>
            <input type="number" value={shipping[k] || ""} onChange={e => setShipping(s => ({...s, [k]: e.target.value}))} style={inputStyle} />
          </div>
        ))}
        <button onClick={saveShipping} style={{ background: "#8B4513", border: "none", color: "#fff", padding: "8px 20px", borderRadius: 6, cursor: "pointer", fontFamily: "'Playfair Display',serif" }}>Simpan</button>
      </div>

      <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(139,69,19,.3)", borderRadius: 12, padding: "1.5rem" }}>
        <h4 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a", margin: "0 0 1rem" }}>⏳ Tarikh Akhir Pesanan</h4>
        <label style={{ color: "#cd853f", fontSize: 12, display: "block", marginBottom: 3 }}>ISO Datetime (e.g. 2025-03-28T23:59:59+08:00)</label>
        <input value={deadline} onChange={e => setDeadline(e.target.value)} style={inputStyle} />
        <button onClick={saveDeadline} style={{ marginTop: 10, background: "#8B4513", border: "none", color: "#fff", padding: "8px 20px", borderRadius: 6, cursor: "pointer", fontFamily: "'Playfair Display',serif" }}>Simpan</button>
      </div>
    </div>
  );
}