// frontend/src/hooks/useProducts.js
import { useState, useEffect } from "react";
import { productsApi } from "../lib/api";

export function useProducts(filters = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productsApi.list(filters);
      setProducts(res.data.products);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [JSON.stringify(filters)]);

  return { products, loading, error, refetch: fetchProducts };
}

export function useCategories() {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    productsApi.categories().then((r) => setCategories(r.data.categories)).catch(() => {});
  }, []);
  return categories;
}

// frontend/src/hooks/useOrders.js
import { ordersApi } from "../lib/api";

export function useMyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.myOrders()
      .then((r) => setOrders(r.data.orders))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { orders, loading };
}

// frontend/src/hooks/useSiteSettings.js
import { settingsApi } from "../lib/api";

export function useSiteSettings() {
  const [settings, setSettings] = useState({});
  const [shipping, setShipping] = useState(null);

  useEffect(() => {
    settingsApi.getSite().then((r) => setSettings(r.data.settings)).catch(() => {});
    settingsApi.getShipping().then((r) => setShipping(r.data.shipping)).catch(() => {});
  }, []);

  return { settings, shipping };
}