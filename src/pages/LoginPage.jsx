// frontend/src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginWithEmail, registerWithEmail, resetPassword } from "../lib/firebase";

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ color: "#e91e63", fontSize: 13, display: "block", marginBottom: 6, fontWeight: 600 }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", background: "rgba(255,255,255,0.9)", border: "2px solid #fce4ec", color: "#2c1810", padding: "12px 16px", borderRadius: 12, fontSize: 15, outline: "none", boxSizing: "border-box", transition: "all 0.3s ease" }} />
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
    <div style={{ maxWidth: 450, margin: "4rem auto", padding: "0 1.5rem" }}>
      <div style={{ background: "rgba(255,255,255,0.95)", border: "2px solid #fce4ec", borderRadius: 24, padding: "3rem", boxShadow: "0 12px 40px rgba(233, 30, 99, 0.15)" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: 48 }}>🧁</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", color: "#e91e63", margin: "12px 0 0", fontSize: 24, fontWeight: 700 }}>Biskut Raya</h2>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "2px solid #fce4ec", marginBottom: "2rem" }}>
          {[["login","Log Masuk"], ["register","Daftar"], ["reset","Lupa Kata Laluan"]].map(([t, l]) => (
            <button key={t} onClick={() => { setTab(t); setError(""); setInfo(""); }} style={{ flex: 1, background: "none", border: "none", color: tab === t ? "#e91e63" : "#8d6e63", padding: "12px 8px", cursor: "pointer", fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: tab === t ? 600 : 400, borderBottom: tab === t ? "3px solid #e91e63" : "3px solid transparent", transition: "all 0.3s ease" }}>{l}</button>
          ))}
        </div>

        {error && <div style={{ background: "rgba(233, 30, 99, 0.1)", border: "2px solid #e91e63", borderRadius: 12, padding: "10px 16px", color: "#e91e63", fontSize: 14, marginBottom: 16, fontWeight: 600 }}>{error}</div>}
        {info && <div style={{ background: "rgba(129, 199, 132, 0.1)", border: "2px solid #81c784", borderRadius: 12, padding: "10px 16px", color: "#81c784", fontSize: 14, marginBottom: 16, fontWeight: 600 }}>{info}</div>}

        {tab === "register" && <Field label="Nama Penuh" value={name} onChange={setName} />}
        <Field label="Alamat E-mel" value={email} onChange={setEmail} type="email" />
        {tab !== "reset" && <Field label="Kata Laluan" value={password} onChange={setPassword} type="password" />}

        <button
          onClick={tab === "login" ? handleLogin : tab === "register" ? handleRegister : handleReset}
          disabled={loading}
          style={{ width: "100%", background: loading ? "rgba(100,100,100,0.5)" : "linear-gradient(135deg, #e91e63, #ffb74d)", border: "none", color: "#fff", padding: "14px", borderRadius: 25, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 600, marginTop: 8, boxShadow: loading ? "none" : "0 4px 15px rgba(233, 30, 99, 0.3)", transition: "all 0.3s ease" }}
        >
          {loading ? "⏳ Memproses..." : tab === "login" ? "Log Masuk →" : tab === "register" ? "Daftar Akaun →" : "Hantar E-mel Reset"}
        </button>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link to="/affiliate/register" style={{ color: "#e91e63", fontSize: 14, textDecoration: "none", fontWeight: 600 }}>
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