// frontend/src/context/AuthContext.jsx
// Global authentication state using Firebase + our backend user record

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, logout as firebaseLogout } from "../lib/firebase";
import { authApi, affiliatesApi } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);        // our Neon user record
  const [affiliate, setAffiliate] = useState(null);  // affiliate data if applicable
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          // Sync with our backend + get role
          const res = await authApi.sync({ full_name: fbUser.displayName });
          setDbUser(res.data.user);

          // If affiliate, load their data
          if (res.data.user.role === "affiliate") {
            try {
              const affRes = await affiliatesApi.me();
              setAffiliate(affRes.data.affiliate);
            } catch { /* not yet approved */ }
          }
        } catch (err) {
          console.error("[Auth sync error]", err.message);
        }
      } else {
        setDbUser(null);
        setAffiliate(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = async () => {
    await firebaseLogout();
    setDbUser(null);
    setAffiliate(null);
  };

  const isAdmin     = dbUser?.role === "admin";
  const isAffiliate = dbUser?.role === "affiliate";
  const isCustomer  = !!dbUser;

  return (
    <AuthContext.Provider value={{
      firebaseUser, dbUser, affiliate,
      isAdmin, isAffiliate, isCustomer,
      loading, logout,
      refreshAffiliate: async () => {
        try {
          const res = await affiliatesApi.me();
          setAffiliate(res.data.affiliate);
        } catch {}
      },
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}