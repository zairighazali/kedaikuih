// frontend/src/context/CartContext.jsx
// Shopping cart state — persisted in localStorage

import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("biskutraya_cart") || "[]"); }
    catch { return []; }
  });

  const [appliedPromo, setAppliedPromo] = useState(null);
  // { promo_code, discount_pct, affiliate_name }

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem("biskutraya_cart", JSON.stringify(items));
  }, [items]);

  const addItem = (product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { ...product, qty }];
    });
  };

  const removeItem = (productId) => setItems((prev) => prev.filter((i) => i.id !== productId));

  const updateQty = (productId, qty) => {
    if (qty < 1) { removeItem(productId); return; }
    setItems((prev) => prev.map((i) => i.id === productId ? { ...i, qty } : i));
  };

  const clearCart = () => { setItems([]); setAppliedPromo(null); };

  const itemCount = items.reduce((s, i) => s + i.qty, 0);

  const subtotal = items.reduce((s, i) => {
    let price = Number(i.price);
    if (i.qty >= (i.min_bulk_qty || 20)) {
      price = price * (1 - Number(i.bulk_discount_pct || 10) / 100);
    }
    if (appliedPromo) price = price * (1 - Number(appliedPromo.discount_pct) / 100);
    return s + price * i.qty;
  }, 0);

  return (
    <CartContext.Provider value={{
      items, itemCount, subtotal,
      appliedPromo, setAppliedPromo,
      addItem, removeItem, updateQty, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be within CartProvider");
  return ctx;
}