// frontend/src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginWithEmail, registerWithEmail, resetPassword } from "../lib/firebase";

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ color: "#cd853f", fontSize: 12, display: "block", marginBottom: 4 }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid rgba(139,69,19,.4)", color: "#fde68a", padding: "9px 12px", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}

export default function LoginPage() {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError(""); setLoading(true);
    try {
      await loginWithEmail(email, password);
      navigate("/");
    } catch (err) {
      setError(friendlyError(err.code));
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    setError(""); setLoading(true);
    try {
      await registerWithEmail(email, password, name);
      navigate("/");
    } catch (err) {
      setError(friendlyError(err.code));
    } finally { setLoading(false); }
  };

  const handleReset = async () => {
    setError(""); setLoading(true);
    try {
      await resetPassword(email);
      setInfo("E-mel tetapan semula dihantar! Semak peti masuk anda.");
    } catch (err) {
      setError(friendlyError(err.code));
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 420, margin: "4rem auto", padding: "0 1.5rem" }}>
      <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(139,69,19,.4)", borderRadius: 16, padding: "2.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 40 }}>🌙</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", color: "#fde68a", margin: "8px 0 0" }}>Biskut Raya</h2>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(139,69,19,.3)", marginBottom: "1.5rem" }}>
          {[["login","Log Masuk"], ["register","Daftar"], ["reset","Lupa Kata Laluan"]].map(([t, l]) => (
            <button key={t} onClick={() => { setTab(t); setError(""); setInfo(""); }} style={{ flex: 1, background: "none", border: "none", color: tab === t ? "#F4A460" : "#7a5a3a", padding: "8px 4px", cursor: "pointer", fontFamily: "'Playfair Display',serif", fontSize: 12, borderBottom: tab === t ? "2px solid #F4A460" : "2px solid transparent" }}>{l}</button>
          ))}
        </div>

        {error && <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 6, padding: "8px 12px", color: "#fca5a5", fontSize: 13, marginBottom: 14 }}>{error}</div>}
        {info && <div style={{ background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)", borderRadius: 6, padding: "8px 12px", color: "#86efac", fontSize: 13, marginBottom: 14 }}>{info}</div>}

        {tab === "register" && <Field label="Nama Penuh" value={name} onChange={setName} />}
        <Field label="Alamat E-mel" value={email} onChange={setEmail} type="email" />
        {tab !== "reset" && <Field label="Kata Laluan" value={password} onChange={setPassword} type="password" />}

        <button
          onClick={tab === "login" ? handleLogin : tab === "register" ? handleRegister : handleReset}
          disabled={loading}
          style={{ width: "100%", background: loading ? "#555" : "linear-gradient(135deg,#8B4513,#cd853f)", border: "none", color: "#fff", padding: "12px", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Playfair Display',serif", fontSize: 16, marginTop: 4 }}
        >
          {loading ? "⏳ Memproses..." : tab === "login" ? "Log Masuk →" : tab === "register" ? "Daftar Akaun →" : "Hantar E-mel Reset"}
        </button>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link to="/affiliate/register" style={{ color: "#cd853f", fontSize: 12, textDecoration: "none" }}>
            🤝 Daftar sebagai Affiliate →
          </Link>
        </div>
      </div>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    "auth/wrong-password": "Kata laluan tidak betul.",
    "auth/user-not-found": "Akaun tidak dijumpai.",
    "auth/email-already-in-use": "E-mel ini sudah didaftarkan.",
    "auth/weak-password": "Kata laluan terlalu lemah (min 6 aksara).",
    "auth/invalid-email": "Alamat e-mel tidak sah.",
    "auth/too-many-requests": "Terlalu banyak percubaan. Cuba lagi sebentar.",
  };
  return map[code] || "Ralat berlaku. Sila cuba lagi.";
}